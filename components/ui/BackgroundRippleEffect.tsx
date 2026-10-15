'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
  children?: React.ReactNode;
  interactive?: boolean;
}

interface RippleOrigin {
  row: number;
  col: number;
  timestamp: number;
  id: number;
}

export const BackgroundRippleEffect: React.FC<BackgroundRippleEffectProps> = ({
  rows = 9,
  cols = 16,
  cellSize = 52,
  className = '',
  children,
  interactive = true,
}) => {
  const [activeRipple, setActiveRipple] = useState<RippleOrigin | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(1200);
  const rippleCountRef = useRef(0);

  // Measure window for responsive grid adjustments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Compute adaptive grid based on screen size
  const { responsiveCols, responsiveRows, responsiveCellSize } = useMemo(() => {
    if (windowWidth < 640) {
      // Mobile: fewer cells to ensure top performance
      return {
        responsiveCols: 8,
        responsiveRows: 7,
        responsiveCellSize: 42,
      };
    } else if (windowWidth < 1024) {
      // Tablet
      return {
        responsiveCols: 12,
        responsiveRows: 8,
        responsiveCellSize: 48,
      };
    }
    // Desktop
    return {
      responsiveCols: cols,
      responsiveRows: rows,
      responsiveCellSize: cellSize,
    };
  }, [windowWidth, cols, rows, cellSize]);

  // Trigger ripple from specific cell
  const triggerRipple = useCallback((r: number, c: number) => {
    rippleCountRef.current += 1;
    setActiveRipple({
      row: r,
      col: c,
      timestamp: Date.now(),
      id: rippleCountRef.current,
    });
  }, []);

  // Subtle ambient pulse on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerRipple(
        Math.floor(responsiveRows / 2),
        Math.floor(responsiveCols / 2)
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [responsiveRows, responsiveCols, triggerRipple]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-50/50 dark:bg-neutral-950 ${className}`}
    >
      {/* Background Ripple Grid Layer */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] select-none"
        aria-hidden="true"
      >
        <div
          className="grid transition-all duration-300 pointer-events-auto"
          style={{
            gridTemplateColumns: `repeat(${responsiveCols}, ${responsiveCellSize}px)`,
            gridTemplateRows: `repeat(${responsiveRows}, ${responsiveCellSize}px)`,
          }}
        >
          {Array.from({ length: responsiveRows }).map((_, rowIndex) =>
            Array.from({ length: responsiveCols }).map((_, colIndex) => {
              // Calculate distance from active ripple origin
              let distance = 0;
              let isRippling = false;
              if (activeRipple) {
                const dx = colIndex - activeRipple.col;
                const dy = rowIndex - activeRipple.row;
                distance = Math.sqrt(dx * dx + dy * dy);
                isRippling = true;
              }

              // Delay based on distance (speed of wave)
              const delay = distance * 45; // ms

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={
                    interactive
                      ? () => triggerRipple(rowIndex, colIndex)
                      : undefined
                  }
                  onMouseEnter={
                    interactive
                      ? () => triggerRipple(rowIndex, colIndex)
                      : undefined
                  }
                  style={{
                    width: `${responsiveCellSize}px`,
                    height: `${responsiveCellSize}px`,
                    animationDelay: isRippling ? `${delay}ms` : '0ms',
                  }}
                  className={`relative border border-neutral-200/50 dark:border-neutral-800/50 transition-colors duration-500 cursor-pointer ${
                    isRippling
                      ? 'animate-[ripplePulse_1.2s_ease-out]'
                      : 'hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  {/* Center subtle dot marker */}
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300/60 dark:bg-neutral-700/60 transition-transform duration-300 hover:scale-150" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Subtle Ambient Radial Overlay to soften contrast and ensure sharp typography */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-white/90 dark:from-neutral-950/80 dark:via-neutral-950/50 dark:to-neutral-950/90 pointer-events-none"
        aria-hidden="true"
      />

      {/* Foreground Content Layer */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default BackgroundRippleEffect;
