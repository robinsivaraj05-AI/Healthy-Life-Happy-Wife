// ═══════════════════════════════════════════════════════
// MODULE: Meal Plan Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { FOOD_DB } from '../data/food-db.js'
import { MONTHS } from '../data/config.js'
import { saveMealPlan as dbSaveMealPlan } from '../supabase/db.js'

const SHORT_MONS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate() }
function shuffle(a) { const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]] }; return b }
function getTotalPeople() { return (state.householdMen||0)+(state.householdWomen||0)+(state.householdAged||0)+(state.householdChildren||0) }
function getEffectivePeople() {
  const s = (state.householdMen||0)*1 + (state.householdWomen||0)*0.85 + (state.householdAged||0)*0.7 + (state.householdChildren||0)*0.5
  return Math.max(1, Math.round(s*10)/10)
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderPlan(el) {
  if (el) el.innerHTML = getPlanHTML()

  // Auto-generate if no plan
  if (!state.mealPlan || !state.mealPlan.length) {
    setState('mealPlan', generateMealPlan())
  }

  _renderPlan()
}

function _renderPlan() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase()
  const filtered = state.mealPlan.filter(d => {
    const meals = [d.breakfast, d.lunch, d.dinner]
    if (!search) return true
    return meals.some(m => m && (m.name?.toLowerCase().includes(search) || m.tamil?.includes(search)))
  })

  const grid  = document.getElementById('daysGrid')
  const empty = document.getElementById('emptyMsg')
  if (!filtered.length) { if (grid) grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return }
  if (empty) empty.style.display = 'none'

  function mealCell(m, day, slot) {
    if (!m) return '<td style="padding:8px 12px;color:#ccc;font-size:12px">—</td>'
    const isVeg = m.type === 'veg'
    const dot   = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isVeg?'#2E7D32':'#C62828'};margin-right:5px;vertical-align:middle;flex-shrink:0"></span>`
    return `<td style="padding:8px 12px">
      <div style="display:flex;align-items:flex-start;gap:4px">
        ${dot}
        <div style="flex:1;min-width:0">
          <span style="color:#1B5E20;cursor:pointer;font-weight:600;text-decoration:underline dotted;font-size:12px;line-height:1.4" onclick="openRecipe('${m.id}','${slot}')">${m.name}</span>
          ${m.tamil ? `<div style="font-size:10px;color:#8B5E52;margin-top:1px">${m.tamil}</div>` : ''}
        </div>
        <button onclick="event.stopPropagation();openReplace(${day},'${slot}','${m.id}')" style="background:none;border:1px solid #E8D5C4;border-radius:6px;cursor:pointer;color:#8B5E52;font-size:11px;padding:2px 6px;flex-shrink:0;line-height:1" title="Replace">&#8635;</button>
      </div>
    </td>`
  }

  const rows = filtered.map((d, i) => {
    const bg = i % 2 === 0 ? '#fff' : '#FFF8F5'
    const dt = new Date(state.selectedYear, state.selectedMonth, d.day)
    const dateLabel = d.day + ' ' + SHORT_MONS[dt.getMonth()]
    const weekDay   = SHORT_DAYS[dt.getDay()]
    const dayCost   = [d.breakfast, d.lunch, d.dinner].reduce((s, m) => s + (m?.pricePerServing || 0), 0)
    return `<tr style="background:${bg};border-bottom:1px solid #F5EDE8">
      <td style="padding:8px 14px;white-space:nowrap">
        <div style="font-weight:700;color:#C8604A;font-size:13px">${dateLabel}</div>
        <div style="font-size:10px;color:#8B5E52;font-weight:500">${weekDay}</div>
      </td>
      ${mealCell(d.breakfast, d.day, 'breakfast')}
      ${mealCell(d.lunch,     d.day, 'lunch')}
      ${mealCell(d.dinner,    d.day, 'dinner')}
      <td style="padding:8px 12px;text-align:right;font-weight:700;color:#E65100;white-space:nowrap;font-size:12px">&#8377;${dayCost}</td>
    </tr>`
  }).join('')

  if (grid) {
    grid.innerHTML = `<div style="overflow-x:auto;border-radius:12px;border:1.5px solid #F5D0C0;box-shadow:0 2px 12px rgba(200,96,74,.08)">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:560px">
        <thead><tr style="background:linear-gradient(135deg,#C8604A,#E65100);color:#fff">
          <th style="padding:11px 14px;text-align:left;white-space:nowrap;font-size:12px;font-weight:700;width:70px">Date</th>
          <th style="padding:11px 12px;text-align:left;font-size:12px;font-weight:700">☀️ Breakfast</th>
          <th style="padding:11px 12px;text-align:left;font-size:12px;font-weight:700">🌿 Lunch</th>
          <th style="padding:11px 12px;text-align:left;font-size:12px;font-weight:700">🌙 Dinner</th>
          <th style="padding:11px 12px;text-align:right;white-space:nowrap;font-size:12px;font-weight:700;width:65px">&#8377; Cost</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }
}

// ─────────────────────────────────────────────
// GENERATE MEAL PLAN
// ─────────────────────────────────────────────
function getActiveFoodDB() {
  return { breakfast: FOOD_DB.breakfast||[], lunch: FOOD_DB.lunch||[], dinner: FOOD_DB.dinner||[] }
}

function generateMealPlan() {
  const adb = getActiveFoodDB()
  const days = getDaysInMonth(state.selectedMonth, state.selectedYear)
  const filterType = state.filterType || 'all'

  const baseFilter = cat => (adb[cat] || []).filter(m => {
    if (m.spice > (state.spiceLevel ?? 4)) return false
    return true
  })

  const buildPool = cat => {
    const all      = baseFilter(cat)
    const vegItems = shuffle(all.filter(m => m.type === 'veg'))
    const nvItems  = shuffle(all.filter(m => m.type !== 'veg'))
    const pool = []
    const need = days * 2
    if (filterType === 'veg') {
      for (let i = 0; i < need; i++) pool.push(vegItems[i % Math.max(vegItems.length, 1)])
    } else if (filterType === 'nonveg') {
      let vi = 0, ni = 0
      for (let i = 0; i < need; i++) {
        if (i%3===2) { pool.push(vegItems[vi % Math.max(vegItems.length,1)]); vi++ }
        else         { pool.push(nvItems[ni  % Math.max(nvItems.length,1)]);  ni++ }
      }
    } else {
      let vi = 0, ni = 0
      for (let i = 0; i < need; i++) {
        if (i%2===0) { pool.push(vegItems[vi % Math.max(vegItems.length,1)]); vi++ }
        else         { pool.push(nvItems[ni  % Math.max(nvItems.length,1)]);  ni++ }
      }
    }
    const favs = shuffle(all.filter(m => (state.favourites||[]).includes(m.id)))
    return [...favs, ...pool]
  }

  const bk = buildPool('breakfast')
  const lu = buildPool('lunch')
  const di = buildPool('dinner')
  const plan = []
  for (let d = 1; d <= days; d++) {
    plan.push({
      day: d,
      breakfast: bk[(d-1) % Math.max(bk.length,1)],
      lunch:     lu[(d-1) % Math.max(lu.length,1)],
      dinner:    di[(d-1) % Math.max(di.length,1)],
    })
  }
  return plan
}

// ─────────────────────────────────────────────
// SAVE PLAN
// ─────────────────────────────────────────────
window.saveMealPlan = async function() {
  const seed = state.planSeed || Math.floor(Math.random() * 999999)
  await dbSaveMealPlan(state.selectedMonth, state.selectedYear, state.mealPlan, seed)
  setState('planSeed', seed)
  showToast('&#128190; Plan saved for ' + MONTHS[state.selectedMonth] + ' ' + state.selectedYear + '!')
}

// ─────────────────────────────────────────────
// REGENERATE
// ─────────────────────────────────────────────
window.regeneratePlan = function() {
  setState('mealPlan', generateMealPlan())
  setState('filterType', 'all')
  _renderPlan()
}

window.setTypeFilter = function(type, btn) {
  setState('filterType', type)
  document.querySelectorAll('.type-flt').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  _renderPlan()
}

// ─────────────────────────────────────────────
// RECIPE MODAL (inline)
// ─────────────────────────────────────────────
window.openRecipe = function(id, slot) {
  const allMeals = [...(FOOD_DB.breakfast||[]), ...(FOOD_DB.lunch||[]), ...(FOOD_DB.dinner||[])]
  const meal = allMeals.find(m => m.id === id)
  if (!meal) return
  const eff = getEffectivePeople()
  const scaled = (meal.ingredients || []).map(i => ({ ...i, qty: Math.round(i.qty * eff / (meal.baseServing||2) * 10) / 10 }))
  const ppl = getTotalPeople()
  const isFav = (state.favourites || []).includes(id)

  let modal = document.getElementById('_recipeModal')
  if (!modal) { modal = document.createElement('div'); modal.id = '_recipeModal'; document.body.appendChild(modal) }
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px'
  modal.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.2)">
    <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);padding:20px 24px;border-radius:16px 16px 0 0;color:#fff;position:sticky;top:0">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div>
          <h2 style="margin:0 0 4px;font-size:18px;font-weight:800">${meal.name}</h2>
          ${meal.tamil ? `<div style="font-size:13px;opacity:.8">${meal.tamil}</div>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <span style="background:rgba(255,255,255,.2);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">⏱ ${meal.time||'?'} min</span>
            <span style="background:rgba(255,255,255,.2);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">👥 ${ppl} people</span>
            <span style="background:rgba(255,255,255,.2);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">₹${Math.round((meal.pricePerServing||0)*eff)} total</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="toggleFavouriteFromModal('${id}')" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:8px 12px;cursor:pointer;color:#fff;font-size:16px">${isFav?'❤️':'🤍'}</button>
          <button onclick="document.getElementById('_recipeModal').style.display='none'" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:8px 12px;cursor:pointer;color:#fff;font-size:16px">✕</button>
        </div>
      </div>
    </div>
    <div style="padding:20px 24px">
      ${meal.ingredients?.length ? `<h4 style="margin:0 0 12px;color:#1B5E20">Ingredients (for ${ppl} people)</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:20px">
          ${scaled.map(i => `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#F8FDF9;border-radius:8px;border:1px solid #C8E6C9">
            <span style="font-size:13px;color:#2d2d2d">${i.item}</span>
            <span style="font-size:13px;font-weight:700;color:#2E7D32">${i.qty}${i.unit?' '+i.unit:''}</span>
          </div>`).join('')}
        </div>` : ''}
      ${meal.steps?.length ? `<h4 style="margin:0 0 12px;color:#1B5E20">Steps</h4>
        <ol style="margin:0;padding-left:20px;color:#5a3e36">
          ${meal.steps.map(s => `<li style="margin-bottom:8px;font-size:13px;line-height:1.5">${s}</li>`).join('')}
        </ol>` : ''}
    </div>
  </div>`
  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none' }
}

window.toggleFavouriteFromModal = function(id) {
  let favs = state.favourites || []
  if (favs.includes(id)) favs = favs.filter(f => f !== id)
  else favs = [...favs, id]
  setState('favourites', favs)
  // Re-render modal header star
  const btn = document.querySelector('#_recipeModal button')
  if (btn) btn.textContent = favs.includes(id) ? '❤️' : '🤍'
}

// ─────────────────────────────────────────────
// REPLACE MEAL MODAL
// ─────────────────────────────────────────────
let _replaceCtx = {}

window.openReplace = function(day, slot, currentId) {
  _replaceCtx = { day, slot, currentId }
  let modal = document.getElementById('_replaceModal')
  if (!modal) { modal = document.createElement('div'); modal.id = '_replaceModal'; document.body.appendChild(modal) }
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px'
  modal.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column">
    <div style="padding:16px 20px;border-bottom:1px solid #F5EDE8;display:flex;align-items:center;gap:12px">
      <h3 style="margin:0;font-size:15px;color:#C8604A;flex:1">Replace Day ${day} — ${slot.charAt(0).toUpperCase()+slot.slice(1)}</h3>
      <button onclick="document.getElementById('_replaceModal').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:18px;color:#8B5E52">✕</button>
    </div>
    <div style="padding:12px 20px;border-bottom:1px solid #F5EDE8">
      <input id="_repSearch" type="text" placeholder="🔍 Search meals..." oninput="_renderReplaceList()" style="width:100%;padding:10px 14px;border:1.5px solid #E8D5C4;border-radius:9px;font-size:14px;outline:none;box-sizing:border-box"/>
    </div>
    <div id="_repList" style="overflow-y:auto;flex:1;padding:10px 20px"></div>
  </div>`
  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none' }
  _renderReplaceList()
}

