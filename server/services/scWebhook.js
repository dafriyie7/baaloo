import mongoose from "mongoose";
import { logger } from "../lib/logger.js";
import Transaction from "../models/Transaction.js";
import ScratchCode from "../models/ScratchCode.js";

/**
 * Shika Creators webhook handler — disbursement / payout events only.
 */
class ShikaWebhookService {
	getEventObject(type, data = {}) {
		if (data.object && typeof data.object === "object") {
			return data.object;
		}

		if (type?.startsWith("disbursement.") || type?.startsWith("payout.")) {
			return {
				id: data.disbursementId || data.payoutId || data.id,
				...data,
			};
		}

		return data;
	}

	async processEvent(event) {
		const { id: eventId, type, data } = event;
		const object = this.getEventObject(type, data);

		if (!object?.id) {
			logger.error("Shika Creators event is missing a target object id", {
				eventId,
				type,
				data,
			});
			return;
		}

		const isPayoutEvent =
			type?.startsWith("payout.") || type?.startsWith("disbursement.");
		if (!isPayoutEvent) {
			logger.info(`Ignoring non-disbursement event: ${type}`, {
				eventId,
				objectId: object.id,
			});
			return;
		}

		const existingTransaction = await Transaction.findOne({
			"gatewayResponse.processedEvents": eventId,
		});

		if (existingTransaction) {
			logger.warn(
				`Event ${eventId} already processed for transaction ${existingTransaction._id}`
			);
			return;
		}

		switch (type) {
			case "disbursement.completed":
			case "payout.completed":
				await this.handlePayoutCompleted(object, eventId);
				break;
			case "disbursement.failed":
			case "payout.failed":
				await this.handlePayoutFailed(object, eventId);
				break;
			case "disbursement.canceled":
			case "disbursement.cancelled":
			case "payout.canceled":
				await this.handlePayoutCanceled(object, eventId);
				break;
			default:
				logger.info(`Unhandled disbursement event type: ${type}`);
		}
	}

	async handlePayoutCompleted(payload, eventId) {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const transaction = await Transaction.findOne({
				gatewayTransactionId: payload.id,
				type: "payout",
			}).session(session);

			if (!transaction) {
				logger.error(
					`Transaction not found for payout.completed: ${payload.id}`
				);
				await session.abortTransaction();
				return;
			}

			if (transaction.status === "completed") {
				await session.abortTransaction();
				return;
			}

			transaction.status = "completed";
			transaction.completedAt = new Date();
			transaction.gatewayResponse = {
				...transaction.gatewayResponse,
				lastEventId: eventId,
				processedEvents: [
					...(transaction.gatewayResponse?.processedEvents || []),
					eventId,
				],
				lastPayload: payload,
			};

			await transaction.save({ session });
			await ScratchCode.updateOne(
				{ _id: transaction.scratchCode },
				{ $set: { payoutStatus: "paid" } },
				{ session }
			);

			await session.commitTransaction();
			logger.info("Payout completed", {
				transactionId: transaction._id,
				gatewayTransactionId: payload.id,
			});
		} catch (error) {
			await session.abortTransaction();
			logger.error(`Error handling payout.completed: ${error.message}`);
			throw error;
		} finally {
			session.endSession();
		}
	}

	async handlePayoutFailed(payload, eventId) {
		await this.refundPayout(
			payload.id,
			"failed",
			eventId,
			payload.failure_message || payload.failure_reason || "Payout failed"
		);
	}

	async handlePayoutCanceled(payload, eventId) {
		await this.refundPayout(
			payload.id,
			"cancelled",
			eventId,
			"Payout canceled"
		);
	}

	async refundPayout(gatewayId, status, eventId, reason) {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const transaction = await Transaction.findOne({
				gatewayTransactionId: gatewayId,
				type: "payout",
			}).session(session);

			if (!transaction || transaction.status !== "pending") {
				await session.abortTransaction();
				return;
			}

			transaction.status = status;
			transaction.note = `${transaction.note || ""} - ${reason || status}`.trim();
			transaction.gatewayResponse = {
				...transaction.gatewayResponse,
				lastEventId: eventId,
				processedEvents: [
					...(transaction.gatewayResponse?.processedEvents || []),
					eventId,
				],
			};

			await transaction.save({ session });
			await ScratchCode.updateOne(
				{ _id: transaction.scratchCode },
				{ $set: { payoutStatus: "failed" } },
				{ session }
			);

			await session.commitTransaction();
			logger.info("Payout terminal non-success", {
				gatewayId,
				status,
				transactionId: transaction._id,
			});
		} catch (error) {
			await session.abortTransaction();
			logger.error(`Error updating failed payout: ${error.message}`);
			throw error;
		} finally {
			session.endSession();
		}
	}
}

export default new ShikaWebhookService();
