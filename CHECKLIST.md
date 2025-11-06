# Implementation Checklist

This checklist breaks down all features into small, actionable implementation steps. Check off items as you complete them.

## Phase 1: Foundation & Landing Page

### Project Setup
- [ ] Initialize Next.js 14+ project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Create `.env.local` file with environment variables
- [ ] Configure `next.config.ts` for image optimization
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Create `.gitignore` with appropriate excludes

### Install Dependencies
- [ ] Install GSAP: `npm install gsap`
- [ ] Install GSAP React plugin: `npm install @gsap/react`
- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Install React Email: `npm install react-email @react-email/components`
- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Install Resend: `npm install resend`
- [ ] Install DND Kit: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Install additional utilities: `npm install clsx tailwind-merge`
- [ ] Verify all dependencies in `package.json`

### Project Structure
- [ ] Create `app/page.tsx` - main landing page
- [ ] Create `app/layout.tsx` - root layout
- [ ] Create `app/globals.css` - global styles
- [ ] Create `app/email-builder/page.tsx` - email builder demo page
- [ ] Create `app/api/generate-templates/route.ts` - API route
- [ ] Create `app/api/send-test-email/route.ts` - API route
- [ ] Create `components/` directory
- [ ] Create `lib/` directory
- [ ] Create `public/images/` directory structure

### Basic Landing Page Structure
- [ ] Create root layout with metadata
- [ ] Set up global CSS with Tailwind directives
- [ ] Create basic page structure with semantic HTML
- [ ] Add color palette to Tailwind config
- [ ] Create reusable container component
- [ ] Set up font loading (Inter or similar modern font)

### Hero Section
- [ ] Create `components/Hero.tsx`
- [ ] Add headline with gradient text effect
- [ ] Add subheadline and CTA button
- [ ] Implement parallax background effect
- [ ] Add hero image or illustration
- [ ] Make responsive for mobile
- [ ] Add smooth scroll-to-section functionality

### First Scroll Animation Section
- [ ] Create `components/ScrollAnimationSection.tsx`
- [ ] Initialize GSAP and ScrollTrigger
- [ ] Implement section pinning during scroll
- [ ] Create rotating mockup component
- [ ] Add scroll progress indicator
- [ ] Tie rotation to scroll position (0-360 degrees)
- [ ] Add fade in/out text content
- [ ] Optimize for 60fps (use transform3d)
- [ ] Test on mobile devices
- [ ] Add loading state for images

---

## Phase 2: Email Template Builder - Frontend

### Create 10 Pre-Designed Email Templates
- [ ] Create `lib/email-templates/` directory
- [ ] Design template 1: Minimalist modern (lots of white space)
- [ ] Design template 2: Bold and colorful (vibrant colors)
- [ ] Design template 3: Corporate professional (blue/gray palette)
- [ ] Design template 4: Image-focused (large hero image)
- [ ] Design template 5: Split layout (text + image columns)
- [ ] Design template 6: Dark mode design
- [ ] Design template 7: Playful/friendly (rounded corners, soft colors)
- [ ] Design template 8: Luxury/premium (gold accents, serif fonts)
- [ ] Design template 9: Newsletter style (multi-section)
- [ ] Design template 10: Promotional (sale/discount focused)
- [ ] Test all templates in Litmus or Email on Acid
- [ ] Ensure inline CSS in all templates
- [ ] Create thumbnail previews for each template

### Ranking Interface
- [ ] Create `components/EmailTemplateBuilder/RankingInterface.tsx`
- [ ] Display grid of 10 email template thumbnails
- [ ] Add ranking numbers (1-10) to each template
- [ ] Implement drag-and-drop with @dnd-kit/sortable
- [ ] Add smooth reordering animations
- [ ] Show visual feedback on drag (lift effect, shadow)
- [ ] Highlight top-ranked templates (glow effect)
- [ ] Add progress indicator component
- [ ] Implement "analyzing preferences" animation
- [ ] Add keyboard navigation for accessibility
- [ ] Make responsive for mobile (touch-friendly)
- [ ] Store ranking state in React state

