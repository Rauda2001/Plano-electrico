<?php
require_once __DIR__ . '/includes/db.php';

// Valida el SVG de entrada antes de que Dompdf lo procese.
function sanitizePdfSvg(string $markup): string
{
    $document = new DOMDocument();
    if (!$document->loadXML($markup, LIBXML_NONET) ||
        !$document->documentElement ||
        $document->documentElement->localName !== 'svg' ||
        $document->documentElement->namespaceURI !== 'http://www.w3.org/2000/svg') {
        throw new RuntimeException('El plano SVG está dañado o no es válido.');
    }

    // Lista permitida de etiquetas y atributos que necesita el dibujo exportado.
    $allowedElements = ['svg', 'g', 'rect', 'line', 'path', 'circle', 'text'];
    $allowedAttributes = [
        'xmlns', 'width', 'height', 'viewBox', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
        'cx', 'cy', 'r', 'rx', 'd', 'fill', 'stroke', 'stroke-width',
        'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'text-anchor',
        'dominant-baseline', 'font-size', 'font-weight', 'font-family', 'aria-hidden',
        'data-id', 'data-type', 'role', 'aria-label', 'class', 'transform',
    ];
    // Recorre los nodos de atrás hacia delante para rechazar etiquetas ajenas al SVG permitido.
    $elements = $document->getElementsByTagName('*');
    for ($index = $elements->length - 1; $index >= 0; $index--) {
        $element = $elements->item($index);
        if (!$element || $element->namespaceURI !== 'http://www.w3.org/2000/svg' ||
            !in_array($element->localName, $allowedElements, true)) {
            throw new RuntimeException('El plano contiene elementos SVG no permitidos.');
        }

        // Descarta atributos no autorizados y limita las transformaciones a las generadas por el editor.
        for ($attributeIndex = $element->attributes->length - 1; $attributeIndex >= 0; $attributeIndex--) {
            $attribute = $element->attributes->item($attributeIndex);
            if ($attribute && $attribute->nodeName === 'transform' &&
                !preg_match(
                    '/^translate\(-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)? -?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\) scale\(-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\)$/i',
                    $attribute->nodeValue
                )) {
                throw new RuntimeException('El plano contiene una transformación SVG no válida.');
            }
            if ($attribute && $attribute->nodeName !== 'xmlns' &&
                ($attribute->namespaceURI !== null || !in_array($attribute->nodeName, $allowedAttributes, true))) {
                $element->removeAttributeNode($attribute);
            }
        }
    }

    return $document->saveXML($document->documentElement);
}