window._renderReplaceList = function() {
  const { slot, currentId } = _replaceCtx
  const q = (document.getElementById('_repSearch')?.value || '').toLowerCase()
  const adb = getActiveFoodDB()
  const avail = (adb[slot] || []).filter(m => {
    if (m.id === currentId) return false
    if (m.spice > (state.spiceLevel ?? 4)) return false
    return !q || m.name.toLowerCase().includes(q) || (m.tamil||'').includes(q)
  })
  const list = document.getElementById('_repList')
  if (!list) return
  list.innerHTML = avail.length ? avail.map(m => `<div onclick="confirmReplace('${m.id}')" style="padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #F0E8E0;margin-bottom:6px;background:#fff" onmouseover="this.style.background='#FFF5EF'" onmouseout="this.style.background='#fff'">
    <div>
      <div style="font-size:13px;font-weight:600;color:#2d2d2d">${m.name}</div>
      <div style="font-size:11px;color:#8B5E52">${m.tamil||''} · ${m.time||'?'} min · ₹${m.pricePerServing||0}</div>
    </div>
    <span style="font-size:11px;padding:3px 8px;border-radius:12px;font-weight:700;background:${m.type==='veg'?'#E8F5E9':'#FFEBEE'};color:${m.type==='veg'?'#2E7D32':'#C62828'}">${m.type==='veg'?'Veg':'NV'}</span>
  </div>`).join('') : '<div style="padding:20px;text-align:center;color:#aaa">No meals found</div>'
}

