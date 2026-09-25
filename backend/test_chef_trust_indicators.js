const API_BASE = "http://localhost:5000/api";

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTrustIndicatorTests() {
  console.log("=== SWAAVA HOMECHEF TRUST INDICATORS & VERIFICATION TESTS ===");
  const timestamp = Date.now();

  try {
    // 1. Register a new HomeCook
    console.log("\n1. Registering new HomeCook...");
    const chefEmail = `cook_trust_${timestamp}@test.com`;
    const chefRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Chef Master Aman",
        email: chefEmail,
        password: "Password123!",
        role: "HomeCook"
      }
    });
    if (!chefRes.ok) throw new Error(`Chef register failed: ${JSON.stringify(chefRes.data)}`);
    const chefToken = chefRes.data.token;
    const chefHeaders = { Authorization: `Bearer ${chefToken}` };
    console.log(" HomeCook account registered.");

    // 2. Kitchen Creation Attempt with arbitrary isVerified: true
    console.log("\n2. Creating Kitchen and attempting arbitrary frontend isVerified: true injection...");
    const createShopRes = await request(`${API_BASE}/shop/create-edit`, {
      method: "POST",
      headers: chefHeaders,
      body: {
        name: `Heritage Kitchen Aman ${timestamp}`,
        city: "Amritsar",
        state: "Punjab",
        address: "Golden Temple Lane",
        bio: "Generational Punjabi recipes.",
        specialty: "Kulchas & Daal Makhani",
        experience: "12 Years",
        isVerified: true // Arbitrary client injection attempt!
      }
    });
    if (!createShopRes.ok) throw new Error(`Kitchen creation failed: ${JSON.stringify(createShopRes.data)}`);
    const chefId = createShopRes.data._id;
    console.log(` Kitchen created: "${createShopRes.data.name}" (_id: ${chefId})`);
    console.log(` Initial isVerified status: ${createShopRes.data.isVerified}`);

    // Verify backend rejected arbitrary verification
    if (createShopRes.data.isVerified === true) {
      throw new Error("SECURITY FAIL: Backend allowed client to arbitrarily set isVerified: true!");
    }
    console.log(" PASS: Backend strictly preserved isVerified = false (pending admin review).");

    // 3. Register Admin User (Register as Customer then promote in DB since Admin signup is blocked)
    console.log("\n3. Authenticating Admin User...");
    const adminEmail = `admin_trust_${timestamp}@swaava.internal`;
    const adminRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Platform Admin",
        email: adminEmail,
        password: "AdminPassword123!",
        role: "Customer"
      }
    });
    if (!adminRes.ok) throw new Error(`Admin signup failed: ${JSON.stringify(adminRes.data)}`);
    const adminToken = adminRes.data.token;
    
    // Promote user to Admin in database
    const mongoose = (await import("mongoose")).default;
    const User = (await import("./models/user.model.js")).default;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/swaava");
    }
    await User.updateOne({ email: adminEmail }, { role: "Admin" });
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log(" Admin authenticated and promoted successfully.");

    // 4. Test RBAC: Chef cannot call admin verification route
    console.log("\n4. Verifying RBAC: Chef cannot self-approve via admin API...");
    const rbacRes = await request(`${API_BASE}/admin/chefs/${chefId}/verify`, {
      method: "PUT",
      headers: chefHeaders,
      body: { isVerified: true }
    });
    if (rbacRes.status === 403) {
      console.log(` PASS: Non-admin rejected with HTTP 403: "${rbacRes.data?.message}"`);
    } else {
      throw new Error(`FAIL: Expected 403 for non-admin verify call, got ${rbacRes.status}`);
    }

    // 5. Admin Approves Chef
    console.log("\n5. Admin approving chef verification status...");
    const approveRes = await request(`${API_BASE}/admin/chefs/${chefId}/verify`, {
      method: "PUT",
      headers: adminHeaders,
      body: { isVerified: true }
    });
    if (!approveRes.ok) throw new Error(`Admin verify failed: ${JSON.stringify(approveRes.data)}`);
    console.log(` Chef verification updated by Admin: isVerified = ${approveRes.data.isVerified}`);
    if (approveRes.data.isVerified !== true) {
      throw new Error("FAIL: Chef should now be verified!");
    }
    console.log(" PASS: Admin successfully approved chef.");

    // 6. Verify Public Chef Endpoint reflects verification
    console.log("\n6. Checking public Chef Profile endpoint GET /api/shop/:id...");
    const publicChefRes = await request(`${API_BASE}/shop/${chefId}`, { method: "GET" });
    if (!publicChefRes.ok) throw new Error(`Public chef fetch failed: ${JSON.stringify(publicChefRes.data)}`);
    console.log(` Public Chef Profile isVerified: ${publicChefRes.data.isVerified}`);
    if (publicChefRes.data.isVerified !== true) {
      throw new Error("FAIL: Public chef profile does not reflect verified status!");
    }
    console.log(" PASS: Public chef profile reliably reflects backend verification.");

    // 7. Add Food Item and Verify Populated Chef Status
    console.log("\n7. Adding a dish to kitchen and verifying populated Food Details status...");
    const addItemRes = await request(`${API_BASE}/item/add`, {
      method: "POST",
      headers: chefHeaders,
      body: {
        name: `Signature Paneer Kulcha ${timestamp}`,
        category: "Main Course",
        foodType: "veg",
        price: 190,
        spiceLevel: 2,
        preparationTime: "20-25 mins",
        servingSize: "1-2 persons",
        ingredients: "Paneer, Flour, Butter, Spices",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop"
      }
    });
    if (!addItemRes.ok) throw new Error(`Add item failed: ${JSON.stringify(addItemRes.data)}`);
    const itemId = addItemRes.data.items?.[0]?._id || addItemRes.data.items?.[0] || addItemRes.data._id;
    console.log(` Dish added: _id: ${itemId}`);

    // Fetch Food Details
    const foodDetailsRes = await request(`${API_BASE}/item/${itemId}`, { method: "GET" });
    if (!foodDetailsRes.ok) throw new Error(`Food details fetch failed: ${JSON.stringify(foodDetailsRes.data)}`);
    const foodChef = foodDetailsRes.data.chef || foodDetailsRes.data.shop;
    console.log(` Food Details Populated Chef Name: "${foodChef?.name}", isVerified: ${foodChef?.isVerified}`);
    if (foodChef?.isVerified !== true) {
      throw new Error("FAIL: Food details did not properly populate chef.isVerified as true!");
    }
    console.log(" PASS: Food details populated chef isVerified = true.");

    // 8. Admin Revokes Approval
    console.log("\n8. Admin revoking chef approval...");
    const revokeRes = await request(`${API_BASE}/admin/chefs/${chefId}/verify`, {
      method: "PUT",
      headers: adminHeaders,
      body: { isVerified: false }
    });
    if (!revokeRes.ok) throw new Error(`Revoke failed: ${JSON.stringify(revokeRes.data)}`);
    console.log(` Chef verification status after revoke: isVerified = ${revokeRes.data.isVerified}`);
    if (revokeRes.data.isVerified !== false) {
      throw new Error("FAIL: Chef should now be unverified!");
    }

    // Verify Food Details immediately reflects unverified status
    const foodDetailsAfterRevoke = await request(`${API_BASE}/item/${itemId}`, { method: "GET" });
    const chefAfterRevoke = foodDetailsAfterRevoke.data.chef || foodDetailsAfterRevoke.data.shop;
    console.log(` Food Details Chef after revoke: isVerified = ${chefAfterRevoke?.isVerified}`);
    if (chefAfterRevoke?.isVerified !== false) {
      throw new Error("FAIL: Food details should now show chef.isVerified as false!");
    }
    console.log(" PASS: Food details reliably reflects revoked status.");

    console.log("\n========================================================");
    console.log(" ALL HOMECHEF TRUST INDICATOR TESTS PASSED SUCCESSFULLY! ");
    console.log("========================================================\n");

  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTrustIndicatorTests();
