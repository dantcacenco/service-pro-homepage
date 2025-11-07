# Major Features

This document outlines the major features to be implemented for the Service Pro Homepage project, extracted from the project requirements.

## Phase 1: Foundation & Landing Page

### 1.1 Project Setup
- **Next.js 14+ with App Router** - Modern React framework
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first styling
- **Development Environment** - Hot reload, fast refresh, TypeScript checking

### 1.2 Core Dependencies
- **GSAP + ScrollTrigger** - Apple-style scroll animations
- **Framer Motion** - UI transitions and micro-interactions
- **React Email** - Email template rendering
- **Anthropic Claude API** - AI-powered template generation
- **Resend/SendGrid** - Email delivery service
- **@dnd-kit** - Drag-and-drop functionality for ranking

### 1.3 Landing Page Structure
- **Hero Section** - Animated headline with parallax effects
- **Product Showcase** - Scroll-triggered rotating mockup display
- **Interactive Demos Section** - Live demonstrations of micro-services
- **Benefits/Features Section** - Key value propositions
- **Pricing/CTA Section** - Clear call-to-action and pricing tiers

### 1.4 Apple-Style Scroll Animations
- **Section Pinning** - Pin sections while animations play
- **Scroll-Linked Transitions** - Smooth animations tied to scroll position
- **Parallax Effects** - Multi-layer depth on hero section
- **Performance** - 60fps on mobile devices
- **Natural Feel** - Non-jarring, smooth transitions

---

## Phase 2: Email Template Builder (Flagship Feature) - **REDESIGNED**

### 2.1 Design Philosophy Rating System (`/email-builder`)
- **8 Design Philosophy Templates** - Each represents a distinct aesthetic approach
- **1-10 Rating System** - Rate each template on a scale of 1-10 (not drag-and-drop)
- **Modal Preview** - Click thumbnail to view full-size preview (desktop + mobile side-by-side)
- **Progress Indicator** - Visual feedback showing "AI learning your style"
- **Larger Thumbnails** - 300x400px minimum (was too small before)

**8 Design Philosophies:**
1. **Luxury/Premium** - Dark backgrounds, gold accents, elegant serif fonts
2. **Tech/Modern** - White, bold sans-serif, single accent color
3. **Futuristic/AI** - Gradients, neon accents, floating elements
4. **Warm/Friendly** - Warm colors, rounded corners, approachable fonts
5. **Professional/Corporate** - Navy blue, structured, formal layout
6. **Bold/Creative** - Bright colors, asymmetric layouts, large imagery
7. **Minimalist/Zen** - Whitespace, monochromatic, subtle accents
8. **Data-Driven/Analytical** - Charts, tables, structured information

**Requirements:**
- Create 8 distinct design philosophy templates (not generic variations)
- Implement 1-10 star/slider rating for each template
- Add modal component for full-size previews
- Show responsive preview (desktop + mobile) in modal
- Each template must represent a clear aesthetic direction

### 2.2 Business Info Collection Form
**Collected while AI analyzes user preferences in the background**

- **Business Name** - Text input
- **Industry/Type** - Dropdown with options:
  - HVAC
  - Windows & Doors
  - Landscaping
  - Plumbing
  - Roofing
  - Painting
  - General Contractor
  - Other
- **Email Address** - For sending test emails
- **Brand Colors** (optional) - Color picker
- **Logo Upload** (optional) - Image upload

**Smart Form Fields** - Conditional fields based on industry:
- **HVAC:** Service type, before/after photo options, emergency service availability
- **Windows/Doors:** Measurement table, installation timeline, energy ratings
- **Landscaping:** Seasonal services, maintenance plans
- **Plumbing:** Emergency services, fixture types

### 2.3 AI Template Generation Backend - **REDESIGNED**

**API Route:** `/api/generate-templates`

