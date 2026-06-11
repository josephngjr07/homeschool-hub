// A parent may type a real link OR free-text notes into the same "link" field.
// This turns a value into a safe, absolute href to open — or null when it isn't
// a link, so callers can simply skip rendering an "Open" affordance.
//
//   "https://x.com/a"   → "https://x.com/a"   (kept as-is)
//   "youtube.com/watch" → "https://youtube.com/watch"  (protocol added)
//   "buy groceries"     → null               (a note, not a link)
//
// Without this, a protocol-less value rendered as <a href="youtube.com/…"> is
// treated by the browser as a *relative* path and navigates nowhere.
export function toLinkHref(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;

  // Already absolute: trust only http(s).
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
    } catch {
      return null;
    }
  }

  // Bare domain/url: no whitespace and a domain-like start (a dot + TLD).
  if (!/\s/.test(v) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|\?|#|$)/i.test(v)) {
    try {
      return new URL(`https://${v}`).href;
    } catch {
      return null;
    }
  }

  return null;
}
