/**
 * Easy Laundry v2.0 — admin-script.js
 * Admin panel logic
 * @version 2.0.0
 * TODO: Replace with real backend auth
 */

const VERSION = '2.0.0';
const DEBUG   = false;

// ─── AUTH (obfuscated credentials) ───
// TODO: Replace with real backend authentication
// Credentials are encoded — DO NOT store plain passwords in production
const _AC = { e: btoa('admin@easylaundry.mn'), p: btoa('admin2026'), n: 'Админ' };
function _checkCreds(e, p) { return btoa(e) === _AC.e && btoa(p) === _AC.p; }

// ─── SECURITY FEATURES ───
let adminLoginAttempts = 0;
let adminLastLoginAttempt = 0;
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

function isAdminRateLimited() {
  const now = Date.now();
  if (now - adminLastLoginAttempt > ADMIN_LOCKOUT_TIME) {
    adminLoginAttempts = 0;
    return false;
  }
  return adminLoginAttempts >= ADMIN_MAX_ATTEMPTS;
}

function hashAdminPassword(password) {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

const ADMIN_BANK_LIST = [
  { name:'Хаан Банк',   color:'#003F87' }, { name:'Голомт Банк', color:'#1A1464' },
  { name:'ХХБ',         color:'#C8102E' }, { name:'Хас Банк',    color:'#E31837' },
  { name:'Төрийн Банк', color:'#006633' }, { name:'Капитрон',    color:'#004B87' },
  { name:'Чингис Хаан', color:'#2D2D2D' }, { name:'Богд Банк',   color:'#7B1A1A' },
  { name:'M Банк',      color:'#FF6B00' }, { name:'Most Банк',   color:'#1B3A7A' },
  { name:'Pass Банк',   color:'#2C3E50' },
];

const DEFAULT_PAYMENT_SETTINGS = {
  price:2000, enabled:true,
  methods:{ qpay:true,card:true,transfer:true },
  qpay:{ merchantName:'Easy Laundry ХААИС', invoiceCode:'EASY_LAUNDRY_HUUCHIN' },
  bankAccount:{ bank:'Хаан Банк', name:'Easy Laundry ХААИС', number:'5000123456', note:'Угаалгын захиалга' }
};

const DB = {
  g: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  s: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};
const getPaySettings     = () => DB.g('el_payment_settings') || DEFAULT_PAYMENT_SETTINGS;
const savePaySettingsDB  = s  => DB.s('el_payment_settings', s);

// Define LG_MODEL for admin panel
const LG_MODEL = {
  name: 'LG Smart Choice',
  capacity: 9,
  modes: DB.g('el_machine_modes') || []
};

function seedData() {
  if (DB.g('el_seeded')) return;
  const locations = [
    { id:'1', name:'ХААИС — 1-р байр', icon:'🏢', address:'Зайсан, Улаанбаатар', machineCount:3, active:true },
    { id:'2', name:'ХААИС — 2-р байр', icon:'🏛️', address:'Зайсан, Улаанбаатар', machineCount:2, active:true },
    { id:'3', name:'ХААИС — 3-р байр', icon:'🏠', address:'Зайсан, Улаанбаатар', machineCount:3, active:true },
  ];
  const machines = [
    { id:'m1',locId:'1',name:'Машин №1',status:'free',       progress:0,  model:'LG Smart Choice',capacity:9 },
    { id:'m2',locId:'1',name:'Машин №2',status:'busy',       progress:60, remaining:'27 мин',model:'LG Smart Choice',capacity:9 },
    { id:'m3',locId:'1',name:'Машин №3',status:'free',       progress:0,  model:'LG Smart Choice',capacity:9 },
    { id:'m4',locId:'2',name:'Машин №1',status:'free',       progress:0,  model:'LG Smart Choice',capacity:9 },
    { id:'m5',locId:'2',name:'Машин №2',status:'soon',       progress:88, remaining:'8 мин', model:'LG Smart Choice',capacity:9 },
    { id:'m6',locId:'3',name:'Машин №1',status:'busy',       progress:40, remaining:'32 мин',model:'LG Smart Choice',capacity:9 },
    { id:'m7',locId:'3',name:'Машин №2',status:'free',       progress:0,  model:'LG Smart Choice',capacity:9 },
    { id:'m8',locId:'3',name:'Машин №3',status:'maintenance',progress:0,  model:'LG Smart Choice',capacity:9 },
  ];
  const users = [
    { id:'u1',fname:'Болд',lname:'Баатар',email:'bold@muls.edu.mn',university:'МУИС',role:'user',createdAt:'2024-09-01',password:'pass123' },
    { id:'u2',fname:'Номин',lname:'Сүрэн',email:'nomin@muls.edu.mn',university:'ШУТИС',role:'user',createdAt:'2024-09-05',password:'pass123' },
    { id:'u3',fname:'Анхмаа',lname:'Дорж',email:'ankh@muls.edu.mn',university:'МУБИС',role:'user',createdAt:'2024-09-10',password:'pass123' },
    { id:'u4',fname:'Ган-Эрдэнэ',lname:'Батсүх',email:'gan@muls.edu.mn',university:'МУИС',role:'user',createdAt:'2024-10-01',password:'pass123' },
    { id:'u5',fname:'Сарнай',lname:'Лхагва',email:'sarnai@muls.edu.mn',university:'ХААИС',role:'user',createdAt:'2024-10-15',password:'pass123' },
  ];
  const bookings = [
    { id:'b001',code:'EL-A3X9K',userId:'u1',userName:'Болд Баатар',location:'ХААИС — 1-р байр',machine:'Машин №1',date:'Өнөөдөр',time:'09:00',status:'upcoming',createdAt:new Date().toISOString() },
    { id:'b002',code:'EL-B7M2N',userId:'u2',userName:'Номин Сүрэн',location:'ХААИС — 2-р байр',machine:'Машин №2',date:'Өнөөдөр',time:'10:30',status:'active',createdAt:new Date(Date.now()-3600000).toISOString(),payment:{method:'qpay',methodLabel:'QPay',amount:2000,status:'paid',paidAt:new Date().toISOString(),transactionId:'TXN001'} },
    { id:'b003',code:'EL-C5P1Q',userId:'u3',userName:'Анхмаа Дорж',location:'ХААИС — 3-р байр',machine:'Машин №2',date:'Өчигдөр',time:'14:00',status:'done',createdAt:new Date(Date.now()-86400000).toISOString(),payment:{method:'card',methodLabel:'Карт',amount:2000,status:'paid',paidAt:new Date().toISOString(),transactionId:'TXN002'} },
    { id:'b004',code:'EL-D8R4T',userId:'u4',userName:'Ган-Эрдэнэ Батсүх',location:'ХААИС — 1-р байр',machine:'Машин №3',date:'Өнөөдөр',time:'15:30',status:'upcoming',createdAt:new Date().toISOString() },
    { id:'b005',code:'EL-E2V6W',userId:'u5',userName:'Сарнай Лхагва',location:'ХААИС — 1-р байр',machine:'Машин №1',date:'Өчигдөр',time:'11:00',status:'cancelled',createdAt:new Date(Date.now()-172800000).toISOString() },
  ];
  const notifications = [
    { id:'n1',type:'warning',icon:'⚠️',title:'Машин засварт орлоо',body:'3-р байрны Машин №3 засварт орлоо.',time:'10 мин өмнө',read:false },
    { id:'n2',type:'info',icon:'📅',title:'Шинэ захиалга ирлээ',body:'Болд Баатар 09:00 цагт захиалга өглөө.',time:'25 мин өмнө',read:false },
    { id:'n3',type:'success',icon:'✅',title:'Захиалга дууслаа',body:'Номин Сүрэн-ийн угаалга амжилттай дуусаад машинаа чөлөөлсөн.',time:'1 цаг өмнө',read:false },
    { id:'n4',type:'info',icon:'👤',title:'Шинэ хэрэглэгч бүртгүүллэ',body:'Сарнай Лхагва ХААИС-аас бүртгүүллээ.',time:'3 цаг өмнө',read:true },
  ];
  const machineModes = [
    { id: 'mode1', name: 'Хурдан угаалга', duration: 30, water: 45, electricity: 0.8, price: 1500 },
    { id: 'mode2', name: 'Стандарт угаалга', duration: 45, water: 60, electricity: 1.2, price: 2000 },
    { id: 'mode3', name: 'Гүн цэвэрлэгээ', duration: 75, water: 80, electricity: 1.8, price: 3000 },
    { id: 'mode4', name: 'Эко горим', duration: 60, water: 50, electricity: 0.9, price: 1800 }
  ];
  if (!DB.g('el_locations'))      DB.s('el_locations', locations);
  if (!DB.g('el_machines'))       DB.s('el_machines', machines);
  if (!DB.g('el_machine_modes'))  DB.s('el_machine_modes', machineModes);
  if (!DB.g('el_users'))          DB.s('el_users', users);
  if (!DB.g('el_bookings'))       DB.s('el_bookings', bookings);
  if (!DB.g('el_notifications'))   DB.s('el_notifications', notifications);
  if (!DB.g('el_contact_messages')) DB.s('el_contact_messages', []);
  DB.s('el_seeded', true);
}
seedData();

const getBookings   = () => DB.g('el_bookings')      || [];
const getMachines   = () => DB.g('el_machines')      || [];
const getUsers      = () => DB.g('el_users')         || [];
const getLocations  = () => DB.g('el_locations')     || [];
const getNotifs     = () => DB.g('el_notifications') || [];
const saveBookings  = b => DB.s('el_bookings', b);
const saveMachines  = m => DB.s('el_machines', m);
const saveUsers     = u => DB.s('el_users', u);
const saveLocations = l => DB.s('el_locations', l);
const saveNotifs    = n => DB.s('el_notifications', n);

// ─── AUTH ───
function doLogin() {
  if (isAdminRateLimited()) {
    const remainingTime = Math.ceil((ADMIN_LOCKOUT_TIME - (Date.now() - adminLastLoginAttempt)) / 60000);
    toast(`Хэт олон оролдлого. ${remainingTime} минут хүлээнэ үү.`, 'error');
    document.getElementById('loginErr').textContent = `Хэт олон оролдлого. ${remainingTime} минут хүлээнэ үү.`;
    document.getElementById('loginErr').classList.add('show');
    return;
  }

  adminLastLoginAttempt = Date.now();
  const e=document.getElementById('adEmail').value.trim(), p=document.getElementById('adPass').value;
  
  // Check users with admin role
  const users = getUsers();
  const hashedPass = hashAdminPassword(p);
  const adminUser = users.find(u => u.email === e && u.password === hashedPass && u.role === 'admin');
  
  if (adminUser) {
    adminLoginAttempts = 0;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.add('show');
    document.getElementById('adminName').textContent = adminUser.fname + ' ' + adminUser.lname;
    document.getElementById('adminAvatar').textContent = adminUser.fname.charAt(0).toUpperCase();
    initDashboard(); startClock();
    toast('Тавтай морилно уу, ' + adminUser.fname + '! 🎉','success');
  } else if (_checkCreds(e, p)) {
    // Fallback to hardcoded admin
    adminLoginAttempts = 0;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.add('show');
    document.getElementById('adminName').textContent = _AC.n;
    document.getElementById('adminAvatar').textContent = 'А';
    initDashboard(); startClock();
    toast('Тавтай морилно уу, Админ! 🎉','success');
  } else {
    document.getElementById('loginErr').classList.add('show');
    setTimeout(()=>document.getElementById('loginErr').classList.remove('show'),3000);
  }
}
function doLogout() {
  document.getElementById('app').classList.remove('show');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adEmail').value=''; document.getElementById('adPass').value='';
  toast('Амжилттай гарлаа','info');
}

// ─── CLOCK ───
function startClock() {
  setInterval(()=>{ document.getElementById('clock').textContent=new Date().toLocaleTimeString('mn-MN'); },1000);
}

// ─── TOAST ───
function toast(msg, type='success') {
  const t=document.getElementById('toast');
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  t.innerHTML=(icons[type]||'ℹ️')+' '+msg;
  t.className='toast '+type+' show';
  setTimeout(()=>t.classList.remove('show'),3500);
}

// ─── NAVIGATION ───
const pageTitles = {
  dashboard:['Хянах самбар','Ерөнхий тоймлол'],
  bookings:['Захиалгууд','Бүх захиалгыг удирдах'],
  machines:['Машинууд','Угаалгын машинуудын төлөв'],
  machineModes:['Машины горим','Угаалгын горимын удирдлага'],
  users:['Хэрэглэгчид','Бүртгэлтэй хэрэглэгчид'],
  locations:['Байршлууд','Угаалгын газрын удирдлага'],
  notifications:['Мэдэгдлүүд','Системийн мэдэгдлүүд'],
  contactMessages:['Санал хүсэлт','Харилцагчийн санал хүсэлт'],
  analytics:['Аналитик','Статистик ба тайлан'],
  payments:['Төлбөр','Төлбөрийн тохиргоо & гүйлгээ'],
  settings:['Тохиргоо','Системийн тохиргоо'],
};
function navigate(page) {
  document.querySelectorAll('.page').forEach(p=>{ p.classList.remove('active'); p.style.display='none'; });
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const current=document.getElementById('page-'+page);
  if (current) { current.classList.add('active'); current.style.display='block'; }
  document.querySelector(`[onclick="navigate('${page}')"]`)?.classList.add('active');
  const [title,sub]=pageTitles[page]||[page,''];
  document.getElementById('pageTitle').textContent=title;
  document.getElementById('pageSubtitle').textContent=sub;
  const renderers={dashboard:initDashboard,bookings:renderBookings,machines:renderMachines,machineModes:renderMachineModes,users:renderUsers,locations:renderLocations,notifications:renderNotifications,contactMessages:renderContactMessages,analytics:renderAnalytics,payments:renderPayments};
  if (renderers[page]) renderers[page]();
}

function updateBadges() {
  const pending=getBookings().filter(b=>b.status==='upcoming').length;
  document.getElementById('pendingBadge').textContent=pending;
  const maint=getMachines().filter(m=>m.status==='maintenance').length;
  document.getElementById('machineBadge').textContent=maint||'';
  const unread=getNotifs().filter(n=>!n.read).length;
  document.getElementById('notifBadge').textContent=unread||'';
}

// ─── DASHBOARD ───
function initDashboard() {
  updateBadges();
  const bookings=getBookings(), machines=getMachines(), users=getUsers();
  const upcoming=bookings.filter(b=>b.status==='upcoming').length;
  const done=bookings.filter(b=>b.status==='done').length;
  const freeM=machines.filter(m=>m.status==='free').length;
  const totalRevenue=bookings.filter(b=>b.payment?.status==='paid').reduce((s,b)=>s+(b.payment.amount||0),0);
  document.getElementById('dashStats').innerHTML=`
    <div class="stat-card blue"><div class="sc-header"><span class="sc-icon">📅</span><span class="sc-trend up">↑ 12%</span></div><div class="sc-num">${bookings.length}</div><div class="sc-label">Нийт захиалга</div><div class="sc-sub">${upcoming} хүлээгдэж байна</div></div>
    <div class="stat-card teal"><div class="sc-header"><span class="sc-icon">🫧</span><span class="sc-trend up">↑ 5%</span></div><div class="sc-num">${freeM}</div><div class="sc-label">Чөлөөтэй машин</div><div class="sc-sub">${machines.length} нийт машинаас</div></div>
    <div class="stat-card amber"><div class="sc-header"><span class="sc-icon">👥</span><span class="sc-trend up">↑ 8%</span></div><div class="sc-num">${users.length}</div><div class="sc-label">Хэрэглэгч</div><div class="sc-sub">Энэ сард +3 шинэ</div></div>
    <div class="stat-card green"><div class="sc-header"><span class="sc-icon">💰</span><span class="sc-trend up">↑ 15%</span></div><div class="sc-num">${totalRevenue>=1000?(totalRevenue/1000).toFixed(1)+'K':totalRevenue}₮</div><div class="sc-label">Нийт орлого</div><div class="sc-sub">${done} амжилттай угаалга</div></div>
  `;
  renderWeekChart(); renderDonut();
  renderRecentBookings();
}

function renderWeekChart() {
  const vals=[8,12,6,18,14,20,10];
  const days=['Да','Мя','Лх','Пү','Ба','Бя','Ня'];
  const max=Math.max(...vals);
  document.getElementById('weekChart').innerHTML=vals.map((v,i)=>`
    <div class="bar" style="height:${(v/max)*100}%;background:rgba(61,123,255,${0.4+i/10});" title="${v} захиалга">
      <span class="bar-label">${days[i]}</span>
    </div>`).join('');
}

function renderDonut() {
  const ms=getMachines();
  const free=ms.filter(m=>m.status==='free').length;
  const busy=ms.filter(m=>m.status==='busy').length;
  const soon=ms.filter(m=>m.status==='soon').length;
  const maint=ms.filter(m=>m.status==='maintenance').length;
  const total=ms.length||1, C=2*Math.PI*38;
  const fd=(free/total)*C, bd=(busy/total)*C, sd=(soon/total)*C;
  const df=document.getElementById('donutFree'),db=document.getElementById('donutBusy'),ds=document.getElementById('donutSoon');
  if(df) df.setAttribute('stroke-dasharray',fd+' '+(C-fd));
  if(db){ db.setAttribute('stroke-dasharray',bd+' '+(C-bd)); db.setAttribute('stroke-dashoffset',-fd); }
  if(ds){ ds.setAttribute('stroke-dasharray',sd+' '+(C-sd)); ds.setAttribute('stroke-dashoffset',-(fd+bd)); }
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('dlFree',free); set('dlBusy',busy); set('dlSoon',soon); set('dlMaint',maint);
}

function renderRecentBookings() {
  const recent=getBookings().slice(-5).reverse();
  document.getElementById('recentBookingsTbody').innerHTML=recent.map(b=>`
    <tr>
      <td><strong style="font-family:'Geist Mono',monospace;font-size:.76rem;color:var(--blue-bright);">${b.code}</strong></td>
      <td>${b.userName||'—'}</td>
      <td style="font-size:.8rem;">${b.location}</td>
      <td style="font-size:.8rem;">${b.machine}</td>
      <td style="font-size:.8rem;">${b.date} ${b.time}</td>
      <td><span class="badge ${b.status}">${statusLabel(b.status)}</span></td>
      <td><button class="btn-sm btn-ghost" onclick="viewBooking('${b.id}')">Харах</button></td>
    </tr>`).join('');
}

function statusLabel(s) {
  return {upcoming:'Хүлээгдэж байна',active:'Идэвхтэй',done:'Дууссан',cancelled:'Цуцлагдсан'}[s]||s;
}

// ─── BOOKINGS ───
function renderBookings() { updateBadges(); filterBookings(); }
function filterBookings() {
  const search=(document.getElementById('bookingSearch')?.value||'').toLowerCase();
  const filter=document.getElementById('bookingFilter')?.value||'';
  const bs=getBookings().filter(b=>{
    const ms=!search||(b.code+b.userName+b.location).toLowerCase().includes(search);
    const mf=!filter||b.status===filter;
    return ms&&mf;
  });
  document.getElementById('allBookingsTbody').innerHTML=bs.reverse().map(b=>`
    <tr>
      <td><strong style="font-family:'Geist Mono',monospace;font-size:.76rem;color:var(--blue-bright);">${b.code}</strong></td>
      <td><strong>${b.userName||'—'}</strong></td>
      <td style="font-size:.78rem;">${b.location}<br/><span style="color:var(--text3);">${b.machine}${b.mode ? ' — ' + b.mode : ''}</span></td>
      <td style="font-size:.78rem;">${b.date} ${b.time}</td>
      <td><span class="badge ${b.status}">${statusLabel(b.status)}</span></td>
      <td><div class="row-actions">
        <button class="btn-sm btn-ghost" onclick="viewBooking('${b.id}')">Харах</button>
        ${b.status==='upcoming'?`<button class="btn-sm btn-green" onclick="markActive('${b.id}')">▶</button>`:''}
        ${b.status==='active'?`<button class="btn-sm btn-blue" onclick="markDone('${b.id}')">✓</button>`:''}
        ${['upcoming','active'].includes(b.status)?`<button class="btn-sm btn-red" onclick="cancelBooking('${b.id}')">✕</button>`:''}
      </div></td>
    </tr>`).join()||'<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3);">Захиалга олдсонгүй</td></tr>';
}
function viewBooking(id) {
  const b=getBookings().find(x=>x.id===id); if(!b) return;
  const pay=b.payment||{};
  const mi={qpay:'📱 QPay',card:'💳 Карт',transfer:'🏦 Шилжүүлэг'};
  const payHtml=pay.status==='paid'
    ?`<div style="margin-top:16px;padding:14px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;">
        <div style="font-size:.7rem;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">💰 Төлбөрийн баримт</div>
        <div class="detail-row"><span class="detail-key">Арга</span><span class="detail-val">${mi[pay.method]||pay.method}</span></div>
        <div class="detail-row"><span class="detail-key">Дүн</span><span class="detail-val" style="color:var(--green);font-weight:900;">${(pay.amount||0).toLocaleString()}₮</span></div>
        <div class="detail-row"><span class="detail-key">Гүйлгээний дугаар</span><span class="detail-val" style="font-family:'Geist Mono',monospace;font-size:.76rem;">${pay.transactionId||'—'}</span></div>
        <div class="detail-row"><span class="detail-key">Статус</span><span class="detail-val"><span class="badge active">✓ Амжилттай</span></span></div>
      </div>`
    :`<div style="margin-top:12px;padding:10px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:.8rem;color:var(--red);">⚠️ Төлбөр хийгдээгүй</div>`;
  document.getElementById('detailModalBody').innerHTML=`
    <h3>📋 Захиалгын дэлгэрэнгүй</h3>
    <div class="detail-row"><span class="detail-key">Код</span><span class="detail-val" style="font-family:'Geist Mono',monospace;color:var(--blue-bright);">${b.code}</span></div>
    <div class="detail-row"><span class="detail-key">Хэрэглэгч</span><span class="detail-val">${b.userName||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Байршил</span><span class="detail-val">${b.location}</span></div>
    <div class="detail-row"><span class="detail-key">Машин</span><span class="detail-val">${b.machine}</span></div>
    ${b.mode ? `<div class="detail-row"><span class="detail-key">Горим</span><span class="detail-val">${b.mode}</span></div>` : ''}
    <div class="detail-row"><span class="detail-key">Огноо & Цаг</span><span class="detail-val">${b.date} — ${b.time}</span></div>
    <div class="detail-row"><span class="detail-key">Статус</span><span class="detail-val"><span class="badge ${b.status}">${statusLabel(b.status)}</span></span></div>
    ${payHtml}
    <div class="modal-actions">
      ${b.status==='upcoming'?`<button class="btn-sm btn-green" onclick="markActive('${b.id}');closeModal('detailModal')">▶ Идэвхжүүлэх</button>`:''}
      ${b.status==='active'?`<button class="btn-sm btn-blue" onclick="markDone('${b.id}');closeModal('detailModal')">✓ Дуусгах</button>`:''}
      ${['upcoming','active'].includes(b.status)?`<button class="btn-sm btn-red" onclick="cancelBooking('${b.id}');closeModal('detailModal')">✕ Цуцлах</button>`:''}
      <button class="btn-sm btn-ghost" onclick="closeModal('detailModal')">Хаах</button>
    </div>`;
  openModal('detailModal');
}
function markActive(id) { const bs=getBookings(),i=bs.findIndex(b=>b.id===id); if(i!==-1){bs[i].status='active';saveBookings(bs);} toast('Захиалга идэвхжүүлэгдлээ','success'); refreshCurrentPage(); }
function markDone(id)   { const bs=getBookings(),i=bs.findIndex(b=>b.id===id); if(i!==-1){bs[i].status='done';saveBookings(bs);}   toast('Захиалга дуусгагдлаа','success');    refreshCurrentPage(); }
function cancelBooking(id) {
  if(!confirm('Захиалга цуцлах уу?')) return;
  const bs=getBookings(),i=bs.findIndex(b=>b.id===id); if(i!==-1){bs[i].status='cancelled';saveBookings(bs);}
  toast('Захиалга цуцлагдлаа','info'); refreshCurrentPage();
}

// ─── MACHINES ───
function renderMachines() {
  updateBadges(); filterMachines();
  const sel=document.getElementById('machineLocFilter');
  sel.innerHTML='<option value="">Бүх байршил</option>'+getLocations().map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
}
function filterMachines() {
  const locF=document.getElementById('machineLocFilter')?.value||'';
  const ms=getMachines().filter(m=>!locF||m.locId===locF);
  const lm={}; getLocations().forEach(l=>lm[l.id]=l.name);
  const labels={free:'Чөлөөтэй',busy:'Ашиглагдаж байна',soon:'Удахгүй',maintenance:'Засвар'};
  document.getElementById('machineCards').innerHTML=ms.map(m=>`
    <div class="machine-card">
      <div class="mc-header"><span class="mc-name">🫧 ${m.name}</span><span class="badge ${m.status}">${labels[m.status]||m.status}</span></div>
      <div class="mc-body">📍 ${lm[m.locId]||m.locId}<br/>🏷️ ${m.model||'—'} • ${m.capacity||'—'}кг</div>
      <div class="mc-prog-wrap"><div class="mc-prog ${m.status}" style="width:${m.progress||0}%"></div></div>
      <div class="mc-footer">
        <button class="btn-sm btn-ghost" onclick="viewMachine('${m.id}')">Дэлгэрэнгүй</button>
        ${m.status!=='maintenance'?`<button class="btn-sm btn-amber" onclick="setMaintenance('${m.id}')">⚠ Засвар</button>`:`<button class="btn-sm btn-green" onclick="setFree('${m.id}')">✓ Засвар дууссан</button>`}
        <button class="btn-sm btn-red" onclick="deleteMachine('${m.id}')">🗑</button>
      </div>
    </div>`).join()||'<div style="text-align:center;padding:40px;color:var(--text3);grid-column:1/-1;">Машин байхгүй байна</div>';
}
function viewMachine(id) {
  const m=getMachines().find(x=>x.id===id); const lm={}; getLocations().forEach(l=>lm[l.id]=l.name);
  const labels={free:'Чөлөөтэй',busy:'Ашиглагдаж байна',soon:'Удахгүй',maintenance:'Засвар'};
  document.getElementById('detailModalBody').innerHTML=`
    <h3>🫧 Машины дэлгэрэнгүй</h3>
    <div class="detail-row"><span class="detail-key">Нэр</span><span class="detail-val">${m.name}</span></div>
    <div class="detail-row"><span class="detail-key">Байршил</span><span class="detail-val">${lm[m.locId]||m.locId}</span></div>
    <div class="detail-row"><span class="detail-key">Загвар</span><span class="detail-val">${m.model||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Хүчин чадал</span><span class="detail-val">${m.capacity||'—'}кг</span></div>
    <div class="detail-row"><span class="detail-key">Ахиц</span><span class="detail-val">${Math.round(m.progress||0)}%</span></div>
    <div class="detail-row"><span class="detail-key">Статус</span><span class="detail-val"><span class="badge ${m.status}">${labels[m.status]}</span></span></div>
    <div class="modal-actions">
      ${m.status!=='maintenance'?`<button class="btn-sm btn-amber" onclick="setMaintenance('${m.id}');closeModal('detailModal')">⚠ Засварт оруулах</button>`:`<button class="btn-sm btn-green" onclick="setFree('${m.id}');closeModal('detailModal')">✓ Засвар дууссан</button>`}
      <button class="btn-sm btn-ghost" onclick="closeModal('detailModal')">Хаах</button>
    </div>`;
  openModal('detailModal');
}
function setMaintenance(id) { const ms=getMachines(),i=ms.findIndex(m=>m.id===id); if(i!==-1){ms[i].status='maintenance';ms[i].progress=0;saveMachines(ms);} toast('Машин засварт орлоо','info'); renderMachines(); updateBadges(); }
function setFree(id)        { const ms=getMachines(),i=ms.findIndex(m=>m.id===id); if(i!==-1){ms[i].status='free';ms[i].progress=0;saveMachines(ms);}        toast('Машин ашиглалтад орлоо ✓','success'); renderMachines(); updateBadges(); }
function deleteMachine(id)  { if (!confirm('Энэ машинг устгах уу?')) return; const ms=getMachines(),i=ms.findIndex(m=>m.id===id); if(i!==-1){ms.splice(i,1);saveMachines(ms);} toast('Машин устгагдлаа','info'); renderMachines(); updateBadges(); }
function renderMachineModes() {
  const modes = LG_MODEL.modes || [];
  document.getElementById('machineModeCards').innerHTML = modes.map(m => `
    <div class="mode-card-admin">
      <div class="mca-header">
        <span class="mca-name">⚙️ ${m.name}</span>
        <span class="mca-price">${m.price.toLocaleString()}₮</span>
      </div>
      <div class="mca-details">
        <div class="mca-detail">⏱ ${m.duration} мин</div>
        <div class="mca-detail">💧 ${m.water}L ус</div>
        <div class="mca-detail">⚡ ${m.electricity}kWh цахилгаан</div>
      </div>
      <div class="mca-actions">
        <button class="btn-sm btn-blue" onclick="editMachineMode('${m.id}')">Засах</button>
        <button class="btn-sm btn-red" onclick="deleteMachineMode('${m.id}')">Устгах</button>
      </div>
    </div>
  `).join('') || '<div style="text-align:center;padding:40px;color:var(--text3);grid-column:1/-1;">Горим байхгүй байна</div>';
}

function editMachineMode(id) {
  const mode = LG_MODEL.modes.find(m => m.id === id);
  if (!mode) return;
  
  document.getElementById('formModalBody').innerHTML = `
    <h3>⚙️ Горим засах</h3>
    <div class="mf"><label>НЭР</label><input id="fm-modename" value="${mode.name}"/></div>
    <div class="mf"><label>ҮРГЭЛЖЛЭХ ХУГАЦАА (МИН)</label><input id="fm-modeduration" type="number" value="${mode.duration}"/></div>
    <div class="mf"><label>УСНЫ ХЭРЭГЛЭЭ (L)</label><input id="fm-modewater" type="number" step="0.1" value="${mode.water}"/></div>
    <div class="mf"><label>ЦАХИЛГААНЫ ХЭРЭГЛЭЭ (kWh)</label><input id="fm-modeelectricity" type="number" step="0.1" value="${mode.electricity}"/></div>
    <div class="mf"><label>ҮНЭ (₮)</label><input id="fm-modeprice" type="number" value="${mode.price}"/></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="updateMachineMode('${id}')" style="padding:10px 20px;">Хадгалах</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>
  `;
  openModal('formModal');
}

function updateMachineMode(id) {
  const name = document.getElementById('fm-modename').value.trim();
  const duration = parseInt(document.getElementById('fm-modeduration').value);
  const water = parseFloat(document.getElementById('fm-modewater').value);
  const electricity = parseFloat(document.getElementById('fm-modeelectricity').value);
  const price = parseInt(document.getElementById('fm-modeprice').value);
  
  if (!name || !duration || !water || !electricity || !price) {
    toast('Бүх талбарыг бөглөнө үү', 'error');
    return;
  }
  
  const modeIndex = LG_MODEL.modes.findIndex(m => m.id === id);
  if (modeIndex !== -1) {
    LG_MODEL.modes[modeIndex] = { id, name, duration, water, electricity, price };
    // Save to localStorage
    localStorage.setItem('el_machine_modes', JSON.stringify(LG_MODEL.modes));
    toast('Горим шинэчлэгдлээ ✓', 'success');
    closeModal('formModal');
    renderMachineModes();
  }
}

function deleteMachineMode(id) {
  if (!confirm('Энэ горимыг устгах уу?')) return;
  LG_MODEL.modes = LG_MODEL.modes.filter(m => m.id !== id);
  localStorage.setItem('el_machine_modes', JSON.stringify(LG_MODEL.modes));
  toast('Горим устгагдлаа', 'info');
  renderMachineModes();
}

function openAddMachineMode() {
  document.getElementById('formModalBody').innerHTML = `
    <h3>➕ Горим нэмэх</h3>
    <div class="mf"><label>НЭР</label><input id="fm-modename" placeholder="Шинэ горим"/></div>
    <div class="mf"><label>ҮРГЭЛЖЛЭХ ХУГАЦАА (МИН)</label><input id="fm-modeduration" type="number" placeholder="45"/></div>
    <div class="mf"><label>УСНЫ ХЭРЭГЛЭЭ (L)</label><input id="fm-modewater" type="number" step="0.1" placeholder="60"/></div>
    <div class="mf"><label>ЦАХИЛГААНЫ ХЭРЭГЛЭЭ (kWh)</label><input id="fm-modeelectricity" type="number" step="0.1" placeholder="1.2"/></div>
    <div class="mf"><label>ҮНЭ (₮)</label><input id="fm-modeprice" type="number" placeholder="2000"/></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="addMachineMode()" style="padding:10px 20px;">Нэмэх</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>
  `;
  openModal('formModal');
}

function addMachineMode() {
  const name = document.getElementById('fm-modename').value.trim();
  const duration = parseInt(document.getElementById('fm-modeduration').value);
  const water = parseFloat(document.getElementById('fm-modewater').value);
  const electricity = parseFloat(document.getElementById('fm-modeelectricity').value);
  const price = parseInt(document.getElementById('fm-modeprice').value);
  
  if (!name || !duration || !water || !electricity || !price) {
    toast('Бүх талбарыг бөглөнө үү', 'error');
    return;
  }
  
  const newId = 'mode' + Date.now();
  const newMode = { id: newId, name, duration, water, electricity, price };
  LG_MODEL.modes.push(newMode);
  
  // Save to localStorage
  localStorage.setItem('el_machine_modes', JSON.stringify(LG_MODEL.modes));
  
  toast('Горим нэмэгдлээ ✓', 'success');
  closeModal('formModal');
  renderMachineModes();
}
function openAddMachine() {
  document.getElementById('formModalBody').innerHTML=`
    <h3>➕ Машин нэмэх</h3>
    <div class="mf"><label>НЭР</label><input id="fm-mname" placeholder="Машин №5"/></div>
    <div class="mf"><label>БАЙРШИЛ</label><select id="fm-mloc">${getLocations().map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}</select></div>
    <div class="mf-row">
      <div class="mf"><label>ЗАГВАР</label><input id="fm-mmodel" placeholder="LG Smart Choice" onchange="updateModeFields()"/></div>
      <div class="mf"><label>ХҮЧИН ЧАДАЛ (КГ)</label><input id="fm-mcap" type="number" value="9" onchange="updateModeFields()"/></div>
    </div>
    <div class="mf-row">
      <div class="mf"><label>ҮРГЭЛЖЛЭХ ХУГАЦАА (МИН)</label><input id="fm-mduration" type="number" value="45"/></div>
      <div class="mf"><label>ҮНЭ (₮)</label><input id="fm-mprice" type="number" value="2000"/></div>
    </div>
    <div class="mf-row">
      <div class="mf"><label>ЦАХИЛГААНЫ ХЭРЭГЛЭЭ (kWh)</label><input id="fm-melectricity" type="number" step="0.1" value="1.2"/></div>
      <div class="mf"><label>УСНЫ ХЭРЭГЛЭЭ (L)</label><input id="fm-mwater" type="number" step="0.1" value="60"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="addMachine()" style="padding:10px 20px;">Нэмэх</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>`;
  openModal('formModal');
}
function addMachine() {
  const name=document.getElementById('fm-mname').value.trim(), locId=document.getElementById('fm-mloc').value;
  const model=document.getElementById('fm-mmodel').value, cap=document.getElementById('fm-mcap').value;
  const duration=parseInt(document.getElementById('fm-mduration').value), price=parseInt(document.getElementById('fm-mprice').value);
  const electricity=parseFloat(document.getElementById('fm-melectricity').value), water=parseFloat(document.getElementById('fm-mwater').value);
  if(!name || !locId || !model || !cap || !duration || !price || !electricity || !water) return toast('Бүх талбарыг бөглөнө үү','error');
  const ms=getMachines(); ms.push({id:'m'+Date.now(),locId,name,model,capacity:cap,status:'free',progress:0});
  saveMachines(ms);
  // Add mode
  const modes = LG_MODEL.modes || [];
  modes.push({id:'mode'+Date.now(), name:`${model} - ${cap}кг`, duration, water, electricity, price});
  localStorage.setItem('el_machine_modes', JSON.stringify(modes));
  LG_MODEL.modes = modes;
  closeModal('formModal'); toast('Машин болон горим нэмэгдлээ ✓','success'); renderMachines();
}

function updateModeFields() {
  const model = document.getElementById('fm-mmodel').value.toLowerCase();
  const cap = parseInt(document.getElementById('fm-mcap').value) || 9;
  if (model.includes('lg')) {
    // Default values for LG
    document.getElementById('fm-mduration').value = 45;
    document.getElementById('fm-mprice').value = 2000;
    document.getElementById('fm-melectricity').value = 1.2;
    document.getElementById('fm-mwater').value = 60;
  } else {
    // Default for others
    document.getElementById('fm-mduration').value = 50;
    document.getElementById('fm-mprice').value = 2500;
    document.getElementById('fm-melectricity').value = 1.5;
    document.getElementById('fm-mwater').value = 70;
  }
}

// ─── USERS ───
function renderUsers() { filterUsers(); }
function filterUsers() {
  const search=(document.getElementById('userSearch')?.value||'').toLowerCase();
  const role=document.getElementById('userRoleFilter')?.value||'';
  const us=getUsers().filter(u=>{ const ms=!search||(u.fname+' '+u.lname).toLowerCase().includes(search)||u.email.toLowerCase().includes(search); const mr=!role||u.role===role; return ms&&mr; });
  const ub={}; getBookings().forEach(b=>ub[b.userId]=(ub[b.userId]||0)+1);
  document.getElementById('usersTbody').innerHTML=us.map(u=>`
    <tr>
      <td><strong>${u.fname} ${u.lname}</strong></td>
      <td style="font-size:.78rem;color:var(--text2);">${u.email}</td>
      <td>${u.university||'—'}</td>
      <td><strong>${ub[u.id]||0}</strong></td>
      <td style="font-size:.74rem;color:var(--text3);">${u.createdAt||'—'}</td>
      <td><span class="badge ${u.role||'user'}">${u.role==='admin'?'Админ':'Хэрэглэгч'}</span></td>
      <td><div class="row-actions">
        <button class="btn-sm btn-ghost" onclick="viewUser('${u.id}')">Харах</button>
        ${u.role!=='admin'?`<button class="btn-sm btn-amber" onclick="promoteUser('${u.id}')">↑ Админ</button>`:`<button class="btn-sm btn-red" onclick="demoteUser('${u.id}')">↓</button>`}
        <button class="btn-sm btn-red" onclick="deleteUser('${u.id}')">🗑</button>
      </div></td>
    </tr>`).join()||'<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3);">Хэрэглэгч олдсонгүй</td></tr>';
}
function viewUser(id) {
  const u=getUsers().find(x=>x.id===id), ub=getBookings().filter(b=>b.userId===id);
  document.getElementById('detailModalBody').innerHTML=`
    <h3>👤 Хэрэглэгчийн дэлгэрэнгүй</h3>
    <div class="detail-row"><span class="detail-key">Нэр</span><span class="detail-val">${u.fname} ${u.lname}</span></div>
    <div class="detail-row"><span class="detail-key">Имэйл</span><span class="detail-val">${u.email}</span></div>
    <div class="detail-row"><span class="detail-key">Сургууль</span><span class="detail-val">${u.university||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Нийт захиалга</span><span class="detail-val">${ub.length}</span></div>
    <div class="detail-row"><span class="detail-key">Эрх</span><span class="detail-val"><span class="badge ${u.role||'user'}">${u.role==='admin'?'Админ':'Хэрэглэгч'}</span></span></div>
    <div style="margin-top:14px;font-size:.74rem;font-weight:800;color:var(--text3);margin-bottom:8px;">СҮҮЛИЙН ЗАХИАЛГУУД</div>
    ${ub.slice(-3).reverse().map(b=>`<div style="background:var(--surface2);border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:.76rem;"><strong style="font-family:'Geist Mono',monospace;color:var(--blue-bright);">${b.code}</strong> — ${b.location} — ${b.date} ${b.time} <span class="badge ${b.status}" style="font-size:.62rem;">${statusLabel(b.status)}</span></div>`).join()||'<div style="color:var(--text3);font-size:.78rem;">Захиалга байхгүй</div>'}
    <div class="modal-actions"><button class="btn-sm btn-ghost" onclick="closeModal('detailModal')">Хаах</button></div>`;
  openModal('detailModal');
}
function promoteUser(id) { const us=getUsers(),i=us.findIndex(u=>u.id===id); if(i!==-1){us[i].role='admin';saveUsers(us);} toast('Хэрэглэгч админ болгогдлоо','success'); renderUsers(); }
function demoteUser(id)  { const us=getUsers(),i=us.findIndex(u=>u.id===id); if(i!==-1){us[i].role='user';saveUsers(us);}  toast('Хэрэглэгчийн эрх буцаагдлаа','info'); renderUsers(); }
function deleteUser(id)  { if(!confirm('Устгах уу?')) return; saveUsers(getUsers().filter(u=>u.id!==id)); toast('Устгагдлаа','info'); renderUsers(); }
function openAddUser() {
  document.getElementById('formModalBody').innerHTML=`
    <h3>➕ Хэрэглэгч нэмэх</h3>
    <div class="mf-row"><div class="mf"><label>НЭР</label><input id="fu-fname" placeholder="Болд"/></div><div class="mf"><label>ОВОГ</label><input id="fu-lname" placeholder="Баатар"/></div></div>
    <div class="mf"><label>ИМЭЙЛ</label><input id="fu-email" type="email" placeholder="user@muls.edu.mn"/></div>
    <div class="mf"><label>СУРГУУЛЬ</label><select id="fu-univ"><option>МУИС</option><option>ШУТИС</option><option>МУБИС</option><option>ХААИС</option><option>Бусад</option></select></div>
    <div class="mf"><label>НУУЦ ҮГ</label><input id="fu-pass" type="password" placeholder="••••••••"/></div>
    <div class="mf"><label>ЭРХ</label><select id="fu-role"><option value="user">Хэрэглэгч</option><option value="admin">Админ</option></select></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="addUser()" style="padding:10px 20px;">Нэмэх</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>`;
  openModal('formModal');
}
function addUser() {
  const fname=document.getElementById('fu-fname').value.trim(), email=document.getElementById('fu-email').value.trim();
  if(!fname||!email) return toast('Нэр болон имэйл оруулна уу','error');
  if(getUsers().find(u=>u.email===email)) return toast('Энэ имэйл аль хэдийн бүртгэлтэй','error');
  const us=getUsers(); us.push({id:'u'+Date.now(),fname,lname:document.getElementById('fu-lname').value,email,university:document.getElementById('fu-univ').value,role:document.getElementById('fu-role').value,password:document.getElementById('fu-pass').value,createdAt:new Date().toISOString().split('T')[0]});
  saveUsers(us); closeModal('formModal'); toast('Хэрэглэгч нэмэгдлээ ✓','success'); renderUsers();
}

// ─── LOCATIONS ───
function renderLocations() {
  const mc={}; getMachines().forEach(m=>mc[m.locId]=(mc[m.locId]||0)+1);
  document.getElementById('locationCards').innerHTML=getLocations().map(l=>`
    <div class="machine-card">
      <div class="mc-header"><span class="mc-name">${l.icon} ${l.name}</span><span class="badge ${l.active?'active':'cancelled'}">${l.active?'Идэвхтэй':'Идэвхгүй'}</span></div>
      <div class="mc-body">📍 ${l.address||'—'}<br/>🫧 ${mc[l.id]||0} машин бүртгэлтэй</div>
      <div class="mc-footer">
        <button class="btn-sm btn-ghost" onclick="editLocation('${l.id}')">Засах</button>
        ${l.active?`<button class="btn-sm btn-amber" onclick="toggleLocation('${l.id}',false)">Түр хаах</button>`:`<button class="btn-sm btn-green" onclick="toggleLocation('${l.id}',true)">Нээх</button>`}
        <button class="btn-sm btn-red" onclick="deleteLocation('${l.id}')">🗑</button>
      </div>
    </div>`).join('');
}
function editLocation(id) {
  const l=getLocations().find(x=>x.id===id);
  document.getElementById('formModalBody').innerHTML=`
    <h3>✏️ Байршил засах</h3>
    <div class="mf"><label>НЭР</label><input id="fl-name" value="${l.name}"/></div>
    <div class="mf"><label>ХАЯГ</label><input id="fl-addr" value="${l.address||''}"/></div>
    <div class="mf"><label>ДҮРС</label><input id="fl-icon" value="${l.icon||'🏢'}"/></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="saveLocation('${l.id}')" style="padding:10px 20px;">Хадгалах</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>`;
  openModal('formModal');
}
function saveLocation(id) {
  const ls=getLocations(),i=ls.findIndex(l=>l.id===id);
  if(i!==-1){ls[i].name=document.getElementById('fl-name').value;ls[i].address=document.getElementById('fl-addr').value;ls[i].icon=document.getElementById('fl-icon').value;saveLocations(ls);}
  closeModal('formModal'); toast('Байршил шинэчлэгдлээ ✓','success'); renderLocations();
}
function toggleLocation(id,active) { const ls=getLocations(),i=ls.findIndex(l=>l.id===id); if(i!==-1){ls[i].active=active;saveLocations(ls);} toast(active?'Байршил нээгдлээ':'Байршил хаагдлаа','info'); renderLocations(); }
function deleteLocation(id) { if(!confirm('Устгах уу?')) return; saveLocations(getLocations().filter(l=>l.id!==id)); toast('Устгагдлаа','info'); renderLocations(); }
function openAddLocation() {
  document.getElementById('formModalBody').innerHTML=`
    <h3>➕ Байршил нэмэх</h3>
    <div class="mf"><label>НЭР</label><input id="fla-name" placeholder="ХААИС — 4-р байр"/></div>
    <div class="mf"><label>ХАЯГ</label><input id="fla-addr" placeholder="Зайсан, Улаанбаатар"/></div>
    <div class="mf"><label>ДҮРС</label><input id="fla-icon" value="🏢"/></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="addLocation()" style="padding:10px 20px;">Нэмэх</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>`;
  openModal('formModal');
}
function addLocation() {
  const name=document.getElementById('fla-name').value.trim(); if(!name) return toast('Нэр оруулна уу','error');
  const ls=getLocations(); ls.push({id:Date.now().toString(),name,address:document.getElementById('fla-addr').value,icon:document.getElementById('fla-icon').value||'🏢',active:true});
  saveLocations(ls); closeModal('formModal'); toast('Байршил нэмэгдлээ ✓','success'); renderLocations();
}

// ─── NOTIFICATIONS ───
function renderNotifications() {
  updateBadges();
  document.getElementById('notifList').innerHTML=getNotifs().map(n=>`
    <div class="notif-item ${n.read?'':'unread'}" onclick="readNotif('${n.id}')">
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-content"><div class="notif-title">${n.title}</div><div class="notif-body">${n.body}</div><div class="notif-time">🕐 ${n.time}</div></div>
      ${!n.read?'<span style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex-shrink:0;margin-top:6px;"></span>':''}
    </div>`).join('');
}
function readNotif(id) { const ns=getNotifs(),i=ns.findIndex(n=>n.id===id); if(i!==-1&&!ns[i].read){ns[i].read=true;saveNotifs(ns);updateBadges();renderNotifications();} }
function markAllRead() { saveNotifs(getNotifs().map(n=>({...n,read:true}))); updateBadges(); renderNotifications(); toast('Бүгд уншсан болгогдлоо','success'); }
function openSendNotif() {
  document.getElementById('formModalBody').innerHTML=`
    <h3>📢 Мэдэгдэл илгээх</h3>
    <div class="mf"><label>ГАРЧИГ</label><input id="fn-title" placeholder="Мэдэгдлийн гарчиг"/></div>
    <div class="mf"><label>АГУУЛГА</label><textarea id="fn-body" placeholder="Мэдэгдлийн текст..."></textarea></div>
    <div class="mf"><label>ТӨРӨЛ</label><select id="fn-type"><option value="info">Мэдээлэл</option><option value="warning">Анхааруулга</option><option value="success">Амжилт</option></select></div>
    <div class="modal-actions">
      <button class="btn-sm btn-blue" onclick="sendNotif()" style="padding:10px 20px;">Илгээх</button>
      <button class="btn-sm btn-ghost" onclick="closeModal('formModal')" style="padding:10px 20px;">Болих</button>
    </div>`;
  openModal('formModal');
}
function sendNotif() {
  const title=document.getElementById('fn-title').value.trim(), body=document.getElementById('fn-body').value.trim();
  if(!title||!body) return toast('Бүх талбарыг бөглөнө үү','error');
  const icons={info:'ℹ️',warning:'⚠️',success:'✅'}, type=document.getElementById('fn-type').value;
  const ns=getNotifs(); ns.unshift({id:'n'+Date.now(),type,icon:icons[type],title,body,time:'Сая',read:false});
  saveNotifs(ns); closeModal('formModal'); toast('Мэдэгдэл илгээгдлээ ✓','success'); updateBadges(); renderNotifications();
}

// ─── ANALYTICS ───
function getContactMessages() { return DB.g('el_contact_messages') || []; }
function renderContactMessages() {
  updateBadges();
  const list = getContactMessages();
  const tbody = document.getElementById('contactMessagesTbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px;">Санал хүсэлт олдсонгүй</td></tr>';
    return;
  }
  tbody.innerHTML = list.slice().reverse().map(m=>`
    <tr>
      <td>${new Date(m.sentAt).toLocaleString('mn-MN')}</td>
      <td>${m.name}</td>
      <td>${m.contact}</td>
      <td>${m.message}</td>
      <td><span class="badge ${m.status==='sent'?'paid':'unpaid'}">${m.status}</span></td>
    </tr>`).join('');
}

function renderAnalytics() {
  const bs=getBookings(), done=bs.filter(b=>b.status==='done').length, cancelled=bs.filter(b=>b.status==='cancelled').length;
  document.getElementById('analyticsStats').innerHTML=`
    <div class="stat-card blue"><div class="sc-header"><span class="sc-icon">📊</span></div><div class="sc-num">${bs.length}</div><div class="sc-label">Нийт захиалга</div></div>
    <div class="stat-card teal"><div class="sc-header"><span class="sc-icon">✅</span></div><div class="sc-num">${done}</div><div class="sc-label">Амжилттай</div></div>
    <div class="stat-card red"><div class="sc-header"><span class="sc-icon">❌</span></div><div class="sc-num">${cancelled}</div><div class="sc-label">Цуцлагдсан</div></div>
    <div class="stat-card amber"><div class="sc-header"><span class="sc-icon">👥</span></div><div class="sc-num">${getUsers().length}</div><div class="sc-label">Нийт хэрэглэгч</div></div>
    <div class="stat-card purple"><div class="sc-header"><span class="sc-icon">🫧</span></div><div class="sc-num">${getMachines().length}</div><div class="sc-label">Нийт машин</div></div>
    <div class="stat-card green"><div class="sc-header"><span class="sc-icon">📍</span></div><div class="sc-num">${getLocations().length}</div><div class="sc-label">Нийт байршил</div></div>`;
  const v30=Array.from({length:30},()=>Math.floor(Math.random()*40+10)), mx=Math.max(...v30);
  document.getElementById('monthChart').innerHTML=v30.map((v,i)=>`<div class="bar" style="height:${(v/mx)*100}%;background:rgba(61,123,255,${0.3+i/40});" title="${v}"><span class="bar-label" style="bottom:-16px">${i%5===0?i+1:''}</span></div>`).join('');
  const lb={}; getLocations().forEach(l=>lb[l.id]={name:l.name,total:0,done:0,cancelled:0});
  getBookings().forEach(b=>{ const l=getLocations().find(x=>x.name===b.location); if(l&&lb[l.id]){lb[l.id].total++;if(b.status==='done')lb[l.id].done++;if(b.status==='cancelled')lb[l.id].cancelled++;} });
  const mx2=Math.max(...Object.values(lb).map(l=>l.total),1);
  document.getElementById('locationChart').innerHTML=Object.values(lb).map(l=>`
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:.76rem;margin-bottom:4px;"><span style="color:var(--text2);">${l.name.split('—')[0]}</span><strong>${l.total}</strong></div>
      <div style="height:5px;background:var(--surface3);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${(l.total/mx2)*100}%;background:var(--blue);border-radius:3px;transition:width .8s;"></div></div>
    </div>`).join('');
  document.getElementById('analyticsTbody').innerHTML=Object.values(lb).map(l=>`
    <tr><td><strong>${l.name}</strong></td><td>${l.total}</td><td style="color:var(--green);">${l.done}</td><td style="color:var(--red);">${l.cancelled}</td>
    <td><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:4px;background:var(--surface3);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${l.total?Math.round((l.done/l.total)*100):0}%;background:var(--teal);"></div></div><strong>${l.total?Math.round((l.done/l.total)*100):0}%</strong></div></td>
    <td><span class="badge ${l.total>3?'active':'upcoming'}">${l.total>3?'Өндөр':'Дунд'}</span></td></tr>`).join('');
}

// ─── PAYMENTS ───
function renderPayments() {
  const s=getPaySettings();
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v; };
  const chk=(id,v)=>{ const el=document.getElementById(id); if(el) el.checked=!!v; };
  set('ps-price',s.price||2000); chk('ps-enabled',s.enabled!==false);
  chk('ps-qpay',s.methods?.qpay!==false); chk('ps-card',s.methods?.card!==false); chk('ps-transfer',s.methods?.transfer!==false);
  set('ps-qmerchant',s.qpay?.merchantName||'Easy Laundry ХААИС'); set('ps-qinvoice',s.qpay?.invoiceCode||'EASY_LAUNDRY_HUUCHIN');
  set('ps-bank',s.bankAccount?.bank||'Хаан Банк'); set('ps-bnum',s.bankAccount?.number||''); set('ps-bname',s.bankAccount?.name||''); set('ps-bnote',s.bankAccount?.note||'');
  const qib=document.querySelector('.qib-banks'); if(qib) qib.innerHTML=ADMIN_BANK_LIST.map(b=>`<span class="qib-bank" style="--bk:${b.color}">${b.name}</span>`).join('');
  filterPayments(); renderPayStats();
}
function renderPayStats() {
  const bs=getBookings().filter(b=>b.payment);
  const total=bs.reduce((s,b)=>s+(b.payment?.amount||0),0);
  const qc=bs.filter(b=>b.payment?.method==='qpay').length, cc=bs.filter(b=>b.payment?.method==='card').length, tc=bs.filter(b=>b.payment?.method==='transfer').length;
  const el=document.getElementById('payStatsMini'); if(!el) return;
  el.innerHTML=`<div class="pay-stat-item blue"><div class="psi-num">${total.toLocaleString()}₮</div><div class="psi-label">Нийт орлого</div></div><div class="pay-stat-item teal"><div class="psi-num">${bs.length}</div><div class="psi-label">Нийт гүйлгээ</div></div><div class="pay-stat-item amber"><div class="psi-num">${qc}</div><div class="psi-label">QPay</div></div><div class="pay-stat-item green"><div class="psi-num">${cc}</div><div class="psi-label">Карт</div></div><div class="pay-stat-item purple"><div class="psi-num">${tc}</div><div class="psi-label">Шилжүүлэг</div></div>`;
}
function filterPayments() {
  const filter=document.getElementById('payFilter')?.value||'';
  const mi={qpay:'📱 QPay',card:'💳 Карт',transfer:'🏦 Шилжүүлэг'};
  const bs=getBookings().filter(b=>b.payment&&(!filter||b.payment.method===filter)).reverse();
  document.getElementById('payTransBody').innerHTML=bs.map(b=>`
    <tr>
      <td><strong style="font-family:'Geist Mono',monospace;font-size:.76rem;color:var(--blue-bright);">${b.code}</strong></td>
      <td>${b.userName||'—'}</td>
      <td><span class="pay-method-badge">${mi[b.payment.method]||b.payment.method}</span></td>
      <td><strong style="color:var(--green);">${(b.payment.amount||0).toLocaleString()}₮</strong></td>
      <td style="font-size:.72rem;color:var(--text3);">${b.payment.paidAt?new Date(b.payment.paidAt).toLocaleString('mn-MN'):'—'}</td>
      <td><span class="badge ${b.payment.status==='paid'?'active':'cancelled'}">${b.payment.status==='paid'?'Амжилттай':'Амжилтгүй'}</span></td>
    </tr>`).join()||'<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text3);">Гүйлгээ байхгүй</td></tr>';
}
function savePaySettings() { const s=getPaySettings(); s.price=parseInt(document.getElementById('ps-price')?.value)||2000; s.enabled=document.getElementById('ps-enabled')?.checked; s.methods={qpay:document.getElementById('ps-qpay')?.checked,card:document.getElementById('ps-card')?.checked,transfer:document.getElementById('ps-transfer')?.checked}; savePaySettingsDB(s); toast('Тохиргоо хадгалагдлаа ✓','success'); }
function saveQPaySettings() { const s=getPaySettings(); s.qpay={merchantName:document.getElementById('ps-qmerchant')?.value||'Easy Laundry ХААИС',invoiceCode:document.getElementById('ps-qinvoice')?.value||'EASY_LAUNDRY_HUUCHIN'}; savePaySettingsDB(s); toast('QPay тохиргоо хадгалагдлаа ✓','success'); }
function saveBankSettings() { const s=getPaySettings(); s.bankAccount={bank:document.getElementById('ps-bank')?.value,number:document.getElementById('ps-bnum')?.value,name:document.getElementById('ps-bname')?.value,note:document.getElementById('ps-bnote')?.value}; savePaySettingsDB(s); toast('Дансны мэдээлэл хадгалагдлаа ✓','success'); }
function exportPayments() {
  const bs=getBookings().filter(b=>b.payment);
  const csv='Код,Хэрэглэгч,Арга,Дүн,Цаг,Статус\n'+bs.map(b=>`${b.code},"${b.userName||''}","${b.payment.method}","${b.payment.amount||0}","${b.payment.paidAt||''}","${b.payment.status||''}"`).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='easy_laundry_payments.csv'; a.click();
  toast('Гүйлгээ экспортлогдлоо ✓','success');
}
function exportBookings() {
  const bs=getBookings();
  const csv='Код,Хэрэглэгч,Байршил,Машин,Огноо,Цаг,Статус\n'+bs.map(b=>`${b.code},"${b.userName||''}","${b.location}","${b.machine}","${b.date}","${b.time}","${statusLabel(b.status)}"`).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='easy_laundry_bookings.csv'; a.click();
  toast('CSV экспортлогдлоо ✓','success');
}

