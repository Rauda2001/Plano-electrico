// Referencias al DOM, dimensiones del lienzo y símbolos reutilizados por el editor y el PDF.
const svg = document.getElementById('drawing-canvas');
const propertyPanel = document.getElementById('property-panel');
const sendToBackButton = document.getElementById('send-to-back');
const undoActionButton = document.getElementById('undo-action');
const redoActionButton = document.getElementById('redo-action');
const headerProjectName = document.getElementById('header-project-name');
const dirtyIndicator = document.getElementById('dirty-indicator');
const zoomLevel = document.getElementById('zoom-level');
const panX = document.getElementById('pan-x');
const panY = document.getElementById('pan-y');
const eraserCursor = document.getElementById('eraser-cursor');
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const VIEW_WIDTH = 1200;
const VIEW_HEIGHT = 800;

const symbolMarkup = {
  wall: '<line x1="5" y1="24" x2="43" y2="24" stroke="#111827" stroke-width="6" stroke-linecap="square" />',
  room: '<rect x="5" y="8" width="38" height="32" fill="#fef3c7" stroke="#1e3a8a" stroke-width="2" /><path d="M5 8h38" stroke="#1e3a8a" stroke-width="3" />',
  door: '<path d="M8 40V8h32M8 40h32M8 40A32 32 0 0 1 40 8" fill="none" stroke="#1e3a8a" stroke-width="2.5" /><path d="M8 40L30 18" stroke="#2563eb" stroke-width="2.5" />',
  window: '<path d="M5 15h38M5 33h38M12 15v18M36 15v18" fill="none" stroke="#0284c7" stroke-width="3" />',
  measure: '<path d="M9 34L34 9M6 27l8 8M28 6l8 8" fill="none" stroke="#dc2626" stroke-width="2.5" /><path d="M14 30l4 4M19 25l4 4M24 20l4 4" stroke="#dc2626" stroke-width="2" />',
  light: '<circle cx="24" cy="24" r="13" fill="#fef9c3" stroke="#d97706" stroke-width="2.5" /><path d="M24 17v14M17 24h14M24 3v5M24 40v5M3 24h5M40 24h5M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />',
  switch: '<circle cx="24" cy="24" r="17" fill="#ede9fe" stroke="#7c3aed" stroke-width="2.5" /><text x="24" y="30" text-anchor="middle" font-size="19" font-family="Arial,sans-serif" font-weight="700" fill="#5b21b6">S</text>',
  socket: '<circle cx="24" cy="24" r="18" fill="#dcfce7" stroke="#15803d" stroke-width="2.5" /><circle cx="18" cy="21" r="2.5" fill="#166534" /><circle cx="30" cy="21" r="2.5" fill="#166534" /><path d="M24 26v6" stroke="#166534" stroke-width="2.5" stroke-linecap="round" />',
  box: '<rect x="8" y="8" width="32" height="32" rx="3" fill="#ffedd5" stroke="#c2410c" stroke-width="2.5" /><path d="M12 12l24 24M36 12L12 36" stroke="#c2410c" stroke-width="2.5" /><circle cx="24" cy="24" r="3" fill="#fff" stroke="#c2410c" stroke-width="2" />',
  panel: '<rect x="10" y="5" width="28" height="38" rx="3" fill="#e0f2fe" stroke="#0369a1" stroke-width="2.5" /><path d="M16 13h16M16 22h16M16 31h16" stroke="#0369a1" stroke-width="2" /><circle cx="20" cy="13" r="2" fill="#0369a1" /><circle cx="20" cy="22" r="2" fill="#0369a1" /><circle cx="20" cy="31" r="2" fill="#0369a1" />',
  conduit: '<path d="M6 34h12V14h12v20h12" fill="none" stroke="#0891b2" stroke-width="4" stroke-linejoin="round" /><circle cx="6" cy="34" r="3" fill="#0891b2" /><circle cx="42" cy="34" r="3" fill="#0891b2" />',
  drop: '<path d="M5 10h38M24 10v27" fill="none" stroke="#7c3aed" stroke-width="3.5" stroke-linecap="round" /><path d="m18 31 6 8 6-8" fill="none" stroke="#7c3aed" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" /><circle cx="24" cy="10" r="4" fill="#ede9fe" stroke="#7c3aed" stroke-width="2" />',
  circuit: '<path d="M7 34h10V14h14v20h10" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="4 3" stroke-linejoin="round" /><circle cx="7" cy="34" r="4" fill="#2563eb" /><circle cx="41" cy="34" r="4" fill="#2563eb" /><rect x="17" y="18" width="14" height="11" rx="3" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5" /><text x="24" y="26" text-anchor="middle" font-size="7" font-family="Arial,sans-serif" font-weight="700" fill="#1e40af">C1</text>',
  protection: '<rect x="9" y="7" width="30" height="34" rx="4" fill="#fee2e2" stroke="#b91c1c" stroke-width="2.5" /><path d="M15 15h18M15 33h18M24 15v8" fill="none" stroke="#b91c1c" stroke-width="2.5" /><circle cx="24" cy="27" r="4" fill="#fff" stroke="#b91c1c" stroke-width="2" />',
  dimension: '<path d="M8 34V14M40 34V14M8 24h32" fill="none" stroke="#dc2626" stroke-width="2" /><path d="M8 24l7-4v8zM40 24l-7-4v8z" fill="#dc2626" /><text x="24" y="18" text-anchor="middle" font-size="8" font-family="Arial,sans-serif" font-weight="700" fill="#b91c1c">m</text>',
};

