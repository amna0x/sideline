// Admin usernames — these users get special aura and badges
const ADMINS = ['amna', 'mohibkhan']

export function isAdmin(username) {
  if (!username) return false
  return ADMINS.includes(username.toLowerCase())
}
