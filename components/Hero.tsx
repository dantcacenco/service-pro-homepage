'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect on background
      gsap.to(bgRef.current, {
        y: 300,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Fade out content as user scrolls
      gsap.to([headlineRef.current, subheadlineRef.current, ctaRef.current], {
        opacity: 0,
        y: -50,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '50% top',
          scrub: true,
        },
      });

      // Initial animation on load
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(headlineRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
      })
        .from(
          subheadlineRef.current,
          {
            opacity: 0,
            y: 30,
            duration: 0.8,
          },
          '-=0.5'
        )
        .from(
          ctaRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          '-=0.4'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white to-secondary"
    >
      {/* Parallax Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent"
      />

      <div className="container mx-auto px-6 py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Headline */}
          <h1
            ref={headlineRef}
            className="mb-6 text-5xl font-bold leading-tight tracking-tight text-text-dark md:text-7xl"
          >
            Automate Your Business,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Amplify Your Growth
            </span>
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadlineRef}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-light md:text-xl"
          >
            Custom automation solutions built for local service businesses. From
            email campaigns to customer follow-ups, we handle the tech so you
            can focus on what you do best.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="#demos"
              className="group relative overflow-hidden rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary-dark hover:shadow-xl"
            >
              <span className="relative z-10">See Live Demos</span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-accent to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </a>
            <a
              href="#email-builder"
              className="rounded-full border-2 border-primary px-8 py-4 text-lg font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white"
            >
              Try Email Builder
            </a>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-text-light"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}
