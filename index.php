<?php
require_once __DIR__ . '/includes/db.php';

// Carga un proyecto existente o prepara los valores iniciales para un lienzo vacío.
$pdo = getDbConnection();

$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
$projectData = ['name' => 'Proyecto nuevo', 'client_name' => 'Cliente', 'address' => 'Dirección', 'designer' => 'Responsable', 'objects' => []];
// Si llega un ID, recupera los metadatos y objetos para continuar la edición.
if ($projectId > 0) {
    $stmt = $pdo->prepare('SELECT name, client_name, address, designer, project_data FROM projects WHERE id = :id');
    $stmt->execute([':id' => $projectId]);
    $row = $stmt->fetch();
    if ($row) {
        $projectData = json_decode((string)$row['project_data'], true) ?: [
            'name' => $row['name'],
            'client_name' => $row['client_name'],
            'address' => $row['address'],
            'designer' => $row['designer'],
            'objects' => []
        ];
        $projectData['name'] = $row['name'];
        $projectData['client_name'] = $row['client_name'];
        $projectData['address'] = $row['address'];
        $projectData['designer'] = $row['designer'];
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plano Eléctrico</title>
  <link rel="stylesheet" href="assets/css/style.css?v=11" />
</head>
<body>
  <!-- Estructura principal en tres columnas: herramientas, lienzo y propiedades. -->
  <div class="app-shell">
    <!-- Barra lateral: grupos de herramientas y capas del plano. -->
    <aside class="left-panel">
      <div class="app-brand">
        <img class="brand-mark" src="imagen/logo.jpeg" alt="Logo de instalaciones eléctricas" />
        <div>
          <strong>Plano Eléctrico</strong>
          <span>Diseño de instalaciones</span>
        </div>
      </div>
      <!-- Agrupa herramientas por tipo y expone las capas disponibles del plano. -->
      <div class="tool-groups">
        <details open>
          <summary>Herramientas de dibujo arquitectónico</summary>
          <button type="button" class="tool-btn" data-tool="wall">Pared</button>
          <button type="button" class="tool-btn" data-tool="room">Habitación</button>
          <button type="button" class="tool-btn" data-tool="door">Puerta</button>
          <button type="button" class="tool-btn" data-tool="window">Ventana</button>
          <button type="button" class="tool-btn" data-tool="measure">Medición</button>
        </details>
        <details open>
          <summary>Símbolos eléctricos</summary>
          <button type="button" class="tool-btn" data-tool="light">Luminaria</button>
          <button type="button" class="tool-btn" data-tool="switch">Interruptor</button>
          <button type="button" class="tool-btn" data-tool="socket">Tomacorriente</button>
          <button type="button" class="tool-btn" data-tool="box">Caja</button>
          <button type="button" class="tool-btn" data-tool="panel">Tablero</button>
        </details>
        <details open>
          <summary>Conductos y canalizaciones</summary>
          <button type="button" class="tool-btn" data-tool="conduit" title="Arrastra sobre el lienzo para trazar una línea recta de ducto">Ducto (línea recta)</button>
          <button type="button" class="tool-btn" data-tool="drop">Pie de amigo (bajada)</button>
        </details>
        <details open>
          <summary>Circuitos eléctricos</summary>
          <button type="button" class="tool-btn" data-tool="circuit">Circuito</button>
        </details>
        <details open>
          <summary>Tableros y protecciones</summary>
          <button type="button" class="tool-btn" data-tool="protection">Protección</button>
        </details>
        <details open>
          <summary>Herramientas de medición</summary>
          <button type="button" class="tool-btn" data-tool="dimension">Cota</button>
        </details>
        <details open>
          <summary>Capas del plano</summary>
          <div class="layer-list">
            <label><input type="checkbox" checked /> Arquitectura</label>
            <label><input type="checkbox" checked /> Cotas y medidas</label>
            <label><input type="checkbox" checked /> Iluminación</label>
            <label><input type="checkbox" checked /> Interruptores</label>
            <label><input type="checkbox" checked /> Tomacorrientes</label>
            <label><input type="checkbox" checked /> Conductos</label>
            <label><input type="checkbox" checked /> Cajas</label>
            <label><input type="checkbox" checked /> Tablero</label>
            <label><input type="checkbox" checked /> Acometida</label>
            <label><input type="checkbox" checked /> Anotaciones</label>
            <label><input type="checkbox" checked /> Leyenda</label>
          </div>
        </details>
      </div>
    </aside>

    <!-- Área central: controles del proyecto, modos de edición y lienzo SVG. -->
    <main class="workspace">
      <!-- Identidad del proyecto y acciones generales, como guardar o exportar. -->
      <header class="topbar">
        <div class="project-identity">
          <span class="title-label">Proyecto público</span>
          <strong id="header-project-name"><?= htmlspecialchars($projectData['name']) ?></strong>
        </div>
        <div class="top-actions">
          <a class="secondary-btn" href="project-manager.php" type="button" style="text-decoration:none;">Proyectos</a>
          <button id="save-project" type="button">Guardar</button>
          <button id="redo-action" type="button">Rehacer</button>
          <button id="preview-action" type="button">Vista previa</button>
          <button id="export-pdf" type="button">Exportar PDF</button>
          <button id="fit-screen" type="button">Ajustar</button>
          <label>Zoom <input id="zoom-level" type="range" min="40" max="200" value="100" /></label>
          <span id="dirty-indicator">Sin cambios</span>
        </div>
      </header>

      <!-- Modos temporales para seleccionar, mover, borrar y ordenar elementos. -->
      <div class="canvas-toolbar">
        <button class="canvas-mode active" data-mode="select" type="button">Seleccionar</button>
        <button class="canvas-mode" data-mode="move" type="button">Mover</button>
        <button class="canvas-mode" data-mode="rotate" type="button">Rotar</button>
        <button class="canvas-mode" data-mode="delete" type="button">Eliminar</button>
        <button id="undo-action" type="button" title="Recupera el elemento eliminado más recientemente" disabled>Deshacer borrado</button>
        <button class="canvas-mode eraser-mode" data-mode="erase" type="button" title="Arrastra el borrador sobre la línea que quieras quitar">
          <svg class="eraser-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4.5 14.5 8.8-8.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8l-8.8 8.8a2 2 0 0 1-2.8 0l-2.2-2.2a2 2 0 0 1 0-2.8Z" fill="#fda4af" stroke="#be185d" stroke-width="1.5" />
            <path d="m9 10 5 5M8 20h12" fill="none" stroke="#be185d" stroke-linecap="round" stroke-width="1.5" />
          </svg>
          <span>Borrador</span>
        </button>
        <button id="duplicate-item" type="button">Duplicar</button>
        <button id="send-to-back" type="button" title="Enviar el elemento seleccionado detrás de los demás" disabled>Enviar abajo</button>
      </div>

      <!-- Lienzo SVG y controles deslizantes para desplazar el área visible. -->
      <div class="canvas-wrap">
        <div class="canvas-viewport">
          <svg id="drawing-canvas" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" aria-label="Editor de planos eléctricos"></svg>
        </div>
        <label class="pan-control pan-horizontal" title="Desplazar el plano de izquierda a derecha">
          <span aria-hidden="true">↔</span>
          <input id="pan-x" type="range" min="0" max="1200" value="0" aria-label="Desplazamiento horizontal del plano" />
        </label>
        <label class="pan-control pan-vertical" title="Desplazar el plano de arriba hacia abajo">
          <span aria-hidden="true">↕</span>
          <input id="pan-y" type="range" min="0" max="800" value="0" aria-label="Desplazamiento vertical del plano" />
        </label>
        <div id="eraser-cursor" class="eraser-cursor" aria-hidden="true" hidden>
          <svg viewBox="0 0 32 32">
            <path d="m5 19 12-12a2.5 2.5 0 0 1 3.5 0l4.5 4.5a2.5 2.5 0 0 1 0 3.5l-12 12a2.5 2.5 0 0 1-3.5 0L5 22.5A2.5 2.5 0 0 1 5 19Z" fill="#fda4af" stroke="#9d174d" stroke-width="1.8" />
            <path d="m10 14 8 8M7 25l5 5M14 30h14" fill="none" stroke="#9d174d" stroke-linecap="round" stroke-width="1.8" />
          </svg>
        </div>
      </div>
    </main>

    <!-- Panel contextual que app.js actualiza con las propiedades seleccionadas. -->
    <aside class="right-panel">
      <h3>Propiedades</h3>
      <div id="property-panel">
        <p>Selecciona un elemento para editar sus propiedades.</p>
      </div>
    </aside>
  </div>

  <!-- Datos PHP iniciales que consume el editor JavaScript. -->
  <script>
    window.initialProject = <?= json_encode($projectData, JSON_UNESCAPED_UNICODE) ?>;
    window.projectId = <?= (int)$projectId ?>;
  </script>
  <script src="assets/js/app.js?v=17"></script>
</body>
</html>
