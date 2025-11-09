document.addEventListener('DOMContentLoaded', function () {
    const centroVRegion = [-33.0472, -71.6127];
    const zoomInicial = 9;

    const map = L.map('map', { zoomControl: false }).setView(centroVRegion, zoomInicial);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    const infoPanel = document.getElementById('info-panel');
    const closeBtn = document.getElementById('close-btn');
    const infoNombre = document.getElementById('info-nombre');
    const infoDireccion = document.getElementById('info-direccion');
    const infoDetails = document.getElementById('info-details');
    const filtroComuna = document.getElementById('filtro-comuna');
    const busquedaNombre = document.getElementById('busqueda-nombre');

    let establecimientos = [];
    let ensDictionary = {}; // Para guardar el diccionario de enseñanza
    let espeDictionary = {}; // Para guardar el diccionario de especialidad
    let markers = [];

    // Cargar todos los datos necesarios (establecimientos y diccionarios) en paralelo
    Promise.all([
        fetch('data.json').then(response => response.json()),
        fetch('ens_dictionary.json').then(response => response.json()),
        fetch('espe_dictionary.json').then(response => response.json())
    ]).then(([data, ensDict, espeDict]) => {
        establecimientos = data;
        ensDictionary = ensDict;
        espeDictionary = espeDict;

        const comunasUnicas = [...new Set(establecimientos.map(e => e.Comuna))].sort();
        comunasUnicas.forEach(comuna => {
            const option = document.createElement('option');
            option.value = comuna;
            option.textContent = comuna;
            filtroComuna.appendChild(option);
        });
        dibujarMarcadores(establecimientos);
    }).catch(error => console.error("Error al cargar los archivos JSON:", error));

    function dibujarMarcadores(datos) {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        datos.forEach(establecimiento => {
            const lat = parseFloat(establecimiento.LATITUD.replace(',', '.'));
            const lng = parseFloat(establecimiento.LONGITUD.replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.marker([lat, lng]).addTo(map);

                marker.on('click', () => {
                    infoNombre.textContent = establecimiento.NOM_RBD;
                    infoDireccion.textContent = `Dirección: ${establecimiento.Dirección_Establecimiento}`;
                    infoDetails.innerHTML = '';

                    function agregarDetalle(etiqueta, valor) {
                        const p = document.createElement('p');
                        p.innerHTML = `${etiqueta}: <span>${valor || 'No disponible'}</span>`;
                        infoDetails.appendChild(p);
                    }

                    agregarDetalle('RBD', establecimiento.RBD);
                    agregarDetalle('Provincia', establecimiento.Provincia);
                    agregarDetalle('Comuna', establecimiento.Comuna);
                    agregarDetalle('Departamento Provincial', establecimiento['Departamento Provincial de Educación']);
                    agregarDetalle('Matrícula Total', establecimiento.MAT_TOTAL);

                    // --- Lógica para TRADUCIR y mostrar códigos ---

                    const ensDescriptions = [];
                    for (let i = 1; i <= 11; i++) {
                        const key = `ENS_${String(i).padStart(2, '0')}`;
                        const code = establecimiento[key];
                        if (code && code !== "0") {
                            // Traducir el código usando el diccionario
                            ensDescriptions.push(ensDictionary[code] || `Código ${code} no encontrado`);
                        }
                    }
                    if (ensDescriptions.length > 0) {
                        agregarDetalle('Tipos de Enseñanza', ensDescriptions.join('<br>'));
                    }

                    const espeDescriptions = [];
                    for (let i = 1; i <= 11; i++) {
                        const key = `ESPE_${String(i).padStart(2, '0')}`;
                        const code = establecimiento[key];
                        if (code && code !== "0") {
                            // Traducir el código usando el diccionario
                            espeDescriptions.push(espeDictionary[code] || `Código ${code} no encontrado`);
                        }
                    }
                    if (espeDescriptions.length > 0) {
                        // Usamos un ul para una lista más ordenada
                        const p = document.createElement('p');
                        p.innerHTML = `Especialidades: <ul style="margin: 0; padding-left: 20px;"><li>${espeDescriptions.join('</li><li>')}</li></ul>`;
                        infoDetails.appendChild(p);
                    }
                    
                    infoPanel.classList.remove('panel-oculto');
                });

                markers.push(marker);
            }
        });
    }

    function actualizarFiltro() {
        const nombre = busquedaNombre.value.toLowerCase();
        const comuna = filtroComuna.value;
        const filtrados = establecimientos.filter(e => {
            const coincideNombre = e.NOM_RBD.toLowerCase().includes(nombre);
            const coincideComuna = !comuna || e.Comuna === comuna;
            return coincideNombre && coincideComuna;
        });
        dibujarMarcadores(filtrados);
    }

    busquedaNombre.addEventListener('input', actualizarFiltro);
    filtroComuna.addEventListener('change', actualizarFiltro);

    closeBtn.addEventListener('click', () => {
        infoPanel.classList.add('panel-oculto');
    });
});