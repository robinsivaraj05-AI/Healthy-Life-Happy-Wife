// ═══════════════════════════════════════════════════════
// MODULE: Grocery Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { DIET_DB } from '../data/diet-db.js'
import { DOLU_PLANS } from '../data/dolu-plans.js'
import { MONTHS, getDefaultPrice, getGroceryCat, STATES_CONFIG } from '../data/config.js'
import { saveGroceryData } from '../supabase/db.js'

// ─────────────────────────────────────────────
// SERVING WEIGHTS
// ─────────────────────────────────────────────
const MEMBER_SERVING = { men: 1.0, women: 0.85, agedParents: 0.7, children: 0.5 }

function getTotalPeople() {
  return (state.householdMen||0) + (state.householdWomen||0) + (state.householdAged||0) + (state.householdChildren||0)
}
function getEffectivePeople() {
  const s = (state.householdMen||0)*1 + (state.householdWomen||0)*0.85 + (state.householdAged||0)*0.7 + (state.householdChildren||0)*0.5
  return Math.max(1, Math.round(s * 10) / 10)
}
function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate() }

// ─────────────────────────────────────────────
// RENDER ENTRY POINT
// ─────────────────────────────────────────────
export function renderGrocery(el) {
  el.innerHTML = getGroceryHTML()
  _renderGrocery()
}