try {
    // Abre la base de datos antes de resolver la acción solicitada por HTTP.
    $pdo = getDbConnection();

    // Procesa guardado completo y edición de metadatos; ambas operaciones responden JSON.
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') !== 'pdf') {
        header('Content-Type: application/json; charset=utf-8');
        // Actualiza solo la descripción y conserva el resto del JSON del plano.
        if (($_POST['action'] ?? '') === 'update_description') {
            $projectId = (int)($_POST['project_id'] ?? 0);
            $projectName = trim((string)($_POST['name'] ?? ''));
            if ($projectId < 1 || $projectName === '') {
                throw new RuntimeException('El proyecto y su nombre son obligatorios.');
            }

            $projectStmt = $pdo->prepare('SELECT project_data FROM projects WHERE id = :id');
            $projectStmt->execute([':id' => $projectId]);
            $project = $projectStmt->fetch();
            if (!$project) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Proyecto no encontrado']);
                exit;
            }

            $projectData = json_decode((string)$project['project_data'], true);
            $projectData = is_array($projectData) ? $projectData : [];
            $projectData['name'] = $projectName;
            $projectData['client_name'] = trim((string)($_POST['client_name'] ?? ''));
            $projectData['address'] = trim((string)($_POST['address'] ?? ''));
            $projectData['designer'] = trim((string)($_POST['designer'] ?? ''));

            $stmt = $pdo->prepare('UPDATE projects SET name = :name, client_name = :client_name, address = :address, designer = :designer, project_data = :project_data, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                ':name' => $projectData['name'],
                ':client_name' => $projectData['client_name'],
                ':address' => $projectData['address'],
                ':designer' => $projectData['designer'],
                ':project_data' => json_encode($projectData, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                ':id' => $projectId,
            ]);
            echo json_encode(['success' => true, 'project_id' => $projectId]);
            exit;
        }

        // Decodifica el documento enviado por el editor y normaliza sus metadatos.
        $projectId = $_POST['project_id'] ?? '';
        $data = $_POST['project'] ?? '{}';
        $decoded = json_decode($data, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('Project payload is invalid');
        }

        $projectName = trim((string)($decoded['name'] ?? 'Proyecto nuevo')) ?: 'Proyecto nuevo';
        $clientName = trim((string)($decoded['client_name'] ?? 'Cliente'));
        $address = trim((string)($decoded['address'] ?? 'Dirección'));
        $designer = trim((string)($decoded['designer'] ?? 'Responsable'));

        // Un ID existente actualiza la fila; sin ID se crea una fila nueva.
        if ($projectId !== '') {
            $stmt = $pdo->prepare('UPDATE projects SET name = :name, client_name = :client_name, address = :address, designer = :designer, project_data = :project_data, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                ':name' => $projectName,
                ':client_name' => $clientName,
                ':address' => $address,
                ':designer' => $designer,
                ':project_data' => json_encode($decoded),
                ':id' => (int)$projectId,
            ]);
            echo json_encode(['success' => true, 'project_id' => (int)$projectId]);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO projects (name, client_name, address, designer, project_data) VALUES (:name, :client_name, :address, :designer, :project_data)');
        $stmt->execute([
            ':name' => $projectName,
            ':client_name' => $clientName,
            ':address' => $address,
            ':designer' => $designer,
            ':project_data' => json_encode($decoded),
        ]);

        echo json_encode(['success' => true, 'project_id' => (int)$pdo->lastInsertId()]);
        exit;
    }

    // Endpoints de consulta utilizados para listar y cargar proyectos.
    if (isset($_GET['action']) && $_GET['action'] === 'list') {
        header('Content-Type: application/json; charset=utf-8');
        $rows = $pdo->query('SELECT id, name, client_name, address, designer, updated_at, project_data FROM projects ORDER BY updated_at DESC')->fetchAll();
        echo json_encode(['success' => true, 'projects' => $rows]);
        exit;
    }

    // Recupera un registro por ID y devuelve sus metadatos junto al JSON del plano.
    if (isset($_GET['action']) && $_GET['action'] === 'load') {
        header('Content-Type: application/json; charset=utf-8');
        $projectId = (int)($_GET['project_id'] ?? 0);
        $stmt = $pdo->prepare('SELECT id, name, client_name, address, designer, project_data, updated_at FROM projects WHERE id = :id');
        $stmt->execute([':id' => $projectId]);
        $project = $stmt->fetch();
        if (!$project) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Proyecto no encontrado']);
            exit;
        }

        $projectData = json_decode((string)$project['project_data'], true);
        echo json_encode(['success' => true, 'project' => [
            'id' => (int)$project['id'],
            'name' => $project['name'],
            'client_name' => $project['client_name'],
            'address' => $project['address'],
            'designer' => $project['designer'],
            'updated_at' => $project['updated_at'],
            'project_data' => is_array($projectData) ? $projectData : []
        ]]);
        exit;
    }

    // Construye el documento PDF a partir del SVG validado y de los metadatos guardados.
    if (($_GET['action'] ?? '') === 'pdf' || ($_POST['action'] ?? '') === 'pdf') {
        require_once __DIR__ . '/vendor/autoload.php';
        $projectId = (int)($_POST['project_id'] ?? $_GET['project_id'] ?? 0);
        $project = $pdo->prepare('SELECT * FROM projects WHERE id = :id');
        $project->execute([':id' => $projectId]);
        $projectData = $project->fetch();

        if (!$projectData) {
            http_response_code(404);
            echo 'Proyecto no encontrado';
            exit;
        }

        // Verifica el tamaño y valida el contenido del dibujo antes de procesarlo.
        $planSvg = $_POST['plan_svg'] ?? '';
        if ($planSvg === '' || strlen($planSvg) > 8 * 1024 * 1024) {
            throw new RuntimeException('No se recibió un plano SVG válido.');
        }

        $planSvg = sanitizePdfSvg($planSvg);
        $planImage = 'data:image/svg+xml;base64,' . base64_encode($planSvg);
        $symbols = json_decode((string)($_POST['symbols'] ?? '[]'), true);
        if (!is_array($symbols)) {
            throw new RuntimeException('La leyenda de símbolos no es válida.');
        }

        // Traduce los tipos internos de objeto a nombres legibles en la leyenda.
        $symbolLabels = [
            'wall' => 'Pared',
            'room' => 'Habitación',
            'door' => 'Puerta',
            'window' => 'Ventana',
            'measure' => 'Medición',
            'light' => 'Luminaria',
            'switch' => 'Interruptor',
            'socket' => 'Tomacorriente',
            'box' => 'Caja de conexión',
            'panel' => 'Tablero eléctrico',
            'conduit' => 'Tubería / conducto',
            'drop' => 'Pie de amigo (bajada)',
            'circuit' => 'Circuito eléctrico',
            'protection' => 'Protección eléctrica',
            'dimension' => 'Cota de medida',
        ];
        $legendRows = '';
        foreach ($symbols as $symbol) {
            if (!is_array($symbol) || !isset($symbol['type'], $symbol['markup']) ||
                !isset($symbolLabels[$symbol['type']]) || !is_string($symbol['markup'])) {
                throw new RuntimeException('La leyenda contiene un símbolo no válido.');
            }
            $iconContents = sanitizePdfSvg(
                '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">' .
                    $symbol['markup'] . '</svg>'
            );
            $label = htmlspecialchars($symbolLabels[$symbol['type']], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $iconImage = 'data:image/svg+xml;base64,' . base64_encode($iconContents);
            $legendRows .= '<tr><td class="legend-icon"><img src="' . $iconImage .
                '" alt="" /></td><td>' . $label . '</td></tr>';
        }

        // Valida dimensiones y escala el dibujo para que quepa en el área imprimible.
        $planWidth = filter_var($_POST['plan_width'] ?? null, FILTER_VALIDATE_FLOAT);
        $planHeight = filter_var($_POST['plan_height'] ?? null, FILTER_VALIDATE_FLOAT);
        if (!$planWidth || !$planHeight || $planWidth < 1 || $planHeight < 1 ||
            $planWidth > 100000 || $planHeight > 100000) {
            throw new RuntimeException('Las dimensiones del plano no son válidas.');
        }
        $fitScale = min(540 / $planWidth, 370 / $planHeight);
        $imageWidth = max(1, $planWidth * $fitScale);
        $imageHeight = max(1, $planHeight * $fitScale);
        // Escapa datos de usuario y prepara los recursos embebidos del documento.
        $projectName = htmlspecialchars($projectData['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $clientName = htmlspecialchars($projectData['client_name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $address = htmlspecialchars($projectData['address'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $designer = htmlspecialchars($projectData['designer'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $projectCode = 'PLANO-' . str_pad((string)$projectId, 4, '0', STR_PAD_LEFT);
        $generatedDate = date('d/m/Y');
        $logoPath = __DIR__ . '/imagen/logo.jpeg';
        if (!is_file($logoPath) || !is_readable($logoPath)) {
            throw new RuntimeException('No se encontró el logo del proyecto en la carpeta imagen.');
        }
        $logoContents = file_get_contents($logoPath);
        if ($logoContents === false) {
            throw new RuntimeException('No se pudo leer el logo del proyecto.');
        }
        $logoImage = 'data:image/jpeg;base64,' . base64_encode($logoContents);

        // Plantilla del PDF: encabezado, datos del proyecto, plano, leyenda y pie de página.
        $html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><style>
            @page { margin: 18px; }
            body { font-family: Arial, sans-serif; margin: 0; color:#17243b; }
            .header { width:100%; border-collapse:collapse; margin-bottom:6px; }
            .brand-logo { width:44px; height:44px; background:#fff; vertical-align:middle; }
            .brand-copy { padding-left:8px; vertical-align:middle; }
            .eyebrow { color:#e76500; font-size:7px; font-weight:bold; letter-spacing:1px; }
            h1 { margin:2px 0 0; font-size:17px; color:#123047; }
            .document-info { text-align:right; vertical-align:middle; color:#64748b; font-size:8px; line-height:1.5; }
            .document-info strong { color:#123047; font-size:9px; }
            .project-meta { width:100%; border-collapse:separate; border-spacing:4px 0; margin:0 0 7px; table-layout:fixed; }
            .project-meta td { padding:5px 7px; border:1px solid #dbe4ef; background:#f8fafc; vertical-align:top; }
            .meta-label { display:block; margin-bottom:2px; color:#64748b; font-size:6px; font-weight:bold; text-transform:uppercase; letter-spacing:.5px; }
            .meta-value { color:#17243b; font-size:8px; font-weight:bold; }
            .content { width:100%; height:440px; border-collapse:separate; border-spacing:0; table-layout:fixed; page-break-inside:avoid; }
            .plan-cell { width:74%; height:440px; padding:9px; border:1px solid #cbd5e1; background:#fff; text-align:center; vertical-align:middle; }
            .legend-cell { width:26%; height:440px; padding:9px; border:1px solid #cbd5e1; background:#f5f8fc; vertical-align:top; }
            .section-heading { margin:0 0 2px; color:#123047; font-size:11px; font-weight:bold; }
            .section-subtitle { margin:0 0 5px; color:#64748b; font-size:7px; }
            .plan-image { display:block; margin:0 auto; width:' . number_format($imageWidth, 2, '.', '') . 'px; height:' . number_format($imageHeight, 2, '.', '') . 'px; }
            .legend { width:100%; border-collapse:collapse; font-size:8px; }
            .legend td { padding:3px 2px; border-bottom:1px solid #dfe7f0; vertical-align:middle; }
            .legend-icon { width:30px; height:23px; }
            .legend-icon img { display:block; width:20px; height:20px; }
            .footer { width:100%; margin-top:5px; padding-top:3px; border-top:1px solid #dbe4ef; color:#64748b; font-size:6px; }
            .footer-right { text-align:right; }
        </style></head><body>';
        // Agrega al HTML encabezado, ficha, plano con leyenda y pie de página.
        $html .= '<table class="header"><tr><td><img class="brand-logo" src="' . $logoImage . '" alt="Logo de instalaciones eléctricas" /></td><td class="brand-copy"><div class="eyebrow">INSTALACIONES ELÉCTRICAS</div><h1>' . $projectName . '</h1></td><td class="document-info"><strong>' . $projectCode . '</strong><br />Fecha de emisión: ' . $generatedDate . '</td></tr></table>';
        $html .= '<table class="project-meta"><tr><td><span class="meta-label">Cliente</span><span class="meta-value">' . $clientName . '</span></td><td><span class="meta-label">Dirección del proyecto</span><span class="meta-value">' . $address . '</span></td><td><span class="meta-label">Diseñador</span><span class="meta-value">' . $designer . '</span></td></tr></table>';
        $html .= '<table class="content"><tr><td class="plan-cell"><img class="plan-image" src="' . $planImage . '" alt="Plano eléctrico del proyecto" /></td><td class="legend-cell"><div class="section-heading">Simbología</div><div class="section-subtitle">Símbolos utilizados en el plano</div><table class="legend">' . $legendRows . '</table></td></tr></table>';
        $html .= '<table class="footer"><tr><td>Documento generado por Plano Eléctrico</td><td class="footer-right">' . $projectCode . ' &nbsp; | &nbsp; Hoja 1 de 1</td></tr></table>';
        $html .= '</body></html>';

        // Renderiza el HTML en A4 horizontal y exige que el resultado ocupe una página.
        $dompdf = new Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();
        if ($dompdf->getCanvas()->get_page_count() !== 1) {
            throw new RuntimeException('El plano y la leyenda no caben en una sola página. Reduce el tamaño del plano.');
        }
        $dompdf->stream('proyecto_' . $projectId . '.pdf', ['Attachment' => false]);
        exit;
    }

    // Devuelve una respuesta clara cuando la acción solicitada no existe.
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'No valid action']);
} catch (Throwable $e) {
    // Expone el fallo al cliente como JSON y marca la solicitud como error del servidor.
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
