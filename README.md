# typescript-node-js-express-js-starter

## Validation

For your Node.js + TypeScript, SOLID-principled backend, Zod is the ideal fit — you'll get:

* Cleaner validation
* Built-in types
* Better type-safety
* Easier maintenance

```bash
npm install zod
```

## Project Structure

```
my-backend/
├── src/
│   ├── config/               # Environment config, database config per tenant
│   ├── domain/               # Core business logic (Entities, Interfaces, Value Objects)
│   ├── application/          # Use-cases / Services / Interactors — orchestrates domain logic
│   ├── infrastructure/       # Database, APIs, message queues — implements domain interfaces
│   ├── interfaces/           # HTTP controllers, CLI handlers — interface adapters
│   ├── middlewares/          # Express middleware (auth, errorHandler, logger, etc.)
│   ├── routes/               # API route definitions using express.Router
│   ├── utils/                # Reusable helpers (e.g., validators, date utils)
│   ├── types/                # Global TS types/interfaces (DTOs, tenant types)
│   ├── server.ts             # Application bootstrapper (Express app)
│   └── container.ts          # IoC Container or dependency wiring
├── .env                      # Env config (PORT, DB, etc.)
├── tsconfig.json             # TypeScript config
├── package.json              # Project metadata & scripts
└── README.md
```

## Layered Architecture Summary (Clean Architecture)

* **domain/**: Business logic, models, and contracts — no framework code
* **application/**: Application-specific workflows (e.g. check-in, bookings)
* **infrastructure/**: MySQL, Redis, API clients, email/SMS adapters
* **interfaces/**: Express controllers — entry points for HTTP/CLI/GraphQL
* **middlewares/**: Auth, error handling, logging — Express middlewares
* **routes/**: Route definitions and binding controllers to routes
* **utils/**: Generic reusable utility functions
* **types/**: Shared type declarations across layers

> 🧠 **Controllers live in `interfaces/`**, not `application/`, because they are tied to the framework (Express). `application/` is pure and reusable across different delivery mechanisms (CLI, workers, HTTP, etc.).
