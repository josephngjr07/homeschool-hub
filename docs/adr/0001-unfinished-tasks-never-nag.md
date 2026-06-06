# Unfinished tasks never nag (no guilt mechanics by default)

**Context.** The product serves overwhelmed newcomer homeschool parents, whose
primary pain is feeling behind. A core design principle is "calm, no productivity
guilt." Every mainstream to-do/planner app defaults to the opposite: overdue
items in red, roll-forward pile-ups, streaks, and percent-complete bars.

**Decision.** An unchecked box is never an accusation.
- Unfinished Tasks silently stay on their original day — no red, no "overdue"
  badge, no auto roll-forward. Rescuing a missed Task to today is a one-tap,
  opt-in action, never automatic.
- No streaks and no percent-complete progress bars. Positive feedback is
  win-only: a gentle weekly recap that counts what got done and can never go
  negative.

**Why it's recorded.** This deliberately deviates from the universal default, so
a future contributor will likely see tasks sitting un-highlighted in the past (or
the absence of a streak) and try to "fix" it by adding overdue styling or
engagement mechanics. That would reintroduce the exact guilt this product exists
to remove. Don't add it without revisiting this decision.
