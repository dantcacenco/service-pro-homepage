'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationSectionProps {
  title: string;
  description: string;
  features: string[];
}

export default function ScrollAnimationSection({
  title,
  description,
  features,
}: ScrollAnimationSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the section while animations play
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=200%',
        pin: true,
        pinSpacing: true,
      });

      // Rotate mockup based on scroll (0 to 360 degrees)
      gsap.to(mockupRef.current, {
        rotateY: 360,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200%',
          scrub: 1,
        },
      });

      // Scale mockup for dramatic effect
      gsap.fromTo(
        mockupRef.current,
        { scale: 0.8, opacity: 0.5 },
        {
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=50%',
            scrub: 1,
          },
        }
      );

      // Fade in/out text content
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=30%',
            scrub: 1,
          },
        }
      );

      gsap.to(contentRef.current, {
        opacity: 0,
        y: -50,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '+=70%',
          end: '+=100%',
          scrub: 1,
        },
      });

      // Animate progress bar
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200%',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center bg-white"
    >
      <div className="container mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <div ref={contentRef} className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight text-text-dark md:text-5xl">
              {title}
            </h2>
            <p className="text-lg leading-relaxed text-text-light">
              {description}
            </p>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="mt-1 h-6 w-6 flex-shrink-0 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-text-dark">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rotating Mockup */}
          <div className="flex items-center justify-center">
            <div
              ref={mockupRef}
              className="relative h-[500px] w-[300px]"
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            >
              {/* Phone Mockup */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary to-accent p-2 shadow-2xl">
                <div className="h-full w-full overflow-hidden rounded-[2.5rem] bg-white">
                  {/* Notch */}
                  <div className="mx-auto mt-4 h-6 w-32 rounded-full bg-gray-900" />

                  {/* Screen Content */}
                  <div className="space-y-4 p-6 pt-8">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="mt-6 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-20 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
        <div
          ref={progressRef}
          className="h-full origin-left scale-x-0 bg-gradient-to-r from-primary to-accent"
        />
      </div>
    </section>
  );
}
