type Listener = () => void | Promise<void>;

// Lets the axios layer (plain modules, no React) tell AuthContext to drop its
// in-memory user after an unrecoverable 401, without the two importing each other.
let listener: Listener | null = null;

export function setSessionExpiredListener(fn: Listener | null): void {
  listener = fn;
}

export async function notifySessionExpired(): Promise<void> {
  await listener?.();
}
