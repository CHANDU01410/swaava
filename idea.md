# Swaava — HomeCook Connect Platform

## Overview
**Swaava** is a full-stack application that connects customers with home chefs region-wise across India. The platform enables customers to discover and order authentic, homemade food based on individual Indian regions (e.g., Punjab, Tamil Nadu, West Bengal, Kerala, Gujarat). Home chefs — verified local cooks who prepare traditional cuisines — can register on the platform, list their food items categorized by their native region, set pricing, and manage incoming orders.

The system provides two distinct dashboards:
1. **Customer Dashboard** — Browse food by region, manage cart, place orders, and rate chefs.
2. **HomeChef Dashboard** — Manage food listings, view and update orders, and track performance.

An **Admin** role oversees the platform — approving new chefs, managing users, and monitoring all orders.

---

## Problem Regionment
1. **Lack of visibility for home chefs** — Talented home cooks across India have no centralized digital platform to showcase their authentic regional cuisines to a wider audience.
2. **Inaccessible regional food** — Customers craving authentic food from specific Indian regions (e.g., Bengali sweets, Rajasthani dal baati, Kerala appams) struggle to find local home chefs who prepare these dishes.
3. **No trust or verification** — Without a verification and review system, customers cannot assess the quality or reliability of home chefs.
4. **Fragmented discovery** — Existing food delivery platforms focus on restaurants, not home-cooked food. Home chefs rely on word-of-mouth or social media, limiting their reach.
5. **No region-based filtering** — Customers wanting food from a specific region have no structured way to search and filter based on geographic cuisine categories.

---

## Proposed Solution
**Swaava** solves these problems by creating a **region-centric food marketplace** that:
- Organizes all food by **individual Indian regions** (e.g., Punjab, Tamil Nadu, West Bengal, Kerala, Gujarat, Maharashtra).
- Allows **home chefs** to register, get verified by admins, and list their food items under their native region.
- Provides **customers** with powerful browsing and filtering tools to find authentic food from any Indian region.
- Implements a **review and rating system** so customers can rate chefs, building trust and accountability.
- Uses a **layered backend architecture** with OOP principles for clean, maintainable, and scalable code.
- Enforces **JWT-based authentication** and **role-based access control** (Customer, HomeChef, Admin) for security.

---

## Scope

### In Scope
- User registration and authentication (Customer, HomeChef, Admin roles)
- HomeChef onboarding with admin approval workflow
- Region-based food categorization and browsing
- Food item management (CRUD) for home chefs
- Cart management and order placement for customers
- Order lifecycle management (placed → confirmed → preparing → delivered)
- Customer reviews and chef ratings
- Customer Dashboard with order history, cart, and region-based browsing
- HomeChef Dashboard with food management and order tracking
- Admin panel for user management, chef approval, and order monitoring
- RESTful API with layered architecture (Controller → Service → Repository)
- JWT Authentication with Role-Based Access Control (RBAC)

### Out of Scope (for Milestone 1)
- Real payment gateway integration (simulated transactions)
- Live order tracking with GPS
- Mobile application (web-only for now)
- Chat/messaging between customer and chef
- Delivery partner integration

---

## Key Features

### 1. Region-Based Food Discovery
- **Region Categories**: Food organized by individual Indian regions (e.g., Punjab, Tamil Nadu, West Bengal, Kerala, Gujarat, Maharashtra, Rajasthan, UP, Bihar, Odisha).
- **Region Browsing**: Browse food items from any region across India with dedicated region pages.
- **Food Browsing**: Rich food cards with images, descriptions, pricing, chef info, and region tags.
- **Search**: Search food items by name, cuisine type, or chef name.

### 2. HomeChef Management
- **Chef Registration**: Home chefs register with their profile, native region, and specialties.
- **Admin Approval**: New chefs go through an admin verification process before listing food.
- **Food CRUD**: Chefs can add, update, and delete food items from their dashboard.
- **Order Management**: Chefs view incoming orders and update order status (confirmed → preparing → ready → delivered).

### 3. Customer Experience
- **Browse by Region**: Customers navigate food by region for authentic discovery.
- **Cart System**: Add multiple items to cart, adjust quantities, and proceed to checkout.
- **Order Placement**: Place orders with delivery details and simulated payment.
- **Order History**: View all past and current orders with status tracking.
- **Rate & Review**: Rate chefs and leave reviews after order delivery.

