import type { Variants } from 'framer-motion';

/**
 * Common transition presets for Framer Motion
 */

// Smooth spring transition
export const spring = {
  type: 'spring' as const,
  damping: 20,
  stiffness: 100,
};

// Quick easing transition
export const ease = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.3,
};

// Slow smooth transition
export const smooth = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.6,
};

/**
 * Fade in/out variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: ease },
  exit: { opacity: 0, transition: ease },
};

/**
 * Slide up variants
 */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -50, transition: ease },
};

/**
 * Scale variants
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.8, transition: ease },
};

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Stagger child item
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring,
  },
};

/**
 * Hover scale effect
 */
export const hoverScale = {
  scale: 1.05,
  transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

/**
 * Tap scale effect
 */
export const tapScale = {
  scale: 0.95,
};