### Business Info Form
- [ ] Create `components/EmailTemplateBuilder/BusinessInfoForm.tsx`
- [ ] Add business name input field
- [ ] Create industry dropdown with all options
- [ ] Add email address input with validation
- [ ] Add optional brand color picker
- [ ] Add optional logo upload with preview
- [ ] Implement conditional fields based on industry
  - [ ] HVAC: Service type, emergency availability
  - [ ] Windows/Doors: Installation timeline, energy ratings
  - [ ] Landscaping: Seasonal services
  - [ ] Plumbing: Emergency services
- [ ] Add form validation (Zod or similar)
- [ ] Show loading state during submission
- [ ] Add smooth transitions between form steps
- [ ] Make form responsive for mobile

### Email Builder Page Integration
- [ ] Create `/email-builder` page layout
- [ ] Integrate RankingInterface component
- [ ] Integrate BusinessInfoForm component
- [ ] Implement multi-step flow:
  1. [ ] Step 1: Rank templates
  2. [ ] Step 2: Fill business info (runs parallel to AI analysis)
  3. [ ] Step 3: View generated templates
  4. [ ] Step 4: Edit and send test
- [ ] Add step indicator (progress bar)
- [ ] Add "Back" and "Next" buttons
- [ ] Implement smooth transitions between steps
- [ ] Add loading states between steps
- [ ] Handle errors gracefully

---

## Phase 3: Email Template Builder - Backend

### Claude API Integration Setup
- [ ] Create `lib/utils/claude-api.ts`
- [ ] Set up Anthropic client with API key
- [ ] Create function to format template data for Claude
- [ ] Add error handling for API calls
- [ ] Implement retry logic for failed requests
- [ ] Add request timeout handling

### Template Analysis Logic
- [ ] Create function to extract template characteristics:
  - [ ] Layout type (single column, multi-column, etc.)
  - [ ] Color palette (extract hex codes)
  - [ ] Typography (fonts, sizes, weights)
  - [ ] Spacing patterns (padding, margins)
  - [ ] Image usage (placement, size)
- [ ] Weight characteristics by user ranking (top = more weight)
- [ ] Generate "taste profile" summary

### Generate Templates API Route
- [ ] Implement `/api/generate-templates/route.ts`
- [ ] Accept POST request with ranking data and business info
- [ ] Analyze ranked templates
- [ ] Create Claude prompt for template generation:
  - [ ] Include taste profile
  - [ ] Include business information
  - [ ] Include industry-specific requirements
  - [ ] Request 2-3 template variations
- [ ] Parse Claude response for HTML templates
- [ ] Validate generated HTML
- [ ] Ensure inline CSS in generated templates
- [ ] Return templates as JSON response
- [ ] Add error handling and logging

### Template Preview Component
- [ ] Create `components/EmailTemplateBuilder/TemplatePreview.tsx`
- [ ] Display 2-3 generated templates side-by-side
- [ ] Add mobile/desktop view toggle
- [ ] Implement iframe preview for email rendering
- [ ] Add "Select" button for each template
- [ ] Show selected template in larger view
- [ ] Add smooth animations for switching views
- [ ] Make responsive for mobile (stack vertically)

### Natural Language Editing
- [ ] Add text input for edit requests
- [ ] Add "Apply Edit" button
- [ ] Create edit API call to Claude:
  - [ ] Send current template HTML
  - [ ] Send user's natural language request
  - [ ] Request modified HTML
- [ ] Update preview with edited template
- [ ] Show loading state during edit
- [ ] Add example edit prompts (placeholder text)
- [ ] Handle invalid edit requests gracefully
- [ ] Add undo functionality (keep edit history)

---

## Phase 4: Email Sending

### Email Sending API
- [ ] Implement `/api/send-test-email/route.ts`
- [ ] Set up Resend client with API key
- [ ] Accept POST request with email address and HTML template
- [ ] Validate email address format
- [ ] Create email subject line (dynamic based on business)
- [ ] Send email via Resend
- [ ] Return success/error response
- [ ] Add rate limiting (prevent spam)
- [ ] Log sent emails (for debugging)

