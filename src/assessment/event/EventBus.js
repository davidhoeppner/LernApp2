// Simple EventBus (Req 7.7)

// Minimal UUID fallback implementation (no dependency) inlined until separated
function generateUUID() {
  // Guard access to global crypto (Node vs browser)
  if (
    typeof crypto !== 'undefined' &&
    crypto &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  // Basic RFC4122 v4-ish fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const listeners = new Map();
const queue = [];

const IS_DEV = import.meta?.env?.DEV ?? true;

export function emitEvent(name, payload = {}) {
  const envelope = {
    id: generateUUID(),
    name,
    ts: new Date().toISOString(),
    payload,
    version: 1,
  };
  queue.push(envelope);
  // Immediate dispatch
  if (listeners.has(name)) {
    listeners.get(name).forEach(cb => {
      try {
        cb(envelope);
      } catch (e) {
        console.error('Event handler error', e);
      }
    });
  }
  if (IS_DEV) console.warn('[event]', envelope);
  return envelope;
}

export function subscribe(name, handler) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(handler);
  return () => listeners.get(name)?.delete(handler);
}

export function getQueuedEvents() {
  return [...queue];
}
