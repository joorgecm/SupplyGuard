# SupplyGuard: el backend explicado paso a paso

Este documento explica cómo funciona el backend de SupplyGuard **para alguien que está empezando**. Cada término técnico se explica la primera vez que aparece, y al final hay un glosario.

---

## 1. ¿Qué es el backend?

Una aplicación web se divide en dos partes:

- **Frontend**: lo que ves y tocas (pantallas, botones, formularios).
- **Backend**: la parte que no se ve. Guarda los datos, aplica las reglas y decide quién puede hacer qué.

**Analogía del restaurante:**

| Restaurante | SupplyGuard |
|---|---|
| El comensal que pide | El frontend (o Swagger, ver más abajo) |
| El camarero que lleva los pedidos | La API |
| La cocina, donde se aplican las recetas | Los servicios (las reglas) |
| La despensa donde se guarda todo | La base de datos |
| El portero que mira si estás en la lista | El login y los roles |

El frontend nunca toca la base de datos directamente. Siempre le pide cosas al backend, y el backend decide si se puede o no.

### ¿Qué es una API?
Es la "carta" del restaurante: la lista de cosas que se pueden pedir al backend. Cada cosa que se puede pedir se llama **endpoint** y tiene dos partes:

- Un **verbo**: `GET` (consultar), `POST` (crear), `PATCH` (modificar), `DELETE` (borrar).
- Una **ruta**: por ejemplo `/incidents`.

Así, `GET /incidents` significa "dame la lista de incidencias" y `POST /incidents` significa "crea una incidencia nueva". Las respuestas se devuelven en un formato de texto llamado **JSON**, que se ve así: `{"id": 1, "title": "Agujeros descentrados"}`.

### ¿Qué hay hecho ya?
Usuarios con roles, login, proveedores, piezas, incidencias, planes de acción, tareas e historial. **Todavía no hay**: KPIs (indicadores), PDF, avisos a Teams/Discord ni exportación a BigQuery.

---

## 2. Las herramientas: qué hace cada una

Piensa en cada herramienta como un trabajador con una tarea concreta.

| Herramienta | Su trabajo en palabras simples |
|---|---|
| **Python** | El lenguaje en el que está escrito todo |
| **FastAPI** | El esqueleto de la API: permite definir los endpoints y crea sola una página de pruebas (Swagger) |
| **Uvicorn** | El "motor" que arranca la aplicación y la deja escuchando peticiones |
| **Pydantic** | El revisor de formularios: comprueba que los datos que llegan tienen sentido (un email con forma de email, un título que no esté vacío...) |
| **PostgreSQL** | La base de datos: donde se guardan los datos de forma permanente |
| **Neon** | Un servicio en internet que aloja PostgreSQL por nosotros, así no hay que instalarlo |
| **SQLAlchemy** | El traductor entre Python y la base de datos: nos deja escribir código Python en vez de SQL |
| **Alembic** | El historial de cambios de la base de datos (explicado en la sección 9) |
| **PyJWT** | Crea y comprueba los "pases" de acceso (tokens) del login |
| **Argon2 (pwdlib)** | Convierte las contraseñas en un código ilegible antes de guardarlas |
| **pytest** | Ejecuta las pruebas automáticas |
| **ruff** | Revisa que el código esté ordenado y sin errores tontos |

**Equivalencias con lo que ya conoces:** FastAPI ≈ ASP.NET Core / Spring Boot, SQLAlchemy ≈ Entity Framework / JPA, Alembic ≈ migraciones de EF, Pydantic ≈ los DTO con validaciones.

### Swagger: tu mejor amigo para probar
Cuando la API está en marcha, abre `http://localhost:8000/docs`. Verás una página con todos los endpoints donde puedes probarlos con un clic, sin necesidad de frontend.

---

## 3. Cómo está organizado el código

Todo el código está en la carpeta `backend/app/`, dividido en **capas**. Cada capa tiene un solo trabajo:

```
api/        →  La puerta de entrada. Recibe la petición y comprueba permisos.
schemas/    →  El formulario. Define qué datos se aceptan y cuáles se devuelven.
services/   →  El cerebro. Aplica las reglas del negocio.
models/     →  La estructura de las tablas de la base de datos.
core/       →  Las piezas básicas: configuración, conexión, seguridad, errores.
scripts/    →  Programas sueltos que se lanzan a mano (por ejemplo, crear el primer admin).
```

Una petición siempre recorre las capas en este orden:

```
Petición del cliente
        ↓
   api/       "¿Quién eres? ¿Tienes permiso?"
        ↓
   schemas/   "¿Los datos que mandas son válidos?"
        ↓
   services/  "¿Las reglas permiten hacer esto? Pues lo hago."
        ↓
   models/    Se guarda en la base de datos
```

**¿Por qué tanta separación?** Para que cada archivo haga una sola cosa. Si mañana cambia una regla del negocio, solo tocas `services/`; si cambia una tabla, solo `models/`. Y es mucho más fácil encontrar las cosas.

---

## 4. Los datos: qué se guarda

Una **tabla** es como una hoja de Excel: cada columna es un campo y cada fila es un registro. Estas son las tablas:

| Tabla | Qué guarda | Ejemplo |
|---|---|---|
| `users` | Las personas que usan la app | Lucía, operaria |
| `suppliers` | Los proveedores | Metalex |
| `parts` | Las piezas: referencia, lote y de qué proveedor es | SP-2041, lote L-123, de Metalex |
| `incidents` | Las incidencias (los problemas detectados) | "Agujeros descentrados" |
| `action_plans` | El plan para resolver una incidencia | "Revisar el lote y pedir informe" |
| `tasks` | Cada tarea del plan, con responsable y fecha límite | "Pedir informe 8D, antes del 30/10" |
| `incident_history` | El diario: quién hizo qué y cuándo | "Elena pasó la incidencia a análisis" |

### Cómo se relacionan
Se relacionan con "tiene muchos":

- Un **proveedor** tiene muchas **piezas**.
- Una **pieza** puede tener muchas **incidencias**.
- Una **incidencia** tiene **un solo** plan de acción.
- Un **plan** tiene muchas **tareas**.
- Una **incidencia** tiene muchas anotaciones en el **historial**.
- Los **usuarios** aparecen en varios sitios: quien reporta la incidencia, quien la analiza, quien crea el plan y a quién se asigna cada tarea.

### Cosas que conviene saber
- **Los usuarios no se borran, se desactivan** (campo `is_active`). Así el historial sigue teniendo sentido: sigue constando quién hizo cada cosa.
- **No puede haber dos piezas iguales**: la combinación proveedor + referencia + lote es única.
- **Los valores fijos** (los roles, las severidades y los estados) son listas cerradas. Si intentas guardar un valor que no esté en la lista, la base de datos lo rechaza:
  - Roles: `operator`, `engineer`, `admin`
  - Severidad: `low`, `medium`, `high`, `critical`
  - Estado: `open`, `in_analysis`, `corrective_action`, `closed`
- Las fechas guardan también la zona horaria.

---

## 5. Login y permisos

### ¿Cómo sé quién eres? (el token)
Imagina una discoteca: enseñas tu DNI **una sola vez** en la puerta y te dan una **pulsera**. Después, para entrar a cualquier zona, solo enseñas la pulsera. Esa pulsera es el **token JWT**.

1. Mandas tu email y contraseña a `POST /auth/token`.
2. El backend comprueba que existes, que estás activo y que la contraseña es correcta.
3. Si todo va bien, te devuelve un **token** (un texto largo). Dura 60 minutos.
4. En cada petición siguiente envías ese token, y el backend sabe quién eres sin pedirte la contraseña otra vez.

### ¿Cómo se guardan las contraseñas?
**Nunca tal cual.** Se convierten con un algoritmo (Argon2) en un código ilegible llamado **hash**, que no se puede deshacer. Cuando haces login, se convierte la contraseña que escribes y se compara con el hash guardado. Si alguien robara la base de datos, no vería las contraseñas reales.

### ¿Qué puede hacer cada rol?

| Acción | Operario | Ingeniero | Admin |
|---|:-:|:-:|:-:|
| Iniciar sesión y ver sus propios datos | ✅ | ✅ | ✅ |
| Consultar proveedores, piezas e incidencias | ✅ | ✅ | ✅ |
| Crear una incidencia | ✅ | ✅ | ✅ |
| Editar una incidencia o cambiar su estado | ❌ | ✅ | ✅ |
| Crear planes de acción y gestionar tareas | ❌ | ✅ | ✅ |
| Marcar como hecha **su propia** tarea | ✅ | ✅ | ✅ |
| Crear o editar proveedores y piezas | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

### Los códigos de respuesta
Cuando algo no sale bien, el backend responde con un número:

| Código | Significado | Cuándo pasa |
|---|---|---|
| **200 / 201** | Todo bien (201 = se ha creado algo) | |
| **400** | Una regla del negocio lo impide | Intentar cerrar una incidencia con tareas sin completar |
| **401** | No sabemos quién eres | Token inválido, caducado o usuario desactivado |
| **403** | Sabemos quién eres, pero no tienes permiso | Un operario intenta crear un proveedor |
| **404** | No existe | Pedir la incidencia 9999 |
| **409** | Conflicto con algo que ya existe | Crear un usuario con un email repetido |
| **422** | Los datos enviados no son válidos | Un email sin `@` |

### Detalle importante
El rol **se mira en la base de datos en cada petición**, no se guarda dentro del token. Así, si un admin le cambia el rol a alguien, el cambio se aplica al instante.

---

## 6. La vida de una incidencia

Una incidencia pasa por cuatro estados y **siempre en orden**, sin saltarse ninguno ni retroceder:

```
   open  ──►  in_analysis  ──►  corrective_action  ──►  closed
 (abierta)   (en análisis)    (acción correctiva)      (cerrada)
```

Las reglas que protegen este flujo:

1. **Abierta → En análisis**: un ingeniero la coge. Queda registrado como quien la analiza.
2. **En análisis → Acción correctiva**: hace falta un plan de acción. En la práctica **esto pasa solo**: al crear el plan, la incidencia avanza automáticamente. Y solo se puede crear un plan si la incidencia está en análisis.
3. **Acción correctiva → Cerrada**: el plan debe tener **al menos una tarea y todas completadas**. Se guarda la fecha de cierre.
4. **Una incidencia cerrada ya no se puede modificar**, ni ella, ni su plan, ni sus tareas.

Cada incidencia puede tener **un único** plan de acción.

### El historial (el diario)
Cada cambio importante se anota automáticamente: quién, qué y cuándo. Ejemplos de lo que se anota: incidencia creada, estado cambiado, plan creado, tarea añadida, tarea completada, tarea reabierta...

Un detalle inteligente: la anotación se guarda **en el mismo momento** que el cambio (en la misma "transacción", que es como un paquete de todo-o-nada). Así nunca puede haber un cambio sin su anotación, ni una anotación de algo que no ocurrió.

### Reglas de las tareas
- Un **ingeniero o admin** puede editar cualquier tarea.
- El **responsable** de una tarea (aunque sea operario) solo puede marcarla como hecha o no hecha. Si intenta cambiar algo más, recibe un 403.
- Las tareas solo se pueden asignar a usuarios **activos**.

---

## 7. Un ejemplo completo, de principio a fin

1. **El admin** crea los usuarios, el proveedor "Metalex" y la pieza SP-2041 con el lote L-123.
2. **Lucía (operaria)** inicia sesión, recibe su token y crea una incidencia: "Agujeros descentrados", severidad alta. Estado: `open`.
3. **Elena (ingeniera)** pasa la incidencia a `in_analysis`.
4. **Elena** crea el plan de acción con dos tareas: "Pedir informe al proveedor" (para Marcos) y "Revisar el stock" (para Lucía). La incidencia pasa sola a `corrective_action`.
5. **Marcos y Lucía** marcan sus tareas como completadas.
6. **Elena** cierra la incidencia. Estado: `closed`.
7. En cualquier momento se puede consultar la incidencia con su plan, sus tareas y todo su historial.

---

## 8. Qué pasa por dentro cuando se crea una incidencia

Esto te ayuda a entender cómo trabajan juntas las capas. Pasos de `POST /incidents`:

1. **Llega la petición** con el token y los datos de la incidencia.
2. **La puerta de entrada (`api/`)** comprueba el token y averigua quién eres.
3. **Pydantic (`schemas/`)** revisa los datos. Si falta el título, devuelve un 422 sin llegar más lejos.
4. **El servicio (`services/`)** comprueba que la pieza existe, crea la incidencia, apunta "creada" en el historial y guarda todo.
5. **La respuesta** se convierte a JSON con los campos permitidos (nunca se envía nada sensible) y se devuelve con un 201.
6. **Si algo falla**, el servicio lanza un error propio (por ejemplo "no encontrado"). Un traductor en `main.py` lo convierte en el código correcto (404). Así los servicios no necesitan saber nada de HTTP.

---

## 9. Migraciones: el historial de la base de datos

Las tablas se definen en código (`models/`). Pero cuando cambias el código, la base de datos real **no cambia sola**. Para eso existen las **migraciones**: archivos que dicen "añade esta columna", "crea esta tabla". Son como los commits de git, pero para la estructura de la base de datos.

Cuando cambias un modelo:

