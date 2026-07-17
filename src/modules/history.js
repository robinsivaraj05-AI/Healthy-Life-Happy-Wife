// ═══════════════════════════════════════════════════════
// MODULE: History Tab
// Shows all saved monthly meal plans from Supabase
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { supabase } from '../supabase/client.js'
import { FOOD_DB } from '../data/food-db.js'
import { MONTHS } from '../data/config.js'
import { switchTab } from '../router.js'

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderHistory(el) {
  el.innerHTML = getHistoryHTML()
  loadHistory()
}

async function loadHistory() {
  const grid  = document.getElementById('historyGrid')
  const empty = document.getElementById('historyEmpty')
  if (!grid) return

  const uid = state.currentUser?.id
  if (!uid) {
    grid.innerHTML = ''
    if (empty) { empty.style.display = 'block'; const sub = empty.querySelector('p'); if (sub) sub.textContent = 'Sign in to view saved plans' }
    return
  }

  grid.innerHTML = '<div style="padding:24px;text-align:center;color:#aaa">Loading...</div>'

  const { data: plans, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', uid)
    .order('year', { ascending: false })
    .then(r => { r.data?.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month); return r })

  if (error || !plans?.length) {
    grid.innerHTML = ''
    if (empty) empty.style.display = 'block'
    return
  }
  if (empty) empty.style.display = 'none'

  grid.innerHTML = plans.map((plan, idx) => {
    const planData = plan.plan_data || []
    const monthLabel = MONTHS[plan.month] + ' ' + plan.year

    const breakfasts = [], lunches = [], dinners = []
    const seenB = {}, seenL = {}, seenD = {}
    planData.forEach(d => {
      if (d.breakfast?.name && !seenB[d.breakfast.id]) { seenB[d.breakfast.id] = true; breakfasts.push(d.breakfast.name) }
      if (d.lunch?.name    && !seenL[d.lunch.id])      { seenL[d.lunch.id]     = true; lunches.push(d.lunch.name) }
      if (d.dinner?.name   && !seenD[d.dinner.id])     { seenD[d.dinner.id]    = true; dinners.push(d.dinner.name) }
    })

    function mealCol(emoji, label, items, bg, border, textColor) {
      return `<div style="flex:1;min-width:0;padding:10px 12px;background:${bg};border-radius:9px;border-top:3px solid ${border}">
        <div style="font-size:11px;font-weight:700;color:${textColor};margin-bottom:8px;white-space:nowrap">${emoji} ${label}${items.length ? ` <span style="font-weight:400;opacity:.75">(${items.length})</span>` : ''}</div>
        ${items.length
          ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${items.map(n => `<span style="font-size:11px;padding:3px 7px;background:#fff;border:1px solid ${border};border-radius:10px;color:#3e1f10;line-height:1.4">${n}</span>`).join('')}</div>`
          : '<div style="font-size:12px;color:#aaa;font-style:italic">No items</div>'}
      </div>`
    }

    const menuHTML = `<div style="display:flex;gap:10px;align-items:flex-start">
      ${mealCol('🌅','Breakfast',breakfasts,'#FFF8F0','#F5B88A','#8B5E52')}
      ${mealCol('🌿','Lunch',lunches,'#F0F8F0','#90C88A','#2E7D32')}
      ${mealCol('🌙','Dinner',dinners,'#F0F0FF','#9090C8','#1565C0')}
    </div>`

    const savedDate = new Date(plan.updated_at || plan.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })

    return `<div class="hist-card">
      <div class="hist-card-header">
        <div>
          <div class="hist-month">${monthLabel}</div>
          <div class="hist-meta">Saved ${savedDate} &bull; ${planData.length} days</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="hist-btn" onclick="restoreMonthPlan('${plan.id}','${plan.month}','${plan.year}')">&#8629; Restore</button>
        </div>
      </div>
      <div style="padding:12px 14px;background:#fff">
        <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:8px;letter-spacing:.4px">MONTHLY MENU PLAN</div>
        ${menuHTML}
      </div>
    </div>`
  }).join('')
}

// ─────────────────────────────────────────────
// RESTORE PLAN
// ─────────────────────────────────────────────
window.restoreMonthPlan = async function(id, month, year) {
  const { data: plan } = await supabase.from('meal_plans').select('*').eq('id', id).single()
  if (!plan) return

  setState('selectedMonth', parseInt(month))
  setState('selectedYear',  parseInt(year))
  setState('planSeed',      plan.seed)

  // Hydrate meal plan with full meal objects from FOOD_DB
  const allMeals = [...(FOOD_DB.breakfast||[]), ...(FOOD_DB.lunch||[]), ...(FOOD_DB.dinner||[])]
  const byId = {}
  allMeals.forEach(m => { byId[m.id] = m })

  const hydrated = (plan.plan_data || []).map(d => ({
    day:       d.day,
    breakfast: d.breakfast ? (byId[d.breakfast.id] || d.breakfast) : null,
    lunch:     d.lunch     ? (byId[d.lunch.id]     || d.lunch)     : null,
    dinner:    d.dinner    ? (byId[d.dinner.id]    || d.dinner)    : null,
  }))
  setState('mealPlan', hydrated)

  switchTab('plan')
  showToast('&#10003; ' + MONTHS[month] + ' ' + year + ' plan restored!')
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function showToast(msg) {
  if (window.showToast && window.showToast !== showToast) { window.showToast(msg); return }
  let t = document.getElementById('_toast')
  if (!t) { t = document.createElement('div'); t.id = '_toast'; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 22px;border-radius:24px;font-size:14px;z-index:99999;transition:opacity .3s;pointer-events:none'; document.body.appendChild(t) }
  t.innerHTML = msg; t.style.opacity = '1'
  clearTimeout(t._timer); t._timer = setTimeout(() => { t.style.opacity = '0' }, 3000)
}

// ─────────────────────────────────────────────
// HTML TEMPLATE
// ─────────────────────────────────────────────
function getHistoryHTML() {
  return `
  <div>
    <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:14px;padding:20px 24px;margin-bottom:16px;color:#fff;display:flex;align-items:center;gap:14px">
      <span style="font-size:36px">&#128197;</span>
      <div>
        <h2 style="margin:0 0 4px;font-size:19px;font-weight:800">Saved Meal Plans</h2>
        <p style="margin:0;font-size:12px;opacity:.85">All your monthly meal plan history</p>
      </div>
    </div>
    <div id="historyGrid"></div>
    <div id="historyEmpty" style="display:none;text-align:center;padding:48px 24px;background:#FFF5EF;border-radius:14px;border:1.5px solid #F5D0C0">
      <div style="font-size:48px;margin-bottom:12px">&#128197;</div>
      <div style="font-size:16px;font-weight:700;color:#C8604A;margin-bottom:6px">No Saved Plans Yet</div>
      <p style="font-size:13px;color:#8B5E52;margin:0">Go to the <strong>Plan</strong> tab, generate a monthly meal plan, and it will appear here automatically.</p>
    </div>
  </div>`
}
