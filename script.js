/**
 * Easy Laundry v2.0 — Script.js
 * ХААИС угаалгын цаг захиалгын систем
 * @version 2.0.0
 */

const VERSION = '2.0.0';
const DEBUG   = false;
function dLog(...a) { if (DEBUG) console.log('[EL]', ...a); }

// ─── DATABASE ───
const DB = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getUsers:        () => DB.get('el_users')        || [],
  saveUsers:       (u) => DB.set('el_users', u),
  getBookings:     () => DB.get('el_bookings')     || [],
  saveBookings:    (b) => DB.set('el_bookings', b),
  getCurrentUser:  () => DB.get('el_current_user'),
  setCurrentUser:  (u) => DB.set('el_current_user', u),
  clearCurrentUser:() => localStorage.removeItem('el_current_user'),
  getLocations:    () => DB.get('el_locations'),
  getMachines:     () => DB.get('el_machines'),
};

const getContactMessages = () => DB.get('el_contact_messages') || [];
const saveContactMessages = (msgs) => DB.set('el_contact_messages', msgs);

const DEFAULT_PAYMENT_SETTINGS = {
  price: 2000, enabled: true,
  methods: { qpay: true, card: true, transfer: true },
  qpay: { merchantName: 'Easy Laundry ХААИС', invoiceCode: 'EASY_LAUNDRY_HUUCHIN' },
  bankAccount: { bank: 'Хаан Банк', name: 'Easy Laundry ХААИС', number: '5000123456', note: 'Угаалгын захиалга' }
};
function getPaymentSettings() { return DB.get('el_payment_settings') || DEFAULT_PAYMENT_SETTINGS; }

const MONGOLIAN_BANKS = [
  { short: 'Khan',    color: '#003F87', deep: 'khanbank://q?qPay_QRcode=', icon: '🏦' },
  { short: 'Голомт',  color: '#1A1464', deep: 'golomtbank://q?qPay_QRcode=', icon: '🏛️' },
  { short: 'ХХБ',     color: '#C8102E', deep: 'tdbm://q?qPay_QRcode=', icon: '🏦' },
  { short: 'Хас',     color: '#E31837', deep: 'xacbank://q?qPay_QRcode=', icon: '🏦' },
  { short: 'Төрийн',  color: '#006633', deep: 'statebank://q?qPay_QRcode=', icon: '🏛️' },
];

const LG_MODEL = {
  name: 'LG Smart Choice', capacity: '9 кг', rating: '5 Star',
  tech: 'AI Direct Drive + Steam',
  features: ['6 Motion DD', 'Wi-Fi холболт', 'Автомат угаалга'],
  duration: 45,
  modes: JSON.parse(localStorage.getItem('el_machine_modes')) || [
    { id: 'mode1', name: 'Цайвар', capacity: '9 кг', duration: 80, water: 70, electricity: 1.5, price: 6000 },
    { id: 'mode2', name: 'Хурдан', capacity: '9 кг', duration: 52, water: 70, electricity: 1.5, price: 3000 },
    { id: 'mode3', name: 'Цайвар', capacity: '9 кг', duration: 80, water: 70, electricity: 1.5, price: 6000 },
    { id: 'mode4', name: 'Хурдан', capacity: '9 кг', duration: 50, water: 70, electricity: 1.5, price: 3000 }
  ]
};

const DEFAULT_LOCATIONS = [
  { id: '1', name: 'ХААИС — 1-р байр', icon: '🏢', address: 'Зайсан, Улаанбаатар', machineCount: 3, active: true },
  { id: '2', name: 'ХААИС — 2-р байр', icon: '🏛️', address: 'Зайсан, Улаанбаатар', machineCount: 2, active: true },
  { id: '3', name: 'ХААИС — 3-р байр', icon: '🏠', address: 'Зайсан, Улаанбаатар', machineCount: 3, active: true },
];

