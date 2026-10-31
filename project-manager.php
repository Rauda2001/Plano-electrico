<?php
require_once __DIR__ . '/includes/db.php';

// Recupera los metadatos necesarios para la galería, del proyecto más reciente al más antiguo.
$pdo = getDbConnection();
$projects = $pdo->query('SELECT id, name, client_name, address, designer, updated_at FROM projects ORDER BY updated_at DESC')->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Plano Eléctrico Pro</title>
  <link rel="stylesheet" href="assets/css/style.css?v=9" />
</head>
<body>
  <div class="public-shell">
    <!-- Marca de la aplicación y acceso directo para iniciar otro proyecto. -->
    <header class="public-header">
      <div class="brand">
        <img class="brand-mark" src="imagen/logo.jpeg" alt="Logo de instalaciones eléctricas" />
        <span>Plano Eléctrico Pro</span>
      </div>
      <div class="public-actions">
        <a class="primary-btn" href="index.php">Nuevo proyecto</a>
      </div>
    </header>

    <!-- Presentación de la aplicación y acceso directo al editor. -->
    <section class="hero">
      <div class="hero-card">
        <div class="hero-tag">Acceso libre • sin autenticación</div>
        <h1>Diseña planos eléctricos residenciales de forma profesional.</h1>
        <p>
          Crea, edita y exporta proyectos eléctricos sin restricciones de inicio de sesión.
          La plataforma está preparada para publicarse en un servidor y ser usada por cualquier persona.
        </p>
        <div class="hero-actions">
          <a class="primary-btn" href="index.php">Comenzar ahora</a>
          <a class="secondary-btn" href="#proyectos">Ver proyectos</a>
        </div>
      </div>

      <div class="hero-card side-panel">
        <div class="stat-card">
          <div class="label">Modo</div>
          <div class="value">Público</div>
        </div>
        <div class="stat-card">
          <div class="label">Acceso</div>
          <div class="value">Sin login</div>
        </div>
        <div class="stat-card">
          <div class="label">Destino</div>
          <div class="value">Servidor web</div>
        </div>
      </div>
    </section>

    <!-- Resumen de proyectos y capacidades visibles desde la galería. -->
    <section class="stat-grid">
      <div class="stat-card">
        <div class="label">Proyectos</div>
        <div class="value"><?= count($projects) ?></div>
      </div>
      <div class="stat-card">
        <div class="label">Capas</div>
        <div class="value">11</div>
      </div>
      <div class="stat-card">
        <div class="label">Exportación</div>
        <div class="value">PDF</div>
      </div>
    </section>

    <!-- Lista condicional: mensaje vacío o tabla con acciones por proyecto. -->
    <section id="proyectos" class="project-list">
      <div class="project-card">
        <div class="project-head">
          <h3>Proyectos recientes</h3>
          <span class="badge">Abierto al público</span>
        </div>

        <!-- La tabla aparece solo cuando la consulta devuelve proyectos. -->
        <?php if (empty($projects)): ?>
          <p style="color:#5f6c87; margin:0;">Todavía no hay proyectos creados. Crea el primero desde “Nuevo proyecto”.</p>
        <?php else: ?>
          <div class="project-meta-inline">
            <span>Última actualización</span>
            <span>•</span>
            <span>Accesible sin registro</span>
          </div>

          <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="text-align:left; border-bottom:1px solid #d6e0f0;">
                <th style="padding:10px 8px;">Nombre</th>
                <th style="padding:10px 8px;">Cliente</th>
                <th style="padding:10px 8px;">Dirección</th>
                <th style="padding:10px 8px;">Diseñador</th>
                <th style="padding:10px 8px;">Actualizado</th>
                <th style="padding:10px 8px;">Acción</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($projects as $project): ?>
                <tr style="border-bottom:1px solid #edf2f7;">
                  <td style="padding:10px 8px; "><?= htmlspecialchars($project['name']) ?></td>
                  <td style="padding:10px 8px; "><?= htmlspecialchars($project['client_name']) ?></td>
                  <td style="padding:10px 8px; "><?= htmlspecialchars($project['address']) ?></td>
                  <td style="padding:10px 8px; "><?= htmlspecialchars($project['designer']) ?></td>
                  <td style="padding:10px 8px; "><?= htmlspecialchars($project['updated_at']) ?></td>
                  <td class="project-actions" style="padding:10px 8px; ">
                    <button class="secondary-btn edit-description" type="button"
                      data-project-id="<?= (int)$project['id'] ?>"
                      data-name="<?= htmlspecialchars($project['name'], ENT_QUOTES, 'UTF-8') ?>"
                      data-client="<?= htmlspecialchars($project['client_name'], ENT_QUOTES, 'UTF-8') ?>"
                      data-address="<?= htmlspecialchars($project['address'], ENT_QUOTES, 'UTF-8') ?>"
                      data-designer="<?= htmlspecialchars($project['designer'], ENT_QUOTES, 'UTF-8') ?>">Editar descripción</button>
                    <a class="primary-btn" href="index.php?project_id=<?= (int)$project['id'] ?>">Abrir</a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </div>
    </section>
  </div>
  <!-- El formulario se completa y envía desde project-manager.js. -->
  <dialog id="description-dialog" class="description-dialog">
    <form id="description-form">
      <h2>Editar descripción del proyecto</h2>
      <input type="hidden" name="project_id" />
      <label>Nombre del proyecto<input name="name" required /></label>
      <label>Nombre del cliente<input name="client_name" /></label>
      <label>Dirección<input name="address" /></label>
      <label>Nombre del diseñador<input name="designer" /></label>
      <p id="description-error" role="alert" hidden></p>
      <div class="description-actions">
        <button class="secondary-btn" id="cancel-description" type="button">Cancelar</button>
        <button class="primary-btn" type="submit">Guardar descripción</button>
      </div>
    </form>
  </dialog>
  <!-- Controla el diálogo para editar la descripción de un proyecto. -->
  <script src="assets/js/project-manager.js?v=1"></script>
</body>
</html>
