# Service Pro Homepage

A high-end, mobile-first landing page showcasing custom business automation solutions for local service businesses (HVAC, contractors, landscaping, etc.) with Apple-level scroll animations and interactive micro-service demos.

## ⚠️ DOCUMENTATION RULES

**CRITICAL:** This project uses ONLY THREE documentation files:

1. **README.md** (this file) - Project overview, setup, and structure
2. **FEATURES.md** - Feature specifications and requirements
3. **CHECKLIST.md** - Implementation tasks and progress tracking

**DO NOT CREATE:**
- ❌ Summary files (e.g., `SUMMARY.md`, `NOTES.md`)
- ❌ Separate feature docs (e.g., `EMAIL_BUILDER_README.md`, `API_DOCS.md`)
- ❌ Quick start guides (e.g., `QUICK_START.md`, `SETUP.md`)
- ❌ Test result files (unless temporary during testing, then DELETE immediately after)
- ❌ Design documents (e.g., `DESIGN.md`, `ARCHITECTURE.md`)
- ❌ Any other markdown files

**ALL information belongs in one of the three main files above.**

---

## Project Scope

This is a Next.js 14+ application featuring:
- **Apple-style scroll animations** using GSAP and ScrollTrigger
- **Interactive AI-powered email template builder** that learns user preferences
- **Live micro-service demonstrations** (email reminders, photo progress tracking, chatbot)
- **Mobile-first responsive design** with 60fps animations
- **Groq AI integration** (free tier) for intelligent template generation
- **Local HIPAA-compliant AI** solutions for regulated industries

## Tech Stack

- **Framework:** Next.js 16.0.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** GSAP + ScrollTrigger, Framer Motion
- **Email:** React Email, Resend
- **AI:** Groq (Llama 3.1 70B - free tier, 300+ tokens/sec)
- **Interactions:** @dnd-kit/core for template interactions

## Project Workflow

**IMPORTANT:** When starting a new session or working on this project:

1. **Read this README first** - Understand the project scope and structure
2. **Check FEATURES.md** - Review the major features and their requirements
3. **Consult CHECKLIST.md** - Find outstanding tasks and implementation steps

This workflow ensures consistency and helps track progress across development sessions.

## File Structure

```
service-pro-homepage/
├── README.md                    # This file - project overview
├── FEATURES.md                  # Major features and requirements
├── CHECKLIST.md                 # Step-by-step implementation tasks
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
│
├── app/
│   ├── page.tsx                 # Main landing page
│   ├── layout.tsx               # Root layout (includes Calendly widget)
│   ├── globals.css              # Global styles with custom design tokens
│   │
│   ├── email-builder/           # Email template builder page
│   │   └── page.tsx
│   │
│   └── api/                     # API routes
│       ├── generate-templates/
│       │   └── route.ts         # Groq AI template generation
│       ├── edit-template/
│       │   └── route.ts         # Natural language template editing
│       └── send-test-email/
│           └── route.ts         # Resend email sending
│
├── components/
│   ├── Hero.tsx                 # Hero section with parallax effects
│   ├── ScrollAnimationSection.tsx  # Scroll-pinned email demo section
│   ├── LocalAISection.tsx       # Local HIPAA-compliant AI showcase
│   │
│   ├── EmailTemplateBuilder/   # Email builder components
│   │   ├── RankingInterface.tsx     # Template rating (1-10 scale)
│   │   ├── BusinessInfoForm.tsx     # Business details with industry fields
│   │   └── TemplatePreview.tsx      # Preview & natural language editing
│   │
│   └── MicroServiceDemos/       # Additional demo components (future)
│       ├── EmailReminderDemo.tsx
│       ├── PhotoProgressDemo.tsx
│       └── ChatbotDemo.tsx
│
├── lib/
│   ├── email-templates/         # 8 design philosophy templates (20 total)
│   │   ├── index.ts             # Template exports and utilities
│   │   ├── template-01-measurements-report.ts
│   │   ├── template-02-minimalist-modern.ts
│   │   └── ... (templates 03-20)
│   │
│   ├── animations/              # GSAP animation utilities
│   │   ├── scroll-animations.ts
│   │   └── transitions.ts
│   │
│   └── utils/                   # Helper functions
│       └── (to be added as needed)
│
└── public/
    └── images/                  # Static assets
        ├── mockups/
        └── demos/
```

## Environment Variables

Create a `.env.local` file with:

```env
GROQ_API_KEY=your_groq_api_key_here
RESEND_API_KEY=your_resend_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here  # Optional, not currently used
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Get API Keys:**
- **Groq:** https://console.groq.com (free tier: 14,400 requests/day)
- **Resend:** https://resend.com (free tier: 100 emails/day)
- **Calendly:** https://calendly.com/volk_productions/new-meeting (for consultations)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Key Features

1. **Landing Page** - Hero, scroll animations, product showcase, pricing
2. **Email Template Builder** - AI-powered template generation based on user preferences
3. **Interactive Demos** - Live demonstrations of automation capabilities
4. **Mobile-First Design** - Optimized for touch devices with smooth animations
5. **Performance Optimized** - Code-splitting, lazy loading, 60fps animations

## Design Principles

- **Clean & Modern:** Lots of white space, subtle gradients
- **High-End Aesthetic:** Professional color palette, careful typography
- **Smooth Animations:** Hardware-accelerated, natural scroll effects
- **Mobile-First:** All features work perfectly on mobile devices
- **Accessible:** Keyboard navigation, ARIA labels, semantic HTML

## Getting Started

After reading this README, check `FEATURES.md` for detailed feature requirements, then `CHECKLIST.md` for the current development status and next steps.
