import { Component, OnInit, signal, effect } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { StudiosService, Studio } from '../services/studios.service';
import { FavoritesService } from '../services/favorites.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonChip,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { location, call, people, star, add } from 'ionicons/icons';

@Component({
  selector: 'app-studios-list',
  templateUrl: './studios-list.page.html',
  styleUrls: ['./studios-list.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonButtons,
    IonBackButton,
  ],
})
export class StudiosListPage implements OnInit {
  // Convert to signals
  studios = signal<Studio[]>([]);
  filteredStudios = signal<Studio[]>([]);
  displayedStudios = signal<Studio[]>([]);

  // Keep as regular properties - used with [(ngModel)]
  searchTerm: string = '';
  selectedSegment: string = 'nearby';

  private pageSize = 10;
  private currentPage = 0;

  constructor(
    private router: Router,
    private studiosService: StudiosService,
    public favoritesService: FavoritesService,
  ) {
    addIcons({ location, call, people, star, add });
    effect(() => {
      if (this.favoritesService.enabled()) {
        this.selectedSegment = 'my-studios';
        this.filterBySegment();
      }
    });
  }

  ngOnInit() {
    this.studiosService.studios$.subscribe((studios) => {
      console.log(
        '[Studios List] Received studios from service:',
        studios.length,
      );
      this.studios.set(studios);
      this.filterBySegment();
    });
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.filterBySegment();
  }

  private filterBySegment() {
    let segmentStudios: Studio[] = [];

    switch (this.selectedSegment) {
      case 'my-studios':
        segmentStudios = this.studios().filter(
          (studio) =>
            studio.isMember || studio.isInstructor || studio.isStudioChief,
        );
        console.log(
          '[Studios List] My studios filtered:',
          segmentStudios.length,
          'from',
          this.studios().length,
        );
        break;
      case 'favorites':
        segmentStudios = this.studios().filter((studio) => studio.verified);
        console.log(
          '[Studios List] Favorites filtered:',
          segmentStudios.length,
        );
        break;
      case 'nearby':
        segmentStudios = this.studios();
        console.log(
          '[Studios List] Nearby showing all:',
          segmentStudios.length,
        );
        break;
      default:
        segmentStudios = this.studios();
    }

    this.filteredStudios.set(segmentStudios);
    this.loadInitialStudios();
  }

  private loadInitialStudios() {
    this.currentPage = 0;
    this.displayedStudios.set(this.filteredStudios().slice(0, this.pageSize));
    console.log(
      '[Studios List] Displaying initial studios:',
      this.displayedStudios().length,
    );
  }

  onSearch(event: any) {
    const query = event.target.value.toLowerCase();

    let segmentStudios: Studio[] = [];
    switch (this.selectedSegment) {
      case 'my-studios':
        segmentStudios = this.studios().filter(
          (studio) =>
            studio.isMember || studio.isInstructor || studio.isStudioChief,
        );
        break;
      case 'favorites':
        segmentStudios = this.studios().filter((studio) => studio.verified);
        break;
      case 'nearby':
        segmentStudios = this.studios();
        break;
      default:
        segmentStudios = this.studios();
    }

    this.filteredStudios.set(segmentStudios.filter(
      (studio) =>
        studio.name.toLowerCase().includes(query) ||
        studio.location.toLowerCase().includes(query),
    ));
    this.loadInitialStudios();
  }

  loadMore(event: any) {
    setTimeout(() => {
      const nextPage = this.currentPage + 1;
      const startIndex = nextPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const moreStudios = this.filteredStudios().slice(startIndex, endIndex);

      if (moreStudios.length > 0) {
        this.displayedStudios.update(current => [...current, ...moreStudios]);
        this.currentPage = nextPage;
      }

      event.target.complete();

      if (this.displayedStudios().length >= this.filteredStudios().length) {
        event.target.disabled = true;
      }
    }, 500);
  }

  viewStudio(studioId: string) {
    this.router.navigate(['/dash/studio', studioId]);
  }

  createStudio() {
    this.router.navigate(['/dash/studio-form']);
  }
}