const DEFAULT_MACHINES = [
  { id: 'm1', locId: '1', name: 'Машин №1', status: 'free',        progress: 0,  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm2', locId: '1', name: 'Машин №2', status: 'busy',        progress: 60, remaining: '27 мин', model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm3', locId: '1', name: 'Машин №3', status: 'free',        progress: 0,  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm4', locId: '2', name: 'Машин №1', status: 'free',        progress: 0,  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm5', locId: '2', name: 'Машин №2', status: 'soon',        progress: 88, remaining: '8 мин',  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm6', locId: '3', name: 'Машин №1', status: 'busy',        progress: 40, remaining: '32 мин', model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm7', locId: '3', name: 'Машин №2', status: 'free',        progress: 0,  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
  { id: 'm8', locId: '3', name: 'Машин №3', status: 'maintenance', progress: 0,  model: LG_MODEL.name, capacity: LG_MODEL.capacity },
];

function initData() {
  if (!DB.getLocations()) DB.set('el_locations', DEFAULT_LOCATIONS);
  if (!DB.getMachines())  DB.set('el_machines',  DEFAULT_MACHINES);
}
initData();

// ─── GET LATEST MODES FROM LOCALSTORAGE ───
function getLatestModes() {
  const modes = DB.get('el_machine_modes');
  if (modes && Array.isArray(modes) && modes.length > 0) {
    return modes;
  }
  return LG_MODEL.modes;
}

function getTakenSlots(date, machineId) {
  const bookings = DB.getBookings();
  return bookings
    .filter(b => b.date === date && b.machine && b.machine.includes && b.machine.includes(machineId))
    .map(b => b.time)
    .filter(t => t);
}

function getLocations() { return DB.getLocations() || DEFAULT_LOCATIONS; }
function getMachines()  { return DB.getMachines()  || DEFAULT_MACHINES; }

// ─── STATE ───
let currentStep = 1;
let booking = { location: null, machine: null, mode: null, date: null, time: null };
let cancelTarget     = null;
let currentQRData    = null;
let selectedPayMethod = 'qpay';

const timeSlots  = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const takenSlots = ['09:00','10:30','13:00','15:00'];
const today = new Date();
const dates  = Array.from({ length: 5 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });

function formatDate(d) {
  const days = ['Ня','Да','Мя','Лх','Пү','Ба','Бя'];
  return days[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
}
function isSunday(d) { return d.getDay() === 0; }

// ─── NAV ───
function smoothNav(hash) {
  const el = document.querySelector(hash);
  if (el) { history.pushState({ section: hash }, '', hash); el.scrollIntoView({ behavior: 'smooth' }); }
}
function scrollToBooking() {
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.section) {
    const el = document.querySelector(e.state.section);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
});

// ─── QR ───
function generateQR(containerId, text, size) {
  size = size || 128;
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  try {
    new QRCode(el, { text, width: size, height: size, colorDark: '#0A1628', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
  } catch (e) {
    el.innerHTML = '<div style="width:'+size+'px;height:'+size+'px;background:#EEF2FF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#8B93B8;text-align:center;padding:8px;">QR алдаа</div>';
  }
}
function showQRModal(code, title, desc) {
  document.getElementById('qrModalTitle').textContent = title;
  document.getElementById('qrModalDesc').textContent  = desc;
  document.getElementById('qrModalCode').textContent  = code;
  document.getElementById('qrModalContainer').innerHTML = '';
  currentQRData = { code, title };
  try { new QRCode(document.getElementById('qrModalContainer'), { text: 'https://easy-laundry.mn/verify/'+code, width:200, height:200, colorDark:'#0A1628', colorLight:'#FFFFFF', correctLevel: QRCode.CorrectLevel.M }); } catch(e) {}
  document.getElementById('qrModal').classList.add('open');
}
function closeQRModal() { document.getElementById('qrModal').classList.remove('open'); }
function downloadQRModal() {
  const canvas = document.querySelector('#qrModalContainer canvas');
  if (!canvas) return showToast('QR код олдсонгүй', 'error');
  const a = document.createElement('a');
  a.download = 'easy-laundry-qr-' + (currentQRData ? currentQRData.code : 'code') + '.png';
  a.href = canvas.toDataURL(); a.click();
  showToast('QR код хадгалагдлаа! 📥');
}

// ─── TOAST ───
function showToast(msg, type) {
  type = type || 'success';
  const t = document.getElementById('toast');
  t.innerHTML = (type==='success'?'✓':'✕') + ' ' + msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── MODALS ───
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ─── AUTH ───
let activeTab = 'login';
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('login-form').style.display    = tab==='login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab==='register' ? 'block' : 'none';
  document.querySelectorAll('.modal-tab').forEach((t,i) => {
    const sel = (i===0&&tab==='login')||(i===1&&tab==='register');
    t.classList.toggle('active', sel);
    t.setAttribute('aria-selected', sel ? 'true' : 'false');
  });
}
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  let ok = true;
  if (!validateEmail(email)) { showErr('login-email-err','login-email'); ok=false; }
  if (!pass)                  { showErr('login-pass-err', 'login-pass');  ok=false; }
  if (!ok) return;
  const user = DB.getUsers().find(u => u.email===email && u.password===pass);
  if (!user) { showErr('login-email-err','login-email','Имэйл эсвэл нууц үг буруу'); return showToast('Нэвтрэх мэдээлэл буруу', 'error'); }
  DB.setCurrentUser(user); closeModal('authModal'); updateUserUI(user);
  showToast('Тавтай морилно уу, ' + user.fname + '! 🎉');
}
function handleGoogleAuth() {
  const u = { fname:'Google', lname:'Хэрэглэгч', email:'google@muls.edu.mn', university:'ХААИС', id:'g_'+Date.now() };
  DB.setCurrentUser(u); closeModal('authModal'); updateUserUI(u);
  showToast('Google-ээр амжилттай нэвтэрлээ! 🎉');
}
function handleRegister() {
  const fname = document.getElementById('reg-fname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  let ok = true;
  if (!fname)               { showErr('reg-fname-err','reg-fname'); ok=false; }
  if (!validateEmail(email)){ showErr('reg-email-err','reg-email'); ok=false; }
  if (pass.length < 8)      { showErr('reg-pass-err','reg-pass','8+ тэмдэгт'); ok=false; }
  if (!ok) return;
  const users = DB.getUsers();
  if (users.find(u => u.email===email)) return showToast('Энэ имэйл аль хэдийн бүртгэлтэй', 'error');
  const user = { id:Date.now().toString(), fname, lname:document.getElementById('reg-lname').value.trim(), email, university:'ХААИС', password:pass, createdAt:new Date().toISOString() };
  users.push(user); DB.saveUsers(users); DB.setCurrentUser(user);
  closeModal('authModal'); updateUserUI(user);
  showToast('Бүртгэл амжилттай! Тавтай морилно уу, ' + fname + '! 🎉');
}
function showErr(errId, inputId, msg) {
  const el=document.getElementById(errId), inp=document.getElementById(inputId);
  if (msg && el) el.textContent = msg;
  if (el)  el.classList.add('show');
  if (inp) inp.classList.add('error');
  setTimeout(() => { if(el) el.classList.remove('show'); if(inp) inp.classList.remove('error'); }, 3000);
}
function logout() {
  DB.clearCurrentUser();
  const bar=document.getElementById('userInfoBar'); if(bar) bar.classList.remove('show');
  const btn=document.getElementById('loginBtn');    if(btn) btn.style.display='';
  const sec=document.getElementById('myBookingsSection'); if(sec) sec.style.display='none';
  showToast('Амжилттай гарлаа');
}
function updateUserUI(user) {
  const bar=document.getElementById('userInfoBar'); if(bar) bar.classList.add('show');
  const btn=document.getElementById('loginBtn');    if(btn) btn.style.display='none';
  const nm=document.getElementById('userName');     if(nm)  nm.textContent=user.fname;
  const av=document.getElementById('userAvatar');   if(av)  av.textContent=user.fname.charAt(0).toUpperCase();
  const sec=document.getElementById('myBookingsSection');
  if (sec) {
    sec.style.display='block';
    const sk=document.getElementById('bookingListSkeleton'), li=document.getElementById('bookingList');
    if(sk) sk.style.display='flex';
    if(li) li.innerHTML='';
    setTimeout(() => { if(sk) sk.style.display='none'; renderMyBookings(); }, 300);
  }
}

// ─── HERO CARD ───
function renderHeroCard() {
  const locs = getLocations().filter(function(l) { return l.active; });
  const allM = getMachines();
  const loc  = locs[0];
  if (!loc) return;

  const freeCnt = allM.filter(function(m) { return m.status==='free'; }).length;
  const heroFree = document.getElementById('heroFreeCount');
  if (heroFree) heroFree.textContent = '🟢 ' + freeCnt + ' машин чөлөөтэй';

  const heroTitle = document.getElementById('heroCardTitle');
  if (heroTitle) heroTitle.textContent = loc.icon + ' ' + loc.name;

  const container = document.getElementById('heroMachineList');
  if (!container) return;
  const mList = allM.filter(function(m) { return m.locId===loc.id; }).slice(0,4);
  container.innerHTML = mList.map(function(m) {
    const canClick = m.status!=='busy' && m.status!=='maintenance';
    const fn = canClick ? "selectMachineFromHero('" + m.id + "')" : '';
    const timeText = m.status==='free' ? 'Одоо ашиглаж болно' : m.status==='maintenance' ? 'Засварт байна' : (m.remaining||'') + ' үлдсэн';
    const tagText  = m.status==='free' ? 'Чөлөөтэй' : m.status==='busy' ? 'Ашиглагдаж байна' : m.status==='maintenance' ? '🔧 Засвар' : 'Удахгүй';
    return '<div class="machine-item ' + m.status + '" onclick="' + fn + '">'
      + '<div class="machine-left"><span class="machine-emoji">🫧</span><div>'
      + '<div class="machine-name-text">' + m.name + '</div>'
      + '<div class="machine-time">' + timeText + '</div>'
      + '</div></div>'
      + '<span class="tag tag-' + m.status + '">' + tagText + '</span></div>';
  }).join('');
}

let _stepDir = 1;

/**
 * Animate panel with directional slide (Stepper component style)
 * @param {Function} cb - content render callback
 */
function animatePanel(cb) {
  const p = document.getElementById('bookingPanel');
  if (!p) return;

  const exitClass  = _stepDir >= 0 ? 'slide-exit-left'  : 'slide-exit-right';
  const enterClass = _stepDir >= 0 ? 'slide-enter-right' : 'slide-enter-left';

  // EXIT
  p.classList.add(exitClass);

  setTimeout(() => {
    // Render new content
    if (cb) cb();
    // Start enter
    p.classList.remove(exitClass);
    p.classList.add(enterClass);
    // Force reflow
    p.offsetHeight;
    p.classList.remove(enterClass);
  }, 220);
}

function renderStep1() {
  const locs=getLocations().filter(l=>l.active), allM=getMachines();
  return '<div class="booking-panel-title">🏢 Дотуур байр сонгоно уу</div>'
    +'<div class="booking-panel-sub">ХААИС-ийн 3 дотуур байраас угаалга хийх байраа сонгоно уу</div>'
    +'<div class="location-grid">'
    +locs.map(l=>{
      const mach=allM.filter(m=>m.locId===l.id), free=mach.filter(m=>m.status==='free').length;
      const sel=booking.location&&booking.location.id===l.id?' selected':'';
      return '<div class="loc-card'+sel+'" onclick="selectLocation(\''+l.id+'\')" role="button" tabindex="0">'
        +'<div class="loc-icon" aria-hidden="true">'+l.icon+'</div>'
        +'<div class="loc-name">'+l.name+'</div>'
        +'<div class="loc-address">'+(l.address||'')+'</div>'
        +'<div class="loc-machines-row">'+mach.map(m=>'<span class="loc-dot loc-dot-'+m.status+'" title="'+m.name+'"></span>').join('')+'</div>'
        +'<div class="loc-avail'+(free===0?' no-free':'')+'">'+( free>0?'✅ '+free+'/'+mach.length+' машин чөлөөтэй':'⏳ Бүх машин завгүй')+'</div>'
        +'</div>';
    }).join('')+'</div>'
}

function renderStep2() {
  const allM=getMachines();
  const mList=booking.location?allM.filter(m=>m.locId===booking.location.id):allM.slice(0,3);
  const C=2*Math.PI*18;
  return '<div class="booking-panel-title">🫧 Машин сонгоно уу</div>'
    +'<div class="booking-panel-sub">'+(booking.location?booking.location.name:'')+' — Чөлөөтэй машин сонгоно уу</div>'
    +'<div class="lg-info-banner"><div class="lg-icon" aria-hidden="true">⚙️</div><div>'
    +'<div class="lg-model">'+LG_MODEL.name+' · '+LG_MODEL.capacity+' · '+LG_MODEL.rating+'</div>'
    +'<div class="lg-tech">'+LG_MODEL.tech+' · '+LG_MODEL.features.join(' · ')+'</div>'
    +'</div></div>'
    +'<div class="machine-select-grid">'
    +mList.map(m=>{
      const isU=m.status==='busy'||m.status==='maintenance';
      const fn=isU?'':("selectMachine('"+m.id+"')");
      const sel=booking.machine&&booking.machine.id===m.id?' selected':'';
      const una=isU?' unavail':'';
      const tagLabel=m.status==='free'?'Чөлөөтэй':m.status==='busy'?'Ашиглагдаж байна':m.status==='maintenance'?'Засвар':'Удахгүй';
      const body=m.status==='free'?'Одоо захиалах боломжтой':m.status==='maintenance'?'Засвар үйлчилгээнд байна':(m.remaining||'')+' дараа чөлөөлөгдөнө';
      const prog=m.progress||0, doffset=C-(prog/100)*C, rc=m.status==='soon'?'#F59E0B':'#EF4444';
      const ring=(m.status==='busy'||m.status==='soon')
        ?'<div class="mach-ring-wrap"><svg class="mach-ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="ring-bg" cx="20" cy="20" r="18" stroke-width="4"/><circle class="ring-prog" cx="20" cy="20" r="18" stroke-width="4" stroke="'+rc+'" stroke-dasharray="'+C+'" stroke-dashoffset="'+doffset+'"/></svg><span class="mach-ring-label">'+Math.round(prog)+'%</span></div>'
        :'';
      return '<div class="mach-card'+sel+una+'" onclick="'+fn+'" role="button" tabindex="'+(isU?'-1':'0')+'" aria-disabled="'+(isU?'true':'false')+'">'
        +'<div class="mach-header"><span class="mach-name2">🫧 '+m.name+'</span><span class="tag tag-'+m.status+'">'+tagLabel+'</span></div>'
        +'<div class="mach-model-info">'+(m.model||LG_MODEL.name)+' · '+(m.capacity||LG_MODEL.capacity)+'</div>'
        +ring+'<div class="mach-body">'+body+'</div>'
        +'<div class="mach-prog-wrap"><div class="mach-prog '+m.status+'" style="width:'+prog+'%"></div></div>'
        +'</div>';
    }).join('')+'</div>'
}

function renderStep3Modes() {
  const modes = getLatestModes();
  return '<div class="booking-panel-title">⚙️ Угаалгын горим сонгоно уу</div>'
    +'<div class="booking-panel-sub">'+(booking.machine?booking.machine.name:'')+' — Тохиромжтой горим сонгоно уу</div>'
    +'<div class="mode-grid">'
    +modes.map(m=>{
      const sel=booking.mode&&booking.mode.id===m.id?' selected':'';
      return '<div class="mode-card'+sel+'" onclick="selectMode(\''+m.id+'\')" role="button" tabindex="0">'
        +'<div class="mode-header">'
          +'<div class="mode-name">🌀 '+m.name+' • '+(m.capacity||'9 кг')+'</div>'
          +'<div class="mode-price">'+m.price.toLocaleString()+'₮</div>'
        +'</div>'
        +'<div class="mode-details">'
          +'<div class="mode-detail">⏱ '+m.duration+' мин</div>'
          +'<div class="mode-detail">💧 '+m.water+'L ус</div>'
          +'<div class="mode-detail">⚡ '+m.electricity+'kWh цахилгаан</div>'
        +'</div>'
      +'</div>';
    }).join('')+'</div>'
}

function renderStep4DateTime() {
  const modeDuration = booking.mode ? booking.mode.duration : 45;
  const now=new Date();
  return '<div class="booking-panel-title">📅 Өдөр, цаг сонгоно уу</div>'
    +'<div class="booking-panel-sub">'+(booking.machine?booking.machine.name:'')+' — Тохиромжтой өдөр, цагаа сонгоно уу</div>'
    +'<div class="booking-duration-note">⏱ Угаалга үргэлжлэх хугацаа: <strong>'+modeDuration+' минут</strong></div>'
    +'<div class="booking-mode-selected" style="background:rgba(61,123,255,.08);border:1px solid rgba(61,123,255,.2);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:.85rem;">⚙️ <strong>Сонгосон горим:</strong> '+(booking.mode?booking.mode.name:' Горим сонгол хийнэ үү')+' — '+modeDuration+' мин, '+(booking.mode?(booking.mode.price.toLocaleString()+'₮'):' —')+'</div>'
    +'<div class="time-date-row">'
    +['Өнөөдөр','Маргааш'].map((d,i)=>{
      const sel=booking.date===d?' active':'';
      return '<button class="date-btn'+sel+'" onclick="selectDate(\''+d+'\')">'+d+'</button>';
    }).join('')+'</div>'
    +'<div class="time-grid" role="group" aria-label="Цагийн давхарга">'
    +timeSlots.map(t=>{
      const taken = booking.machine ? getTakenSlots(booking.date || 'Өнөөдөр', booking.machine.id).includes(t) : takenSlots.includes(t);
      const active=booking.time===t;
      return '<button class="time-slot'+(active?' active':'')+(taken?' taken':'')+'"'
        +(taken?' aria-disabled="true"':' aria-label="'+t+'"')+' onclick="'+(taken?'':("selectTime('"+t+"')"))+'">'
        +t+(taken?'<br/><span style="font-size:.6rem;">Дүүрэн</span>':'')+'</button>';
    }).join('')+'</div>'
}

function renderStep5Payment() {
  const s=getPaymentSettings(), price=booking.mode?booking.mode.price:s.price||2000, user=DB.getCurrentUser();
  const loc=booking.location?booking.location.name:'—', mach=booking.machine?booking.machine.name:'—', mode=booking.mode?booking.mode.name:'—';
  const dt=booking.date||'Өнөөдөр', tm=booking.time||'—';
  const bnum=s.bankAccount?.number||'5000123456', bname=s.bankAccount?.name||'Easy Laundry ХААИС', bbank=s.bankAccount?.bank||'Хаан Банк';
  const fname=user?user.fname:'';

  let qH='',cH='',tH='';
  if(s.methods?.qpay!==false) qH='<button class="pm-btn active" id="pm-qpay" onclick="selectPayMethod(\'qpay\')"><div class="pm-icon-wrap" aria-hidden="true">📱</div><div class="pm-name">QPay</div><div class="pm-sub">Бүх Монгол банк</div><div class="demo-badge">🧪 Demo горим</div></button>';
  if(s.methods?.card!==false) cH='<button class="pm-btn" id="pm-card" onclick="selectPayMethod(\'card\')"><div class="pm-icon-wrap" aria-hidden="true">💳</div><div class="pm-name">Карт</div><div class="pm-sub">Visa · Mastercard</div><div class="demo-badge">🧪 Demo горим</div></button>';
  if(s.methods?.transfer!==false) tH='<button class="pm-btn" id="pm-transfer" onclick="selectPayMethod(\'transfer\')"><div class="pm-icon-wrap" aria-hidden="true">🏦</div><div class="pm-name">Шилжүүлэг</div><div class="pm-sub">Данс руу</div><div class="demo-badge">🧪 Demo горим</div></button>';

  const modeDetailsHtml = booking.mode ? `
    <div style="background:linear-gradient(135deg,rgba(61,123,255,.06),rgba(99,102,241,.06));border:1px solid rgba(61,123,255,.15);border-radius:10px;padding:14px;margin-bottom:18px;">
      <div style="font-size:.75rem;font-weight:700;letter-spacing:.08em;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">⚙️ Угаалгын горимын дэлгэрэнгүй</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:rgba(255,255,255,.5);padding:8px;border-radius:6px;">
          <div style="font-size:.7rem;color:var(--text3);font-weight:600;">Нэр</div>
          <div style="font-size:.9rem;font-weight:700;margin-top:2px;">${booking.mode.name}</div>
        </div>
        <div style="background:rgba(255,255,255,.5);padding:8px;border-radius:6px;">
          <div style="font-size:.7rem;color:var(--text3);font-weight:600;">Үнэ</div>
          <div style="font-size:.9rem;font-weight:700;margin-top:2px;color:var(--blue);">${booking.mode.price.toLocaleString()}₮</div>
        </div>
        <div style="background:rgba(255,255,255,.5);padding:8px;border-radius:6px;">
          <div style="font-size:.7rem;color:var(--text3);font-weight:600;">⏱ Хугацаа</div>
          <div style="font-size:.9rem;font-weight:700;margin-top:2px;">${booking.mode.duration} мин</div>
        </div>
        <div style="background:rgba(255,255,255,.5);padding:8px;border-radius:6px;">
          <div style="font-size:.7rem;color:var(--text3);font-weight:600;">💧 Ус</div>
          <div style="font-size:.9rem;font-weight:700;margin-top:2px;">${booking.mode.water}L</div>
        </div>
        <div style="background:rgba(255,255,255,.5);padding:8px;border-radius:6px;">
          <div style="font-size:.7rem;color:var(--text3);font-weight:600;">⚡ Цахилгаан</div>
          <div style="font-size:.9rem;font-weight:700;margin-top:2px;">${booking.mode.electricity}kWh</div>
        </div>
      </div>
    </div>
  ` : '';

  return '<div class="booking-panel-title">💳 Баталгаажуулах & Төлбөр</div>'
    +'<div class="booking-panel-sub">Мэдээллээ шалгаад төлбөрийн аргаа сонгоод захиалгаа батлаарай</div>'
    +'<div class="confirm-summary">'
    +'<div class="confirm-row"><span class="confirm-key">🏢 Байр</span><span class="confirm-val">'+loc+'</span></div>'
    +'<div class="confirm-row"><span class="confirm-key">🫧 Машин</span><span class="confirm-val">'+mach+'</span></div>'
    +'<div class="confirm-row"><span class="confirm-key">⚙️ Горим</span><span class="confirm-val">'+mode+'</span></div>'
    +'<div class="confirm-row"><span class="confirm-key">📅 Огноо</span><span class="confirm-val">'+dt+'</span></div>'
    +'<div class="confirm-row"><span class="confirm-key">⏰ Цаг</span><span class="confirm-val">'+tm+' (~'+(booking.mode?booking.mode.duration:LG_MODEL.duration)+' мин)</span></div>'
    +'<div class="confirm-row price-row"><span class="confirm-key">💰 Үнэ</span><span class="confirm-val price-amount">'+price.toLocaleString()+'₮</span></div>'
    +'</div>'
    +modeDetailsHtml
    +'<div class="payment-section"><div class="pay-section-title">Төлбөрийн аргаа сонгоно уу</div>'
    +'<div class="payment-methods-grid">'+qH+cH+tH+'</div>'
    // QPay
    +'<div id="payui-qpay" class="payui"><div class="qpay-layout">'
    +'<div class="qpay-qr-col"><div class="qpay-qr-box"><div id="paymentQR"></div></div>'
    +'<div class="qpay-qr-label">QPay QR код</div><div class="qpay-amount-badge">'+price.toLocaleString()+'₮</div></div>'
    +'<div class="qpay-banks-col"><div class="qpay-banks-title">Банкны аппаа сонгоно уу:</div>'
    +'<div class="bank-apps-grid" id="bankGrid"></div>'
    +'<div class="qpay-note">📲 Аппаа нээгээд QR уншуулах хэсэгт орж скан хийнэ</div>'
    +'</div></div></div>'
    // Card
    +'<div id="payui-card" class="payui" style="display:none">'
    +'<div class="card-visual-wrap"><div class="card-visual">'
    +'<div class="card-chip" aria-hidden="true"><svg width="28" height="22" viewBox="0 0 28 22"><rect x="1" y="1" width="26" height="20" rx="3" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/><line x1="1" y1="7" x2="27" y2="7" stroke="rgba(255,255,255,.6)"/><line x1="1" y1="15" x2="27" y2="15" stroke="rgba(255,255,255,.6)"/><line x1="9" y1="1" x2="9" y2="21" stroke="rgba(255,255,255,.6)"/><line x1="19" y1="1" x2="19" y2="21" stroke="rgba(255,255,255,.6)"/></svg></div>'
    +'<div class="card-num-display" id="cardNumDisplay">•••• •••• •••• ••••</div>'
    +'<div class="card-bottom-row"><div><div class="card-holder-label">ЭЗЭМШИГЧ</div><div class="card-name-display" id="cardNameDisplay">ТАНЫ НЭР</div></div><div style="margin-left:auto"><div class="card-exp-label">ХУГАЦАА</div><div class="card-exp-display" id="cardExpDisplay">MM/YY</div></div></div>'
    +'</div></div>'
    +'<div class="card-form-fields">'
    +'<div class="cf-field"><label for="cardNum">КАРТЫН ДУГААР</label><input type="text" id="cardNum" placeholder="0000 0000 0000 0000" maxlength="19" oninput="formatCardNum(this)" autocomplete="cc-number"/></div>'
    +'<div class="cf-row2"><div class="cf-field"><label for="cardExp">ХУГАЦАА</label><input type="text" id="cardExp" placeholder="MM/YY" maxlength="5" oninput="formatCardExp(this)" autocomplete="cc-exp"/></div>'
    +'<div class="cf-field"><label for="cardCvv">CVV</label><input type="password" id="cardCvv" placeholder="•••" maxlength="3" autocomplete="cc-csc"/></div></div>'
    +'<div class="cf-field"><label for="cardName">КАРТЫН ЭЗЭМШИГЧИЙН НЭР</label><input type="text" id="cardName" placeholder="BOLD BAATAR" oninput="updateCardDisplay()" autocomplete="cc-name"/></div>'
    +'<div class="card-brands" aria-label="Дэмжигдсэн картууд"><div class="cb visa">VISA</div><div class="cb mc"><span></span><span></span></div><div class="cb up">UnionPay</div></div>'
    +'</div></div>'
    // Transfer
    +'<div id="payui-transfer" class="payui" style="display:none">'
    +'<div class="transfer-card"><div class="transfer-header"><span aria-hidden="true">🏦</span><div><div class="transfer-bank-name">'+bbank+'</div><div class="transfer-sub">Банкны шилжүүлэг</div></div></div>'
    +'<div class="transfer-rows">'
    +'<div class="ti-row"><span class="ti-key">Дансны дугаар</span><span class="ti-val copyable" onclick="copyTextWithFeedback(\''+bnum+'\', this)">'+bnum+' <span class="copy-icon" aria-hidden="true">📋</span></span></div>'
    +'<div class="ti-row"><span class="ti-key">Хүлээн авагч</span><span class="ti-val">'+bname+'</span></div>'
    +'<div class="ti-row price-ti"><span class="ti-key">Шилжүүлэх дүн</span><span class="ti-val price-amount">'+price.toLocaleString()+'₮</span></div>'
    +'<div class="ti-row"><span class="ti-key">Гүйлгээний утга</span><span class="ti-val copyable" onclick="copyTransferNote()">Угаалга '+dt+' '+tm+' '+fname+' <span class="copy-icon" aria-hidden="true">📋</span></span></div>'
    +'</div><div class="transfer-note">⚠️ Шилжүүлсний дараа доорх "Захиалах" товчийг дарна уу.</div></div></div>'
    +'</div>'
    +'<p class="confirm-note">⚠️ Захиалсан цагаасаа 5 минутын өмнөөс ирж QR кодоороо нэвтэрнэ үү. <strong>Demo горимд бодит төлбөр авдаггүй.</strong></p>'
    +'<div class="confirm-actions pay-only">'+'<button class="btn-confirm" id="payBtn" onclick="processPayment()">💳 Төлбөр төлж захиалах →</button>'+'</div>';
}

// ─── PAYMENT ───
function selectPayMethod(method) {
  selectedPayMethod = method;
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
  const btn=document.getElementById('pm-'+method); if(btn) btn.classList.add('active');
  document.querySelectorAll('.payui').forEach(u => u.style.display='none');
  const ui=document.getElementById('payui-'+method); if(ui) ui.style.display='block';
  if (method==='qpay') setTimeout(initQPayUI, 80);
}
function initQPayUI() {
  const s=getPaymentSettings(), price=s.price||2000, code=s.qpay?.invoiceCode||'EASY_LAUNDRY';
  generateQR('paymentQR', 'https://qpay.mn/invoice/'+code+'?amount='+price, 140);
  const g=document.getElementById('bankGrid'); if(!g) return;
  g.innerHTML=MONGOLIAN_BANKS.map(b=>'<a class="bank-btn" href="'+b.deep+encodeURIComponent(code)+'" style="--bk-color:'+b.color+'" aria-label="'+b.short+'"><span class="bank-icon" aria-hidden="true">'+b.icon+'</span><span class="bank-name">'+b.short+'</span></a>').join('');
}
function formatCardNum(el) {
  const v=el.value.replace(/\D/g,'').substring(0,16);
  el.value=v.replace(/(.{4})/g,'$1 ').trim();
  const d=document.getElementById('cardNumDisplay');
  if(d) { const r=el.value.replace(/\s/g,''); d.textContent=(r+'•'.repeat(Math.max(0,16-r.length))).replace(/(.{4})/g,'$1 ').trim(); }
}
function formatCardExp(el) {
  let v=el.value.replace(/\D/g,''); if(v.length>=2) v=v.substring(0,2)+'/'+v.substring(2,4); el.value=v;
  const d=document.getElementById('cardExpDisplay'); if(d) d.textContent=el.value||'MM/YY';
}
function updateCardDisplay() {
  const n=document.getElementById('cardName')?.value.toUpperCase()||'', d=document.getElementById('cardNameDisplay');
  if(d) d.textContent=n||'ТАНЫ НЭР';
}
function copyText(text) {
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(()=>showToast('Хуулагдлаа! 📋')).catch(()=>showToast('Хуулж чадсангүй','error')); }
  else showToast('Хуулж чадсангүй','error');
}
function copyTextWithFeedback(text, el) {
  copyText(text);
  if (el && el.classList) { el.classList.add('copied'); setTimeout(()=>el.classList.remove('copied'),2000); }
}
function copyTransferNote() {
  const u=DB.getCurrentUser();
  copyText('Угаалга '+(booking.date||'Өнөөдөр')+' '+(booking.time||'')+' '+(u?u.fname:''));
}

function processPayment() {
  const user=DB.getCurrentUser();
  if (!user) { showToast('Нэвтрэн орно уу','error'); openModal('authModal'); return; }
  if (selectedPayMethod==='card') {
    const num=document.getElementById('cardNum')?.value.replace(/\s/g,'')||'';
    const exp=document.getElementById('cardExp')?.value||'', cvv=document.getElementById('cardCvv')?.value||'', name=document.getElementById('cardName')?.value||'';
    if (num.length<16)  return showToast('Картын дугаар бүтэн оруулна уу','error');
    if (exp.length<5)   return showToast('Хүчинтэй хугацаа оруулна уу','error');
    if (cvv.length<3)   return showToast('CVV оруулна уу','error');
    if (!name.trim())   return showToast('Картын эзэмшигчийн нэр оруулна уу','error');
  }
  const payBtn=document.getElementById('payBtn');
  if (payBtn) { payBtn.disabled=true; payBtn.textContent='⏳ Боловсруулж байна...'; payBtn.classList.add('loading'); }
  setTimeout(()=>{
    const code='EL-'+Math.random().toString(36).substr(2,6).toUpperCase();
    const s=getPaymentSettings();
    const labels={qpay:'QPay',card:'Карт',transfer:'Банк шилжүүлэг'};
    const price=booking.mode?booking.mode.price:s.price||2000;
    const b={
      id:Date.now().toString(), userId:user.id,
      userName:user.fname+' '+(user.lname||''), code,
      location:booking.location?booking.location.name:'',
      machine:booking.machine?booking.machine.name:'',
      mode:booking.mode?booking.mode.name:'',
      date:booking.date||'Өнөөдөр', time:booking.time, status:'upcoming',
      payment:{ method:selectedPayMethod, methodLabel:labels[selectedPayMethod]||selectedPayMethod, amount:price, status:'paid', paidAt:new Date().toISOString(), transactionId:'TXN'+Date.now() },
      createdAt:new Date().toISOString()
    };
    const bookings=DB.getBookings(); bookings.push(b); DB.saveBookings(bookings);
    animatePanel(()=>{ document.getElementById('bookingPanel').innerHTML=renderSuccess(code,b); });
    for(let i=1;i<=5;i++){ const el=document.getElementById('step-nav-'+i); if(el){el.classList.remove('active');el.classList.add('done');} }
    renderMyBookings();
    showToast('Төлбөр амжилттай! Захиалга баталгаажлаа! 🎉');
  }, selectedPayMethod==='card'?2600:2000);
}

// ─── SUCCESS ───
function renderUsageGuide() {
  return '<div class="usage-guide">'
    +'<h4>📋 Машин ашиглах заавар</h4><div class="guide-steps">'
    +[
      ['Машин дээр очих','Захиалсан цагаасаа 5 минутын өмнө '+(booking.location?booking.location.name:'байр')+'-ын угаалгын өрөөнд очно уу.'],
      ['QR кодоор нэвтрэх','Машины хажуу дахь уншигч дээр QR кодоо уншуулна уу. Ногоон гэрэл асна.'],
      ['Хувцас хийх','Хувцасаа хийгээд хаалгыг чанга хаана уу.'],
      ['Горим сонгох','💧 Хөнгөн 30°C — 🌊 Ердийн 40°C — 🔥 Гүн 60°C'],
      ['START дарах','Горим сонгосны дараа START/PAUSE товчийг дарна.'],
      ['Дуусмагцаа авах','Хувцасаа авна уу. Машины хаалгыг аниасан орхино уу.']
    ].map((s,i)=>'<div class="guide-step"><div class="gs-num" aria-hidden="true">'+(i+1)+'</div><div><div class="gs-title">'+s[0]+'</div><div class="gs-desc">'+s[1]+'</div></div></div>').join('')
    +'</div></div>';
}
function renderSuccess(code, b) {
  const pay=b.payment||{}, icons={qpay:'📱',card:'💳',transfer:'🏦'};
  const payBadge=pay.status==='paid'
    ?'<div class="payment-success-badge"><span class="psb-icon">'+(icons[pay.method]||'💳')+'</span><div><div class="psb-method">'+(pay.methodLabel||'Төлбөр')+' амжилттай</div><div class="psb-amount">'+(pay.amount||2000).toLocaleString()+'₮ · '+(pay.transactionId||'')+'</div></div><span class="psb-check">✓</span></div>'
    :'';
  return '<div class="booking-success">'
    +'<div class="success-anim" aria-hidden="true">✓</div>'
    +'<h3>Захиалга амжилттай!</h3><p>Таны захиалга баталгаажиж, төлбөр хүлээн авагдлаа.</p>'
    +'<div class="booking-code" aria-label="Захиалгын код '+code+'">'+code+'</div>'
    +payBadge
    +renderUsageGuide()
    +'<button class="btn-primary" style="margin-top:24px;" onclick="newBooking()">+ Шинэ захиалга</button>'
    +'</div>';
}

// ─── STEP CONTROL ───
function renderCurrentStep() {
  animatePanel(()=>{
    const panel  = document.getElementById('bookingPanel');
    const footer = document.getElementById('stepperFooter');
    if (currentStep===1)      panel.innerHTML=renderStep1();
    else if (currentStep===2) panel.innerHTML=renderStep2();
    else if (currentStep===3) panel.innerHTML=renderStep3Modes();
    else if (currentStep===4) panel.innerHTML=renderStep4DateTime();
    else if (currentStep===5) { panel.innerHTML=renderStep5Payment(); setTimeout(initQPayUI,120); }
    // Step 5 has own CTA - hide stepper footer
    if (footer) footer.style.display = currentStep===5 ? 'none' : '';
    updateStepNav();
  });
}
/**
 * Update Stepper indicators, connector fills, and footer buttons
 */
function updateStepNav() {
  const steps = 5;

  for (let i = 1; i <= steps; i++) {
    const indicator = document.getElementById('step-nav-' + i);
    const circle    = document.getElementById('sc-' + i);
    if (!circle) continue;

    // Circle state
    circle.classList.remove('active', 'done');
    if (i === currentStep) {
      circle.classList.add('active');
      indicator && indicator.classList.add('step-active');
      indicator && indicator.classList.remove('step-done');
    } else if (i < currentStep) {
      circle.classList.add('done');
      indicator && indicator.classList.add('step-done');
      indicator && indicator.classList.remove('step-active');
    } else {
      indicator && indicator.classList.remove('step-active', 'step-done');
    }

    // Connector fill (connector i connects step i to step i+1)
    const fill = document.getElementById('scf-' + i);
    if (fill) {
      if (i < currentStep) {
        fill.classList.add('complete');
      } else {
        fill.classList.remove('complete');
      }
    }
  }

  // Footer: back button visibility
  const backBtn  = document.getElementById('stepperBackBtn');
  const nextBtn  = document.getElementById('stepperNextBtn');
  const footerNav = document.getElementById('stepperFooterNav');

  if (backBtn) {
    if (currentStep > 1) {
      backBtn.classList.add('visible');
      footerNav && footerNav.classList.add('has-back');
    } else {
      backBtn.classList.remove('visible');
      footerNav && footerNav.classList.remove('has-back');
    }
  }

  if (nextBtn) {
    if (currentStep === steps) {
      nextBtn.textContent = '💳 Захиалах →';
      nextBtn.classList.add('final');
      nextBtn.disabled = false;
    } else {
      nextBtn.textContent = 'Үргэлжлүүлэх →';
      nextBtn.classList.remove('final');
      // Disable if current step selection not made
      const blocked = (
        (currentStep===1 && !booking.location) ||
        (currentStep===2 && !booking.machine)  ||
        (currentStep===3 && !booking.mode)    ||
        (currentStep===4 && !booking.time)
      );
      nextBtn.disabled = blocked;
    }
  }
}
function goToStep(step) {
  if (step > currentStep && !canProceed(step)) return;
  _stepDir = step > currentStep ? 1 : -1;
  currentStep = step;
  renderCurrentStep();
}
function canProceed(step) {
  if (step===2&&!booking.location){ showToast('Байр сонгоно уу','error'); return false; }
  if (step===3&&!booking.machine) { showToast('Машин сонгоно уу','error'); return false; }
  if (step===4&&!booking.mode)    { showToast('Угаалгын горим сонгоно уу','error'); return false; }
  if (step===5&&!booking.time)    { showToast('Цаг сонгоно уу','error'); return false; }
  return true;
}
function selectLocation(id) { booking.location=getLocations().find(l=>l.id===id); booking.machine=null; booking.mode=null; renderCurrentStep(); }
function selectMachine(id)  { booking.machine=getMachines().find(m=>m.id===id); booking.mode=null; renderCurrentStep(); }
function selectMode(id)     { booking.mode=getLatestModes().find(m=>m.id===id); renderCurrentStep(); }
function selectDate(d)       { booking.date=d; renderCurrentStep(); }
function selectTime(t)       { booking.time=t; renderCurrentStep(); }
function newBooking()  { booking={location:null,machine:null,mode:null,date:null,time:null}; currentStep=1; renderCurrentStep(); }
function resetBooking(){ currentStep=Math.max(1,currentStep-1); renderCurrentStep(); }

// ─── MY BOOKINGS ───
function renderMyBookings() {
  const user=DB.getCurrentUser(); if(!user) return;
  const bookings=DB.getBookings().filter(b=>b.userId===user.id);
  const list=document.getElementById('bookingList'); if(!list) return;
  if (bookings.length===0) { list.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);font-size:.9rem;">Одоогоор захиалга байхгүй байна</div>'; return; }
  const icons={qpay:'📱',card:'💳',transfer:'🏦'};
  list.innerHTML=bookings.reverse().map(b=>{
    const payBadge=b.payment?.amount?'<div class="bi-pay-badge">'+(icons[b.payment.method]||'💳')+' '+b.payment.amount.toLocaleString()+'₮ · '+(b.payment.methodLabel||'Төлбөр')+'</div>':'';
    const sLabel={upcoming:'Хүлээгдэж байна',active:'Идэвхтэй',done:'Дууссан',cancelled:'Цуцлагдсан'};
    const cancelBtn=b.status==='upcoming'?'<button class="btn-cancel-booking" onclick="cancelBookingConfirm(\''+b.id+'\')">Цуцлах</button>':'';
    return '<div class="booking-item">'
      +'<div class="bi-left"><div class="bi-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0014 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 01-11.91 4.97"/></svg></div>'
      +'<div><div class="bi-title">'+b.location+' — '+b.machine+'</div>'
      +'<div class="bi-info">'+b.date+' • '+b.time+' • Код: <strong>'+b.code+'</strong></div>'
      +payBadge+'</div></div>'
      +'<div class="bi-actions">'
      +'<span class="bi-status '+b.status+'">'+sLabel[b.status]+'</span>'
      +cancelBtn+'</div></div>';
  }).join('');
}
function toggleMyBookings() { document.getElementById('myBookingsSection').style.display='none'; }
function cancelBookingConfirm(id) { cancelTarget=id; openModal('cancelModal'); }
function confirmCancel() {
  if (!cancelTarget) return;
  const bs=DB.getBookings(), idx=bs.findIndex(b=>b.id===cancelTarget);
  if (idx!==-1) { bs[idx].status='cancelled'; DB.saveBookings(bs); }
  cancelTarget=null; closeModal('cancelModal'); renderMyBookings();
  showToast('Захиалга цуцлагдлаа');
}

function selectMachineFromHero(machineId) {
  scrollToBooking();
  setTimeout(()=>{
    const m=getMachines().find(x=>x.id===machineId&&x.status!=='busy'&&x.status!=='maintenance');
    if (m) { booking.location=getLocations().find(l=>l.id===m.locId); booking.machine=m; currentStep=3; renderCurrentStep(); }
  }, 500);
}

// ─── CONTACT ───
function sendContact() {
  const name=document.getElementById('cf-name').value.trim();
  const contact=document.getElementById('cf-contact').value.trim();
  const msg=document.getElementById('cf-msg').value.trim();
  if (!name||!contact||!msg) return showToast('Бүх талбарыг бөглөнө үү','error');

  const contactMessages = getContactMessages();
  const newMessage = {
    id: 'cm' + Date.now(),
    name,
    contact,
    message: msg,
    sentAt: new Date().toISOString(),
    status: 'new'
  };
  contactMessages.push(newMessage);
  saveContactMessages(contactMessages);

  const notifications = DB.get('el_notifications') || [];
  const preview = msg.length > 70 ? msg.slice(0, 70) + '…' : msg;
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'info',
    icon: '✉️',
    title: 'Шинэ санал хүсэлт ирлээ',
    body: `${name} (${contact}): ${preview}`,
    time: 'Одоогоор',
    read: false,
    related: 'contact'
  });
  DB.set('el_notifications', notifications);

  const btn=document.querySelector('.btn-send');
  btn.textContent='Илгээж байна...'; btn.classList.add('loading'); btn.disabled=true;
  setTimeout(()=>{
    btn.textContent='✓ Амжилттай илгээгдлээ'; btn.style.background='#22C55E';
    showToast('Таны мессеж амжилттай илгээгдлээ! 🎉');
    ['cf-name','cf-contact','cf-msg'].forEach(id=>{ document.getElementById(id).value=''; });
    setTimeout(()=>{ btn.textContent='Илгээх →'; btn.style.background=''; btn.classList.remove('loading'); btn.disabled=false; },3000);
  },1400);
}

