# ER Diagram — Swaava

## Overview
This Entity-Relationship diagram shows the database schema for the Swaava platform. All tables, columns, types, and relationships are defined below.

---

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar phone
        enum role "CUSTOMER, HOMECHEF, ADMIN"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS {
        uuid id PK
        uuid user_id FK
        varchar delivery_address
        text favorite_chefs "JSON array"
        int order_count
        timestamp created_at
        timestamp updated_at
    }

    HOMECHEFS {
        uuid id PK
        uuid user_id FK
        uuid region_id FK
        text specialties "JSON array"
        text bio
        boolean is_approved
        decimal average_rating
        int total_orders
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }

    REGIONS {
        uuid id PK
        varchar name UK
        text description
        text famous_dishes "JSON array"
        varchar image_url
        timestamp created_at
    }

    FOOD_ITEMS {
        uuid id PK
        varchar name
        text description
        decimal price
        varchar image_url
        varchar category
        boolean is_veg
        boolean is_available
        uuid chef_id FK
        uuid region_id FK
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        uuid chef_id FK
        decimal total_amount
        enum status "PLACED, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED"
        varchar delivery_address
        uuid payment_id FK
        uuid region_id FK
        timestamp placed_at
        timestamp delivered_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid food_item_id FK
        varchar food_name
        int quantity
        decimal price_per_unit
        decimal subtotal
    }

    CART {
        uuid id PK
        uuid customer_id FK
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid food_item_id FK
        int quantity
        decimal price_per_unit
        decimal subtotal
    }

    REVIEWS {
        uuid id PK
        uuid customer_id FK
        uuid chef_id FK
        uuid order_id FK
        int rating "1 to 5"
        text comment
        timestamp created_at
        timestamp updated_at
    }

    %% ===== RELATIONSHIPS =====

    USERS ||--o| CUSTOMERS : "has profile"
    USERS ||--o| HOMECHEFS : "has profile"

    CUSTOMERS ||--o| CART : "has one"
    CUSTOMERS ||--o{ ORDERS : "places"
    CUSTOMERS ||--o{ REVIEWS : "writes"

    HOMECHEFS ||--o{ FOOD_ITEMS : "lists"
    HOMECHEFS ||--o{ ORDERS : "receives"
    HOMECHEFS ||--o{ REVIEWS : "receives"

    HOMECHEFS }o--|| REGIONS : "native of"

    REGIONS ||--o{ FOOD_ITEMS : "categorizes"

    ORDERS ||--o{ ORDER_ITEMS : "contains"

    CART ||--o{ CART_ITEMS : "contains"
    CART_ITEMS }o--|| FOOD_ITEMS : "references"

    ORDER_ITEMS }o--|| FOOD_ITEMS : "references"


    ORDERS }o--|| REGIONS : "from state"
```

---

## Table Summary
| Table            | Description                                                              | Key Relationships                           |
|------------------|--------------------------------------------------------------------------|---------------------------------------------|
| `USERS`          | All platform users (customers, home chefs, admins)                       | → Customer, HomeChef, Notifications          |
| `CUSTOMERS`      | Customer-specific profile data (extends User)                            | ← User (1:1), → Cart, Orders, Reviews       |
| `HOMECHEFS`      | Chef-specific profile with state, approval status                        | ← User (1:1), → FoodItems, Orders, Reviews  |
| `REGIONS`         | Indian states (e.g., Punjab, Tamil Nadu, West Bengal)                    | → FoodItems, HomeChefs                        |
| `FOOD_ITEMS`     | Food listings by home chefs with pricing and availability                | ← HomeChef, State                             |
| `ORDERS`         | Customer orders with status and delivery info                            | ← Customer, Chef → OrderItems, Payment       |
| `ORDER_ITEMS`    | Individual items within an order with quantity and pricing                | ← Order, → FoodItem                          |
| `CART`           | Shopping cart per customer                                               | ← Customer (1:1), → CartItems                |
| `CART_ITEMS`     | Items in the cart referencing food items                                  | ← Cart, → FoodItem                           |
| `REVIEWS`        | Customer ratings and reviews for chefs (one per order)                   | ← Customer, Chef, Order                      |

---

## Key Indexes
| Table          | Index                                    | Purpose                              |
|----------------|------------------------------------------|--------------------------------------|
| `FOOD_ITEMS`   | `(region_id, is_available)`               | Fast state-based food browsing       |
| `FOOD_ITEMS`   | `(chef_id, is_available)`                | Chef's active food listings          |
| `ORDERS`       | `(customer_id, status)`                  | Customer order history               |
| `ORDERS`       | `(chef_id, status)`                      | Chef incoming orders                 |
| `HOMECHEFS`    | `(region_id, is_approved)`                | Find approved chefs by state         |
| `REVIEWS`      | `(chef_id, rating)`                      | Chef rating aggregation              |
