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

async function runRecentlyViewedTests() {
  console.log("=== SWAAVA RECENTLY VIEWED FEATURE VERIFICATION ===");
  const timestamp = Date.now();

  try {
    // 1. Test Unauthorized Access
    console.log("\n1. Testing Unauthorized Access (No Token)...");
    const unauthGet = await request(`${API_BASE}/user/recently-viewed`, { method: "GET" });
    if (unauthGet.status === 401) {
      console.log(" GET /api/user/recently-viewed properly rejected unauthenticated caller (401)");
    } else {
      throw new Error(`FAIL: Expected 401 for unauthorized GET, got ${unauthGet.status}`);
    }

    const unauthPost = await request(`${API_BASE}/user/recently-viewed/123456789012345678901234`, { method: "POST" });
    if (unauthPost.status === 401) {
      console.log(" POST /api/user/recently-viewed/:id properly rejected unauthenticated caller (401)");
    } else {
      throw new Error(`FAIL: Expected 401 for unauthorized POST, got ${unauthPost.status}`);
    }

    // 2. Register & Login Customer
    console.log("\n2. Registering Customer User...");
    const customerEmail = `recent_tester_${timestamp}@swaava.test`;
    const signupRes = await request(`${API_BASE}/auth/signup`, {
      method: "POST",
      body: {
        fullName: "Recently Viewed Tester",
        email: customerEmail,
        password: "Password123!",
        role: "Customer"
      }
    });
    if (!signupRes.ok) throw new Error(`Signup failed: ${JSON.stringify(signupRes.data)}`);
    const token = signupRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log(" Customer authenticated successfully.");

    // 3. Initial Recently Viewed Check
    console.log("\n3. Checking initial recently viewed list...");
    const initRes = await request(`${API_BASE}/user/recently-viewed`, {
      method: "GET",
      headers: authHeaders
    });
    if (!initRes.ok) throw new Error(`Fetch recently viewed failed: ${JSON.stringify(initRes.data)}`);
    console.log(` Initial items count: ${initRes.data.length}`);
    if (initRes.data.length !== 0) {
      throw new Error("FAIL: New user should have 0 recently viewed items!");
    }
    console.log(" Initial state is clean empty array.");

    // 4. Get catalog items to view
    console.log("\n4. Fetching dishes from catalog...");
    const catalogRes = await request(`${API_BASE}/item/all`, { method: "GET" });
    if (!catalogRes.ok) throw new Error(`Catalog fetch failed: ${JSON.stringify(catalogRes.data)}`);
    const allDishes = catalogRes.data.items || catalogRes.data || [];
    if (allDishes.length < 10) {
      throw new Error(`Need at least 10 dishes in DB to test capping. Found ${allDishes.length}`);
    }
    console.log(` Found ${allDishes.length} dishes in database.`);

    // 5. Sequentially record viewing of 10 distinct dishes
    console.log("\n5. Viewing 10 dishes in sequence...");
    const dishesToView = allDishes.slice(0, 10);
    for (let i = 0; i < dishesToView.length; i++) {
      const dish = dishesToView[i];
      const recordRes = await request(`${API_BASE}/user/recently-viewed/${dish._id}`, {
        method: "POST",
        headers: authHeaders
      });
      if (!recordRes.ok) throw new Error(`Record view failed for ${dish.name}: ${JSON.stringify(recordRes.data)}`);
      console.log(`   Viewed #${i + 1}: "${dish.name}" -> Recent count: ${recordRes.data.length}`);
    }

    // 6. Verify cap of 8 items
    console.log("\n6. Verifying history limit (cap at 8 items)...");
    const after10Res = await request(`${API_BASE}/user/recently-viewed`, {
      method: "GET",
      headers: authHeaders
    });
    console.log(` Count after 10 views: ${after10Res.data.length} (Max limit: 8)`);
    if (after10Res.data.length !== 8) {
      throw new Error(`FAIL: Expected exactly 8 items, but got ${after10Res.data.length}`);
    }
    // Most recent should be dish 10 (dishesToView[9])
    if (after10Res.data[0]._id !== dishesToView[9]._id) {
      throw new Error(`FAIL: Expected top item to be "${dishesToView[9].name}", got "${after10Res.data[0].name}"`);
    }
    console.log(` Most recently viewed is correctly at top: "${after10Res.data[0].name}"`);
    console.log(" Cap of 8 items verified successfully!");

    // 7. Test Deduplication & Moving to Top
    console.log("\n7. Testing Deduplication (Re-viewing dish from middle of list)...");
    // Pick dish at index 4 (5th item in current recently viewed)
    const dishToRevisit = after10Res.data[4];
    console.log(` Re-visiting "${dishToRevisit.name}" (_id: ${dishToRevisit._id})...`);

    const revisitRes = await request(`${API_BASE}/user/recently-viewed/${dishToRevisit._id}`, {
      method: "POST",
      headers: authHeaders
    });
    if (!revisitRes.ok) throw new Error(`Revisit view failed: ${JSON.stringify(revisitRes.data)}`);

    // Verify still 8 items, not 9
    if (revisitRes.data.length !== 8) {
      throw new Error(`FAIL: Expected count to stay 8, got ${revisitRes.data.length}`);
    }
    // Verify it is now at index 0
    if (revisitRes.data[0]._id !== dishToRevisit._id) {
      throw new Error(`FAIL: Expected re-visited dish to move to index 0, got "${revisitRes.data[0].name}"`);
    }
    // Verify no duplicates exist
    const idSet = new Set(revisitRes.data.map(d => d._id));
    if (idSet.size !== revisitRes.data.length) {
      throw new Error("FAIL: Found duplicate item in recently viewed list!");
    }
    console.log(" Dish successfully moved to index 0 without duplicates.");
    console.log(" Total items remain capped at 8.");

    // 8. Verify Populated Fields
    console.log("\n8. Verifying Populated Dish Data Quality...");
    const sample = revisitRes.data[0];
    console.log(" Sample item fields:", {
      name: sample.name,
      price: sample.price,
      state: sample.state,
      foodType: sample.foodType,
      rating: sample.rating,
      image: sample.image ? "(present)" : "(missing)"
    });
    if (!sample.name || sample.price === undefined || !sample.state) {
      throw new Error("FAIL: Populated dish is missing key fields!");
    }
    console.log(" All populated fields present and valid.");

    console.log("\n========================================================");
    console.log(" ALL RECENTLY VIEWED FEATURE TESTS PASSED SUCCESSFULLY! ");
    console.log("========================================================\n");

  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runRecentlyViewedTests();
