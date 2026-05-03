// ═════════════════════════════════════════════════════════
// ESTADO
// ═════════════════════════════════════════════════════════
let API_URL = 'https://script.google.com/macros/s/AKfycbxq-MatNCl9RJ96ESSmOzSqe9rZrEuU_RE7BCn0G2DbiI17QJ5IXwZppCc14JfGdZveIw/exec';
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
