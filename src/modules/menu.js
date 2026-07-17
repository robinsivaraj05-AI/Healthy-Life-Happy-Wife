// ═══════════════════════════════════════════════════════
// MODULE: Daily Menu Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { FOOD_DB } from '../data/food-db.js'
import { DIET_DB } from '../data/diet-db.js'
import { DOLU_PLANS } from '../data/dolu-plans.js'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate() }
function getTotalPeople() { return (state.householdMen||0)+(state.householdWomen||0)+(state.householdAged||0)+(state.householdChildren||0) }
function getEffectivePeople() {
  const s = (state.householdMen||0)*1 + (state.householdWomen||0)*0.85 + (state.householdAged||0)*0.7 + (state.householdChildren||0)*0.5
  return Math.max(1, Math.round(s*10)/10)
}
function getRecipeMTName(meal) { return meal.tamil || '' }

function shuffleWithSeed(arr, seed) {
  const a = arr.slice(), n = a.length
  let s = seed || 0
  for (let i = n-1; i > 0; i--) {
    s = (s*9301 + 49297) % 233280
    const j = Math.floor((s/233280) * (i+1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function filterDietMeals(slot, member) {
  const pool = DIET_DB[slot] || []
  return pool.filter(m => {
    if (member.dietType === 'veg' && m.type !== 'veg') return false
    return true
  })
}

function generateMonthlyDietSchedule(member) {
  const seed = member.scheduleVariant || member.schedule_variant || 0
  const days = []
  for (let d = 0; d < 30; d++) {
    const day = {}
    ;['breakfast','lunch','dinner','snacks'].forEach(slot => {
      const meals = filterDietMeals(slot, member)
      if (!meals.length) { day[slot] = null; return }
      const shuffled = shuffleWithSeed(meals, seed + slot.length)
      day[slot] = shuffled[d % shuffled.length]
    })
    const cost = ['breakfast','lunch','dinner','snacks'].reduce((s, slot) => s + (day[slot]?.price || 0), 0)
    day.dayCost = cost
    days.push(day)
  }
  return days
}

function getMenuDateStr(day) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const shortMon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const d  = new Date(state.selectedYear, state.selectedMonth, day)
  const wd = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
  return {
    long:    ('0'+day).slice(-2)+'/'+('0'+(state.selectedMonth+1)).slice(-2)+'/'+state.selectedYear,
    short:   wd+', '+day+' '+shortMon[state.selectedMonth]+' '+state.selectedYear,
    weekday: wd
  }
}

function getSlotSides(meal, slot) {
  const sides = {
    breakfast: ['Coconut chutney','Hot sambar'],
    lunch:     ['Rice','Rasam','Papad','Pickle'],
    dinner:    ['Coconut chutney','Pickle']
  }
  const base = sides[slot] || []
  const mainLower = (meal.name || '').toLowerCase()
  return base.filter(s => !mainLower.includes(s.toLowerCase())).slice(0, 3)
}

// ─────────────────────────────────────────────
// RENDER ENTRY
// ─────────────────────────────────────────────
export function renderMenu(el) {
  if (el) el.innerHTML = getMenuHTML()
  // Default to today's day if in current month
  const today = new Date()
  if (today.getMonth() === state.selectedMonth && today.getFullYear() === state.selectedYear) {
    setState('menuDay', today.getDate())
  } else if (!state.menuDay) {
    setState('menuDay', 1)
  }
  renderDailyMenu()
}

// ─────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────
function renderDailyMenu() {
  const days    = getDaysInMonth(state.selectedMonth, state.selectedYear)
  const day     = state.menuDay || 1
  const dayData = (state.mealPlan || [])[day-1]

  const dateInfo = getMenuDateStr(day)
  const shortMons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const today = new Date()
  const isToday    = today.getDate()===day && today.getMonth()===state.selectedMonth && today.getFullYear()===state.selectedYear
  const isTomorrow = today.getDate()+1===day && today.getMonth()===state.selectedMonth && today.getFullYear()===state.selectedYear
  const headerLabel = isToday ? "TODAY'S MENU" : isTomorrow ? "TOMORROW'S MENU" : dateInfo.weekday.toUpperCase()+"'S MENU"

  document.querySelectorAll('#dm-day-label').forEach(e => e.textContent = 'Day '+day+' of '+days)
  document.querySelectorAll('#dm-day-date').forEach(e => e.textContent = dateInfo.short)
  document.querySelectorAll('#dm-card-label').forEach(e => e.textContent = headerLabel)
  document.querySelectorAll('#dm-card-date').forEach(e => e.textContent = dateInfo.weekday+', '+day)
  document.querySelectorAll('#dm-day-number').forEach(e => e.textContent = shortMons[state.selectedMonth]+' '+state.selectedYear)

  const familyCost = renderFamilyMealCol(day, dayData)
  renderDietMemberCol(day)
  renderDoluBuddyCol(day)

  const fc = document.getElementById('dm-footer-cost')
  if (fc) fc.innerHTML = '&#127869;&#65039; Day '+day+' &nbsp;&middot;&nbsp; Family Meal: &#8377;'+familyCost+' for '+getTotalPeople()+' people'

  renderDmDots(days, day)
  renderDmWeekList(days)
}

// ─────────────────────────────────────────────
// FAMILY MEAL COLUMN
// ─────────────────────────────────────────────
function renderFamilyMealCol(day, dayData) {
  const el = document.getElementById('dm-col-family-body')
  if (!el) return 0
  if (!dayData) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:12px">No meal plan for this day.<br>Generate a plan in the Meal Menu tab.</div>'
    return 0
  }
  const eff = getEffectivePeople()
  let totalCost = 0
  const SLOTS = [
    { key:'breakfast', icon:'&#9728;&#65039;', label:'BREAKFAST', time:'7–9 AM' },
    { key:'lunch',     icon:'&#127807;',       label:'LUNCH',     time:'12–2 PM' },
    { key:'dinner',    icon:'&#127769;',       label:'DINNER',    time:'7–9 PM' }
  ]
  let html = ''
  SLOTS.forEach(s => {
    const meal = dayData[s.key]
    if (!meal) {
      html += `<div class="dm-slot"><div class="dm-slot-lbl">${s.icon} ${s.label} &middot; ${s.time}</div><div style="color:#ccc;font-size:11px;font-style:italic">Not planned</div></div>`
      return
    }
    const isVeg = meal.type === 'veg'
    const cost  = Math.round(meal.pricePerServing * eff)
    totalCost  += cost
    const sides = getSlotSides(meal, s.key)
    const tamil = getRecipeMTName(meal)
    html += `<div class="dm-slot">
      <div class="dm-slot-lbl">${s.icon} ${s.label} &middot; ${s.time}</div>
      <div class="dm-slot-name" onclick="openRecipeModal('${meal.id}')">${meal.name}</div>
      ${tamil && tamil !== meal.name ? `<div class="dm-slot-tamil">${tamil}</div>` : ''}
      ${sides.length ? `<div class="dm-slot-sides">with ${sides.join(' &middot; ')}</div>` : ''}
      <div class="dm-slot-chips">
        <span class="dm-slot-chip dm-chip-t">&#9201; ${meal.time}m</span>
        <span class="dm-slot-chip dm-chip-c">&#8377;${cost}</span>
        <span class="dm-slot-chip ${isVeg?'dm-chip-v':'dm-chip-nv'}">${isVeg?'&#127807; Veg':'&#127831; Non-veg'}</span>
        <button class="dm-slot-chip dm-chip-rx" onclick="openRecipeModal('${meal.id}')">&#127859; Recipe</button>
      </div>
    </div>`
  })
  el.innerHTML = html
  const ft = document.getElementById('dm-col-family-ft')
  if (ft) ft.innerHTML = '&#128176; Day Total: &#8377;'+totalCost+' &middot; '+getTotalPeople()+' people'
  return totalCost
}

// ─────────────────────────────────────────────
// DIET MEMBER COLUMN
// ─────────────────────────────────────────────
function renderDietMemberCol(day) {
  const el    = document.getElementById('dm-col-diet-body')
  const subEl = document.getElementById('dm-col-diet-sub')
  if (!el) return
  const members = state.dietMembers || []
  if (!members.length) {
    if (subEl) subEl.textContent = ''
    el.innerHTML = '<div class="dm-col-empty">' +
      '<div class="dm-col-empty-icon">&#129367;</div>' +
      '<div class="dm-col-empty-text">No diet members added.<br>Go to <b>Diet &#8594; Body Matrix</b></div>' +
      '<button class="dm-col-empty-cta" onclick="switchTab(\'diet\')">Add Now &#8594;</button>' +
    '</div>'
    return
  }
  if (subEl) subEl.textContent = members.length+' member'+(members.length>1?'s':'')
  let html = ''
  members.forEach(m => {
    const schedule = generateMonthlyDietSchedule(m)
    const src = schedule[day-1]
    html += `<div class="dm-member-sep">&#128100; ${m.name} &middot; ${m.cat || m.goal || ''}</div>`
    if (!src) { html += '<div class="dm-slot"><div style="color:#aaa;font-size:11px">No schedule for today</div></div>'; return }
    const SLOTS = [
      { key:'breakfast', icon:'&#9728;&#65039;', label:'BREAKFAST' },
      { key:'lunch',     icon:'&#127807;',       label:'LUNCH' },
      { key:'dinner',    icon:'&#127769;',       label:'DINNER' },
      { key:'snacks',    icon:'&#129372;',       label:'SNACK' }
    ]
    SLOTS.forEach(s => {
      const meal = src[s.key]
      if (!meal) return
      html += `<div class="dm-slot">
        <div class="dm-slot-lbl">${s.icon} ${s.label}</div>
        <div class="dm-slot-name">${meal.name}</div>
        <div class="dm-slot-chips">
          <span class="dm-slot-chip dm-chip-c">&#8377;${meal.price||0}</span>
          <span class="dm-slot-chip ${meal.type==='veg'?'dm-chip-v':'dm-chip-nv'}">${meal.type==='veg'?'&#127807;':'&#127831;'}</span>
        </div>
      </div>`
    })
  })
  el.innerHTML = html
}

// ─────────────────────────────────────────────
// DOLU BUDDY COLUMN
// ─────────────────────────────────────────────
function renderDoluBuddyCol(day) {
  const el    = document.getElementById('dm-col-dolu-body')
  const subEl = document.getElementById('dm-col-dolu-sub')
  if (!el) return
  const followed = state.followedPlans || []
  if (!followed.length) {
    if (subEl) subEl.textContent = ''
    el.innerHTML = '<div class="dm-col-empty">' +
      '<div class="dm-col-empty-icon">&#11088;</div>' +
      '<div class="dm-col-empty-text">No plan followed yet.<br>Go to <b>Diet &#8594; Signature Plans</b></div>' +
      '<button class="dm-col-empty-cta" onclick="switchTab(\'diet\')">Follow a Plan &#8594;</button>' +
    '</div>'
    return
  }
  if (subEl) subEl.textContent = followed.length+' plan'+(followed.length>1?'s':'')+' active'
  let html = ''
  followed.forEach(fp => {
    const plan = DOLU_PLANS.find(p => p.id === (fp.plan_id || fp.planId))
    if (!plan) return
    const shuffled = shuffleWithSeed(plan.days, fp.variant || 0)
    const src = shuffled[(day-1) % shuffled.length]
    html += `<div class="dm-member-sep" style="background:${plan.bg};color:${plan.color};border-bottom:1px solid ${plan.color}33">&#11088; ${plan.title}</div>`
    const SLOTS = [
      { key:'b', icon:'&#9728;&#65039;', label:'BREAKFAST' },
      { key:'l', icon:'&#127807;',       label:'LUNCH' },
      { key:'d', icon:'&#127769;',       label:'DINNER' },
      { key:'s', icon:'&#129372;',       label:'SNACK' }
    ]
    SLOTS.forEach(s => {
      if (!src[s.key]) return
      html += `<div class="dm-slot" style="border-bottom-color:${plan.color}22">
        <div class="dm-slot-lbl" style="color:${plan.color}">${s.icon} ${s.label}</div>
        <div class="dm-slot-name">${src[s.key]}</div>
        <div class="dm-slot-chips">
          <span class="dm-slot-chip" style="background:${plan.bg};color:${plan.color}">&#8377;${Math.round(plan.avgDayCost/4)}</span>
        </div>
      </div>`
    })
  })
  el.innerHTML = html
}

// ─────────────────────────────────────────────
// DAY DOTS
// ─────────────────────────────────────────────
function renderDmDots(days, activeDay) {
  const dotsEl = document.getElementById('dmDots')
  if (!dotsEl) return
  const today = new Date()
  dotsEl.innerHTML = ''
  for (let d = 1; d <= days; d++) {
    const dt = new Date(state.selectedYear, state.selectedMonth, d)
    const isToday = today.getDate()===d && today.getMonth()===state.selectedMonth && today.getFullYear()===state.selectedYear
    const dot = document.createElement('button')
    dot.className = 'dm-dot'+(d===activeDay?' active':'')+(isToday&&d!==activeDay?' today':'')
    dot.textContent = d
    dot.setAttribute('data-day', d)
    dot.onclick = function() { jumpToDay(+this.getAttribute('data-day')) }
    dot.title = 'Day '+d+' — '+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()]
    dotsEl.appendChild(dot)
  }
  const active = dotsEl.querySelector('.active')
  if (active) active.scrollIntoView({ block:'nearest', inline:'center' })
}

// ─────────────────────────────────────────────
// MONTH LIST PANEL
// ─────────────────────────────────────────────
function renderDmWeekList(days) {
  const list = document.getElementById('dmWeekList')
  if (!list) return
  const shortMon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const wds = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  list.innerHTML = ''
  for (let d = 1; d <= days; d++) {
    const dayData = (state.mealPlan || [])[d-1]
    if (!dayData) continue
    const dt = new Date(state.selectedYear, state.selectedMonth, d)
    const row = document.createElement('div')
    const isActive = d === state.menuDay
    row.className = 'dm-week-row'+(isActive?' wk-active':'')
    row.setAttribute('data-day', d)
    row.onclick = function() { jumpToDay(+this.getAttribute('data-day')) }
    const bk = dayData.breakfast?.name || '—'
    const lu = dayData.lunch?.name     || '—'
    const di = dayData.dinner?.name    || '—'
    row.innerHTML =
      '<div><div class="dm-week-day-num">'+d+'</div><div class="dm-week-day-name">'+wds[dt.getDay()]+'</div></div>'+
      '<div class="dm-week-meals">'+
        '<b>&#9728;&#65039;</b> '+bk+'<br>'+
        '<b>&#127807;</b> '+lu+'<br>'+
        '<b>&#127769;</b> '+di+
      '</div>'
    list.appendChild(row)
  }
  const activeRow = list.querySelector('.wk-active')
  if (activeRow) setTimeout(() => activeRow.scrollIntoView({ block:'nearest' }), 100)
}

// ─────────────────────────────────────────────
// SHARE / PRINT
// ─────────────────────────────────────────────
function buildMenuShareText(day) {
  const dayData = (state.mealPlan || [])[day-1]
  if (!dayData) return ''
  const dateInfo = getMenuDateStr(day)
  const eff = getEffectivePeople()
  let totalCost = 0
  if (dayData.breakfast) totalCost += dayData.breakfast.pricePerServing * eff
  if (dayData.lunch)     totalCost += dayData.lunch.pricePerServing     * eff
  if (dayData.dinner)    totalCost += dayData.dinner.pricePerServing    * eff
  const lines = [
    '🍽️ Jeevamithran | '+dateInfo.short,
    '',
    '━━ FAMILY MEAL PLAN ━━',
    '☀️ Breakfast: '+(dayData.breakfast?.name||'—'),
    '🌿 Lunch:     '+(dayData.lunch?.name||'—'),
    '🌙 Dinner:    '+(dayData.dinner?.name||'—'),
    '💰 Day Cost:  ₹'+Math.round(totalCost)+' for '+getTotalPeople()+' people',
    ''
  ]
  const followed = state.followedPlans || []
  const members  = state.dietMembers   || []
  if (followed.length || members.length) {
    lines.push('━━ DIET MENU ━━')
    followed.forEach(fp => {
      const plan = DOLU_PLANS.find(p => p.id === (fp.plan_id || fp.planId))
      if (!plan) return
      const src = shuffleWithSeed(plan.days, fp.variant||0)[(day-1) % plan.days.length]
      lines.push('🌟 '+plan.title)
      if (src.b) lines.push('  ☀️ '+src.b)
      if (src.l) lines.push('  🌿 '+src.l)
      if (src.d) lines.push('  🌙 '+src.d)
      if (src.s) lines.push('  🥜 '+src.s)
    })
    members.forEach(m => {
      const schedule = generateMonthlyDietSchedule(m)
      const src = schedule[day-1]; if (!src) return
      lines.push('👤 '+m.name+' Diet')
      if (src.breakfast) lines.push('  ☀️ '+src.breakfast.name)
      if (src.lunch)     lines.push('  🌿 '+src.lunch.name)
      if (src.dinner)    lines.push('  🌙 '+src.dinner.name)
    })
    lines.push('')
  }
  lines.push('Made with ❤️ by Jeevamithran')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// WINDOW HANDLERS
// ─────────────────────────────────────────────
window.shiftMenuDay = function(delta) {
  const days = getDaysInMonth(state.selectedMonth, state.selectedYear)
  setState('menuDay', Math.max(1, Math.min(days, (state.menuDay||1) + delta)))
  renderDailyMenu()
}

function jumpToDay(day) {
  setState('menuDay', day)
  renderDailyMenu()
}
window.jumpToDay = jumpToDay

window.shareMenuWhatsApp = function() {
  const text = buildMenuShareText(state.menuDay || 1)
  window.open('https://wa.me/?text='+encodeURIComponent(text), '_blank')
}

window.copyMenuText = function() {
  const text = buildMenuShareText(state.menuDay || 1)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('&#128203; Menu copied! Paste on Instagram or WhatsApp.'))
  } else {
    const ta = document.createElement('textarea')
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta); ta.select()
    document.execCommand('copy'); document.body.removeChild(ta)
    showToast('&#128203; Menu copied! Paste on Instagram or WhatsApp.')
  }
}