// ─── MOBILE NAV ───
function toggleMobile() {
  const m=document.getElementById('mobileMenu'), hb=document.getElementById('hamburgerBtn');
  if(m) m.classList.toggle('open');
  if(hb){ const open=m&&m.classList.contains('open'); hb.classList.toggle('active',open); hb.setAttribute('aria-expanded',open?'true':'false'); }
}
function closeMobile() {
  const m=document.getElementById('mobileMenu'), hb=document.getElementById('hamburgerBtn');
  if(m) m.classList.remove('open');
  if(hb){ hb.classList.remove('active'); hb.setAttribute('aria-expanded','false'); }
}

window.addEventListener('scroll',()=>{
  const nav=document.getElementById('mainNav');
  if(nav) nav.classList.toggle('scrolled',window.scrollY>30);
  const sections=['home','how','locations','booking','contact']; let current='home';
  sections.forEach(id=>{ const el=document.getElementById(id); if(el&&window.scrollY>=el.offsetTop-120) current=id; });
  document.querySelectorAll('.nav-links a').forEach(a=>{ const oc=a.getAttribute('onclick'); a.classList.toggle('active',oc&&oc.includes('#'+current)); });
},{passive:true});

// ─── REVEAL ───
const revealObs=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{ if(e.isIntersecting) setTimeout(()=>e.target.classList.add('show'),i*80); });
},{threshold:0,rootMargin:'0px 0px -30px 0px'});
document.querySelectorAll('.rv').forEach(el=>{
  const rect=el.getBoundingClientRect();
  if(rect.top<window.innerHeight) { el.classList.add('show'); }
  else revealObs.observe(el);
});

