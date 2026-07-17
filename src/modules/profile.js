// ═══════════════════════════════════════════════════════
// MODULE: Profile Tab
// ═══════════════════════════════════════════════════════
import { state, setState } from '../state.js'
import { saveProfile as dbSaveProfile, submitFeedback as dbSubmitFeedback,
         loadQuotations, createQuotation } from '../supabase/db.js'
import { updatePassword } from '../auth.js'
import { MONTHS } from '../data/config.js'

// Module-level editable copy of family members
let _familyMembers = []
let _fbRating = 0

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
export function renderProfile(el) {
  el.innerHTML = getProfileHTML()
  populateProfileForm()
  loadMyRequests()
}

function populateProfileForm() {
  const prof = state.profile || {}
  function sv(id, val) {
    const el = document.getElementById(id)
    if (el) el.value = val || ''
  }
  sv('profName', prof.full_name)
  sv('profEmail', state.currentUser?.email)
  sv('profPhone', prof.phone)
  sv('profDob', prof.date_of_birth)
  sv('profFlat', prof.flat)
  sv('profStreet', prof.street)
  sv('profArea', prof.area)
  sv('profCity', prof.city)
  sv('profState', prof.state)
  sv('profPin', prof.pin_code)
  sv('profMapLink', prof.map_link)

  _familyMembers = (state.familyMembers || []).map(m => ({ ...m }))
  renderFamilyMembersGrid()

  _fbRating = 0
  setFbRating(0)

  // Family photo
  const photoUrl = prof.photo_url || ''
  window._pendingPhoto = photoUrl
  window._pendingPhotoX = prof.photo_x ?? 50
  window._pendingPhotoY = prof.photo_y ?? 50
  const pPrev = document.getElementById('profPhotoPreview')
  const pDef  = document.getElementById('profPhotoDefault')
  const pRmv  = document.getElementById('profPhotoRemoveBtn')
  if (pPrev) { pPrev.src = photoUrl; pPrev.style.display = photoUrl ? 'block' : 'none' }
  if (pDef)    pDef.style.display = photoUrl ? 'none' : 'block'
  if (pRmv)    pRmv.style.display = photoUrl ? 'inline-flex' : 'none'

  const xSl = document.getElementById('profPhotoX')
  const ySl = document.getElementById('profPhotoY')
  const xLb = document.getElementById('profPhotoXVal')
  const yLb = document.getElementById('profPhotoYVal')
  if (xSl) xSl.value = window._pendingPhotoX
  if (ySl) ySl.value = window._pendingPhotoY
  if (xLb) xLb.textContent = window._pendingPhotoX + '%'
  if (yLb) yLb.textContent = window._pendingPhotoY + '%'
  if (pPrev) pPrev.style.objectPosition = window._pendingPhotoX + '% ' + window._pendingPhotoY + '%'

  const posCtrl = document.getElementById('photoPosControls')
  if (posCtrl) posCtrl.style.display = photoUrl ? 'block' : 'none'

  updateMapLinkPreview()
}

// ─────────────────────────────────────────────
// ACCORDION
// ─────────────────────────────────────────────
function toggleProfileSection(id) {
  const body = document.getElementById('profSec_' + id)
  const arr  = document.getElementById('profSecArr_' + id)
  if (!body) return
  const isOpen = body.style.display !== 'none'
  body.style.display = isOpen ? 'none' : 'block'
  if (arr) arr.innerHTML = isOpen ? '&#9660;' : '&#9650;'
}
window.toggleProfileSection = toggleProfileSection

