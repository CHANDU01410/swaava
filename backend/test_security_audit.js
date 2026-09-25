import http from "http";

const BASE_URL = "http://localhost:5000";

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                let parsed = body;
                try {
                    parsed = JSON.parse(body);
                } catch (e) { }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on("error", reject);
        if (data) {
            req.write(typeof data === "string" ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function runSecurityAudit() {
    console.log("=================================================");
    console.log("      MAAKHANA COMPREHENSIVE SECURITY AUDIT      ");
    console.log("=================================================\n");

    let passedChecks = 0;
    let totalChecks = 0;

    function assert(description, condition, extraInfo = "") {
        totalChecks++;
        if (condition) {
            console.log(`[PASS] Check #${totalChecks}: ${description}`);
            passedChecks++;
        } else {
            console.error(`[FAIL] Check #${totalChecks}: ${description}`);
            if (extraInfo) console.error(`       Details: ${extraInfo}`);
        }
    }

    const timestamp = Date.now();
    const customerEmail = `sec_cust_${timestamp}@example.com`;
    const victimEmail = `sec_victim_${timestamp}@example.com`;
    const chefAEmail = `sec_chefa_${timestamp}@example.com`;
    const chefBEmail = `sec_chefb_${timestamp}@example.com`;
    const hackerEmail = `sec_hacker_${timestamp}@example.com`;
    const password = "ValidPassword123!";

    // ── CHECK 1: Helmet Security Headers ──
    const probeRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/all",
        method: "GET"
    });
    assert("Helmet HTTP security headers present",
        probeRes.headers["x-content-type-options"] === "nosniff" &&
        probeRes.headers["x-frame-options"] === "SAMEORIGIN",
        `Headers: ${JSON.stringify(probeRes.headers)}`
    );

    // ── CHECK 2: Password Minimum Length Enforcement (< 8 chars rejected) ──
    const weakPwRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Weak Password User",
        email: `weak_${timestamp}@example.com`,
        password: "123"
    });
    assert("Password < 8 characters rejected on signup",
        weakPwRes.status === 400,
        `Status: ${weakPwRes.status}, Body: ${JSON.stringify(weakPwRes.body)}`
    );

    // ── CHECK 3: Password Maximum Bound Enforcement (> 128 chars rejected) ──
    const excessivePwRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Excessive Password User",
        email: `excess_${timestamp}@example.com`,
        password: "A".repeat(150)
    });
    assert("Password > 128 characters rejected on signup",
        excessivePwRes.status === 400,
        `Status: ${excessivePwRes.status}, Body: ${JSON.stringify(excessivePwRes.body)}`
    );

    // ── CHECK 4: Privilege Escalation Prevention (Cannot register as Admin) ──
    const adminEscalateRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Privilege Escalator",
        email: hackerEmail,
        password: password,
        role: "Admin"
    });
    assert("Privilege escalation to Admin rejected on signup",
        adminEscalateRes.status === 400,
        `Status: ${adminEscalateRes.status}, Body: ${JSON.stringify(adminEscalateRes.body)}`
    );

    // ── Register Valid Customer ──
    const custRegRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Security Customer",
        email: customerEmail,
        password: password,
        role: "Customer"
    });
    const customerToken = custRegRes.body.token;
    const customerId = custRegRes.body._id;

    // ── CHECK 5: Sensitive Data Scrubbing (No password hash or OTP in signup response) ──
    assert("Signup response scrubs password and resetOtp",
        custRegRes.body.password === undefined && custRegRes.body.resetOtp === undefined,
        `Body keys: ${Object.keys(custRegRes.body)}`
    );

    // ── Sign in Customer ──
    const custSignInRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signin",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        email: customerEmail,
        password: password
    });

    // ── CHECK 6: Sensitive Data Scrubbing in SignIn Response ──
    assert("SignIn response scrubs password and resetOtp",
        custSignInRes.body.password === undefined && custSignInRes.body.resetOtp === undefined,
        `Body keys: ${Object.keys(custSignInRes.body)}`
    );

    // ── CHECK 7: Sensitive Data Scrubbing in Current User Profile ──
    const curUserRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/user/current",
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` }
    });
    assert("Current user response scrubs password and resetOtp",
        curUserRes.body.password === undefined && curUserRes.body.resetOtp === undefined,
        `Body keys: ${Object.keys(curUserRes.body)}`
    );

    // ── Register Second Victim Customer ──
    const victimRegRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Victim Customer",
        email: victimEmail,
        password: password,
        role: "Customer"
    });
    const victimId = victimRegRes.body._id;

    // ── CHECK 8: Protected Routes - Unauthenticated Access Blocked (401) ──
    const unauthRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/user/current",
        method: "GET"
    });
    assert("Unauthenticated request to protected route returns 401",
        unauthRes.status === 401,
        `Status: ${unauthRes.status}`
    );

    // ── CHECK 9: Protected Routes - Tampered/Invalid JWT Blocked (401) ──
    const badTokenRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/user/current",
        method: "GET",
        headers: { "Authorization": "Bearer invalid.jwt.token" }
    });
    assert("Forged or invalid JWT token returns 401",
        badTokenRes.status === 401,
        `Status: ${badTokenRes.status}`
    );

    // ── CHECK 10: RBAC - Customer Cannot Access HomeChef Endpoints (403) ──
    const custAccessChefRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/order/chef-orders",
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` }
    });
    assert("Customer role is forbidden (403) from HomeChef endpoints",
        custAccessChefRes.status === 403,
        `Status: ${custAccessChefRes.status}`
    );

    // ── CHECK 11: RBAC - Customer Cannot Access Admin Endpoints (403) ──
    const custAccessAdminRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/admin/dashboard",
        method: "GET",
        headers: { "Authorization": `Bearer ${customerToken}` }
    });
    assert("Customer role is forbidden (403) from Admin endpoints",
        custAccessAdminRes.status === 403,
        `Status: ${custAccessAdminRes.status}`
    );

    // ── Register Chef A ──
    const chefARegRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Chef Alice",
        email: chefAEmail,
        password: password,
        role: "HomeCook"
    });
    const chefAToken = chefARegRes.body.token;

    // Create Shop for Chef A
    await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/shop/create-edit",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefAToken}`
        }
    }, {
        name: "Chef Alice's Kitchen",
        city: "Hyderabad",
        state: "Telangana",
        specialty: "Authentic Biryani"
    });

    // Add Dish for Chef A (Price: 250)
    const addDishRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefAToken}`
        }
    }, {
        name: `Alice Special Biryani ${timestamp}`,
        category: "Main Course",
        price: 250,
        foodType: "veg"
    });
    const chefAItems = addDishRes.body.items || [];
    const chefADishId = chefAItems[0]?._id;

    // ── CHECK 12: RBAC - HomeChef Cannot Access Admin Endpoints (403) ──
    const chefAccessAdminRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/admin/dashboard",
        method: "GET",
        headers: { "Authorization": `Bearer ${chefAToken}` }
    });
    assert("HomeChef role is forbidden (403) from Admin endpoints",
        chefAccessAdminRes.status === 403,
        `Status: ${chefAccessAdminRes.status}`
    );

    // ── Register Chef B ──
    const chefBRegRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        fullName: "Chef Bob",
        email: chefBEmail,
        password: password,
        role: "HomeCook"
    });
    const chefBToken = chefBRegRes.body.token;

    // Create Shop for Chef B
    const chefBShopRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/shop/create-edit",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefBToken}`
        }
    }, {
        name: "Chef Bob's Diner",
        city: "Bengaluru",
        state: "Karnataka",
        specialty: "South Delicacies"
    });
    const chefBShopId = chefBShopRes.body._id;

    // Add Dish for Chef B
    const addDishBRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefBToken}`
        }
    }, {
        name: `Bob Dosa ${timestamp}`,
        category: "Breakfast",
        price: 100,
        foodType: "veg"
    });
    const chefBDishId = addDishBRes.body.items?.[0]?._id;

    // ── CHECK 13: Cross-Tenant Dish Tampering - Chef B Cannot Edit Chef A's Dish (403) ──
    const chefBEditRes = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/item/edit/${chefADishId}`,
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefBToken}`
        }
    }, {
        name: "Tampered Biryani Name",
        price: 999
    });
    assert("Chef B forbidden (403) from editing Chef A's dish",
        chefBEditRes.status === 403,
        `Status: ${chefBEditRes.status}, Body: ${JSON.stringify(chefBEditRes.body)}`
    );

    // ── CHECK 14: Cross-Tenant Dish Deletion - Chef B Cannot Delete Chef A's Dish (403) ──
    const chefBDeleteRes = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/item/delete/${chefADishId}`,
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${chefBToken}`
        }
    });
    assert("Chef B forbidden (403) from deleting Chef A's dish",
        chefBDeleteRes.status === 403,
        `Status: ${chefBDeleteRes.status}, Body: ${JSON.stringify(chefBDeleteRes.body)}`
    );

    // ── CHECK 15: Client-Side Price Tampering Defense ──
    // Customer attempts to add Chef A's 250-rupee dish to cart with injected price: 1
    const tamperCartRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/cart/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        itemId: chefADishId,
        price: 1, // Malicious client attempt
        quantity: 2
    });
    assert("Cart rejects client price and enforces authoritative DB price (2 * 250 = 500)",
        tamperCartRes.status === 200 && tamperCartRes.body.totalAmount === 500 && tamperCartRes.body.items[0].price === 250,
        `Status: ${tamperCartRes.status}, Body: ${JSON.stringify(tamperCartRes.body)}`
    );

    // ── CHECK 16: Negative Quantity Defense ──
    const negQtyRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/cart/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        itemId: chefADishId,
        quantity: -5
    });
    assert("Negative quantity in cart rejected with 400",
        negQtyRes.status === 400,
        `Status: ${negQtyRes.status}, Body: ${JSON.stringify(negQtyRes.body)}`
    );

    // Clear and place order with quantity 1
    await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/cart/clear",
        method: "DELETE",
        headers: { "Authorization": `Bearer ${customerToken}` }
    });

    await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/cart/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        itemId: chefADishId,
        quantity: 1
    });

    const placeOrderRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/order/place",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        deliveryAddress: "123 Security St, Hyderabad",
        paymentMethod: "cod"
    });
    const orderId = placeOrderRes.body[0]?._id;
    assert("Order placed with authoritative DB price total",
        placeOrderRes.status === 200 || placeOrderRes.status === 201,
        `Status: ${placeOrderRes.status}`
    );

    // ── CHECK 17: Cross-Tenant Order Status Tampering - Chef B Cannot Update Chef A's Order (403) ──
    const chefBOrderRes = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/order/update-status/${orderId}`,
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefBToken}`
        }
    }, {
        status: "delivered"
    });
    assert("Chef B forbidden (403) from updating Chef A's order status",
        chefBOrderRes.status === 403,
        `Status: ${chefBOrderRes.status}, Body: ${JSON.stringify(chefBOrderRes.body)}`
    );

    // ── CHECK 18: Rating Item Permitted Only After Delivery (403 when pending) ──
    const unverifiedRateRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/rate",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        itemId: chefADishId,
        rating: 5
    });
    assert("Customer forbidden (403) from rating item before order is delivered",
        unverifiedRateRes.status === 403,
        `Status: ${unverifiedRateRes.status}, Body: ${JSON.stringify(unverifiedRateRes.body)}`
    );

    // ── Chef A Updates Order to Delivered ──
    const chefADeliverRes = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/order/update-status/${orderId}`,
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chefAToken}`
        }
    }, {
        status: "delivered"
    });
    assert("Chef A successfully updates their own order status to delivered",
        chefADeliverRes.status === 200,
        `Status: ${chefADeliverRes.status}`
    );

    // ── CHECK 19: Rating Item Permitted After Delivery ──
    const verifiedRateRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/rate",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        itemId: chefADishId,
        rating: 5
    });
    assert("Customer successfully rates item after delivery",
        verifiedRateRes.status === 200 && verifiedRateRes.body.rating?.average === 5,
        `Status: ${verifiedRateRes.status}, Body: ${JSON.stringify(verifiedRateRes.body)}`
    );

    // ── CHECK 20: Customer Cannot Review Dish from Order They Did Not Complete (403/400) ──
    const fakeReviewRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/review/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        chefId: chefBShopId,
        itemId: chefBDishId, // Customer never ordered Chef B's dish
        rating: 1,
        comment: "Fake review for unordered dish!"
    });
    assert("Review for uncompleted/unordered dish forbidden (403)",
        fakeReviewRes.status === 403,
        `Status: ${fakeReviewRes.status}, Body: ${JSON.stringify(fakeReviewRes.body)}`
    );

    // ── CHECK 21: Customer Can Review Dish from Completed Order ──
    const legitReviewRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/review/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        chefId: (chefAItems[0].shop?._id || chefAItems[0].shop || chefAItems[0].chef?._id || chefAItems[0].chef).toString(),
        itemId: chefADishId,
        orderId: orderId,
        rating: 5,
        comment: "Superb Biryani, highly recommended!"
    });
    assert("Review for delivered completed order succeeds (201)",
        legitReviewRes.status === 201,
        `Status: ${legitReviewRes.status}, Body: ${JSON.stringify(legitReviewRes.body)}`
    );

    // ── CHECK 22: Duplicate Review for Same Order Rejected (400) ──
    const dupReviewRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/review/add",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        chefId: (chefAItems[0].shop?._id || chefAItems[0].shop || chefAItems[0].chef?._id || chefAItems[0].chef).toString(),
        itemId: chefADishId,
        orderId: orderId,
        rating: 5,
        comment: "Second duplicate review attempt"
    });
    assert("Duplicate review for same order rejected (400)",
        dupReviewRes.status === 400,
        `Status: ${dupReviewRes.status}, Body: ${JSON.stringify(dupReviewRes.body)}`
    );

    // ── CHECK 23: IDOR Parameter Spoofing Prevention on Profile Update ──
    // Customer attempts to inject victimId into profile update payload
    await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/user/profile",
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
        }
    }, {
        userId: victimId, // Injected parameter
        fullName: "Tampered Name"
    });

    // Verify victim's profile remains untouched
    const victimCheckRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/user/current",
        method: "GET",
        headers: { "Authorization": `Bearer ${victimRegRes.body.token}` }
    });
    assert("IDOR payload ignored: victim profile remains untouched",
        victimCheckRes.body.fullName === "Victim Customer",
        `Victim fullName: ${victimCheckRes.body?.fullName}`
    );

    // ── CHECK 24: Google Auth Account Takeover Protection ──
    // Attacker tries to hijack an existing password-authenticated user via Google Auth
    const hijackRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/google-auth",
        method: "POST",
        headers: { "Content-Type": "application/json" }
    }, {
        email: customerEmail, // Existing password account
        fullName: "Hacker Impersonator"
    });
    assert("Google Auth rejects taking over existing password account (400)",
        hijackRes.status === 400,
        `Status: ${hijackRes.status}, Body: ${JSON.stringify(hijackRes.body)}`
    );

    // ── CHECK 25: ReDoS / Regex Injection Defense Across Items, Regions, and Shops ──
    const redosQuery = "((((((a+)+)+)+)+)+)$!@#[]()";
    const [redosItemRes, redosRegionRes, redosShopRes] = await Promise.all([
        request({
            hostname: "localhost",
            port: 5000,
            path: `/api/item/search-items?query=${encodeURIComponent(redosQuery)}`,
            method: "GET"
        }),
        request({
            hostname: "localhost",
            port: 5000,
            path: `/api/region/${encodeURIComponent(redosQuery)}`,
            method: "GET"
        }),
        request({
            hostname: "localhost",
            port: 5000,
            path: `/api/shop/all?search=${encodeURIComponent(redosQuery)}`,
            method: "GET"
        })
    ]);
    assert("ReDoS regex injection handled gracefully across items, regions, and shops without 500 crash",
        redosItemRes.status !== 500 && redosRegionRes.status !== 500 && redosShopRes.status !== 500,
        `Item: ${redosItemRes.status}, Region: ${redosRegionRes.status}, Shop: ${redosShopRes.status}`
    );

    // ── CHECK 26: CORS Graceful Disallowed Origin Handling ──
    const corsRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/all",
        method: "GET",
        headers: { "Origin": "http://malicious-site.com" }
    });
    assert("CORS disallowed origin handled safely without 500 error",
        corsRes.status !== 500,
        `Status: ${corsRes.status}`
    );

    // ── CHECK 27: Error Handling - Stack Traces and DB Internals Not Exposed ──
    const bogusIdRes = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/item/invalid-mongo-id-12345",
        method: "GET"
    });
    const bodyStr = JSON.stringify(bogusIdRes.body || "");
    assert("500 responses suppress stack traces and database internal error objects",
        !bodyStr.includes("CastError") && !bodyStr.includes("at ") && !bodyStr.includes("MongooseError"),
        `Response: ${bodyStr}`
    );

    console.log("\n=================================================");
    console.log(`      AUDIT COMPLETE: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
    console.log("=================================================");

    if (passedChecks === totalChecks) {
        console.log(`✅ ALL ${totalChecks} SECURITY & AUTHORIZATION CONTROLS VERIFIED!`);
        process.exit(0);
    } else {
        console.error(`❌ ONE OR MORE SECURITY AUDIT CHECKS FAILED (${passedChecks}/${totalChecks})!`);
        process.exit(1);
    }
}

runSecurityAudit().catch(err => {
    console.error("Audit script failed with error:", err);
    process.exit(1);
});
