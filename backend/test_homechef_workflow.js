import mongoose from 'mongoose';

const serverUrl = 'http://localhost:5000';

async function runHomeChefWorkflowTest() {
  console.log('====================================================');
  console.log('🍳 SWAAVA HOMECHEF WORKFLOW & RBAC E2E TEST');
  console.log('====================================================\n');

  const timestamp = Date.now();

  const customerUser = {
    fullName: `Customer Diner ${timestamp}`,
    email: `customer_diner_${timestamp}@swaava.test`,
    password: 'Password123!',
    role: 'Customer',
    phone: '9876543201'
  };

  const chefUser = {
    fullName: `Chef Amarpreet Singh ${timestamp}`,
    email: `chef_amarpreet_${timestamp}@swaava.test`,
    password: 'Password123!',
    role: 'HomeCook',
    phone: '9876543202'
  };

  const makeClient = () => {
    let sessionCookie = '';
    return {
      async request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (sessionCookie) headers['Cookie'] = sessionCookie;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${serverUrl}${path}`, options);
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
          sessionCookie = setCookie.split(';')[0];
        }

        let data;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        return { status: res.status, data };
      }
    };
  };

  const customerClient = makeClient();
  const chefClient = makeClient();

  // 1️⃣ RBAC ENFORCEMENT TEST: Customer must be blocked from Chef endpoints
  console.log('1️⃣ TESTING RBAC ENFORCEMENT ON CUSTOMER...');
  await customerClient.request('POST', '/api/auth/signup', customerUser);
  const custLogin = await customerClient.request('POST', '/api/auth/signin', {
    email: customerUser.email,
    password: customerUser.password
  });
  console.log('   Customer logged in:', custLogin.status === 200 ? 'YES' : 'NO');

  const rbacTest1 = await customerClient.request('POST', '/api/shop/create-edit', { name: 'Unauthorized Kitchen' });
  console.log(`   Customer call to /api/shop/create-edit: Status ${rbacTest1.status}`);
  if (rbacTest1.status !== 403) throw new Error(`RBAC failed! Expected 403, got ${rbacTest1.status}`);

  const rbacTest2 = await customerClient.request('POST', '/api/item/add', { name: 'Unauthorized Dish' });
  console.log(`   Customer call to /api/item/add: Status ${rbacTest2.status}`);
  if (rbacTest2.status !== 403) throw new Error(`RBAC failed! Expected 403, got ${rbacTest2.status}`);

  const rbacTest3 = await customerClient.request('GET', '/api/order/chef-orders');
  console.log(`   Customer call to /api/order/chef-orders: Status ${rbacTest3.status}`);
  if (rbacTest3.status !== 403) throw new Error(`RBAC failed! Expected 403, got ${rbacTest3.status}`);

  const rbacTest4 = await customerClient.request('GET', '/api/order/chef-analytics');
  console.log(`   Customer call to /api/order/chef-analytics: Status ${rbacTest4.status}`);
  if (rbacTest4.status !== 403) throw new Error(`RBAC failed! Expected 403, got ${rbacTest4.status}`);

  console.log('   ✅ PASS: Customer strictly blocked from all HomeChef endpoints (403 Forbidden)!\n');

  // 2️⃣ HOMECHEF REGISTRATION & SIGNIN
  console.log('2️⃣ REGISTERING & LOGGING IN HOMECHEF...');
  const chefReg = await chefClient.request('POST', '/api/auth/signup', chefUser);
  console.log(`   HomeChef register status: ${chefReg.status}`);
  const chefLogin = await chefClient.request('POST', '/api/auth/signin', {
    email: chefUser.email,
    password: chefUser.password
  });
  console.log(`   HomeChef login status: ${chefLogin.status}`);
  if (chefLogin.status !== 200) throw new Error('Chef login failed');

  // 3️⃣ KITCHEN PROFILE MANAGEMENT
  console.log('\n3️⃣ CREATING / UPDATING KITCHEN PROFILE...');
  const shopRes = await chefClient.request('POST', '/api/shop/create-edit', {
    name: "Chef Amarpreet's Heritage Kitchen",
    city: "Amritsar",
    state: "Punjab",
    address: "Near Golden Temple, Katra Ahluwalia",
    specialty: "Authentic Amritsari Kulcha & slow-cooked Dal Makhani",
    experience: "15+ Years",
    bio: "Passing down generation-old clay tandoor secrets."
  });
  console.log(`   Shop created/updated. Status: ${shopRes.status}, Shop name: "${shopRes.data?.name}"`);
  if (shopRes.status !== 200 && shopRes.status !== 201) throw new Error('Failed to create shop');

  // 4️⃣ FOOD MANAGEMENT: ADD DISH
  console.log('\n4️⃣ FOOD MANAGEMENT - ADD DISH...');
  const addDishRes = await chefClient.request('POST', '/api/item/add', {
    name: `Heritage Amritsari Kulcha Platter ${timestamp}`,
    category: "Main Course",
    foodType: "veg",
    price: 180,
    spiceLevel: 2,
    preparationTime: "25-30 mins",
    servingSize: "1-2 persons",
    ingredients: "Maida, Spiced Potato filling, Anardana, Fresh Coriander, Desi Ghee",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop",
    description: "Flaky, multi-layered tandoori kulcha stuffed with spiced potatoes and anardana."
  });
  console.log(`   Dish created. Status: ${addDishRes.status}, Total items in shop: ${addDishRes.data?.items?.length || 0}`);
  if (addDishRes.status !== 200 && addDishRes.status !== 201) throw new Error('Failed to add dish');
  const createdDish = addDishRes.data.items[0];
  console.log(`   Created Dish ID: ${createdDish._id}, Name: "${createdDish.name}"`);

  // 5️⃣ FOOD MANAGEMENT: EDIT DISH & PRICE
  console.log('\n5️⃣ FOOD MANAGEMENT - EDIT DISH & PRICE...');
  const editDishRes = await chefClient.request('PUT', `/api/item/edit/${createdDish._id}`, {
    name: createdDish.name,
    category: createdDish.category,
    foodType: createdDish.foodType,
    price: 220, // Updated price
    description: "Flaky crisp tandoori kulcha with dollops of white makhan."
  });
  console.log(`   Dish edited. Status: ${editDishRes.status}`);
  const updatedDish = editDishRes.data.items.find(i => i._id === createdDish._id);
  console.log(`   New Price: ₹${updatedDish.price}`);
  if (updatedDish.price !== 220) throw new Error('Price update failed');

  // 6️⃣ FOOD MANAGEMENT: TOGGLE AVAILABILITY
  console.log('\n6️⃣ FOOD MANAGEMENT - AVAILABILITY TOGGLE...');
  // Toggle to Sold Out (false)
  const toggleOffRes = await chefClient.request('PUT', `/api/item/edit/${createdDish._id}`, {
    name: createdDish.name,
    category: createdDish.category,
    foodType: createdDish.foodType,
    price: 220,
    isAvailable: false
  });
  const dishOff = toggleOffRes.data.items.find(i => i._id === createdDish._id);
  console.log(`   Availability toggled: isAvailable=${dishOff.isAvailable}`);
  if (dishOff.isAvailable !== false) throw new Error('Failed to toggle availability to false');

  // Toggle back to Active (true)
  const toggleOnRes = await chefClient.request('PUT', `/api/item/edit/${createdDish._id}`, {
    name: createdDish.name,
    category: createdDish.category,
    foodType: createdDish.foodType,
    price: 220,
    isAvailable: true
  });
  const dishOn = toggleOnRes.data.items.find(i => i._id === createdDish._id);
  console.log(`   Availability toggled: isAvailable=${dishOn.isAvailable}`);
  if (dishOn.isAvailable !== true) throw new Error('Failed to toggle availability to true');
  console.log('   ✅ PASS: Availability toggle operational!');

  // 7️⃣ CUSTOMER ORDERS FROM HOMECHEF
  console.log('\n7️⃣ CUSTOMER PLACING ORDER TO HOMECHEF...');
  await customerClient.request('DELETE', '/api/cart/clear');
  await customerClient.request('POST', '/api/cart/add', {
    itemId: createdDish._id,
    name: createdDish.name,
    price: 220,
    quantity: 2,
    chef: shopRes.data?.name || "Chef Amarpreet"
  });
  const placeOrderRes = await customerClient.request('POST', '/api/order/place', {
    paymentMethod: 'cod',
    deliveryAddress: 'Flat 501, Heritage Enclave, Amritsar'
  });
  console.log(`   Customer order placed. Status: ${placeOrderRes.status}`);
  if (placeOrderRes.status !== 201) throw new Error('Customer failed to place order');
  const placedOrder = placeOrderRes.data[0];
  console.log(`   Placed Order ID: ${placedOrder._id}, Status: "${placedOrder.status}"`);

  // 8️⃣ ORDER MANAGEMENT: 4-STAGE WORKFLOW (Pending -> Confirmed -> Preparing -> Delivered)
  console.log('\n8️⃣ ORDER MANAGEMENT - 4-STAGE WORKFLOW (Pending -> Confirmed -> Preparing -> Delivered)...');
  const chefOrdersRes = await chefClient.request('GET', '/api/order/chef-orders');
  console.log(`   Chef retrieved orders. Count: ${chefOrdersRes.data?.length || 0}`);
  const orderToProcess = chefOrdersRes.data.find(o => o._id === placedOrder._id);
  if (!orderToProcess) throw new Error('Order not found in chef orders list');
  console.log(`   Initial Status: ${orderToProcess.status}`);

  // Transition 1: Confirmed
  const confirmRes = await chefClient.request('PUT', `/api/order/update-status/${placedOrder._id}`, { status: 'confirmed' });
  console.log(`   Stage 1: Confirmed -> Status: ${confirmRes.data?.status}`);
  if (confirmRes.data?.status !== 'confirmed') throw new Error('Failed to advance to confirmed');

  // Transition 2: Preparing
  const prepRes = await chefClient.request('PUT', `/api/order/update-status/${placedOrder._id}`, { status: 'preparing' });
  console.log(`   Stage 2: Preparing -> Status: ${prepRes.data?.status}`);
  if (prepRes.data?.status !== 'preparing') throw new Error('Failed to advance to preparing');

  // Transition 3: Delivered
  const deliverRes = await chefClient.request('PUT', `/api/order/update-status/${placedOrder._id}`, { status: 'delivered' });
  console.log(`   Stage 3: Delivered -> Status: ${deliverRes.data?.status}`);
  if (deliverRes.data?.status !== 'delivered') throw new Error('Failed to advance to delivered');
  console.log('   ✅ PASS: Complete 4-stage order lifecycle verified!');

  // 9️⃣ BASIC ANALYTICS & DASHBOARD METRICS
  console.log('\n9️⃣ HOMECHEF ANALYTICS & DASHBOARD METRICS...');
  const analyticsRes = await chefClient.request('GET', '/api/order/chef-analytics');
  console.log(`   Analytics HTTP Status: ${analyticsRes.status}`);
  if (analyticsRes.status !== 200) throw new Error('Failed to fetch analytics');

  const a = analyticsRes.data;
  console.log(`   📊 Total Orders: ${a.totalOrders}`);
  console.log(`   📊 Today's Orders: ${a.todaysOrders}`);
  console.log(`   📊 Revenue: ₹${a.revenue}`);
  console.log(`   📊 Average Rating: ${a.averageRating} ★`);
  console.log(`   📊 Active Dishes: ${a.activeDishes}`);
  console.log(`   📊 Pending Orders: ${a.pendingOrders}`);
  console.log(`   📊 Best-Selling Dishes: ${a.bestSellingDishes?.length || 0} ranked`);
  console.log(`   📊 Recent Orders: ${a.recentOrders?.length || 0} items`);

  if (a.totalOrders < 1) throw new Error('Total orders count should be at least 1');
  if (a.revenue <= 0) throw new Error('Revenue should be greater than 0');
  if (a.activeDishes < 1) throw new Error('Active dishes count should be at least 1');
  console.log('   ✅ PASS: Analytics metrics match live operations!');

  // 🔟 FOOD MANAGEMENT: DELETE DISH
  console.log('\n🔟 FOOD MANAGEMENT - DELETE DISH...');
  // Add temporary test dish to delete
  const tempDishRes = await chefClient.request('POST', '/api/item/add', {
    name: "Temporary Test Item",
    category: "Snacks",
    price: 99
  });
  const tempItem = tempDishRes.data.items[0];
  console.log(`   Added temporary item: ${tempItem._id}`);

  const deleteRes = await chefClient.request('DELETE', `/api/item/delete/${tempItem._id}`);
  console.log(`   Delete response status: ${deleteRes.status}`);
  const remainingIds = deleteRes.data.items.map(i => i._id.toString());
  if (remainingIds.includes(tempItem._id.toString())) {
    throw new Error('Dish still exists after deletion!');
  }
  console.log('   ✅ PASS: Dish successfully deleted from kitchen catalog!');

  console.log('\n====================================================');
  console.log('🎉 ALL 10 HOMECHEF WORKFLOW & RBAC TESTS PASSED 100%!');
  console.log('====================================================\n');
}

runHomeChefWorkflowTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
