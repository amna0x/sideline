// AWS Cognito JWT verification.
// When env vars are missing, exports a no-op verifier so the app keeps working
// in the memory/guest mode used for local demos.

import { CognitoJwtVerifier } from 'aws-jwt-verify'

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID
const TOKEN_USE = process.env.COGNITO_TOKEN_USE || 'id'

let verifier = null
export const cognitoReady = !!(USER_POOL_ID && CLIENT_ID)

if (cognitoReady) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: TOKEN_USE, // 'id' or 'access'
    clientId: CLIENT_ID
  })
  console.log(`[cognito] verifier ready (pool=${USER_POOL_ID} tokenUse=${TOKEN_USE})`)
} else {
  console.warn('[cognito] COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID not set — running in memory/guest auth mode')
}

export async function verifyToken(token) {
  if (!verifier || !token) return null
  try {
    const payload = await verifier.verify(token)
    return {
      id: payload.sub,
      email: payload.email || null,
      username: payload.preferred_username || payload['cognito:username'] || payload.username || (payload.email ? payload.email.split('@')[0] : null),
      metadata: {
        username: payload.preferred_username || payload['cognito:username'] || payload.username || null,
        email: payload.email || null
      }
    }
  } catch (err) {
    console.warn('[cognito] verify failed:', err.message)
    return null
  }
}
