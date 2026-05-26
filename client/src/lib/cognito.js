// Thin wrapper around amazon-cognito-identity-js so the rest of the app sees
// a tiny promise-based API. Returns a `null` pool when env vars are missing,
// which forces the app into local guest mode (no auth network calls).

import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails
} from 'amazon-cognito-identity-js'

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID

export const cognitoReady = !!(USER_POOL_ID && CLIENT_ID)

export const userPool = cognitoReady
  ? new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID })
  : null

if (!cognitoReady) {
  console.warn('[cognito] missing VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID — auth will use guest mode')
}

function userFromSession(cognitoUser, session) {
  const idToken = session.getIdToken()
  const payload = idToken.decodePayload()
  return {
    id: payload.sub,
    email: payload.email || null,
    username: payload.preferred_username || payload['cognito:username'] || (payload.email ? payload.email.split('@')[0] : null),
    user_metadata: {
      username: payload.preferred_username || payload['cognito:username'] || (payload.email ? payload.email.split('@')[0] : null),
      avatar_url: payload['custom:avatar_url'] || null
    },
    tokens: {
      id: idToken.getJwtToken(),
      access: session.getAccessToken().getJwtToken(),
      refresh: session.getRefreshToken().getToken()
    }
  }
}

export function signIn(email, password) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = new CognitoUser({ Username: email, Pool: userPool })
  const details = new AuthenticationDetails({ Username: email, Password: password })
  return new Promise((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: (session) => resolve({ user: userFromSession(user, session) }),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('NEW_PASSWORD_REQUIRED'))
    })
  })
}

export function signUp(email, password, username) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })]
  if (username) attributes.push(new CognitoUserAttribute({ Name: 'preferred_username', Value: username }))
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributes, null, (err, result) => {
      if (err) return reject(err)
      resolve({ userSub: result.userSub, userConfirmed: result.userConfirmed })
    })
  })
}

export function confirmSignUp(email, code) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err, result) => err ? reject(err) : resolve(result))
  })
}

export function resendConfirmation(email) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.resendConfirmationCode((err, result) => err ? reject(err) : resolve(result))
  })
}

export function signOut() {
  const user = userPool?.getCurrentUser()
  if (user) user.signOut()
}

export function getCurrentSession() {
  if (!userPool) return Promise.resolve(null)
  const user = userPool.getCurrentUser()
  if (!user) return Promise.resolve(null)
  return new Promise((resolve) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return resolve(null)
      resolve({ user: userFromSession(user, session) })
    })
  })
}

export async function getIdToken() {
  const session = await getCurrentSession()
  return session?.user?.tokens?.id || null
}

export function changePassword(oldPassword, newPassword) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = userPool.getCurrentUser()
  if (!user) return Promise.reject(new Error('Not signed in'))
  return new Promise((resolve, reject) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return reject(err || new Error('Invalid session'))
      user.changePassword(oldPassword, newPassword, (cpErr, result) => cpErr ? reject(cpErr) : resolve(result))
    })
  })
}

export function deleteCurrentUser() {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = userPool.getCurrentUser()
  if (!user) return Promise.reject(new Error('Not signed in'))
  return new Promise((resolve, reject) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return reject(err || new Error('Invalid session'))
      user.deleteUser((delErr, result) => delErr ? reject(delErr) : resolve(result))
    })
  })
}

export function forgotPassword(email) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: (result) => resolve(result),
      onFailure: (err) => reject(err)
    })
  })
}

export function confirmForgotPassword(email, code, newPassword) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'))
  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: (result) => resolve(result),
      onFailure: (err) => reject(err)
    })
  })
}

// Build a Cognito Hosted UI URL for OAuth providers (Google, Apple, GitHub)
// Requires COGNITO_HOSTED_DOMAIN env var (e.g. sideline.auth.eu-north-1.amazoncognito.com)
export function getOAuthUrl(provider) {
  const domain = import.meta.env.VITE_COGNITO_HOSTED_DOMAIN
  if (!domain || !CLIENT_ID) return null
  const redirectUri = `${window.location.origin}/login`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    identity_provider: provider, // 'Google' | 'SignInWithApple' | 'GitHub' (custom)
    scope: 'openid email profile'
  })
  return `https://${domain}/oauth2/authorize?${params.toString()}`
}
