// Data Models and Storage
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    genId: () => Date.now().toString(36) + Math.random().toString(36).substr(2)
};

// Initial Data structures if empty
const initStorage = () => {
    if (!localStorage.getItem('clientes')) Storage.set('clientes', []);
    if (!localStorage.getItem('casos')) Storage.set('casos', []);
    if (!localStorage.getItem('audiencias')) Storage.set('audiencias', []);
    if (!localStorage.getItem('documentos')) Storage.set('documentos', []);
};

// Application State
let currentState = {
    clientes: [],
    casos: [],
    audiencias: [],
    documentos: []
};

// Load Data
const loadData = () => {
    currentState.clientes = Storage.get('clientes');
    currentState.casos = Storage.get('casos');
    currentState.audiencias = Storage.get('audiencias');
    currentState.documentos = Storage.get('documentos');
};

// Utility to show alerts
const showAlert = (message, type = 'success') => {
    const container = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert alert--${type}`;
    alert.innerHTML = `<span>${message}</span>`;
    container.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOutRight 0.3s ease forwards';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Helper for badges
const getStatusBadge = (status) => {
    let className = 'badge--open';
    if (status === 'Pendiente') className = 'badge--pending';
    if (status === 'Realizada' || status === 'Cerrado') className = 'badge--done';
    if (status === 'Cancelada') className = 'badge--cancelled';
    return `<span class="badge ${className}">${status}</span>`;
};

// Navigation
const setupNavigation = () => {
    const navItems = document.querySelectorAll('.nav-list__item');
    const views = document.querySelectorAll('.view');
    const title = document.getElementById('current-section-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Update title
            const targetName = e.currentTarget.textContent;
            title.textContent = targetName;

            // Show view
            const targetId = e.currentTarget.getAttribute('data-target');
            views.forEach(view => view.classList.remove('view--active'));
            document.getElementById(`view-${targetId}`).classList.add('view--active');

            // Refresh specific view data if needed
            renderView(targetId);
        });
    });
};

// Modals
const setupModals = () => {
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.js-modal-close');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Modal triggers (New Actions)
    document.getElementById('btn-new-cliente').addEventListener('click', () => {
        document.getElementById('form-cliente').reset();
        document.getElementById('cliente-id').value = '';
        document.getElementById('modal-cliente-title').textContent = 'Nuevo Cliente';
        document.getElementById('modal-cliente').classList.add('active');
    });

    document.getElementById('btn-new-caso').addEventListener('click', () => {
        document.getElementById('form-caso').reset();
        document.getElementById('caso-id').value = '';
        document.getElementById('modal-caso-title').textContent = 'Nuevo Caso';
        populateSelect('caso-cliente', currentState.clientes, 'nombre');
        document.getElementById('modal-caso').classList.add('active');
    });

    document.getElementById('btn-new-audiencia').addEventListener('click', () => {
        document.getElementById('form-audiencia').reset();
        document.getElementById('audiencia-id').value = '';
        document.getElementById('modal-audiencia-title').textContent = 'Nueva Audiencia';
        populateSelect('audiencia-caso', currentState.casos, 'titulo');
        document.getElementById('modal-audiencia').classList.add('active');
    });

    document.getElementById('btn-new-documento').addEventListener('click', () => {
        document.getElementById('form-documento').reset();
        document.getElementById('documento-id').value = '';
        document.getElementById('modal-documento-title').textContent = 'Subir Documento';
        populateSelect('documento-caso', currentState.casos, 'titulo');
        document.getElementById('modal-documento').classList.add('active');
    });
};

// Select populator
const populateSelect = (elementId, items, displayField, selectedId = null) => {
    const select = document.getElementById(elementId);
    select.innerHTML = '<option value="" disabled selected>Seleccione una opción</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item[displayField];
        if (selectedId && item.id === selectedId) option.selected = true;
        select.appendChild(option);
    });
};

// Form Submissions (Create and Update)
const setupForms = () => {
    document.getElementById('form-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('cliente-id').value;
        const nombre = document.getElementById('cliente-nombre').value;
        const dni = document.getElementById('cliente-dni').value;
        const contacto = document.getElementById('cliente-contacto').value;
        
        const fileInput = document.getElementById('cliente-foto');
        let fotoData = null;
        if (fileInput && fileInput.files.length > 0) {
            try {
                fotoData = await fileToBase64(fileInput.files[0]);
            } catch (err) {
                console.error("Error reading file", err);
            }
        }

        if (idInput) {
            // Update
            const index = currentState.clientes.findIndex(c => c.id === idInput);
            if (index !== -1) {
                const updatedCliente = { ...currentState.clientes[index], nombre, dni, contacto };
                if (fotoData) updatedCliente.foto = fotoData;
                currentState.clientes[index] = updatedCliente;
                showAlert('Cliente actualizado con éxito');
            }
        } else {
            // Create
            if (!fotoData) {
                fotoData = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random&color=fff&size=150`;
            }
            currentState.clientes.push({ id: Storage.genId(), nombre, dni, contacto, foto: fotoData });
            showAlert('Cliente guardado con éxito');
        }
        
        Storage.set('clientes', currentState.clientes);
        document.getElementById('modal-cliente').classList.remove('active');
        renderClientes();
        updateDashboardStats();
    });

    document.getElementById('form-caso').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('caso-id').value;
        const titulo = document.getElementById('caso-titulo').value;
        const clienteId = document.getElementById('caso-cliente').value;
        const descripcion = document.getElementById('caso-descripcion').value;
        const estado = document.getElementById('caso-estado').value;

        if (idInput) {
            const index = currentState.casos.findIndex(c => c.id === idInput);
            if (index !== -1) {
                currentState.casos[index] = { ...currentState.casos[index], titulo, clienteId, descripcion, estado };
                showAlert('Caso actualizado con éxito');
            }
        } else {
            currentState.casos.push({
                id: Storage.genId(),
                titulo, clienteId, descripcion, estado,
                fechaCreacion: new Date().toISOString()
            });
            showAlert('Caso creado con éxito');
        }

        Storage.set('casos', currentState.casos);
        document.getElementById('modal-caso').classList.remove('active');
        renderCasos();
        updateDashboardStats();
    });

    document.getElementById('form-audiencia').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('audiencia-id').value;
        const casoId = document.getElementById('audiencia-caso').value;
        const fecha = document.getElementById('audiencia-fecha').value;
        const hora = document.getElementById('audiencia-hora').value;
        const lugar = document.getElementById('audiencia-lugar').value;
        const tipo = document.getElementById('audiencia-tipo').value;
        const estado = document.getElementById('audiencia-estado').value;

        if (idInput) {
            const index = currentState.audiencias.findIndex(a => a.id === idInput);
            if (index !== -1) {
                currentState.audiencias[index] = { ...currentState.audiencias[index], casoId, fecha, hora, lugar, tipo, estado };
                showAlert('Audiencia actualizada con éxito');
            }
        } else {
            currentState.audiencias.push({
                id: Storage.genId(),
                casoId, fecha, hora, lugar, tipo, estado
            });
            showAlert('Audiencia programada con éxito');
        }

        Storage.set('audiencias', currentState.audiencias);
        document.getElementById('modal-audiencia').classList.remove('active');
        renderAudiencias();
        updateDashboardStats();
        renderDashboardAudiencias();
    });

    document.getElementById('form-documento').addEventListener('submit', (e) => {
        e.preventDefault();
        const idInput = document.getElementById('documento-id').value;
        const casoId = document.getElementById('documento-caso').value;
        const nombre = document.getElementById('documento-nombre').value;
        const fileInput = document.getElementById('documento-archivo');

        if (idInput) {
            const index = currentState.documentos.findIndex(d => d.id === idInput);
            if (index !== -1) {
                const updatedDoc = { ...currentState.documentos[index], casoId, nombre };
                // Only update filename if a new file was selected
                if (fileInput.files.length > 0) {
                    updatedDoc.archivoNombre = fileInput.files[0].name;
                }
                currentState.documentos[index] = updatedDoc;
                showAlert('Documento actualizado con éxito');
            }
        } else {
            const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "documento_simulado.pdf";
            currentState.documentos.push({
                id: Storage.genId(),
                casoId, nombre, archivoNombre: fileName,
                fechaSubida: new Date().toISOString()
            });
            showAlert('Documento subido con éxito');
        }

        Storage.set('documentos', currentState.documentos);
        document.getElementById('modal-documento').classList.remove('active');
        renderDocumentos();
    });
};