// Crea nodos SVG dentro del espacio de nombres correcto y aplica sus atributos.
function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

// Inserta el dibujo del símbolo centrado y escalado al tamaño del objeto.
function addSymbol(parent, type, x, y, width, height) {
  const size = Math.min(48, width, height);
  const symbol = createSvgElement('g', {
    transform: `translate(${x + (width - size) / 2} ${y + (height - size) / 2}) scale(${size / 48})`,
  });
  symbol.innerHTML = symbolMarkup[type] || symbolMarkup.box;
  parent.appendChild(symbol);
}

// Sustituye el texto de cada herramienta por su icono y conserva su etiqueta accesible.
document.querySelectorAll('.tool-btn').forEach((button) => {
  const icon = createSvgElement('svg', {
    viewBox: '0 0 48 48',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  icon.innerHTML = symbolMarkup[button.dataset.tool] || symbolMarkup.box;
  const label = document.createElement('span');
  label.textContent = button.textContent.trim();
  button.replaceChildren(icon, label);
});

// Estado en memoria del documento y de las interacciones activas del puntero.
const state = {
  selectedTool: 'select',
  canvasMode: 'select',
  selection: null,
  drag: null,
  eraseStroke: null,
  drawingLine: null,
  projectId: window.projectId || null,
  dirty: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  objects: Array.isArray(window.initialProject?.objects) ? window.initialProject.objects : [],
  history: [],
  future: [],
};

// Indicador de modificaciones pendientes, estado del proyecto e historial.
function setDirty(value) {
  state.dirty = value;
  dirtyIndicator.textContent = value ? 'Cambios sin guardar' : 'Sin cambios';
  dirtyIndicator.style.background = value ? '#fef3c7' : '#e5e7eb';
  dirtyIndicator.style.color = value ? '#92400e' : '#6b7280';
}

// Genera identificadores únicos para distinguir objetos del plano.
function generateId(prefix = 'obj') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Marca una herramienta como seleccionada tanto en el estado como en la interfaz.
function setSelectedTool(tool) {
  state.selectedTool = tool;
  document.querySelectorAll('.tool-btn').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

// Completa metadatos, capas predeterminadas y objetos para el documento actual.
function defaultProjectData() {
  const project = window.initialProject || {};
  return {
    name: project.name || 'Proyecto nuevo',
    client_name: project.client_name || '',
    address: project.address || '',
    designer: project.designer || 'Responsable',
    layers: [
      { id: 'architecture', name: 'Arquitectura', visible: true, locked: false },
      { id: 'measures', name: 'Cotas', visible: true, locked: false },
      { id: 'lighting', name: 'Iluminación', visible: true, locked: false },
      { id: 'switches', name: 'Interruptores', visible: true, locked: false },
      { id: 'sockets', name: 'Tomacorrientes', visible: true, locked: false },
      { id: 'conduits', name: 'Conductos', visible: true, locked: false },
      { id: 'boxes', name: 'Cajas', visible: true, locked: false },
      { id: 'board', name: 'Tablero', visible: true, locked: false },
      { id: 'connection', name: 'Acometida', visible: true, locked: false },
      { id: 'annotations', name: 'Anotaciones', visible: true, locked: false },
      { id: 'legend', name: 'Leyenda', visible: true, locked: false }
    ],
    objects: state.objects
  };
}

// Añade una marca temporal al documento que se enviará al servidor.
function getProjectPayload() {
  return {
    ...defaultProjectData(),
    savedAt: new Date().toISOString()
  };
}

// Guarda una instantánea para deshacer y descarta la rama de rehacer anterior.
function pushHistory() {
  state.history.push(JSON.stringify({ objects: state.objects }));
  if (state.history.length > 50) state.history.shift();
  state.future = [];
}

// Restaura la instantánea anterior y refresca el dibujo y sus propiedades.
function undoAction() {
  if (!state.history.length) return;
  state.future.push(JSON.stringify({ objects: state.objects }));
  const prev = JSON.parse(state.history.pop());
  state.objects = prev.objects;
  state.selection = state.selection ? state.objects.find((obj) => obj.id === state.selection.id) || null : null;
  renderProperties();
  render();
  setDirty(true);
}

// Reaplica el siguiente estado guardado y actualiza la interfaz del editor.
function redoAction() {
  if (!state.future.length) return;
  state.history.push(JSON.stringify({ objects: state.objects }));
  const next = JSON.parse(state.future.pop());
  state.objects = next.objects;
  state.selection = state.selection ? state.objects.find((obj) => obj.id === state.selection.id) || null : null;
  renderProperties();
  render();
  setDirty(true);
}

// Zoom, desplazamiento y encuadre del plano dentro de la ventana SVG.
function updateCanvasView() {
  const viewWidth = VIEW_WIDTH / state.zoom;
  const viewHeight = VIEW_HEIGHT / state.zoom;
  const maxPanX = Math.max(0, WORLD_WIDTH - viewWidth);
  const maxPanY = Math.max(0, WORLD_HEIGHT - viewHeight);
  state.panX = Math.max(0, Math.min(state.panX, maxPanX));
  state.panY = Math.max(0, Math.min(state.panY, maxPanY));
  panX.max = String(maxPanX);
  panY.max = String(maxPanY);
  panX.value = String(state.panX);
  panY.value = String(state.panY);
  svg.setAttribute('viewBox', `${state.panX} ${state.panY} ${viewWidth} ${viewHeight}`);
}

// Calcula los límites de los objetos y centra el plano con un margen visible.
function fitDrawing() {
  const elements = [...svg.querySelectorAll('[data-id]')];
  if (!elements.length) {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
  } else {
    let bounds = null;
    elements.forEach((element) => {
      const box = element.getBBox();
      if (!box.width && !box.height) return;
      if (!bounds) {
        bounds = { x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
        return;
      }
      bounds.x = Math.min(bounds.x, box.x);
      bounds.y = Math.min(bounds.y, box.y);
      bounds.right = Math.max(bounds.right, box.x + box.width);
      bounds.bottom = Math.max(bounds.bottom, box.y + box.height);
    });

    if (bounds) {
      const padding = 80;
      const width = Math.max(1, bounds.right - bounds.x + padding * 2);
      const height = Math.max(1, bounds.bottom - bounds.y + padding * 2);
      state.zoom = Math.max(0.4, Math.min(2, VIEW_WIDTH / width, VIEW_HEIGHT / height));
      const viewWidth = VIEW_WIDTH / state.zoom;
      const viewHeight = VIEW_HEIGHT / state.zoom;
      state.panX = (bounds.x + bounds.right - viewWidth) / 2;
      state.panY = (bounds.y + bounds.bottom - viewHeight) / 2;
    }
  }

  zoomLevel.value = String(Math.round(state.zoom * 100));
  updateCanvasView();
}

// Renderiza el estado actual como elementos SVG y conecta sus eventos.
function render() {
  svg.innerHTML = '';
  undoActionButton.disabled = state.history.length === 0;
  redoActionButton.disabled = state.future.length === 0;
  const selectedIndex = state.selection
    ? state.objects.findIndex((obj) => obj.id === state.selection.id)
    : -1;
  sendToBackButton.disabled = selectedIndex <= 0;
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(WORLD_WIDTH));
  bg.setAttribute('height', String(WORLD_HEIGHT));
  bg.setAttribute('fill', '#fff');
  svg.appendChild(bg);

  state.objects.forEach((obj) => {
    const element = createSvgElement('g');
    const isWall = obj.type === 'wall';
    const isConduit = isConduitLine(obj);
    const width = Number(obj.width) || 60;
    const height = Number(obj.height) || 40;

    if (isWall || isConduit) {
      const line = createSvgElement('line', {
        x1: obj.x1,
        y1: obj.y1,
        x2: obj.x2,
        y2: obj.y2,
        stroke: isConduit ? '#0891b2' : '#111827',
        'stroke-width': obj.width || (isConduit ? 4 : 6),
        'stroke-linecap': 'square',
      });
      if (isConduit) line.setAttribute('stroke-dasharray', '12 5');
      line.dataset.erasable = 'true';
      line.dataset.id = obj.id;
      element.appendChild(line);
    } else if (obj.type === 'room') {
      const room = createSvgElement('rect', {
        x: obj.x,
        y: obj.y,
        width,
        height,
        fill: obj.fill || '#fef3c7',
      });
      element.appendChild(room);
      const edges = [
        [obj.x, obj.y, obj.x + width, obj.y],
        [obj.x + width, obj.y, obj.x + width, obj.y + height],
        [obj.x + width, obj.y + height, obj.x, obj.y + height],
        [obj.x, obj.y + height, obj.x, obj.y],
      ];
      const erasedEdges = Array.isArray(obj.erasedEdges) ? obj.erasedEdges : [];
      edges.forEach(([x1, y1, x2, y2], edgeIndex) => {
        if (erasedEdges.includes(edgeIndex)) return;
        const edge = createSvgElement('line', {
          x1,
          y1,
          x2,
          y2,
          stroke: '#1e3a8a',
          'stroke-width': 1.5,
          'stroke-linecap': 'round',
        });
        edge.dataset.erasable = 'true';
        edge.dataset.id = obj.id;
        edge.dataset.edge = String(edgeIndex);
        element.appendChild(edge);
      });
      if (obj.name) {
        const label = createSvgElement('text', {
          x: obj.x + width / 2,
          y: obj.y + height / 2,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          fill: '#334155',
          'font-size': 16,
          'font-weight': 700,
        });
        label.textContent = obj.name;
        element.appendChild(label);
      }
    } else {
      addSymbol(element, obj.type, Number(obj.x) || 0, Number(obj.y) || 0, width, height);
      element.dataset.erasable = 'true';
    }

    if (state.selection && state.selection.id === obj.id) element.classList.add('selected');
    element.dataset.id = obj.id;
    element.dataset.type = obj.type;
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', obj.name || obj.type);
    element.addEventListener('click', (event) => {
      if (state.canvasMode === 'select' && state.selectedTool !== 'select') return;
      event.stopPropagation();
      if (state.canvasMode === 'delete') {
        deleteObject(obj.id);
        return;
      }
      selectObject(obj.id);
    });
    svg.appendChild(element);
  });

  updateCanvasView();
}

// Selección y modos de edición; el borrador puede quitar objetos o lados de habitaciones.
function selectObject(id) {
  state.selection = state.objects.find((obj) => obj.id === id) || null;
  renderProperties();
  render();
}

// Cambia el modo de interacción y sincroniza los indicadores visuales del lienzo.
function setCanvasMode(mode) {
  state.canvasMode = mode;
  document.querySelectorAll('.canvas-mode').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  svg.classList.toggle('move-mode', mode === 'move');
  svg.classList.toggle('delete-mode', mode === 'delete');
  svg.classList.toggle('erase-mode', mode === 'erase');
  if (mode !== 'erase') eraserCursor.hidden = true;
}

// Elimina un objeto completo, registra la operación y limpia la selección activa.
function deleteObject(id) {
  if (!state.objects.some((obj) => obj.id === id)) return;
  pushHistory();
  state.objects = state.objects.filter((obj) => obj.id !== id);
  state.selection = null;
  renderProperties();
  render();
  setDirty(true);
  setCanvasMode('select');
}

// Borra un objeto o un borde de habitación una sola vez por trazo del borrador.
function eraseObject(id, edge = null) {
  const eraseKey = edge === null ? id : `${id}:edge:${edge}`;
  if (!state.eraseStroke || state.eraseStroke.ids.has(eraseKey)) return;
  const item = state.objects.find((obj) => obj.id === id);
  if (!item) return;

  if (edge !== null && item.type !== 'room') return;
  if (!state.eraseStroke.historyPushed) {
    pushHistory();
    state.eraseStroke.historyPushed = true;
  }
  state.eraseStroke.ids.add(eraseKey);
  if (edge !== null) {
    item.erasedEdges = [...new Set([...(item.erasedEdges || []), Number(edge)])];
  } else {
    state.objects = state.objects.filter((obj) => obj.id !== id);
  }
  if (state.selection?.id === id) state.selection = null;
  renderProperties();
  render();
  setDirty(true);
}

// Identifica el elemento borrable bajo el cursor y delega su eliminación.
function eraseAtPointer(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const target = element?.closest('#drawing-canvas [data-erasable="true"]');
  if (target?.dataset.id) {
    eraseObject(target.dataset.id, target.dataset.edge === undefined ? null : target.dataset.edge);
  }
}

// Interpola puntos entre eventos para que el borrador no deje espacios al arrastrar.
function eraseAlongPointer(event) {
  const previous = state.eraseStroke.lastPoint;
  const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
  const steps = Math.max(1, Math.ceil(distance / 6));
  for (let step = 1; step <= steps; step++) {
    const progress = step / steps;
    eraseAtPointer({
      clientX: previous.x + (event.clientX - previous.x) * progress,
      clientY: previous.y + (event.clientY - previous.y) * progress,
    });
  }
  state.eraseStroke.lastPoint = { x: event.clientX, y: event.clientY };
}

// Sitúa el cursor personalizado del borrador en la posición actual del puntero.
function moveEraserCursor(event) {
  eraserCursor.style.left = `${event.clientX}px`;
  eraserCursor.style.top = `${event.clientY}px`;
  eraserCursor.hidden = false;
}

// Codifica caracteres especiales antes de construir el HTML del panel de propiedades.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

// Calcula la dimensión longitudinal en unidades SVG según la geometría del objeto.
function getObjectLength(item) {
  if (item.type !== 'wall' && !isConduitLine(item)) return Number(item.height) || 40;
  return Math.hypot((item.x2 || 0) - (item.x1 || 0), (item.y2 || 0) - (item.y1 || 0));
}

// Reconoce ductos que contienen sus dos extremos y se dibujan como líneas.
function isConduitLine(item) {
  return item.type === 'conduit' && ['x1', 'y1', 'x2', 'y2'].every((key) => Number.isFinite(Number(item[key])));
}

// Panel contextual de propiedades; mantiene dimensiones en metros en la interfaz.
function renderProperties() {
  if (!state.selection) {
    propertyPanel.innerHTML = '<p>Selecciona un elemento para editar sus propiedades.</p>';
    return;
  }

  const item = state.selection;
  const isWall = item.type === 'wall';
  const isLine = isWall || isConduitLine(item);
  const hasCircuit = ['light', 'switch', 'socket', 'box', 'panel', 'conduit', 'drop'].includes(item.type);
  const width = Number(item.width) || (isWall ? 6 : isConduitLine(item) ? 4 : 60);
  const length = getObjectLength(item);
  propertyPanel.innerHTML = `
    <div class="property-card">
      <label>Tipo
        <input value="${escapeHtml(item.type)}" readonly />
      </label>
      <label>${isWall ? 'Ancho de pared (m)' : isConduitLine(item) ? 'Grosor de ducto (m)' : 'Ancho (m)'}
        <input type="number" value="${(width / 100).toFixed(2)}" min="0.01" step="0.01" data-prop="widthMeters" />
      </label>
      <label>${isWall ? 'Longitud (m)' : 'Largo (m)'}
        <input type="number" value="${(length / 100).toFixed(2)}" min="0.01" step="0.01" data-prop="lengthMeters" />
      </label>
      <label>Nombre
        <input type="text" value="${escapeHtml(item.name || '')}" data-prop="name" />
      </label>
      ${hasCircuit ? `<label>Circuito
        <select data-prop="circuit">
          <option value="C1" ${item.circuit === 'C1' ? 'selected' : ''}>C1</option>
          <option value="C2" ${item.circuit === 'C2' ? 'selected' : ''}>C2</option>
          <option value="C3" ${item.circuit === 'C3' ? 'selected' : ''}>C3</option>
        </select>
      </label>` : ''}
    </div>
  `;

  propertyPanel.querySelectorAll('[data-prop]').forEach((input) => {
    let historyRecorded = false;
    input.addEventListener('focus', () => {
      historyRecorded = false;
    });
    input.addEventListener('input', (event) => {
      const { prop } = event.target.dataset;
      const value = event.target.value;
      if (prop === 'widthMeters' || prop === 'lengthMeters') {
        const meters = Number(value);
        if (value === '' || !Number.isFinite(meters) || meters <= 0) return;
        if (!historyRecorded) {
          pushHistory();
          historyRecorded = true;
        }
        if (prop === 'widthMeters') {
          state.selection.width = meters * 100;
        } else if (isLine) {
          const currentLength = getObjectLength(state.selection);
          const dx = state.selection.x2 - state.selection.x1;
          const dy = state.selection.y2 - state.selection.y1;
          const ratio = currentLength ? (meters * 100) / currentLength : 1;
          state.selection.x2 = state.selection.x1 + (currentLength ? dx * ratio : meters * 100);
          state.selection.y2 = state.selection.y1 + (currentLength ? dy * ratio : 0);
          state.selection.length = meters;
        } else {
          state.selection.height = meters * 100;
          state.selection.length = meters;
        }
      } else {
        if (!historyRecorded) {
          pushHistory();
          historyRecorded = true;
        }
        state.selection[prop] = value;
      }
      setDirty(true);
      render();
    });
  });
}

// Creación de objetos, conversión de coordenadas y colocación de herramientas.
function createObject(type, x, y, extra = {}) {
  const obj = {
    id: generateId(type),
    type,
    name: type,
    x,
    y,
    width: 80,
    height: 50,
    fill: '#dbeafe',
    ...extra,
  };
  pushHistory();
  state.objects.push(obj);
  state.selection = obj;
  renderProperties();
  render();
  setDirty(true);
}

// Convierte coordenadas del navegador a las coordenadas internas del SVG.
function getSvgCoordinates(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
  return { x: transformed.x, y: transformed.y };
}

function placeSelectedTool(event) {
  const point = getSvgCoordinates(event);
  const tool = state.selectedTool;
  const placements = {
    wall: () => createObject('wall', point.x, point.y, {
      x1: point.x,
      y1: point.y,
      x2: point.x + 200,
      y2: point.y,
      length: 2,
      width: 6,
      name: 'Pared',
      layer: 'architecture',
    }),
    room: () => createObject('room', point.x, point.y, {
      width: 400,
      height: 300,
      name: 'Habitación',
      layer: 'architecture',
      fill: '#fef3c7',
    }),
    door: () => createObject('door', point.x, point.y, { name: 'Puerta', layer: 'architecture' }),
    window: () => createObject('window', point.x, point.y, { name: 'Ventana', layer: 'architecture' }),
    measure: () => createObject('measure', point.x, point.y, { name: 'Medición', layer: 'measures' }),
    light: () => createObject('light', point.x, point.y, { name: 'Luminaria', layer: 'lighting', circuit: 'C1' }),
    switch: () => createObject('switch', point.x, point.y, { name: 'Interruptor', layer: 'switches', circuit: 'C1' }),
    socket: () => createObject('socket', point.x, point.y, { name: 'Tomacorriente', layer: 'sockets', circuit: 'C2' }),
    box: () => createObject('box', point.x, point.y, { name: 'Caja', layer: 'boxes', circuit: 'C1' }),
    panel: () => createObject('panel', point.x, point.y, { name: 'Tablero', layer: 'board', circuit: 'C1' }),
    circuit: () => createObject('circuit', point.x, point.y, { name: 'Circuito', layer: 'annotations', circuit: 'C1' }),
    protection: () => createObject('protection', point.x, point.y, { name: 'Protección', layer: 'board', circuit: 'C1' }),
    dimension: () => createObject('dimension', point.x, point.y, { name: 'Cota', layer: 'measures' }),
    drop: () => createObject('drop', point.x, point.y, { name: 'Pie de amigo (bajada)', layer: 'conduits', circuit: 'C2' }),
  };
  if (!placements[tool]) return;
  placements[tool]();
  setSelectedTool('select');
}

// Eventos de puntero para trazar ductos, mover elementos y borrar al arrastrar.
svg.addEventListener('pointerdown', (event) => {
  if (state.canvasMode === 'select' && state.selectedTool === 'conduit') {
    const point = getSvgCoordinates(event);
    const preview = createSvgElement('line', {
      x1: point.x,
      y1: point.y,
      x2: point.x,
      y2: point.y,
      stroke: '#0891b2',
      'stroke-width': 4,
      'stroke-dasharray': '12 5',
      'stroke-linecap': 'square',
      'pointer-events': 'none',
    });
    state.drawingLine = { start: point, end: point, pointerId: event.pointerId, preview };
    svg.appendChild(preview);
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }
  if (state.canvasMode === 'erase') {
    state.eraseStroke = {
      ids: new Set(),
      historyPushed: false,
      lastPoint: { x: event.clientX, y: event.clientY },
    };
    svg.setPointerCapture(event.pointerId);
    moveEraserCursor(event);
    eraseAtPointer(event);
    return;
  }
  if (state.canvasMode !== 'move') return;
  const id = event.target.closest('[data-id]')?.dataset.id;
  if (!id) return;

  const item = state.objects.find((obj) => obj.id === id);
  if (!item) return;
  svg.setPointerCapture(event.pointerId);
  selectObject(id);
  state.drag = {
    item,
    start: getSvgCoordinates(event),
    x: item.x,
    y: item.y,
    x1: item.x1,
    y1: item.y1,
    x2: item.x2,
    y2: item.y2,
    moved: false,
  };
});

// Actualiza el objeto arrastrado o aplica el borrador durante el movimiento.
svg.addEventListener('pointermove', (event) => {
  if (state.canvasMode === 'erase') moveEraserCursor(event);
  if (state.eraseStroke) {
    eraseAlongPointer(event);
    return;
  }
  if (!state.drag) return;
  const point = getSvgCoordinates(event);
  const dx = point.x - state.drag.start.x;
  const dy = point.y - state.drag.start.y;
  if (!state.drag.moved && Math.hypot(dx, dy) < 1) return;
  if (!state.drag.moved) {
    pushHistory();
    state.drag.moved = true;
  }

  if (state.drag.item.type === 'wall' || isConduitLine(state.drag.item)) {
    state.drag.item.x1 = state.drag.x1 + dx;
    state.drag.item.y1 = state.drag.y1 + dy;
    state.drag.item.x2 = state.drag.x2 + dx;
    state.drag.item.y2 = state.drag.y2 + dy;
  } else {
    state.drag.item.x = state.drag.x + dx;
    state.drag.item.y = state.drag.y + dy;
  }
  render();
});

// Finaliza el gesto de movimiento/borrado y descarta su estado temporal.
function finishDragging() {
  if (state.drag && state.drag.moved) setDirty(true);
  state.drag = null;
  state.eraseStroke = null;
}

// Mantiene visible el extremo provisional del ducto mientras se arrastra.
window.addEventListener('pointermove', (event) => {
  const line = state.drawingLine;
  if (!line || event.pointerId !== line.pointerId) return;
  line.end = getSvgCoordinates(event);
  line.preview.setAttribute('x2', String(line.end.x));
  line.preview.setAttribute('y2', String(line.end.y));
});

// Confirma el ducto al soltar el puntero y descarta trazos demasiado cortos.
window.addEventListener('pointerup', (event) => {
  const line = state.drawingLine;
  if (!line || event.pointerId !== line.pointerId) return;
  state.drawingLine = null;
  line.preview.remove();
  const length = Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y);
  if (length < 3) return;
  createObject('conduit', line.start.x, line.start.y, {
    x1: line.start.x,
    y1: line.start.y,
    x2: line.end.x,
    y2: line.end.y,
    width: 4,
    length: length / 100,
    name: 'Ducto',
    layer: 'conduits',
    circuit: 'C2',
  });
  setSelectedTool('select');
}, true);

// Cancela el trazado temporal si el navegador interrumpe el gesto.
window.addEventListener('pointercancel', (event) => {
  const line = state.drawingLine;
  if (!line || event.pointerId !== line.pointerId) return;
  state.drawingLine = null;
  line.preview.remove();
});

// Finaliza gestos del lienzo y oculta el cursor del borrador al salir del área.
svg.addEventListener('pointerup', finishDragging);
svg.addEventListener('pointercancel', finishDragging);
svg.addEventListener('pointerleave', () => {
  if (!state.eraseStroke) eraserCursor.hidden = true;
});

// Coloca la herramienta activa en el lienzo o limpia la selección al hacer clic vacío.
svg.addEventListener('click', (event) => {
  if (state.canvasMode === 'erase') return;
  if (state.selectedTool === 'conduit') return;
  if (state.selectedTool !== 'select') {
    placeSelectedTool(event);
    return;
  }

  const target = event.target;
  if (!target.closest('[data-id]') && state.selectedTool === 'select') {
    state.selection = null;
    renderProperties();
    render();
  }
});

// Acciones de interfaz: herramientas, modos, historial, vista, orden y duplicación.
document.querySelectorAll('.tool-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setSelectedTool(button.dataset.tool);
  });
});

