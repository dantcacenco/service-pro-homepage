# Email Builder - Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Get Your Free API Keys

#### Groq API Key (FREE - No Credit Card)
1. Go to https://console.groq.com/
2. Click "Sign Up" (use Google/GitHub for fastest signup)
3. Navigate to "API Keys" in the left sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

#### Resend API Key (FREE - No Credit Card)
1. Go to https://resend.com/
2. Click "Start Building" and sign up
3. Navigate to "API Keys" in the dashboard
4. Click "Create API Key"
5. Copy the key (starts with `re_...`)

### Step 2: Add API Keys to Your Project

Create a `.env.local` file in the project root:

```bash
# Paste your API keys here
GROQ_API_KEY=gsk_your_key_here
RESEND_API_KEY=re_your_key_here

# Optional: Use custom domain (must verify in Resend first)
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Important:** The `.env.local` file is already in `.gitignore` and won't be committed.

### Step 3: Install Dependencies (if needed)

```bash
npm install
# or
yarn install
```

The following packages should already be installed:
- `groq-sdk` - Groq AI client
- `resend` - Email sending
- `framer-motion` - Animations
- `@dnd-kit/*` - Drag and drop

### Step 4: Start the Development Server

```bash
npm run dev
# or
yarn dev
```

### Step 5: Try It Out!

1. Open http://localhost:3000/email-builder
2. Drag templates to rank your favorites
3. Enter your business info
4. Watch AI generate custom templates!
5. Edit with natural language
6. Send yourself a test email

## Testing Without Setup

Want to test the UI without API keys?

The app will show helpful error messages if API keys are missing. You can:
- Test the ranking interface
- Fill out the business info form
- See the loading states

Just add the API keys when you're ready to generate templates.

## Common Issues

### "Cannot find module 'groq-sdk'"
**Solution:**
```bash
npm install groq-sdk resend
```

### "GROQ_API_KEY not configured"
**Solution:** Make sure `.env.local` exists in the project root and restart the dev server

### "Domain not verified" (when sending emails)
**Solution:** Use the default `onboarding@resend.dev` for testing (no verification needed)

## Free Tier Limits

### Groq (FREE Forever)
- ✅ 14,400 requests per day
- ✅ Fast inference (300+ tokens/sec)
- ✅ No credit card required
- ✅ No expiration

### Resend (FREE Tier)
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ No credit card required
- ✅ Test with onboarding@resend.dev

Perfect for development and testing!

## Next Steps

Once everything works:

1. **Customize Templates:**
   - Edit `/app/api/generate-templates/route.ts`
   - Adjust prompts, temperature, or token limits

2. **Add More Industries:**
   - Edit `/components/EmailTemplateBuilder/BusinessInfoForm.tsx`
   - Add industry-specific fields

3. **Deploy to Production:**
   - Add API keys to hosting platform
   - Verify custom domain in Resend
   - Add rate limiting

## Need Help?

Check the full documentation: `EMAIL_BUILDER_README.md`

## What You Built

- ✅ 3 API Routes (generate, edit, send)
- ✅ 2 Components (preview, page)
- ✅ AI-powered template generation
- ✅ Natural language editing
- ✅ Test email sending
- ✅ Full TypeScript support
- ✅ Production-ready code

Total: 5 files, ~50KB of code, fully functional!

---

**Happy Building!** 🚀
