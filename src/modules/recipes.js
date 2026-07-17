// ═══════════════════════════════════════════════════════
// MODULE: Recipes Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { FOOD_DB } from '../data/food-db.js'
import { toggleFavourite as dbToggleFavourite } from '../supabase/db.js'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function allMeals() { return [...(FOOD_DB.breakfast||[]), ...(FOOD_DB.lunch||[]), ...(FOOD_DB.dinner||[])] }
function getTotalPeople() { return (state.householdMen||0)+(state.householdWomen||0)+(state.householdAged||0)+(state.householdChildren||0) }
function getEffectivePeople() {
  const s = (state.householdMen||0)*1 + (state.householdWomen||0)*0.85 + (state.householdAged||0)*0.7 + (state.householdChildren||0)*0.5
  return Math.max(1, Math.round(s*10)/10)
}
function scaleIng(ing, base, people) {
  return (ing||[]).map(i => ({ ...i, qty: Math.round(i.qty * people / base * 10) / 10 }))
}
function spiceDots(level) {
  const color = level<=1?'filled-low':level<=2?'filled-med':'filled-high'
  return `<span class="spice-dots">${[1,2,3,4].map(i=>`<span class="spice-dot${i<=level?' '+color:''}"></span>`).join('')}</span>`
}
function isSideDishCombo(name) {
  const n = name.toLowerCase()
  return n.includes('rice') && /poriyal|kootu|stir fry|fry rice|roast rice/.test(n)
}
function getCatLabel(id) {
  if ((FOOD_DB.breakfast||[]).find(m => m.id === id)) return 'breakfast'
  if ((FOOD_DB.lunch||[]).find(m => m.id === id)) return 'lunch'
  return 'dinner'
}
function getRecipeMTName(meal) { return meal.tamil || '' }

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderRecipes(el) {
  if (el) el.innerHTML = getRecipesHTML()
  renderRecipeStats()
  renderFavSummary()
  _renderRecipes()
}

