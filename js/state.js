// ═════════════════════════════════════════════════════════
// ESTADO
// ═════════════════════════════════════════════════════════
let API_URL = 'https://script.google.com/macros/s/AKfycbxaZP2-3-3vwyEVwmsHtmg4rttjilVeffJcxGh2TcchOYq_S-uTdIjQwv2hJBzDSJte/exec';
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
