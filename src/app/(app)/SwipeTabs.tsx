"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Left/right swipe to move between the bottom-nav tabs (touch only). Order
// mirrors BottomNav. A swipe must be clearly horizontal and far enough so it
// never fights vertical scrolling or a stray tap. Routes not in the tab bar
// (e.g. /recap) simply don't navigate.
const TAB_ORDER = ["/dashboard", "/today", "/plan", "/inbox", "/children"];

const THRESHOLD = 60; // px of horizontal travel required

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

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const origin = start.current;
    start.current = null;
    if (!origin) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - origin.x;
    const dy = t.clientY - origin.y;

    // Ignore short or mostly-vertical gestures (let scrolling win).
    if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const idx = TAB_ORDER.indexOf(pathname);
    if (idx === -1) return;

    if (dx < 0 && idx < TAB_ORDER.length - 1) {
      router.push(TAB_ORDER[idx + 1]); // swipe left → next tab
    } else if (dx > 0 && idx > 0) {
      router.push(TAB_ORDER[idx - 1]); // swipe right → previous tab
    }
  }

  return (
    <div className={className} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
