// ═══════════════════════════════════════════════════════
// MODULE: Diet Menu Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { DIET_DB } from '../data/diet-db.js'
import { DOLU_PLANS } from '../data/dolu-plans.js'
import {
  saveDietMember as dbSaveDietMember,
  deleteDietMember as dbDeleteDietMember,
  addFollowedPlan as dbAddFollowedPlan,
  removeFollowedPlan as dbRemoveFollowedPlan,
  regenerateFollowedPlan as dbRegenerateFollowedPlan,
  logWeight as dbLogWeight,
  createQuotation as dbCreateQuotation,
} from '../supabase/db.js'
import { shuffleWithSeed, generateMonthlyDietSchedule, filterDietMeals } from './menu.js'

// ─────────────────────────────────────────────
// MODULE STATE
// ─────────────────────────────────────────────
let _dietCurrentBmi  = null
let _dietCurrentType = 'all'
let _dietCurrentSlot = 'breakfast'

// ─────────────────────────────────────────────
// QUOTES
// ─────────────────────────────────────────────
const DIET_QUOTES = [
  'Your body hears everything your mind says. Stay positive! &#127775;',
  'Every healthy meal is one step closer to a better you. &#128154;',
  'Small daily improvements lead to stunning results. Trust the process! &#127793;',
  'Your health is an investment, not an expense. &#128176;',
  'Eat to fuel your body, not to fill your emotions. &#129367;',
  'A healthy outside starts from the inside. &#127807;',
  "Take care of your body — it's the only home you'll ever live in. &#127969;",
  'The food you eat can be the safest medicine or the slowest poison. Choose wisely! &#127822;',
  'Discipline is choosing between what you want NOW and what you want MOST. &#9878;&#65039;',
  'Consistency beats perfection. Just keep showing up! &#128170;',
  'Your future self will thank you for the choices you make today. &#128591;',
  'பல்வகை கீரைகள் உண்டால் பல நோய்கள் விலகும் — Tamil Wisdom &#127807;',
  'Murungai keerai daily keeps the doctor away! 100&#215; more nutrients than most vegetables. &#127793;',
  'Water is the medicine of all medicines. Drink 8–10 glasses today! &#128167;',
  'Sleep 7–8 hours — your body does most of its repair work while you sleep! &#128564;',
  'Walking 10,000 steps a day burns ~400 kcal. Simple and powerful! &#128694;',
  'Millets were the original superfood of India. Time to bring them back! &#127806;',
  'Eating slowly reduces calorie intake by 20%. Chew 20 times per bite! &#128528;'
]
function getDietQuote() { return DIET_QUOTES[Math.floor(Math.random() * DIET_QUOTES.length)] }

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function calcMemberMonthlyCost(member) {
  let total = 0
  ;['breakfast','lunch','dinner','snacks'].forEach(slot => {
    const meals = filterDietMeals(slot, member)
    if (!meals.length) return
    for (let d = 0; d < 30; d++) total += meals[d % meals.length].price
  })
  return total
}

function calcWeightProgress(member) {
  const startDate     = member.startDate || member.start_date ? new Date(member.startDate || member.start_date) : new Date()
  const today         = new Date()
  const daysOn        = Math.max(0, Math.round((today - startDate) / 86400000))
  const startWeight   = member.startWeight || member.start_weight || member.weight
  const currentWeight = member.currentWeight || member.current_weight || startWeight
  const targetWeight  = member.targetWeight || member.target_weight || null
  const result = { daysOn, startWeight, currentWeight, targetWeight }
  result.startDateStr = startDate.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  if (targetWeight) {
    const totalToChange = Math.abs(startWeight - targetWeight)
    const changed       = parseFloat(Math.abs(startWeight - currentWeight).toFixed(1))
    const remaining     = parseFloat(Math.abs(currentWeight - targetWeight).toFixed(1))
    result.changed = changed; result.remaining = remaining
    result.pct = totalToChange > 0 ? Math.min(100, Math.round(changed / totalToChange * 100)) : 0
    if (daysOn > 7 && changed > 0.3) {
      result.estWeeks = Math.round(remaining / (changed/daysOn) / 7)
    } else {
      result.estWeeks = Math.round(remaining / (member.goal === 'gain' ? 0.25 : 0.5))
    }
  }
  return result
}

// ─────────────────────────────────────────────
// RENDER ENTRY
// ─────────────────────────────────────────────
export function renderDiet(el) {
  if (el) el.innerHTML = getDietHTML()
  setState('dietSubTab', state.dietSubTab || 'signature')
  renderDietTab()
}

// ─────────────────────────────────────────────
// MAIN TAB RENDER
// ─────────────────────────────────────────────
function renderDietTab() {
  const qb = document.getElementById('dietQuoteBanner')
  if (qb) qb.textContent = '"' + getDietQuote() + '"'

  const nav = document.getElementById('dietSubTabNav')
  if (nav) {
    const tabs = [
      { id:'signature',  icon:'&#11088;',  label:'Dolu Buddy Signature Plans' },
      { id:'bodymatrix', icon:'&#128202;', label:'Your Body Matrix' },
      { id:'track',      icon:'&#128197;', label:'30 Days Plan &amp; Track' }
    ]
    nav.innerHTML = tabs.map(t => {
      const active = t.id === state.dietSubTab
      return `<button class="diet-sub-btn" data-tab="${t.id}" onclick="switchDietTab('${t.id}')" style="padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;cursor:pointer;transition:.2s;${active?'background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;box-shadow:0 2px 8px rgba(27,94,32,.3)':'background:#fff;color:#2E7D32;border:1.5px solid #C8E6C9'}">${t.icon} ${t.label}</button>`
    }).join('')
  }

  ;['signature','bodymatrix','track'].forEach(t => {
    const panel = document.getElementById('dietSubTab-'+t)
    if (panel) panel.style.display = t === state.dietSubTab ? '' : 'none'
  })

  renderDietMembers()
  renderDuluPlans()
  if (state.dietSubTab === 'track') renderDietTrackTab()
}

// ─────────────────────────────────────────────
// DOLU PLANS GRID
// ─────────────────────────────────────────────
function renderDuluPlans() {
  const grid = document.getElementById('duluPlansGrid')
  if (!grid) return
  grid.innerHTML = DOLU_PLANS.map(plan =>
    `<div style="background:rgba(255,255,255,.13);border-radius:12px;padding:16px;cursor:pointer;border:1.5px solid rgba(255,255,255,.2)" onclick="showDuluPlan('${plan.id}')" onmouseover="this.style.background='rgba(255,255,255,.22)'" onmouseout="this.style.background='rgba(255,255,255,.13)'">
      <div style="font-size:14px;font-weight:800;margin-bottom:4px">${plan.title}</div>
      <div style="font-size:11px;opacity:.85;margin-bottom:8px">${plan.subtitle}</div>
      <div style="font-size:11px;opacity:.75;line-height:1.5">${plan.benefit.substring(0,80)}...</div>
      <div style="margin-top:10px;font-size:12px;font-weight:700;opacity:.9">View 7-Day Plan &#8594;</div>
    </div>`
  ).join('')
}

