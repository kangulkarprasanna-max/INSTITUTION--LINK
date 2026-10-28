// ---------------------------------------------------------------------------
// Lightweight navigation context.
//
// The existing shell used a single `currentKey`. Prompt 2 adds parameterised
// detail views (Institution 360, Case detail) without pulling in a router, so
// we extend the same idea with { key, params } plus a small history stack.
// ---------------------------------------------------------------------------

import { createContext, useContext } from 'react';

export const NavContext = createContext(null);

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used within a NavContext.Provider.');
  }
  return ctx;
}
