// Admin usernames and emails — can be extended via Vite env variables
const DEFAULT_ADMIN_USERNAMES = ['amna', 'mohibkhan']
const DEFAULT_ADMIN_EMAILS = ['mohibk0004@gmail.com']

const envUsernames = (import.meta.env.VITE_ADMIN_USERNAMES || '').split(',').map(s => s.toLowerCase().trim()).filter(Boolean)
const envEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(s => s.toLowerCase().trim()).filter(Boolean)

const ADMIN_USERNAMES = Array.from(new Set([...DEFAULT_ADMIN_USERNAMES, ...envUsernames]))
const ADMIN_EMAILS = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]))

export function isAdmin(usernameOrEmail) {
  if (!usernameOrEmail) return false
  const val = usernameOrEmail.toLowerCase().trim()
  return ADMIN_USERNAMES.includes(val) || ADMIN_EMAILS.includes(val)
}

export function isAdminUser(user) {
  if (!user) return false
  const profile = user.profile || user
  return (
    isAdmin(profile.username) ||
    isAdmin(profile.email) ||
    isAdmin(user.email) ||
    isAdmin(user.username) ||
    isAdmin(user.user_metadata?.username)
  )
}
