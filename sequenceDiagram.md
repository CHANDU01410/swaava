# Sequence Diagram — Swaava

## Main Flow: End-to-End Order Placement (Customer Browses → Selects Food → Places Order → Payment → Notification)

This sequence diagram illustrates the complete lifecycle of an order — from a customer browsing food by region, adding items to cart, placing an order, through to payment processing and notification delivery.

---

```mermaid
sequenceDiagram
    actor C as Customer
    participant FE as Frontend (React)
    participant API as API Gateway
    participant Auth as Auth Controller
    participant FC as Food Controller
    participant FS as Food Service
    participant OC as Order Controller
    participant OS as Order Service
    participant CS as Cart Service
    participant DB as MongoDB



    C ->> FE: Open Swaava App
    FE ->> API: POST /api/auth/login (email, password)
    API ->> Auth: handleLogin(credentials)
    Auth ->> DB: Find user by email
    DB -->> Auth: User document
    Auth ->> Auth: Verify password (bcrypt.compare)
    Auth ->> Auth: Generate JWT Token (userId, role: CUSTOMER)
    Auth -->> API: 200 OK { token, user }
    API -->> FE: Login successful
    FE -->> C: Redirect to Customer Dashboard



    C ->> FE: Select Region "Tamil Nadu"
    FE ->> API: GET /api/food?region=tamil_nadu
    API ->> Auth: Validate JWT Token
    Auth -->> API: Token Valid (userId, role: CUSTOMER)
    API ->> FC: getFoodByRegion("tamil_nadu")
    FC ->> FS: findByRegion("tamil_nadu")
    FS ->> DB: SELECT food_items WHERE region = "tamil_nadu"
    DB -->> FS: List of food items
    FS -->> FC: FoodItem[] (filtered by region)
    FC -->> API: 200 OK { foods }
    API -->> FE: Food items list
    FE -->> C: Display Tamil Nadu food items



    C ->> FE: Click "Add to Cart" on Masala Dosa
    FE ->> API: POST /api/cart/add { foodItemId, quantity: 2 }
    API ->> Auth: Validate JWT Token
    Auth -->> API: Token Valid (userId)
    API ->> CS: addToCart(userId, foodItemId, quantity)
    CS ->> DB: Find or create cart for userId
    DB -->> CS: Cart document
    CS ->> DB: UPSERT cart item (foodItemId, qty: 2)
    DB -->> CS: Cart updated
    CS -->> API: 200 OK { cart }
    API -->> FE: Cart updated
    FE -->> C: "Masala Dosa x2 added to cart"

    C ->> FE: Click "Add to Cart" on Filter Coffee
    FE ->> API: POST /api/cart/add { foodItemId, quantity: 1 }
    API ->> CS: addToCart(userId, foodItemId, quantity)
    CS ->> DB: UPSERT cart item (foodItemId, qty: 1)
    DB -->> CS: Cart updated
    CS -->> API: 200 OK { cart }
    API -->> FE: Cart updated
    FE -->> C: "Filter Coffee x1 added to cart"



    C ->> FE: Click "Place Order"
    FE ->> API: POST /api/orders { cartId, deliveryAddress, paymentMethod }
    API ->> Auth: Validate JWT Token
    Auth -->> API: Token Valid (userId, role: CUSTOMER)
    API ->> OC: placeOrder(orderDto)
    OC ->> OS: createOrder(userId, cartId, deliveryAddress)

    Note right of OS: Order Validation (Chain of Responsibility)<br/>Validators: CartNotEmpty →<br/>ItemsAvailable → AddressValid →<br/>ChefActiveValidator

    OS ->> OS: Validate order (Chain of Responsibility)
    OS ->> DB: SELECT cart items with food details
    DB -->> OS: Cart items with pricing
    OS ->> OS: Calculate order total

    OS ->> DB: BEGIN TRANSACTION
    OS ->> DB: INSERT INTO orders (userId, items, total, status: PLACED)
    DB -->> OS: Order created (orderId)
    OS ->> DB: INSERT INTO order_items (orderId, foodItemId, qty, price)
    DB -->> OS: Order items created






    OS ->> DB: UPDATE orders SET status = CONFIRMED, paymentId
    DB -->> OS: Order confirmed
    OS ->> DB: DELETE cart items (clear cart)
    DB -->> OS: Cart cleared
    OS ->> DB: COMMIT TRANSACTION

    OS -->> OC: Order confirmed (orderId)
    OC -->> API: 201 Created { orderId, status: CONFIRMED }
    API -->> FE: Order confirmation
    FE -->> C: "Order placed successfully! Order #12345"



    FE -->> C: "Your order #12345 is confirmed!"





    DB -->> NS: Order details

    OS ->> DB: UPDATE orders SET status = PREPARING
    FE -->> C: "Your order is being prepared!"

    OS ->> DB: UPDATE orders SET status = READY
    FE -->> C: "Your order is ready!"

    OS ->> DB: UPDATE orders SET status = DELIVERED
    FE -->> C: "Your order has been delivered! Rate your chef."
```

---

## Flow Summary
| Phase                   | Description                                                                                                   | Key Patterns Used                   |
|-------------------------|---------------------------------------------------------------------------------------------------------------|-------------------------------------|
| **1. Authentication**   | Customer logs in with email/password. JWT token generated and returned for subsequent authenticated requests. | Singleton (DB connection)           |
| **2. Browse by Region**  | Customer selects a region. Food items from that region are fetched and displayed dynamically.                   | Repository, Builder (query)         |
| **3. Add to Cart**      | Customer adds food items to their cart. Cart is persisted in the database per user.                           | Repository                          |
| **4. Place Order**      | Cart is converted to an order. Validated through a chain of validators. Order and items stored in DB.        | Chain of Responsibility, Factory    |
| **5. Payment**          | Payment processed based on selected method. Simulated payment gateway confirms transaction.                  | Strategy Pattern                    |
| **6. Notifications**    | Both chef and customer receive notifications about the new order and confirmation.                           | Observer Pattern                    |
| **7. Status Updates**   | Chef updates order status through lifecycle. Customer receives real-time status notifications.                | State Pattern, Observer             |
