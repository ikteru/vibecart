# VibeCart

A modern e-commerce platform for Moroccan sellers, built with Next.js 14, Supabase, and TypeScript. VibeCart enables sellers to showcase products through Instagram integration, manage orders with WhatsApp Business API, and accept payments via local delivery networks.

## Features

- 🔐 **Multi-provider Authentication**: Email, phone (SMS), and Google OAuth
- 📱 **Instagram Integration**: Import products directly from Instagram posts
- 💬 **WhatsApp Business**: Automated order notifications and customer communication
- 🛒 **Order Management**: Complete order lifecycle with delivery tracking
- 🎨 **RTL Support**: Full Arabic and French localization
- 📍 **Local Delivery**: Integrated delivery person management
- 🤖 **AI Features**: Gemini AI integration for content generation
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E tests

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.6 |
| **Styling** | Tailwind CSS 3.4 |
| **UI Components** | Lucide React |
| **Backend** | Next.js Server Actions + API Routes |
| **Database** | PostgreSQL (via Supabase) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Real-time** | Supabase Realtime |
| **Testing** | Vitest + Playwright |
| **AI** | Google Gemini API |
| **Deployment** | Docker + Multi-platform ready |

## Architecture

VibeCart follows **Hexagonal/Clean Architecture** principles:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│              (React Components, Server Actions)             │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│              (Use Cases, DTOs, Mappers)                     │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                            │
│         (Entities, Value Objects, Business Logic)           │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│    (Supabase Repositories, External APIs, Storage)          │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Repository Pattern**: Abstract data access with Supabase implementations
- **DTO Pattern**: Type-safe data transfer between layers
- **Server Actions**: Next.js 14 server functions for mutations
- **RLS Security**: Row Level Security for database access control

## Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Docker**: 24.x or higher (for local Supabase)
- **Git**: 2.x or higher

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/vibecart.git
cd vibecart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# The .env.example includes default values for local development
# No changes needed for basic local setup
```

### 4. Start Local Infrastructure

```bash
# Start Supabase and supporting services
docker compose up -d

# Services started:
# - Next.js app: http://localhost:3000
# - Supabase API: http://localhost:8000
# - PostgreSQL: localhost:5434
# - Email testing: http://localhost:9000
# - pgAdmin: http://localhost:5050
```

### 5. Run Database Migrations

```bash
# Migrations run automatically on first startup
# To manually push migrations:
npm run db:migrate
```

### 6. Start Development Server

```bash
# If using Docker (recommended)
docker compose up app

# Or run locally
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:unit

# Watch mode
npm run test -- --watch
```

### Integration Tests

```bash
# Run integration tests (requires Docker services running)
npm run test:integration
```

### E2E Tests

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI mode for debugging
npx playwright test --ui
```

### Test Coverage

View coverage reports:

```bash
# After running tests with coverage
open coverage/index.html
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler (no emit) |
| `npm run test` | Run unit tests |
| `npm run test:unit` | Run tests with coverage |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run db:migrate` | Push database migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## Project Structure

```
vibecart/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # i18n localized routes
│   │   │   ├── auth/           # Authentication callbacks
│   │   │   ├── seller/         # Seller dashboard
│   │   │   ├── shop/           # Public shop pages
│   │   │   └── api/            # API routes
│   │   ├── api/                # Non-localized API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── domain/                 # Domain layer
│   │   ├── entities/           # Business entities
│   │   ├── value-objects/      # Value objects (Money, PhoneNumber)
│   │   └── repositories/       # Repository interfaces
│   ├── application/            # Application layer
│   │   ├── use-cases/          # Business use cases
│   │   ├── dtos/               # Data transfer objects
│   │   └── mappers/            # Entity/DTO transformers
│   ├── infrastructure/         # Infrastructure layer
│   │   ├── auth/               # Supabase auth clients
│   │   ├── persistence/        # Repository implementations
│   │   ├── storage/            # File storage service
│   │   └── external-services/  # Third-party integrations
│   ├── presentation/           # UI layer
│   │   ├── components/         # React components
│   │   └── hooks/              # Custom React hooks
│   ├── i18n/                   # Internationalization
│   │   ├── locales/            # Translation files (en, ar, ar-MA, fr)
│   │   └── request.ts          # i18n configuration
│   ├── lib/                    # Utilities and helpers
│   ├── test/                   # Test utilities
│   │   ├── factories/          # Test data factories
│   │   └── mocks/              # Mock implementations
│   └── middleware.ts           # Next.js middleware
├── supabase/
│   └── migrations/             # Database migrations
├── messages/                   # i18n message files
├── docker/                     # Docker configuration
├── public/                     # Static assets
├── tests/                      # E2E tests
├── .env.example                # Environment template
├── .env.local                  # Local environment (gitignored)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest configuration
```