// ─────────────────────────────────────────────
// FAMILY MEMBERS GRID
// ─────────────────────────────────────────────
function renderFamilyMembersGrid() {
  const grid  = document.getElementById('familyMembersGrid')
  const noMsg = document.getElementById('noFamilyMsg')
  if (!grid) return
  grid.innerHTML = ''
  if (!_familyMembers.length) { if (noMsg) noMsg.style.display = 'block'; return }
  if (noMsg) noMsg.style.display = 'none'
  const rels = ['Husband','Wife','Father','Mother','Son','Daughter','Brother','Sister','Grandfather','Grandmother','Other']
  _familyMembers.forEach(function(m, idx) {
    const row = document.createElement('div')
    row.style.cssText = 'padding:12px 14px;background:#FFF5EF;border-radius:10px;border:1px solid #F5D0C0'
    const opts = rels.map(r => `<option value="${r}"${m.relation===r?' selected':''}>${r}</option>`).join('')
    const isNormal = !m.menu_type || m.menu_type === 'family'
    const waOn = m.whatsapp_enabled ? true : false
    row.innerHTML =
      `<div style="display:grid;grid-template-columns:1fr 1fr 100px auto;gap:10px;align-items:end;margin-bottom:10px">
        <div><label style="font-size:11px;font-weight:600;color:#8B5E52;display:block;margin-bottom:4px">Name</label>
        <input type="text" value="${(m.name||'').replace(/"/g,'&quot;')}" placeholder="Member name"
          style="width:100%;padding:8px 10px;border-radius:7px;border:1.5px solid #E8D5C4;font-size:13px;outline:none;box-sizing:border-box"
          oninput="_familyMembersEdit[${idx}].name=this.value"/></div>
        <div><label style="font-size:11px;font-weight:600;color:#8B5E52;display:block;margin-bottom:4px">Relation</label>
        <select style="width:100%;padding:8px 10px;border-radius:7px;border:1.5px solid #E8D5C4;font-size:13px;outline:none;box-sizing:border-box;background:#fff"
          onchange="_familyMembersEdit[${idx}].relation=this.value">${opts}</select></div>
        <div><label style="font-size:11px;font-weight:600;color:#8B5E52;display:block;margin-bottom:4px">Age</label>
        <input type="number" min="0" max="120" value="${m.age||''}" placeholder="Age"
          style="width:100%;padding:8px 10px;border-radius:7px;border:1.5px solid #E8D5C4;font-size:13px;outline:none;box-sizing:border-box"
          oninput="_familyMembersEdit[${idx}].age=this.value"/></div>
        <div><button onclick="removeFamilyMember(${idx})"
          style="padding:9px 13px;background:#FBE9E7;color:#C62828;border:1.5px solid #FFCDD2;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700">&#215;</button></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding-top:10px;border-top:1px dashed #F5D0C0">
        <div><label style="font-size:11px;font-weight:600;color:#8B5E52;display:block;margin-bottom:4px">&#128241; Mobile (WhatsApp)</label>
        <input type="tel" value="${m.whatsapp||''}" placeholder="+91 98765 43210"
          style="width:100%;padding:7px 10px;border-radius:7px;border:1.5px solid #E8D5C4;font-size:13px;outline:none;box-sizing:border-box"
          oninput="_familyMembersEdit[${idx}].whatsapp=this.value"/></div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:center">
          <label style="font-size:11px;font-weight:600;color:#8B5E52">&#127869;&#65039; Menu Type</label>
          <div style="display:flex;gap:3px">
            <button onclick="setFamilyMenuType(${idx},'family')"
              style="padding:5px 9px;font-size:11px;font-weight:700;border-radius:6px;border:1.5px solid ${isNormal?'#2E7D32':'#E8D5C4'};cursor:pointer;background:${isNormal?'#2E7D32':'transparent'};color:${isNormal?'#fff':'#8B5E52'}">Normal</button>
            <button onclick="setFamilyMenuType(${idx},'diet')"
              style="padding:5px 9px;font-size:11px;font-weight:700;border-radius:6px;border:1.5px solid ${isNormal?'#E8D5C4':'#1B5E20'};cursor:pointer;background:${isNormal?'transparent':'#1B5E20'};color:${isNormal?'#8B5E52':'#fff'}">&#129361; Diet</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:center">
          <label style="font-size:11px;font-weight:600;color:#8B5E52">&#128242; WA Enable</label>
          <div onclick="toggleFamilyWA(${idx})"
            style="width:44px;height:24px;border-radius:12px;background:${waOn?'#25D366':'#ccc'};cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">
            <div style="position:absolute;top:2px;left:${waOn?'22':'2'}px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
          </div>
        </div>
      </div>`
    grid.appendChild(row)
  })
  // expose editable array globally for inline oninput handlers
  window._familyMembersEdit = _familyMembers
}

