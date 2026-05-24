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
  notifications: [],
  pushNotification: (n) => set((s) => ({
    notifications: [{ ...n, id: Date.now() + Math.random() }, ...s.notifications].slice(0, 8)
  })),
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id)
  })),

  // Theme
  theme: 'default',
  setTheme: (theme) => set({ theme }),

  // Squad
  squad: null,
  squadMembers: [],
  reactions: [],
  activeDuel: null,
  setSquad: (squad) => set({ squad }),
  setSquadMembers: (members) => set({ squadMembers: members }),
  addReaction: (r) => set((s) => ({ reactions: [...s.reactions.slice(-19), { ...r, id: Date.now() + Math.random() }] })),
  clearReactions: () => set({ reactions: [] }),
  setActiveDuel: (duel) => set({ activeDuel: duel }),
  updateDuel: (update) => set((s) => ({
    activeDuel: s.activeDuel ? { ...s.activeDuel, ...update } : null
  })),
  clearDuel: () => set({ activeDuel: null })
}))
