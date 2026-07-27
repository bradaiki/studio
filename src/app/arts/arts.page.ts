import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ArtsService, Art } from '../services/arts.service';
import { DataSourceService, DataSource } from '../services/data-source.service';
import { fetchAuthSession } from 'aws-amplify/auth';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonButtons,
  IonBackButton,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { search, leafOutline, shieldOutline, constructOutline, checkmarkCircle, add, create, alertCircle, cloud, phonePortrait } from 'ionicons/icons';

@Component({
  selector: 'app-arts',
  templateUrl: 'arts.page.html',
  styleUrls: ['arts.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonButtons,
    IonBackButton,
    TranslateModule
  ],
})
export class ArtsPage implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = 'my-arts';
  
  arts: Art[] = [];
  filteredArts: Art[] = [];
  displayedArts: Art[] = [];
  
  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 12;
  private scrollStates = new Map<string, { page: number; displayed: Art[] }>();
  private currentFilterKey = '';
  private hasLoadedInitially = false;
  
  isAuthenticated = false;

  constructor(
    private router: Router,
    private artsService: ArtsService,
    public dataSourceService: DataSourceService,
    private toastController: ToastController
  ) {
    addIcons({ search, leafOutline, shieldOutline, constructOutline, checkmarkCircle, add, create, alertCircle, cloud, phonePortrait });
  }

  ngOnInit() {
    this.checkAuthentication();
    this.loadArts(true); // Initial load from database
    
    // Subscribe to data source changes and reload arts
    this.dataSourceService.dataSource$.subscribe(async (source) => {
      console.log('[Arts Page] Data source changed to:', source);
      // Reload arts from the new data source
      this.hasLoadedInitially = false; // Reset flag to force reload
      await this.loadArts(true);
    });
  }

  async ionViewWillEnter() {
    // Use the already-updated local state from the service
    // Only refresh from database on initial load
    await this.loadArts(false);
  }

  private async loadArts(refreshFromDatabase: boolean = false) {
    // Only refresh from database on initial load or when explicitly requested
    if (refreshFromDatabase && !this.hasLoadedInitially) {
      await this.artsService.refreshArtsFromAPI();
      this.hasLoadedInitially = true;
    }
    
    // Use async method to get visibility-filtered arts from local state
    // The local state is already up-to-date from toggleUserPracticing()
    this.arts = await this.artsService.getAllArtsAsync();
    // Clear scroll states to force refresh
    this.scrollStates.clear();
    // Filter and display
    await this.filterArts();
  }

  async onSearchChange(event: any) {
    this.searchTerm = event.detail.value.toLowerCase();
    await this.filterArts();
  }

  async onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    await this.filterArts();
  }

  async filterArts() {
    let filtered = [...this.arts];

    // Apply search filter
    if (this.searchTerm) {
      filtered = await this.artsService.searchArtsAsync(this.searchTerm);
    }

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = await this.artsService.getArtsByCategoryAsync(this.selectedCategory);
      
      // If we have both search and category, combine them
      if (this.searchTerm) {
        const searchResults = await this.artsService.searchArtsAsync(this.searchTerm);
        const categoryResults = await this.artsService.getArtsByCategoryAsync(this.selectedCategory);
        filtered = searchResults.filter(art => 
          categoryResults.some(catArt => catArt.id === art.id)
        );
      }
    }

    this.filteredArts = filtered;
    
    // Create unique key for this filter combination
    const filterKey = `${this.selectedCategory}:${this.searchTerm}`;
    
    // Always reset state when filter changes or when we have new data
    const filterChanged = filterKey !== this.currentFilterKey;
    this.currentFilterKey = filterKey;
    
    // Reset or create state for this filter
    const state = { page: 0, displayed: [] };
    this.scrollStates.set(filterKey, state);
    
    // Load initial items
    this.loadInitialArts(state);
    this.displayedArts = state.displayed;
  }

  private loadInitialArts(state: { page: number; displayed: Art[] }) {
    state.page = 0;
    state.displayed = [];
    this.loadMoreArtsForState(state);
  }

  private loadMoreArtsForState(state: { page: number; displayed: Art[] }) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newArts = this.filteredArts.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newArts];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMoreArtsForState(state);
        this.displayedArts = state.displayed;
      }
      
      event.target.complete();
      
      // Disable infinite scroll when all items are loaded
      if (this.displayedArts.length >= this.filteredArts.length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  // Event handlers for art cards
  onArtClick(art: Art) {
    console.log('Art clicked:', art.name);
    this.router.navigate(['/art', art.id]);
  }

  getArtIcon(art: Art): string {
    switch (art.category) {
      case 'martial-arts': return 'shield-outline';
      case 'wellness': return 'leaf-outline';
      case 'crafts': return 'construct-outline';
      default: return 'school-outline';
    }
  }

  getArtColor(art: Art): string {
    switch (art.category) {
      case 'martial-arts': return 'primary';
      case 'wellness': return 'success';
      case 'crafts': return 'warning';
      default: return 'medium';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  }

  getPhysicalDemandsColor(demands: string): string {
    switch (demands) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  }

  trackByArtId(_index: number, art: Art): string {
    return art.id;
  }

  onCreateNewArt() {
    this.router.navigate(['/art-form', 'new']);
  }

  private async checkAuthentication() {
    try {
      const session = await fetchAuthSession();
      this.isAuthenticated = !!session.tokens;
    } catch {
      this.isAuthenticated = false;
    }
  }

  async onToggleDataSource() {
    const newSource = this.dataSourceService.toggleDataSource();
    const sourceName = newSource === 'mock' ? 'Local Mock Data' : 'Database';
    
    const toast = await this.toastController.create({
      message: `Switched to ${sourceName}`,
      duration: 2000,
      position: 'bottom',
      color: newSource === 'mock' ? 'warning' : 'tertiary',
      icon: newSource === 'mock' ? 'phone-portrait' : 'cloud'
    });
    await toast.present();
    
    // Reload arts with new data source
    await this.loadArts(true);
  }
}