// Render Functions
const renderClientes = () => {
    const list = document.getElementById('clientes-list');
    list.innerHTML = '';
    
    // Check if clients list is empty
    if (currentState.clientes.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay clientes</td></tr>`;
        return;
    }
    
    currentState.clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        const fotoUrl = cliente.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(cliente.nombre)}&background=random&color=fff&size=150`;
        
        tr.innerHTML = `
            <td>
                <img src="${fotoUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-border);">
            </td>
            <td><strong>${cliente.nombre}</strong></td>
            <td>${cliente.dni}</td>
            <td>${cliente.contacto}</td>
            <td>
                <div class="action-links">
                    <button class="action-btn" onclick="editarCliente('${cliente.id}')"><i class="ph ph-pencil-simple"></i> Editar</button>
                    <button class="action-btn action-btn--danger" style="color:var(--color-error)" onclick="eliminarCliente('${cliente.id}')"><i class="ph ph-trash"></i> Eliminar</button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
};

const renderCasos = () => {
    const list = document.getElementById('casos-list');
    list.innerHTML = '';
    
    if (currentState.casos.length === 0) {
        list.innerHTML = `<tr><td colspan="4" style="text-align: center;">No hay casos</td></tr>`;
        return;
    }

    currentState.casos.forEach(caso => {
        const cliente = currentState.clientes.find(c => c.id === caso.clienteId);
        const clienteName = cliente ? cliente.nombre : 'Desconocido';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${caso.titulo}</strong></td>
            <td>${clienteName}</td>
            <td>${getStatusBadge(caso.estado)}</td>
            <td>
                <div class="action-links">
                    <button class="action-btn" onclick="verDetalleCaso('${caso.id}')"><i class="ph ph-eye"></i> Detalle</button>
                    <button class="action-btn" onclick="editarCaso('${caso.id}')"><i class="ph ph-pencil-simple"></i> Editar</button>
                    <button class="action-btn action-btn--danger" style="color:var(--color-error)" onclick="eliminarCaso('${caso.id}')"><i class="ph ph-trash"></i> Eliminar</button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
};

const renderAudiencias = () => {
    const list = document.getElementById('audiencias-list');
    list.innerHTML = '';
    
    if (currentState.audiencias.length === 0) {
        list.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay audiencias</td></tr>`;
        return;
    }

    const sorted = [...currentState.audiencias].sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));

    sorted.forEach(aud => {
        const caso = currentState.casos.find(c => c.id === aud.casoId);
        const casoTitulo = caso ? caso.titulo : 'Desconocido';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aud.fecha}</strong> <span style="color:var(--color-text-muted)">${aud.hora}</span></td>
            <td>${casoTitulo}</td>
            <td>${aud.lugar}</td>
            <td>${aud.tipo}</td>
            <td>${getStatusBadge(aud.estado)}</td>
            <td>
                 <div class="action-links">
                    <button class="action-btn" onclick="editarAudiencia('${aud.id}')"><i class="ph ph-pencil-simple"></i> Editar</button>
                    <button class="action-btn action-btn--danger" style="color:var(--color-error)" onclick="eliminarAudiencia('${aud.id}')"><i class="ph ph-trash"></i> Eliminar</button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
};

