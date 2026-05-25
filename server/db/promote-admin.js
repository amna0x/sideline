// One-off script to promote a user to admin/legend tier.
// Run: node --env-file=.env db/promote-admin.js

import { query } from './postgres.js'

const USERNAME = 'amna'

const { rows } = await query(
  `UPDATE users SET tier = 'legend', points_total = 100000
   WHERE username = $1 RETURNING id, username, tier, points_total`,
  [USERNAME]
)

if (rows[0]) {
  console.log('Promoted:', rows[0])
} else {
  console.log('User not found:', USERNAME)
}

process.exit(0)