## Key Features Implementation

### Instagram Integration

Sellers can connect their Instagram account to:
- Import products from Instagram posts
- Display Instagram videos on product pages
- Auto-sync product catalog

**Flow:**
1. Seller clicks "Connect Instagram"
2. OAuth to Meta Developer App
3. Access token encrypted and stored
4. Background sync fetches media

### WhatsApp Business Integration

Automated order notifications via WhatsApp:
- Order confirmation
- Shipping updates
- Delivery notifications
- Customer replies processed via webhooks

**Setup:**
1. Connect WhatsApp Business account
2. Configure message templates in Meta Console
3. Webhook receives customer replies
4. Commands processed (`/confirm`, `/cancel`, `/status`)

### Order Management

Complete order lifecycle:
1. Customer places order
2. Seller receives notification
3. Order status updates (pending → confirmed → shipped → delivered)
4. Delivery person assignment
5. Customer confirmation via WhatsApp

## Internationalization (i18n)

VibeCart supports 4 locales:

| Locale | Language | Direction |
|--------|----------|-----------|
| `en` | English | LTR |
| `ar` | Arabic (Modern Standard) | RTL |
| `ar-MA` | Moroccan Arabic (Darija) | RTL |
| `fr` | French | LTR |

Default locale: `ar-MA`

**Adding translations:**
1. Add keys to all 4 files in `messages/`
2. Use translation keys in components: `const t = useTranslations('namespace')`
3. Use logical CSS properties for RTL: `ps-4` (padding-start) instead of `pl-4`

## Environment Variables

See `.env.example` for all available options. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL |
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | Yes | 64-char hex encryption key |
| `WHATSAPP_TOKEN_ENCRYPTION_KEY` | Yes | 64-char hex encryption key |
| `WEBHOOK_API_KEY` | Yes | API key for webhook authentication |
| `GEMINI_API_KEY` | No | Google Gemini AI API key |
| `TWILIO_*` | No | Twilio credentials for SMS |
| `GOOGLE_*` | No | Google OAuth credentials |

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick start for Vercel:**

1. Push code to GitHub
2. Connect repository in Vercel Dashboard
3. Add environment variables
4. Deploy

**Docker deployment:**

```bash
# Build production image
docker build -t vibecart:latest --target runner .

# Run container
docker run -p 3000:3000 --env-file .env.production vibecart:latest
```

## Security

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

**Key security features:**
- Row Level Security (RLS) on all tables
- Encrypted token storage (AES-256-GCM)
- Security headers (CSP, HSTS, etc.)
- Rate limiting
- Input validation with Zod
- File upload restrictions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following [CLAUDE.md](./CLAUDE.md) guidelines
4. Run tests: `npm run test && npm run type-check`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Tailwind CSS for styling
- 4 locales for all UI text
- Server Actions for mutations
- Repository pattern for data access

## Troubleshooting

### Common Issues

**Docker services fail to start:**
```bash
# Reset Docker environment
docker compose down -v
docker compose up -d
```

**Database connection errors:**
- Verify Supabase is running: `docker ps | grep vibecart`
- Check `.env.local` values match docker-compose.yml

**TypeScript errors:**
```bash
# Clear cache and rebuild
rm -rf .next tsconfig.tsbuildinfo
npm run type-check
```

**Instagram OAuth fails locally:**
- Use ngrok for HTTPS tunneling: `docker compose --profile ngrok up ngrok`
- Update redirect URI in Meta Console

## Support

- Documentation: [CLAUDE.md](./CLAUDE.md) - Development guidelines
- Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
- Security: [SECURITY.md](./SECURITY.md) - Security practices
- Issues: [GitHub Issues](https://github.com/your-org/vibecart/issues)

## License

[MIT License](./LICENSE)

---

Built with ❤️ for Moroccan entrepreneurs
