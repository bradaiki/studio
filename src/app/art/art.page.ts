import { Component, OnInit } from '@angular/core';
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
  art: Art | null = null;
  selectedSegment: string = 'organizations';
  loading: boolean = true;
  notFound: boolean = false;
  
  artOrganizations: Organization[] = [];
  artStudios: Studio[] = [];

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
        this.loadArt(artId);
      } else {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  private loadArt(artId: string) {
    this.art = this.artsService.getArtById(artId) || null;
    
    if (this.art) {
      // Load organizations for this art
      const orgIds = this.artsService.getArtOrganizations(artId);
      this.artOrganizations = orgIds.map(id => 
        this.organizationsService.getOrganizationById(id)
      ).filter(org => org !== undefined) as Organization[];
      
      // Load studios for this art
      const studioIds = this.artsService.getArtStudios(artId);
      this.artStudios = studioIds.map(id => 
        this.studiosService.getStudioById(id)
      ).filter(studio => studio !== undefined) as Studio[];
      
      this.notFound = false;
    } else {
      this.notFound = true;
    }
    
    this.loading = false;
  }

  onBack() {
    this.location.back();
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }

  onOrganizationClick(org: Organization) {
    this.router.navigate(['/org', org.id]);
  }

  onStudioClick(studio: Studio) {
    this.router.navigate(['/studio', studio.id]);
  }

  async onTogglePracticing() {
    if (this.art) {
      try {
        const newStatus = await this.artsService.toggleUserPracticing(this.art.id);
        this.art.isUserPracticing = newStatus;
        
        // Show success toast
        const toast = await this.toastController.create({
          message: newStatus 
            ? `Added ${this.art.name} to your practice!` 
            : `Removed ${this.art.name} from your practice`,
          duration: 2000,
          position: 'bottom',
          color: newStatus ? 'success' : 'medium',
          icon: newStatus ? 'checkmark-circle' : 'close-circle'
        });
        await toast.present();
      } catch (error) {
        console.error('Failed to toggle practicing status:', error);
        
        // Show error toast
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
    if (this.art) {
      this.router.navigate(['/art', this.art.id, 'manage']);
    }
  }

  get canUserEdit(): boolean {
    return this.art ? this.artsService.canUserEditArt(this.art) : false;
  }

  getArtIcon(): string {
    if (!this.art) return 'school-outline';
    
    switch (this.art.category) {
      case 'martial-arts': return 'shield-outline';
      case 'wellness': return 'leaf-outline';
      case 'crafts': return 'construct-outline';
      default: return 'school-outline';
    }
  }

  getArtColor(): string {
    if (!this.art) return 'primary';
    
    switch (this.art.category) {
      case 'martial-arts': return 'primary';
      case 'wellness': return 'success';
      case 'crafts': return 'warning';
      default: return 'medium';
    }
  }

  getDifficultyColor(): string {
    if (!this.art) return 'medium';
    
    switch (this.art.difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      case 'all-levels': return 'primary';
      default: return 'medium';
    }
  }

  getPhysicalDemandsColor(): string {
    if (!this.art) return 'medium';
    
    switch (this.art.physicalDemands) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  }

  // Chat message handlers
  onChatMessageClick(message: ChatMessage) {
    console.log('Chat message clicked:', message);
    // In a real app, this might open a detailed message view or mark as read
  }

  onSendChatMessage(message: string) {
    console.log('Sending chat message:', message);
    // In a real app, this would send the message to a backend service
  }

  onLeaveChat(chatId: string) {
    console.log('Leaving chat:', chatId);
    // In a real app, this would call a service to leave the chat
  }

  onMuteChat(event: { chatId: string; isMuted: boolean }) {
    console.log('Chat mute status changed:', event);
    // In a real app, this would update the user's notification preferences
  }

  onChatInfo(chatId: string) {
    console.log('Show chat info for:', chatId);
    // In a real app, this might open a modal with chat details, participants, etc.
  }
}