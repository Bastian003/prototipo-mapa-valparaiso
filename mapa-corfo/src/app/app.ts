import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.html', 
  styleUrls: ['./app.css'],  
  standalone: false
})
export class AppComponent implements OnInit {
  map!: L.Map;
  markers: L.Marker[] = [];
  establecimientos: any[] = [];
  filtrados: any[] = [];
  espeDict: any = {};
  
  isSidebarCollapsed = false;
  selectedEst: any = null;
  
  filterNombre: string = '';
  filterComuna: string = '';
  filterDeprov: string = '';
  filterNodo: string = '';

  comunasUnicas: string[] = [];
  deprovUnicos: string[] = [];

  // configuracion de cada nodo con sus codigos de especialidades y el pie_tp es con el RBD
  NODOS_MAP: any = {
    "hoteleria": ["61001", "61002", "61003", "63009", "63010", "63011"],
    "energia": ["53014", "53015", "58034", "58033", "58035", "51006"],
    "administracion": ["41001", "41002", "41003", "41004", "41005", "81004", "81005"],
    "agropecuaria": ["72006", "72007", "81003"],
    "construccion": ["51001", "51002", "51003", "51004", "51005", "51009", "52009", "55022", "55023", "71005", "57030"],
    "industria": ["52008", "52013", "54018", "54019", "54020", "56025", "56026", "56027", "52010"],
    "pie_tp": ["14720", "1958", "1880", "1884", "1894", "1490", "1489", "1464", "14470", "1895"]
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnInit() {
    this.initMap();
    this.cargarDatos();
  }

  initMap() {
    this.map = L.map('map', { zoomControl: false }).setView([-33.0472, -71.6127], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    setTimeout(() => this.map.invalidateSize(), 500);
  }

  cargarDatos() {
    forkJoin([
      this.http.get<any[]>('assets/data.json'),
      this.http.get<any>('assets/espe_dictionary.json')
    ]).subscribe({
      next: ([data, espeDict]) => {
        this.zone.run(() => {
          this.establecimientos = data;
          this.filtrados = [...data];
          this.espeDict = espeDict;

          // Poblar listas de filtros
          this.comunasUnicas = [...new Set(data.map(e => e.Comuna))].sort() as string[];
          this.deprovUnicos = [...new Set(data.map(e => e['Departamento Provincial de Educación']))].sort() as string[];

          this.dibujarMarcadores(this.filtrados);
          this.cdr.detectChanges();
        });
      }
    });
  }

  dibujarMarcadores(datos: any[]) {
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    datos.forEach(est => {
      const lat = parseFloat(String(est.LATITUD).replace(',', '.'));
      const lng = parseFloat(String(est.LONGITUD).replace(',', '.'));
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]).addTo(this.map);
        marker.on('click', () => this.zone.run(() => this.mostrarDetalle(est)));
        this.markers.push(marker);
      }
    });
  }

  actualizarFiltros() {
    const busq = this.filterNombre.toLowerCase();
    this.filtrados = this.establecimientos.filter(est => {
      const mNombre = est.NOM_RBD.toLowerCase().includes(busq) || String(est.RBD).includes(busq);
      const mComuna = !this.filterComuna || est.Comuna === this.filterComuna;
      const mDeprov = !this.filterDeprov || est['Departamento Provincial de Educación'] === this.filterDeprov;
      
      let mNodo = true;
      if (this.filterNodo) {
        mNodo = false;
        const cods = this.NODOS_MAP[this.filterNodo];
        if (this.filterNodo === 'pie_tp') {
          if (cods.includes(String(est.RBD))) mNodo = true;
        } else {
          for (let i = 1; i <= 11; i++) {
            const val = String(est[`ESPE_${String(i).padStart(2, '0')}`]);
            if (cods.includes(val)) { mNodo = true; break; }
          }
        }
      }
      return mNombre && mComuna && mDeprov && mNodo;
    });
    this.dibujarMarcadores(this.filtrados);
  }

  mostrarDetalle(est: any) {
    this.selectedEst = est;
    const lat = parseFloat(String(est.LATITUD).replace(',', '.'));
    const lng = parseFloat(String(est.LONGITUD).replace(',', '.'));
    this.map.panTo([lat, lng]); 
    this.cdr.detectChanges();
  }

  getEspecialidades(est: any): string[] {
    if (!est || !this.espeDict) return [];
    const lista: string[] = [];
    for (let i = 1; i <= 11; i++) {
      const cod = String(est[`ESPE_${String(i).padStart(2, '0')}`]);
      if (cod && cod !== "0") {
        lista.push(this.espeDict[cod] || cod);
      }
    }
    return lista;
  }

  getNodos(est: any): string[] {
    if (!est) return [];
    const nombresNodos: string[] = [];
    const mappingNombres: any = {
      "hoteleria": "Hotelería, Gastronomía y Turismo",
      "energia": "Energía",
      "administracion": "Administración",
      "agropecuaria": "Agropecuaria",
      "construccion": "Construcción",
      "industria": "Industria 4.0",
      "pie_tp": "PIE TP"
    };

    Object.keys(this.NODOS_MAP).forEach(key => {
      const cods = this.NODOS_MAP[key];
      if (key === 'pie_tp') {
        if (cods.includes(String(est.RBD))) nombresNodos.push(mappingNombres[key]);
      } else {
        for (let i = 1; i <= 11; i++) {
          const val = String(est[`ESPE_${String(i).padStart(2, '0')}`]);
          if (cods.includes(val)) {
            nombresNodos.push(mappingNombres[key]);
            break;
          }
        }
      }
    });
    return nombresNodos;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    let count = 0;
    const interval = setInterval(() => {
        this.map.invalidateSize();
        count++;
        if (count > 30) clearInterval(interval);
    }, 10);
  }
}