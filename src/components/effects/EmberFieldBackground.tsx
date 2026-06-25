import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type SanctuaryTheme = "passionate-red" | "midnight-blue" | "golden-hour";

const THEME_COLORS: Record<SanctuaryTheme, { core: string; glow: string }> = {
  "passionate-red": { core: "#ff6b5a", glow: "#7f1d1d" },
  "midnight-blue": { core: "#7aa9ff", glow: "#1e3a8a" },
  "golden-hour": { core: "#ffcf6b", glow: "#92400e" },
};

const PARTICLE_COUNT = 140;

function EmberField({ theme }: { theme: SanctuaryTheme }) {
  const pointsRef = useRef<THREE.Points>(null);
  const colors = THEME_COLORS[theme];

  // Each ember gets a random starting position, drift speed, horizontal
  // sway phase, and size - generated once and reused every frame so the
  // motion is stable rather than re-randomized on every render.
  const { positions, speeds, sways, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const sways = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6; // z
      speeds[i] = 0.15 + Math.random() * 0.35;
      sways[i] = Math.random() * Math.PI * 2;
      sizes[i] = 0.04 + Math.random() * 0.09;
    }
    return { positions, speeds, sways, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let y = posAttr.getY(i) + speeds[i] * delta;
      // Once an ember drifts above the top, recycle it back to the bottom
      // (a continuous fireplace, not a one-shot burst).
      if (y > 5.5) y = -5.5;
      const x = posAttr.getX(i) + Math.sin(t * 0.6 + sways[i]) * 0.002;
      posAttr.setXYZ(i, x, y, posAttr.getZ(i));
    }
    posAttr.needsUpdate = true;

    // Whole field drifts very slowly with cursor-driven parallax handled by
    // the parent wrapper's CSS transform, so the canvas itself stays simple.
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={colors.core}
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface EmberFieldBackgroundProps {
  theme?: SanctuaryTheme;
  /** Lower for a more subtle ambient feel; higher for the sign-in hero moment. */
  intensity?: "ambient" | "hero";
}

/**
 * Persistent, theme-aware ember particle field. This is the app's signature
 * visual motif - one continuous "room" of warm drifting light behind every
 * screen, evoking candlelight in a private, intimate space, rather than a
 * generic decorative 3D object.
 *
 * Respects prefers-reduced-motion by rendering a static gradient instead.
 */
export default function EmberFieldBackground({ theme = "passionate-red", intensity = "ambient" }: EmberFieldBackgroundProps) {
  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const colors = THEME_COLORS[theme];

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: `radial-gradient(circle at 50% 80%, ${colors.glow}22, transparent 60%)`,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ opacity: intensity === "hero" ? 0.9 : 0.45 }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <EmberField theme={theme} />
      </Canvas>
    </div>
  );
}
