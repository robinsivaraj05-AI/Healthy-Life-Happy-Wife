// ═══════════════════════════════════════════════════════
// JEEVAMITHRAN — AUTHENTICATION
// Login, Register, Logout, Session management
// ═══════════════════════════════════════════════════════
import { supabase } from './supabase/client.js'

// ─────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export async function register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─────────────────────────────────────────────
// GOOGLE OAUTH
// ─────────────────────────────────────────────
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  })
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