// ─── COUNTER ───
function animateCount(el,target) {
  let cur=0; const step=target/60;
  const t=setInterval(()=>{
    cur=Math.min(cur+step,target);
    el.textContent=cur>=1000?Math.round(cur/1000)+'K+':Math.round(cur)+(target>=10&&target<100?'+':'');
    if(cur>=target) clearInterval(t);
  },16);
}
const countObs=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ animateCount(e.target,parseInt(e.target.dataset.count)); countObs.unobserve(e.target); } });
},{threshold:0.5});
document.querySelectorAll('[data-count]').forEach(el=>countObs.observe(el));

// ─── LOCATION SELECT FROM LOCATIONS SECTION ───
function selectLocationAndBook(locId) {
  booking.location=getLocations().find(l=>l.id===locId);
  booking.machine=null; booking.mode=null; booking.date=null; booking.time=null;
  currentStep=2; scrollToBooking();
  setTimeout(()=>renderCurrentStep(),400);
}

// ─── UPDATE LOCATION CARDS ───
function updateLocationCards() {
  const allM=getMachines(), locs=getLocations();
  locs.forEach(loc=>{
    const mach=allM.filter(m=>m.locId===loc.id);
    const free=mach.filter(m=>m.status==='free').length;
    const freeEl=document.getElementById('free-'+loc.id); if(freeEl) freeEl.textContent=free;
    const dotsEl=document.getElementById('dots-'+loc.id);
    if(dotsEl) dotsEl.innerHTML=mach.map(m=>'<span class="lbc-dot lbc-dot-'+m.status+'" title="'+m.name+'"></span>').join('');
  });
}