window.showDuluPlan = function(id) {
  const plan = DOLU_PLANS.find(p => p.id === id)
  if (!plan) return
  document.getElementById('duluPlanOverlay')?.remove()
  const rows = plan.days.map(d =>
    `<tr style="border-bottom:1px solid #e8e8e8">
      <td style="padding:8px 12px;font-weight:700;color:${plan.color};white-space:nowrap">Day ${d.day}</td>
      <td style="padding:8px 10px;font-size:11px">${d.b}</td>
      <td style="padding:8px 10px;font-size:11px">${d.l}</td>
      <td style="padding:8px 10px;font-size:11px">${d.d}</td>
      <td style="padding:8px 10px;font-size:11px">${d.s}</td>
    </tr>`
  ).join('')
  const dc = plan.avgDayCost || 200
  const costHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
    <div style="flex:1;min-width:110px;background:${plan.bg};border-radius:10px;padding:12px 14px;text-align:center;border:1.5px solid ${plan.color}30">
      <div style="font-size:10px;color:${plan.color};font-weight:700;margin-bottom:4px">&#128197; Per Day</div>
      <div style="font-size:20px;font-weight:800;color:${plan.color}">&#8377;${dc}</div>
    </div>
    <div style="flex:1;min-width:110px;background:${plan.bg};border-radius:10px;padding:12px 14px;text-align:center;border:1.5px solid ${plan.color}30">
      <div style="font-size:10px;color:${plan.color};font-weight:700;margin-bottom:4px">&#128467;&#65039; 7-Day Plan</div>
      <div style="font-size:20px;font-weight:800;color:${plan.color}">&#8377;${(dc*7).toLocaleString()}</div>
    </div>
    <div style="flex:1;min-width:110px;background:${plan.color};border-radius:10px;padding:12px 14px;text-align:center">
      <div style="font-size:10px;color:rgba(255,255,255,.85);font-weight:700;margin-bottom:4px">&#128198; Monthly Est.</div>
      <div style="font-size:20px;font-weight:800;color:#fff">&#8377;${(dc*30).toLocaleString()}</div>
    </div>
  </div>`
  const ov = document.createElement('div')
  ov.id = 'duluPlanOverlay'
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px'
  ov.onclick = e => { if (e.target === ov) ov.remove() }
  ov.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:720px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.25)">
    <div style="background:linear-gradient(135deg,${plan.color},#43A047 130%);padding:20px 22px;border-radius:16px 16px 0 0;color:#fff">
      <div style="font-size:18px;font-weight:800;margin-bottom:4px">${plan.title}</div>
      <div style="font-size:12px;opacity:.85">${plan.subtitle} — Curated by Dolu Buddy &#11088;</div>
    </div>
    <div style="padding:20px 22px">
      ${costHTML}
      <div style="background:${plan.bg};border-radius:9px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:${plan.color};line-height:1.7">&#128161; <b>Benefits:</b> ${plan.benefit}</div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:${plan.color};color:#fff">
          <th style="padding:9px 12px;text-align:left;font-size:12px;border-radius:8px 0 0 0">Day</th>
          <th style="padding:9px 12px;text-align:left;font-size:12px">&#9728;&#65039; Breakfast</th>
          <th style="padding:9px 12px;text-align:left;font-size:12px">&#127807; Lunch</th>
          <th style="padding:9px 12px;text-align:left;font-size:12px">&#127769; Dinner</th>
          <th style="padding:9px 12px;text-align:left;font-size:12px;border-radius:0 8px 0 0">&#129372; Snack</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div style="font-size:12px;color:#8B5E52;margin-top:14px;padding:10px 14px;background:#FFF8F0;border-radius:8px;line-height:1.6">&#128204; <b>Dolu Buddy's Note:</b> Adjust quantities based on your daily calorie target. Drink 2.5–3 litres of water daily. Add a 30-minute evening walk for best results. Consistency is the key — follow for 7 days and feel the difference! &#11088;</div>
    </div>
    <div style="padding:0 22px 22px">
      <button onclick="addFollowedPlan('${plan.id}');document.getElementById('duluPlanOverlay').remove();switchDietTab('track')" style="width:100%;padding:14px;background:linear-gradient(135deg,${plan.color},#43A047 130%);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">&#10003; I'll follow this plan!</button>
    </div>
  </div>`
  document.body.appendChild(ov)
}

// ─────────────────────────────────────────────
// BMI CALCULATOR
// ─────────────────────────────────────────────
window.calcBMIAndPlan = function() {
  const h    = parseFloat(document.getElementById('dietHeight').value)
  const w    = parseFloat(document.getElementById('dietWeight').value)
  const goal = document.getElementById('dietGoal').value
  if (!h || !w || h<100 || h>250 || w<20 || w>300) {
    showToast('Please enter valid height (100–250 cm) and weight (20–300 kg).')
    return
  }
  const bmi = Math.round((w / ((h/100)**2)) * 10) / 10
  let cat, advice, cal, prot, carb, fat, bmiTag
  if (bmi < 18.5)      { cat='Underweight'; bmiTag='underweight'; advice='Focus on calorie-dense nutritious foods. Add protein and healthy fats.'; cal=2400; prot=100; carb=320; fat=70 }
  else if (bmi < 25)   { cat='Normal Weight'; bmiTag='normal'; advice='Maintain your current healthy weight. Keep balanced macros.'; cal=1900; prot=85; carb=250; fat=60 }
  else if (bmi < 30)   { cat='Overweight'; bmiTag='overweight'; advice='Reduce calorie intake. Focus on protein and fibre to stay full longer.'; cal=1500; prot=90; carb=170; fat=50 }
  else                  { cat='Obese'; bmiTag='obese'; advice='Consult a doctor. Focus on low-calorie, high-protein, high-fibre meals.'; cal=1200; prot=95; carb=130; fat=40 }
  if (goal === 'lose') { cal = Math.max(1100, cal-200); prot = Math.min(prot+10, 120) }
  if (goal === 'gain') { cal += 300; prot += 15; carb += 30 }
  _dietCurrentBmi = { bmi, cat, bmiTag, cal, prot, carb, fat }

  document.getElementById('bmiResult').style.display    = 'block'
  document.getElementById('bmiValue').textContent       = bmi
  document.getElementById('bmiCategory').textContent    = cat
  document.getElementById('bmiAdvice').textContent      = advice
  const motEl = document.getElementById('bmiMotivation'); if (motEl) motEl.textContent = '✨ '+getDietQuote()
  document.getElementById('bmiCalories').textContent    = cal
  document.getElementById('bmiProtein').textContent     = prot+'g'
  document.getElementById('bmiCarbs').textContent       = carb+'g'
  document.getElementById('bmiFat').textContent         = fat+'g'
  const pct = Math.min(100, Math.max(0, (bmi-10)/30*100))
  const mk = document.getElementById('bmiMarker'); if (mk) mk.style.left = pct+'%'

  document.getElementById('dietPlanOutput').style.display = 'block'
  document.getElementById('dietSavePanel').style.display  = 'flex'
  showDietSlot('breakfast', document.getElementById('dslot-breakfast'))
}

window.setDietTypeFilter = function(type, btn) {
  _dietCurrentType = type
  document.querySelectorAll('.diet-type-btn').forEach(b => {
    const active = b === btn
    b.style.background = active ? 'linear-gradient(135deg,#1B5E20,#43A047)' : '#fff'
    b.style.color      = active ? '#fff' : '#2E7D32'
    b.style.border     = active ? 'none' : '1.5px solid #C8E6C9'
  })
  if (document.getElementById('dietPlanOutput')?.style.display !== 'none') renderDietMeals(_dietCurrentSlot)
}

window.showDietSlot = function(slot, btn) {
  _dietCurrentSlot = slot
  document.querySelectorAll('.diet-slot-btn').forEach(b => {
    b.style.background = '#fff'
    b.style.color      = '#2E7D32'
    b.style.border     = '1.5px solid #C8E6C9'
  })
  if (btn) { btn.style.background='linear-gradient(135deg,#1B5E20,#43A047)'; btn.style.color='#fff'; btn.style.border='none' }
  renderDietMeals(slot)
}

