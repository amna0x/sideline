// Shared route helpers

const DEFAULT_ADMIN_USERNAMES = ['amna', 'mohibkhan']
const DEFAULT_ADMIN_EMAILS = ['mohibk0004@gmail.com']

const envUsernames = process.env.ADMIN_USERNAMES ? process.env.ADMIN_USERNAMES.split(',').map(s => s.toLowerCase().trim()).filter(Boolean) : []
const envEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(s => s.toLowerCase().trim()).filter(Boolean) : []

const ADMIN_USERNAMES = [...new Set([...DEFAULT_ADMIN_USERNAMES, ...envUsernames])]
const ADMIN_EMAILS = [...new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails])]

export function isAdmin(user) {
  if (!user) return false
  const username = (user.username || '').toLowerCase().trim()
  const email = (user.email || '').toLowerCase().trim()
  return ADMIN_USERNAMES.includes(username) || ADMIN_EMAILS.includes(email)
}
