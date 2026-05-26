// Shared route helpers

const ADMIN_USERNAMES = ['amna', 'mohibkhan']
const ADMIN_EMAILS = ['mohibk0004@gmail.com']

export function isAdmin(user) {
  if (!user) return false
  const username = (user.username || '').toLowerCase().trim()
  const email = (user.email || '').toLowerCase().trim()
  return ADMIN_USERNAMES.includes(username) || ADMIN_EMAILS.includes(email)
}
