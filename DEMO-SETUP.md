# Demo Setup Instructions

The demo dashboard is now accessible at `/demo` on your homepage.

## Current Setup

- **Homepage:** Deployed with "See Live Demo" button linking to `/demo`
- **Demo Page:** Currently shows iframe placeholder

## To Complete Demo Integration

### Option 1: Separate Deployment + Rewrites (Recommended)

1. **Deploy the demo app separately:**
   ```bash
   cd /Users/dantcacenco/Documents/GitHub/service-pro-demo

   # Create new GitHub repo
   # Then push and deploy to Vercel
   vercel --prod
   ```

2. **Update vercel.json with your demo URL:**
   ```json
   {
     "rewrites": [
       {
         "source": "/demo/:path*",
         "destination": "https://your-demo-url.vercel.app/:path*"
       }
     ]
   }
   ```

3. **Remove the iframe page** (won't be needed with rewrites):
   ```bash
   rm -rf app/demo
   ```

### Option 2: Iframe (Current - Quick Solution)

Update `/app/demo/page.tsx` line 29:
```typescript
src="https://your-deployed-demo-url.vercel.app"
```

## Why Not Embed Directly?

The dashboard requires:
- 40+ additional npm packages (Supabase, Radix UI, etc.)
- Separate database connection
- Complex API routes
- Auth system

It's architecturally cleaner to deploy it separately and use rewrites to make it appear at `/demo`.

## Next Steps

1. Follow the setup in `/Users/dantcacenco/Documents/GitHub/service-pro-demo/NEXT-STEPS.md`
2. Deploy demo to Vercel
3. Update either `vercel.json` or `app/demo/page.tsx` with the URL
4. Test at `service-pro.app/demo`