**Smart Preference Analysis Process:**
1. **Analyze Ratings** - Identify top 3 rated design philosophies
2. **Extract Design Patterns** - Determine:
   - Color preferences (dark vs light backgrounds)
   - Typography style (serif vs sans-serif, bold vs elegant)
   - Layout complexity (minimal vs data-heavy)
   - Imagery usage (text-focused vs image-heavy)
3. **Generate Taste Profile** - Synthesize aesthetic preferences from design psychology
4. **Create Custom Templates** - Generate 2-3 templates blending top-rated philosophies

**Template Requirements (CRITICAL):**
- **MUST apply brand colors** - Header, buttons, accents use user's colors
- **MUST include logo** - Prominently displayed in header
- **MUST use industry-specific content** - Realistic scenarios (not generic "Welcome")
- **MUST show proper mobile responsiveness** - True responsive layout with media queries
- **MUST use inline CSS** - Email client compatibility
- **MUST match selected tone** - Professional / Friendly / Casual

**Industry-Specific Content Examples:**
- **Windows/Doors:** Estimate table with dimensions, colors, quantities, pricing
- **HVAC:** Service appointment confirmation with system details
- **Plumbing:** Emergency service details with pricing breakdown
- **Landscaping:** Seasonal service schedule with maintenance plan options

**Groq API Integration:**
- Send top-rated philosophies and their characteristics
- Provide business info (name, industry, colors, logo, tone)
- Request templates with industry-appropriate scenarios
- Generate valid, production-ready HTML email code
- Ensure email client compatibility

### 2.4 Template Preview & Editing - **FIXED**

**Preview Features:**
- **Side-by-Side Display** - Show 2-3 generated templates
- **Responsive Preview Modes:**
  - Desktop View (600px width) - Standard email client
  - Mobile View (375px width) - True responsive layout with media queries
  - **NOT** shrunk desktop view - actual responsive breakpoints
- **Interactive Preview** - Scroll within the email preview
- **Template Switcher** - Easy navigation between generated templates

**Natural Language Editing:**
- **Text Input Interface** - "Make the header blue" or "Larger text"
- **Groq API Integration** - Parse natural language requests
- **Template Modification** - Update HTML based on user requests
- **Real-Time Preview** - Show changes immediately in both desktop and mobile views

**Send Test Email:**
- Button to email the selected template
- Sends to user's provided email address
- Professional formatting in actual email clients
- Success/error feedback with Resend API

### 2.5 Email Sending API

**API Route:** `/api/send-test-email`

**Features:**
- Integrate with Resend or SendGrid
- Send generated HTML template
- Handle success/error states
- Validate email addresses
- Professional sender identity

---

## Phase 3: Additional Micro-Service Demos

### 3.1 Email Reminder Demo
**Purpose:** Showcase automated reminder functionality

**Features:**
- Simple form interface
- Email input field
- Reminder type selection (appointment, follow-up, maintenance, etc.)
- "Send Demo Reminder" button
- Actually sends a real reminder email
- Success animation with confirmation message

**Implementation:**
- Pre-built reminder email templates
- API route for sending
- Form validation
- Loading and success states

### 3.2 Photo Progress Tracker Demo
**Purpose:** Demonstrate before/after project tracking

**Features:**
- Upload or select sample images
- Display progression: Before → In-Progress 1 → In-Progress 2 → After
- Smooth transitions between images
- Automatic alignment and sizing
- Interactive comparison slider (before/after)
- Swipe gestures on mobile

**Implementation:**
- Image upload handling
- Gallery component with transitions
- Comparison slider with drag interaction
- Optimized image loading

### 3.3 AI Chatbot Preview
**Purpose:** Show intelligent customer service automation

**Features:**
- Embedded chat widget on the page
- Responds to basic questions about services
- Typing indicators
- Smooth message animations
- Example prompts/questions
- Mobile-optimized interface

**Implementation:**
- Chat UI component
- Claude API integration for responses
- Message history
- Smooth animations for messages
- Context-aware responses about business automation

---

