import { create } from 'zustand'

export const useStore = create((set) => ({
  // Auth
  user: null,
  session: undefined, // undefined = unchecked, null = checked-and-empty, object = signed in
  isGuest: false,
  guestInteractions: 0,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setUserProfile: (profile) => set((s) => ({ user: { ...(s.user || {}), profile } })),
  setGuest: (isGuest) => set({ isGuest }),
  bumpGuest: () => set((s) => ({ guestInteractions: s.guestInteractions + 1 })),
  clearAuth: () => set({ user: null, session: null, isGuest: false, guestInteractions: 0 }),

  // Match
  match: null,
  matchEvents: [],
  pulse: null,
  setMatch: (match) => set({ match }),
  pushEvent: (ev) => set((s) => ({ matchEvents: [...s.matchEvents.slice(-49), ev] })),
  setPulse: (pulse) => set({ pulse }),

  // Points
  points: 0,
  setPoints: (points) => set({ points }),
  addPoints: (n) => set((s) => ({ points: s.points + n })),

  // Adidas drop
  pendingDrop: null,
  setPendingDrop: (drop) => set({ pendingDrop: drop }),

  // UI
  toast: null,
  showToast: (msg) => set({ toast: msg }),

  // Theme
  theme: 'default',
  setTheme: (theme) => set({ theme })
}))
