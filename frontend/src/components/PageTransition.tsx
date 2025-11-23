import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
}

const PageTransition = ({ children, duration = 0.15 }: PageTransitionProps) => {
  const pageTransition = {
    type: "tween" as const,
    ease: "easeInOut" as const,
    duration: duration,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;  