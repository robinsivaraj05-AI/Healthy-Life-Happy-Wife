// ═══════════════════════════════════════════════════════
// MODULE: Preferences Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { STATES_CONFIG } from '../data/config.js'
import { savePreferences, saveFamilyMember } from '../supabase/db.js'
import { DIET_DB } from '../data/diet-db.js'

let _prefFamilyAlloc = []

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderPrefs(el) {
  el.innerHTML = getPrefsHTML()
  populatePrefsForm()
  renderStateGrid()
  renderFamilyMenuAllocation()
  renderHouseholdCounters()
}

function populatePrefsForm() {
  // Diet mode button
  document.querySelectorAll('.diet-btn').forEach(b => b.classList.remove('active'))
  const activeBtn = document.getElementById('diet-' + (state.dietMode || 'mixed'))
  if (activeBtn) activeBtn.classList.add('active')

  // Spice slider
  const spiceSlider = document.getElementById('spiceSlider')
  if (spiceSlider) { spiceSlider.value = state.spiceLevel; updateSpice(state.spiceLevel) }
}

function renderHouseholdCounters() {
  const hv = {
    men: state.householdMen, women: state.householdWomen,
    agedParents: state.householdAged, children: state.householdChildren
  }
  Object.entries(hv).forEach(([key, val]) => {
    const el = document.getElementById('hh-val-' + key)
    if (el) el.textContent = val
  })
  updateHouseholdTotal()
}

// ─────────────────────────────────────────────
// DIET MODE
// ─────────────────────────────────────────────
window.setDietMode = function(mode) {
  setState('dietMode', mode)
  document.querySelectorAll('.diet-btn').forEach(b => b.classList.remove('active'))
  const btn = document.getElementById('diet-' + mode)
  if (btn) btn.classList.add('active')
}

// ─────────────────────────────────────────────
// SPICE LEVEL
// ─────────────────────────────────────────────
function updateSpice(v) {
  setState('spiceLevel', +v)
  const labels = ['None', 'Mild', 'Medium', 'Hot', 'Very Hot']
  const colors = ['#ccc', '#F9A825', '#E65100', '#E65100', '#B71C1C']
  const b = document.getElementById('spiceBadge')
  if (b) { b.textContent = 'Level ' + v + ' — ' + labels[v]; b.style.background = colors[v] + '22'; b.style.color = colors[v] }
}
window.updateSpice = updateSpice

// ─────────────────────────────────────────────
// HOUSEHOLD COUNTERS
// ─────────────────────────────────────────────
window.changeHousehold = function(type, delta) {
  const keyMap = { men: 'householdMen', women: 'householdWomen', agedParents: 'householdAged', children: 'householdChildren' }
  const key = keyMap[type]
  if (!key) return
  const newVal = Math.max(0, (state[key] || 0) + delta)
  setState(key, newVal)
  const el = document.getElementById('hh-val-' + type)
  if (el) el.textContent = newVal
  updateHouseholdTotal()
}

function updateHouseholdTotal() {
  const total = (state.householdMen || 0) + (state.householdWomen || 0) + (state.householdAged || 0) + (state.householdChildren || 0)
  const effective = (state.householdMen || 0) * 1 + (state.householdWomen || 0) * 0.85 + (state.householdAged || 0) * 0.7 + (state.householdChildren || 0) * 0.5
  const el = document.getElementById('hh-total')
  if (el) el.textContent = `Total: ${total} people • ${effective.toFixed(1)} effective serving units`
}

// ─────────────────────────────────────────────
// REGIONAL CUISINE
// ─────────────────────────────────────────────
function renderStateGrid() {
  ['stateGrid', 'stateGrid2'].forEach(id => {
    const el = document.getElementById(id)
    if (!el) return
    el.innerHTML = Object.entries(STATES_CONFIG).map(([code, cfg]) => {
      const isSelected = state.selectedState === code
      const cls = ['state-card', cfg.available ? '' : 'coming-soon', isSelected ? 'sc-active' : ''].filter(Boolean).join(' ')
      const badge = isSelected
        ? `<span class="sc-badge sc-badge-selected">Selected</span>`
        : cfg.available ? `<span class="sc-badge sc-badge-available">Available</span>`
        : `<span class="sc-badge sc-badge-soon">Coming Soon</span>`
      const count = cfg.available ? `<div class="sc-count">${cfg.count || ''}+ recipes</div>` : ''
      const click = cfg.available ? `onclick="selectState('${code}')"` : ''
      const langTag = cfg.lang ? `<div class="sc-lang">${cfg.lang.script} · ${cfg.lang.name}</div>` : ''
      return `<div class="${cls}" ${click}>
        <div class="sc-emoji">${cfg.emoji}</div>
        ${badge}
        <div class="sc-name">${cfg.name}</div>
        ${langTag}
        <div class="sc-sub">${cfg.cuisine || ''}</div>
        ${count}
      </div>`
    }).join('')
  })
}

