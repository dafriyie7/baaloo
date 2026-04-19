import axios from "axios";

async function simulate() {
    const API_BASE = "http://localhost:4000/api";
    const testPhone = "0559154796";
    const testCode = "ACE777";

    try {
        console.log("\n--- STEP 1: REDEEMING TICKET ---");
        const redeemRes = await axios.post(`${API_BASE}/scratch-codes/redeem`, {
            name: "Test Winner",
            phone: testPhone,
            scratchCode: testCode
        });
        console.log("Redeem Status:", redeemRes.status);
        console.log("Redeem Response:", JSON.stringify(redeemRes.data, null, 2));

        if (redeemRes.data.prize) {
            console.log("\n--- STEP 2: CLAIMING WIN ---");
            const claimRes = await axios.post(`${API_BASE}/players/claim-win`, {
                phone: testPhone,
                ticket: testCode
            });
            console.log("Claim Status:", claimRes.status);
            console.log("Claim Response:", JSON.stringify(claimRes.data, null, 2));
        }

    } catch (err) {
        console.error("\n!!! SIMULATION FAILED !!!");
        console.error("Error:", err.response?.data?.message || err.message);
    }
}

simulate();
