# Free Press Pass Generator

## Overview

The Free Press Pass Generator is a web application that allows journalists to generate digital press passes with optional paid laminated versions. The application provides a canvas-based press pass creator with real-time preview, photo upload capabilities, and database tracking of issued passes. It integrates with Stripe for payment processing and Supabase for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- Vanilla JavaScript (ES6+) for client-side logic
- HTML5 Canvas API for press pass rendering
- CSS3 for responsive styling

**Key Design Patterns:**
- Event-driven architecture for real-time preview updates
- Form validation with client-side checks before submission
- Progressive enhancement with localStorage fallback when offline
- Mobile-first responsive design

**Canvas Rendering System:**
The application uses HTML5 Canvas to dynamically generate press passes. The `drawPass()` function handles:
- Text positioning and centering relative to photo placement
- Photo upload and rendering
- Dynamic text wrapping for organization names (limited to 2 lines)
- Real-time updates as users type

**Rationale:** Canvas was chosen over SVG or server-side rendering to provide instant client-side preview and easy image download without server round-trips. This improves user experience and reduces server load.

### Backend Architecture

**Serverless Functions (Netlify Functions):**
The application uses serverless functions for all backend operations:
- `track-pass.js` - Records press pass generation with tracking metadata
- `get-passes.js` - Retrieves issued passes for admin dashboard
- `create-checkout-session.js` - Initiates Stripe checkout for paid passes
- `stripe-webhook.js` - Handles Stripe payment events
- `health-check.js` - API availability verification

**Rationale:** Serverless architecture was chosen to:
- Minimize infrastructure costs (pay-per-use)
- Simplify deployment and scaling
- Avoid server maintenance overhead
- Enable easy deployment on Netlify platform

**API Layer (`api.js`):**
Provides abstraction over network requests with:
- Input validation before API calls
- Comprehensive error handling
- Email format validation
- Graceful degradation when API unavailable

### Data Storage Solutions

**Primary Database: Supabase (PostgreSQL)**

Schema design (`press_passes` table):
- Core identity fields: `id`, `pass_number`, `name`, `email`, `title`
- Payment tracking: `paid`, `payment_pending`, `payment_id`, `payment_amount`, `payment_date`
- Auditability: `created_at`, `revoked`, `revoked_at`, `notes`
- Analytics: `user_agent`, `ip_address`, `referer`, `download_type`

**Rationale:** Supabase was selected for:
- Built-in Row Level Security (RLS) for access control
- Real-time capabilities for future features
- PostgreSQL reliability and ACID compliance
- Easy integration with serverless functions
- Free tier suitable for initial deployment

**Fallback Storage: localStorage**

Client-side implementation (`db.js`) provides localStorage fallback when:
- Supabase is unavailable (network issues)
- Development/testing without database credentials
- Offline mode support

**Rationale:** Dual-storage approach ensures application works even when primary database is unavailable, improving reliability and development experience.

**Drizzle ORM Integration:**
The codebase includes Drizzle ORM setup (`drizzle.config.ts`, `shared/schema.ts`) for:
- Type-safe database queries
- Schema migrations management
- Better developer experience with TypeScript support

### Authentication and Authorization

**Admin Access:**
- Simple credential-based login (`login.html`)
- Session persistence via localStorage
- Client-side authentication check before admin page access

**API Security:**
- Service role key for server-side operations (bypasses RLS)
- Anonymous key for client-side read operations
- CORS headers configured for production
- Input validation and sanitization on all endpoints

**Rationale:** This approach balances security with simplicity. For production, should be enhanced with:
- Proper session management
- JWT-based authentication
- Rate limiting
- Enhanced CORS configuration

**Known Limitations:** Current client-side authentication is not production-ready and should be replaced with Supabase Auth or similar service.

## External Dependencies

### Payment Processing
**Stripe Integration:**
- Checkout sessions for laminated pass purchases ($15)
- Webhook handling for payment confirmation
- Payment metadata tracking in database

**Environment Variables Required:**
- `STRIPE_SECRET_KEY` - Server-side Stripe authentication
- `STRIPE_PRICE_ID` - Product price identifier
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

### Database Service
**Supabase:**
- PostgreSQL database hosting
- Row Level Security for access control
- Service role key for admin operations
- Anonymous key for client operations

**Environment Variables Required:**
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin service key

### Deployment Platform
**Netlify:**
- Static site hosting
- Serverless functions runtime
- Form handling
- Environment variable management
- Continuous deployment from Git

**Configuration:** `netlify.toml` defines:
- Build settings
- Function directory location
- Redirect rules
- Environment variable requirements

### Third-Party Libraries
**Client-Side:**
- Supabase JS SDK (loaded via CDN)
- Native browser APIs (Canvas, Fetch, localStorage)

**Server-Side (Netlify Functions):**
- `@supabase/supabase-js` - Database client
- `stripe` - Payment processing
- Node.js built-in modules

### Analytics and Tracking
**Captured Metadata:**
- User agent (browser/device information)
- IP address (via forwarded headers)
- Referrer URL
- Download type (download, open, camera roll)

**Purpose:** Track press pass distribution patterns and user demographics for analytics and fraud prevention.