// ═══════════════════════════════════════════════════════
// JEEVAMITHRAN — ALL DATABASE OPERATIONS
// Replaces every localStorage call with Supabase queries
// ═══════════════════════════════════════════════════════
import { supabase } from './client.js'

// ─────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserId() {
  const user = await getCurrentUser()
  return user?.id || null
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
export async function loadProfile() {
  const uid = await getCurrentUserId()
  if (!uid) return {}
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  if (error) { console.error('loadProfile:', error); return {} }
  return data || {}
}

export async function saveProfile(profileData) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: uid, ...profileData, updated_at: new Date().toISOString() })
  if (error) console.error('saveProfile:', error)
}

// ─────────────────────────────────────────────
// FAMILY MEMBERS
// ─────────────────────────────────────────────
export async function loadFamilyMembers() {
  const uid = await getCurrentUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', uid)
    .order('sort_order')
  if (error) { console.error('loadFamilyMembers:', error); return [] }
  return data || []
}

export async function saveFamilyMember(member) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const payload = { ...member, user_id: uid }
  if (!payload.id) delete payload.id
  const { error } = await supabase.from('family_members').upsert(payload)
  if (error) console.error('saveFamilyMember:', error)
}

export async function deleteFamilyMember(memberId) {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId)
  if (error) console.error('deleteFamilyMember:', error)
}

// ─────────────────────────────────────────────
// PREFERENCES
// ─────────────────────────────────────────────
export async function loadPreferences() {
  const uid = await getCurrentUserId()
  if (!uid) return getDefaultPreferences()
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', uid)
    .single()
  if (error) return getDefaultPreferences()
  return data || getDefaultPreferences()
}

export async function savePreferences(prefs) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('preferences')
    .upsert({ user_id: uid, ...prefs, updated_at: new Date().toISOString() })
  if (error) console.error('savePreferences:', error)
}

function getDefaultPreferences() {
  return {
    diet_mode: 'mixed',
    spice_level: 3,
    selected_state: 'TN',
    household_men: 1,
    household_women: 1,
    household_aged: 0,
    household_children: 0,
    price_mode: 'auto'
  }
}

// ─────────────────────────────────────────────
// MEAL PLANS
// ─────────────────────────────────────────────
export async function loadMealPlan(month, year) {
  const uid = await getCurrentUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', uid)
    .eq('month', month)
    .eq('year', year)
    .single()
  if (error) return null
  return data
}

export async function saveMealPlan(month, year, planData, seed) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('meal_plans')
    .upsert({
      user_id: uid,
      month,
      year,
      plan_data: planData,
      seed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,month,year' })
  if (error) console.error('saveMealPlan:', error)
}

// ─────────────────────────────────────────────
// FAVOURITES
// ─────────────────────────────────────────────
export async function loadFavourites() {
  const uid = await getCurrentUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('favourites')
    .select('meal_id')
    .eq('user_id', uid)
  if (error) return []
  return (data || []).map(r => r.meal_id)
}

export async function toggleFavourite(mealId) {
  const uid = await getCurrentUserId()
  if (!uid) return false
  // Check if exists
  const { data } = await supabase
    .from('favourites')
    .select('id')
    .eq('user_id', uid)
    .eq('meal_id', mealId)
    .single()
  if (data) {
    // Remove
    await supabase.from('favourites').delete().eq('id', data.id)
    return false
  } else {
    // Add
    await supabase.from('favourites').insert({ user_id: uid, meal_id: mealId })
    return true
  }
}

// ─────────────────────────────────────────────
// DIET MEMBERS
// ─────────────────────────────────────────────
export async function loadDietMembers() {
  const uid = await getCurrentUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('diet_members')
    .select('*')
    .eq('user_id', uid)
  if (error) return []
  return data || []
}

export async function saveDietMember(member) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const payload = { ...member, user_id: uid, updated_at: new Date().toISOString() }
  if (!payload.id) delete payload.id
  const { error } = await supabase.from('diet_members').upsert(payload)
  if (error) console.error('saveDietMember:', error)
}