### Send Test Email UI
- [ ] Add "Send Test Email" button to preview
- [ ] Show confirmation modal before sending
- [ ] Display email address to be sent to
- [ ] Add loading state during send
- [ ] Show success message with animation
- [ ] Show error message if send fails
- [ ] Add option to edit email address
- [ ] Add "Resend" functionality

---

## Phase 5: Additional Micro-Service Demos

### Email Reminder Demo
- [ ] Create `components/MicroServiceDemos/EmailReminderDemo.tsx`
- [ ] Design component layout
- [ ] Add email input field
- [ ] Add reminder type dropdown:
  - [ ] Appointment reminder
  - [ ] Follow-up reminder
  - [ ] Maintenance reminder
  - [ ] Payment reminder
- [ ] Create pre-built reminder email templates
- [ ] Add "Send Demo Reminder" button
- [ ] Implement send functionality (API call)
- [ ] Show loading state
- [ ] Add success animation (checkmark, confetti)
- [ ] Show confirmation message
- [ ] Handle errors gracefully
- [ ] Make responsive for mobile

### Photo Progress Tracker Demo
- [ ] Create `components/MicroServiceDemos/PhotoProgressDemo.tsx`
- [ ] Add image upload functionality
- [ ] Create image gallery component
- [ ] Display images in sequence: Before → Progress 1 → Progress 2 → After
- [ ] Add smooth transitions between images
- [ ] Implement automatic alignment and sizing
- [ ] Create before/after comparison slider
- [ ] Add drag interaction for slider
- [ ] Implement swipe gestures for mobile
- [ ] Add sample images as fallback
- [ ] Optimize image loading (lazy load)
- [ ] Make responsive for mobile

### AI Chatbot Preview
- [ ] Create `components/MicroServiceDemos/ChatbotDemo.tsx`
- [ ] Design chat widget UI
- [ ] Create message bubble component
- [ ] Add chat input field
- [ ] Implement typing indicator
- [ ] Add message animations (slide in)
- [ ] Create Claude API integration for responses
- [ ] Add context about business automation services
- [ ] Implement example prompts/questions
- [ ] Add message history
- [ ] Make mobile-optimized
- [ ] Add smooth scroll to latest message
- [ ] Handle long responses gracefully

### Integrate Demos into Landing Page
- [ ] Create demos section on main page
- [ ] Add section heading and description
- [ ] Integrate EmailReminderDemo
- [ ] Integrate PhotoProgressDemo
- [ ] Integrate ChatbotDemo
- [ ] Add tabs or carousel for multiple demos
- [ ] Implement smooth transitions between demos
- [ ] Add scroll animations for demo section
- [ ] Make responsive for mobile

---

## Phase 6: Landing Page Completion

### Product Showcase Section
- [ ] Create scroll-triggered product showcase
- [ ] Add rotating 3D mockup or illustration
- [ ] Implement scroll-linked rotation
- [ ] Add descriptive text that fades in/out
- [ ] Pin section during animation
- [ ] Add multiple product features (carousel or staggered)
- [ ] Optimize for mobile

### Benefits/Features Section
- [ ] Create features grid layout
- [ ] Add icons for each feature
- [ ] Write compelling copy for each benefit
- [ ] Add scroll animations (stagger effect)
- [ ] Make responsive for mobile
- [ ] Add hover effects on desktop

### Pricing/CTA Section
- [ ] Design pricing card layout
- [ ] Add 2-3 pricing tiers
- [ ] Include features list for each tier
- [ ] Add prominent CTA buttons
- [ ] Implement hover effects
- [ ] Add scroll animation for pricing cards
- [ ] Make responsive for mobile
- [ ] Add contact form or calendar booking link

### Additional Polish
- [ ] Add smooth scroll behavior
- [ ] Implement "Back to Top" button
- [ ] Add footer with links
- [ ] Create 404 page
- [ ] Add loading screen/splash
- [ ] Implement page transitions

---

## Phase 7: Animations & Polish

### GSAP Scroll Animations
- [ ] Create `lib/animations/scroll-animations.ts`
- [ ] Implement utility functions for common scroll effects
- [ ] Add scroll-triggered fade-ins
- [ ] Add scroll-triggered slide-ins
- [ ] Add parallax helper function
- [ ] Add pin-section helper function
- [ ] Add rotation helper function
- [ ] Test all animations on mobile
- [ ] Optimize for 60fps (use will-change sparingly)