const renderDocumentos = () => {
    const list = document.getElementById('documentos-list');
    list.innerHTML = '';
    
    if (currentState.documentos.length === 0) {
        list.innerHTML = `<tr><td colspan="4" style="text-align: center;">No hay documentos</td></tr>`;
        return;
    }

    currentState.documentos.forEach(doc => {
        const caso = currentState.casos.find(c => c.id === doc.casoId);
        const casoTitulo = caso ? caso.titulo : 'Desconocido';
        const dateStr = new Date(doc.fechaSubida).toLocaleDateString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${doc.nombre}</strong><br><small style="color:var(--color-text-muted)">${doc.archivoNombre}</small></td>
            <td>${casoTitulo}</td>
            <td>${dateStr}</td>
            <td>
                <div class="action-links">
                    <button class="action-btn" onclick="simularDescarga('${doc.archivoNombre}')"><i class="ph ph-download-simple"></i> Descargar</button>
                    <button class="action-btn" onclick="editarDocumento('${doc.id}')"><i class="ph ph-pencil-simple"></i> Editar</button>
                    <button class="action-btn action-btn--danger" style="color:var(--color-error)" onclick="eliminarDocumento('${doc.id}')"><i class="ph ph-trash"></i> Eliminar</button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
};

const renderDashboardAudiencias = () => {
    const list = document.getElementById('dashboard-audiencias-list');
    list.innerHTML = '';
    const pending = currentState.audiencias
        .filter(a => a.estado === 'Pendiente')
        .sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`))
        .slice(0, 5); // top 5

    if (pending.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted)">No hay audiencias pendientes próximas</td></tr>';
        return;
    }

    pending.forEach(aud => {
        const caso = currentState.casos.find(c => c.id === aud.casoId);
        const casoTitulo = caso ? caso.titulo : 'Desconocido';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aud.fecha}</strong></td>
            <td>${aud.hora}</td>
            <td>${casoTitulo}</td>
            <td>${aud.tipo}</td>
        `;
        list.appendChild(tr);
    });
};

