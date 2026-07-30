import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location as AngularLocation } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ArtsService, Art } from '../services/arts.service';
import { ChatMessagesComponent } from '../components/chat-messages/chat-messages.component';
import { ChatMessage } from '../models/chat.models';
import { StudiosService, Studio } from '../services/studios.service';
import { OrganizationsService, Organization } from '../services/organizations.service';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonText,
  IonChip,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBack,
  leafOutline,
  shieldOutline,
  constructOutline,
  schoolOutline,
  fitnessOutline,
  heartOutline,
  bulbOutline,
  peopleOutline,
  businessOutline,
  homeOutline,
  checkmarkCircle,
  closeCircle,
  alertCircle,
  ellipse,
  chevronForward,
  addCircleOutline,
  createOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-art',
  templateUrl: './art.page.html',
  styleUrls: ['./art.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonText,
    IonChip,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonList,
    IonSegment,
    IonSegmentButton,
    ChatMessagesComponent
  ]
})
export class ArtPage implements OnInit {
  // State signals
  art = signal<Art | null>(null);
  selectedSegment = signal<string>('organizations');
  loading = signal(true);
  notFound = signal(false);
  artOrganizations = signal<Organization[]>([]);
  artStudios = signal<Studio[]>([]);

  // Computed signals
  canUserEdit = computed(() => {
    const art = this.art();
    return art ? this.artsService.canUserEditArt(art) : false;
  });

  artIcon = computed(() => {
    const art = this.art();
    if (!art) return 'school-outline';
    switch (art.category) {
      case 'martial-arts': return 'shield-outline';
      case 'wellness': return 'leaf-outline';
      case 'crafts': return 'construct-outline';
      default: return 'school-outline';
    }
  });

  artColor = computed(() => {
    const art = this.art();
    if (!art) return 'primary';
    switch (art.category) {
      case 'martial-arts': return 'primary';
      case 'wellness': return 'success';
      case 'crafts': return 'warning';
      default: return 'medium';
    }
  });

  difficultyColor = computed(() => {
    const art = this.art();
    if (!art) return 'medium';
    switch (art.difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  });

  physicalDemandsColor = computed(() => {
    const art = this.art();
    if (!art) return 'medium';
    switch (art.physicalDemands) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: AngularLocation,
    private artsService: ArtsService,
    private studiosService: StudiosService,
    private organizationsService: OrganizationsService,
    private toastController: ToastController
  ) {
    addIcons({ 
      arrowBack,
      leafOutline,
      shieldOutline,
      constructOutline,
      schoolOutline,
      fitnessOutline,
      heartOutline,
      bulbOutline,
      peopleOutline,
      businessOutline,
      homeOutline,
      checkmarkCircle,
      closeCircle,
      alertCircle,
      ellipse,
      chevronForward,
      addCircleOutline,
      createOutline
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const artId = params['id'];
      if (artId) {
        // Try to load immediately
        this.loadArt(artId);

        // Subscribe to arts$ in case data loads later (e.g., page refresh)
        this.artsService.arts$.subscribe(arts => {
          if (!this.art() && arts.length > 0) {
            this.loadArt(artId);
            // If still not found after data loaded, show not found
            if (!this.art()) {
              this.notFound.set(true);
              this.loading.set(false);
            }
          }
        });
      } else {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadArt(artId: string) {
    const loadedArt = this.artsService.getArtById(artId) || null;
    this.art.set(loadedArt);
    
    if (loadedArt) {
      // Load organizations for this art
      const orgIds = this.artsService.getArtOrganizations(artId);
      this.artOrganizations.set(
        orgIds.map(id => this.organizationsService.getOrganizationById(id))
          .filter(org => org !== undefined) as Organization[]
      );
      
      // Load studios for this art
      const studioIds = this.artsService.getArtStudios(artId);
      this.artStudios.set(
        studioIds.map(id => this.studiosService.getStudioById(id))
          .filter(studio => studio !== undefined) as Studio[]
      );
      
      this.notFound.set(false);
      this.loading.set(false);
    }
    // Don't set notFound/loading false here — wait for data to arrive via subscription
  }

  onBack() {
    this.location.back();
  }

  onSegmentChange(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  onOrganizationClick(org: Organization) {
    this.router.navigate(['/org', org.id]);
  }

  onStudioClick(studio: Studio) {
    this.router.navigate(['/studio', studio.id]);
  }

  async onTogglePracticing() {
    const currentArt = this.art();
    if (currentArt) {
      try {
        const newStatus = await this.artsService.toggleUserPracticing(currentArt.id);
        this.art.set({ ...currentArt, isUserPracticing: newStatus });
        
        const toast = await this.toastController.create({
          message: newStatus 
            ? `Added ${currentArt.name} to your practice!` 
            : `Removed ${currentArt.name} from your practice`,
          duration: 2000,
          position: 'bottom',
          color: newStatus ? 'success' : 'medium',
          icon: newStatus ? 'checkmark-circle' : 'close-circle'
        });
        await toast.present();
      } catch (error) {
        console.error('Failed to toggle practicing status:', error);
        
        const toast = await this.toastController.create({
          message: error instanceof Error ? error.message : 'Failed to update practicing status',
          duration: 3000,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle'
        });
        await toast.present();
      }
    }
  }

  onEdit() {
    const currentArt = this.art();
    if (currentArt) {
      this.router.navigate(['/dash/art', currentArt.id, 'manage']);
    }
  }

  // Chat message handlers
  onChatMessageClick(message: ChatMessage) {
    console.log('Chat message clicked:', message);
  }

  onSendChatMessage(message: string) {
    console.log('Sending chat message:', message);
  }

  onLeaveChat(chatId: string) {
    console.log('Leaving chat:', chatId);
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute status changed:', event);
  }

  onChatInfo(chatId: string) {
    console.log('Show chat info for:', chatId);
  }
}