// ─── BOTTOM NAV ───
function setBnActive(id) {
  document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
  const t=document.getElementById('bn-'+id); if(t) t.classList.add('active');
  // Ink spread indicator
  const items=['home','how','booking','contact'];
  const idx=items.indexOf(id);
  const ink=document.getElementById('bnInk');
  if(ink&&idx>=0) ink.style.left=(idx*25)+'%';
}
window.addEventListener('scroll',()=>{
  const sections=['home','how','locations','booking','contact']; let current='home';
  sections.forEach(id=>{ const el=document.getElementById(id); if(el&&window.scrollY>=el.offsetTop-200) current=id; });
  document.querySelectorAll('.bn-item').forEach(b=>b.classList.remove('active'));
  const bnId=current==='locations'?'how':current;
  const t=document.getElementById('bn-'+bnId); if(t) t.classList.add('active');
},{passive:true});

// ─── VIEWPORT FIX ───
function setViewportHeight(){ document.documentElement.style.setProperty('--vh',window.innerHeight*0.01+'px'); }
window.addEventListener('resize',setViewportHeight);
setViewportHeight();

// ─── TOUCH SWIPE ───
let touchStartX=0;
document.addEventListener('touchstart',e=>{ touchStartX=e.changedTouches[0].screenX; },{passive:true});
document.addEventListener('touchend',e=>{
  const m=document.getElementById('mobileMenu');
  if(m&&m.classList.contains('open')&&e.changedTouches[0].screenX-touchStartX>100) closeMobile();
},{passive:true});