const updateDashboardStats = () => {
    document.getElementById('stat-clientes').textContent = currentState.clientes.length;
    document.getElementById('stat-casos').textContent = currentState.casos.filter(c => c.estado !== 'Cerrado').length;
    document.getElementById('stat-audiencias').textContent = currentState.audiencias.filter(a => a.estado === 'Pendiente').length;
};

// Global Actions (exposed to window for onclick)
window.verDetalleCaso = (casoId) => {
    const caso = currentState.casos.find(c => c.id === casoId);
    if (!caso) return;
    
    const cliente = currentState.clientes.find(c => c.id === caso.clienteId);
    const audienciasCaso = currentState.audiencias.filter(a => a.casoId === casoId);
    const documentosCaso = currentState.documentos.filter(d => d.casoId === casoId);

    const content = document.getElementById('detalle-caso-content');
    
    let html = `
        <div class="detalle-caso-info">
            <p><strong>Título:</strong> ${caso.titulo}</p>
            <p><strong>Cliente:</strong> ${cliente ? cliente.nombre : 'N/A'}</p>
            <p><strong>Estado:</strong> ${getStatusBadge(caso.estado)}</p>
            <p><strong>Descripción:</strong> ${caso.descripcion || 'Sin descripción'}</p>
        </div>
        
        <h4>Audiencias Asociadas (${audienciasCaso.length})</h4>
        <div class="table-container" style="margin-bottom: 20px;">
            <table class="table">
                <thead><tr><th>Fecha</th><th>Lugar</th><th>Estado</th></tr></thead>
                <tbody>
                    ${audienciasCaso.map(a => `<tr><td>${a.fecha} ${a.hora}</td><td>${a.lugar}</td><td>${getStatusBadge(a.estado)}</td></tr>`).join('')}
                    ${audienciasCaso.length === 0 ? '<tr><td colspan="3">No hay audiencias registradas</td></tr>' : ''}
                </tbody>
            </table>
        </div>

        <h4>Documentos Asociados (${documentosCaso.length})</h4>
        <div class="table-container">
            <table class="table">
                <thead><tr><th>Nombre</th><th>Fecha Subida</th></tr></thead>
                <tbody>
                    ${documentosCaso.map(d => `<tr><td>${d.nombre}</td><td>${new Date(d.fechaSubida).toLocaleDateString()}</td></tr>`).join('')}
                    ${documentosCaso.length === 0 ? '<tr><td colspan="2">No hay documentos registrados</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = html;
    document.getElementById('modal-detalle-caso').classList.add('active');
};

// Edit Actions
window.editarCliente = (id) => {
    const cliente = currentState.clientes.find(c => c.id === id);
    if (!cliente) return;

    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-nombre').value = cliente.nombre;
    document.getElementById('cliente-dni').value = cliente.dni;
    document.getElementById('cliente-contacto').value = cliente.contacto;
    if (document.getElementById('cliente-foto')) {
        document.getElementById('cliente-foto').value = ''; // Reset file input
    }
    
    document.getElementById('modal-cliente-title').textContent = 'Editar Cliente';
    document.getElementById('modal-cliente').classList.add('active');
};

window.editarCaso = (id) => {
    const caso = currentState.casos.find(c => c.id === id);
    if (!caso) return;

    document.getElementById('caso-id').value = caso.id;
    document.getElementById('caso-titulo').value = caso.titulo;
    populateSelect('caso-cliente', currentState.clientes, 'nombre', caso.clienteId);
    document.getElementById('caso-descripcion').value = caso.descripcion;
    document.getElementById('caso-estado').value = caso.estado;
    
    document.getElementById('modal-caso-title').textContent = 'Editar Caso';
    document.getElementById('modal-caso').classList.add('active');
};

window.editarAudiencia = (id) => {
    const aud = currentState.audiencias.find(a => a.id === id);
    if (!aud) return;

    document.getElementById('audiencia-id').value = aud.id;
    populateSelect('audiencia-caso', currentState.casos, 'titulo', aud.casoId);
    document.getElementById('audiencia-fecha').value = aud.fecha;
    document.getElementById('audiencia-hora').value = aud.hora;
    document.getElementById('audiencia-lugar').value = aud.lugar;
    document.getElementById('audiencia-tipo').value = aud.tipo;
    document.getElementById('audiencia-estado').value = aud.estado;
    
    document.getElementById('modal-audiencia-title').textContent = 'Editar Audiencia';
    document.getElementById('modal-audiencia').classList.add('active');
};

window.editarDocumento = (id) => {
    const doc = currentState.documentos.find(d => d.id === id);
    if (!doc) return;

    document.getElementById('documento-id').value = doc.id;
    populateSelect('documento-caso', currentState.casos, 'titulo', doc.casoId);
    document.getElementById('documento-nombre').value = doc.nombre;
    // Cannot set value of file input, user can re-upload if needed
    document.getElementById('documento-archivo').required = false; // Make it optional for edits
    
    document.getElementById('modal-documento-title').textContent = 'Editar Documento';
    document.getElementById('modal-documento').classList.add('active');
};

// Delete Actions
window.eliminarCliente = (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esto podría dejar casos sin cliente asociado.')) return;
    currentState.clientes = currentState.clientes.filter(c => c.id !== id);
    Storage.set('clientes', currentState.clientes);
    showAlert('Cliente eliminado', 'warning');
    renderClientes();
    updateDashboardStats();
};

window.eliminarCaso = (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este caso?')) return;
    currentState.casos = currentState.casos.filter(c => c.id !== id);
    Storage.set('casos', currentState.casos);
    showAlert('Caso eliminado', 'warning');
    renderCasos();
    updateDashboardStats();
};

window.eliminarAudiencia = (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta audiencia?')) return;
    currentState.audiencias = currentState.audiencias.filter(a => a.id !== id);
    Storage.set('audiencias', currentState.audiencias);
    showAlert('Audiencia eliminada', 'warning');
    renderAudiencias();
    updateDashboardStats();
    renderDashboardAudiencias();
};

window.eliminarDocumento = (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    currentState.documentos = currentState.documentos.filter(d => d.id !== id);
    Storage.set('documentos', currentState.documentos);
    showAlert('Documento eliminado', 'warning');
    renderDocumentos();
};

window.simularDescarga = (fileName) => {
    showAlert(`Simulando descarga de: ${fileName}`, 'success');
};

const renderView = (viewId) => {
    if (viewId === 'dashboard') {
        updateDashboardStats();
        renderDashboardAudiencias();
    } else if (viewId === 'clientes') {
        renderClientes();
    } else if (viewId === 'casos') {
        renderCasos();
    } else if (viewId === 'audiencias') {
        renderAudiencias();
    } else if (viewId === 'documentos') {
        renderDocumentos();
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    loadData();
    setupNavigation();
    setupModals();
    setupForms();
    
    // Initial Render
    renderView('dashboard');
});
