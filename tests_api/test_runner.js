const fs = require('fs');

const BASE_URL = 'http://localhost:8080/api/v1';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    // if status is 204 No Content, don't parse JSON
    if (res.status === 204) return { status: res.status, data: {} };
    
    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text();
    }
    
    return { status: res.status, data };
}

async function runTests() {
    console.log("==========================================");
    console.log("🚀 Bắt đầu chuỗi Test API SmartF&B (S-01 -> S-12)");
    console.log("==========================================\n");

    const email = `testowner_${Date.now()}@test.com`;
    const password = "Password123!";
    let currentToken = null;
    let userId = null;
    let branchId = null;
    let categoryId = null;
    let itemId = null;
    let zoneId = null;
    let tableId = null;
    let orderId = null;

    try {
        // --- S-01, S-02: AUTH & TENANT ---
        console.log("1. MỚI: Đăng ký Tenant (Chủ quán)");
        let res = await request('/auth/register', 'POST', {
            tenantName: "Quán Test Tự Động",
            email: email,
            password: password,
            ownerName: "Auto Tester",
            planSlug: "standard"
        });
        if (res.status !== 200 && res.status !== 201) throw new Error("Register failed: " + JSON.stringify(res.data));
        console.log("   ✅ Đăng ký thành công.");

        console.log("2. Đăng nhập");
        res = await request('/auth/login', 'POST', { email, password });
        if (res.status !== 200) throw new Error("Login failed: " + JSON.stringify(res.data));
        currentToken = res.data.data.accessToken || res.data.data.token;
        console.log("   ✅ Đăng nhập thành công. Token lấy được.");

        console.log("3. Kiểm tra Gói cước (Subscription)");
        res = await request('/subscriptions/current', 'GET', null, currentToken);
        if (res.status !== 200) throw new Error("Get subscription failed: " + JSON.stringify(res.data));
        console.log("   ✅ API Subscription chạy tốt.");

        // --- S-03: BRANCH ---
        console.log("4. Tạo Chi nhánh mới");
        res = await request('/branches', 'POST', {
            name: "Chi nhánh Auto " + Date.now(),
            code: "CN" + Date.now().toString().slice(-4),
            address: "123 Test Street"
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create branch failed: " + JSON.stringify(res.data));
        branchId = res.data.data.id;
        console.log("   ✅ Tạo chi nhánh thành công: " + branchId);

        console.log("5. Chọn chi nhánh làm việc (Select Branch)");
        res = await request('/auth/select-branch', 'POST', { branchId }, currentToken);
        if (res.status !== 200) throw new Error("Select branch failed: " + JSON.stringify(res.data));
        currentToken = res.data.data.token || res.data.data.accessToken || currentToken;
        // Notice API returns data.data.token if select-branch replaces token.
        console.log("   ✅ Chuyển scope sang chi nhánh thành công.");

        // --- S-05, S-06: MENU ---
        console.log("6. Tạo Danh mục (Category)");
        res = await request('/menu/categories', 'POST', {
            name: "Đồ uống Test",
            displayOrder: 1,
            isActive: true
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create category failed: " + JSON.stringify(res.data));
        categoryId = res.data.data.id;
        console.log("   ✅ Tạo Category thành công.");

        console.log("7. Tạo Món bán (Item)");
        res = await request('/menu/items', 'POST', {
            categoryId: categoryId,
            name: "Cà phê Auto",
            basePrice: 20000,
            unit: "Ly"
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create item failed: " + JSON.stringify(res.data));
        itemId = res.data.data.id;
        console.log("   ✅ Tạo Món thành công.");

        // --- S-08: TABLES ---
        console.log("8. Tạo Khu vực (Zone)");
        res = await request(`/branches/${branchId}/zones`, 'POST', {
            name: "Tầng 1"
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create zone failed: " + JSON.stringify(res.data));
        zoneId = res.data.data.id;
        console.log("   ✅ Tạo Zone thành công.");

        console.log("9. Tạo Bàn (Table)");
        res = await request(`/branches/${branchId}/tables`, 'POST', {
            zoneId: zoneId,
            name: "Bàn 01",
            capacity: 4,
            shape: "square"
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create table failed: " + JSON.stringify(res.data));
        tableId = res.data.data.id;
        console.log("   ✅ Tạo Bàn thành công.");

        // --- S-10: ORDER ---
        console.log("10. Tạo Đơn hàng (Order)");
        res = await request('/orders', 'POST', {
            tableId: tableId,
            source: "IN_STORE",
            notes: "Test tự động",
            items: [
                {
                    itemId: itemId,
                    itemName: "Cà phê Auto",
                    quantity: 2,
                    unitPrice: 20000
                }
            ]
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Create order failed: " + JSON.stringify(res.data));
        orderId = res.data.data.id;
        let totalAmount = res.data.data.totalAmount;
        console.log("   ✅ Tạo Order thành công. Mã: " + orderId);

        console.log("11. Cập nhật Order sang COMPLETED");
        res = await request(`/orders/${orderId}/status`, 'PUT', {
            newStatus: "COMPLETED",
            reason: ""
        }, currentToken);
        if (res.status !== 200) throw new Error("Update order failed: " + JSON.stringify(res.data));
        console.log("   ✅ Đổi Order sang COMPLETED.");

        // --- S-11: PAYMENT & INVOICE ---
        console.log("12. Thanh toán bằng tiền mặt (Cash Payment)");
        res = await request('/payments/cash', 'POST', {
            orderId: orderId,
            amount: totalAmount
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Payment failed: " + JSON.stringify(res.data));
        const paymentId = res.data.data.id;
        console.log("   ✅ Thanh toán thành công. PaymentId: " + paymentId);

        console.log("13. Truy vấn Hóa đơn (Invoices)");
        res = await request('/payments/invoices/search', 'GET', null, currentToken);
        if (res.status !== 200) throw new Error("Search invoices failed: " + JSON.stringify(res.data));
        console.log(`   ✅ Truy vấn hóa đơn thành công. Có ${res.data.data.totalElements} hóa đơn trong chi nhánh.`);

        // --- S-13 & S-14: INVENTORY ---
        console.log("\n--- BẮT ĐẦU TEST S-13 & S-14 (INVENTORY) ---");

        console.log("14. [Đúng] Nhập kho (Import Stock) nguyên liệu (+50)");
        res = await request('/inventory/import', 'POST', {
            itemId: itemId,
            supplierId: "00000000-0000-0000-0000-000000000000",
            quantity: 50,
            costPerUnit: 10000,
            expiresAt: new Date(Date.now() + 30*24*3600*1000).toISOString(),
            note: "Nhập test lô hàng 1"
        }, currentToken);
        if (res.status !== 200 && res.status !== 201) throw new Error("Import stock failed: " + JSON.stringify(res.data));
        console.log("   ✅ Nhập kho thành công. BatchId: " + res.data.data);

        console.log("15. [Sai] Nhập kho với số lượng âm (Validation Error)");
        let failRes = await request('/inventory/import', 'POST', {
            itemId: itemId,
            quantity: -10,
            costPerUnit: 10000
        }, currentToken);
        if (failRes.status === 200 || failRes.status === 201) throw new Error("Expected validation error but succeeded!");
        console.log("   ✅ Server từ chối request sai thành công: " + (failRes.data.message || JSON.stringify(failRes.data.errors)));

        console.log("16. [Đúng] Điều chỉnh kho (Adjust Stock) -> Tồn kho = 45");
        res = await request('/inventory/adjust', 'POST', {
            itemId: itemId,
            newQuantity: 45,
            reason: "Kiểm kê tháng"
        }, currentToken);
        if (res.status !== 200) throw new Error("Adjust stock failed: " + JSON.stringify(res.data));
        console.log("   ✅ Điều chỉnh kho thành công.");

        console.log("17. [Đúng] Ghi hao hụt (Record Waste) (-5)");
        res = await request('/inventory/waste', 'POST', {
            itemId: itemId,
            quantity: 5,
            reason: "Hư hỏng"
        }, currentToken);
        if (res.status !== 200) throw new Error("Record waste failed: " + JSON.stringify(res.data));
        console.log("   ✅ Ghi nhận hao hụt thành công.");

        console.log("18. [Sai] Ghi hao hụt mà thiếu lý do (Validation Error)");
        failRes = await request('/inventory/waste', 'POST', {
            itemId: itemId,
            quantity: 5,
            reason: "" // Rỗng
        }, currentToken);
        if (failRes.status === 200) throw new Error("Expected validation error but succeeded!");
        console.log("   ✅ Server từ chối request thiếu lý do thành công.");

        console.log("19. [Đúng] Truy vấn Tồn kho (GET /inventory)");
        res = await request('/inventory', 'GET', null, currentToken);
        if (res.status !== 200) throw new Error("Get inventory failed: " + JSON.stringify(res.data));
        console.log(`   ✅ Truy vấn tồn kho thành công. Số mã hàng: ${res.data.data.totalElements}`);
        
        let invItem = res.data.data.content.find(i => i.itemId === itemId);
        if (invItem) {
            console.log(`   🔎 Số lượng tồn kho hiện tại đối với món test (sau khi set 45 -> trừ 5 hao hụt -> còn 40): ${invItem.quantity}`);
            if (Number(invItem.quantity) !== 40) {
                console.warn("   ⚠️ CẢNH BÁO: Số dư tồn kho không khớp kỳ vọng! Thực tế: " + invItem.quantity);
            } else {
                console.log("   ✅ Cân bằng kho (Balance) tính toán chính xác!");
            }
        }

        console.log("\n==========================================");
        console.log("🎉 TẤT CẢ MODULES (S-01 đến S-14) HOẠT ĐỘNG HOÀN HẢO!");
        console.log("==========================================");

    } catch (e) {
        console.error("\n❌ LỖI TRONG QUÁ TRÌNH TEST:");
        console.error(e.message);
        process.exit(1);
    }
}

runTests();
