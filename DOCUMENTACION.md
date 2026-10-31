# Documentación de Plano Eléctrico Pro

## 1. Propósito

Aplicación web en PHP para dibujar planos eléctricos residenciales en un lienzo SVG, almacenar proyectos en MySQL y generar una vista previa o un PDF con el plano y su simbología. La interfaz y los mensajes están en español. La aplicación no requiere cuentas de usuario: los proyectos y la galería son públicos.

## 2. Tecnologías y requisitos

- PHP 8 o posterior y las extensiones PDO MySQL y DOM.
- MySQL/MariaDB, Apache y Composer (por ejemplo, con XAMPP).
- Dompdf (`dompdf/dompdf`), instalado según `composer.json` y cargado desde `vendor/autoload.php`.
- Navegador moderno con soporte para SVG, `fetch`, `FormData` y el elemento HTML `<dialog>`.

## 3. Estructura del proyecto

Los archivos fuente del proyecto incluyen comentarios en español que describen el propósito de sus bloques principales. La guía complementa esos comentarios con el recorrido general y la relación entre archivos.

| Archivo o carpeta | Responsabilidad |
|---|---|
| `project-manager.php` | Página pública de inicio. Consulta los proyectos, muestra la galería y permite abrir o editar sus datos descriptivos. |
| `index.php` | Prepara el proyecto solicitado y muestra la interfaz del editor SVG. |
| `save_project.php` | Punto de entrada para guardar/actualizar proyectos, listar/cargar proyectos y generar PDF. |
| `config.php` | Configuración de conexión y datos generales de la aplicación. |
| `includes/db.php` | Crea una conexión PDO y se asegura de que existan la base de datos y la tabla `projects`. |
| `assets/js/app.js` | Estado y lógica del editor: dibujo, selección, movimiento, borrado, propiedades, historial, guardado y exportación. |
| `assets/js/project-manager.js` | Controla el diálogo para editar la descripción de un proyecto desde la galería. |
| `assets/css/style.css` | Estilos del editor, la galería, sus componentes y los puntos de adaptación para pantallas pequeñas. |
| `plano_electrico.sql` | Script opcional para crear la base de datos y la tabla manualmente. |
| `imagen/logo.jpeg` | Imagen de marca usada por la interfaz y el documento PDF. |
| `vendor/` | Dependencias PHP instaladas por Composer. No editar manualmente. |

## 4. Instalación y configuración

1. Coloca el proyecto dentro de `htdocs` y configura Apache/MySQL.
2. Ejecuta `composer install` en la carpeta del proyecto para instalar Dompdf.
3. Ajusta en `config.php` el host, puerto, base de datos, usuario y contraseña de MySQL.
4. Inicia MySQL. La aplicación crea la base de datos y la tabla si el usuario configurado tiene permisos; alternativamente, importa `plano_electrico.sql` desde phpMyAdmin.
5. Abre `http://localhost/Plano%20electrico/project-manager.php` para ver la galería o `http://localhost/Plano%20electrico/index.php` para iniciar un plano.

## 5. Recorrido de la aplicación

1. **Galería:** `project-manager.php` obtiene los metadatos de todos los proyectos, ordenados por fecha de actualización. Desde allí se crea un proyecto nuevo, se abre uno existente o se editan nombre, cliente, dirección y diseñador.
2. **Carga del editor:** `index.php` lee el parámetro `project_id`. Si identifica un proyecto, recupera sus datos y los expone a JavaScript como `window.initialProject` y `window.projectId`; sin ID, inicia un proyecto vacío.
3. **Edición:** `app.js` mantiene los elementos del plano en `state.objects`. Las herramientas crean objetos, el lienzo SVG los representa y los controles modifican la vista, el orden, la selección y las propiedades.
4. **Guardado:** el navegador envía el proyecto serializado a `save_project.php`. Si no hay ID se inserta una fila; si ya lo hay se actualiza. El ID devuelto permite que los siguientes guardados modifiquen ese mismo proyecto.
5. **PDF:** antes de exportar, el editor guarda el proyecto, calcula los límites del dibujo y envía el SVG y la lista de símbolos al servidor. El servidor valida el SVG, compone el documento y Dompdf devuelve el PDF al navegador.

