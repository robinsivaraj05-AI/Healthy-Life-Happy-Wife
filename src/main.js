// ═══════════════════════════════════════════════════════
// JEEVAMITHRAN — APP ENTRY POINT
// Initialises auth, loads data, boots the UI
// ═══════════════════════════════════════════════════════
import { supabase } from './supabase/client.js'
import { onAuthStateChange, login, register, loginWithGoogle, logout } from './auth.js'
import { loadProfile, loadFamilyMembers, loadPreferences, loadMealPlan,
         loadFavourites, loadDietMembers, loadFollowedPlans, loadGroceryData } from './supabase/db.js'
import { state, setState } from './state.js'
import { switchTab } from './router.js'

// ─────────────────────────────────────────────
// AUTH STATE LISTENER
// ─────────────────────────────────────────────
onAuthStateChange(async (user) => {
  setState('currentUser', user)
  if (user) {
    document.getElementById('authScreen').style.display = 'none'
    document.getElementById('appRoot').style.display = 'block'
    await bootApp(user)
  } else {
    document.getElementById('authScreen').style.display = 'flex'
    document.getElementById('appRoot').style.display = 'none'
  }
})

// ─────────────────────────────────────────────
// BOOT APP — load all data then render
// ─────────────────────────────────────────────
async function bootApp(user) {
  try {
    const [profile, family, prefs, favourites, dietMembers, followedPlans, grocData] =
      await Promise.all([
        loadProfile(),
        loadFamilyMembers(),
        loadPreferences(),
        loadFavourites(),
        loadDietMembers(),
        loadFollowedPlans(),
        loadGroceryData()
      ])

    // Hydrate state
    setState('profile', profile)
    setState('familyMembers', family)
    setState('isAdmin', profile.role === 'admin')

    if (prefs) {
      setState('dietMode', prefs.diet_mode || 'mixed')
      setState('spiceLevel', prefs.spice_level ?? 3)
      setState('selectedState', prefs.selected_state || 'TN')
      setState('householdMen', prefs.household_men ?? 1)
      setState('householdWomen', prefs.household_women ?? 1)
      setState('householdAged', prefs.household_aged ?? 0)
      setState('householdChildren', prefs.household_children ?? 0)
      setState('priceMode', prefs.price_mode || 'auto')
    }

    setState('favourites', favourites || [])
    setState('dietMembers', dietMembers || [])
    setState('followedPlans', followedPlans || [])
    setState('customPrices', grocData?.custom_prices || {})
    setState('groceryRemarks', grocData?.remarks || {})
    setState('checkedItems', grocData?.checked_items || {})

    // Load meal plan for current month
    const plan = await loadMealPlan(state.selectedMonth, state.selectedYear)
    if (plan) {
      setState('mealPlan', plan.plan_data || [])
      setState('planSeed', plan.seed)
    }

    // Render initial tab
    switchTab(state.activeTab)
  } catch (err) {
    console.error('bootApp error:', err)
    alert('Failed to load app data. Please refresh.')
  }
}

// ─────────────────────────────────────────────
// AUTH HANDLERS (called from index-new.html)
// ─────────────────────────────────────────────
window.handleLogin = async function() {
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const errEl = document.getElementById('loginError')
  errEl.style.display = 'none'
  try {
    await login(email, password)
  } catch (e) {
    errEl.textContent = e.message
    errEl.style.display = 'block'
  }
}

window.handleRegister = async function() {
  const name = document.getElementById('regName').value.trim()
  const email = document.getElementById('regEmail').value.trim()
  const password = document.getElementById('regPassword').value
  const errEl = document.getElementById('registerError')
  errEl.style.display = 'none'
  if (!name) { errEl.textContent = 'Please enter your name'; errEl.style.display = 'block'; return }
  try {
    await register(email, password, name)
    errEl.style.color = '#2E7D32'
    errEl.textContent = 'Account created! Please check your email to verify.'
    errEl.style.display = 'block'
  } catch (e) {
    errEl.style.color = '#c62828'
    errEl.textContent = e.message
    errEl.style.display = 'block'
  }
}

window.handleGoogleLogin = async function() {
  try { await loginWithGoogle() } catch (e) { console.error(e) }
}

window.handleLogout = async function() {
  try { await logout() } catch (e) { console.error(e) }
}

window.showRegister = function() {
  document.getElementById('loginForm').style.display = 'none'
  document.getElementById('registerForm').style.display = 'block'
}

window.showLogin = function() {
  document.getElementById('registerForm').style.display = 'none'
  document.getElementById('loginForm').style.display = 'block'
}

window.showForgotPassword = function() {
  const email = document.getElementById('loginEmail').value.trim()
  if (!email) { alert('Enter your email first, then click Forgot password.'); return }
  import('./auth.js').then(({ sendPasswordReset }) => {
    sendPasswordReset(email).then(() => {
      alert('Password reset email sent! Check your inbox.')
    }).catch(e => alert(e.message))
  })
}
