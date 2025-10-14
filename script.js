document.addEventListener('DOMContentLoaded', function () {
    const centroVRegion = [-33.0472, -71.6127];
    const zoomInicial = 9;

    const map = L.map('map', { zoomControl: false }).setView(centroVRegion, zoomInicial);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    // ICONOS PERSONALIZADOS
    const iconMunicipal = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const iconParticular = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const infoPanel = document.getElementById('info-panel');
    const closeBtn = document.getElementById('close-btn');
    const infoNombre = document.getElementById('info-nombre');
    const infoDireccion = document.getElementById('info-direccion');
    const infoDetails = document.getElementById('info-details');
    const filtroComuna = document.getElementById('filtro-comuna');
    const busquedaNombre = document.getElementById('busqueda-nombre');
    const filtroDependencia = document.getElementById('filtro-dependencia');

    let establecimientos = [];
    let markers = [];

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            establecimientos = data.establecimiento;
            // Opciones de comuna
            const comunasUnicas = [...new Set(establecimientos.map(e => e.comuna))].sort();
            comunasUnicas.forEach(comuna => {
                const option = document.createElement('option');
                option.value = comuna;
                option.textContent = comuna;
                filtroComuna.appendChild(option);
            });
            dibujarMarcadores(establecimientos);
        });

    function dibujarMarcadores(datos) {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        datos.forEach(establecimiento => {
            if (establecimiento.lat && establecimiento.lng) {
                // Elegir el icono según dependencia
                const tipoDep = establecimiento.dep[0] === 1 ? 'Municipal' : 'Particular Subvencionado';
                const icono = (tipoDep === 'Municipal') ? iconMunicipal : iconParticular;

                const marker = L.marker([establecimiento.lat, establecimiento.lng], { icon: icono }).addTo(map);

                marker.on('click', () => {
                    infoNombre.textContent = establecimiento.nombre;
                    infoDireccion.textContent = `Comuna: ${establecimiento.comuna}`;
                    infoDetails.innerHTML = '';
                    const rbdInfo = document.createElement('p');
                    rbdInfo.innerHTML = `RBD: <span>${establecimiento.rbd}</span>`;
                    infoDetails.appendChild(rbdInfo);

                    const dependenciaInfo = document.createElement('p');
                    dependenciaInfo.innerHTML = `Dependencia: <span>${tipoDep}</span>`;
                    infoDetails.appendChild(dependenciaInfo);

                    const catDesempeno = document.createElement('p');
                    catDesempeno.innerHTML = `Categoría Desempeño: <span>${establecimiento.tcdb}</span>`;
                    infoDetails.appendChild(catDesempeno);

                    infoPanel.classList.remove('panel-oculto');
                });

                markers.push(marker);
            }
        });
    }

    function actualizarFiltro() {
        const nombre = busquedaNombre.value.toLowerCase();
        const comuna = filtroComuna.value;
        const dependencia = filtroDependencia.value;

        const filtrados = establecimientos.filter(e => {
            const coincideNombre = e.nombre.toLowerCase().includes(nombre);
            const coincideComuna = !comuna || e.comuna === comuna;
            let coincideDep = true;
            if (dependencia === "municipal") {
                coincideDep = e.dep[0] === 1;
            } else if (dependencia === "particular") {
                coincideDep = e.dep[0] !== 1;
            }
            return coincideNombre && coincideComuna && coincideDep;
        });

        dibujarMarcadores(filtrados);
    }

    busquedaNombre.addEventListener('input', actualizarFiltro);
    filtroComuna.addEventListener('change', actualizarFiltro);
    filtroDependencia.addEventListener('change', actualizarFiltro);

    closeBtn.addEventListener('click', () => {
        infoPanel.classList.add('panel-oculto');
    });
});