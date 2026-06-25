import React, { useRef, useState } from "react";
import { motion } from "motion/react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** How strongly the button pulls toward the cursor. Keep subtle (0.2-0.4). */
  strength?: number;
  title?: string;
}

/**
 * Wraps a button so it subtly drifts toward the cursor as it approaches,
 * then springs back on leave - used on primary CTAs (Unlock, Claim Gift,
 * Generate, Sign In) for tactile, premium-feeling cursor interactivity.
 * Restrained on purpose: small pull distance, no rotation, so it reads as
 * responsive rather than distracting on a screen with many buttons.
 */
export default function MagneticButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  strength = 0.3,
  title,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: relX * strength, y: relY * strength });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      title={title}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.3 }}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}