window.printMenuCard = function() { window.print() }

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
function getMenuHTML() {
  return `<div>
    <!-- Day Navigator -->
    <div class="dm-nav">
      <button class="dm-nav-btn" onclick="shiftMenuDay(-1)">&#9664;</button>
      <div class="dm-nav-center">
        <div class="dm-nav-label" id="dm-day-label">Today</div>
        <div class="dm-nav-date" id="dm-day-date"></div>
      </div>
      <button class="dm-nav-btn" onclick="shiftMenuDay(1)">&#9654;</button>
    </div>

    <!-- Day dots -->
    <div class="dm-dots-wrap"><div class="dm-dots" id="dmDots"></div></div>

    <!-- Main layout: card + month panel -->
    <div class="dm-card-wrap">
      <div class="dm-card" id="dmCard">

        <!-- Card header -->
        <div class="dm-header">
          <div class="dm-brand">
            <div class="dm-brand-icon">&#127859;</div>
            <div>
              <div class="dm-brand-name">Jeevamithran</div>
              <div class="dm-brand-sub">Daily Meal Dashboard</div>
              <div class="dm-brand-tag">Made with &#10084; served with happiness</div>
            </div>
          </div>
          <div class="dm-tomorrow-box">
            <div class="dm-tomorrow-label" id="dm-card-label">TODAY'S MENU</div>
            <div class="dm-tomorrow-date" id="dm-card-date"></div>
            <div class="dm-day-big" id="dm-day-number"></div>
          </div>
        </div>

        <!-- 3-COLUMN MEAL GRID -->
        <div class="dm-3col">
          <div class="dm-col dm-col-orange">
            <div class="dm-col-hd">
              <span class="dm-col-hd-icon">&#127869;&#65039;</span>
              <div class="dm-col-hd-title">Family Meal Plan</div>
              <div class="dm-col-hd-sub">Planned for the whole family</div>
            </div>
            <div class="dm-col-body" id="dm-col-family-body"></div>
            <div class="dm-col-ft" id="dm-col-family-ft"></div>
          </div>
          <div class="dm-col dm-col-green">
            <div class="dm-col-hd">
              <span class="dm-col-hd-icon">&#129367;</span>
              <div class="dm-col-hd-title">Diet Menu</div>
              <div class="dm-col-hd-sub">Personalised nutrition plan</div>
              <div class="dm-col-hd-plan" id="dm-col-diet-sub"></div>
            </div>
            <div class="dm-col-body" id="dm-col-diet-body"></div>
          </div>
          <div class="dm-col dm-col-purple">
            <div class="dm-col-hd">
              <span class="dm-col-hd-icon">&#11088;</span>
              <div class="dm-col-hd-title">Dolu Buddy Plan</div>
              <div class="dm-col-hd-sub">Signature wellness menu</div>
              <div class="dm-col-hd-plan" id="dm-col-dolu-sub"></div>
            </div>
            <div class="dm-col-body" id="dm-col-dolu-body"></div>
          </div>
        </div>

        <!-- Card footer -->
        <div class="dm-footer">
          <span id="dm-footer-cost"></span>
          <div class="dm-footer-btns">
            <button class="dm-wa-btn" onclick="shareMenuWhatsApp()">&#128232; WhatsApp</button>
            <button class="dm-print-btn" onclick="copyMenuText()">&#128203; Copy Text</button>
            <button class="dm-print-btn" onclick="printMenuCard()">&#128438; Print</button>
          </div>
        </div>

      </div>

      <!-- Month at a Glance panel -->
      <div class="dm-week-panel">
        <div class="dm-week-title">&#128197; This Month at a Glance</div>
        <div id="dmWeekList" class="dm-week-list"></div>
      </div>
    </div>
  </div>`
}

export { shuffleWithSeed, generateMonthlyDietSchedule, filterDietMeals }
