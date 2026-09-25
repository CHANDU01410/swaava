# Swaava - HomeCook Connect Platform

**LIVE PROJECT LINK:** [https://swaava-food.vercel.app](https://swaava-food.vercel.app)

**Swaava** is a premium full-stack application that connects customers with home chefs state-wise across India. Discover authentic, homemade food from various states, prepared by verified local cooks!

## Engineering Excellence & Quality Standards
- **System Documentation**: All major design artifacts are included in our repository. You will find the project scope in `idea.md`, the interaction flows in `useCaseDiagram.md`, our end-to-end main flow in `sequenceDiagram.md`, our structured design in `classDiagram.md`, and tables mapping in `ErDiagram.md`.
- **Backend Configuration & OOP**: The backend utilizes robust Object-Oriented Programming (OOP) principles to ensure encapsulation, abstraction, and modularity. We strongly enforce a clear separation of concerns by splitting logic into independent controllers, services, and repositories to guarantee a well-structured and maintainable backend code.
- **Frontend Quality**: Our web application prioritizes a clean UI structure and usability. The React codebase features logical component organization and clarity, ensuring proper integration with backend APIs to deliver a faultless live experience. Everything is hosted and verifiable via the LIVE PROJECT LINK above.

---

## Table of Contents
- [Overview](#overview)
- [Problem & Solution](#problem--solution)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Architecture & Diagrams](#architecture--diagrams)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Future Enhancements](#future-enhancements)

---

## Overview
The platform provides a decentralized marketplace for home chefs to showcase their native cuisines. Customers can browse food specific to Indian states, manage their cart, and place orders directly to the home chefs.

It provides customized dashboards for:
- **Customers**
- **HomeChefs**
- **Admins**

---

## Problem & Solution
**The Problem**: Lack of visibility for home chefs, fragmented regional food discovery, and a missing trust layer for authentic home-cooked meals.
**Our Solution**: A **state-centric food marketplace** with admin verification, layered backend architecture with robust object-oriented patterns, and secure JWT-based RBAC.

---

## Key Features
### State-Based Discovery
- Food is heavily categorized by individual Indian states.
- Rich discovery interfaces, state pages, and advanced search filters.

### HomeChef Empowered
- Chef registration with dedicated admin-approved native state specialties.
- Dashboard for food operations (CRUD) and live order tracking.

### Customer Experience
- Browse authenticate state menus, scalable cart system, and order lifecycle management.
- Post-delivery rating and review mechanics.

### Security & Admin
- Fully stateless JWT auth with Role-Based Access Control (RBAC).
- Admin panel for comprehensive monitoring, approvals, and metrics.

---

## User Roles
| Role          | Capabilities                                                                 |
|---------------|------------------------------------------------------------------------------|
| **Customer**  | Browse by state, add to cart, order tracking, review chefs.                  |
| **HomeChef**  | Register (requires approval), list food items, oversee incoming orders.      |
| **Admin**     | Top-level oversight, approve/reject chefs, oversee users, and orders.        |

---

## Tech Stack
- **Language**: TypeScript (Strict Typing)
- **Frontend**: React.js with TypeScript, Vite, TailwindCSS / Material UI, Axios, React Router Dom
- **Backend**: Node.js with TypeScript, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JSON Web Tokens (JWT)
- **Architecture**: Strict Object-Oriented Programming (OOP) & Layered Architecture (Controller > Service > Repository)

---

## Architecture & Diagrams
This project heavily emphasizes clean structure and OOP principles. Please refer to our detailed design documents:
- [System Idea & Details](./idea.md)
- [Class Diagram](./classDiagram.md)
- [ER Diagram](./ErDiagram.md)
- [Use Case Diagram](./useCaseDiagram.md)
- [Sequence Diagram](./sequenceDiagram.md)

---

## Software Architecture

### Clean Architecture & Domain-Driven Design (DDD)

Swaava strictly follows **Clean Architecture** and **Domain-Driven Design** principles to keep the codebase decoupled, testable, and scalable.

```
Request → Controller → Service → Domain → Repository → Database
```

| Layer | Responsibility | Example Files |
|---|---|---|
| **Controllers** | Handle HTTP requests, validate inputs, delegate to services | `AuthController.ts`, `OrderController.ts` |
| **Services** | Core business logic, orchestrate domain rules | `AuthService.ts`, `OrderService.ts` |
| **Domain / Models** | Domain entities and business rules | `User.ts`, `FoodItem.ts`, `Order.ts` |
| **Repositories** | Abstract data access, interact with MongoDB | `UserRepository.ts`, `OrderRepository.ts` |

> Each layer **only depends on the layer below it** — never the other way around. This enforces separation of concerns and makes units independently testable.

---

### Object-Oriented Programming (OOP)

The entire backend is built with strict OOP principles in TypeScript:

| OOP Pillar | Implementation |
|---|---|
| **Encapsulation** | Each class manages its own state and exposes only what is necessary via public methods. Internal logic is kept private. |
| **Abstraction** | Services expose clean interfaces to controllers without revealing implementation details (DB queries, hashing, token logic). |
| **Inheritance** | Shared logic (e.g., base repository patterns) is extended by specialized repositories to avoid code duplication. |
| **Polymorphism** | Strategy and State patterns allow objects to behave differently depending on role/state without modifying the calling code. |

---

### Design Patterns

Six industry-standard design patterns are applied throughout the codebase:

| Pattern | Where Used |
|---|---|
| **Strategy** | Payment processing and order-state transitions — different strategies execute based on context (e.g., customer vs. chef flow). |
| **State** | Order lifecycle management — an order transitions through states (`Pending → Confirmed → Preparing → Delivered → Cancelled`) without brittle if/else chains. |
| **Factory** | Creating domain objects (User, FoodItem, Order) — a factory method ensures consistent instantiation with validation. |
| **Observer** | Notification system — when an order status changes, observers (email/notification handlers) are triggered automatically. |
| **Repository** | Data access abstraction — all MongoDB operations are hidden behind repository interfaces, making the service layer DB-agnostic. |
| **Singleton** | Database connection (`MongooseConfig`) — a single shared instance is reused across the entire application lifecycle. |

---

### SOLID Principles

| Principle | Application |
|---|---|
| **S** — Single Responsibility | Every class has one job: controllers handle HTTP, services handle logic, repositories handle data. |
| **O** — Open/Closed | New roles or features (e.g., a Delivery Partner role) can be added by extending classes, not modifying existing ones. |
| **L** — Liskov Substitution | Repository implementations can be swapped (e.g., MongoDB → PostgreSQL) without breaking service contracts. |
| **I** — Interface Segregation | Interfaces are role-specific — `IUserRepository` is not burdened with order or food-item concerns. |
| **D** — Dependency Inversion | Services depend on repository interfaces, not concrete implementations, enabling clean testability and flexibility. |

---

## Frontend — Evaluation Guide

> **Live URL:** [https://swaava-food.vercel.app](https://swaava-food.vercel.app)

The frontend is a **React + TypeScript** SPA built with Vite. Key aspects for evaluation:

- **Component Architecture**: Components are organized by feature (`/pages`, `/components`, `/hooks`). Each component has a single responsibility.
- **State Management**: React Context API manages global auth state (user role, token) with a clean `AuthContext` provider.
- **Role-Based UI**: The interface dynamically adapts based on user role — Customers see browse/cart/order UIs, HomeChefs see their dashboard, and Admins see the control panel.
- **API Integration**: All backend calls are centralized via Axios with base URL configuration. JWT tokens are attached via request interceptors.
- **Routing & Guards**: React Router Dom handles protected routes — unauthenticated users are redirected to login; role mismatches are blocked at the route level.
- **Tech**: React.js, TypeScript, Vite, TailwindCSS / Material UI, Axios, React Router Dom, Firebase (auth layer).

---

## Backend — Evaluation Guide

The backend is a **Node.js + Express + TypeScript** REST API with MongoDB. Key aspects for evaluation:

- **Layered Architecture**: Strict Controller → Service → Repository separation. No business logic leaks into controllers; no DB logic leaks into services.
- **Authentication**: Stateless JWT-based auth. Tokens carry the user role; every protected route passes through a middleware that verifies the token and injects the user context.
- **RBAC (Role-Based Access Control)**: Three roles (Customer, HomeChef, Admin) each have distinct route guards. Unauthorized access returns proper `403` responses.
- **OOP & Design Patterns**: As described above — Factory, Repository, Singleton, Observer, Strategy, and State patterns are implemented throughout.
- **MongoDB + Mongoose**: Schema-driven models with strict typing. Relations between User, FoodItem, Order, and Review are maintained via Mongoose refs and population.
- **Error Handling**: Centralized error-handling middleware catches and formats all errors consistently across the API.
- **Tech**: Node.js, TypeScript, Express.js, MongoDB, Mongoose, JWT, bcrypt.

---

---

## Project Structure
```text
Swaava/
├── backend/               # Node.js Express server
│   ├── config/            # Database & environment configurations
│   ├── controllers/       # Route request OOP handlers
│   ├── middlewares/       # Auth and validation middlewares
│   ├── models/            # Mongoose schemas
│   ├── repositories/      # OOP Data access layer
│   ├── routes/            # API routing definitions
│   ├── services/          # OOP Business logic layer
│   ├── utils/             # Helper functions and utilities
│   └── index.ts           # Server entry point
├── frontend/              # React Vite application
│   ├── public/            # Static assets
│   ├── src/               # React components, pages, and logic
│   └── vite.config.ts     # Vite configuration
└── *.md                   # Documentation and Diagrams
```

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas cluster)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Swaava
```

### 2. Setup Backend Server
```bash
cd backend
npm install
# Set up .env variables (PORT, MONGO_URI, JWT_SECRET, etc.)
npx ts-node index.ts
```

### 3. Setup Frontend Application
```bash
cd ../frontend
npm install
# Set up .env variables if necessary (e.g., VITE_API_BASE_URL)
npm run dev
```

---
### Hosted Link
```bash
https://swaava.vercel.app/
```

## Future Enhancements
- Real Payment Gateway Integration (Razorpay/Stripe)
- Real-time GPS-based delivery tracking
- In-app messaging/chat system
- Mobile application natively on iOS and Android
- AI-based local food recommendations