function renderDietMeals(slot) {
  const grid = document.getElementById('dietMealGrid'); if (!grid) return
  const bmiTag = _dietCurrentBmi ? _dietCurrentBmi.bmiTag : 'normal'
  const meals  = (DIET_DB[slot] || []).filter(m => {
    if (!m.bmi.includes('all') && !m.bmi.includes(bmiTag)) return false
    if (_dietCurrentType === 'veg')    return m.type === 'veg'
    if (_dietCurrentType === 'nonveg') return m.type === 'non-veg'
    return true
  })
  const tagColors = {
    'High Protein':'#E3F2FD:#1565C0','High Fiber':'#E8F5E9:#2E7D32','Low Cal':'#FFF3E0:#E65100',
    'Omega-3':'#E8EAF6:#283593','Antioxidant':'#FCE4EC:#C62828','Energy':'#FFFDE7:#F57F17',
    'Detox':'#E0F7FA:#00838F','Probiotic':'#F3E5F5:#6A1B9A','Immunity':'#E8F5E9:#1B5E20',
    'Calcium':'#E3F2FD:#0D47A1','Iron':'#FBE9E7:#BF360C','Gluten Free':'#F9FBE7:#558B2F'
  }
  grid.innerHTML = meals.map(m => {
    const tagHTML = m.tags.map(t => { const c=(tagColors[t]||'#F5F5F5:#555').split(':'); return `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${c[0]};color:${c[1]}">${t}</span>` }).join(' ')
    const typeCol = m.type === 'veg' ? '#2E7D32' : '#C62828'
    const typeBg  = m.type === 'veg' ? '#E8F5E9'  : '#FFEBEE'
    return `<div style="background:#fff;border-radius:13px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.07);border:1.5px solid #E8F5E9;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px">
        <div style="font-size:14px;font-weight:700;color:#1B3A20;line-height:1.3;flex:1">${m.name}</div>
        <span style="padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${typeBg};color:${typeCol};white-space:nowrap">${m.type==='veg'?'&#127807; Veg':'&#127831; Non-Veg'}</span>
      </div>
      <div style="display:flex;gap:10px;font-size:11px;font-weight:600">
        <span style="color:#E65100">&#128293; ${m.cal} kcal</span>
        <span style="color:#1565C0">&#128170; ${m.prot}g P</span>
        <span style="color:#6A1B9A">&#127806; ${m.carb}g C</span>
        <span style="color:#2E7D32">&#129361; ${m.fat}g F</span>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${tagHTML}</div>
      <div style="font-size:11px;color:#8B5E52;line-height:1.5">&#9201; ${m.time}${m.time===0?' min (ready-to-eat)':' min'}</div>
      <div style="font-size:11px;color:#555;line-height:1.5;background:#F9FBF9;border-radius:7px;padding:8px">
        <div style="font-weight:700;color:#1B5E20;margin-bottom:3px">&#129370; Ingredients</div>${m.ingredients}
      </div>
      <div style="font-size:11px;color:#555;line-height:1.6">
        <div style="font-weight:700;color:#1B5E20;margin-bottom:3px">&#128104;&#8205;&#127859; Preparation</div>${m.steps}
      </div>
      <div style="font-size:12px;font-weight:700;color:#2E7D32;text-align:right">Est. &#8377;${m.price} per serve</div>
    </div>`
  }).join('')
  if (!meals.length) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#8B5E52"><div style="font-size:36px">&#129367;</div><br>No meals for this category. Try a different slot.</div>'
}

// ─────────────────────────────────────────────
// SAVE DIET PLAN
// ─────────────────────────────────────────────
window.saveDietPlan = async function() {
  const name = (document.getElementById('dietName').value || '').trim()
  if (!name) { showToast('Please enter a person name before saving.'); return }
  if (!_dietCurrentBmi) { showToast('Please click "Generate Plan" first, then save.'); return }
  const h    = parseFloat(document.getElementById('dietHeight').value)
  const w    = parseFloat(document.getElementById('dietWeight').value)
  const goal = document.getElementById('dietGoal').value
  const twEl = document.getElementById('dietTargetWeight')
  const tw   = twEl?.value ? parseFloat(twEl.value) : null
  const existing = (state.dietMembers || []).find(m => m.name.toLowerCase() === name.toLowerCase())
  const now  = new Date()
  const member = {
    id:             existing?.id || 'dm_'+Date.now(),
    name,
    height:         h,
    weight:         w,
    goal,
    bmi:            _dietCurrentBmi.bmi,
    cat:            _dietCurrentBmi.cat,
    bmi_tag:        _dietCurrentBmi.bmiTag,
    cal:            _dietCurrentBmi.cal,
    prot:           _dietCurrentBmi.prot,
    carb:           _dietCurrentBmi.carb,
    fat:            _dietCurrentBmi.fat,
    diet_type:      _dietCurrentType,
    start_date:     existing?.start_date || existing?.startDate || now.toISOString(),
    start_weight:   existing?.start_weight || existing?.startWeight || w,
    current_weight: existing?.current_weight || existing?.currentWeight || w,
    target_weight:  tw || existing?.target_weight || existing?.targetWeight || null,
    schedule_variant: existing?.schedule_variant || existing?.scheduleVariant || 0,
    // local convenience aliases
    bmiTag:   _dietCurrentBmi.bmiTag,
    dietType: _dietCurrentType,
  }
  await dbSaveDietMember(member)
  const members = [...(state.dietMembers || [])]
  const idx = members.findIndex(m => m.id === member.id)
  if (idx >= 0) members[idx] = member
  else members.push(member)
  setState('dietMembers', members)
  renderDietMembers()
  showToast('&#10003; Saved! '+name+"'s plan is in Family Diet Members below.")
  setTimeout(() => { document.getElementById('dietMembersList')?.scrollIntoView({ behavior:'smooth', block:'nearest' }) }, 500)
}

