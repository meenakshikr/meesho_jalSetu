# JalSetu — जल सेतु

**Agentic AI Water Delivery Platform for India**

JalSetu is a role-based water tanker booking and management platform powered by AI. It connects residents, community coordinators, tanker drivers, and tanker owners through a unified system that leverages Claude AI for intelligent tanker ranking, anomaly detection, computer vision volume verification, heatwave-responsive advisories, demand forecasting, and predictive engagement.

Built for Indian cities where water tanker delivery is a critical daily need — especially during heatwave seasons.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Payments | Razorpay (UPI, Cards, Netbanking) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Fonts | Geist Sans |
| Language | TypeScript |

---

## Features by Role

### Resident
- Browse available tankers in their ward
- Book water for individual or community use
- Join community bookings with bill splitting
- Real-time order tracking
- AI-verified delivery volume via camera
- Payment via UPI, cash, or subsidy points
- View receipts and booking history
- Receive personalized nudges when water is due

### Coordinator
- Create and manage community bookings
- Invite residents to join group orders
- Dispatch assigned tankers
- View heatwave alerts and advisories
- Monitor booking progress with participant tracking
- Access booking and delivery history

### Driver
- View assigned deliveries
- Confirm delivery with photo capture
- Update delivery status (en route → delivered)
- View delivery history
- Computer vision assists volume verification

### Owner
- Manage fleet of tankers (add, update, toggle availability)
- View earnings and fleet statistics
- Demand forecast dashboard for ward-level predictions
- Tanker performance reviews and ratings

---

## AI Features

