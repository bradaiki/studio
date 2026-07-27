import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StudiosService } from '../../services/studios.service';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardContent, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonButton, 
  IonIcon,
  IonText,
  IonChip,
  IonBadge,
  ActionSheetController,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  heart, 
  heartOutline, 
  chatbubbleOutline, 
  shareOutline, 
  ellipsisHorizontal, 
  flag, 
  eyeOff, 
  personRemove,
  checkmarkCircle,
  business,
  person,
  calendar,
  brush,
  home,
  school,
  people
} from 'ionicons/icons';

export type EntityType = 'person' | 'organization' | 'studio' | 'event' | 'art' | 'platform';

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  type: EntityType;
  verified?: boolean;
  location?: string;
  rank?: string; // For people
  artType?: string; // For arts
  eventDate?: string; // For events
  memberCount?: number; // For organizations
  studioAffiliations?: string[]; // Studio IDs for people
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags?: string[];
  isReported?: boolean;
  isHidden?: boolean;
  moderationFlags?: ModerationFlag[];
  postType?: 'announcement' | 'update' | 'achievement' | 'question' | 'share' | 'event_promotion' | 'art_showcase';
  relatedEntity?: {
    id: string;
    type: EntityType;
    name: string;
  };
}

export interface ModerationFlag {
  id: string;
  type: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'copyright' | 'other';
  reason?: string;
  timestamp: string;
  reporterId: string;
}

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon,
    IonText,
    IonChip,
    IonBadge
  ]
})
export class PostComponent {
  @Input() post!: Post;

