// Supabase has been replaced by Cognito (see cognito.js).
// This shim preserves backward compatibility for modules that still import from here.
// In demo/guest mode everything works without either service configured.

export const supabase = null
export const supabaseReady = false
