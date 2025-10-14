// Configuración del mapa
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

// Ajustar el tamaño del canvas al contenedor
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    dibujarMapa();
}

// Coordenadas de los límites del mapa (Valparaíso y alrededores)
const mapBounds = {
    latMin: -33.08,
    latMax: -33.00,
    lngMin: -71.65,
    lngMax: -71.52
};

// Función para convertir coordenadas geográficas a coordenadas del canvas
function latLngToPixel(lat, lng) {
    const x = ((lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * canvas.width;
    const y = ((mapBounds.latMax - lat) / (mapBounds.latMax - mapBounds.latMin)) * canvas.height;
    return { x, y };
}

// Iconos para cada tipo de establecimiento
const iconos = {
    universidad: '🏛️',
    liceo: '🎓',
    escuela: '📚',
    jardin: '🌱'
};

// Variable para almacenar el establecimiento seleccionado
let establecimientoSeleccionado = null;

// Función para dibujar el mapa
function dibujarMapa() {
    // Limpiar el canvas
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar líneas de cuadrícula
    ctx.strokeStyle = '#b3d9ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        const x = (canvas.width / 10) * i;
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Dibujar título del mapa
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Mapa de Valparaíso - Quinta Región', 20, 30);
    
    // Dibujar los marcadores de establecimientos
    establecimientos.forEach(est => {
        const pos = latLngToPixel(est.lat, est.lng);
        
        // Destacar si está seleccionado
        if (establecimientoSeleccionado === est) {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dibujar círculo de fondo
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dibujar icono
        ctx.font = '24px Arial';
        const icono = iconos[est.tipo];
        const medida = ctx.measureText(icono);
        ctx.fillText(icono, pos.x - 12, pos.y + 8);
    });
    
    // Dibujar leyenda de coordenadas
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.fillText(`${mapBounds.latMax}°, ${mapBounds.lngMin}°`, 10, canvas.height - 10);
    ctx.fillText(`${mapBounds.latMin}°, ${mapBounds.lngMax}°`, canvas.width - 120, canvas.height - 10);
}

// Función para encontrar el establecimiento en las coordenadas del clic
function encontrarEstablecimiento(clickX, clickY) {
    for (let est of establecimientos) {
        const pos = latLngToPixel(est.lat, est.lng);
        const distancia = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
        if (distancia < 20) {
            return est;
        }
    }
    return null;
}

// Función para mostrar información del establecimiento
function mostrarInfo(establecimiento) {
    const infoDiv = document.getElementById('establishment-info');
    
    const tipoTexto = {
        universidad: 'Universidad / Instituto',
        liceo: 'Liceo',
        escuela: 'Escuela',
        jardin: 'Jardín Infantil'
    };
    
    infoDiv.innerHTML = `
        <div class="detail">
            <strong>Nombre:</strong>
            ${establecimiento.nombre}
        </div>
        <div class="detail">
            <strong>Tipo:</strong>
            ${tipoTexto[establecimiento.tipo]} ${iconos[establecimiento.tipo]}
        </div>
        <div class="detail">
            <strong>Dirección:</strong>
            ${establecimiento.direccion}
        </div>
        <div class="detail">
            <strong>Descripción:</strong>
            ${establecimiento.descripcion}
        </div>
        <div class="detail">
            <strong>Coordenadas:</strong>
            ${establecimiento.lat.toFixed(4)}°, ${establecimiento.lng.toFixed(4)}°
        </div>
    `;
}

// Evento de clic en el canvas
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const establecimiento = encontrarEstablecimiento(clickX, clickY);
    if (establecimiento) {
        establecimientoSeleccionado = establecimiento;
        mostrarInfo(establecimiento);
        dibujarMapa();
    }
});

// Evento hover para cambiar el cursor
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const establecimiento = encontrarEstablecimiento(mouseX, mouseY);
    canvas.style.cursor = establecimiento ? 'pointer' : 'crosshair';
});

// Crear estadísticas
function crearEstadisticas() {
    const contadores = {
        universidad: establecimientos.filter(e => e.tipo === 'universidad').length,
        liceo: establecimientos.filter(e => e.tipo === 'liceo').length,
        escuela: establecimientos.filter(e => e.tipo === 'escuela').length,
        jardin: establecimientos.filter(e => e.tipo === 'jardin').length
    };
    
    const statsDiv = document.getElementById('statistics');
    statsDiv.innerHTML = `
        <div class="stat-item">
            <span class="icon">🏛️</span>
            <span>Universidades</span>
            <span class="count">${contadores.universidad}</span>
        </div>
        <div class="stat-item">
            <span class="icon">🎓</span>
            <span>Liceos</span>
            <span class="count">${contadores.liceo}</span>
        </div>
        <div class="stat-item">
            <span class="icon">📚</span>
            <span>Escuelas</span>
            <span class="count">${contadores.escuela}</span>
        </div>
        <div class="stat-item">
            <span class="icon">🌱</span>
            <span>Jardines</span>
            <span class="count">${contadores.jardin}</span>
        </div>
        <div class="stat-item" style="background: #667eea; color: white;">
            <span>TOTAL</span>
            <span class="count" style="color: white;">${establecimientos.length}</span>
        </div>
    `;
}

// Crear lista de establecimientos
function crearListaEstablecimientos() {
    const listDiv = document.getElementById('establishment-list');
    
    const tipoTexto = {
        universidad: 'Universidad',
        liceo: 'Liceo',
        escuela: 'Escuela',
        jardin: 'Jardín'
    };
    
    let html = '';
    establecimientos.forEach(est => {
        html += `
            <div class="list-item" onclick="seleccionarEstablecimiento('${est.nombre}')">
                <div class="name">${iconos[est.tipo]} ${est.nombre}</div>
                <div class="type">${tipoTexto[est.tipo]}</div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
}

// Función global para seleccionar establecimiento desde la lista
window.seleccionarEstablecimiento = function(nombre) {
    const est = establecimientos.find(e => e.nombre === nombre);
    if (est) {
        establecimientoSeleccionado = est;
        mostrarInfo(est);
        dibujarMapa();
    }
};

// Ajustar tamaño del canvas al cambiar el tamaño de la ventana
window.addEventListener('resize', resizeCanvas);

// Inicializar la aplicación
resizeCanvas();
crearEstadisticas();
crearListaEstablecimientos();

console.log(`Mapa cargado con ${establecimientos.length} establecimientos educacionales`);
console.log('Haz clic en los marcadores del mapa para ver información detallada');
