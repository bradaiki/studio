import { Component, OnInit, signal } from '@angular/core';
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
  // Keep as regular properties - used with [(ngModel)]
  searchTerm: string = '';
  selectedCategory: string = 'my-arts';
  
  // Convert to signals
  arts = signal<Art[]>([]);
  filteredArts = signal<Art[]>([]);
  displayedArts = signal<Art[]>([]);
  isAuthenticated = signal(false);
  
  // Infinite scroll properties - separate state for each filter combination
  private pageSize = 12;
  private scrollStates = new Map<string, { page: number; displayed: Art[] }>();
  private currentFilterKey = '';
  private hasLoadedInitially = false;

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
    this.loadArts(true);
    
    this.dataSourceService.dataSource$.subscribe(async (source) => {
      console.log('[Arts Page] Data source changed to:', source);
      this.hasLoadedInitially = false;
      await this.loadArts(true);
    });
  }

  async ionViewWillEnter() {
    await this.loadArts(false);
  }

  private async loadArts(refreshFromDatabase: boolean = false) {
    if (refreshFromDatabase && !this.hasLoadedInitially) {
      await this.artsService.refreshArtsFromAPI();
      this.hasLoadedInitially = true;
    }
    
    this.arts.set(await this.artsService.getAllArtsAsync());
    this.scrollStates.clear();
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
    let filtered = [...this.arts()];

    if (this.searchTerm) {
      filtered = await this.artsService.searchArtsAsync(this.searchTerm);
    }

    if (this.selectedCategory !== 'all') {
      filtered = await this.artsService.getArtsByCategoryAsync(this.selectedCategory);
      
      if (this.searchTerm) {
        const searchResults = await this.artsService.searchArtsAsync(this.searchTerm);
        const categoryResults = await this.artsService.getArtsByCategoryAsync(this.selectedCategory);
        filtered = searchResults.filter(art => 
          categoryResults.some(catArt => catArt.id === art.id)
        );
      }
    }

    this.filteredArts.set(filtered);
    
    const filterKey = `${this.selectedCategory}:${this.searchTerm}`;
    
    this.currentFilterKey = filterKey;
    
    const state = { page: 0, displayed: [] as Art[] };
    this.scrollStates.set(filterKey, state);
    
    this.loadInitialArts(state);
    this.displayedArts.set(state.displayed);
  }

  private loadInitialArts(state: { page: number; displayed: Art[] }) {
    state.page = 0;
    state.displayed = [];
    this.loadMoreArtsForState(state);
  }

  private loadMoreArtsForState(state: { page: number; displayed: Art[] }) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newArts = this.filteredArts().slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newArts];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const state = this.scrollStates.get(this.currentFilterKey);
      if (state) {
        this.loadMoreArtsForState(state);
        this.displayedArts.set(state.displayed);
      }
      
      event.target.complete();
      
      if (this.displayedArts().length >= this.filteredArts().length) {
        event.target.disabled = true;
      }
    }, 500);
  }

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
      this.isAuthenticated.set(!!session.tokens);
    } catch {
      this.isAuthenticated.set(false);
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
    
    await this.loadArts(true);
  }
}
