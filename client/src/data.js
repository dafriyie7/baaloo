export default {
    "success": true,
    "data": {
        "name": "Daniel",
        "phone": 559154796,
        "code": {
            "_id": "68ef87c2e732b0f865c00e20",
            "code": "5F6A060A",
            "batchNumber": {
                "_id": "68ef87c2e732b0f865c00e1d",
                "batchNumber": "A1",
                "costPerCode": 1,
                "totalCodes": 10,
                "giveawayPercentage": 100,
                "totalRevenue": 10,
                "totalPrizeBudget": 0,
                "winningPrize": 1,
                "createdAt": "2025-10-15T11:38:42.310Z",
                "updatedAt": "2025-10-15T11:38:42.310Z",
                "__v": 0
            },
            "isWinner": true,
            "isUsed": true,
            "redeemedBy": "68ef88c1e732b0f865c00e49",
            "redeemedAt": "2025-10-15T11:42:57.492Z",
            "payoutStatus": "pending",
            "__v": 0,
            "createdAt": "2025-10-15T11:38:42.529Z",
            "updatedAt": "2025-10-15T11:42:57.493Z"
        },
        "_id": "68ef88c1e732b0f865c00e49",
        "__v": 0
    }
}

export const packageJson = {
	bcryptjs: "^3.0.2",
	"cookie-parser": "^1.4.7",
	cors: "^2.8.5",
	dotenv: "^17.2.1",
	express: "^5.1.0",
	jsonwebtoken: "^9.0.2",
	mongoose: "^8.17.0",
	nodemailer: "^7.0.5",
};