document.querySelectorAll('.canvas-mode').forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    setSelectedTool('select');
    if (mode === 'delete' && state.selection) {
      deleteObject(state.selection.id);
      return;
    }
    setCanvasMode(mode);
  });
});

// Conecta los controles de guardado, historial y encuadre del proyecto.
document.getElementById('save-project').addEventListener('click', saveProject);
undoActionButton.addEventListener('click', undoAction);
redoActionButton.addEventListener('click', redoAction);
document.getElementById('fit-screen').addEventListener('click', () => {
  fitDrawing();
});

// Sincroniza los controles deslizantes de zoom y desplazamiento con el viewBox.
zoomLevel.addEventListener('input', (event) => {
  state.zoom = Number(event.target.value) / 100;
  updateCanvasView();
});
panX.addEventListener('input', (event) => {
  state.panX = Number(event.target.value);
  updateCanvasView();
});
panY.addEventListener('input', (event) => {
  state.panY = Number(event.target.value);
  updateCanvasView();
});

// Duplica la selección con un nuevo ID y un pequeño desplazamiento visual.
document.getElementById('duplicate-item').addEventListener('click', () => {
  if (!state.selection) return;
  const copy = JSON.parse(JSON.stringify(state.selection));
  copy.id = generateId(copy.type);
  copy.x = (copy.x || 0) + 30;
  copy.y = (copy.y || 0) + 30;
  pushHistory();
  state.objects.push(copy);
  state.selection = copy;
  renderProperties();
  render();
  setDirty(true);
});