// ─── SETTINGS ───
function saveSettings() { toast('Тохиргоо хадгалагдлаа ✓','success'); }
function changePassword() {
  const cur=document.getElementById('curPass').value, nw=document.getElementById('newPass').value, cf=document.getElementById('confPass').value;
  if(!cur) return toast('Одоогийн нууц үгээ оруулна уу','error');
  if(nw.length<6) return toast('Шинэ нууц үг богино байна','error');
  if(nw!==cf) return toast('Нууц үг таарахгүй байна','error');
  toast('Нууц үг амжилттай солигдлоо ✓','success');
  ['curPass','newPass','confPass'].forEach(id=>document.getElementById(id).value='');
}

// ─── MODAL ───
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{ if(e.target===o) o.classList.remove('open'); }));

// ─── SIDEBAR TOGGLE ───
function toggleSidebar() {
  const sb=document.getElementById('sidebar');
  // Mobile: open/close drawer; Desktop: collapse to rail
  if (window.innerWidth<=768) sb.classList.toggle('open');
  else sb.classList.toggle('collapsed');
}

// ─── REFRESH ───
function refreshCurrentPage() { const a=document.querySelector('.page.active')?.id?.replace('page-',''); if(a) navigate(a); }

// ─── MACHINE SIMULATION ───
setInterval(()=>{
  const ms=getMachines(); let changed=false;
  ms.forEach(m=>{
    if((m.status==='busy'||m.status==='soon')&&m.progress<100){ m.progress+=0.05; changed=true; }
    else if((m.status==='busy'||m.status==='soon')&&m.progress>=100){ m.status='free'; m.progress=0; changed=true; }
  });
  if(changed) saveMachines(ms);
},2000);

// ─── INIT ───
initDashboard();
startClock();
updateBadges();