// ─────────────────────────────────────────────
// DIET MEMBERS GRID
// ─────────────────────────────────────────────
function renderDietMembers() {
  const members   = state.dietMembers || []
  const listEl    = document.getElementById('dietMembersList'); if (!listEl) return
  const budgetBtn = document.getElementById('dietBudgetBtn')
  if (!members.length) {
    listEl.innerHTML = '<div style="text-align:center;padding:32px;color:#8B5E52"><div style="font-size:36px;margin-bottom:8px">&#128100;</div><div style="font-size:14px;margin-bottom:12px">No diet plans saved yet.<br>Enter Name &#8594; Height &#8594; Weight &#8594; Goal &#8594; "Generate Plan" &#8594; "&#128190; Save This Plan".</div></div>'
    if (budgetBtn) budgetBtn.style.display = 'none'
    return
  }
  if (budgetBtn) budgetBtn.style.display = 'inline-block'
  const catColors = { 'Underweight':'#1565C0|#E3F2FD','Normal Weight':'#2E7D32|#E8F5E9','Overweight':'#E65100|#FFF3E0','Obese':'#C62828|#FFEBEE' }
  const goalMap   = { lose:'&#127919; Lose Weight', maintain:'&#9878;&#65039; Maintain', gain:'&#128170; Gain Muscle' }
  const grandTotal = members.reduce((s, m) => s + calcMemberMonthlyCost(m), 0)
  listEl.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:16px">' +
    members.map(m => {
      const cc   = (catColors[m.cat] || '#555|#F5F5F5').split('|')
      const cost = calcMemberMonthlyCost(m)
      const prog = calcWeightProgress(m)
      const tw   = m.targetWeight || m.target_weight
      const sw   = m.startWeight  || m.start_weight
      let progressHTML = ''
      if (tw && sw) {
        const barCol = m.goal === 'gain' ? '#1565C0' : '#2E7D32'
        progressHTML = `<div style="background:#F1F8E9;border-radius:8px;padding:10px 12px;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;color:#1B5E20;margin-bottom:5px">&#128202; Weight Journey</div>
          <div style="font-size:11px;color:#555;margin-bottom:4px">Start <b>${prog.startWeight}kg</b> &#8594; Now <b>${prog.currentWeight||prog.startWeight}kg</b> &#8594; Goal <b>${tw}kg</b></div>
          ${prog.changed > 0 ?
            `<div style="height:7px;background:#E0E0E0;border-radius:4px;margin:5px 0;overflow:hidden"><div style="height:100%;width:${prog.pct}%;background:${barCol};border-radius:4px"></div></div>
            <div style="font-size:11px;color:${barCol};font-weight:600">${prog.pct}% &#183; ${m.goal==='gain'?'Gained':'Lost'} ${prog.changed}kg &#183; ${prog.remaining}kg remaining${prog.estWeeks?' &#183; ~'+prog.estWeeks+' weeks to goal':''} &#127881;</div>` :
            '<div style="font-size:10px;color:#aaa">Log your weight monthly to track progress &#8594;</div>'}
        </div>`
      }
      const dtBadge = m.dietType === 'veg' || m.diet_type === 'veg'
        ? '<span style="background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700">&#127807; Veg</span>'
        : m.dietType === 'nonveg' || m.diet_type === 'nonveg'
          ? '<span style="background:#FFEBEE;color:#C62828;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700">&#127831; Non-Veg</span>'
          : '<span style="background:#F3E5F5;color:#6A1B9A;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700">&#127869;&#65039; All Types</span>'
      return `<div style="background:#F9FBF9;border-radius:12px;padding:16px;border:1.5px solid #C8E6C9;display:flex;flex-direction:column;gap:0">
        <div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:10px">&#128100; ${m.name}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">
          <span style="background:${cc[1]};color:${cc[0]};padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700">${m.cat}</span>
          <span style="background:#FFF8E1;color:#F57F17;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700">BMI ${m.bmi}</span>
          <span style="background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:600">${goalMap[m.goal]||m.goal}</span>
          ${dtBadge}
        </div>
        <div style="font-size:11px;color:#555;margin-bottom:2px">&#128207; ${m.height}cm &#183; &#9878;&#65039; ${m.weight}kg</div>
        <div style="font-size:11px;color:#555;margin-bottom:4px">&#128293; ${m.cal} kcal &#183; &#128170; ${m.prot}g P &#183; &#127806; ${m.carb}g C &#183; &#129361; ${m.fat}g F</div>
        <div style="font-size:10px;color:#aaa;margin-bottom:8px">&#128467;&#65039; On plan since: ${prog.startDateStr} (${prog.daysOn} days)</div>
        ${progressHTML}
        <div style="font-size:12px;color:#E65100;font-weight:700;margin-bottom:10px">&#128176; Est. &#8377;${cost.toLocaleString()}/month</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button onclick="viewMemberSchedule('${m.id}')" style="padding:9px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128197; View 30-Day Schedule</button>
          <button onclick="logMemberWeight('${m.id}')" style="padding:9px;background:#E3F2FD;color:#1565C0;border:1.5px solid #90CAF9;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128202; Log Today's Weight</button>
          <button onclick="confirmDeleteDietMember('${m.id}','${m.name}')" style="padding:9px;background:#FFF;color:#C62828;border:1.5px solid #FFCDD2;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128465;&#65039; Remove Member</button>
        </div>
      </div>`
    }).join('') +
    '</div>' +
    `<div style="background:#F1F8E9;border-radius:10px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="font-size:14px;font-weight:700;color:#1B5E20">&#128106; ${members.length} member${members.length>1?'s':''} on Family Diet Plan</div>
      <div style="text-align:right"><div style="font-size:18px;font-weight:800;color:#E65100">&#8377;${grandTotal.toLocaleString()}</div><div style="font-size:11px;color:#777">Total Monthly Diet Cost</div></div>
    </div>`
}

window.viewMemberSchedule = function(id) {
  switchDietTab('track')
  setTimeout(() => renderDietTrackView(id), 50)
}

window.confirmDeleteDietMember = function(id, name) {
  document.getElementById('dietDelConfirmOverlay')?.remove()
  const ov = document.createElement('div')
  ov.id = 'dietDelConfirmOverlay'
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px'
  ov.onclick = e => { if (e.target === ov) ov.remove() }
  ov.innerHTML = `<div style="background:#fff;border-radius:16px;padding:28px 24px;max-width:340px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.2);text-align:center">
    <div style="font-size:40px;margin-bottom:12px">&#128465;&#65039;</div>
    <div style="font-size:16px;font-weight:700;color:#1B3A20;margin-bottom:6px">Remove ${name}?</div>
    <div style="font-size:13px;color:#777;margin-bottom:22px;line-height:1.6">This will permanently remove <b>${name}</b> from the Family Diet Plan.</div>
    <div style="display:flex;gap:10px">
      <button onclick="deleteDietMember('${id}')" style="flex:1;padding:12px;background:linear-gradient(135deg,#B71C1C,#E53935);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Yes, Remove</button>
      <button onclick="document.getElementById('dietDelConfirmOverlay').remove()" style="flex:1;padding:12px;background:#F5F5F5;color:#555;border:1px solid #ddd;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">Cancel</button>
    </div>
  </div>`
  document.body.appendChild(ov)
}

window.deleteDietMember = async function(id) {
  document.getElementById('dietDelConfirmOverlay')?.remove()
  await dbDeleteDietMember(id)
  setState('dietMembers', (state.dietMembers||[]).filter(m => m.id !== id))
  renderDietMembers()
  showToast('Member removed from family diet plan.')
}

// ─────────────────────────────────────────────
// WEIGHT LOG
// ─────────────────────────────────────────────
window.logMemberWeight = function(id) {
  const m = (state.dietMembers||[]).find(x => x.id === id); if (!m) return
  const lastW = m.current_weight || m.currentWeight || m.weight
  document.getElementById('dietWeightLogOverlay')?.remove()
  const tw = m.target_weight || m.targetWeight
  const ov = document.createElement('div')
  ov.id = 'dietWeightLogOverlay'
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px'
  ov.onclick = e => { if (e.target === ov) ov.remove() }
  ov.innerHTML = `<div style="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.2)">
    <div style="font-size:16px;font-weight:700;color:#1B5E20;margin-bottom:4px">&#128202; Log Weight — ${m.name}</div>
    ${tw ? `<div style="font-size:12px;color:#555;margin-bottom:14px">Target: ${tw}kg &#183; ${Math.abs(lastW-tw).toFixed(1)}kg to go</div>` : '<div style="margin-bottom:14px"></div>'}
    <div style="margin-bottom:14px">
      <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">Today's Weight (kg)</label>
      <input id="logWeightInput" type="number" step="0.1" min="20" max="300" placeholder="e.g. 80.5" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #C8E6C9;font-size:15px;font-weight:600;outline:none;box-sizing:border-box"/>
      <div style="font-size:11px;color:#aaa;margin-top:4px">Last logged: ${lastW} kg</div>
    </div>
    <div style="display:flex;gap:10px">
      <button onclick="saveMemberWeight('${id}')" style="flex:1;padding:12px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">&#128190; Save</button>
      <button onclick="document.getElementById('dietWeightLogOverlay').remove()" style="padding:12px 18px;background:none;border:1.5px solid #C8E6C9;border-radius:10px;font-size:13px;cursor:pointer;color:#555">Cancel</button>
    </div>
  </div>`
  document.body.appendChild(ov)
  setTimeout(() => { document.getElementById('logWeightInput')?.focus() }, 50)
}

window.saveMemberWeight = async function(id) {
  const val = parseFloat(document.getElementById('logWeightInput').value)
  if (!val || val < 20 || val > 300) { showToast('Please enter a valid weight (20–300 kg).'); return }
  const m = (state.dietMembers||[]).find(x => x.id === id); if (!m) return
  await dbLogWeight(id, val, '')
  m.current_weight = val; m.currentWeight = val
  const prog = calcWeightProgress(m)
  document.getElementById('dietWeightLogOverlay')?.remove()
  let msg = '&#10003; Weight logged for '+m.name+': '+val+' kg!'
  if (prog.changed > 0) msg += ' '+(m.goal==='gain'?'Gained '+prog.changed+'kg':'Lost '+prog.changed+'kg')+' since start. Keep going! &#127881;'
  showToast(msg)
  renderDietMembers()
}

// ─────────────────────────────────────────────
// DIET MEAL DETAIL MODAL
// ─────────────────────────────────────────────
window.showDietMealDetail = function(id) {
  let meal = null
  ;['breakfast','lunch','dinner','snacks'].forEach(slot => {
    const f = (DIET_DB[slot]||[]).find(m => m.id === id)
    if (f) meal = f
  })
  if (!meal) { showToast('Meal details not found.'); return }
  const tagCols = {
    'High Protein':'#E3F2FD|#1565C0','High Fiber':'#E8F5E9|#2E7D32','Low Cal':'#FFF3E0|#E65100',
    'Omega-3':'#E8EAF6|#283593','Antioxidant':'#FCE4EC|#C62828','Energy':'#FFFDE7|#F57F17',
    'Detox':'#E0F7FA|#00838F','Probiotic':'#F3E5F5|#6A1B9A','Immunity':'#E8F5E9|#1B5E20',
    'Calcium':'#E3F2FD|#0D47A1','Iron':'#FBE9E7|#BF360C','Gluten Free':'#F9FBE7|#558B2F',
    'Brain Health':'#EDE7F6|#4527A0','Blood Sugar Control':'#E8F5E9|#2E7D32',
    'Gut Health':'#E8F5E9|#33691E','South Indian Classic':'#FFF3E0|#E65100'
  }
  const tagHTML = meal.tags.map(t => { const c=(tagCols[t]||'#F5F5F5|#555').split('|'); return `<span style="padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700;background:${c[0]};color:${c[1]}">${t}</span>` }).join(' ')
  const typeCol = meal.type === 'veg' ? '#2E7D32' : '#C62828'
  const typeBg  = meal.type === 'veg' ? '#E8F5E9'  : '#FFEBEE'
  const tipsByTag = {
    'High Protein':'&#128170; Protein keeps you full longer and builds muscle. Great for your goal!',
    'Calcium':'&#129460; Calcium builds strong bones. Especially important after age 30!',
    'Iron':'&#129657; Iron prevents anaemia. Best absorbed with Vitamin C foods.',
    'Brain Health':'&#129504; This meal nourishes your brain. Great for focus and memory!',
    'Immunity':'&#128737;&#65039; Immunity boosting meal. Have this especially during season changes!',
    'Gut Health':'&#127807; Good for your digestive system. A happy gut = a happy you!',
    'Antioxidant':'&#129760; Antioxidants fight aging and protect your cells. Excellent choice!',
    'Detox':'&#127754; Light detoxifying meal. Perfect for evenings!',
    'South Indian Classic':'&#127968; A traditional South Indian treasure. Ancient wisdom for modern health!'
  }
  let tip = ''
  for (const k in tipsByTag) { if (meal.tags.includes(k)) { tip = tipsByTag[k]; break } }
  document.getElementById('dietMealDetailOverlay')?.remove()
  const ov = document.createElement('div')
  ov.id = 'dietMealDetailOverlay'
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center;z-index:9999'
  ov.onclick = e => { if (e.target === ov) ov.remove() }
  ov.innerHTML = `<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 20px 36px;max-width:520px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 -4px 30px rgba(0,0,0,.2)">
    <div style="width:40px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 16px"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">
      <div style="font-size:17px;font-weight:800;color:#1B3A20;flex:1;line-height:1.3">${meal.name}</div>
      <span style="padding:4px 10px;border-radius:10px;font-size:11px;font-weight:700;background:${typeBg};color:${typeCol};white-space:nowrap">${meal.type==='veg'?'&#127807; Veg':'&#127831; Non-Veg'}</span>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:10px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:700;color:#E65100">&#128293; ${meal.cal} kcal</span>
      <span style="font-size:13px;font-weight:700;color:#1565C0">&#128170; ${meal.prot}g Protein</span>
      <span style="font-size:13px;font-weight:700;color:#6A1B9A">&#127806; ${meal.carb}g Carbs</span>
      <span style="font-size:13px;font-weight:700;color:#2E7D32">&#129361; ${meal.fat}g Fat</span>
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${tagHTML}</div>
    <div style="font-size:12px;color:#8B5E52;margin-bottom:14px">&#9201; ${meal.time}${meal.time===0?' min (ready-to-eat)':' min prep'} &#183; Est. &#8377;${meal.price} per serve</div>
    ${tip ? `<div style="background:#E8F5E9;border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#1B5E20;font-style:italic;font-weight:600;line-height:1.6">${tip}</div>` : ''}
    <div style="background:#F9FBF9;border-radius:10px;padding:12px 14px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700;color:#1B5E20;margin-bottom:8px">&#129370; Ingredients</div>
      <div style="font-size:12px;color:#333;line-height:1.8">${(meal.ingredients||'').split(' · ').map(i => '&#8226; '+i).join('<br>')}</div>
    </div>
    <div style="background:#F1F8E9;border-radius:10px;padding:12px 14px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:#1B5E20;margin-bottom:8px">&#128104;&#8205;&#127859; Preparation</div>
      <div style="font-size:12px;color:#333;line-height:1.8">${meal.steps}</div>
    </div>
    <button onclick="document.getElementById('dietMealDetailOverlay').remove()" style="width:100%;padding:14px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">&#10003; Got it!</button>
  </div>`
  document.body.appendChild(ov)
}

// ─────────────────────────────────────────────
// FOLLOWED PLANS
// ─────────────────────────────────────────────
window.addFollowedPlan = async function(planId) {
  const existing = (state.followedPlans||[]).find(fp => (fp.plan_id||fp.planId) === planId)
  if (existing) { showToast('&#10003; You\'re already following this plan!'); return }
  const plan = DOLU_PLANS.find(p => p.id === planId); if (!plan) return
  await dbAddFollowedPlan(planId)
  const newFP = { id:'fp_'+Date.now(), plan_id:planId, planId, added_on:new Date().toISOString(), variant:0 }
  setState('followedPlans', [...(state.followedPlans||[]), newFP])
  showToast('&#11088; "'+plan.title+'" added to your 30-Day Track!')
}

window.confirmRemoveFollowedPlan = function(id, title) {
  document.getElementById('fpDelConfirmOverlay')?.remove()
  const ov = document.createElement('div')
  ov.id = 'fpDelConfirmOverlay'
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px'
  ov.innerHTML = `<div style="background:#fff;border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.25)">
    <div style="font-size:36px;margin-bottom:12px">&#128465;&#65039;</div>
    <div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:8px">Remove Plan?</div>
    <div style="font-size:13px;color:#555;margin-bottom:20px">Remove <b>${title}</b> from your followed plans?</div>
    <div style="display:flex;gap:10px">
      <button onclick="removeFollowedPlan('${id}')" style="flex:1;padding:12px;background:#C62828;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Yes, Remove</button>
      <button onclick="document.getElementById('fpDelConfirmOverlay').remove()" style="flex:1;padding:12px;background:#F5F5F5;color:#555;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Cancel</button>
    </div>
  </div>`
  document.body.appendChild(ov)
}

window.removeFollowedPlan = async function(id) {
  document.getElementById('fpDelConfirmOverlay')?.remove()
  await dbRemoveFollowedPlan(id)
  setState('followedPlans', (state.followedPlans||[]).filter(fp => fp.id !== id))
  renderDietTrackTab()
  showToast('Plan removed from your track list.')
}

window.regenerateFollowedPlanSchedule = async function(id) {
  const variant = Math.floor(Math.random() * 9999) + 1
  await dbRegenerateFollowedPlan(id, variant)
  const fps = [...(state.followedPlans||[])]
  const idx = fps.findIndex(fp => fp.id === id)
  if (idx >= 0) fps[idx] = { ...fps[idx], variant }
  setState('followedPlans', fps)
  renderFollowedPlanView(id)
  showToast('&#128260; Fresh 30-day rotation generated!')
}

window.regenerateDietSchedule = async function(id) {
  const members = [...(state.dietMembers||[])]
  const idx = members.findIndex(m => m.id === id)
  if (idx < 0) return
  const variant = Math.floor(Math.random() * 9999) + 1
  members[idx] = { ...members[idx], schedule_variant:variant, scheduleVariant:variant }
  setState('dietMembers', members)
  await dbSaveDietMember(members[idx])
  renderDietTrackView(id)
  showToast('&#128260; Fresh meal rotation generated!')
}

// ─────────────────────────────────────────────
// TRACK TAB
// ─────────────────────────────────────────────
function renderDietTrackTab() {
  const container = document.getElementById('dietSubTab-track'); if (!container) return
  const members  = state.dietMembers   || []
  const followed = state.followedPlans || []
  if (!members.length && !followed.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#8B5E52;background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.07)"><div style="font-size:40px;margin-bottom:10px">&#128197;</div><div style="font-size:14px;margin-bottom:14px">No family diet members yet.</div><div style="font-size:12px;color:#aaa">Go to <b>Your Body Matrix</b> tab &#8594; add members &#8594; save their plans.</div></div>'
    return
  }
  const goalMap = { lose:'&#127919; Lose Weight', maintain:'&#9878;&#65039; Maintain', gain:'&#128170; Gain Muscle' }
  const membersSection = `<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:16px">
    <h3 style="margin:0 0 14px;color:#1B5E20;font-size:15px;font-weight:700">&#128106; Family Members</h3>
    ${members.length ?
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">' +
      members.map(m => {
        const prog = calcWeightProgress(m)
        const tw   = m.target_weight || m.targetWeight
        const sw   = m.start_weight  || m.startWeight
        let barHTML = ''
        if (tw && sw && prog.changed > 0) {
          const bc = m.goal === 'gain' ? '#1565C0' : '#2E7D32'
          barHTML = `<div style="height:6px;background:#E0E0E0;border-radius:4px;margin:6px 0;overflow:hidden"><div style="height:100%;width:${prog.pct}%;background:${bc};border-radius:4px"></div></div><div style="font-size:10px;color:${bc};font-weight:600">${prog.pct}% journey &#183; ${prog.remaining}kg to goal</div>`
        }
        return `<div style="background:#F9FBF9;border-radius:12px;padding:14px;border:1.5px solid #C8E6C9">
          <div style="font-size:14px;font-weight:700;color:#1B5E20;margin-bottom:5px">&#128100; ${m.name}</div>
          <div style="font-size:11px;color:#555;margin-bottom:2px">BMI <b>${m.bmi}</b> &#183; ${m.cat}</div>
          <div style="font-size:11px;color:#555;margin-bottom:6px">${goalMap[m.goal]||m.goal}</div>
          <div style="font-size:11px;color:#777;margin-bottom:6px">&#9878;&#65039; <b>${m.weight}kg</b>${tw?' &#8594; Target <b>'+tw+'kg</b>':''} &#160;|&#160; &#128293; ${m.cal} kcal</div>
          ${barHTML}
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
            <button onclick="renderDietTrackView('${m.id}')" style="padding:8px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128197; View 30-Day Schedule</button>
            <button onclick="logMemberWeight('${m.id}')" style="padding:8px;background:#E3F2FD;color:#1565C0;border:1.5px solid #90CAF9;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128202; Log Weight</button>
            <button onclick="confirmDeleteDietMember('${m.id}','${m.name}')" style="padding:8px;background:#fff;color:#C62828;border:1.5px solid #FFCDD2;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128465;&#65039; Remove Member</button>
          </div>
        </div>`
      }).join('') +
      '</div>' :
      '<div style="text-align:center;padding:20px;color:#8B5E52;font-size:13px">No family members yet. Go to <b>Your Body Matrix</b> to add.</div>'
    }
  </div>`
  const followedSection = `<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:16px">
    <h3 style="margin:0 0 14px;font-size:15px;font-weight:700;color:#4527A0">&#128203; My Followed Signature Plans</h3>
    ${followed.length ?
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' +
      followed.map(fp => {
        const plan = DOLU_PLANS.find(p => p.id === (fp.plan_id||fp.planId))
        if (!plan) return ''
        const dc = plan.avgDayCost || 150
        return `<div style="background:${plan.bg};border-radius:12px;padding:16px;border:1.5px solid ${plan.color}33">
          <div style="font-size:14px;font-weight:700;color:${plan.color};margin-bottom:4px">${plan.title}</div>
          <div style="font-size:11px;color:#555;margin-bottom:10px">${plan.subtitle}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <div style="background:${plan.color}1A;color:${plan.color};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">&#128197; &#8377;${dc}/day</div>
            <div style="background:#FFF3E0;color:#E65100;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">&#128198; &#8377;${(dc*30).toLocaleString()}/month</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="renderFollowedPlanView('${fp.id}')" style="padding:8px;background:linear-gradient(135deg,${plan.color},${plan.color}CC);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128197; View 30-Day Schedule</button>
            <button onclick="regenerateFollowedPlanSchedule('${fp.id}')" style="padding:8px;background:#FFF3E0;color:#E65100;border:1.5px solid #FFCC80;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128260; Regenerate Schedule</button>
            <button onclick="confirmRemoveFollowedPlan('${fp.id}','${plan.title}')" style="padding:8px;background:#fff;color:#C62828;border:1.5px solid #FFCDD2;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128465;&#65039; Remove Plan</button>
          </div>
        </div>`
      }).join('') +
      '</div>' :
      '<div style="text-align:center;padding:24px;color:#7B6FA8;font-size:13px"><div style="font-size:32px;margin-bottom:8px">&#11088;</div><div>No followed plans yet.</div><div style="font-size:11px;color:#aaa;margin-top:4px">Go to <b>Dolu Buddy Signature Plans</b> &#8594; pick a plan &#8594; click "I\'ll follow this plan!"</div></div>'
    }
  </div>`
  container.innerHTML = membersSection + followedSection + '<div id="dietTrackScheduleArea"></div>'
}

window.renderFollowedPlanView = function(fpId) {
  const fp = (state.followedPlans||[]).find(x => x.id === fpId); if (!fp) return
  const plan = DOLU_PLANS.find(p => p.id === (fp.plan_id||fp.planId)); if (!plan) return
  const planDays = shuffleWithSeed(plan.days, fp.variant||0)
  const days30 = Array.from({ length:30 }, (_, i) => {
    const src = planDays[i % planDays.length]
    return { day:i+1, b:src.b, l:src.l, d:src.d, s:src.s, cost:plan.avgDayCost||150 }
  })
  const totalCost = days30.reduce((s, d) => s + d.cost, 0)
  const tableHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    `<thead><tr style="background:${plan.color};color:#fff"><th style="padding:10px 12px;text-align:left;white-space:nowrap;border-radius:8px 0 0 0">Day</th><th style="padding:10px 12px;text-align:left">&#9728;&#65039; Breakfast</th><th style="padding:10px 12px;text-align:left">&#127807; Lunch</th><th style="padding:10px 12px;text-align:left">&#127769; Dinner</th><th style="padding:10px 12px;text-align:left">&#129372; Snack</th><th style="padding:10px 12px;text-align:right;white-space:nowrap;border-radius:0 8px 0 0">&#8377; Cost</th></tr></thead>` +
    '<tbody>'+days30.map((day,i) => `<tr style="background:${i%2===0?'#fff':plan.bg};border-bottom:1px solid #E8F5E9"><td style="padding:8px 12px;font-weight:700;color:${plan.color};white-space:nowrap">Day ${day.day}</td><td style="padding:8px 12px">${day.b}</td><td style="padding:8px 12px">${day.l}</td><td style="padding:8px 12px">${day.d}</td><td style="padding:8px 12px">${day.s}</td><td style="padding:8px 12px;text-align:right;font-weight:600;color:#E65100">&#8377;${day.cost}</td></tr>`).join('') +
    `</tbody><tfoot><tr style="background:${plan.bg};font-weight:700"><td colspan="5" style="padding:10px 12px;color:${plan.color}">Monthly Total</td><td style="padding:10px 12px;text-align:right;color:#E65100;font-size:14px">&#8377;${totalCost.toLocaleString()}</td></tr></tfoot></table></div>`
  const area = document.getElementById('dietTrackScheduleArea'); if (!area) return
  area.innerHTML = `<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div><h3 style="margin:0 0 4px;font-size:15px;font-weight:700;color:${plan.color}">${plan.title} &#8212; 30-Day Schedule</h3><div style="font-size:11px;color:#777">${plan.subtitle}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="regenerateFollowedPlanSchedule('${fp.id}')" style="padding:8px 16px;background:linear-gradient(135deg,#E65100,#FF7043);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128260; Regenerate</button>
        <button onclick="renderDietTrackTab()" style="padding:7px 14px;background:#F5F5F5;color:#555;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">&#8592; Back</button>
      </div>
    </div>
    <div style="background:${plan.bg};border-radius:10px;padding:12px 18px;margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      <div style="font-size:13px;color:#555">&#128197; <b>&#8377;${plan.avgDayCost}/day</b></div>
      <div style="font-size:13px;color:#555">&#128467;&#65039; <b>&#8377;${(plan.avgDayCost*7).toLocaleString()}/week</b></div>
      <div style="margin-left:auto;text-align:right"><div style="font-size:22px;font-weight:800;color:#E65100">&#8377;${totalCost.toLocaleString()}</div><div style="font-size:11px;color:#777">Est. Monthly Cost</div></div>
    </div>
    ${tableHTML}
  </div>`
  area.scrollIntoView({ behavior:'smooth', block:'start' })
}

window.renderDietTrackView = function(id) {
  const m = (state.dietMembers||[]).find(x => x.id === id); if (!m) return
  const schedule  = generateMonthlyDietSchedule(m)
  const totalCost = schedule.reduce((s, d) => s + d.dayCost, 0)
  const goalMap   = { lose:'Lose Weight', maintain:'Maintain', gain:'Gain Muscle' }
  const summaryHTML = `<div style="background:#F1F8E9;border-radius:10px;padding:14px 18px;margin-bottom:16px;display:flex;gap:20px;flex-wrap:wrap;align-items:center">
    <div><div style="font-size:18px;font-weight:800;color:#1B5E20">${m.name}</div><div style="font-size:12px;color:#555">${m.cat} &#183; BMI ${m.bmi} &#183; ${goalMap[m.goal]||m.goal}</div></div>
    <div style="font-size:13px;color:#555">&#128293; ${m.cal} kcal/day</div>
    <div style="font-size:13px;color:#555">&#128170; ${m.prot}g protein/day</div>
    <div style="margin-left:auto;text-align:right"><div style="font-size:22px;font-weight:800;color:#E65100">&#8377;${totalCost.toLocaleString()}</div><div style="font-size:11px;color:#777">Est. Monthly Cost</div></div>
  </div>`
  const tableHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
    '<thead><tr style="background:#1B5E20;color:#fff"><th style="padding:10px 12px;text-align:left;white-space:nowrap;border-radius:8px 0 0 0">Day</th><th style="padding:10px 12px;text-align:left">&#9728;&#65039; Breakfast</th><th style="padding:10px 12px;text-align:left">&#127807; Lunch</th><th style="padding:10px 12px;text-align:left">&#127769; Dinner</th><th style="padding:10px 12px;text-align:left">&#129372; Snack</th><th style="padding:10px 12px;text-align:right;white-space:nowrap;border-radius:0 8px 0 0">&#8377; Cost</th></tr></thead>' +
    '<tbody>'+schedule.map((day,i) =>
      `<tr style="background:${i%2===0?'#fff':'#F9FBF9'};border-bottom:1px solid #E8F5E9"><td style="padding:8px 12px;font-weight:700;color:#1B5E20;white-space:nowrap">Day ${day.day||i+1}</td>` +
      `<td style="padding:8px 12px">${day.breakfast?`<span style="color:#1B5E20;cursor:pointer;font-weight:600;text-decoration:underline dotted" onclick="showDietMealDetail('${day.breakfast.id}')">${day.breakfast.name}</span>`:'&#8212;'}</td>` +
      `<td style="padding:8px 12px">${day.lunch?`<span style="color:#1B5E20;cursor:pointer;font-weight:600;text-decoration:underline dotted" onclick="showDietMealDetail('${day.lunch.id}')">${day.lunch.name}</span>`:'&#8212;'}</td>` +
      `<td style="padding:8px 12px">${day.dinner?`<span style="color:#1B5E20;cursor:pointer;font-weight:600;text-decoration:underline dotted" onclick="showDietMealDetail('${day.dinner.id}')">${day.dinner.name}</span>`:'&#8212;'}</td>` +
      `<td style="padding:8px 12px">${day.snacks?`<span style="color:#1B5E20;cursor:pointer;font-weight:600;text-decoration:underline dotted" onclick="showDietMealDetail('${day.snacks.id}')">${day.snacks.name}</span>`:'&#8212;'}</td>` +
      `<td style="padding:8px 12px;text-align:right;font-weight:600;color:#E65100">&#8377;${day.dayCost}</td></tr>`
    ).join('') +
    `</tbody><tfoot><tr style="background:#E8F5E9;font-weight:700"><td colspan="5" style="padding:10px 12px;color:#1B5E20">Monthly Total</td><td style="padding:10px 12px;text-align:right;color:#E65100;font-size:14px">&#8377;${totalCost.toLocaleString()}</td></tr></tfoot></table></div>`
  const area = document.getElementById('dietTrackScheduleArea')
  if (area) {
    area.innerHTML = `<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <h3 style="margin:0;color:#1B5E20;font-size:15px;font-weight:700">&#128197; ${m.name}'s 30-Day Diet Schedule</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="regenerateDietSchedule('${m.id}')" style="padding:8px 16px;background:linear-gradient(135deg,#E65100,#FF7043);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128260; Regenerate Plan</button>
          <button onclick="renderDietTrackTab()" style="padding:7px 14px;background:#F5F5F5;color:#555;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">&#8592; Back</button>
        </div>
      </div>
      ${summaryHTML}${tableHTML}
    </div>`
    area.scrollIntoView({ behavior:'smooth', block:'start' })
  }
}

// ─────────────────────────────────────────────
// MISC CONTROLS
// ─────────────────────────────────────────────
window.switchDietTab = function(tab) {
  setState('dietSubTab', tab)
  document.querySelectorAll('.diet-sub-btn').forEach(b => {
    const active = b.getAttribute('data-tab') === tab
    b.style.background = active ? 'linear-gradient(135deg,#1B5E20,#43A047)' : '#fff'
    b.style.color      = active ? '#fff' : '#2E7D32'
    b.style.border     = active ? 'none' : '1.5px solid #C8E6C9'
    b.style.boxShadow  = active ? '0 2px 8px rgba(27,94,32,.3)' : 'none'
  })
  ;['signature','bodymatrix','track'].forEach(t => {
    const panel = document.getElementById('dietSubTab-'+t)
    if (panel) panel.style.display = t === tab ? '' : 'none'
  })
  if (tab === 'track') renderDietTrackTab()
}

window.addAnotherDietPerson = function() {
  switchDietTab('bodymatrix')
  ;['dietName','dietHeight','dietWeight','dietTargetWeight'].forEach(id => { const el = document.getElementById(id); if (el) el.value = '' })
  const goalEl = document.getElementById('dietGoal'); if (goalEl) goalEl.value = 'maintain'
  document.getElementById('bmiResult').style.display      = 'none'
  document.getElementById('dietSavePanel').style.display  = 'none'
  document.getElementById('dietPlanOutput').style.display = 'none'
  _dietCurrentBmi = null; _dietCurrentType = 'all'
  showToast("Form cleared. Enter the new family member's details and generate their plan!")
}

window.requestDietBudget = async function() {
  const members = state.dietMembers || []
  if (!members.length) { showToast('No diet plans saved yet. Save at least one family member plan first.'); return }
  const totalCost = members.reduce((s, m) => s + calcMemberMonthlyCost(m), 0)
  const now = new Date()
  const items = members.map(m => ({ name:m.name, bmi:m.bmi, cat:m.cat, cal:m.cal, monthlyCost:calcMemberMonthlyCost(m) }))
  await dbCreateQuotation(now.getMonth(), now.getFullYear(), items, totalCost)
  showToast('&#10003; Diet budget request sent for '+members.length+' member'+(members.length>1?'s':'')+'. Est. &#8377;'+totalCost.toLocaleString()+'/month. Check Status tab for updates.')
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function showToast(msg) {
  if (window.showToast && window.showToast !== showToast) { window.showToast(msg); return }
  let t = document.getElementById('_toast')
  if (!t) { t = document.createElement('div'); t.id='_toast'; t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 22px;border-radius:24px;font-size:14px;z-index:99999;transition:opacity .3s;pointer-events:none'; document.body.appendChild(t) }
  t.innerHTML = msg; t.style.opacity = '1'
  clearTimeout(t._timer); t._timer = setTimeout(() => { t.style.opacity='0' }, 3000)
}

// ─────────────────────────────────────────────
// HTML TEMPLATE
// ─────────────────────────────────────────────
function getDietHTML() {
  return `<div>
    <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32,#43A047);border-radius:14px;padding:20px 24px;margin-bottom:16px;color:#fff;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <span style="font-size:40px">&#129367;</span>
      <div style="flex:1">
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:800">Diet Menu</h2>
        <p style="margin:0;font-size:12px;opacity:.85">Nutrition-based meals &#8212; fruits, nuts, protein &amp; protection. Pan-India. All body types.</p>
        <div id="dietQuoteBanner" style="margin-top:8px;font-size:12px;font-style:italic;opacity:.92;padding:8px 12px;background:rgba(255,255,255,.15);border-radius:8px;line-height:1.5"></div>
      </div>
    </div>
    <div id="dietSubTabNav" style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap"></div>

    <!-- Dolu Buddy Signature Plans -->
    <div id="dietSubTab-signature">
      <div style="background:linear-gradient(135deg,#1A237E,#283593 40%,#1B5E20 100%);border-radius:14px;padding:20px 22px;margin-bottom:16px;color:#fff">
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">&#11088; Dolu Buddy's Signature Plans</div>
        <div style="font-size:12px;opacity:.85;margin-bottom:14px">Research-backed curated 7-day plans &#8212; pick one, follow it, transform your health. My gift to your family. &#128154;</div>
        <div id="duluPlansGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
      </div>
      <div style="background:linear-gradient(135deg,#E8F5E9,#F1F8E9);border-radius:14px;padding:18px 20px;border:1.5px solid #A5D6A7">
        <div style="font-size:14px;font-weight:700;color:#1B5E20;margin-bottom:10px">&#128161; Dolu Buddy's Diet Tips</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="font-size:12px;color:#2E7D32;line-height:1.7">&#10003; Drink 8–10 glasses of water daily<br>&#10003; Eat every 3–4 hours — never skip meals<br>&#10003; Include a protein source in every meal<br>&#10003; Have fruits before 4 PM for best absorption</div>
          <div style="font-size:12px;color:#2E7D32;line-height:1.7">&#10003; A handful of mixed nuts daily boosts immunity<br>&#10003; Sleep 7–8 hours — body repairs while you sleep<br>&#10003; Walk 30 min after meals for better digestion<br>&#10003; Replace white rice/bread with millets &amp; brown rice</div>
        </div>
      </div>
    </div>

    <!-- Your Body Matrix -->
    <div id="dietSubTab-bodymatrix" style="display:none">
      <div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:16px">
        <h3 style="margin:0 0 14px;color:#1B5E20;font-size:15px;font-weight:700">&#9878;&#65039; Your Body Metrics</h3>
        <div style="margin-bottom:12px">
          <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">&#128100; Person Name</label>
          <input id="dietName" type="text" placeholder="e.g. Ravi, Priya, Amma..." style="width:100%;max-width:320px;padding:11px 14px;border-radius:9px;border:1.5px solid #C8E6C9;font-size:14px;outline:none;box-sizing:border-box"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;flex-wrap:wrap">
          <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">Height (cm)</label><input id="dietHeight" type="number" placeholder="e.g. 168" min="100" max="250" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #C8E6C9;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">Weight (kg)</label><input id="dietWeight" type="number" placeholder="e.g. 72" min="20" max="300" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #C8E6C9;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">Goal</label><select id="dietGoal" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #C8E6C9;font-size:13px;outline:none;background:#fff"><option value="lose">Lose Weight</option><option value="maintain" selected>Maintain</option><option value="gain">Gain / Build Muscle</option></select></div>
          <button onclick="calcBMIAndPlan()" style="padding:11px 22px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">&#128269; Generate Plan</button>
        </div>
        <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;background:#F9FBF9;border-radius:8px;border:1px solid #E8F5E9">
          <span style="font-size:12px;font-weight:600;color:#555;white-space:nowrap">&#129367; Diet Type:</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="diet-type-btn" onclick="setDietTypeFilter('all',this)" style="padding:7px 14px;border-radius:18px;border:none;cursor:pointer;font-size:12px;font-weight:700;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff">&#127869;&#65039; All Types</button>
            <button class="diet-type-btn" onclick="setDietTypeFilter('veg',this)" style="padding:7px 14px;border-radius:18px;border:1.5px solid #C8E6C9;cursor:pointer;font-size:12px;font-weight:700;background:#fff;color:#2E7D32">&#127807; Veg</button>
            <button class="diet-type-btn" onclick="setDietTypeFilter('nonveg',this)" style="padding:7px 14px;border-radius:18px;border:1.5px solid #C8E6C9;cursor:pointer;font-size:12px;font-weight:700;background:#fff;color:#2E7D32">&#127831; Non-Veg</button>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 12px;background:#F9FBF9;border-radius:8px;border:1px solid #E8F5E9">
          <div style="min-width:160px"><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px">&#127919; Target Weight (kg) <span style="font-weight:400;color:#aaa;font-size:11px">(optional)</span></label><input id="dietTargetWeight" type="number" placeholder="e.g. 65" min="20" max="250" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #C8E6C9;font-size:13px;outline:none;box-sizing:border-box"/></div>
          <div style="font-size:12px;color:#777;line-height:1.5;flex:1;min-width:140px">Set your goal weight to track monthly progress and estimate your journey timeline.</div>
        </div>
        <div id="bmiResult" style="display:none;margin-top:16px;padding:14px 18px;border-radius:10px;background:#F1F8E9;border:1.5px solid #AED581">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
            <div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#1B5E20" id="bmiValue">--</div><div style="font-size:11px;color:#555;font-weight:600">BMI</div></div>
            <div style="width:1px;background:#AED581;align-self:stretch"></div>
            <div><div style="font-size:14px;font-weight:700;color:#1B5E20" id="bmiCategory">--</div><div style="font-size:12px;color:#555" id="bmiAdvice">--</div><div id="bmiMotivation" style="font-size:11px;color:#2E7D32;margin-top:5px;font-style:italic;font-weight:600"></div></div>
            <div style="margin-left:auto;display:flex;gap:14px;flex-wrap:wrap">
              <div style="text-align:center"><div style="font-size:16px;font-weight:800;color:#E65100" id="bmiCalories">--</div><div style="font-size:10px;color:#777">kcal/day</div></div>
              <div style="text-align:center"><div style="font-size:16px;font-weight:800;color:#1565C0" id="bmiProtein">--</div><div style="font-size:10px;color:#777">g protein</div></div>
              <div style="text-align:center"><div style="font-size:16px;font-weight:800;color:#6A1B9A" id="bmiCarbs">--</div><div style="font-size:10px;color:#777">g carbs</div></div>
              <div style="text-align:center"><div style="font-size:16px;font-weight:800;color:#2E7D32" id="bmiFat">--</div><div style="font-size:10px;color:#777">g fat</div></div>
            </div>
          </div>
          <div style="margin-top:12px">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#777;margin-bottom:3px"><span>Underweight &lt;18.5</span><span>Normal 18.5–25</span><span>Overweight 25–30</span><span>Obese &#8805;30</span></div>
            <div style="height:8px;border-radius:4px;background:linear-gradient(to right,#42A5F5,#66BB6A,#FFA726,#EF5350);position:relative"><div id="bmiMarker" style="position:absolute;top:-4px;width:16px;height:16px;background:#fff;border:3px solid #333;border-radius:50%;transform:translateX(-50%);left:50%;transition:left .5s"></div></div>
          </div>
        </div>
        <div id="dietPlanOutput" style="display:none;margin-top:20px">
          <h4 style="margin:0 0 10px;color:#1B5E20">Personalised Meal Plan</h4>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
            <button class="diet-slot-btn" id="dslot-breakfast" onclick="showDietSlot('breakfast',this)" style="padding:9px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none">&#9728;&#65039; Breakfast</button>
            <button class="diet-slot-btn" id="dslot-lunch" onclick="showDietSlot('lunch',this)" style="padding:9px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#2E7D32;border:1.5px solid #C8E6C9">&#127807; Lunch</button>
            <button class="diet-slot-btn" id="dslot-dinner" onclick="showDietSlot('dinner',this)" style="padding:9px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#2E7D32;border:1.5px solid #C8E6C9">&#127769; Dinner</button>
            <button class="diet-slot-btn" id="dslot-snacks" onclick="showDietSlot('snacks',this)" style="padding:9px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#2E7D32;border:1.5px solid #C8E6C9">&#129372; Snacks</button>
          </div>
          <div id="dietMealGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px"></div>
        </div>
        <div id="dietSavePanel" style="display:none;margin-top:20px;gap:10px;flex-wrap:wrap;align-items:center">
          <button onclick="saveDietPlan()" style="padding:12px 24px;background:linear-gradient(135deg,#1B5E20,#43A047);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">&#128190; Save This Plan</button>
          <button onclick="addAnotherDietPerson()" style="padding:12px 22px;background:#FFF3E0;color:#E65100;border:1.5px solid #FFCC80;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">+ Add Another Person</button>
        </div>
      </div>
      <div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.07)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
          <h3 style="margin:0;color:#1B5E20;font-size:15px;font-weight:700">&#128106; Family Diet Members</h3>
          <button id="dietBudgetBtn" onclick="requestDietBudget()" style="display:none;padding:9px 18px;background:linear-gradient(135deg,#C8604A,#E65100);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">&#128176; Request Budget</button>
        </div>
        <div id="dietMembersList"></div>
      </div>
    </div>

    <!-- 30 Days Plan & Track -->
    <div id="dietSubTab-track" style="display:none"></div>
  </div>`
}
