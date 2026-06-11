"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Left/right swipe to move between the bottom-nav tabs (touch only). The content
// follows the finger like a native phone app: it drags with the gesture, rubber-
// bands at the first/last tab, and on release either slides the rest of the way
// out into the next tab or springs back. Order mirrors BottomNav; routes not in
// the tab bar (e.g. /recap) don't drag.
const TAB_ORDER = ["/dashboard", "/today", "/plan", "/inbox", "/children"];

const THRESHOLD = 60; // px of horizontal travel required to commit a tab change
const DIRECTION_SLOP = 10; // px before we lock the gesture as horizontal

export function SwipeTabs({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"undecided" | "horizontal" | "vertical">("undecided");
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  const idx = TAB_ORDER.indexOf(pathname);

  // Whenever the route changes, the new page mounts fresh — reset to rest by
  // adjusting state during render (cheaper than an effect, no extra paint).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOffset(0);
    setAnimating(false);
  }

  function resistedAt(dx: number): number {
    // Rubber-band: if there's no tab in the swipe direction, only travel a
    // fraction of the finger so the edge feels "pinned".
    const goingNext = dx < 0;
    const blocked = goingNext
      ? idx === TAB_ORDER.length - 1
      : idx === 0;
    return blocked ? dx * 0.25 : dx;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (idx === -1) return;
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    axis.current = "undecided";
    setAnimating(false);
  }

  function onTouchMove(e: React.TouchEvent) {
    const origin = start.current;
    if (!origin) return;
    const t = e.touches[0];
    const dx = t.clientX - origin.x;
    const dy = t.clientY - origin.y;

    if (axis.current === "undecided") {
      if (Math.abs(dx) < DIRECTION_SLOP && Math.abs(dy) < DIRECTION_SLOP) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }
    if (axis.current !== "horizontal") return; // let vertical scrolling win

    setOffset(resistedAt(dx));
  }

  function onTouchEnd() {
    const origin = start.current;
    start.current = null;
    if (!origin || axis.current !== "horizontal") {
      setOffset(0);
      return;
    }

    const dx = offset;
    setAnimating(true);

    if (dx <= -THRESHOLD && idx < TAB_ORDER.length - 1) {
      setOffset(-window.innerWidth); // slide out left → next tab
      router.push(TAB_ORDER[idx + 1]);
    } else if (dx >= THRESHOLD && idx > 0) {
      setOffset(window.innerWidth); // slide out right → previous tab
      router.push(TAB_ORDER[idx - 1]);
    } else {
      setOffset(0); // spring back
    }
  }

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateX(${offset}px)`,
        transition: animating ? "transform 0.25s ease-out" : "none",
      }}
    >
      {children}
    </div>
  );
}
