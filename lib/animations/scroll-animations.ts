import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Creates a parallax effect on an element
 * @param element - Target element
 * @param trigger - Element that triggers the animation
 * @param yDistance - How far to move the element (default: 300)
 */
export const createParallax = (
  element: gsap.TweenTarget,
  trigger: gsap.DOMTarget,
  yDistance: number = 300
) => {
  return gsap.to(element, {
    y: yDistance,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
};

/**
 * Pins a section while animations play
 * @param element - Section to pin
 * @param duration - Pin duration (default: '+=200%')
 */
export const pinSection = (
  element: gsap.DOMTarget,
  duration: string = '+=200%'
) => {
  return ScrollTrigger.create({
    trigger: element,
    start: 'top top',
    end: duration,
    pin: true,
    pinSpacing: true,
  });
};

/**
 * Fades in an element on scroll
 * @param element - Element to fade in
 * @param trigger - Scroll trigger element
 * @param options - Animation options
 */
export const fadeInOnScroll = (
  element: gsap.TweenTarget,
  trigger: gsap.DOMTarget,
  options?: {
    start?: string;
    end?: string;
    scrub?: boolean | number;
    fromY?: number;
  }
) => {
  return gsap.fromTo(
    element,
    {
      opacity: 0,
      y: options?.fromY || 50,
    },
    {
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger,
        start: options?.start || 'top 80%',
        end: options?.end || 'top 50%',
        scrub: options?.scrub !== undefined ? options.scrub : 1,
      },
    }
  );
};

/**
 * Creates a staggered animation for multiple elements
 * @param elements - Array of elements to animate
 * @param trigger - Scroll trigger element
 * @param stagger - Stagger delay (default: 0.1)
 */
export const staggerOnScroll = (
  elements: gsap.TweenTarget,
  trigger: gsap.DOMTarget,
  stagger: number = 0.1
) => {
  return gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 50,
    },
    {
      opacity: 1,
      y: 0,
      stagger,
      ease: 'power2.out',
      scrollTrigger: {
        trigger,
        start: 'top 80%',
        end: 'top 50%',
        scrub: 1,
      },
    }
  );
};

/**
 * Creates a progress bar tied to scroll position
 * @param progressBar - Progress bar element
 * @param trigger - Section to track
 */
export const createScrollProgress = (
  progressBar: gsap.TweenTarget,
  trigger: gsap.DOMTarget
) => {
  return gsap.to(progressBar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
};

/**
 * Rotates an element based on scroll position
 * @param element - Element to rotate
 * @param trigger - Scroll trigger
 * @param degrees - Rotation degrees (default: 360)
 * @param axis - Rotation axis (default: 'y')
 */
export const rotateOnScroll = (
  element: gsap.TweenTarget,
  trigger: gsap.DOMTarget,
  degrees: number = 360,
  axis: 'x' | 'y' | 'z' = 'y'
) => {
  const property = axis === 'x' ? 'rotateX' : axis === 'y' ? 'rotateY' : 'rotateZ';

  return gsap.to(element, {
    [property]: degrees,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: '+=200%',
      scrub: 1,
    },
  });
};

/**
 * Cleanup function to kill all ScrollTrigger instances
 */
export const killAllScrollTriggers = () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
};