JalSetu integrates Claude AI across six core endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/ai/rank-tankers` | Ranks available tankers by price, distance, rating, capacity, and heatwave severity |
| `/api/ai/anomaly-check` | Detects price gouging and volume discrepancies by comparing against district averages |
| `/api/ai/cv-volume` | Computer vision analysis of tanker delivery photos to verify water volume |
| `/api/ai/heatwave-advisory` | Generates Hinglish heatwave advisories with recommended actions based on severity |
| `/api/ai/demand-forecast` | Predicts ward-level water demand for the next 7 days using booking history |
| `/api/ai/predictive-nudge` | Generates personalized re-engagement messages for inactive residents |

All AI endpoints use a shared `lib/ai.ts` helper that wraps the Anthropic SDK with JSON parsing, image support, and graceful fallbacks.

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (with PostgreSQL database)
- Anthropic API key
- Razorpay account (optional, for payments)

### 1. Clone and Install

```bash
git clone <repo-url>
cd jalsetu
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay (optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (for scheduled tasks)
CRON_SECRET=

# AI
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Database Setup

Run the migration SQL in your Supabase SQL Editor or via `psql`:

```bash
# If using Supabase CLI
supabase db push

# Or paste the schema directly in Supabase Dashboard → SQL Editor
```

### 4. Seed Demo Data

```bash
psql -f scripts/seed.sql
```

Or paste `scripts/seed.sql` into the Supabase SQL Editor and execute.

The seed data includes:
- 5 Bengaluru wards (Koramangala, HSR Layout, Whitefield, Yelahanka, Banashankari)
- 8 tankers across 3 operators with varied capacities and pricing
- 10 users (5 residents, 2 coordinators, 3 drivers, 3 owners)
- 15 bookings in various statuses
- 3 active heatwave alerts
- 5 nudge logs, 3 anomaly logs, 5 reviews

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
jalsetu/
├── app/
│   ├── (auth)/              # Login and register pages
│   │   ├── login/
│   │   └── register/
│   ├── api/
│   │   ├── ai/              # AI-powered endpoints
│   │   │   ├── anomaly-check/
│   │   │   ├── cv-volume/
│   │   │   ├── demand-forecast/
│   │   │   ├── heatwave-advisory/
│   │   │   ├── predictive-nudge/
│   │   │   └── rank-tankers/
│   │   ├── auth/            # Authentication (login, logout, register, me)
│   │   ├── bookings/        # Booking CRUD + join endpoint
│   │   ├── cron/            # Scheduled tasks (heatwave check, nudges)
│   │   ├── heatwave/        # Heatwave alert queries
│   │   ├── nudges/          # Nudge log retrieval
│   │   ├── owner/           # Owner fleet and stats
│   │   ├── payments/        # Payment creation and webhooks
│   │   ├── receipts/        # Receipt generation
│   │   ├── reviews/         # Tanker reviews
│   │   ├── tankers/         # Tanker CRUD
│   │   └── wards/           # Ward listing
│   ├── coordinator/         # Coordinator dashboard and pages
│   ├── driver/              # Driver dashboard and delivery flow
│   ├── owner/               # Owner dashboard, fleet, demand
│   └── resident/            # Resident dashboard, marketplace, tracking
├── components/              # Reusable UI components
│   └── ui/                  # Base UI primitives (button, card, badge, etc.)
├── hooks/                   # Custom React hooks
├── lib/                     # Shared utilities
│   ├── ai.ts                # Claude AI client wrapper
│   ├── razorpay.ts          # Razorpay client
│   ├── supabase-client.ts   # Browser Supabase client
│   ├── supabase-server.ts   # Server Supabase client
│   └── utils.ts             # Utility functions (INR formatting, haversine, etc.)
├── scripts/
│   └── seed.sql             # Demo seed data
├── types/
│   └── index.ts             # TypeScript type definitions
└── middleware.ts            # Next.js middleware
```

---

## API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user profile |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings (filterable by ward, status, type, resident) |
| POST | `/api/bookings` | Create a new booking |
| GET | `/api/bookings/[id]` | Get booking details |
| PATCH | `/api/bookings/[id]` | Update booking status |
| POST | `/api/bookings/[id]/join` | Join a community booking |

### Tankers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tankers` | List available tankers (with distance calc) |
| POST | `/api/tankers` | Add a new tanker (owner only) |
| GET | `/api/tankers/[id]` | Get tanker details |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create Razorpay order |
| POST | `/api/payments/webhook` | Razorpay webhook handler |
| POST | `/api/payments/[id]/cash` | Mark cash payment |

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List receipts |
| GET | `/api/receipts/[id]` | Get receipt details |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit a tanker review |
| GET | `/api/reviews/tanker/[id]` | Get reviews for a tanker |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/rank-tankers` | AI-ranked tanker recommendations |
| POST | `/api/ai/anomaly-check` | Price/volume anomaly detection |
| POST | `/api/ai/cv-volume` | Computer vision volume verification |
| POST | `/api/ai/heatwave-advisory` | Heatwave advisory generation |
| POST | `/api/ai/demand-forecast` | Ward-level demand prediction |
| POST | `/api/ai/predictive-nudge` | Personalized re-engagement nudges |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wards` | List all wards |
| GET | `/api/heatwave` | Get active heatwave alerts |
| GET | `/api/nudges` | Get user's unread nudges |
| PATCH | `/api/nudges/[id]/read` | Mark nudge as read |
| GET | `/api/owner/fleet` | Owner's fleet overview |
| GET | `/api/owner/stats` | Owner's earnings stats |
| GET | `/api/cron/heatwave-check` | Scheduled heatwave monitoring |
| GET | `/api/cron/coordinator-nudge` | Scheduled nudge dispatch |

---

## Screenshots

> _Screenshots will be added here after deployment._

**Resident Dashboard** — Book water, track orders, receive heatwave alerts and personalized nudges.

**Coordinator View** — Manage community bookings, dispatch tankers, monitor participation progress.

**Owner Fleet** — View tanker fleet status, demand forecasts, and earnings analytics.

**AI Anomaly Detection** — Real-time price gouging and volume discrepancy analysis powered by Claude.

---

## License

MIT