window.selectState = function(code) {
  if (!STATES_CONFIG[code] || !STATES_CONFIG[code].available) return
  setState('selectedState', code)
  renderStateGrid()
  const cfg = STATES_CONFIG[code]
  showToast(cfg.lang ? cfg.lang.script + ' (' + cfg.name + ') selected' : 'Region set to ' + cfg.name)
}

// ─────────────────────────────────────────────
// FAMILY MENU ALLOCATION
// ─────────────────────────────────────────────
function renderFamilyMenuAllocation() {
  const members = (state.familyMembers || []).filter(m => (m.name || '').trim())
  _prefFamilyAlloc = members.map(m => ({ ...m }))

  document.querySelectorAll('[id="familyMenuAllocCard"]').forEach(card => {
    if (!members.length) {
      card.innerHTML = '<div style="text-align:center;padding:20px;color:#8B5E52;font-size:13px">No family members yet. Go to <strong>&#128100; Profile &#8594; Family Members</strong> to add your family first.</div>'
      return
    }
    const hdr = `<div style="display:grid;grid-template-columns:1.5fr 130px 1fr 90px;gap:10px;padding:6px 12px;margin-bottom:4px">
      <div style="font-size:11px;font-weight:700;color:#8B5E52;text-transform:uppercase">Member</div>
      <div style="font-size:11px;font-weight:700;color:#8B5E52;text-transform:uppercase">Menu Type</div>
      <div style="font-size:11px;font-weight:700;color:#8B5E52;text-transform:uppercase">&#128241; Mobile</div>
      <div style="font-size:11px;font-weight:700;color:#8B5E52;text-transform:uppercase">&#128242; WA</div>
    </div>`
    const rows = _prefFamilyAlloc.map((m, idx) => {
      const isNormal = !m.menu_type || m.menu_type === 'family'
      const waOn = m.whatsapp_enabled ? true : false
      return `<div style="display:grid;grid-template-columns:1.5fr 130px 1fr 90px;gap:10px;align-items:center;padding:10px 12px;background:${idx%2===0?'#FFF5EF':'#fff'};border-radius:8px;margin-bottom:3px">
        <div>
          <div style="font-size:13px;font-weight:700;color:#5a3e36">${m.name || '?'}</div>
          <div style="font-size:11px;color:#8B5E52">${m.relation || ''}${m.age ? ' · ' + m.age + ' yrs' : ''}</div>
        </div>
        <div style="display:flex;gap:4px">
          <button onclick="setPrefMenuType(${idx},'family')" style="padding:5px 9px;font-size:11px;font-weight:700;border-radius:6px;border:1.5px solid ${isNormal?'#2E7D32':'#E8D5C4'};cursor:pointer;background:${isNormal?'#2E7D32':'transparent'};color:${isNormal?'#fff':'#8B5E52'}">Normal</button>
          <button onclick="setPrefMenuType(${idx},'diet')" style="padding:5px 9px;font-size:11px;font-weight:700;border-radius:6px;border:1.5px solid ${isNormal?'#E8D5C4':'#1B5E20'};cursor:pointer;background:${isNormal?'transparent':'#1B5E20'};color:${isNormal?'#8B5E52':'#fff'}">&#129361; Diet</button>
        </div>
        <div style="font-size:12px;color:${m.whatsapp?'#5a3e36':'#ccc'}">${m.whatsapp || 'Not set'}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <div onclick="togglePrefWA(${idx})" style="width:40px;height:22px;border-radius:11px;background:${waOn?'#25D366':'#ccc'};cursor:pointer;position:relative;flex-shrink:0;transition:background .2s">
            <div style="position:absolute;top:1px;left:${waOn?'19':'1'}px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
          </div>
          ${waOn && m.whatsapp ? `<button onclick="sendWhatsAppDayMenu(${idx})" style="padding:4px 8px;background:#25D366;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">&#128242; Send</button>` : ''}
        </div>
      </div>`
    }).join('')

    card.innerHTML =
      `<div style="background:#E8F5E9;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:#2E7D32;line-height:1.5">
        &#128161; Set each person's menu type. <strong>Diet</strong> members get health meals; <strong>Normal</strong> get regular Tamil Nadu meals.
        Click <strong>Save Settings</strong> below to apply.
      </div>` + hdr + rows
  })
  window._prefFamilyAllocEdit = _prefFamilyAlloc
}

window.setPrefMenuType = function(idx, type) { _prefFamilyAlloc[idx].menu_type = type; renderFamilyMenuAllocation() }
window.togglePrefWA    = function(idx) { _prefFamilyAlloc[idx].whatsapp_enabled = !_prefFamilyAlloc[idx].whatsapp_enabled; renderFamilyMenuAllocation() }

window.sendWhatsAppDayMenu = function(idx) {
  const m = _prefFamilyAlloc[idx]
  if (!m || !m.whatsapp) { showToast('Please add a mobile number for ' + (m?.name || 'this member') + ' first.'); return }
  let phone = (m.whatsapp || '').replace(/[^0-9]/g, '')
  if (phone.length === 10) phone = '91' + phone
  const today = new Date()
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = dayNames[today.getDay()] + ', ' + today.getDate() + ' ' + monthNames[today.getMonth()] + ' ' + today.getFullYear()
  let menuLines = ''
  if (m.menu_type === 'diet') {
    const dayIdx = today.getDate() - 1
    const bf = DIET_DB.breakfast?.length ? DIET_DB.breakfast[dayIdx % DIET_DB.breakfast.length] : null
    const sn = DIET_DB.snacks?.length   ? DIET_DB.snacks[dayIdx % DIET_DB.snacks.length]         : null
    const lu = DIET_DB.lunch?.length    ? DIET_DB.lunch[dayIdx % DIET_DB.lunch.length]            : null
    const di = DIET_DB.dinner?.length   ? DIET_DB.dinner[dayIdx % DIET_DB.dinner.length]          : null
    menuLines = '🥗 *Diet Menu*\n' +
      (bf ? '☀️ Breakfast: ' + bf.name + '\n' : '') +
      (sn ? '🍵 Mid-Morning: ' + sn.name + '\n' : '') +
      (lu ? '🌞 Lunch: ' + lu.name + '\n' : '') +
      (di ? '🌙 Dinner: ' + di.name : '')
  } else {
    const todayPlan = (state.mealPlan || []).find(d => d.day === today.getDate())
    menuLines = '🍛 *Regular Menu*\n' +
      (todayPlan?.breakfast ? '☀️ Breakfast: ' + todayPlan.breakfast.name + '\n' : '') +
      (todayPlan?.lunch     ? '🌞 Lunch: ' + todayPlan.lunch.name + '\n'         : '') +
      (todayPlan?.dinner    ? '🌙 Dinner: ' + todayPlan.dinner.name                : '')
  }
  const msg = '🌿 *Jeevamithran Daily Menu*\n👤 ' + m.name + '\n📅 ' + dateStr + '\n\n' + menuLines + '\n\n💚 Stay healthy!\n— Jeevamithran App'
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank')
}

// ─────────────────────────────────────────────
// SAVE PREFERENCES
// ─────────────────────────────────────────────
window.savePreferenceSettings = async function() {
  await savePreferences({
    diet_mode: state.dietMode,
    spice_level: state.spiceLevel,
    selected_state: state.selectedState,
    household_men: state.householdMen,
    household_women: state.householdWomen,
    household_aged: state.householdAged,
    household_children: state.householdChildren,
    price_mode: state.priceMode
  })

  // Save family member menu type changes back
  for (const m of _prefFamilyAlloc) {
    if (m.id) await saveFamilyMember(m)
  }
  setState('familyMembers', _prefFamilyAlloc)
  showToast('&#10003; Preferences saved!')
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
function getPrefsHTML() {
  return `
  <div>
    <!-- 1. DIET PREFERENCE + SPICE LEVEL -->
    <div class="prefs-grid">
      <div class="pref-card">
        <div class="pref-title">&#129367; Diet Preference</div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px">Choose the meal type for your household.</p>
        <div class="diet-grid">
          <button class="diet-btn" id="diet-veg" onclick="setDietMode('veg')">
            <span class="diet-icon">&#129382;</span><span class="diet-label">Vegetarian</span><span class="diet-sub">Only veg dishes</span>
          </button>
          <button class="diet-btn" id="diet-nonveg" onclick="setDietMode('nonveg')">
            <span class="diet-icon">&#127831;</span><span class="diet-label">Non-Vegetarian</span><span class="diet-sub">Only non-veg dishes</span>
          </button>
          <button class="diet-btn" id="diet-diet" onclick="setDietMode('diet')">
            <span class="diet-icon">&#129361;</span><span class="diet-label">Diet / Health</span><span class="diet-sub">Low spice, veg only</span>
          </button>
          <button class="diet-btn active" id="diet-mixed" onclick="setDietMode('mixed')">
            <span class="diet-icon">&#127857;</span><span class="diet-label">Mixed</span><span class="diet-sub">All types included</span>
          </button>
        </div>
      </div>
      <div class="pref-card">
        <div class="pref-title">&#127798; Spice Level</div>
        <input type="range" class="spice-slider" id="spiceSlider" min="0" max="4" value="${state.spiceLevel}" oninput="updateSpice(this.value)"/>
        <div class="spice-labels"><span>Mild</span><span>Medium</span><span>Hot</span><span>Very Hot</span><span>Extreme</span></div>
        <div id="spiceBadge" class="spice-badge" style="background:rgba(230,81,0,.12);color:#E65100">Level ${state.spiceLevel}</div>
      </div>
    </div>

    <!-- SAVE BUTTON -->
    <div style="margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button class="btn-primary" onclick="savePreferenceSettings()" style="background:linear-gradient(135deg,#2E7D32,#43A047);padding:12px 28px;font-size:14px">
        &#10003; Save Settings
      </button>
      <p style="font-size:12px;color:var(--muted)">Your diet, spice, household &amp; family menu allocation settings will be saved.</p>
    </div>

    <!-- 2. FAMILY MENU ALLOCATION -->
    <div class="pref-card pref-wide" style="margin-bottom:16px">
      <div class="pref-title">&#128106; Family Menu Allocation</div>
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px">Set each family member's menu type and enable WhatsApp daily menu. Names come from <strong>Profile &#8594; Family Members</strong>.</p>
      <div id="familyMenuAllocCard">
        <div style="text-align:center;padding:20px;color:#8B5E52;font-size:13px">Loading family members...</div>
      </div>
    </div>

    <!-- 3. REGIONAL CUISINE + HOUSEHOLD MEMBERS -->
    <div class="prefs-grid">
      <div class="pref-card pref-wide">
        <div class="pref-title">&#128506;&#65039; Regional Cuisine</div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px">Select your regional cuisine. Tamil Nadu is fully available — more states coming soon!</p>
        <div id="stateGrid" class="state-grid"></div>
      </div>
      <div class="pref-card pref-wide">
        <div class="pref-title">&#127968; Household Members</div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px">Set the number of each member type. Ingredients scale automatically per serving size.</p>
        <div class="hh-grid">
          <div class="hh-row">
            <div class="hh-icon">&#128104;</div>
            <div class="hh-info"><div class="hh-label">Men</div><div class="hh-sub">Full serving (1.0x)</div></div>
            <div class="hh-counter">
              <button class="counter-btn" onclick="changeHousehold('men',-1)">&#8722;</button>
              <span class="counter-val" id="hh-val-men">${state.householdMen}</span>
              <button class="counter-btn" onclick="changeHousehold('men',1)">+</button>
            </div>
          </div>
          <div class="hh-row">
            <div class="hh-icon">&#128105;</div>
            <div class="hh-info"><div class="hh-label">Women</div><div class="hh-sub">Standard serving (0.85x)</div></div>
            <div class="hh-counter">
              <button class="counter-btn" onclick="changeHousehold('women',-1)">&#8722;</button>
              <span class="counter-val" id="hh-val-women">${state.householdWomen}</span>
              <button class="counter-btn" onclick="changeHousehold('women',1)">+</button>
            </div>
          </div>
          <div class="hh-row">
            <div class="hh-icon">&#128116;</div>
            <div class="hh-info"><div class="hh-label">Aged Parents</div><div class="hh-sub">Lighter serving (0.7x)</div></div>
            <div class="hh-counter">
              <button class="counter-btn" onclick="changeHousehold('agedParents',-1)">&#8722;</button>
              <span class="counter-val" id="hh-val-agedParents">${state.householdAged}</span>
              <button class="counter-btn" onclick="changeHousehold('agedParents',1)">+</button>
            </div>
          </div>
          <div class="hh-row">
            <div class="hh-icon">&#128103;</div>
            <div class="hh-info"><div class="hh-label">Children</div><div class="hh-sub">Half serving (0.5x)</div></div>
            <div class="hh-counter">
              <button class="counter-btn" onclick="changeHousehold('children',-1)">&#8722;</button>
              <span class="counter-val" id="hh-val-children">${state.householdChildren}</span>
              <button class="counter-btn" onclick="changeHousehold('children',1)">+</button>
            </div>
          </div>
        </div>
        <div id="hh-total" style="margin-top:14px;padding:10px 14px;background:var(--bg);border-radius:8px;font-size:13px;font-weight:600;color:var(--primary)">
          Total: ${(state.householdMen||0)+(state.householdWomen||0)+(state.householdAged||0)+(state.householdChildren||0)} people
        </div>
      </div>
    </div>
  </div>`
}