// ─── CLOSE ON OVERLAY CLICK ───
document.querySelectorAll('.modal-overlay,.qr-modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.classList.remove('open'); });
});
document.addEventListener('click',e=>{
  const menu=document.getElementById('mobileMenu');
  if(menu&&menu.classList.contains('open')&&!menu.contains(e.target)&&!e.target.closest('#hamburgerBtn')) closeMobile();
});

// ─── MACHINE PROGRESS SIMULATION ───
// Resets machine to 'free' when progress hits 100% and updates hero card
setInterval(()=>{
  const ms=getMachines(); let changed=false;
  ms.forEach(m=>{
    if ((m.status==='busy'||m.status==='soon') && m.progress<100) {
      m.progress+=0.08; changed=true;
    } else if ((m.status==='busy'||m.status==='soon') && m.progress>=100) {
      m.status='free'; m.progress=0; m.remaining=null; changed=true;
    }
  });
  if(changed){ DB.set('el_machines',ms); renderHeroCard(); updateLocationCards(); }
},1000);



// ─── INIT ───
renderCurrentStep();
renderHeroCard();
updateLocationCards();
const _u=DB.getCurrentUser(); if(_u) updateUserUI(_u);
window.addEventListener('load',()=>{
  generateQR('contactQR','https://easy-laundry.mn',100);
  renderHeroCard();
  updateLocationCards();
});


