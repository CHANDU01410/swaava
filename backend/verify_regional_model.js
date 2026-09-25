import mongoose from "mongoose";

const EXPECTED_STATES = [
    "Punjab",
    "Andhra Pradesh",
    "Telangana",
    "Tamil Nadu",
    "Kerala",
    "Karnataka",
    "Maharashtra",
    "Gujarat",
    "Rajasthan",
    "West Bengal",
    "Odisha",
    "Uttar Pradesh"
];

const EXPECTED_DISHES = {
    "Punjab": ["Amritsari Kulcha", "Sarson da Saag", "Makki di Roti", "Punjabi Rajma", "Chole"],
    "Andhra Pradesh": ["Gongura Pachadi", "Pulihora", "Andhra Chicken", "Pesarattu", "Gutti Vankaya"],
    "Telangana": ["Hyderabadi Biryani", "Sarva Pindi", "Mirchi Ka Salan", "Haleem", "Double Ka Meetha"],
    "Tamil Nadu": ["Pongal", "Idiyappam", "Chettinad Chicken", "Sambar", "Parotta"],
    "Kerala": ["Appam", "Kerala Parotta", "Avial", "Puttu", "Malabar Biryani"],
    "Karnataka": ["Bisi Bele Bath", "Mysore Masala Dosa", "Ragi Mudde", "Neer Dosa", "Mangalorean Fish Curry"],
    "Maharashtra": ["Misal Pav", "Vada Pav", "Puran Poli", "Pav Bhaji", "Kolhapuri Chicken"],
    "Gujarat": ["Dhokla", "Thepla", "Undhiyu", "Khandvi", "Gujarati Kadhi"],
    "Rajasthan": ["Dal Baati Churma", "Gatte Ki Sabzi", "Ker Sangri", "Laal Maas", "Pyaaz Kachori"],
    "West Bengal": ["Kosha Mangsho", "Mishti Doi", "Shorshe Ilish", "Luchi", "Cholar Dal"],
    "Odisha": ["Dalma", "Pakhala Bhata", "Chhena Poda", "Macha Ghanta", "Dahi Pakhala"],
    "Uttar Pradesh": ["Lucknowi Biryani", "Galouti Kebab", "Kachori Sabzi", "Bedmi Puri", "Banarasi Tamatar Chaat"]
};

