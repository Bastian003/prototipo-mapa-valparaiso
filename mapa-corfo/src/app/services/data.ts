import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  obtenerDatos(): Observable<any[]> {

    return forkJoin([
      this.http.get('assets/data.json'),
      this.http.get('assets/espe_dictionary.json'),
      this.http.get('assets/ens_dictionary.json')
    ]);
  }
}