export async function deleteDietMember(memberId) {
  const { error } = await supabase
    .from('diet_members')
    .delete()
    .eq('id', memberId)
  if (error) console.error('deleteDietMember:', error)
}

// ─────────────────────────────────────────────
// FOLLOWED DOLU PLANS
// ─────────────────────────────────────────────
export async function loadFollowedPlans() {
  const uid = await getCurrentUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('followed_plans')
    .select('*')
    .eq('user_id', uid)
    .order('added_on')
  if (error) return []
  return data || []
}

export async function addFollowedPlan(planId) {
  const uid = await getCurrentUserId()
  if (!uid) return
  // Prevent duplicates
  const { data: existing } = await supabase
    .from('followed_plans')
    .select('id')
    .eq('user_id', uid)
    .eq('plan_id', planId)
    .single()
  if (existing) return
  await supabase.from('followed_plans').insert({
    user_id: uid,
    plan_id: planId,
    variant: Math.floor(Math.random() * 1000)
  })
}

export async function removeFollowedPlan(id) {
  const { error } = await supabase
    .from('followed_plans')
    .delete()
    .eq('id', id)
  if (error) console.error('removeFollowedPlan:', error)
}

export async function regenerateFollowedPlan(id) {
  const { error } = await supabase
    .from('followed_plans')
    .update({ variant: Math.floor(Math.random() * 1000) })
    .eq('id', id)
  if (error) console.error('regenerateFollowedPlan:', error)
}

// ─────────────────────────────────────────────
// GROCERY DATA
// ─────────────────────────────────────────────
export async function loadGroceryData() {
  const uid = await getCurrentUserId()
  if (!uid) return { custom_prices: {}, remarks: {}, checked_items: {} }
  const { data, error } = await supabase
    .from('grocery_data')
    .select('*')
    .eq('user_id', uid)
    .single()
  if (error) return { custom_prices: {}, remarks: {}, checked_items: {} }
  return data || { custom_prices: {}, remarks: {}, checked_items: {} }
}

export async function saveGroceryData(grocData) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('grocery_data')
    .upsert({ user_id: uid, ...grocData, updated_at: new Date().toISOString() })
  if (error) console.error('saveGroceryData:', error)
}

// ─────────────────────────────────────────────
// QUOTATIONS
// ─────────────────────────────────────────────
export async function loadQuotations() {
  const uid = await getCurrentUserId()
  if (!uid) return []
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('user_id', uid)
    .order('requested_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function createQuotation(month, year, items, totalAmount) {
  const uid = await getCurrentUserId()
  if (!uid) return null
  const { data, error } = await supabase
    .from('quotations')
    .insert({
      user_id: uid,
      month,
      year,
      items,
      total_amount: totalAmount,
      status: 'pending_admin'
    })
    .select()
    .single()
  if (error) { console.error('createQuotation:', error); return null }
  return data
}

export async function updateQuotationStatus(quotId, status, notes) {
  const { error } = await supabase
    .from('quotations')
    .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', quotId)
  if (error) console.error('updateQuotationStatus:', error)
}

// ─────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────
export async function submitFeedback(category, rating, message) {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: uid, category, rating, message })
  if (error) console.error('submitFeedback:', error)
}

export async function loadAllFeedback() {
  // Admin only
  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles(full_name)')
    .order('submitted_at', { ascending: false })
  if (error) return []
  return data || []
}

// ─────────────────────────────────────────────
// WEIGHT LOG
// ─────────────────────────────────────────────
export async function logWeight(dietMemberId, weightKg, notes = '') {
  const uid = await getCurrentUserId()
  if (!uid) return
  const { error } = await supabase
    .from('weight_log')
    .insert({
      user_id: uid,
      diet_member_id: dietMemberId,
      weight_kg: weightKg,
      notes,
      logged_date: new Date().toISOString().split('T')[0]
    })
  if (error) console.error('logWeight:', error)
}

export async function loadWeightLog(dietMemberId) {
  const { data, error } = await supabase
    .from('weight_log')
    .select('*')
    .eq('diet_member_id', dietMemberId)
    .order('logged_date', { ascending: false })
  if (error) return []
  return data || []
}
