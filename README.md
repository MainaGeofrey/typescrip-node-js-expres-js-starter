# typescrip-node-js-expres-js-starter

# manual scaffold base structure (bash script)
mkdir -p src/{config,domain,application,infrastructure,interfaces,middlewares,routes,utils,types} \
&& touch src/{server.ts,container.ts} \
&& npm init -y \
&& npm install express dotenv \
&& npm install -D typescript ts-node-dev @types/node @types/express eslint prettier \
&& npx tsc --init \
&& echo -e "node_modules\ndist\n.env" > .gitignore



my-backend/
├── src/
│   ├── config/               # Environment config, database config
│   ├── domain/               # Core business logic (Entities, Interfaces, Value Objects)
│   ├── application/          # Use-cases / Services / Interactors
│   ├── infrastructure/       # Database, external APIs, adapters (e.g., Redis, Kafka, PostgreSQL)
│   ├── interfaces/           # HTTP controllers, GraphQL resolvers, CLI handlers
│   ├── middlewares/          # Express/Koa middleware (auth, logging, error handling)
│   ├── routes/               # API route definitions (express.Router)
│   ├── utils/                # Reusable utility functions (e.g., validators, date helpers)
│   ├── types/                # Global TypeScript types and interfaces
│   ├── server.ts             # Main entry point
│   └── container.ts          # IoC Container (if using dependency injection)
├── .env                      # Environment variables
├── Dockerfile                # Optimized Dockerfile
├── docker-compose.yml        # Services orchestration (e.g., app + db)
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project metadata and scripts
└── README.md