  constructor(
    private router: Router,
    private studiosService: StudiosService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ 
      heart, 
      heartOutline, 
      chatbubbleOutline, 
      shareOutline, 
      ellipsisHorizontal, 
      flag, 
      eyeOff, 
      personRemove,
      checkmarkCircle,
      business,
      person,
      calendar,
      brush,
      home,
      school,
      people
    });
  }

  onLike() {
    this.post.isLiked = !this.post.isLiked;
    this.post.likes += this.post.isLiked ? 1 : -1;
  }

  onComment() {
    // Handle comment action
    console.log('Comment on post:', this.post.id);
  }

  onShare() {
    // Handle share action
    console.log('Share post:', this.post.id);
  }

  async onMore() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Post Options',
      buttons: [
        {
          text: 'Report Post',
          icon: 'flag',
          handler: () => {
            this.showReportOptions();
          }
        },
        {
          text: 'Hide Post',
          icon: 'eye-off',
          handler: () => {
            this.hidePost();
          }
        },
        {
          text: 'Block User',
          icon: 'person-remove',
          role: 'destructive',
          handler: () => {
            this.blockUser();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async showReportOptions() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Report this post for:',
      buttons: [
        {
          text: 'Spam',
          handler: () => this.reportPost('spam', 'This post appears to be spam')
        },
        {
          text: 'Harassment or Bullying',
          handler: () => this.reportPost('harassment', 'This post contains harassment or bullying')
        },
        {
          text: 'Inappropriate Content',
          handler: () => this.reportPost('inappropriate', 'This post contains inappropriate content')
        },
        {
          text: 'Misinformation',
          handler: () => this.reportPost('misinformation', 'This post contains false information')
        },
        {
          text: 'Copyright Violation',
          handler: () => this.reportPost('copyright', 'This post violates copyright')
        },
        {
          text: 'Other',
          handler: () => this.showCustomReportDialog()
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async showCustomReportDialog() {
    const alert = await this.alertController.create({
      header: 'Report Post',
      message: 'Please describe why you are reporting this post:',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Enter your reason here...',
          attributes: {
            maxlength: 500
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Submit Report',
          handler: (data) => {
            if (data.reason && data.reason.trim()) {
              this.reportPost('other', data.reason.trim());
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async reportPost(type: ModerationFlag['type'], reason: string) {
    // Add moderation flag to post
    if (!this.post.moderationFlags) {
      this.post.moderationFlags = [];
    }

    const flag: ModerationFlag = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      reason,
      timestamp: new Date().toISOString(),
      reporterId: 'current_user_id' // In real app, get from auth service
    };

    this.post.moderationFlags.push(flag);
    this.post.isReported = true;

    // Show confirmation toast
    const toast = await this.toastController.create({
      message: 'Thank you for your report. We will review this content.',
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    toast.present();

    // In a real app, send this to your moderation service
    console.log('Post reported:', {
      postId: this.post.id,
      flag: flag
    });
  }

  async hidePost() {
    this.post.isHidden = true;
    
    const toast = await this.toastController.create({
      message: 'Post hidden from your feed',
      duration: 2000,
      color: 'medium',
      position: 'top'
    });
    toast.present();
  }

  async blockUser() {
    const alert = await this.alertController.create({
      header: 'Block User',
      message: `Are you sure you want to block @${this.post.author.username}? You won't see their posts anymore.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Block',
          role: 'destructive',
          handler: () => {
            this.confirmBlockUser();
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmBlockUser() {
    // In a real app, add user to blocked list
    console.log('User blocked:', this.post.author.username);
    
    const toast = await this.toastController.create({
      message: `@${this.post.author.username} has been blocked`,
      duration: 2000,
      color: 'warning',
      position: 'top'
    });
    toast.present();

    // Hide the post since user is now blocked
    this.post.isHidden = true;
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  }

  getEntityIcon(): string {
    switch (this.post.author.type) {
      case 'person': return 'person';
      case 'organization': return 'business';
      case 'studio': return 'home';
      case 'event': return 'calendar';
      case 'art': return 'brush';
      case 'platform': return 'checkmark-circle';
      default: return 'person';
    }
  }

  getEntityColor(): string {
    switch (this.post.author.type) {
      case 'person': return 'medium';
      case 'organization': return 'primary';
      case 'studio': return 'secondary';
      case 'event': return 'tertiary';
      case 'art': return 'success';
      case 'platform': return 'warning';
      default: return 'medium';
    }
  }

  getEntityLabel(): string {
    switch (this.post.author.type) {
      case 'person': return this.post.author.rank || 'Practitioner';
      case 'organization': return 'Organization';
      case 'studio': return 'Studio';
      case 'event': return 'Event';
      case 'art': return this.post.author.artType || 'Art';
      case 'platform': return 'Platform';
      default: return '';
    }
  }

  isStudioMate(): boolean {
    const userStudioMemberships = this.studiosService.getUserStudioMemberships();
    return this.post.author.type === 'person' && 
           !!this.post.author.studioAffiliations && 
           this.post.author.studioAffiliations.some(studioId => 
             userStudioMemberships.includes(studioId)
           );
  }

  getPostTypeColor(): string {
    switch (this.post.postType) {
      case 'announcement': return 'primary';
      case 'achievement': return 'success';
      case 'event_promotion': return 'tertiary';
      case 'art_showcase': return 'secondary';
      case 'question': return 'warning';
      default: return 'light';
    }
  }

  onProfileClick(event: Event) {
    event.stopPropagation();
    if (this.post.author.type === 'person') {
      // Navigate to dedicated person page
      this.router.navigate(['/dash/person', this.post.author.id]);
    } else if (this.post.author.type === 'organization') {
      // Navigate to dedicated organization page
      this.router.navigate(['/dash/org', this.post.author.id]);
    } else if (this.post.author.type === 'studio') {
      // Navigate to dedicated studio page
      this.router.navigate(['/dash/studio', this.post.author.id]);
    } else if (this.post.author.type === 'event') {
      // Navigate to dedicated event page
      this.router.navigate(['/dash/event', this.post.author.id]);
    } else if (this.post.author.type === 'art') {
      // Navigate to individual art page
      this.router.navigate(['/art', this.post.author.id]);
    }
  }

  async onStudioMateClick(event: Event) {
    event.stopPropagation();
    
    // Navigate to the person's profile page
    if (this.post.author.type === 'person') {
      this.router.navigate(['/dash/person', this.post.author.id]);
    }
  }

  private getSharedStudios(): Array<{id: string, name: string}> {
    const userStudioMemberships = this.studiosService.getUserStudioMemberships();
    const sharedStudios: Array<{id: string, name: string}> = [];
    
    if (this.post.author.studioAffiliations) {
      this.post.author.studioAffiliations.forEach(studioId => {
        if (userStudioMemberships.includes(studioId)) {
          const studio = this.studiosService.getStudioById(studioId);
          if (studio) {
            sharedStudios.push({
              id: studio.id,
              name: studio.name
            });
          }
        }
      });
    }

    // In a real app, this would query the database for all shared studios
    // For demo, we might add additional shared studios based on user relationships
    if (this.post.author.id === 'person_4' || this.post.author.id === 'person_6') {
      // Jessica and Amanda both train at Austin Aikido Center
      if (!sharedStudios.find(s => s.id === 'studio_2')) {
        const austinStudio = this.studiosService.getStudioById('studio_2');
        if (austinStudio) {
          sharedStudios.push({
            id: austinStudio.id,
            name: austinStudio.name
          });
        }
      }
    }

    return sharedStudios;
  }
}