window.confirmReplace = function(newId) {
  const { day, slot } = _replaceCtx
  const adb = getActiveFoodDB()
  const newMeal = (adb[slot] || []).find(m => m.id === newId)
  if (!newMeal) return
  const idx = state.mealPlan.findIndex(d => d.day === day)
  if (idx >= 0) state.mealPlan[idx] = { ...state.mealPlan[idx], [slot]: newMeal }
  document.getElementById('_replaceModal').style.display = 'none'
  _renderPlan()
  showToast('&#8635; Meal replaced!')
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
function getPlanHTML() {
  return `
  <div>
    <div id="planLockBanner" style="display:none"></div>
    <div class="toolbar" id="planToolbar" style="flex-wrap:wrap;gap:8px;margin-bottom:14px;display:flex;align-items:center">
      <input class="search-input" id="searchInput" placeholder="🔍 Search meals..." oninput="_renderPlan()" style="flex:1;min-width:150px;padding:10px 14px;border:1.5px solid #E8D5C4;border-radius:20px;font-size:13px;outline:none"/>
      <div class="filter-btns" style="display:flex;gap:6px">
        <button class="flt-btn type-flt active" onclick="setTypeFilter('all',this)">&#127869;&#65039; All Types</button>
        <button class="flt-btn type-flt" onclick="setTypeFilter('veg',this)">&#129001; Veg</button>
        <button class="flt-btn type-flt" onclick="setTypeFilter('nonveg',this)">&#127831; Non-Veg</button>
      </div>
      <button onclick="regeneratePlan()" style="padding:8px 16px;background:linear-gradient(135deg,#C8604A,#E65100);color:#fff;border:none;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">&#128260; Regenerate</button>
      <button onclick="saveMealPlan()" style="padding:8px 16px;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;border:none;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">&#128190; Save Plan</button>
    </div>
    <div id="daysGrid"></div>
    <div id="emptyMsg" style="display:none;text-align:center;padding:48px;color:#aaa">
      <div style="font-size:40px;margin-bottom:12px">&#128269;</div>
      <div style="font-size:15px">No meals found</div>
    </div>
  </div>`
}

// Expose internal render for search input
window._renderPlan = _renderPlan