function _renderGrocery() {
  const monthLabel = MONTHS[state.selectedMonth] + ' ' + state.selectedYear
  const groceries  = buildGroceryList()
  const days       = getDaysInMonth(state.selectedMonth, state.selectedYear)
  const total      = groceries.reduce((s, g) => s + calcGroceryCost(g), 0)

  const dietMembers    = getDietMembersForGrocery()
  const dietMemberTotal = dietMembers.reduce((s, m) => s + m.monthlyCost, 0)
  let followedDoluTotal = 0
  try {
    ;(state.followedPlans || []).forEach(fp => {
      const plan = DOLU_PLANS.find(p => p.id === fp.plan_id)
      if (plan && plan.avgDayCost) followedDoluTotal += plan.avgDayCost * days
    })
  } catch (e) {}
  const dietTotal  = dietMemberTotal + followedDoluTotal
  const grandTotal = total + dietTotal

  // Header banner
  const banner = document.getElementById('grocHeaderBanner')
  if (banner) {
    banner.innerHTML = `<div style="background:linear-gradient(135deg,#1B5E20,#2E7D32,#43A047);border-radius:14px;margin-bottom:14px;overflow:hidden">
      <div style="padding:14px 18px;color:#fff;display:flex;align-items:center;gap:12px">
        <span style="font-size:28px">&#128722;</span>
        <div style="flex:1">
          <h2 style="margin:0 0 2px;font-size:16px;font-weight:800">Monthly Grocery Planner</h2>
          <p style="margin:0;font-size:10px;opacity:.8">${monthLabel} &mdash; Meal plan &amp; Diet plan combined</p>
        </div>
      </div>
      <div style="display:flex;border-top:1px solid rgba(255,255,255,.2)">
        <div style="flex:1;padding:10px 14px;text-align:center;border-right:1px solid rgba(255,255,255,.15)">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.7);text-transform:uppercase">&#127869; Meal</div>
          <div style="font-size:15px;font-weight:800;color:#fff">&#8377;${Math.round(total).toLocaleString()}</div>
        </div>
        <div style="flex:1;padding:10px 14px;text-align:center;border-right:1px solid rgba(255,255,255,.15)">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.7);text-transform:uppercase">&#129361; Diet</div>
          <div style="font-size:15px;font-weight:800;color:#fff">&#8377;${Math.round(dietTotal).toLocaleString()}</div>
        </div>
        <div style="flex:1;padding:10px 14px;text-align:center;border-right:1px solid rgba(255,255,255,.15)">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.7);text-transform:uppercase">&#128203; Total</div>
          <div style="font-size:15px;font-weight:800;color:#FFCC80">&#8377;${Math.round(grandTotal).toLocaleString()}</div>
        </div>
        <div style="flex:1;padding:10px 14px;text-align:center">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.7);text-transform:uppercase">&#128197; Daily</div>
          <div style="font-size:15px;font-weight:800;color:#fff">&#8377;${Math.round(grandTotal / days)}</div>
        </div>
      </div>
    </div>`
  }

  // Tab toggle
  const tabToggle = document.getElementById('grocTabToggle')
  if (tabToggle) {
    tabToggle.innerHTML = `<div style="display:flex;border-radius:12px;overflow:hidden;border:2px solid #E8D5C4">
      <button id="grocTabMeal" onclick="switchGrocTab('meal')" style="flex:1;padding:12px 16px;border:none;cursor:pointer;font-size:13px;font-weight:700;transition:all .2s">&#127869;&#65039; Meal Menu</button>
      <button id="grocTabDiet" onclick="switchGrocTab('diet')" style="flex:1;padding:12px 16px;border:none;cursor:pointer;font-size:13px;font-weight:700;transition:all .2s">&#129361; Diet Menu</button>
    </div>`
  }

  // Mini toolbar
  const toolbar = document.getElementById('grocMiniToolbar')
  if (toolbar) {
    toolbar.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#FFF8F5;border-radius:10px;border:1px solid #F5D0C0">
      <span style="font-size:12px;font-weight:600;color:#8B5E52">Pricing:</span>
      <button class="flt-btn ${state.priceMode!=='manual'?'active':''}" id="priceModeAuto" onclick="setPriceMode('auto')">&#129302; Auto</button>
      <button class="flt-btn ${state.priceMode==='manual'?'active':''}" id="priceModeManual" onclick="setPriceMode('manual')">&#9999; Manual</button>
      <div style="flex:1"></div>
      <button onclick="downloadCSV()" style="padding:7px 12px;background:#1565C0;color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer">&#11015; Download All</button>
    </div>`
  }

  switchGrocTab(state.groceryTab)
}

// ─────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────
window.switchGrocTab = function(tab) {
  setState('groceryTab', tab)
  const mealBtn = document.getElementById('grocTabMeal')
  const dietBtn = document.getElementById('grocTabDiet')
  if (mealBtn) { mealBtn.style.background = tab==='meal' ? 'linear-gradient(135deg,#C8604A,#E65100)' : 'transparent'; mealBtn.style.color = tab==='meal' ? '#fff' : '#8B5E52' }
  if (dietBtn) { dietBtn.style.background = tab==='diet' ? 'linear-gradient(135deg,#1B5E20,#2E7D32)' : 'transparent'; dietBtn.style.color = tab==='diet' ? '#fff' : '#8B5E52' }
  renderGroceryContent()
}

function renderGroceryContent() {
  const container = document.getElementById('groceryMainContent')
  if (!container) return
  if (state.groceryTab === 'meal') renderMealGroceryContent(container)
  else renderDietGroceryContent(container)
}

// ─────────────────────────────────────────────
// MEAL GROCERY CONTENT
// ─────────────────────────────────────────────
function renderMealGroceryContent(container) {
  const groceries = buildGroceryList()
  const catGroups = { vegetables: [], nonveg: [], grocery: [] }
  groceries.forEach(g => { catGroups[getGroceryCat(g.item)].push(g) })
  const catMeta = {
    vegetables: { label:'Vegetables, Fruits & Herbs', emoji:'&#129388;', color:'#1B5E20', bg:'#E8F5E9', border:'#A5D6A7' },
    nonveg:     { label:'Non-Veg (Meat, Fish & Eggs)', emoji:'&#127831;', color:'#B71C1C', bg:'#FFEBEE', border:'#FFCDD2' },
    grocery:    { label:'Grocery, Dry Foods & Nuts',   emoji:'&#128722;', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' }
  }
  let html = ''
  ;['vegetables','nonveg','grocery'].forEach(cat => {
    const items  = catGroups[cat]
    const meta   = catMeta[cat]
    const isOpen = state.grocSectionOpen[cat] === true
    const catTotal = items.reduce((s, g) => s + calcGroceryCost(g), 0)
    const catAllChecked = items.length > 0 && items.every(g => state.checkedItems[g.item.toLowerCase()])
    html += `<div style="border:1.5px solid ${meta.border};border-radius:14px;overflow:hidden;margin-bottom:12px">
      <div onclick="toggleGrocSection('${cat}')" style="display:flex;align-items:center;gap:10px;padding:13px 16px;background:${meta.bg};cursor:pointer;user-select:none">
        <span style="font-size:20px">${meta.emoji}</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:${meta.color}">${meta.label}</div>
          <div style="font-size:11px;color:${meta.color};opacity:.8">${items.length} items &bull; &#8377;${Math.round(catTotal).toLocaleString()}/month</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center" onclick="event.stopPropagation()">
          <button onclick="toggleCatGrocery('${cat}')" style="padding:5px 10px;background:${catAllChecked?'#43A047':'#fff'};color:${catAllChecked?'#fff':meta.color};border:2px solid ${meta.color};border-radius:7px;font-size:11px;font-weight:700;cursor:pointer">${catAllChecked?'&#9745; Deselect All':'&#9744; Select All'}</button>
          <button onclick="downloadCatGrocery('${cat}','meal')" style="padding:5px 10px;background:${meta.color};color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer">&#11015; Download</button>
        </div>
        <span style="font-size:14px;color:${meta.color};margin-left:6px">${isOpen?'&#9650;':'&#9660;'}</span>
      </div>`
    if (isOpen && items.length) {
      html += `<div>
        <div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;gap:0;padding:7px 14px;background:${meta.bg};border-top:1px solid ${meta.border};opacity:.9">
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Item</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Qty</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Unit</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Cost</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">&#9999;&#65039; Remarks</div>
        </div>`
      items.forEach(g => {
        const k    = g.item.toLowerCase()
        const done = !!state.checkedItems[k]
        const cost = Math.round(calcGroceryCost(g))
        const remark = (state.groceryRemarks && state.groceryRemarks[k]) || ''
        html += `<div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;gap:0;padding:9px 14px;border-top:1px solid ${meta.border};align-items:center;background:${done?'#F9FBE7':'#fff'}">
          <div style="display:flex;align-items:center;gap:7px">
            <div onclick="toggleGrocery('${k}')" style="width:18px;height:18px;border-radius:4px;border:2px solid ${done?meta.color:'#ccc'};background:${done?meta.color:'#fff'};cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center">
              ${done?'<span style="color:#fff;font-size:10px;font-weight:700">&#10003;</span>':''}
            </div>
            <div style="font-size:13px;font-weight:600;color:#2d2d2d">${g.item}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:#5a3e36">${Math.round(g.qty*10)/10}</div>
          <div style="font-size:12px;color:#8B5E52">${g.unit}</div>
          <div style="font-size:13px;font-weight:700;color:${meta.color}">&#8377;${cost}</div>
          <div><input type="text" value="${remark.replace(/"/g,'&quot;')}" placeholder="Add remark..." onchange="setGroceryRemark('${k}',this.value)" style="width:100%;padding:5px 8px;border:1px solid #E8D5C4;border-radius:6px;font-size:11px;outline:none;box-sizing:border-box" onclick="event.stopPropagation()"/></div>
        </div>`
      })
      html += `<div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;padding:9px 14px;background:${meta.bg};border-top:2px solid ${meta.border}">
        <div style="font-size:12px;font-weight:700;color:${meta.color}">${items.length} items total</div><div></div><div></div>
        <div style="font-size:14px;font-weight:800;color:${meta.color}">&#8377;${Math.round(catTotal).toLocaleString()}</div><div></div>
      </div></div>`
    }
    html += '</div>'
  })
  if (!groceries.length) {
    html = `<div style="text-align:center;padding:40px 20px;background:#FFF5EF;border-radius:14px;border:1.5px solid #F5D0C0">
      <div style="font-size:40px;margin-bottom:12px">&#128722;</div>
      <div style="font-size:15px;font-weight:700;color:#C8604A;margin-bottom:6px">No Meal Plan Found</div>
      <div style="font-size:12px;color:#8B5E52">Go to the <strong>Plan</strong> tab and generate a monthly meal plan first.</div>
    </div>`
  }
  container.innerHTML = html
}

// ─────────────────────────────────────────────
// DIET GROCERY CONTENT
// ─────────────────────────────────────────────
function renderDietGroceryContent(container) {
  const dietMembers = getDietMembersForGrocery()
  const groceries   = buildDietGroceryList()
  const catGroups   = { vegetables: [], nonveg: [], grocery: [] }
  groceries.forEach(g => {
    if (g.cat === 'vegetables') catGroups.vegetables.push(g)
    else if (g.cat === 'nonveg') catGroups.nonveg.push(g)
    else catGroups.grocery.push(g)
  })
  const catMeta = {
    vegetables: { label:'Vegetables, Fruits & Herbs', emoji:'&#129388;', color:'#1B5E20', bg:'#E8F5E9', border:'#A5D6A7' },
    nonveg:     { label:'Non-Veg (Meat, Fish & Eggs)', emoji:'&#127831;', color:'#B71C1C', bg:'#FFEBEE', border:'#FFCDD2' },
    grocery:    { label:'Grocery, Grains & Spices',    emoji:'&#127807;', color:'#1565C0', bg:'#E3F2FD', border:'#BBDEFB' }
  }
  let html = ''

  if (dietMembers.length) {
    html += `<div style="background:linear-gradient(135deg,#E8F5E9,#F1F8E9);border:1.5px solid #A5D6A7;border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:#1B5E20;margin-bottom:8px">&#129361; Diet Members &mdash; ${MONTHS[state.selectedMonth]} ${state.selectedYear}</div>
      ${dietMembers.map(dm => `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:#fff;border-radius:8px;margin-bottom:5px">
        <div><div style="font-size:13px;font-weight:700;color:#2E7D32">${dm.name}</div>
        <div style="font-size:10px;color:#8B5E52">${dm.cat}${dm.cal ? ' &bull; ~' + dm.cal + ' kcal/day' : ''}</div></div>
        <div style="text-align:right"><div style="font-size:13px;font-weight:800;color:#1B5E20">&#8377;${dm.monthlyCost.toLocaleString()}/mo</div>
        <div style="font-size:10px;color:#8B5E52">~&#8377;${Math.round(dm.monthlyCost/30)}/day</div></div>
      </div>`).join('')}
    </div>`
  }

  ;['vegetables','nonveg','grocery'].forEach(cat => {
    const items  = catGroups[cat]
    const meta   = catMeta[cat]
    const isOpen = state.grocSectionOpen['diet_' + cat] === true
    const catTotal = items.reduce((s, g) => s + calcGroceryCost(g), 0)
    html += `<div style="border:1.5px solid ${meta.border};border-radius:14px;overflow:hidden;margin-bottom:12px">
      <div onclick="toggleGrocSection('diet_${cat}')" style="display:flex;align-items:center;gap:10px;padding:13px 16px;background:${meta.bg};cursor:pointer;user-select:none">
        <span style="font-size:20px">${meta.emoji}</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:${meta.color}">${meta.label}</div>
          <div style="font-size:11px;color:${meta.color};opacity:.8">${items.length} items &bull; &#8377;${Math.round(catTotal).toLocaleString()}/month</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center" onclick="event.stopPropagation()">
          <button onclick="downloadCatGrocery('${cat}','diet')" style="padding:5px 10px;background:${meta.color};color:#fff;border:none;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer">&#11015; Download</button>
        </div>
        <span style="font-size:14px;color:${meta.color};margin-left:6px">${isOpen?'&#9650;':'&#9660;'}</span>
      </div>`
    if (isOpen && items.length) {
      html += `<div>
        <div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;gap:0;padding:7px 14px;background:${meta.bg};border-top:1px solid ${meta.border};opacity:.9">
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Item</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Qty</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Unit</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">Cost</div>
          <div style="font-size:11px;font-weight:700;color:${meta.color}">&#9999;&#65039; Remarks</div>
        </div>`
      items.forEach(g => {
        const k = 'diet_' + g.item.toLowerCase().substring(0, 20)
        const cost = Math.round(calcGroceryCost(g))
        const remark = (state.groceryRemarks && state.groceryRemarks[k]) || ''
        html += `<div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;gap:0;padding:9px 14px;border-top:1px solid ${meta.border};align-items:center;background:#fff">
          <div style="font-size:13px;font-weight:600;color:#2d2d2d">${g.item}</div>
          <div style="font-size:13px;font-weight:600;color:#5a3e36">${Math.round(g.qty*10)/10}</div>
          <div style="font-size:12px;color:#8B5E52">${g.unit}</div>
          <div style="font-size:13px;font-weight:700;color:${meta.color}">&#8377;${cost}</div>
          <div><input type="text" value="${remark.replace(/"/g,'&quot;')}" placeholder="Add remark..." onchange="setGroceryRemark('${k}',this.value)" style="width:100%;padding:5px 8px;border:1px solid #E8D5C4;border-radius:6px;font-size:11px;outline:none;box-sizing:border-box" onclick="event.stopPropagation()"/></div>
        </div>`
      })
      html += `<div style="display:grid;grid-template-columns:2fr 70px 55px 80px 1fr;padding:9px 14px;background:${meta.bg};border-top:2px solid ${meta.border}">
        <div style="font-size:12px;font-weight:700;color:${meta.color}">${items.length} items total</div><div></div><div></div>
        <div style="font-size:14px;font-weight:800;color:${meta.color}">&#8377;${Math.round(catTotal).toLocaleString()}</div><div></div>
      </div></div>`
    } else if (isOpen && !items.length) {
      html += `<div style="padding:18px 16px;text-align:center;font-size:12px;color:#8B5E52;border-top:1px solid ${meta.border}">No items in this category</div>`
    }
    html += '</div>'
  })
  if (!groceries.length) {
    html = `<div style="text-align:center;padding:40px 20px;background:#FFF5EF;border-radius:14px;border:1.5px solid #F5D0C0">
      <div style="font-size:40px;margin-bottom:12px">&#129361;</div>
      <div style="font-size:15px;font-weight:700;color:#C8604A;margin-bottom:6px">No Diet Data Found</div>
      <div style="font-size:12px;color:#8B5E52">Diet ingredient database is not loaded.</div>
    </div>`
  }
  container.innerHTML = html
}

// ─────────────────────────────────────────────
// CALCULATION HELPERS
// ─────────────────────────────────────────────
function calcGroceryCost(g) {
  return getPrice(g.item, g.basePrice) * (g.qty / (g.unit === 'g' ? 1000 : g.unit === 'ml' ? 1000 : 1))
}

function getPrice(item, basePrice) {
  const k = item.toLowerCase()
  return state.priceMode === 'manual' && state.customPrices[k] != null ? state.customPrices[k] : basePrice
}

function scaleIng(ing, baseServing, people) {
  return ing.map(i => ({ ...i, qty: Math.round(i.qty * people / baseServing * 10) / 10 }))
}

// ─────────────────────────────────────────────
// BUILD MEAL GROCERY LIST
// ─────────────────────────────────────────────
function buildGroceryList() {
  const groc = {}
  const eff  = getEffectivePeople()
  ;(state.mealPlan || []).forEach(({ breakfast, lunch, dinner }) => {
    ;[breakfast, lunch, dinner].forEach(meal => {
      if (!meal || !meal.ingredients) return
      scaleIng(meal.ingredients, meal.baseServing || 2, eff).forEach(({ item, qty, unit }) => {
        const k = item.toLowerCase()
        if (!groc[k]) groc[k] = { item, qty: 0, unit, basePrice: getDefaultPrice(item) }
        groc[k].qty += qty
      })
    })
  })
  return Object.values(groc).sort((a, b) => a.item.localeCompare(b.item))
}

// ─────────────────────────────────────────────
// BUILD DIET GROCERY LIST
// ─────────────────────────────────────────────
function buildDietGroceryList() {
  if (!DIET_DB) return []
  const days        = getDaysInMonth(state.selectedMonth, state.selectedYear)
  const dietMembers = getDietMembersForGrocery()
  const memberCount = Math.max(1, dietMembers.length)
  const itemMap = {}
  ;['breakfast','lunch','dinner','snacks'].forEach(slot => {
    const meals = DIET_DB[slot] || []
    for (let d = 0; d < days; d++) {
      const meal = meals[d % meals.length]
      if (!meal || !meal.ingredients) continue
      const parts = meal.ingredients.split(/\s*·\s*/)
      parts.forEach(ing => {
        ing = ing.trim()
        if (!ing || ing.length < 2) return
        let name = '', qty = 0, unit = 'g'
        const m = ing.match(/^(.+?)\s+([\d.]+)\s*(g|ml|kg|litre|ltr|cup|cups|tbsp|tsp|nos?|pieces?|handful|bunch|pinch)\b/i)
        if (m) {
          name = m[1].trim(); qty = parseFloat(m[2]); unit = m[3].toLowerCase()
          if (unit === 'kg') { qty *= 1000; unit = 'g' }
          else if (unit === 'litre' || unit === 'ltr') { qty *= 1000; unit = 'ml' }
          else if (/^nos?$|^pieces?$/.test(unit)) unit = 'piece'
        } else {
          name = ing.replace(/\d+/g, '').trim(); qty = 1; unit = 'pinch'
        }
        name = name.split('(')[0].trim()
        if (!name || name.length < 2) return
        const k = name.toLowerCase().substring(0, 30)
        if (!itemMap[k]) itemMap[k] = { item: name, qty: 0, unit, basePrice: getDefaultPrice(name), cat: getGroceryCat(name) }
        itemMap[k].qty += qty * memberCount
      })
    }
  })
  return Object.values(itemMap).sort((a, b) => a.item.localeCompare(b.item))
}

// ─────────────────────────────────────────────
// GET DIET MEMBERS FOR GROCERY
// ─────────────────────────────────────────────
function getDietMembersForGrocery() {
  const result = []
  try {
    const familyMembers = state.familyMembers || []
    const savedDietMembers = state.dietMembers || []
    familyMembers.forEach(m => {
      if (m.menu_type === 'diet' && (m.name || '').trim()) {
        const dm = savedDietMembers.find(d => d.name.toLowerCase() === m.name.trim().toLowerCase())
        let dailyCost = 0
        if (dm && DIET_DB) {
          ;['breakfast','lunch','dinner','snacks'].forEach(slot => {
            const meals = DIET_DB[slot] || []
            if (!meals.length) return
            const slotAvg = meals.reduce((s, ml) => s + (ml.price || 0), 0) / meals.length
            dailyCost += slotAvg
          })
        }
        result.push({ name: m.name.trim(), cat: dm?.cat || '', cal: dm?.cal || 0, dailyCost: Math.round(dailyCost), monthlyCost: Math.round(dailyCost * 30) })
      }
    })
  } catch (e) {}
  return result
}

// ─────────────────────────────────────────────
// INTERACTIVE HANDLERS
// ─────────────────────────────────────────────
window.toggleGrocSection = function(cat) {
  state.grocSectionOpen[cat] = state.grocSectionOpen[cat] === true ? false : true
  renderGroceryContent()
}

window.toggleCatGrocery = function(cat) {
  const groceries = buildGroceryList().filter(g => getGroceryCat(g.item) === cat)
  const allChecked = groceries.length > 0 && groceries.every(g => state.checkedItems[g.item.toLowerCase()])
  groceries.forEach(g => { state.checkedItems[g.item.toLowerCase()] = !allChecked })
  saveGroceryData({ custom_prices: state.customPrices, remarks: state.groceryRemarks, checked_items: state.checkedItems })
  renderGroceryContent()
}

window.toggleGrocery = function(key) {
  state.checkedItems[key] = !state.checkedItems[key]
  saveGroceryData({ custom_prices: state.customPrices, remarks: state.groceryRemarks, checked_items: state.checkedItems })
  renderGroceryContent()
}

window.setGroceryRemark = function(key, val) {
  if (!state.groceryRemarks) setState('groceryRemarks', {})
  state.groceryRemarks[key] = val
  saveGroceryData({ custom_prices: state.customPrices, remarks: state.groceryRemarks, checked_items: state.checkedItems })
}

window.setPriceMode = function(mode) {
  setState('priceMode', mode)
  const au = document.getElementById('priceModeAuto')
  const mn = document.getElementById('priceModeManual')
  if (au) au.classList.toggle('active', mode !== 'manual')
  if (mn) mn.classList.toggle('active', mode === 'manual')
  _renderGrocery()
}

window.downloadCatGrocery = function(cat, tab) {
  const monthLabel = MONTHS[state.selectedMonth] + ' ' + state.selectedYear
  let items = []
  if (tab === 'meal') items = buildGroceryList().filter(g => getGroceryCat(g.item) === cat)
  else items = buildDietGroceryList().filter(g => g.cat === cat)
  const fmtCell = v => { const s = String(v == null ? '' : v); return (s.includes(',') || s.includes('"')) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const rows = [
    ['Jeevamithran — ' + (tab==='diet'?'Diet':'Meal') + ' Grocery — ' + cat.toUpperCase()],
    ['Month: ' + monthLabel], [],
    ['#','Item','Qty','Unit','Remarks']
  ]
  items.forEach((g, i) => {
    const k = g.item.toLowerCase()
    rows.push([i+1, g.item, Math.round(g.qty*10)/10, g.unit, (state.groceryRemarks && state.groceryRemarks[k]) || ''])
  })
  const csv = '﻿' + rows.map(r => r.map(fmtCell).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = `Jeevamithran_${cat}_${monthLabel.replace(' ','_')}_${tab}.csv`
  a.click()
}

window.downloadCSV = function() {
  const monthLabel = MONTHS[state.selectedMonth] + ' ' + state.selectedYear
  const groceries  = buildGroceryList()
  const days       = getDaysInMonth(state.selectedMonth, state.selectedYear)
  const total      = groceries.reduce((s, g) => s + calcGroceryCost(g), 0)
  const fmtCell = v => { const s = String(v == null ? '' : v); return (s.includes(',') || s.includes('"')) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const rows = [
    ['Jeevamithran Monthly Planning'], ['Grocery Budget — ' + monthLabel],
    ['Household: ' + getTotalPeople() + ' people'], [], ['BUDGET SUMMARY'],
    ['Period', 'Estimated Cost (Rs)'],
    ['Daily Average', Math.round(total/days)],
    ['Monthly Total', Math.round(total)], [],
    ['#','Item','Quantity','Unit','Est. Cost (Rs)']
  ]
  groceries.forEach((g, i) => rows.push([i+1, g.item, Math.round(g.qty*10)/10, g.unit, Math.round(calcGroceryCost(g))]))
  rows.push([], ['','','','TOTAL', Math.round(total)])
  const csv = '﻿' + rows.map(r => r.map(fmtCell).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = `Jeevamithran_Grocery_${MONTHS[state.selectedMonth]}_${state.selectedYear}.csv`
  a.click()
}

// ─────────────────────────────────────────────
// HTML TEMPLATE
// ─────────────────────────────────────────────
function getGroceryHTML() {
  return `
  <div>
    <div id="grocHeaderBanner"></div>
    <div id="grocTabToggle" style="margin-bottom:14px"></div>
    <div id="grocMiniToolbar" style="margin-bottom:14px"></div>
    <div id="groceryMainContent"></div>
  </div>`
}
