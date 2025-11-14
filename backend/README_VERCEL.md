# Deploying Backend to Vercel

This guide explains how to deploy the NestJS backend to Vercel.

## Prerequisites

1. Vercel account
2. All environment variables configured

## Environment Variables

Set these in Vercel Dashboard (Settings > Environment Variables):

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (e.g., `https://your-frontend.vercel.app,http://localhost:5173`)

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from backend directory**:
   ```bash
   cd backend
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm project settings
   - Deploy

5. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add all required environment variables

6. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

## Important Notes

- The `api/index.ts` file is the serverless entry point for Vercel
- Prisma Client is generated during build (`vercel-build` script)
- Make sure your database is accessible from Vercel's servers
- Update `ALLOWED_ORIGINS` with your frontend URL after deployment

## Troubleshooting

- If build fails, check that all dependencies are in `dependencies` (not `devDependencies`)
- Ensure Prisma schema is committed to git
- Check Vercel build logs for detailed error messages