### Framer Motion Transitions
- [ ] Create `lib/animations/transitions.ts`
- [ ] Define common transition presets
- [ ] Add page transition animations
- [ ] Add component mount/unmount animations
- [ ] Add hover/tap animations
- [ ] Add loading state animations
- [ ] Test all transitions on mobile

### Animation Performance Optimization
- [ ] Use `transform` and `opacity` only for animations
- [ ] Add `will-change` sparingly and remove after animation
- [ ] Implement intersection observer for lazy animations
- [ ] Reduce animation complexity on low-end devices
- [ ] Test frame rate with Chrome DevTools
- [ ] Optimize for mobile (reduce motion if preferred)

---

## Phase 8: Responsive Design & Mobile Optimization

### Mobile Responsiveness
- [ ] Test all pages on mobile devices (iPhone, Android)
- [ ] Verify touch targets are 44x44px minimum
- [ ] Test all animations on mobile
- [ ] Ensure text is readable without zooming
- [ ] Test forms on mobile keyboards
- [ ] Verify images load quickly on mobile
- [ ] Test drag-and-drop on touch devices

### Responsive Breakpoints
- [ ] Mobile: 320px - 639px
- [ ] Tablet: 640px - 1023px
- [ ] Desktop: 1024px+
- [ ] Test all breakpoints
- [ ] Adjust layouts for each breakpoint
- [ ] Hide/show elements appropriately

### Performance on Mobile
- [ ] Minimize JavaScript bundle size
- [ ] Lazy load images
- [ ] Lazy load demos (intersection observer)
- [ ] Reduce animation complexity on mobile
- [ ] Test on slow 3G connection
- [ ] Achieve Lighthouse mobile score 90+

---

## Phase 9: SEO & Accessibility

### SEO
- [ ] Add meta title and description
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Create `robots.txt`
- [ ] Create `sitemap.xml`
- [ ] Add structured data (JSON-LD)
- [ ] Optimize images with alt text
- [ ] Use semantic HTML (h1, h2, nav, main, footer)
- [ ] Test with Google Search Console

### Accessibility
- [ ] Add ARIA labels where needed
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add skip-to-content link
- [ ] Add focus indicators
- [ ] Test with keyboard only (no mouse)
- [ ] Add descriptive link text (no "click here")
- [ ] Run Lighthouse accessibility audit

---

## Phase 10: Testing & Deployment

### Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Fix any browser-specific issues

### Email Testing
- [ ] Test generated templates in Gmail (web)
- [ ] Test in Gmail (mobile app)
- [ ] Test in Outlook (web)
- [ ] Test in Outlook (desktop)
- [ ] Test in Apple Mail
- [ ] Test in Yahoo Mail
- [ ] Fix rendering issues

### Performance Testing
- [ ] Run Lighthouse audit
- [ ] Achieve 90+ score on all metrics
- [ ] Test on slow 3G connection
- [ ] Optimize bundle size (code splitting)
- [ ] Optimize images (WebP, AVIF)
- [ ] Enable caching headers

### Final QA
- [ ] Test all forms end-to-end
- [ ] Test all API routes
- [ ] Verify environment variables are set
- [ ] Test error states
- [ ] Test loading states
- [ ] Verify all links work
- [ ] Check for console errors
- [ ] Test analytics tracking

### Deployment
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Set up production environment variables
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Deploy to production
- [ ] Test production site
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up analytics (Google Analytics, Plausible)

---

## Optional Enhancements

- [ ] Add blog or resources section
- [ ] Implement A/B testing for CTAs
- [ ] Add testimonials section
- [ ] Create case studies page
- [ ] Add live chat support
- [ ] Implement cookie consent banner
- [ ] Add newsletter signup
- [ ] Create onboarding flow for new users
- [ ] Add video demonstrations
- [ ] Implement user authentication (for saving templates)
- [ ] Add template library (user-saved templates)
- [ ] Create admin dashboard
- [ ] Add analytics dashboard for users
- [ ] Implement webhooks for automation triggers
