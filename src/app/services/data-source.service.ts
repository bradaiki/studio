import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type DataSource = 'mock' | 'database';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  private readonly STORAGE_KEY = 'app_data_source';
  private dataSourceSubject = new BehaviorSubject<DataSource>('database');
  public dataSource$ = this.dataSourceSubject.asObservable();

  constructor() {
    // Load saved preference from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY) as DataSource;
    if (saved === 'mock' || saved === 'database') {
      this.dataSourceSubject.next(saved);
    }
  }

  getCurrentSource(): DataSource {
    return this.dataSourceSubject.value;
  }

  setDataSource(source: DataSource): void {
    console.log('[DataSourceService] Setting data source to:', source);
    console.log('[DataSourceService] Previous value:', this.dataSourceSubject.value);
    this.dataSourceSubject.next(source);
    localStorage.setItem(this.STORAGE_KEY, source);
    console.log('[DataSourceService] Data source switched to:', source);
    console.log('[DataSourceService] Saved to localStorage:', localStorage.getItem(this.STORAGE_KEY));
  }

  toggleDataSource(): DataSource {
    const newSource: DataSource = this.dataSourceSubject.value === 'mock' ? 'database' : 'mock';
    this.setDataSource(newSource);
    return newSource;
  }

  isUsingMockData(): boolean {
    return this.dataSourceSubject.value === 'mock';
  }

  isUsingDatabase(): boolean {
    return this.dataSourceSubject.value === 'database';
  }
}