function _renderRecipes() {
  const q        = (document.getElementById('recipeSearch')?.value || '').toLowerCase()
  const cat      = state.recipeCat || 'all'
  const favOnly  = !!state.favOnly
  const planOnly = !!state.planOnly

  let meals = cat === 'all' ? allMeals() : (FOOD_DB[cat] || [])

  const inPlanIds = {}
  ;(state.mealPlan || []).forEach(d => {
    ['breakfast','lunch','dinner'].forEach(slot => { if (d[slot]) inPlanIds[d[slot].id] = slot })
  })
  const favSet = new Set(state.favourites || [])

  meals = meals.filter(m => {
    if (favOnly  && !favSet.has(m.id)) return false
    if (planOnly && !inPlanIds[m.id])  return false
    if (q && !m.name.toLowerCase().includes(q) && !(m.tamil||'').includes(q)) return false
    return true
  })

  meals.sort((a, b) => {
    const fa = favSet.has(a.id), fb = favSet.has(b.id)
    const pa = !!inPlanIds[a.id],  pb = !!inPlanIds[b.id]
    if (fa !== fb) return fa ? -1 : 1
    if (pa !== pb) return pa ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const grid = document.getElementById('recipeGrid')
  if (!grid) return

  if (!meals.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#aaa"><div style="font-size:40px;margin-bottom:8px">&#128269;</div><div>No recipes found</div></div>'
    return
  }

  let mainMeals = meals, sideMeals = []
  if (cat === 'lunch' && !favOnly && !planOnly) {
    mainMeals = meals.filter(m => !isSideDishCombo(m.name))
    sideMeals = meals.filter(m => isSideDishCombo(m.name))
  }

  grid.innerHTML = ''

  function makeCard(meal) {
    const isFav   = favSet.has(meal.id)
    const inPlan  = !!inPlanIds[meal.id]
    const slot    = inPlanIds[meal.id] || ''
    const slotEm  = { breakfast:'&#9728;&#65039;', lunch:'&#127807;', dinner:'&#127769;' }[slot] || ''
    const isVeg   = meal.type === 'veg'
    const card    = document.createElement('div')
    card.className = 'recipe-card' + (isFav?' recipe-fav':'')
    card.setAttribute('data-id', meal.id)
    card.onclick = () => openRecipeModal(meal.id)
    card.innerHTML =
      `<div class="rc-top">
        <div style="display:flex;gap:3px;flex-wrap:wrap;align-items:center">
          <span class="rc-cat-chip" style="background:${isVeg?'#E8F5E9':'#FBE9E7'};color:${isVeg?'#2E7D32':'var(--primary)'}">
            ${isVeg?'&#129382; Veg':'&#127831; Non-veg'}
          </span>
          ${inPlan ? `<span class="rc-plan-chip">${slotEm} In Plan</span>` : ''}
          ${isFav  ? '<span class="rc-fav-chip">&#10084;</span>' : ''}
        </div>
        <button class="fav-btn${isFav?' fav-active':''}" data-mid="${meal.id}"
          onclick="event.stopPropagation();toggleFavourite('${meal.id}',event)"
          title="${isFav?'Remove favourite':'Add favourite'}">${isFav?'&#10084;':'&#10040;'}</button>
      </div>
      <div class="rc-name">${meal.name}</div>
      <div class="rc-tamil">${getRecipeMTName(meal)}</div>
      <div class="rc-meta">
        <span>&#9201; ${meal.time}m</span>
        <span>${spiceDots(meal.spice)}</span>
        <span>&#8377;${meal.pricePerServing}</span>
      </div>
      <button class="rc-view-btn" style="margin-top:auto" onclick="event.stopPropagation();openRecipeModal('${meal.id}')">
        &#128214; Recipe &amp; Prep
      </button>`
    grid.appendChild(card)
  }

  mainMeals.forEach(makeCard)

  if (sideMeals.length > 0) {
    const sideHdr = document.createElement('div')
    sideHdr.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#FFF3E0;border:1.5px solid #FFCC80;border-radius:10px;margin:6px 0 2px'
    sideHdr.innerHTML = '<span style="font-size:16px">&#129361;</span>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:700;color:#E65100">Side Dishes (Served with Rice)</div>' +
      '<div style="font-size:10px;color:#8B5E52">Poriyal, Kootu &amp; Stir-fry combos</div></div>' +
      `<span style="font-size:10px;font-weight:700;background:#FFCC80;color:#E65100;padding:2px 8px;border-radius:20px">${sideMeals.length} recipes</span>`
    grid.appendChild(sideHdr)
    sideMeals.forEach(makeCard)
  }
}

// ─────────────────────────────────────────────
// STATS ROW
// ─────────────────────────────────────────────
function renderRecipeStats() {
  const all = allMeals()
  const favSet = new Set(state.favourites || [])
  const inPlanIds = {}
  ;(state.mealPlan || []).forEach(d => {
    ['breakfast','lunch','dinner'].forEach(s => { if (d[s]) inPlanIds[d[s].id] = true })
  })
  const row = document.getElementById('recipeStatsRow')
  if (!row) return
  row.innerHTML = [
    ['&#127869;&#65039;', all.length, 'Total Recipes'],
    ['&#10084;', favSet.size, 'Favourites'],
    ['&#128197;', Object.keys(inPlanIds).length, "In This Month's Plan"],
    ['&#9728;&#65039;', (FOOD_DB.breakfast||[]).length, 'Breakfast Recipes'],
    ['&#127807;', (FOOD_DB.lunch||[]).length, 'Lunch Recipes'],
    ['&#127769;', (FOOD_DB.dinner||[]).length, 'Dinner Recipes'],
  ].map(a => `<div class="rstat-card"><div class="rstat-icon">${a[0]}</div><div class="rstat-val">${a[1]}</div><div class="rstat-label">${a[2]}</div></div>`).join('')
}

// ─────────────────────────────────────────────
// FAV SUMMARY BAR
// ─────────────────────────────────────────────
function renderFavSummary() {
  const favs = state.favourites || []
  const bar  = document.getElementById('favSummaryBar')
  const txt  = document.getElementById('favSummaryText')
  if (!bar) return
  if (favs.length > 0) {
    bar.style.display = 'flex'
    const bk = (FOOD_DB.breakfast||[]).filter(m => favs.includes(m.id)).length
    const lu = (FOOD_DB.lunch||[]).filter(m    => favs.includes(m.id)).length
    const di = (FOOD_DB.dinner||[]).filter(m   => favs.includes(m.id)).length
    if (txt) txt.innerHTML = `&#10084; <strong>${favs.length} favourites selected</strong> &nbsp;|&nbsp; &#9728;&#65039; ${bk} breakfast &nbsp; &#127807; ${lu} lunch &nbsp; &#127769; ${di} dinner &nbsp;&mdash;&nbsp; These will be prioritised in your monthly plan`
  } else {
    bar.style.display = 'none'
  }
}

// ─────────────────────────────────────────────
// WINDOW HANDLERS
// ─────────────────────────────────────────────
window.toggleFavourite = async function(id, event) {
  if (event) event.stopPropagation()
  let favs = [...(state.favourites || [])]
  if (favs.includes(id)) favs = favs.filter(f => f !== id)
  else favs.push(id)
  setState('favourites', favs)
  await dbToggleFavourite(id)
  renderFavSummary()
  renderRecipeStats()
  _renderRecipes()
}

window.setRecipeCat = function(cat, btn) {
  setState('recipeCat', cat)
  document.querySelectorAll('#recipeCatBtns .flt-btn').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  _renderRecipes()
}

window.toggleFavOnly = function() {
  const next = !state.favOnly
  setState('favOnly',  next)
  if (next) setState('planOnly', false)
  document.getElementById('favOnlyBtn')?.classList.toggle('active', next)
  document.getElementById('planOnlyBtn')?.classList.toggle('active', false)
  _renderRecipes()
}

window.togglePlanOnly = function() {
  const next = !state.planOnly
  setState('planOnly', next)
  if (next) setState('favOnly', false)
  document.getElementById('planOnlyBtn')?.classList.toggle('active', next)
  document.getElementById('favOnlyBtn')?.classList.toggle('active', false)
  _renderRecipes()
}

window.applyFavouritesToPlan = function() {
  if (window.regeneratePlan) window.regeneratePlan()
  if (window.switchTab) window.switchTab('plan')
}

// ─────────────────────────────────────────────
// RECIPE MODAL
// ─────────────────────────────────────────────
window.openRecipeModal = function(id) {
  document.getElementById('recipeModalOverlay')?.remove()

  const meal = allMeals().find(m => m.id === id)
  if (!meal) return
  setState('activeRecipeId', id)

  const eff      = getEffectivePeople()
  const scaled   = scaleIng(meal.ingredients, meal.baseServing || 2, eff)
  const favs     = state.favourites || []
  const isFav    = favs.includes(id)
  const isVeg    = meal.type === 'veg'
  const catLabel = getCatLabel(id)
  const catEmoji = { breakfast:'&#9728;&#65039;', lunch:'&#127807;', dinner:'&#127769;' }[catLabel] || ''
  const inPlanIds = {}
  ;(state.mealPlan||[]).forEach(d => { ['breakfast','lunch','dinner'].forEach(s => { if (d[s]) inPlanIds[d[s].id] = s }) })
  const inPlan = !!inPlanIds[id]
  const spiceLabels = ['None','Mild','Medium','Hot','Very Hot']

  const detailsHTML =
    '<div class="rdp-detail-grid">' +
      `<div class="rdp-detail-item"><div class="rdi-label">Cook Time</div><div class="rdi-val">${meal.time} min</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Spice Level</div><div class="rdi-val">${spiceLabels[meal.spice]||'Medium'}</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Diet Type</div><div class="rdi-val">${isVeg?'Vegetarian':'Non-Vegetarian'}</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Category</div><div class="rdi-val">${catLabel.charAt(0).toUpperCase()+catLabel.slice(1)}</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Cost / Serve</div><div class="rdi-val">&#8377;${meal.pricePerServing}</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Total Cost</div><div class="rdi-val">&#8377;${Math.round(meal.pricePerServing*eff)}</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">Ingredients</div><div class="rdi-val">${(meal.ingredients||[]).length} items</div></div>` +
      `<div class="rdp-detail-item"><div class="rdi-label">In Plan</div><div class="rdi-val">${inPlan?'Yes &#8212; '+inPlanIds[id]:'No (rotation)'}</div></div>` +
    '</div>' +
    '<div style="margin-top:12px;padding:10px 14px;background:#FFF8E1;border-radius:8px;font-size:11px;color:#795548;line-height:1.6">' +
      '&#128161; Favourited meals always appear in your monthly plan. Others rotate as variety.' +
    '</div>'

  const tamil = getRecipeMTName(meal)
  const ov = document.createElement('div')
  ov.id = 'recipeModalOverlay'
  ov.className = 'recipe-modal-ov'
  ov.onclick = e => { if (e.target === ov) closeRecipeModal() }
  ov.innerHTML =
    '<div class="recipe-modal-box">' +
      '<div class="rmo-hdr">' +
        '<div style="flex:1">' +
          `<div class="rmo-title">${meal.name}</div>` +
          (tamil && tamil !== meal.name ? `<div class="rmo-tamil">${tamil}</div>` : '') +
          '<div class="rmo-chips">' +
            `<span class="rr-chip" style="background:${isVeg?'#E8F5E9':'#FBE9E7'};color:${isVeg?'#2E7D32':'var(--primary)'}">` +
              (isVeg?'&#127807; Veg':'&#127831; Non-veg') + '</span>' +
            `<span class="rr-chip" style="background:#FFF3CD;color:#E65100">&#9201; ${meal.time}min</span>` +
            `<span class="rr-chip" style="background:#E8F5E9;color:#1B5E20">&#8377;${Math.round(meal.pricePerServing*eff)}</span>` +
            `<span class="rr-chip" style="background:#FAFAFA;color:#888;border:1px solid #eee">${spiceDots(meal.spice)}</span>` +
            (inPlan ? `<span class="rr-chip" style="background:#E3F2FD;color:#1565C0">&#128197; In Plan &#8212; ${inPlanIds[id]}</span>` : '') +
          '</div>' +
        '</div>' +
        '<button class="rmo-close-btn" onclick="closeRecipeModal()">&#10005;</button>' +
      '</div>' +
      '<div class="rmo-tabs">' +
        '<button class="rmo-tab active" onclick="switchRmoTab(\'ingredients\',this)">&#129534; Ingredients</button>' +
        '<button class="rmo-tab" onclick="switchRmoTab(\'preparation\',this)">&#128104;&#8205;&#127859; Preparation</button>' +
        '<button class="rmo-tab" onclick="switchRmoTab(\'details\',this)">&#128202; Details</button>' +
      '</div>' +
      '<div class="rmo-pane" id="rmo-pane-ingredients">' +
        `<div style="font-size:11px;color:var(--muted);margin-bottom:10px">Scaled for ${getTotalPeople()} people (${eff} serving units)</div>` +
        '<div class="rdp-ing-grid">' +
          scaled.map(ing => `<div class="rdp-ing-row"><span>${ing.item}</span><span style="font-weight:700;color:var(--primary)">${ing.qty}${ing.unit?' '+ing.unit:''}</span></div>`).join('') +
        '</div>' +
      '</div>' +
      '<div class="rmo-pane" id="rmo-pane-preparation" style="display:none">' +
        '<ol class="rdp-steps">' +
          (meal.steps||[]).map((step,i) => `<li class="rdp-step-item"><span class="step-num">${i+1}</span><span>${step}</span></li>`).join('') +
        '</ol>' +
      '</div>' +
      '<div class="rmo-pane" id="rmo-pane-details" style="display:none">' + detailsHTML + '</div>' +
      '<div class="rmo-footer">' +
        `<button class="btn-primary" style="flex:1;padding:10px;justify-content:center" onclick="toggleFavouriteFromModal('${id}')">` +
          (isFav ? '&#9829; Remove Favourite' : '&#9825; Add to Favourites') +
        '</button>' +
        `<button class="btn-primary" style="flex:1;padding:10px;justify-content:center;background:var(--accent)" onclick="applyFavouritesToPlan();closeRecipeModal()">` +
          '&#10024; Apply to Plan' +
        '</button>' +
        '<button style="padding:10px 16px;background:#F5F5F5;color:#555;border:1px solid #ddd;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600" onclick="closeRecipeModal()">Close</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(ov)
}

window.closeRecipeModal = function() {
  document.getElementById('recipeModalOverlay')?.remove()
  setState('activeRecipeId', null)
}

window.switchRmoTab = function(tab, btn) {
  ;['ingredients','preparation','details'].forEach(t => {
    const p = document.getElementById('rmo-pane-' + t)
    if (p) p.style.display = t === tab ? 'block' : 'none'
  })
  document.querySelectorAll('.rmo-tab').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
}

window.toggleFavouriteFromModal = async function(id) {
  await window.toggleFavourite(id, null)
  const footer = document.querySelector('.rmo-footer .btn-primary')
  if (footer) {
    const isFav = (state.favourites || []).includes(id)
    footer.innerHTML = isFav ? '&#9829; Remove Favourite' : '&#9825; Add to Favourites'
  }
}

// ─────────────────────────────────────────────
// HTML TEMPLATE
// ─────────────────────────────────────────────
function getRecipesHTML() {
  return `<div>
    <div id="recipeStatsRow" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin-bottom:14px"></div>

    <div id="favSummaryBar" style="display:none;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(135deg,#FBE9E7,#FFCCBC);border:1.5px solid #FFAB91;border-radius:10px;margin-bottom:12px">
      <div id="favSummaryText" style="flex:1;font-size:12px;color:#C62828"></div>
      <button onclick="applyFavouritesToPlan()" style="background:linear-gradient(135deg,#C8604A,#E65100);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">&#10024; Apply to Plan</button>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
      <input id="recipeSearch" type="text" placeholder="&#128269; Search recipes..." oninput="_renderRecipes()" style="flex:1;min-width:140px;padding:10px 14px;border:1.5px solid #E8D5C4;border-radius:20px;font-size:13px;outline:none"/>
      <button id="favOnlyBtn" class="flt-btn" onclick="toggleFavOnly()">&#10084; Favourites</button>
      <button id="planOnlyBtn" class="flt-btn" onclick="togglePlanOnly()">&#128197; In Plan</button>
    </div>

    <div id="recipeCatBtns" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      <button class="flt-btn active" onclick="setRecipeCat('all',this)">&#127869;&#65039; All</button>
      <button class="flt-btn" onclick="setRecipeCat('breakfast',this)">&#9728;&#65039; Breakfast</button>
      <button class="flt-btn" onclick="setRecipeCat('lunch',this)">&#127807; Lunch</button>
      <button class="flt-btn" onclick="setRecipeCat('dinner',this)">&#127769; Dinner</button>
    </div>

    <div id="recipeGrid" class="recipe-grid"></div>
  </div>`
}

window._renderRecipes = _renderRecipes