// Reordena el objeto seleccionado al principio para dibujarlo detrás de los demás.
sendToBackButton.addEventListener('click', () => {
  if (!state.selection) return;
  const selectedIndex = state.objects.findIndex((obj) => obj.id === state.selection.id);
  if (selectedIndex <= 0) return;

  pushHistory();
  const [selected] = state.objects.splice(selectedIndex, 1);
  state.objects.unshift(selected);
  render();
  setDirty(true);
});

// Abre una ventana con una copia legible del SVG actual como vista previa.
document.getElementById('preview-action').addEventListener('click', () => {
  const panel = window.open('', '_blank', 'width=1200,height=900');
  if (!panel) {
    alert('Permite las ventanas emergentes para abrir la vista previa.');
    return;
  }
  panel.document.write(`
    <html><head><title>Vista previa</title>
    <style>body{font-family:Arial; padding:20px;} svg{width:100%; border:1px solid #d1d5db;}</style>
    </head><body>
    <h2>${window.initialProject?.name || 'Proyecto nuevo'}</h2>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">${svg.innerHTML}</svg>
    </body></html>
  `);
  panel.document.close();
});

// Prepara un SVG ajustado al contenido y recopila la simbología usada para exportar.
function createPlanSvg() {
  const exportSvg = svg.cloneNode(true);
  const objectElements = [...svg.querySelectorAll('[data-id]')];
  let bounds = null;
  objectElements.forEach((element) => {
    const box = element.getBBox();
    if (!box.width && !box.height) return;
    if (!bounds) {
      bounds = { x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
      return;
    }
    bounds.x = Math.min(bounds.x, box.x);
    bounds.y = Math.min(bounds.y, box.y);
    bounds.right = Math.max(bounds.right, box.x + box.width);
    bounds.bottom = Math.max(bounds.bottom, box.y + box.height);
  });
  const padding = 40;
  const viewX = bounds ? Math.max(0, bounds.x - padding) : 0;
  const viewY = bounds ? Math.max(0, bounds.y - padding) : 0;
  const viewRight = bounds ? bounds.right + padding : 1200;
  const viewBottom = bounds ? bounds.bottom + padding : 800;
  const viewWidth = Math.max(1, viewRight - viewX);
  const viewHeight = Math.max(1, viewBottom - viewY);
  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportSvg.setAttribute('width', String(viewWidth));
  exportSvg.setAttribute('height', String(viewHeight));
  exportSvg.setAttribute('viewBox', `${viewX} ${viewY} ${viewWidth} ${viewHeight}`);
  exportSvg.querySelectorAll('.selected').forEach((element) => element.classList.remove('selected'));
  const labels = {
    wall: 'Pared',
    room: 'Habitación',
    door: 'Puerta',
    window: 'Ventana',
    measure: 'Medición',
    light: 'Luminaria',
    switch: 'Interruptor',
    socket: 'Tomacorriente',
    box: 'Caja de conexión',
    panel: 'Tablero eléctrico',
    conduit: 'Tubería / conducto',
    circuit: 'Circuito eléctrico',
    protection: 'Protección eléctrica',
    dimension: 'Cota de medida',
    drop: 'Pie de amigo (bajada)',
  };
  const types = [...new Set(objectElements.map((element) => element.dataset.type))];
  const symbols = types
    .filter((type) => labels[type] && symbolMarkup[type])
    .map((type) => ({ type, label: labels[type], markup: symbolMarkup[type] }));
  return {
    markup: new XMLSerializer().serializeToString(exportSvg),
    symbols,
    viewWidth,
    viewHeight,
  };
}

// La exportación guarda primero y luego solicita el PDF al servidor.
document.getElementById('export-pdf').addEventListener('click', async () => {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    alert('Permite las ventanas emergentes para mostrar el PDF.');
    return;
  }
  previewWindow.document.write('<!doctype html><title>Preparando PDF</title><p style="font:16px Arial,sans-serif;padding:24px">Preparando la vista previa del PDF…</p>');
  previewWindow.document.close();

  try {
    const saved = await saveProject();
    if (!saved) {
      previewWindow.close();
      return;
    }

    const plan = createPlanSvg();
    const formData = new FormData();
    formData.append('action', 'pdf');
    formData.append('project_id', String(state.projectId));
    formData.append('plan_svg', plan.markup);
    formData.append('symbols', JSON.stringify(plan.symbols));
    formData.append('plan_width', String(plan.viewWidth));
    formData.append('plan_height', String(plan.viewHeight));

    const response = await fetch('save_project.php', {
      method: 'POST',
      headers: { Accept: 'application/pdf, application/json' },
      body: formData,
    });
    if (!response.ok) {
      const body = await response.text();
      let message = body;
      try {
        message = JSON.parse(body).message || body;
      } catch (error) {
        message = body;
      }
      throw new Error(message || 'El servidor no pudo generar el PDF.');
    }

    const pdf = await response.blob();
    if (!pdf.size || pdf.type !== 'application/pdf') {
      throw new Error('El servidor no devolvió un archivo PDF válido.');
    }
    const downloadUrl = URL.createObjectURL(pdf);
    previewWindow.location.href = downloadUrl;
  } catch (error) {
    previewWindow.close();
    alert(`No se pudo exportar el PDF: ${error.message}`);
  }
});

// Serializa el proyecto y lo crea o actualiza mediante save_project.php.
async function saveProject() {
  const payload = getProjectPayload();
  const formData = new FormData();
  formData.append('project', JSON.stringify(payload));
  formData.append('project_id', state.projectId ? String(state.projectId) : '');

  let result;
  try {
    const response = await fetch('save_project.php', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Error al guardar el proyecto');
  } catch (error) {
    alert(`No se pudo guardar el proyecto: ${error.message}`);
    return null;
  }

  if (result.success) {
    state.projectId = result.project_id;
    setDirty(false);
    console.log('Proyecto guardado correctamente', result.project_id);
    return result;
  }
  alert(result.message || 'Error al guardar');
  return null;
}

// Arranque: muestra el nombre, dibuja el proyecto cargado y limpia el indicador.
headerProjectName.textContent = window.initialProject?.name || 'Proyecto nuevo';
render();
if (state.objects.length) fitDrawing();
setDirty(false);