window.setFamilyMenuType = function(idx, type) { _familyMembers[idx].menu_type = type; renderFamilyMembersGrid() }
window.toggleFamilyWA    = function(idx) { _familyMembers[idx].whatsapp_enabled = !_familyMembers[idx].whatsapp_enabled; renderFamilyMembersGrid() }
window.addFamilyMember   = function()    { _familyMembers.push({ name:'', relation:'Other', age:'', menu_type:'family', whatsapp:'', whatsapp_enabled:false }); renderFamilyMembersGrid() }
window.removeFamilyMember= function(idx) { _familyMembers.splice(idx,1); renderFamilyMembersGrid() }

// ─────────────────────────────────────────────
// SAVE PROFILE
// ─────────────────────────────────────────────
window.saveProfile = async function() {
  function g(id) { const el = document.getElementById(id); return (el ? el.value || '' : '').trim() }
  const profileData = {
    full_name: g('profName'),
    phone: g('profPhone'),
    date_of_birth: g('profDob') || null,
    flat: g('profFlat'),
    street: g('profStreet'),
    area: g('profArea'),
    city: g('profCity'),
    state: g('profState'),
    pin_code: g('profPin'),
    map_link: g('profMapLink'),
    photo_url: window._pendingPhoto || '',
    photo_x: window._pendingPhotoX ?? 50,
    photo_y: window._pendingPhotoY ?? 50,
  }
  await dbSaveProfile(profileData)
  setState('profile', { ...state.profile, ...profileData })

  // Save family members
  const toSave = _familyMembers.filter(m => (m.name || '').trim())
  setState('familyMembers', toSave)
  // Upsert each family member (handled separately in preferences module)

  showToast('&#10003; Profile saved!')
  updateHeaderGreet()
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD (Supabase auth)
// ─────────────────────────────────────────────
window.changePassword = async function() {
  const cur = (document.getElementById('pwdCurrent')?.value || '')
  const nw  = (document.getElementById('pwdNew')?.value || '')
  const cf  = (document.getElementById('pwdConfirm')?.value || '')
  const pe  = document.getElementById('pwdError')
  function showPwdErr(msg) { if (pe) { pe.textContent = msg; pe.style.display = 'block' } }
  if (pe) pe.style.display = 'none'
  if (!nw || !cf) { showPwdErr('Please fill in all password fields.'); return }
  if (nw.length < 6) { showPwdErr('New password must be at least 6 characters.'); return }
  if (nw !== cf) { showPwdErr('New password and confirm do not match.'); return }
  try {
    await updatePassword(nw)
    document.getElementById('pwdCurrent').value = ''
    document.getElementById('pwdNew').value = ''
    document.getElementById('pwdConfirm').value = ''
    showToast('&#10003; Password changed successfully!')
  } catch (e) {
    showPwdErr(e.message)
  }
}

// ─────────────────────────────────────────────
// PHOTO HANDLING
// ─────────────────────────────────────────────
window.handlePhotoUpload = function(input) {
  const file = input.files && input.files[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) { showToast('Photo must be under 3 MB.'); return }
  const reader = new FileReader()
  reader.onload = function(e) {
    const dataUrl = e.target.result
    window._pendingPhoto = dataUrl
    const pPrev = document.getElementById('profPhotoPreview')
    const pDef  = document.getElementById('profPhotoDefault')
    const pRmv  = document.getElementById('profPhotoRemoveBtn')
    if (pPrev) { pPrev.src = dataUrl; pPrev.style.display = 'block' }
    if (pDef)    pDef.style.display = 'none'
    if (pRmv)    pRmv.style.display = 'inline-flex'
    window._pendingPhotoX = 50; window._pendingPhotoY = 50
    const xSl = document.getElementById('profPhotoX'); const ySl = document.getElementById('profPhotoY')
    const xLb = document.getElementById('profPhotoXVal'); const yLb = document.getElementById('profPhotoYVal')
    if (xSl) xSl.value = 50; if (ySl) ySl.value = 50
    if (xLb) xLb.textContent = '50%'; if (yLb) yLb.textContent = '50%'
    if (pPrev) pPrev.style.objectPosition = '50% 50%'
    const posCtrl = document.getElementById('photoPosControls')
    if (posCtrl) posCtrl.style.display = 'block'
    showToast('&#10003; Photo selected. Adjust center if needed, then Save Profile.')
  }
  reader.readAsDataURL(file)
}

window.removeProfilePhoto = function() {
  window._pendingPhoto = ''
  const pPrev = document.getElementById('profPhotoPreview')
  const pDef  = document.getElementById('profPhotoDefault')
  const pRmv  = document.getElementById('profPhotoRemoveBtn')
  if (pPrev) { pPrev.src = ''; pPrev.style.display = 'none' }
  if (pDef)    pDef.style.display = 'block'
  if (pRmv)    pRmv.style.display = 'none'
  const posCtrl = document.getElementById('photoPosControls')
  if (posCtrl) posCtrl.style.display = 'none'
}

window.applyPhotoPosPreview = function() {
  const xSl = document.getElementById('profPhotoX')
  const ySl = document.getElementById('profPhotoY')
  const xv = xSl ? parseInt(xSl.value, 10) : 50
  const yv = ySl ? parseInt(ySl.value, 10) : 50
  const xLb = document.getElementById('profPhotoXVal'); const yLb = document.getElementById('profPhotoYVal')
  if (xLb) xLb.textContent = xv + '%'; if (yLb) yLb.textContent = yv + '%'
  const pPrev = document.getElementById('profPhotoPreview')
  if (pPrev) pPrev.style.objectPosition = xv + '% ' + yv + '%'
  window._pendingPhotoX = xv; window._pendingPhotoY = yv
}

// ─────────────────────────────────────────────
// HEADER UPDATE
// ─────────────────────────────────────────────
function updateHeaderGreet() {
  const helloEl = document.getElementById('hdrHello')
  if (helloEl) {
    const name = state.profile?.full_name || state.currentUser?.email?.split('@')[0] || 'Friend'
    helloEl.textContent = 'Hello, ' + name.split(' ')[0] + '!'
  }
}

// ─────────────────────────────────────────────
// MAP LINK
// ─────────────────────────────────────────────
function updateMapLinkPreview() {
  const val = (document.getElementById('profMapLink')?.value || '').trim()
  const linkEl = document.getElementById('profMapLinkOpen')
  if (linkEl) { linkEl.href = val || '#'; linkEl.style.display = val ? 'inline-block' : 'none' }
}
window.updateMapLinkPreview = updateMapLinkPreview

// ─────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────
function setFbRating(r) {
  _fbRating = r
  document.querySelectorAll('.fb-star').forEach(function(btn) {
    const br = parseInt(btn.getAttribute('data-r'), 10)
    btn.style.opacity = br <= r ? '1' : '0.3'
    btn.style.transform = br <= r ? 'scale(1.15)' : 'scale(1)'
  })
}
window.setFbRating = setFbRating

window.submitFeedback = async function() {
  const msg = (document.getElementById('fbMessage')?.value || '').trim()
  const cat = document.getElementById('fbCategory')?.value || 'general'
  if (!msg) { showToast('Please enter a message before submitting.'); return }
  await dbSubmitFeedback(cat, _fbRating, msg)
  const fm = document.getElementById('fbMessage'); if (fm) fm.value = ''
  _fbRating = 0; setFbRating(0)
  showToast('&#10003; Feedback submitted. Thank you!')
}

// ─────────────────────────────────────────────
// MY QUOTATION REQUESTS
// ─────────────────────────────────────────────
async function loadMyRequests() {
  const el = document.getElementById('myRequestsList')
  if (!el) return
  el.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa">Loading...</div>'
  const qs = await loadQuotations()
  if (!qs.length) {
    el.innerHTML = '<div style="text-align:center;padding:28px;color:#8B5E52;font-size:13px"><span style="font-size:32px">&#128203;</span><br><br>No grocery quotation requests yet.<br>Go to <b>Grocery</b> tab and click <b>Request Quotation</b>.</div>'
    return
  }
  el.innerHTML = qs.map(q => {
    const st = _qStatusStyle(q.status)
    const rd = new Date(q.requested_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    return `<div style="border:1.5px solid #F0DDD5;border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <div style="font-size:15px;font-weight:800;color:#5a3e36">${MONTHS[q.month]} ${q.year}</div>
          <div style="font-size:12px;color:#8B5E52;margin-top:2px">Requested: ${rd}</div>
          <div style="font-size:12px;color:#8B5E52;margin-top:1px">Items: ${(q.items||[]).length} ingredients</div>
        </div>
        <div style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${st.bg};color:${st.color}">${st.icon} ${_qStatusLabel(q.status)}</div>
      </div>
    </div>`
  }).join('')
}

function _qStatusLabel(s) {
  const m = { pending_admin:'Pending Admin Review', admin_approved:'Admin Approved', sent_to_shop:'Sent to Shop', quotation_received:'Quotation Received', user_approved:'User Approved', completed:'Completed', rejected:'Rejected' }
  return m[s] || s
}
function _qStatusStyle(s) {
  const m = {
    pending_admin:      { bg:'#FFF3E0', color:'#E65100', icon:'&#9203;' },
    admin_approved:     { bg:'#E3F2FD', color:'#1565C0', icon:'&#10003;' },
    sent_to_shop:       { bg:'#E8F5E9', color:'#2E7D32', icon:'&#128228;' },
    quotation_received: { bg:'#F3E5F5', color:'#6A1B9A', icon:'&#128203;' },
    user_approved:      { bg:'#E8EAF6', color:'#283593', icon:'&#128076;' },
    completed:          { bg:'#E8F5E9', color:'#1B5E20', icon:'&#9989;' },
    rejected:           { bg:'#FFEBEE', color:'#C62828', icon:'&#10007;' }
  }
  return m[s] || { bg:'#F5F5F5', color:'#555', icon:'&#8226;' }
}

// ─────────────────────────────────────────────
// TOAST HELPER (used here before app-wide toast is ready)
// ─────────────────────────────────────────────
function showToast(msg) {
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(msg); return
  }
  let t = document.getElementById('_toast')
  if (!t) { t = document.createElement('div'); t.id = '_toast'; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 22px;border-radius:24px;font-size:14px;z-index:99999;transition:opacity .3s;pointer-events:none'; document.body.appendChild(t) }
  t.innerHTML = msg; t.style.opacity = '1'
  clearTimeout(t._timer); t._timer = setTimeout(() => { t.style.opacity = '0' }, 3000)
}

// ─────────────────────────────────────────────
// HTML TEMPLATE
// ─────────────────────────────────────────────
function getProfileHTML() {
  return `
  <div>
    <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);border-radius:14px;padding:20px 24px;margin-bottom:16px;color:#fff;display:flex;align-items:center;gap:14px">
      <span style="font-size:36px">&#128100;</span>
      <div><h2 style="margin:0 0 4px;font-size:19px;font-weight:800">My Profile &amp; Family Details</h2>
        <p style="margin:0;font-size:12px;opacity:.85">Click any section below to expand it</p></div>
    </div>

    <!-- Personal Information -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('personalInfo')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128100;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Personal Information</h3>
        <span id="profSecArr_personalInfo" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_personalInfo" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Full Name</label>
            <input id="profName" type="text" placeholder="Your full name" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Email Address</label>
            <input id="profEmail" type="email" disabled style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box;background:#F9F9F9;color:#888"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Phone Number</label>
            <input id="profPhone" type="tel" placeholder="+91 00000 00000" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Date of Birth</label>
            <input id="profDob" type="date" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
        </div>
      </div>
    </div>

    <!-- Family Photo -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('familyPhoto')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128247;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Family Photo</h3>
        <span id="profSecArr_familyPhoto" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_familyPhoto" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap">
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0">
            <div style="width:110px;height:110px;border-radius:50%;overflow:hidden;border:3px solid #F5D0C0;background:#FFF0EB;display:flex;align-items:center;justify-content:center;cursor:pointer"
              onclick="document.getElementById('profPhotoInput').click()">
              <img id="profPhotoPreview" src="" alt="Family Photo" style="width:100%;height:100%;object-fit:cover;object-position:50% 50%;display:none"/>
              <span id="profPhotoDefault" style="font-size:38px">&#128106;</span>
            </div>
            <p style="font-size:10px;color:#aaa;margin:0;text-align:center">Click to change</p>
          </div>
          <div style="flex:1;min-width:200px">
            <p style="font-size:13px;color:#8B5E52;margin:0 0 12px">Upload your family photo. It appears in the app header.</p>
            <input type="file" id="profPhotoInput" accept="image/jpeg,image/png,image/webp" onchange="handlePhotoUpload(this)" style="display:none"/>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button onclick="document.getElementById('profPhotoInput').click()" style="padding:10px 20px;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">&#128247; Choose Photo</button>
              <button id="profPhotoRemoveBtn" onclick="removeProfilePhoto()" style="display:none;padding:10px 20px;background:#FBE9E7;color:#C62828;border:1.5px solid #FFCDD2;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer">&#128465; Remove Photo</button>
            </div>
            <p style="font-size:11px;color:#aaa;margin:8px 0 0">Supported: JPG, PNG, WebP &bull; Max 3MB</p>
            <div id="photoPosControls" style="display:none;margin-top:14px;padding:14px;background:#FFF5EF;border-radius:10px;border:1px solid #F5D0C0">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#8B5E52">&#127919; Adjust Photo Center</p>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="font-size:12px;color:#8B5E52;width:75px;flex-shrink:0">&#8596; Horizontal</span>
                <input type="range" id="profPhotoX" min="0" max="100" value="50" oninput="applyPhotoPosPreview()" style="flex:1;cursor:pointer"/>
                <span id="profPhotoXVal" style="font-size:12px;color:#8B5E52;width:32px;text-align:right;font-family:monospace">50%</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:12px;color:#8B5E52;width:75px;flex-shrink:0">&#8597; Vertical</span>
                <input type="range" id="profPhotoY" min="0" max="100" value="50" oninput="applyPhotoPosPreview()" style="flex:1;cursor:pointer"/>
                <span id="profPhotoYVal" style="font-size:12px;color:#8B5E52;width:32px;text-align:right;font-family:monospace">50%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Home Address -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('homeAddress')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#127968;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Home Address</h3>
        <span id="profSecArr_homeAddress" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_homeAddress" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Flat / House No. &amp; Building Name</label>
            <input id="profFlat" type="text" placeholder="e.g., Flat 4B, Sunrise Apartments" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Street / Road Name</label>
            <input id="profStreet" type="text" placeholder="e.g., 12, Anna Nagar Main Road" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Area / Locality / Landmark</label>
            <input id="profArea" type="text" placeholder="e.g., Near Bus Stand, T. Nagar" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 140px;gap:12px">
            <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">City / Town</label>
              <input id="profCity" type="text" placeholder="e.g., Chennai" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
            <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">State</label>
              <input id="profState" type="text" placeholder="e.g., Tamil Nadu" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
            <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">PIN Code</label>
              <input id="profPin" type="text" maxlength="6" placeholder="600001" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box;font-family:monospace"/></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Location -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('location')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128205;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Current Location</h3>
        <span id="profSecArr_location" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_location" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <p style="font-size:13px;color:#8B5E52;margin:0 0 12px">Paste a Google Maps share link to save your delivery location.</p>
        <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">
            <label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Google Maps Share Link</label>
            <input id="profMapLink" type="url" placeholder="https://maps.app.goo.gl/..." oninput="updateMapLinkPreview()"
              style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:13px;outline:none;box-sizing:border-box;font-family:monospace"/>
          </div>
          <div style="padding-top:22px">
            <a id="profMapLinkOpen" href="#" target="_blank" style="display:none;padding:11px 18px;background:linear-gradient(135deg,#1565C0,#1976D2);color:#fff;border-radius:9px;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap">&#128205; Open in Maps</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Family Members -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('familyMembers')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128106;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Family Members</h3>
        <button onclick="event.stopPropagation();addFamilyMember()" style="padding:6px 14px;background:#2E7D32;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;margin-right:8px">+ Add</button>
        <span id="profSecArr_familyMembers" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_familyMembers" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div id="familyMembersGrid" style="display:flex;flex-direction:column;gap:10px"></div>
        <p id="noFamilyMsg" style="text-align:center;color:#8B5E52;font-size:13px;padding:24px 0;margin:0">No family members added yet. Click &quot;+ Add&quot; to start.</p>
      </div>
    </div>

    <!-- Save Profile -->
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:0 0 4px;margin-bottom:10px">
      <button onclick="saveProfile()" style="padding:13px 36px;background:linear-gradient(135deg,#1B5E20,#2E7D32);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">&#128190; Save Profile</button>
      <p style="font-size:12px;color:#999;margin:0">Profile saved to your account in the cloud.</p>
    </div>

    <!-- Change Password -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('password')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128274;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Change Password</h3>
        <span id="profSecArr_password" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_password" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">New Password</label>
            <input id="pwdNew" type="password" placeholder="New password (min 6 chars)" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Confirm New Password</label>
            <input id="pwdConfirm" type="password" placeholder="Confirm new password" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box"/></div>
        </div>
        <div id="pwdError" style="display:none;background:#FBE9E7;color:#C62828;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:12px"></div>
        <button onclick="changePassword()" style="padding:12px 28px;background:linear-gradient(135deg,#C62828,#E53935);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">&#128274; Change Password</button>
      </div>
    </div>

    <!-- Feedback & Suggestions -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:10px;overflow:hidden">
      <div onclick="toggleProfileSection('feedback')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128172;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">Feedback &amp; Suggestions</h3>
        <span id="profSecArr_feedback" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_feedback" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <p style="font-size:12px;color:#8B5E52;margin:0 0 18px">Your message goes directly to the admin. Help us improve Jeevamithran!</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Category</label>
            <select id="fbCategory" style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box;background:#fff;color:#5a3e36">
              <option value="general">General Feedback</option>
              <option value="meal_plan">Meal Planning</option>
              <option value="recipe">Recipe / Food</option>
              <option value="grocery">Grocery &amp; Shopping</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug / Issue</option>
            </select></div>
          <div><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Rating (tap a star)</label>
            <div style="display:flex;gap:6px;padding:8px 0">
              <button onclick="setFbRating(1)" class="fb-star" data-r="1" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:.3;padding:0;transition:.15s">&#11088;</button>
              <button onclick="setFbRating(2)" class="fb-star" data-r="2" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:.3;padding:0;transition:.15s">&#11088;</button>
              <button onclick="setFbRating(3)" class="fb-star" data-r="3" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:.3;padding:0;transition:.15s">&#11088;</button>
              <button onclick="setFbRating(4)" class="fb-star" data-r="4" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:.3;padding:0;transition:.15s">&#11088;</button>
              <button onclick="setFbRating(5)" class="fb-star" data-r="5" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:.3;padding:0;transition:.15s">&#11088;</button>
            </div></div>
        </div>
        <div style="margin-bottom:16px"><label style="font-size:12px;font-weight:600;color:#8B5E52;display:block;margin-bottom:5px">Your Message</label>
          <textarea id="fbMessage" rows="4" placeholder="Share your thoughts, suggestions or report an issue..."
            style="width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E8D5C4;font-size:14px;outline:none;box-sizing:border-box;resize:vertical;font-family:inherit"></textarea></div>
        <button onclick="submitFeedback()" style="padding:12px 28px;background:linear-gradient(135deg,#1565C0,#1976D2);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">&#128232; Submit to Admin</button>
      </div>
    </div>

    <!-- My Requests -->
    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(200,96,74,.08);margin-bottom:16px;overflow:hidden">
      <div onclick="toggleProfileSection('myRequests')" style="display:flex;align-items:center;gap:10px;padding:16px 20px;cursor:pointer;user-select:none">
        <span style="font-size:20px">&#128203;</span>
        <h3 style="margin:0;color:#C8604A;font-size:15px;font-weight:700;flex:1">My Grocery Requests</h3>
        <span id="profSecArr_myRequests" style="font-size:13px;color:#C8604A">&#9660;</span>
      </div>
      <div id="profSec_myRequests" style="display:none;padding:0 20px 20px;border-top:1.5px solid #F5EDE8">
        <div style="height:16px"></div>
        <div id="myRequestsList"></div>
      </div>
    </div>

  </div>`
}
