---
name: Próxima funcionalidad — Sistema de roles
description: Implementar control de acceso por rol (Admin, Jefe/a Departamento, Profesor/a)
type: project
originSessionId: 1eccfd6a-ad24-41d0-8c3d-b05ea08339a6
---
El siguiente paso acordado es implementar un sistema de roles con privilegios diferenciados.

**Roles previstos:**
- `Admin` — acceso total (gestión de usuarios, ciclos, aulas, categorías, todo)
- `Jefe Departamento` — ya existe en la hoja Usuarios; recibe CC en emails; gestión de inventario, préstamos, pedidos
- `Profesor` — rol más restringido (pendiente de definir privilegios exactos con el usuario)

**Why:** Actualmente cualquier usuario logueado tiene acceso a todo. Se necesita separar qué puede hacer cada tipo de usuario.

**How to apply:** Antes de implementar, preguntar al usuario qué acciones concretas puede hacer cada rol (especialmente `Profesor/a`, que es el más restrictivo). El campo `rol` ya existe en la hoja Usuarios (col 4). La lógica de restricción deberá aplicarse tanto en frontend (ocultar botones) como idealmente en backend (GAS verifica rol antes de ejecutar acciones sensibles).

**Estado:** Pendiente. No iniciado.
