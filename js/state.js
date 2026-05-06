// ═════════════════════════════════════════════════════════
// ESTADO
// ═════════════════════════════════════════════════════════
let API_URL = 'https://script.google.com/macros/s/AKfycbw5icxr6gpvtB_kirhLmuH5pusmXV6lWU9P18_EPD3zrxKy9oz91ipcZRbN34hlECEpBQ/exec';
let SESSION = JSON.parse(localStorage.getItem('inv_session') || 'null');
let items = [];
let profesores = [];
let prestamos = [];
let cf = null;
let currentCiclo = null;
let view = 'table';
let sk = 'item', sa = true;
let eid = null;
let currentPresTab = 'activos';
let prestarItemId = null;
let devolverPresId = null;

function setConn(state, txt){
  const el = document.getElementById('connStatus');
  el.className = 'conn-status ' + state;
  document.getElementById('connTxt').textContent = txt;
}

function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active')}

function needsMaintenance(item){
  return item?.mant === true || item?.mant === 1 || String(item?.mant || '').trim() === '1' || item?.est === 'Avería';
}
