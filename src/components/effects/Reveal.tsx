import React from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds, typically index * 0.05 for list items. */
  delay?: number;
  style?: React.CSSProperties;
}

/**
 * Wraps content so it fades and rises into place the first time it scrolls
 * into view, with an optional stagger delay. Used across every list in the
 * app (gifts, gallery, dates, recipes, purchases) so content feels like
 * it's being uncovered rather than just appearing.
 */
export default function Reveal({ children, className = "", delay = 0, style }: RevealProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
