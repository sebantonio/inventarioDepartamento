// Roles y permisos basados en la columna "rol" de la hoja Usuarios.

const ROLE_PERMISSIONS = {
  'jefe departamento': ['*'],
  'jefe de departamento': ['*'],
  'administrador': ['*'],
  'admin': ['*'],
  'profesor': [
    'items.write',
    'docs.write',
    'loans.write',
    'orders.write',
    'profile.write'
  ],
  'consulta': [
    'profile.write'
  ],
  'lector': [
    'profile.write'
  ]
};

const ACTION_PERMISSIONS = {
  add: 'items.write',
  update: 'items.write',
  delete: 'items.delete',
  bulkImport: 'import.write',
  restoreBackup: 'import.write',
  profAdd: 'profesores.manage',
  profUpdate: 'profesores.manage',
  profDelete: 'profesores.manage',
  aulasSync: 'config.manage',
  catsSync: 'config.manage',
  ciclosSync: 'config.manage',
  prestar: 'loans.write',
  devolver: 'loans.write',
  getDocs: 'docs.read',
  uploadDoc: 'docs.write',
  deleteDoc: 'docs.write',
  updateProfile: 'profile.write',
  changePassword: 'profile.write',
  notificarPedido: 'orders.write'
};

function normalizeRole(role){
  return String(role || 'consulta')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function userRole(){
  return normalizeRole(SESSION?.rol);
}

function can(permission){
  if(!SESSION) return false;
  if(permission === 'docs.read') return true;
  const perms = ROLE_PERMISSIONS[userRole()] || ROLE_PERMISSIONS.consulta;
  return perms.includes('*') || perms.includes(permission);
}

function canAction(action){
  const permission = ACTION_PERMISSIONS[action];
  return permission ? can(permission) : false;
}

function requirePerm(permission, message){
  if(can(permission)) return true;
  if(typeof toast === 'function') toast(message || 'No tienes permisos para realizar esta acci\u00f3n', 'err');
  return false;
}

function roleLabel(){
  const labels = {
    'jefe departamento': 'Jefe Departamento',
    'jefe de departamento': 'Jefe Departamento',
    administrador: 'Administrador',
    admin: 'Administrador',
    profesor: 'Profesor',
    consulta: 'Consulta',
    lector: 'Lector'
  };
  return labels[userRole()] || (SESSION?.rol || 'Consulta');
}

function applyRoleUI(){
  const rules = [
    ['btnN', 'items.write', 'flex'],
    ['btnE', 'import.write', 'flex'],
    ['btnImp', 'import.write', 'flex'],
    ['btnPres', 'loans.write', 'flex'],
    ['btnPed', 'orders.write', 'flex'],
    ['btnQr', null, ''],
    ['gsQr', null, 'inline-flex']
  ];
  rules.forEach(([id, permission, displayType]) => {
    const el = document.getElementById(id);
    if(el) el.style.display = (permission === null || can(permission)) ? displayType : 'none';
  });
  document.querySelectorAll('[data-perm]').forEach(el => {
    el.style.display = can(el.dataset.perm) ? 'flex' : 'none';
  });
}