// ─── Stepper footer button handlers ───
/**
 * Stepper "Үргэлжлүүлэх" (Next) button
 */
function stepperNext() {
  if (currentStep < 5) {
    if (!canProceed(currentStep + 1)) return;
    _stepDir = 1;
    currentStep++;
    renderCurrentStep();
  } else {
    // Final step — trigger payment
    processPayment();
  }
}

/**
 * Stepper "Буцах" (Back) button
 */
function stepperBack() {
  if (currentStep > 1) {
    _stepDir = -1;
    currentStep--;
    renderCurrentStep();
  }
}

/* ═══════════════════════════════════════════════════════════════
   DOT GRID — Vanilla JS conversion of React DotGrid component
   Hero section-д интерактив цэгэн дэвсгэр нэмнэ.
   Анх React/GSAP-д бичигдсэн — vanilla JS болгон хөрвүүлсэн.
   ═══════════════════════════════════════════════════════════════ */

(function initDotGrid() {

  // ─── Тохиргоо — Easy Laundry брэнд өнгөтэй тохируулсан ───
  const CONFIG = {
    dotSize:        5,        // цэгийн диаметр (px)
    gap:            20,       // цэг хоорондын зай (px)
    baseColor:      '#d4ebfa', // амралтын үеийн өнгө (цайвар хөх)
    activeColor:    '#355872', // хулгана ойртоход — брэнд blue
    proximity:      130,      // хулгана нөлөөлөх радиус (px)
    speedTrigger:   80,       // цэг зайлах хурдны босго (px/s)
    shockRadius:    260,      // click-н цочрол радиус (px)
    shockStrength:  6,        // click-н хүч
    maxSpeed:       5000,     // хулганы хамгийн их хурд cap
    resistance:     750,      // GSAP InertiaPlugin эсэргүүцэл
    returnDuration: 1.5,      // буцах хугацаа (секунд)
  };

  // Dark mode тохиргоо
  const DARK_CONFIG = {
    baseColor:   '#1a2e40',  // харанхуй дэвсгэрт бараан цэг
    activeColor: '#00D9B4',  // hover-т teal
  };

  // ─── Utility ───
  function throttle(fn, limit) {
    let last = 0;
    return function(...args) {
      const now = performance.now();
      if (now - last >= limit) { last = now; fn.apply(this, args); }
    };
  }

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }

  function lerpColor(baseRgb, activeRgb, t) {
    return 'rgb('
      + Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t) + ','
      + Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t) + ','
      + Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t) + ')';
  }

  // ─── State ───
  const canvas   = document.getElementById('dotGridCanvas');
  const wrapper  = canvas ? canvas.parentElement : null;
  if (!canvas || !wrapper) return;

  let dots       = [];
  let rafId      = null;
  let circlePath = null;

  const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 };

  // ─── Grid builder ───
  function buildGrid() {
    const { width, height } = wrapper.getBoundingClientRect();
    if (!width || !height) return;

    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cell = CONFIG.dotSize + CONFIG.gap;
    const cols = Math.floor((width  + CONFIG.gap) / cell);
    const rows = Math.floor((height + CONFIG.gap) / cell);
    const gridW = cell * cols - CONFIG.gap;
    const gridH = cell * rows - CONFIG.gap;
    const startX = (width  - gridW) / 2 + CONFIG.dotSize / 2;
    const startY = (height - gridH) / 2 + CONFIG.dotSize / 2;

    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          cx: startX + c * cell,
          cy: startY + r * cell,
          xOffset: 0,
          yOffset: 0,
          _busy: false,
        });
      }
    }

    // Pre-build Path2D circle (performance)
    if (window.Path2D) {
      circlePath = new Path2D();
      circlePath.arc(0, 0, CONFIG.dotSize / 2, 0, Math.PI * 2);
    }

    canvas.classList.add('ready');
  }

  // ─── Render loop ───
  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
    const base     = hexToRgb(isDark ? DARK_CONFIG.baseColor   : CONFIG.baseColor);
    const active   = hexToRgb(isDark ? DARK_CONFIG.activeColor : CONFIG.activeColor);
    const proxSq   = CONFIG.proximity * CONFIG.proximity;

    for (const dot of dots) {
      const ox = dot.cx + dot.xOffset;
      const oy = dot.cy + dot.yOffset;
      const dx = dot.cx - ptr.x;
      const dy = dot.cy - ptr.y;
      const dsq = dx * dx + dy * dy;

      let fillStyle;
      if (dsq <= proxSq) {
        const t = 1 - Math.sqrt(dsq) / CONFIG.proximity;
        fillStyle = lerpColor(base, active, t);
      } else {
        fillStyle = isDark ? DARK_CONFIG.baseColor : CONFIG.baseColor;
      }

      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = fillStyle;
      if (circlePath) {
        ctx.fill(circlePath);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    rafId = requestAnimationFrame(draw);
  }

  // ─── Mouse / pointer handler ───
  function onMouseMove(e) {
    const now = performance.now();
    const dt  = ptr.lastTime ? now - ptr.lastTime : 16;
    const dx  = e.clientX - ptr.lastX;
    const dy  = e.clientY - ptr.lastY;
    let   vx  = (dx / dt) * 1000;
    let   vy  = (dy / dt) * 1000;
    let   spd = Math.hypot(vx, vy);

    if (spd > CONFIG.maxSpeed) {
      const s = CONFIG.maxSpeed / spd;
      vx *= s; vy *= s; spd = CONFIG.maxSpeed;
    }

    ptr.lastTime = now; ptr.lastX = e.clientX; ptr.lastY = e.clientY;
    ptr.vx = vx; ptr.vy = vy; ptr.speed = spd;

    const rect = canvas.getBoundingClientRect();
    ptr.x = e.clientX - rect.left;
    ptr.y = e.clientY - rect.top;

    // Only run if GSAP loaded
    if (typeof gsap === 'undefined') return;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - ptr.x, dot.cy - ptr.y);
      if (spd > CONFIG.speedTrigger && dist < CONFIG.proximity && !dot._busy) {
        dot._busy = true;
        gsap.killTweensOf(dot);
        const pushX = (dot.cx - ptr.x) + vx * 0.005;
        const pushY = (dot.cy - ptr.y) + vy * 0.005;
        gsap.to(dot, {
          inertia: { xOffset: pushX, yOffset: pushY, resistance: CONFIG.resistance },
          onComplete() {
            gsap.to(dot, {
              xOffset: 0, yOffset: 0,
              duration: CONFIG.returnDuration,
              ease: 'elastic.out(1,0.75)',
            });
            dot._busy = false;
          }
        });
      }
    }
  }

  // ─── Click shock wave ───
  function onClick(e) {
    if (typeof gsap === 'undefined') return;
    const rect = canvas.getBoundingClientRect();
    const cx   = e.clientX - rect.left;
    const cy   = e.clientY - rect.top;

    // Зөвхөн hero section дотор click хийсэн үед
    const hero = document.getElementById('home');
    if (!hero) return;
    const hr = hero.getBoundingClientRect();
    if (e.clientY < hr.top || e.clientY > hr.bottom) return;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < CONFIG.shockRadius && !dot._busy) {
        dot._busy = true;
        gsap.killTweensOf(dot);
        const falloff = Math.max(0, 1 - dist / CONFIG.shockRadius);
        const pushX   = (dot.cx - cx) * CONFIG.shockStrength * falloff;
        const pushY   = (dot.cy - cy) * CONFIG.shockStrength * falloff;
        gsap.to(dot, {
          inertia: { xOffset: pushX, yOffset: pushY, resistance: CONFIG.resistance },
          onComplete() {
            gsap.to(dot, {
              xOffset: 0, yOffset: 0,
              duration: CONFIG.returnDuration,
              ease: 'elastic.out(1,0.75)',
            });
            dot._busy = false;
          }
        });
      }
    }
  }

  // ─── Touch support (mobile) ───
  function onTouchMove(e) {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    // Synthetic mousemove-like event
    onMouseMove({ clientX: t.clientX, clientY: t.clientY });
  }

  // ─── Init ───
  function init() {
    buildGrid();
    draw();

    // GSAP InertiaPlugin бүртгэл (CDN-аас ачааллагдсан үед)
    if (typeof gsap !== 'undefined' && typeof InertiaPlugin !== 'undefined') {
      gsap.registerPlugin(InertiaPlugin);
    } else {
      // GSAP ачаалагдах хүртэл хүлээ
      window.addEventListener('load', function() {
        if (typeof gsap !== 'undefined' && typeof InertiaPlugin !== 'undefined') {
          gsap.registerPlugin(InertiaPlugin);
        }
      });
    }

    // Event listeners
    const throttledMove = throttle(onMouseMove, 16); // ~60fps
    window.addEventListener('mousemove',  throttledMove, { passive: true });
    window.addEventListener('touchmove',  onTouchMove,   { passive: true });
    window.addEventListener('click',      onClick);

    // Responsive rebuild
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(function() {
        cancelAnimationFrame(rafId);
        buildGrid();
        draw();
      });
      ro.observe(wrapper);
    } else {
      window.addEventListener('resize', function() {
        cancelAnimationFrame(rafId);
        buildGrid();
        draw();
      });
    }

    // Dark mode өөрчлөлтийг ажиглах
    const observer = new MutationObserver(function() {
      // өнгийн шилжилт smooth болно учир нэмэлт зүйл хийх шаардлагагүй
      // draw loop автоматаар шинэ өнгийг авна
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // DOM бэлэн болсон үед эхлүүл
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ═══════════════════════════════════════════════════════════════
   CARD NAV — Vanilla JS conversion of React CardNav component
   GSAP timeline-д суурилсан, брэндийн өнгөтэй тохируулсан.
   ═══════════════════════════════════════════════════════════════ */

(function initCardNav() {

  // ─── DOM refs ───
  const navEl       = document.getElementById('mainNav');
  const hamburger   = document.getElementById('cnHamburger');
  const content     = document.getElementById('cardNavContent');
  if (!navEl || !hamburger || !content) return;

  const cards = [
    document.getElementById('cnCard0'),
    document.getElementById('cnCard1'),
    document.getElementById('cnCard2'),
  ].filter(Boolean);

  let isExpanded = false;
  let tl         = null;

  // ─── Calculate expanded height ───
  function calcHeight() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      // Measure actual content height
      const prev = { vis: content.style.visibility, pe: content.style.pointerEvents, pos: content.style.position, h: content.style.height };
      content.style.visibility    = 'visible';
      content.style.pointerEvents = 'auto';
      content.style.position      = 'static';
      content.style.height        = 'auto';
      content.offsetHeight; // force reflow
      const h = 60 + content.scrollHeight + 16;
      content.style.visibility    = prev.vis;
      content.style.pointerEvents = prev.pe;
      content.style.position      = prev.pos;
      content.style.height        = prev.h;
      return h;
    }
    return 260;
  }

  // ─── Build GSAP timeline ───
  function buildTimeline() {
    if (typeof gsap === 'undefined') return null;

    gsap.set(navEl,  { height: 60, overflow: 'hidden' });
    gsap.set(cards,  { y: 40, opacity: 0 });

    const t = gsap.timeline({ paused: true });
    t.to(navEl,  { height: calcHeight, duration: .4, ease: 'power3.out' });
    t.to(cards,  { y: 0, opacity: 1, duration: .35, ease: 'power3.out', stagger: .07 }, '-=0.15');
    return t;
  }

  // ─── Fallback (no GSAP) ───
  function fallbackOpen() {
    navEl.style.height   = calcHeight() + 'px';
    navEl.style.overflow = 'hidden';
    navEl.style.transition = 'height .35s cubic-bezier(.22,1,.36,1)';
    cards.forEach((c, i) => {
      c.style.transition = `opacity .3s ${i * .07}s, transform .3s ${i * .07}s`;
      c.style.opacity    = '1';
      c.style.transform  = 'translateY(0)';
    });
  }
  function fallbackClose() {
    navEl.style.height = '60px';
    cards.forEach(c => {
      c.style.opacity   = '0';
      c.style.transform = 'translateY(40px)';
    });
  }

  // ─── Toggle ───
  window.cardNavToggle = function() {
    if (!isExpanded) {
      // OPEN
      isExpanded = true;
      hamburger.classList.add('open');
      navEl.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');

      if (typeof gsap !== 'undefined') {
        if (!tl) tl = buildTimeline();
        tl.play(0);
      } else {
        fallbackOpen();
      }
    } else {
      // CLOSE
      cardNavClose();
    }
  };

  window.cardNavClose = function() {
    if (!isExpanded) return;
    isExpanded = false;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');

    if (typeof gsap !== 'undefined' && tl) {
      tl.eventCallback('onReverseComplete', () => navEl.classList.remove('open'));
      tl.reverse();
    } else {
      navEl.classList.remove('open');
      fallbackClose();
    }
  };

  // ─── Close on outside click ───
  document.addEventListener('click', function(e) {
    if (!isExpanded) return;
    if (!navEl.closest('.card-nav-container').contains(e.target)) {
      cardNavClose();
    }
  });

  // ─── Close on ESC ───
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isExpanded) cardNavClose();
  });

  // ─── Keyboard: hamburger Enter/Space ───
  hamburger.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cardNavToggle(); }
  });

  // ─── Resize: rebuild timeline ───
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (typeof gsap !== 'undefined') {
        if (tl) tl.kill();
        tl = buildTimeline();
        if (isExpanded) { tl.progress(1); }
      }
    }, 150);
  });

  // ─── Scroll: subtle border shimmer ───
  window.addEventListener('scroll', function() {
    const container = document.getElementById('cardNavContainer');
    if (!container) return;
    if (window.scrollY > 30) {
      navEl.style.boxShadow = '0 8px 40px rgba(27,79,255,.13)';
    } else {
      navEl.style.boxShadow = '';
    }
  }, { passive: true });

  // ─── Init GSAP once loaded ───
  function tryInitGSAP() {
    if (typeof gsap !== 'undefined') {
      tl = buildTimeline();
      // Pre-set cards hidden
      gsap.set(cards, { y: 40, opacity: 0 });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitGSAP);
  } else {
    tryInitGSAP();
  }

  // Also override old toggleMobile / closeMobile to use cardNavClose
  window.toggleMobile = function() { cardNavToggle(); };
  window.closeMobile  = function() { cardNavClose(); };

})();


