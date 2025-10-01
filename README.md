# ModernStack SaaS Starter - SvelteKit + Convex + Better Auth

A production-ready SaaS starter template built for the [Modern Stack Hackathon](https://www.convex.dev/hackathons/modernstack), featuring SvelteKit, Convex, Better Auth, Autumn Stripe billing, and more.

## Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** with **[Svelte 5](https://svelte.dev/)** - Modern, reactive frontend framework
- **[Convex](https://convex.dev/)** - Real-time backend database with serverless functions
- **[Better Auth](https://www.better-auth.com/)** - Comprehensive authentication solution with email/password and OAuth
- **[Resend](https://resend.com/)** - Transactional email service for password resets and email verification
- **[shadcn-svelte](https://www.shadcn-svelte.com/)** - Beautiful, accessible UI components
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful icon library
- **[Autumn](https://useautumn.com/)** - Stripe billing wrapper for seamless payment integration

## Features

- ✅ **Authentication System**
  - Email/password authentication
  - Google OAuth support
  - Password reset flow
  - Email change with verification
  - Session management

- ✅ **User Management**
  - User profile settings
  - Avatar upload with Convex storage
  - Account information management

- ✅ **UI Components**
  - Dashboard with charts and data tables
  - Sidebar navigation
  - Settings pages (Account, Password, Email)
  - Responsive design
  - Dark/light mode ready

- ✅ **Developer Experience**
  - TypeScript throughout
  - Type-safe database queries
  - Hot module replacement
  - ESLint & Prettier configured

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```sh
git clone https://github.com/joachimchauvet/modernstack-saas
cd modernstack-saas
```

2. Install dependencies:

```sh
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
PUBLIC_CONVEX_URL=your_convex_url
PUBLIC_CONVEX_SITE_URL=your_convex_site_url
SITE_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESET_EMAIL_FROM="Your App <no-reply@yourdomain.com>" # Optional
RESET_EMAIL_REPLY_TO=support@yourdomain.com # Optional
```

4. Initialize Convex:

```sh
pnpm convex dev
```

5. Start the development server:

```sh
pnpm dev
```

The app will be running at `http://localhost:5173`

## Development

Run both the SvelteKit dev server and Convex in parallel:

```sh
# Terminal 1 - Convex backend
pnpm convex dev

# Terminal 2 - SvelteKit frontend
pnpm dev
```

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/     # UI components
│   │   ├── auth-client.ts  # Better Auth client
│   │   └── ...
│   ├── routes/
│   │   ├── (app)/          # Protected routes
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   └── auth/           # Authentication routes
│   └── convex/             # Convex backend
│       ├── auth.ts         # Auth configuration
│       ├── storage.ts      # File storage
│       └── ...
```

## Building for Production

Create a production build:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## Deployment

This starter uses [adapter-cloudflare](https://kit.svelte.dev/docs/adapter-cloudflare) by default, but you can swap it for any SvelteKit adapter:

- [Vercel](https://kit.svelte.dev/docs/adapter-vercel)
- [Netlify](https://kit.svelte.dev/docs/adapter-netlify)
- [Node](https://kit.svelte.dev/docs/adapter-node)
- [Other adapters](https://kit.svelte.dev/docs/adapters)

### Deployment Steps

1. Deploy your Convex backend:

```sh
pnpm convex deploy
```

2. Set all environment variables in your hosting platform:
   - `PUBLIC_CONVEX_URL`
   - `PUBLIC_CONVEX_SITE_URL`
   - `SITE_URL` (update to your production domain)
   - `RESEND_API_KEY`
   - `RESET_EMAIL_FROM` (optional)
   - `RESET_EMAIL_REPLY_TO` (optional)

3. Deploy your frontend to your chosen platform

## Built for Modern Stack Hackathon

This starter template was created for the [Convex Modern Stack Hackathon](https://www.convex.dev/hackathons/modernstack), showcasing the power of combining modern web technologies to build production-ready SaaS applications.