### 4. Admin Panel
- **Chef Approval**: Review and approve/reject new HomeChef registrations.
- **User Management**: View, activate, or deactivate users across all roles.
- **Order Monitoring**: View all platform orders with filters by status, region, and date.

### 5. Authentication & Security
- **JWT Tokens**: Regionless authentication using JSON Web Tokens.
- **Role-Based Access**: Middleware enforcing access based on user role (Customer, HomeChef, Admin).
- **Password Hashing**: Secure password storage using bcrypt.
- **Protected Routes**: All sensitive endpoints require valid JWT and appropriate role.

### 6. Notification System
- **Order Notifications**: Chefs notified on new orders; customers notified on status updates.
- **Approval Notifications**: Chefs notified when their registration is approved/rejected.

---

## Tech Stack
| Layer          | Technology                                        |
|----------------|---------------------------------------------------|
| **Frontend**   | React.js, React Router, Axios                     |
| **Backend**    | Node.js (Express), TypeScript                     |
| **Database**   | MongoDB (Mongoose ODM)                            |
| **Auth**       | JWT + RBAC (Role-Based Access Control)             |
| **API**        | RESTful API                                        |
| **Styling**    | CSS / Material UI                                  |
| **Testing**    | Jest, Supertest                                    |
| **DevOps**     | Docker, GitHub Actions CI/CD                       |

---

## Backend Architecture Approach
- **Clean Layered Architecture**: Controllers → Services → Repositories separation
- **OOP Principles**: Encapsulation, Abstraction, Inheritance, Polymorphism throughout the domain model
- **Repository Pattern**: Data access abstracted behind repository interfaces
- **DTO Pattern**: Data Transfer Objects for clean data flow between layers
- **Middleware Pipeline**: Authentication middleware → Role authorization middleware → Controller
- **Error Handling**: Centralized error handling with custom exception classes
- **SOLID Principles** adherence across all modules

---

## Design Patterns Used
| Pattern                    | Where Applied                                      | Purpose                                                           |
|----------------------------|----------------------------------------------------|-------------------------------------------------------------------|
| **Strategy**               | Pricing strategies, food filtering algorithms      | Swap filtering/pricing logic at runtime based on region            |
| **Observer**               | Notification system for order events               | Decouple order events from notification delivery                  |
| **Factory**                | User creation (Customer, HomeChef, Admin)           | Create appropriate user type based on registration role           |
| **State**                  | Order lifecycle (Placed → Confirmed → Preparing → Delivered) | Manage order status transitions cleanly               |
| **Chain of Responsibility**| Order validation pipeline                          | Validate orders through sequential validators                     |
| **Repository**             | Data access layer for all entities                 | Abstract database operations from business logic                  |
| **Builder**                | Complex query building for food search/filter      | Build dynamic queries for region/food filtering                    |
| **Template Method**        | Order processing workflow                          | Define order processing steps with customizable sub-steps         |
| **Singleton**              | Database connection, Logger                        | Ensure single instance for shared resources                       |

---

## User Roles
| Role          | Description                                                                  |
|---------------|------------------------------------------------------------------------------|
| **Customer**  | Browses food by region, adds to cart, places orders, rates chefs.             |
| **HomeChef**  | Registers, gets approved, lists food items, manages orders.                  |
| **Admin**     | Approves chefs, manages users, monitors all orders, platform configuration.  |

---

## Future Enhancements
1. **Real Payment Gateway** — Integration with Razorpay/Stripe for actual payment processing.
2. **Live Order Tracking** — Real-time GPS-based delivery tracking.
3. **Mobile Application** — React Native app for iOS and Android.
4. **Chat System** — In-app messaging between customers and home chefs.
5. **Delivery Partner Integration** — Partner with local delivery services for last-mile delivery.
6. **AI-Based Recommendations** — Personalized food recommendations based on order history and preferences.
7. **Multi-Language Support** — Regional language support for wider accessibility across India.
8. **Subscription Plans** — Monthly meal subscription plans from favorite home chefs.
9. **Analytics Dashboard** — Advanced analytics for chefs (sales trends, popular items, customer demographics).
10. **Loyalty Program** — Reward points for frequent customers with discounts and offers.