## Design & Animation Guidelines

### Aesthetic Requirements
- **Clean & Modern** - High-end professional look
- **White Space** - Generous spacing, not cluttered
- **Subtle Gradients** - Soft color transitions
- **Professional Shadows** - Depth without harshness
- **Color Palette:**
  - Primary: Deep blue (#1E40AF)
  - Secondary: Light gray (#F3F4F6)
  - Accent: Vibrant blue (#3B82F6)
  - Text: Dark gray (#1F2937)

### Animation Requirements
- **60fps Performance** - Smooth on all devices
- **Hardware-Accelerated** - Use transform and opacity
- **Natural Timing** - Ease curves that feel organic
- **Mobile-First** - Test all animations on mobile
- **Loading States** - Keep users engaged during waits

### Apple-Style Scroll Effects (Detailed)
- **Pin sections** during scroll for dramatic reveals
- **Fade in/out text** as user scrolls through sections
- **Rotate or scale elements** tied to scroll position
- **Parallax backgrounds** for depth
- **Staggered animations** for lists and cards
- **Smooth momentum** scroll on mobile

---

## Technical Considerations

### Performance
- **Code Splitting** - Dynamic imports for heavy components
- **Lazy Loading** - Load demos only when needed
- **Image Optimization** - Next.js Image component
- **Animation Performance** - GPU-accelerated transforms
- **Bundle Size** - Monitor and optimize package size

### Mobile-First
- **Touch Optimized** - Large touch targets, swipe gestures
- **Responsive Design** - Adapts to all screen sizes
- **Performance** - Smooth animations on mobile devices
- **Testing** - Verify on real mobile devices

### SEO
- **Meta Tags** - Proper title, description, OG tags
- **Semantic HTML** - Proper heading hierarchy
- **Server Components** - Leverage Next.js for SEO
- **Performance** - Fast loading times

### Accessibility
- **Keyboard Navigation** - All interactive elements accessible
- **ARIA Labels** - Proper labels for screen readers
- **Color Contrast** - WCAG AA compliance
- **Focus Management** - Clear focus indicators

### Email Compatibility
- **Inline CSS** - Required for most email clients
- **Table Layouts** - For broad compatibility
- **Tested Clients** - Gmail, Outlook, Apple Mail, Yahoo
- **Responsive Email** - Media queries where supported
- **Fallbacks** - Graceful degradation

---

## Development Priorities

### Priority 1: Foundation (Days 1-2)
1. Next.js setup with all dependencies
2. Landing page structure with basic styling
3. One impressive scroll-pinned section with rotating mockup

### Priority 2: Core Animation System (Days 3-4)
4. GSAP ScrollTrigger integration
5. Multiple scroll-triggered sections
6. Parallax hero section
7. Mobile optimization

### Priority 3: Email Builder - Frontend (Days 5-7)
8. Ranking interface with 10 templates
9. Drag-and-drop functionality
10. Business info form with conditional fields
11. Progress indicators

### Priority 4: Email Builder - Backend (Days 8-10)
12. Claude API integration for template analysis
13. Template generation logic
14. Template preview component
15. Natural language editing interface

### Priority 5: Email Functionality (Days 11-12)
16. Email sending API
17. Test email functionality
18. Error handling and validation

### Priority 6: Additional Demos (Days 13-15)
19. Email reminder demo
20. Photo progress tracker demo
21. AI chatbot preview

### Priority 7: Polish & Optimization (Days 16-18)
22. Animation refinement
23. Mobile responsiveness testing
24. Performance optimization
25. Cross-browser testing
26. SEO optimization
27. Accessibility audit

---

## Success Metrics

- **Performance:** Lighthouse score 90+ on mobile
- **Animations:** Maintain 60fps during all scroll interactions
- **Email Compatibility:** Generated templates work in top 5 email clients
- **Mobile Experience:** All features functional and smooth on mobile
- **User Engagement:** Demos are interactive and showcase value clearly