## 6. Bloques de código

### `config.php` e `includes/db.php`

- **Configuración:** `config.php` devuelve un arreglo PHP con las credenciales de MySQL y valores generales como el nombre y la zona horaria prevista. Actualmente, el código no aplica esos dos últimos valores de forma global.
- **Conexión PDO:** `getDbConnection()` valida el nombre de la base de datos, configura PDO para lanzar excepciones, devolver filas asociativas y usar consultas preparadas nativas.
- **Inicialización del esquema:** abre primero una conexión al servidor, crea la base si falta y luego crea `projects` cuando no existe. Devuelve la conexión a la base ya seleccionada.

### `project-manager.php` y `assets/js/project-manager.js`

- **Consulta y galería:** PHP recupera los metadatos ordenados por `updated_at` y los escapa al insertarlos en HTML.
- **Estados de la lista:** la vista distingue entre una lista vacía y una tabla de proyectos, y muestra un botón para abrir el editor o editar la descripción.
- **Diálogo de edición:** JavaScript carga los valores del proyecto en el formulario, cierra el diálogo al cancelar y envía los cambios como `FormData` con `action=update_description`.
- **Respuesta del servidor:** si la actualización falla, el mensaje aparece en el diálogo; al completarse, la página vuelve a cargar para reflejar los datos.

### `index.php`

- **Carga inicial:** recupera el proyecto indicado por `project_id` usando una consulta preparada. Cuando `project_data` no contiene datos válidos, crea una estructura inicial con los metadatos disponibles y una lista `objects` vacía.
- **Panel de herramientas:** el HTML define grupos de herramientas arquitectónicas, símbolos eléctricos, conductos, circuitos, protecciones, mediciones y capas.
- **Barra y lienzo:** incluye acciones del proyecto, modos de edición, zoom/desplazamiento, el SVG que recibe el dibujo y el panel de propiedades.
- **Inicialización del navegador:** publica los datos iniciales y el ID del proyecto en `window` y carga `app.js`.

### `assets/js/app.js`

- **Referencias y símbolos:** enlaza los controles del HTML, define las dimensiones del mundo/lienzo y describe en SVG los iconos que usan las herramientas y la leyenda del PDF.
- **Estado y datos:** `state` guarda la herramienta y modo activos, selección, interacción en curso, ID, cambios pendientes, zoom/desplazamiento, objetos e historial. `defaultProjectData()` y `getProjectPayload()` dan forma al objeto serializado que se guarda.
- **Historial:** `pushHistory()`, `undoAction()` y `redoAction()` conservan copias de los objetos para deshacer o rehacer operaciones. El historial está limitado a 50 estados.
- **Vista del lienzo:** `updateCanvasView()` actualiza el `viewBox`; `fitDrawing()` calcula los límites de los elementos y ajusta zoom y posición para encuadrarlos.
- **Render SVG:** `render()` reconstruye los elementos gráficos según `state.objects`, aplica los estilos y atributos de accesibilidad y conecta sus eventos de selección/borrado.
- **Interacción con objetos:** las funciones de selección y modo manejan eliminar objetos, borrar trazos o lados de habitaciones y actualizar el panel de propiedades. Las longitudes y anchos se muestran en metros (100 unidades SVG equivalen a 1 m).
- **Creación y geometría:** `createObject()` asigna identidad y valores iniciales; `placeSelectedTool()` mapea cada herramienta a sus datos de objeto; `getSvgCoordinates()` traduce coordenadas de pantalla al sistema SVG.
- **Eventos de puntero:** los eventos `pointerdown`, `pointermove`, `pointerup` y `pointercancel` implementan trazado de ductos, movimiento de objetos y borrador continuo.
- **Acciones de interfaz:** los controladores enlazan botones de herramientas, modos, guardar, historial, zoom, desplazamiento, duplicación, orden visual y vista previa.
- **Preparación del PDF:** `createPlanSvg()` genera un SVG con límites ajustados y obtiene los símbolos usados. El controlador de exportación guarda primero, envía el plano al servidor y muestra el PDF recibido.
- **Guardado y arranque:** `saveProject()` envía los datos como `FormData`, actualiza el ID tras la primera inserción y muestra errores. Al final se renderiza el proyecto inicial y se ajusta la vista si ya contiene objetos.