(function initBorderGlow() {

  // ─── Math helpers ───
  function getCenterOffset(el) {
    const r = el.getBoundingClientRect();
    return [r.width / 2, r.height / 2];
  }

  /** How close cursor is to the edge: 0=center, 1=edge */
  function getEdgeProximity(el, x, y) {
    const [cx, cy] = getCenterOffset(el);
    const dx = x - cx, dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  /** Angle of cursor relative to card center (0–360°) */
  function getCursorAngle(el, x, y) {
    const [cx, cy] = getCenterOffset(el);
    const dx = x - cx, dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg;
  }

  // ─── Attach to a single card ───
  function attachGlow(card) {
    if (card._glowAttached) return;
    card._glowAttached = true;

    function onPointerMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const edge  = getEdgeProximity(card, x, y);
      const angle = getCursorAngle(card, x, y);

      card.style.setProperty('--edge-proximity', (edge * 100).toFixed(2));
      card.style.setProperty('--cursor-angle',   angle.toFixed(2) + 'deg');
    }

    function onPointerLeave() {
      // Smoothly fade — CSS handles the transition, just reset values
      card.style.setProperty('--edge-proximity', '0');
    }

    card.addEventListener('pointermove',  onPointerMove,  { passive: true });
    card.addEventListener('pointerleave', onPointerLeave, { passive: true });
  }

  // ─── Init all current cards ───
  function initAll() {
    document.querySelectorAll('.border-glow-card').forEach(attachGlow);
  }

  // ─── Watch for dynamically added cards (booking panel re-renders) ───
  const mo = new MutationObserver(function(mutations) {
    mutations.forEach(function(mut) {
      mut.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        // Check if the added node itself or any descendant is a glow card
        if (node.classList && node.classList.contains('border-glow-card')) {
          attachGlow(node);
        }
        node.querySelectorAll && node.querySelectorAll('.border-glow-card').forEach(attachGlow);
      });
    });
  });

  mo.observe(document.body, { childList: true, subtree: true });

  // ─── Start ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
function safeRenderBookingItem(booking) {
  return `
    <div class="booking-item">
      <div class="bi-left">
        <div class="bi-icon">${window.Security.escapeHtml(booking.icon || '🧺')}</div>
        <div>
          <div class="bi-title">${window.Security.escapeHtml(booking.location)} — ${window.Security.escapeHtml(booking.machine)}</div>
          <div class="bi-info">${window.Security.escapeHtml(booking.date)} • ${window.Security.escapeHtml(booking.time)} • Код: <strong>${window.Security.escapeHtml(booking.code)}</strong></div>
        </div>
      </div>
    </div>
  `;
}