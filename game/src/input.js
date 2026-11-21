const BLOCKED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  window.addEventListener('keydown', (event) => {
    if (BLOCKED.has(event.code)) event.preventDefault();
    if (!held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  return {
    down(code) { return held.has(code); },
    tap(code) { const has = pressed.has(code); pressed.delete(code); return has; },
    flush() { pressed.clear(); }
  };
}
