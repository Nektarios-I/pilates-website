# Supabase Setup Guide

## Overview

This application uses Supabase for authentication, database, and RLS-based authorization. This document explains how to set up Supabase for local development and production deployment.

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Supabase account (free tier works for development)
- Supabase CLI installed (optional but recommended for local development)

## Local Development Setup

### Option A: Using Supabase Cloud (Recommended for Getting Started)

1. **Create a Supabase Project**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - Name: `pilates-studio-dev` (or your preference)
     - Database Password: Generate a strong password and save it securely
     - Region: Choose closest to your location
   - Click "Create new project" and wait for provisioning (~2 minutes)

2. **Get Your API Keys**
   - Once project is ready, go to Project Settings > API
   - Copy the following values:
     - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role secret` key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and add your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

4. **Configure Auth Settings**
   - In Supabase Dashboard, go to Authentication > URL Configuration
   - Add the following URLs:
     - Site URL: `http://localhost:3000`
     - Redirect URLs: `http://localhost:3000/auth/callback`

   - Go to Authentication > Providers > Email
   - Enable "Enable Email provider"
   - Enable "Confirm email" (optional for development)
   - Save changes

5. **Run Database Migrations**

   **Option 1: Using Supabase Dashboard (Easiest)**
   - Go to SQL Editor in your Supabase dashboard
   - Open `supabase/migrations/20260614000001_initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor and click "Run"
   - If successful, you'll see "Success. No rows returned"

   **Option 2: Using Supabase CLI**

   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase

   # Link to your project
   npx supabase link --project-ref your-project-ref

   # Push migrations
   npx supabase db push
   ```

6. **Seed Development Data (Optional)**
   - In Supabase Dashboard > SQL Editor
   - Open `supabase/seed.sql`
   - Copy contents and run to insert sample packages

### Option B: Using Supabase Local Development

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Start Local Supabase**

   ```bash
   npx supabase start
   ```

   This will start local Docker containers for Postgres, Auth, Storage, etc.
   Note the output - it will show your local connection details.

3. **Configure Local Environment**
   - Use the credentials from `supabase start` output:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-output>
     SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-output>
     ```

4. **Access Local Services**
   - Studio UI: http://127.0.0.1:54323
   - API: http://127.0.0.1:54321
   - DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
   - Inbucket (Email testing): http://127.0.0.1:54324

## Database Schema

The initial migration creates the following tables:

### Core Tables

- **`profiles`** - User profile and membership state
- **`user_roles`** - Role assignments (client, instructor, admin, owner)
- **`packages`** - Available class packages and pricing
- **`user_packages`** - User-owned packages with credit tracking
- **`sessions`** - Bookable Pilates sessions/classes
- **`bookings`** - User bookings for sessions

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can view/update their own data
- Package browsing is public for active packages
- Session browsing is public for scheduled sessions
- Admin/staff policies are planned for future milestones

## Authentication Flow

### Magic Link (Primary for Clients)

The application uses passwordless magic link authentication with controlled signup:

1. User enters email on `/login`
2. System calls `signInWithOtp` with `shouldCreateUser: false`
3. If user exists: Magic link sent → User clicks → Redirected to `/account`
4. If user doesn't exist: Error message (controlled membership)

### Controlled Membership

The application implements invite-only account creation:

- **No open public signup**
- Accounts must be pre-created by staff/admin
- New users are created with `status: 'invited'`
- User receives magic link or activation email
- After first login, profile status updates as needed

## Creating User Accounts (Staff/Admin Flow)

### Manual Creation via Supabase Dashboard (Temporary)

Until the admin interface is built, create accounts manually:

1. Go to Authentication > Users in Supabase Dashboard
2. Click "Add user"
3. Choose "Create new user"
4. Enter:
   - Email address
   - Auto-generate password (will be unused for magic link users)
   - Email confirm: Yes (for immediate activation)
5. Click "Create user"
6. The profile will be auto-created via database trigger
7. Manually assign role:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<user-id>', 'client');
   ```

### Programmatic Creation (Future)

In the next milestone, an admin interface will be added to:

- Create user accounts
- Send invite emails
- Assign roles
- Manage member status

## Testing Authentication Locally

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Create a test user**
   - Via Supabase Dashboard as described above
   - Or via SQL:
     ```sql
     -- This will trigger auto-creation of profile
     -- Note: In production, use proper auth.admin API
     ```

3. **Test magic link flow**
   - Go to `http://localhost:3000/login`
   - Enter the test user's email
   - Check Inbucket at `http://127.0.0.1:54324` (local) or email (cloud)
   - Click the magic link
   - Should redirect to `/account`

4. **Verify session**
   - You should see user data in `/account`
   - Refresh should maintain session (via middleware)

## Production Deployment

### Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Auth Configuration

In production Supabase project:

1. **URL Configuration**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

2. **Email Templates**
   - Customize magic link email template
   - Update sender name and branding

3. **Rate Limiting**
   - Configure rate limits for auth endpoints
   - Recommended: 5 requests per 15 minutes per email

### Database Setup

1. Link to production project:

   ```bash
   npx supabase link --project-ref your-prod-ref
   ```

2. Push migrations:

   ```bash
   npx supabase db push
   ```

3. Run seed data if needed (optional):
   ```bash
   # Copy seed.sql content into SQL Editor
   ```

## Troubleshooting

### Common Issues

**1. "Invalid API key" error**

- Check that env vars are set correctly
- Verify you copied the full key (anon key is ~300 characters)
- Restart dev server after changing `.env.local`

**2. Magic link not working**

- Check redirect URLs in Supabase Dashboard
- Verify Site URL is correct
- Check email in Inbucket (local) or spam folder (cloud)

**3. "User not found" on login**

- Verify user exists in Authentication > Users
- Check that email matches exactly (case-sensitive)
- Verify user's email is confirmed

**4. Session not persisting**

- Check that middleware is working (`middleware.ts`)
- Verify cookies are being set (check browser dev tools)
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct

**5. RLS policy errors**

- Check user is authenticated (not anonymous)
- Verify policies in Database > Policies
- Test queries in SQL Editor with `set role authenticated;`

### Debug Mode

Enable debug logging:

```typescript
// Add to src/lib/supabase/client.ts or server.ts temporarily
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: true, // Enable auth debug logs
    },
  },
);
```

## Next Steps

After completing this setup:

1. ✅ Supabase project configured
2. ✅ Database schema deployed
3. ✅ Auth working locally
4. 🔄 Implement admin interface for user management (next milestone)
5. 🔄 Implement package purchase flow (future milestone)
6. 🔄 Implement booking system (future milestone)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
