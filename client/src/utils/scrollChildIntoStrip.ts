/** Scroll `child` inside `container` just enough to be visible. Does not move the page. */
export function scrollChildIntoStrip(
  container: HTMLElement | null,
  child: HTMLElement | null
) {
  if (!container || !child) return;

  const c = container.getBoundingClientRect();
  const t = child.getBoundingClientRect();
  const pad = 12;

  let delta = 0;
  if (t.left < c.left + pad) delta = t.left - c.left - pad;
  else if (t.right > c.right - pad) delta = t.right - c.right + pad;
  if (Math.abs(delta) < 1) return;

  container.scrollTo({ left: container.scrollLeft + delta, behavior: 'auto' });
}
