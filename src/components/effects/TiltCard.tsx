import React, { useRef, useState } from "react";
import { motion } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. Keep small for subtlety on dense content. */
  maxTilt?: number;
  /** Adds a glare sweep that follows the cursor. */
  glare?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Wraps any content in a subtle, cursor-reactive 3D tilt - the card leans
 * toward the cursor as if it has real physical presence on a table. Used
 * throughout the app on cards (gifts, photos, recipes, dates) for the
 * "cursor movement" animation layer, kept restrained (small max tilt) so
 * it reads as tactile rather than gimmicky.
 */
export default function TiltCard({ children, className = "", maxTilt = 6, glare = false, style, onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    setRotate({
      x: (0.5 - py) * maxTilt * 2,
      y: (px - 0.5) * maxTilt * 2,
    });
    if (glare) setGlarePos({ x: px * 100, y: py * 100 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative ${className}`}
      style={{ ...style, perspective: 1000 }}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.4 }}
    >
      {children}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.10), transparent 55%)`,
          }}
        />
      )}
    </motion.div>
  );
}
