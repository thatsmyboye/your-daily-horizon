import { Variants } from "framer-motion";

/**
 * Standard motion variants following the Horizon design system
 */

// Fade + Rise In: Page transition & cards
export const fadeRiseIn: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Staggered children animation for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Pulse Glow: Active mission node
export const pulseGlow = {
  scale: [1, 1.05, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 1.2,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "loop" as const
  }
};

// Level-Up Confetti: Achievement moment
export const levelUpScale: Variants = {
  hidden: { 
    scale: 0.8, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.8,
      bounce: 0.4
    }
  }
};

// Hover Micro-Scale: Interactive feedback
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: "easeOut"
  }
};

export const tapScale = {
  scale: 0.95,
  transition: {
    duration: 0.1,
    ease: "easeOut"
  }
};

// Combined hover and tap for buttons
export const interactiveScale = {
  whileHover: hoverScale,
  whileTap: tapScale
};

// Modal/Dialog animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

// Page transition
export const pageTransition: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};