### `save_project.php`

- **Sanitización SVG:** `sanitizePdfSvg()` analiza el XML sin acceso a red, exige que la raíz pertenezca al espacio de nombres SVG y rechaza elementos no permitidos. Elimina atributos no autorizados y valida el formato de `transform`.
- **Guardar o actualizar:** las solicitudes `POST` distintas de PDF responden JSON. `update_description` actualiza metadatos sin perder los objetos existentes; las demás guardan el proyecto completo, insertando o actualizando según `project_id`.
- **Listado y carga:** `GET action=list` devuelve metadatos y datos de proyectos; `GET action=load` recupera un proyecto concreto o devuelve HTTP 404.
- **Generar PDF:** `action=pdf` comprueba el proyecto, valida y sanitiza el SVG, crea la leyenda de símbolos, verifica dimensiones y carga el logo. Después genera el HTML y lo entrega a Dompdf. La fecha se obtiene con `date()` y usa la zona horaria configurada en PHP.
- **Errores:** las excepciones se convierten en respuesta JSON con estado HTTP 500. Los casos de proyecto inexistente responden con HTTP 404.

### `assets/css/style.css`

- **Variables y estilos base:** colores, tipografía, controles, paneles y estructura de la aplicación.
- **Estilos de galería:** cabecera pública, presentación, estadísticas, lista de proyectos, formulario modal y botones.
- **Diseño adaptable:** las media queries reorganizan las columnas y controles según el ancho de pantalla.
- **Tema del editor:** el bloque posterior a `Editor visual theme` modifica la paleta y el aspecto específico del editor; las reglas restantes estilizan sus herramientas, lienzo, capas, propiedades y estados de interacción.

### `plano_electrico.sql`

Define `plano_electrico` con codificación `utf8mb4` y la tabla `projects`. La columna JSON `project_data` guarda la representación completa del plano; las columnas restantes contienen identificador, nombre, cliente, dirección, diseñador, estado y marcas de tiempo.

## 7. Datos y unidades

Cada proyecto mantiene sus metadatos en columnas propias y el dibujo en `project_data` como JSON. El cliente serializa `objects` y la información del proyecto, incluyendo las capas y la marca de tiempo de guardado. Cada objeto contiene un tipo, un ID y coordenadas; elementos lineales también pueden guardar puntos extremos. Para propiedades de longitud/ancho, 100 unidades del plano equivalen a 1 metro.

La tabla se crea tanto desde `includes/db.php` como desde `plano_electrico.sql`; si se modifica el modelo, ambos esquemas deben mantenerse sincronizados.

## 8. Endpoints internos

| Método y parámetros | Resultado |
|---|---|
| `POST save_project.php` con `project`, `project_id` | Inserta o actualiza el proyecto; responde JSON con `success` y el ID. |
| `POST save_project.php` con `action=update_description` y metadatos | Actualiza los datos descriptivos sin reemplazar los objetos; responde JSON. |
| `GET save_project.php?action=list` | Devuelve la lista de proyectos en JSON. |
| `GET save_project.php?action=load&project_id=ID` | Devuelve los datos de un proyecto o HTTP 404. |
| `POST save_project.php` con `action=pdf`, `project_id`, `plan_svg`, `symbols`, `plan_width`, `plan_height` | Devuelve el PDF si la entrada pasa las validaciones. |

## 9. Consideraciones operativas

- El proyecto está configurado como público y sin autenticación; cualquier visitante puede consultar y modificar proyectos accesibles. No se recomienda exponerlo con información sensible sin incorporar controles de acceso.
- La cuenta de MySQL necesita permisos para crear la base y tablas cuando se utiliza la inicialización automática.
- El endpoint de PDF solo admite un subconjunto de elementos/atributos SVG para limitar el contenido procesado por Dompdf.
- `composer.json` es JSON y no admite comentarios; las dependencias se explican en esta guía en lugar de anotarlas dentro del manifiesto.
