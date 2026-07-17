// ═══════════════════════════════════════════════════════
// JEEVAMITHRAN — GLOBAL STATE
// Central store — replaces the window.state object
// ═══════════════════════════════════════════════════════

const now = new Date()

export const state = {
  // Navigation
  activeTab: 'plan',
  dietSubTab: 'members',

  // Calendar
  selectedMonth: now.getMonth(),
  selectedYear: now.getFullYear(),
  menuDay: null,

  // Meal plan
  mealPlan: [],
  planSeed: null,

  // Favourites
  favourites: [],

  // Recipes
  activeRecipeId: null,

  // Grocery
  groceryTab: 'meal',
  grocSectionOpen: {},
  priceMode: 'auto',
  customPrices: {},
  groceryRemarks: {},
  checkedItems: {},

  // Preferences (loaded from Supabase)
  dietMode: 'mixed',
  spiceLevel: 3,
  selectedState: 'TN',
  householdMen: 1,
  householdWomen: 1,
  householdAged: 0,
  householdChildren: 0,

  // Family
  familyMembers: [],

  // Diet
  dietMembers: [],
  followedPlans: [],

  // Auth
  currentUser: null,
  isAdmin: false,
}

// Helper to update a key and optionally trigger a re-render
export function setState(key, value) {
  state[key] = value
}
