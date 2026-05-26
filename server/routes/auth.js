import { Router } from 'express'
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'

const r = Router()

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID
const REGION = process.env.AWS_REGION || 'eu-north-1'

const cognitoReady = !!(USER_POOL_ID && CLIENT_ID)

if (!cognitoReady) {
  console.warn('[auth] COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID not set — auth routes disabled')
}

// POST /api/auth/confirm — confirm signup (public API, no IAM creds needed)
r.post('/confirm', async (req, res, next) => {
  if (!cognitoReady) return res.status(501).json({ error: 'cognito_not_configured' })
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'missing_email_or_code' })

    const client = new CognitoIdentityProviderClient({ region: REGION })
    await client.send(new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    }))

    res.json({ ok: true })
  } catch (e) {
    if (e.name === 'CodeMismatchException') return res.status(400).json({ error: 'invalid_code' })
    if (e.name === 'ExpiredCodeException') return res.status(400).json({ error: 'expired_code' })
    if (e.name === 'NotAuthorizedException') return res.status(400).json({ error: 'already_confirmed' })
    next(e)
  }
})

export default r
