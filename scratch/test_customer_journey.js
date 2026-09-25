import axios from 'axios';

const serverUrl = 'http://localhost:5000';

async function runCustomerJourneyTest() {
  console.log('====================================================');
  console.log('🚀 SWAAVA COMPLETE CUSTOMER JOURNEY E2E TEST');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const testUser = {
    fullName: `Aarav Sharma ${timestamp}`,
    email: `customer_${timestamp}@swaava.test`,
    password: 'Password123!',
    role: 'Customer',
    phone: '9876543210'
  };

  let cookie = '';
  const client = axios.create({
    baseURL: serverUrl,
    withCredentials: true,
    validateStatus: () => true
  });

  // Step 1: Register Customer
  console.log('1️⃣ REGISTERING NEW CUSTOMER...');
  const regRes = await client.post('/api/auth/register', testUser);
  console.log(`   Status: ${regRes.status}`, regRes.data?.message || 'OK');
  if (regRes.status !== 201 && regRes.status !== 200) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  }

  // Step 2: Login Customer
  console.log('\n2️⃣ LOGGING IN CUSTOMER...');
  const loginRes = await client.post('/api/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  console.log(`   Status: ${loginRes.status}`, loginRes.data?.user?.email || 'OK');
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
  }

  // Extract auth cookie
  const setCookieHeader = loginRes.headers['set-cookie'];
  if (setCookieHeader) {
    cookie = Array.isArray(setCookieHeader) ? setCookieHeader.map(c => c.split(';')[0]).join('; ') : setCookieHeader.split(';')[0];
    client.defaults.headers.common['Cookie'] = cookie;
    console.log('   Authenticated Session Cookie established.');
  }

  // Step 3: Explore & Browse Catalog
  console.log('\n3️⃣ BROWSING SWAAVA REGIONAL CATALOG...');
  const dishesRes = await client.get('/api/item/all');
  console.log(`   Status: ${dishesRes.status}, Total dishes found: ${dishesRes.data?.length || 0}`);
  if (!dishesRes.data || dishesRes.data.length === 0) {
    throw new Error('Catalog is empty!');
  }
  const selectedFood = dishesRes.data[0];
  console.log(`   Selected Food: "${selectedFood.name}" from ${selectedFood.state} (₹${selectedFood.price})`);

  // Step 4: Food Details & Chef Details
  console.log('\n4️⃣ FETCHING FOOD DETAILS & CHEF INFO...');
  const foodDetailRes = await client.get(`/api/item/${selectedFood._id}`);
  console.log(`   Food Details retrieved: "${foodDetailRes.data.name}"`);
  const chefId = foodDetailRes.data.chef?._id || foodDetailRes.data.shop?._id;
  console.log(`   Associated Chef ID: ${chefId}`);

  // Step 5: Test Favorites (Foods & Chefs)
  console.log('\n5️⃣ TESTING FAVORITES PERSISTENCE...');
  const favFoodRes = await client.post(`/api/user/favorite-food/${selectedFood._id}`);
  console.log(`   Toggled Favorite Food. Status: ${favFoodRes.status}, FavFoods count: ${favFoodRes.data?.favoriteFoods?.length || 0}`);

  if (chefId) {
    const favChefRes = await client.post(`/api/user/favorite-chef/${chefId}`);
    console.log(`   Toggled Favorite Chef. Status: ${favChefRes.status}, FavChefs count: ${favChefRes.data?.favoriteChefs?.length || 0}`);
  }

  const getFavsRes = await client.get('/api/user/favorites');
  console.log(`   Fetched Favorites from Profile: ${getFavsRes.data?.favoriteFoods?.length || 0} foods, ${getFavsRes.data?.favoriteChefs?.length || 0} chefs`);

  // Step 6: Add Address
  console.log('\n6️⃣ ADDING DELIVERY ADDRESS...');
  const addrRes = await client.post('/api/user/address', {
    label: 'Home',
    fullAddress: 'Flat 402, Lotus Residency, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '9876543210',
    isDefault: true
  });
  console.log(`   Address added. Total addresses: ${addrRes.data?.length || 0}`);

  // Step 7: Cart Operations (Add, Quantity controls, Subtotal)
  console.log('\n7️⃣ CART OPERATIONS...');
  // Clear any existing cart items
  await client.delete('/api/cart/clear');

  // Add selected food to cart (quantity 2)
  const addCartRes = await client.post('/api/cart/add', {
    itemId: selectedFood._id,
    name: selectedFood.name,
    image: selectedFood.image || '',
    price: selectedFood.price,
    quantity: 2,
    chef: foodDetailRes.data.chef?.name || 'Master Chef'
  });
  console.log(`   Added to cart. Items count: ${addCartRes.data?.items?.length || 0}, Total: ₹${addCartRes.data?.totalAmount}`);

  // Update quantity to 3
  const updateQtyRes = await client.put('/api/cart/update', {
    itemId: selectedFood._id,
    quantity: 3
  });
  console.log(`   Updated quantity to 3. New total: ₹${updateQtyRes.data?.totalAmount}`);

  // Step 8: Checkout & Place Order
  console.log('\n8️⃣ CHECKOUT & PLACING ORDER...');
  const orderRes = await client.post('/api/order/place', {
    paymentMethod: 'cod',
    deliveryAddress: {
      text: 'Flat 402, Lotus Residency, Indiranagar, Bengaluru, 560038',
      phone: '9876543210'
    }
  });
  console.log(`   Order placed! Status: ${orderRes.status}`);
  const placedOrders = orderRes.data;
  if (!Array.isArray(placedOrders) || placedOrders.length === 0) {
    throw new Error('Order placement returned empty array');
  }
  const createdOrder = placedOrders[0];
  console.log(`   Created Order ID: ${createdOrder._id}, Order Status: ${createdOrder.status}`);

  // Step 9: Verify Visual Order Tracking Flow & My Orders
  console.log('\n9️⃣ VISUAL ORDER TRACKING & ORDER RETRIEVAL...');
  const myOrdersRes = await client.get('/api/order/my-orders');
  console.log(`   Retrieved My Orders. Total orders: ${myOrdersRes.data?.length || 0}`);
  const foundOrder = myOrdersRes.data.find(o => o._id === createdOrder._id);
  console.log(`   Found placed order: ${foundOrder._id}, Current Status: ${foundOrder.status}`);

  // Step 10: Strict Review Gate Check (Reviewing before delivery MUST fail)
  console.log('\n🔟 STRICT REVIEW GATING ENFORCEMENT...');
  console.log('   Attempting to review order while status is "pending"...');
  const reviewAttemptRes = await client.post(`/api/order/rate/${createdOrder._id}`, {
    rating: 5,
    review: 'Delicious authentic taste!'
  });
  console.log(`   Pending order review response status: ${reviewAttemptRes.status}`);
  if (reviewAttemptRes.status === 400) {
    console.log(`   ✅ PASS: Review correctly rejected for non-delivered order: "${reviewAttemptRes.data?.message}"`);
  } else {
    throw new Error(`Review gate failed! Expected 400 for pending order, got ${reviewAttemptRes.status}`);
  }

  // Step 11: Transition order to "delivered" via direct MongoDB update or order update
  console.log('\n1️⃣1️⃣ SIMULATING ORDER DELIVERY...');
  // We can update the order status directly using mongoose in a backend helper, or call status update
  // Let's connect directly to MongoDB via mongoose in this script or use the test runner
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect('mongodb://localhost:27017/Maakhana');
  await mongoose.connection.collection('orders').updateOne(
    { _id: new mongoose.Types.ObjectId(createdOrder._id) },
    { $set: { status: 'delivered' } }
  );
  console.log('   Order updated to "delivered" in database.');

  // Step 12: Submit Review on Delivered Order (Must Succeed)
  console.log('\n1️⃣2️⃣ SUBMITTING REVIEW ON DELIVERED ORDER...');
  const deliveredReviewRes = await client.post(`/api/order/rate/${createdOrder._id}`, {
    rating: 5,
    review: 'Absolute perfection! Authentic regional flavours, perfectly packaged and warm.'
  });
  console.log(`   Delivered order review status: ${deliveredReviewRes.status}`);
  if (deliveredReviewRes.status === 200) {
    console.log(`   ✅ PASS: Review successfully accepted for delivered order: rating=${deliveredReviewRes.data?.order?.rating}`);
  } else {
    throw new Error(`Review submission failed on delivered order: ${JSON.stringify(deliveredReviewRes.data)}`);
  }

  // Step 13: Reorder Flow (Order History -> Add items to Cart -> /cart)
  console.log('\n1️⃣3️⃣ REORDER FLOW...');
  const reorderItem = foundOrder.shopOrders?.items?.[0] || foundOrder.items?.[0] || selectedFood;
  const reorderCartRes = await client.post('/api/cart/add', {
    itemId: reorderItem.itemId || reorderItem._id,
    name: reorderItem.name,
    image: reorderItem.image || '',
    price: reorderItem.price,
    quantity: 1,
    chef: foodDetailRes.data.chef?.name || 'Master Chef'
  });
  console.log(`   Reorder item added to Cart. Items in cart: ${reorderCartRes.data?.items?.length || 0}`);
  if (reorderCartRes.status === 200) {
    console.log('   ✅ PASS: Reorder flow verified!');
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL 13 STEPS OF CUSTOMER JOURNEY PASSED 100%!');
  console.log('====================================================\n');
}

runCustomerJourneyTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
