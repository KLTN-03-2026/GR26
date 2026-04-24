const axios = require('axios');
const http = axios.create({ baseURL: 'http://localhost:8080/api/v1' });

async function debug() {
    try {
        const freeEmail = `free_tenant_${Date.now()}@test.com`;
        let res = await http.post('/auth/register', {
            tenantName: "Quán Free Mode",
            email: freeEmail,
            password: "Password123!",
            ownerName: "Free Owner",
            planSlug: "free"
        });

        res = await http.post('/auth/login', { email: freeEmail, password: "Password123!" });
        const token = res.data.data.accessToken || res.data.data.token;
        const config = { headers: { 'Authorization': `Bearer ${token}` } };

        res = await http.post('/positions', { name: "Pos", description: "Pos" }, config);
        const posId = res.data.data;

        for (let i = 1; i <= 4; i++) {
            try {
                res = await http.post('/staff', {
                    positionId: posId,
                    fullName: `Staff Free ${i}`,
                    email: `stafffree${i}_${Date.now()}@test.com`,
                    phone: `090000000${i}`,
                    employeeCode: `F-${i}`,
                    hireDate: "2026-05-01"
                }, config);
                console.log(`Staff ${i} Success`);
            } catch (err) {
                console.log(`Staff ${i} Error:`, err.response?.data?.error?.code || err.message);
            }
        }
    } catch (e) {
        if (e.response) {
            console.log("Error:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.log("Error:", e.message);
        }
    }
}
debug();
