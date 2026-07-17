// ═══════════════════════════════════════════════════════
// JEEVAMITHRAN — ROUTER / TAB SWITCHER
// ═══════════════════════════════════════════════════════
import { state, setState } from './state.js'
import { renderPlan } from './modules/meal-plan.js'
import { renderMenu } from './modules/menu.js'
import { renderGrocery } from './modules/grocery.js'
import { renderRecipes } from './modules/recipes.js'
import { renderDiet } from './modules/diet.js'
import { renderHistory } from './modules/history.js'
import { renderPrefs } from './modules/preferences.js'
import { renderProfile } from './modules/profile.js'

const TABS_WITHOUT_STATS = new Set(['grocery', 'recipes', 'prefs', 'profile'])

const RENDERERS = {
  plan:     renderPlan,
  menu:     renderMenu,
  grocery:  renderGrocery,
  recipes:  renderRecipes,
  diet:     renderDiet,
  history:  renderHistory,
  prefs:    renderPrefs,
  profile:  renderProfile,
}

export function switchTab(tab) {
  setState('activeTab', tab)

  // Update nav button states
  document.querySelectorAll('.navTabs .tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === tab ||
      btn.getAttribute('onclick')?.includes(`'${tab}'`))
  })

  // Stats bar visibility
  const sg = document.getElementById('statsGrid')
  if (sg) sg.style.display = TABS_WITHOUT_STATS.has(tab) ? 'none' : ''

  // Render content
  const el = document.getElementById('tabContent')
  if (!el) return
  const renderer = RENDERERS[tab]
  if (renderer) renderer(el)
  else el.innerHTML = `<p style="padding:40px;text-align:center;color:#999">Tab "${tab}" coming soon</p>`
}

// Make available globally for inline onclick attrs
window.switchTab = switchTab
