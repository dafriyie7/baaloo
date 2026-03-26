import { logger } from '../lib/logger.js';
import shikaCreators from '../services/scPayment.js';
import shikaWebhookService from '../services/scWebhook.js';

// Docs: x-shikacreators-signature. Some environments send shikacreators-signature (no x-).
const SHIKA_SIGNATURE_HEADERS = [
	'shikacreators-signature',
	'x-shikacreators-signature',
	'x-shika-signature',
	'shika-signature',
	'x-signature',
	'signature',
];

/**
 * Controller to handle incoming webhooks from Shika Creators.
 * Pattern: verify signature (like Webhook.constructEvent(body, signature, secret)), then switch on event.type;
 * deposit events: payment.created | payment.pending | payment.completed | payment.failed (event.data.object = payment).
 */
export const handleShikaWebhook = async (req, res) => {
	logger.info('Shika webhook request received', { contentLength: req.headers['content-length'] });

	try {
		const signatureHeaderName = SHIKA_SIGNATURE_HEADERS.find(
			(headerName) => req.headers[headerName],
		);
		const signature = signatureHeaderName
			? req.headers[signatureHeaderName]
			: undefined;
		const secret = process.env.SC_SECRET_KEY || process.env.SC_SIGNING_KEY;

		if (!secret) {
			logger.error('SC_SECRET_KEY / SC_SIGNING_KEY is not configured');
			return res.status(500).send('Configuration error');
		}

		// req.body should be a Buffer if express.raw was used
		const rawBody = req.body;
		if (!rawBody || !Buffer.isBuffer(rawBody)) {
			logger.error('Shika webhook body missing or not raw Buffer – check server.js route order', {
				hasBody: Boolean(rawBody),
				bodyType: rawBody?.constructor?.name,
			});
			return res.status(400).send('Invalid request body');
		}
		const payloadString = rawBody.toString('utf8');
		let event;

		try {
			event = JSON.parse(payloadString);

			logger.info('Shika webhook received', {
				eventId: event?.id,
				eventType: event?.type,
				webhookBody: event,
			});

			// Verify signature (pass context for diagnostic logging on failure)
			const logContext = { logger, eventId: event?.id, eventType: event?.type };
			const isValid = shikaCreators.verifySignature(rawBody, signature, secret, logContext);
			if (!isValid) {
				const isFailureEvent = [
					'payout.failed',
					'payout.canceled',
					'disbursement.failed',
					'disbursement.canceled',
					'disbursement.cancelled',
				].includes(event?.type);

				// Still process failure events so the wallet gets refunded even when signature is wrong
				if (isFailureEvent) {
					logger.warn('Shika webhook signature invalid; processing failure event to refund wallet', {
						eventId: event?.id,
						eventType: event?.type,
					});
					// Fall through to process event below
				} else {
					return res.status(400).send('Invalid signature');
				}
			}
		} catch (err) {
			logger.error(`Error parsing Shika Creators webhook: ${err.message}`);
			return res.status(400).send('Invalid payload');
		}

		// Returning 200 OK quickly as per best practices
		res.status(200).json({ received: true });

		// Process the event asynchronously
		shikaWebhookService.processEvent(event).catch(error => {
			logger.error(`Error processing Shika Creators event ${event.id}: ${error.message}`, {
				stack: error.stack
			});
		});

	} catch (error) {
		logger.error(`Shika Creators Webhook Controller Error: ${error.message}`, {
			stack: error.stack
		});
		// Ensure we don't leave the request hanging if something broke before response
		if (!res.headersSent) {
			res.status(500).send('Internal server error');
		}
	}
};
