// Helper to gate features behind sign-in (block guests).
import { useStore } from '../store/index.js'

export function isGuest() {
  return useStore.getState().isGuest
}

// Returns true if the action should proceed; false if blocked by guest restriction.
// Also shows a toast prompt to sign in.
export function requireSignedIn(featureName = 'this feature') {
  if (isGuest()) {
    useStore.getState().showToast(`Sign in to use ${featureName}`)
    return false
  }
  return true
}
