/**
 * Tiny class-name joiner. Keeps JSX readable and avoids pulling in a heavy
 * dependency for a prototype. Ignores falsy values.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
