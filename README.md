# Service Pro Homepage

A high-end, mobile-first landing page showcasing custom business automation solutions for local service businesses (HVAC, contractors, landscaping, etc.) with Apple-level scroll animations and interactive micro-service demos.

## Project Scope

This is a Next.js 14+ application featuring:
- **Apple-style scroll animations** using GSAP and ScrollTrigger
- **Interactive AI-powered email template builder** that learns user preferences
- **Live micro-service demonstrations** (email reminders, photo progress tracking, chatbot)
- **Mobile-first responsive design** with 60fps animations
- **Claude API integration** for intelligent template generation

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** GSAP + ScrollTrigger, Framer Motion
- **Email:** React Email, Resend/SendGrid
- **AI:** Anthropic Claude API
- **Interactions:** @dnd-kit/core for drag-and-drop ranking

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
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   │
│   ├── email-builder/           # Email template builder demo page
│   │   └── page.tsx
│   │
│   └── api/                     # API routes
│       ├── generate-templates/
│       │   └── route.ts         # Claude AI template generation
│       └── send-test-email/
│           └── route.ts         # Email sending functionality
│
├── components/
│   ├── Hero.tsx                 # Hero section with parallax
│   ├── ScrollAnimationSection.tsx  # Reusable scroll-pinned sections
│   │
│   ├── EmailTemplateBuilder/   # Email builder components
│   │   ├── RankingInterface.tsx     # Drag-to-rank templates
│   │   ├── BusinessInfoForm.tsx     # Business details collection
│   │   └── TemplatePreview.tsx      # Preview & editing interface
│   │
│   └── MicroServiceDemos/       # Additional demo components
│       ├── EmailReminderDemo.tsx
│       ├── PhotoProgressDemo.tsx
│       └── ChatbotDemo.tsx
│
├── lib/
│   ├── email-templates/         # Pre-made template examples (10 templates)
│   │   ├── template-01.tsx
│   │   ├── template-02.tsx
│   │   └── ...
│   │
│   ├── animations/              # GSAP animation utilities
│   │   ├── scroll-animations.ts
│   │   └── transitions.ts
│   │
│   └── utils/                   # Helper functions
│       ├── claude-api.ts
│       └── email-sender.ts
│
└── public/
    └── images/                  # Static assets
        ├── mockups/
        └── demos/
```

## Environment Variables

Create a `.env.local` file with:

```env
ANTHROPIC_API_KEY=your_claude_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

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
