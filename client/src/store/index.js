import { create } from 'zustand'

const SFX_VOLUME_KEY = 'sideline.sfx.volume'

function loadSfxVolume() {
  if (typeof localStorage === 'undefined') return 0.8
  const saved = Number(localStorage.getItem(SFX_VOLUME_KEY))
  return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.8
}

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

  // Sound
  sfxVolume: loadSfxVolume(),
  setSfxVolume: (volume) => {
    const next = Math.min(1, Math.max(0, Number(volume) || 0))
    if (typeof localStorage !== 'undefined') localStorage.setItem(SFX_VOLUME_KEY, String(next))
    set({ sfxVolume: next })
  },

  // Squad
  squad: null,
  squadMembers: [],
  squadChat: [],
  reactions: [],
  activeDuel: null,
  setSquad: (squad) => set({ squad }),
  setSquadMembers: (members) => set({ squadMembers: members }),
  setSquadChat: (msgs) => set({ squadChat: msgs }),
  appendSquadChat: (msg) => set((s) => ({ squadChat: [...s.squadChat.slice(-99), msg] })),
  updateSquadChatMsg: (id, update) => set((s) => ({ squadChat: s.squadChat.map((m) => m.id === id ? { ...m, ...update } : m) })),
  addReaction: (r) => set((s) => ({ reactions: [...s.reactions.slice(-19), { ...r, id: Date.now() + Math.random() }] })),
  clearReactions: () => set({ reactions: [] }),
  setActiveDuel: (duel) => set({ activeDuel: duel }),
  updateDuel: (update) => set((s) => ({
    activeDuel: s.activeDuel ? { ...s.activeDuel, ...update } : null
  })),
  clearDuel: () => set({ activeDuel: null })
}))
