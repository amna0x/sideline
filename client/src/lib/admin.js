// Admin usernames and emails — these users get special aura, badges, and dev panel
const ADMIN_USERNAMES = ['amna', 'mohibkhan']
const ADMIN_EMAILS = ['mohibk0004@gmail.com']

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
