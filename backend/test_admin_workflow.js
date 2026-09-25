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

async function runAdminWorkflowTests() {
  console.log("=== SWAAVA ADMIN WORKFLOW & RBAC VERIFICATION ===");
  const timestamp = Date.now();

  try {
    // 1. Create a Customer user
    console.log("\n1. Registering Customer User...");
    const customerEmail = `customer_${timestamp}@test.com`;
    const customerRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Test Customer",
        email: customerEmail,
        password: "Password123!",
        role: "Customer"
      }
    });
    if (!customerRes.ok) throw new Error(`Customer register failed: ${JSON.stringify(customerRes.data)}`);
    const customerToken = customerRes.data.token;
    console.log(" Customer registered successfully.");

    // 2. Create a HomeCook user
    console.log("\n2. Registering HomeCook User...");
    const chefEmail = `chef_${timestamp}@test.com`;
    const chefRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Test HomeChef",
        email: chefEmail,
        password: "Password123!",
        role: "HomeCook"
      }
    });
    if (!chefRes.ok) throw new Error(`Chef register failed: ${JSON.stringify(chefRes.data)}`);
    const chefToken = chefRes.data.token;
    console.log(" HomeCook registered successfully.");

    // 3. Create an Admin user (Register as Customer then promote in DB since Admin signup is blocked)
    console.log("\n3. Registering Admin User...");
    const adminEmail = `admin_${timestamp}@swaava.internal`;
    const adminRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Platform Admin",
        email: adminEmail,
        password: "AdminPassword123!",
        role: "Customer"
      }
    });
    if (!adminRes.ok) throw new Error(`Admin register failed: ${JSON.stringify(adminRes.data)}`);
    const adminToken = adminRes.data.token;

    // Promote user to Admin in database
    const mongoose = (await import("mongoose")).default;
    const User = (await import("./models/user.model.js")).default;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/swaava");
    }
    await User.updateOne({ email: adminEmail }, { role: "Admin" });
    console.log(" Admin registered and promoted successfully.");

    // 4. Test Direct Backend RBAC Protection on /api/admin/dashboard
    console.log("\n4. Testing Direct Backend RBAC Protection on /api/admin/dashboard...");

    // 4a. Anonymous
    const anonRes = await request(`${API_BASE}/admin/dashboard`, { method: "GET" });
    if (anonRes.status === 401 || anonRes.status === 400) {
      console.log(` Anonymous caller rejected properly with status ${anonRes.status}`);
    } else {
      throw new Error(`FAIL: Expected 401/400 for anonymous user, got ${anonRes.status}`);
    }

    // 4b. Customer Role
    const custAuthRes = await request(`${API_BASE}/admin/dashboard`, {
      method: "GET",
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    if (custAuthRes.status === 403) {
      console.log(` Customer caller rejected properly with HTTP 403: "${custAuthRes.data?.message}"`);
    } else {
      throw new Error(`FAIL: Expected 403 for Customer, got ${custAuthRes.status} (${JSON.stringify(custAuthRes.data)})`);
    }

    // 4c. HomeCook Role
    const chefAuthRes = await request(`${API_BASE}/admin/dashboard`, {
      method: "GET",
      headers: { Authorization: `Bearer ${chefToken}` }
    });
    if (chefAuthRes.status === 403) {
      console.log(` HomeCook caller rejected properly with HTTP 403: "${chefAuthRes.data?.message}"`);
    } else {
      throw new Error(`FAIL: Expected 403 for HomeCook, got ${chefAuthRes.status} (${JSON.stringify(chefAuthRes.data)})`);
    }

    // 5. Admin Dashboard Metrics (Authorized)
    console.log("\n5. Testing Admin Dashboard Metrics endpoint (Authorized)...");
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const dashRes = await request(`${API_BASE}/admin/dashboard`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!dashRes.ok) throw new Error(`Dashboard fetch failed: ${JSON.stringify(dashRes.data)}`);
    console.log(" Dashboard Metrics response:", dashRes.data);

    const requiredKPIs = [
      "totalUsers",
      "totalHomeChefs",
      "pendingChefApprovals",
      "totalOrders",
      "totalRevenue",
      "totalFoodItems"
    ];
    for (const kpi of requiredKPIs) {
      if (dashRes.data[kpi] === undefined) {
        throw new Error(`FAIL: Dashboard metrics missing KPI: ${kpi}`);
      }
    }
    console.log(" All 6 required KPI metrics returned correctly.");

    // 6. Admin Chefs Management & Approvals
    console.log("\n6. Testing Admin Chefs Management & Approvals...");
    const chefsRes = await request(`${API_BASE}/admin/chefs`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!chefsRes.ok) throw new Error(`Chefs fetch failed: ${JSON.stringify(chefsRes.data)}`);
    console.log(` Retrieved ${chefsRes.data.length} registered chefs.`);
    
    if (chefsRes.data.length > 0) {
      const targetChef = chefsRes.data[0];
      const newStatus = !targetChef.isVerified;
      console.log(` Updating verification status of chef "${targetChef.name}" to ${newStatus}...`);
      const verifyRes = await request(`${API_BASE}/admin/chefs/${targetChef._id}/verify`, {
        method: "PUT",
        headers: adminHeaders,
        body: { isVerified: newStatus }
      });
      if (!verifyRes.ok) throw new Error(`Verify chef failed: ${JSON.stringify(verifyRes.data)}`);
      console.log(` Chef verification updated: isVerified = ${verifyRes.data.isVerified}`);
    }

    // 7. Admin Food Management
    console.log("\n7. Testing Admin Food Management...");
    const foodsRes = await request(`${API_BASE}/admin/foods`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!foodsRes.ok) throw new Error(`Foods fetch failed: ${JSON.stringify(foodsRes.data)}`);
    console.log(` Retrieved ${foodsRes.data.length} food items.`);
    if (foodsRes.data.length > 0) {
      const targetFood = foodsRes.data[0];
      const toggleAvail = !targetFood.isAvailable;
      console.log(` Toggling availability of "${targetFood.name}" to ${toggleAvail}...`);
      const updateFoodRes = await request(`${API_BASE}/admin/foods/${targetFood._id}`, {
        method: "PUT",
        headers: adminHeaders,
        body: {
          isAvailable: toggleAvail,
          price: targetFood.price
        }
      });
      if (!updateFoodRes.ok) throw new Error(`Update food failed: ${JSON.stringify(updateFoodRes.data)}`);
      console.log(` Food updated: isAvailable = ${updateFoodRes.data.isAvailable}`);
    }

    // 8. Admin State Management
    console.log("\n8. Testing Admin State Management...");
    const statesRes = await request(`${API_BASE}/admin/states`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!statesRes.ok) throw new Error(`States fetch failed: ${JSON.stringify(statesRes.data)}`);
    console.log(` Retrieved ${statesRes.data.length} states.`);
    
    const newStateRes = await request(`${API_BASE}/admin/states`, {
      method: "POST",
      headers: adminHeaders,
      body: {
        name: `Test State ${timestamp}`,
        code: `TS${timestamp.toString().slice(-2)}`,
        description: "A test culinary state created by Admin",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop"
      }
    });
    if (!newStateRes.ok) throw new Error(`Create state failed: ${JSON.stringify(newStateRes.data)}`);
    console.log(` State created: "${newStateRes.data.name}" (_id: ${newStateRes.data._id})`);

    // Clean up created test state
    const delStateRes = await request(`${API_BASE}/admin/states/${newStateRes.data._id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    if (!delStateRes.ok) throw new Error(`Delete state failed: ${JSON.stringify(delStateRes.data)}`);
    console.log(` Cleaned up test state.`);

    // 9. Admin Orders Management
    console.log("\n9. Testing Admin Orders Management...");
    const ordersRes = await request(`${API_BASE}/admin/orders`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!ordersRes.ok) throw new Error(`Orders fetch failed: ${JSON.stringify(ordersRes.data)}`);
    console.log(` Retrieved ${ordersRes.data.length} platform orders.`);
    if (ordersRes.data.length > 0) {
      const targetOrder = ordersRes.data[0];
      console.log(` Updating order ${targetOrder._id} status to 'preparing'...`);
      const updateOrderRes = await request(`${API_BASE}/admin/orders/${targetOrder._id}/status`, {
        method: "PUT",
        headers: adminHeaders,
        body: { status: "preparing" }
      });
      if (!updateOrderRes.ok) throw new Error(`Update order status failed: ${JSON.stringify(updateOrderRes.data)}`);
      console.log(` Order status updated to: ${updateOrderRes.data.status}`);
    }

    // 10. Admin Reviews Management
    console.log("\n10. Testing Admin Reviews Management...");
    const reviewsRes = await request(`${API_BASE}/admin/reviews`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!reviewsRes.ok) throw new Error(`Reviews fetch failed: ${JSON.stringify(reviewsRes.data)}`);
    console.log(` Retrieved ${reviewsRes.data.length} diner reviews.`);

    // 11. Admin User Management
    console.log("\n11. Testing Admin User Management...");
    const usersRes = await request(`${API_BASE}/admin/users`, {
      method: "GET",
      headers: adminHeaders
    });
    if (!usersRes.ok) throw new Error(`Users fetch failed: ${JSON.stringify(usersRes.data)}`);
    console.log(` Retrieved ${usersRes.data.length} registered users.`);
    
    // Find customer created earlier and update role
    const customerUser = usersRes.data.find(u => u.email === customerEmail);
    if (customerUser) {
      console.log(` Updating Customer ${customerUser.fullName} role to HomeCook...`);
      const updateRoleRes = await request(`${API_BASE}/admin/users/${customerUser._id}/role`, {
        method: "PUT",
        headers: adminHeaders,
        body: { role: "HomeCook" }
      });
      if (!updateRoleRes.ok) throw new Error(`Update user role failed: ${JSON.stringify(updateRoleRes.data)}`);
      console.log(` User role updated to: ${updateRoleRes.data.role}`);

      // Delete customer test user
      const delUserRes = await request(`${API_BASE}/admin/users/${customerUser._id}`, {
        method: "DELETE",
        headers: adminHeaders
      });
      if (!delUserRes.ok) throw new Error(`Delete user failed: ${JSON.stringify(delUserRes.data)}`);
      console.log(` Cleaned up test customer user.`);
    }

    console.log("\n========================================================");
    console.log(" ALL ADMIN WORKFLOW AND RBAC VERIFICATIONS PASSED!");
    console.log("========================================================\n");

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runAdminWorkflowTests();