1. Edita el modelo en `models/`.
2. `alembic revision --autogenerate -m "mensaje"` → Alembic compara el código con la base de datos y escribe la migración.
3. **Revisa** el archivo generado (a veces se equivoca).
4. `alembic upgrade head` → aplica la migración.

Hay **dos bases de datos** en Neon: la normal y otra solo para los tests (para no ensuciar los datos reales). Para migrar la de tests: `alembic -x db=test upgrade head`.

---

## 10. Tests: comprobar que todo funciona

Hay unos 70 tests automáticos en `backend/tests/` que prueban login, usuarios, proveedores, piezas, incidencias y planes. Cada vez que cambias algo, los ejecutas con `pytest` y sabes si has roto algo sin tener que probarlo todo a mano.

Un truco interesante: cada test se ejecuta dentro de una **transacción que se deshace al terminar**. Así el test puede crear usuarios e incidencias libremente y, al acabar, la base de datos de pruebas queda como estaba.

---

## 11. Scripts (programas que lanzas a mano)

- **`python -m app.scripts.create_admin --email admin@example.com --name "Admin"`**
  Crea el primer administrador. Es necesario porque solo un admin puede crear usuarios, y al principio no hay ninguno (el huevo y la gallina). Te pide la contraseña sin mostrarla.
- **`python -m app.scripts.seed_demo`**
  Rellena la base de datos con datos de ejemplo (usuarios, proveedores, piezas e incidencias repartidas en varios meses). Todos los usuarios demo tienen la contraseña `demo1234`. Útil para ver el frontend con datos.

---

## 12. Comandos más usados

Se ejecutan desde la carpeta `backend/` con el entorno virtual activado (el *venv* es una carpeta con las librerías de este proyecto, para no mezclarlas con otros proyectos).

| Para... | Comando |
|---|---|
| Arrancar la API | `uvicorn app.main:app --reload` (el `--reload` la reinicia al guardar cambios) |
| Ejecutar los tests | `pytest` |
| Revisar el estilo del código | `ruff check .` |
| Crear una migración | `alembic revision --autogenerate -m "mensaje"` |
| Aplicar migraciones | `alembic upgrade head` |

---

## 13. Qué falta por hacer

- **KPIs**: incidencias abiertas, tiempo medio de cierre y ranking de proveedores.
- **PDF** de la ficha de cada incidencia.
- **Avisos automáticos** a Teams o Discord.
- **Exportar a BigQuery** para dashboards.
- **Subir fotos de verdad** (ahora solo se guarda un texto con el enlace).
- **Paginación**: ahora los listados devuelven todo de golpe; con muchos datos habrá que devolverlos por páginas.

---

## 14. Glosario

| Término | Significado sencillo |
|---|---|
| **API** | La "carta" de cosas que se pueden pedir al backend |
| **Endpoint** | Una de esas cosas: un verbo + una ruta (`GET /incidents`) |
| **JSON** | El formato de texto en que se envían y reciben los datos |
| **Petición (request)** | Lo que el cliente envía al backend |
| **Respuesta (response)** | Lo que el backend devuelve |
| **Router** | Un grupo de endpoints relacionados (por ejemplo, todos los de `/incidents`) |
| **Schema** | La descripción de qué forma tienen los datos (qué campos, de qué tipo) |
| **Modelo** | La clase de Python que representa una tabla |
| **ORM** | Herramienta que deja usar objetos Python en vez de escribir SQL (SQLAlchemy lo es) |
| **Servicio** | Código que aplica las reglas del negocio |
| **Dependencia** | Una función que FastAPI ejecuta *antes* del endpoint para prepararle algo (por ejemplo, el usuario actual) |
| **Sesión** | La "conversación" abierta con la base de datos durante una petición |
| **Commit** | Confirmar y guardar definitivamente los cambios en la base de datos |
| **Transacción** | Un paquete de cambios de todo-o-nada: o se guardan todos o ninguno |
| **Migración** | Un archivo que describe un cambio en la estructura de la base de datos |
| **Token / JWT** | La "pulsera" que demuestra quién eres tras hacer login |
| **Hash** | El código ilegible e irreversible en que se convierte una contraseña |
| **Rol** | El tipo de usuario (operario, ingeniero, admin) y lo que puede hacer |
| **Enum** | Una lista cerrada de valores permitidos (por ejemplo, los 4 estados) |
| **Variable de entorno / `.env`** | Configuración y secretos que viven fuera del código (contraseñas, URL de la BD) |
| **Fixture** | En tests, una preparación reutilizable (por ejemplo, "crear un usuario") |