async function verify() {
    console.log("=== SWAAVA DATA MODEL & ARCHITECTURE VERIFICATION ===\n");

    const mongoUrl = "mongodb://localhost:27017/swaava";
    await mongoose.connect(mongoUrl);

    const db = mongoose.connection.db;

    // 1. Verify States
    console.log("1. VERIFYING STATES (REGIONS)...");
    const regions = await db.collection("regions").find({}).toArray();
    console.log(`   Found ${regions.length} states in MongoDB.`);
    const regionNames = regions.map(r => r.name);
    for (const st of EXPECTED_STATES) {
        if (regionNames.includes(st)) {
            console.log(`   ✅ State present: ${st}`);
        } else {
            console.error(`   ❌ State MISSING: ${st}`);
        }
    }

    // 2. Verify Chefs
    console.log("\n2. VERIFYING HOME CHEFS...");
    const chefs = await db.collection("homecooks").find({}).toArray();
    console.log(`   Found ${chefs.length} total home chefs.`);
    for (const st of EXPECTED_STATES) {
        const stateChefs = chefs.filter(c => c.state?.toLowerCase() === st.toLowerCase());
        console.log(`   📍 ${st}: ${stateChefs.length} chefs -> ${stateChefs.map(c => c.name).join(", ")}`);
        if (stateChefs.length < 2) {
            console.error(`   ❌ Under 2 chefs for ${st}!`);
        }
    }

    // Verify Chef schema fields
    const sampleChef = chefs[0];
    console.log("\n   Checking HomeChef schema attributes on sample chef:", sampleChef.name);
    const chefFields = ["name", "profileImage", "state", "city", "specialization", "bio", "rating", "totalReviews", "yearsOfExperience", "isVerified", "available"];
    for (const f of chefFields) {
        const has = sampleChef[f] !== undefined || (f === "profileImage" && sampleChef.image) || (f === "specialization" && sampleChef.specialty);
        console.log(`     - field '${f}': ${has ? "✅" : "❌"}`);
    }

    // 3. Verify Foods
    console.log("\n3. VERIFYING AUTHENTIC DISHES...");
    const items = await db.collection("items").find({}).toArray();
    console.log(`   Found ${items.length} total food items.`);

    let allDishesFound = true;
    for (const [st, dishes] of Object.entries(EXPECTED_DISHES)) {
        console.log(`\n   📍 Checking ${st} dishes (${dishes.length} expected):`);
        const stateItems = items.filter(i => i.state?.toLowerCase() === st.toLowerCase());
        const itemNames = stateItems.map(i => i.name.toLowerCase());

        for (const d of dishes) {
            const match = stateItems.find(i => i.name.toLowerCase() === d.toLowerCase());
            if (match) {
                console.log(`     ✅ ${d} (₹${match.price}, ${match.foodType}, ${match.category})`);
            } else {
                console.error(`     ❌ MISSING DISH: ${d}`);
                allDishesFound = false;
            }
        }
    }

    // Verify Food schema fields
    const sampleItem = items[0];
    console.log("\n   Checking Food schema attributes on sample item:", sampleItem.name);
    const itemFields = ["name", "description", "price", "image", "state", "category", "chef", "rating", "reviewCount", "preparationTime", "servingSize", "vegetarian", "spicyLevel", "available", "ingredients"];
    for (const f of itemFields) {
        const has = sampleItem[f] !== undefined || (f === "chef" && sampleItem.shop) || (f === "spicyLevel" && sampleItem.spiceLevel !== undefined);
        console.log(`     - field '${f}': ${has ? "✅" : "❌"} (val: ${JSON.stringify(sampleItem[f])})`);
    }

    // 4. Verify Relationships (State -> HomeChef -> Food)
    console.log("\n4. VERIFYING RELATIONSHIPS: State -> HomeChef -> Food...");
    let relationErrors = 0;
    for (const c of chefs) {
        // verify chef.state matches a valid region
        if (!EXPECTED_STATES.includes(c.state)) {
            console.error(`   ❌ Chef ${c.name} has invalid state ${c.state}`);
            relationErrors++;
        }
        // verify chef items
        const chefDishes = items.filter(i => i.shop?.toString() === c._id?.toString() || i.chef?.toString() === c._id?.toString());
        if (chefDishes.length === 0) {
            console.error(`   ❌ Chef ${c.name} has 0 linked items!`);
            relationErrors++;
        } else {
            // verify each dish matches chef's state
            for (const d of chefDishes) {
                if (d.state !== c.state) {
                    console.error(`   ❌ Dish ${d.name} state (${d.state}) does not match chef state (${c.state})!`);
                    relationErrors++;
                }
            }
        }
    }
    if (relationErrors === 0) {
        console.log("   ✅ All relationships (State -> HomeChef -> Food) verified perfectly!");
    } else {
        console.error(`   ❌ Encountered ${relationErrors} relationship issues.`);
    }

    // 5. Verify live API Endpoints via HTTP
    console.log("\n5. VERIFYING LIVE HTTP API ENDPOINTS...");
    try {
        // A. Region All
        const regRes = await fetch("http://localhost:5000/api/region/all");
        const regData = await regRes.json();
        console.log(`   GET /api/region/all: status ${regRes.status}, returned ${regData.length} regions (expected 12) ${regData.length === 12 ? "✅" : "❌"}`);

        // B. Region By Name
        const singleRegRes = await fetch("http://localhost:5000/api/region/Punjab");
        const singleRegData = await singleRegRes.json();
        console.log(`   GET /api/region/Punjab: status ${singleRegRes.status}, name: "${singleRegData.name}" ${singleRegData.name === "Punjab" ? "✅" : "❌"}`);

        // C. Chefs by State
        const chefStateRes = await fetch("http://localhost:5000/api/shop/get-by-state/Punjab");
        const chefStateData = await chefStateRes.json();
        console.log(`   GET /api/shop/get-by-state/Punjab: status ${chefStateRes.status}, returned ${chefStateData.length} chefs (expected >= 2) ${chefStateData.length >= 2 ? "✅" : "❌"}`);

        // D. Items by State
        const itemStateRes = await fetch("http://localhost:5000/api/item/by-state/Punjab");
        const itemStateData = await itemStateRes.json();
        console.log(`   GET /api/item/by-state/Punjab: status ${itemStateRes.status}, returned ${itemStateData.length} items (expected 5) ${itemStateData.length === 5 ? "✅" : "❌"}`);

        // E. Chef by ID
        const testChefId = chefs[0]._id.toString();
        const shopByIdRes = await fetch(`http://localhost:5000/api/shop/${testChefId}`);
        const shopByIdData = await shopByIdRes.json();
        console.log(`   GET /api/shop/:shopId (${sampleChef.name}): status ${shopByIdRes.status}, items populated: ${shopByIdData.items?.length || 0} ${shopByIdRes.status === 200 ? "✅" : "❌"}`);

        // F. Item by ID
        const testItemId = items[0]._id.toString();
        const itemByIdRes = await fetch(`http://localhost:5000/api/item/${testItemId}`);
        const itemByIdData = await itemByIdRes.json();
        console.log(`   GET /api/item/:itemId (${sampleItem.name}): status ${itemByIdRes.status}, name: "${itemByIdData.name}" ${itemByIdRes.status === 200 ? "✅" : "❌"}`);

        // G. Search items
        const searchRes = await fetch("http://localhost:5000/api/item/search-items?query=Biryani");
        const searchData = await searchRes.json();
        console.log(`   GET /api/item/search-items?query=Biryani: status ${searchRes.status}, found ${searchData.length} results ${searchData.length > 0 ? "✅" : "❌"}`);

    } catch (apiErr) {
        console.error("   ❌ API verification failed:", apiErr.message);
    }

    await mongoose.disconnect();
    console.log("\n=== VERIFICATION COMPLETE ===");
}

verify().catch(console.error);
