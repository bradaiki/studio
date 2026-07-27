import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardContent, 
  IonButton, 
  IonIcon,
  IonChip,
  IonBadge,
  IonText,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  star,
  starOutline,
  location,
  time,
  personOutline,
  cashOutline,
  informationCircleOutline,
  callOutline,
  globeOutline,
  mailOutline,
  shareOutline,
  leafOutline,
  shieldOutline,
  flashOutline,
  fitnessOutline,
  bodyOutline,
  flameOutline,
  ribbonOutline,
  schoolOutline,
  shapesOutline,
  hammerOutline,
  diamondOutline,
  brushOutline,
  cubeOutline,
  constructOutline
} from 'ionicons/icons';

export interface ArtStudio {
  id: string;
  name: string;
  type: 'aikido' | 'karate' | 'taekwondo' | 'jujitsu' | 'yoga' | 'pilates' | 'kickboxing' | 'judo' | 'pottery' | 'woodworking' | 'jewelry' | 'painting' | 'sculpture' | 'crafts';
  description: string;
  shortDescription: string;
  image: string;
  location: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange: '$' | '$$' | '$$$';
  specialties: string[];
  instructor: string;
  experience: string;
  phone?: string;
  website?: string;
  email?: string;
  featured: boolean;
  openHours: string;
  classTypes: string[];
}

@Component({
  selector: 'app-art-studio',
  templateUrl: './art-studio.component.html',
  styleUrls: ['./art-studio.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonBadge,
    IonText,
    IonLabel
  ]
})
export class ArtStudioComponent {
  @Input() studio!: ArtStudio;
  @Input() showFullDescription: boolean = false;
  @Input() compact: boolean = false;

  @Output() studioClick = new EventEmitter<ArtStudio>();
  @Output() contactClick = new EventEmitter<ArtStudio>();
  @Output() websiteClick = new EventEmitter<ArtStudio>();
  @Output() emailClick = new EventEmitter<ArtStudio>();
  @Output() shareClick = new EventEmitter<ArtStudio>();

  constructor() {
    addIcons({ 
      star,
      starOutline,
      location,
      time,
      personOutline,
      cashOutline,
      informationCircleOutline,
      callOutline,
      globeOutline,
      mailOutline,
      shareOutline,
      leafOutline,
      shieldOutline,
      flashOutline,
      fitnessOutline,
      bodyOutline,
      flameOutline,
      ribbonOutline,
      schoolOutline,
      shapesOutline,
      hammerOutline,
      diamondOutline,
      brushOutline,
      cubeOutline,
      constructOutline
    });
  }

  onStudioClick() {
    this.studioClick.emit(this.studio);
  }

  onContactClick(event: Event) {
    event.stopPropagation();
    this.contactClick.emit(this.studio);
  }

  onWebsiteClick(event: Event) {
    event.stopPropagation();
    this.websiteClick.emit(this.studio);
  }

  onEmailClick(event: Event) {
    event.stopPropagation();
    this.emailClick.emit(this.studio);
  }

  onShareClick(event: Event) {
    event.stopPropagation();
    this.shareClick.emit(this.studio);
  }

  getStudioTypeIcon(): string {
    switch (this.studio.type) {
      case 'aikido': return 'leaf-outline';
      case 'karate': return 'shield-outline';
      case 'taekwondo': return 'flash-outline';
      case 'jujitsu': return 'fitness-outline';
      case 'yoga': return 'leaf-outline';
      case 'pilates': return 'body-outline';
      case 'kickboxing': return 'flame-outline';
      case 'judo': return 'ribbon-outline';
      case 'pottery': return 'shapes-outline';
      case 'woodworking': return 'hammer-outline';
      case 'jewelry': return 'diamond-outline';
      case 'painting': return 'brush-outline';
      case 'sculpture': return 'cube-outline';
      case 'crafts': return 'construct-outline';
      default: return 'school-outline';
    }
  }

  getStudioTypeColor(): string {
    switch (this.studio.type) {
      case 'aikido': return 'success';
      case 'karate': return 'primary';
      case 'taekwondo': return 'warning';
      case 'jujitsu': return 'secondary';
      case 'yoga': return 'success';
      case 'pilates': return 'tertiary';
      case 'kickboxing': return 'danger';
      case 'judo': return 'medium';
      case 'pottery': return 'warning';
      case 'woodworking': return 'secondary';
      case 'jewelry': return 'tertiary';
      case 'painting': return 'primary';
      case 'sculpture': return 'medium';
      case 'crafts': return 'success';
      default: return 'primary';
    }
  }

  getPriceRangeText(): string {
    switch (this.studio.priceRange) {
      case '$': return 'Budget Friendly';
      case '$$': return 'Moderate';
      case '$$$': return 'Premium';
      default: return 'Contact for Pricing';
    }
  }

  generateStarArray(): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(this.studio.rating));
    }
    return stars;
  }

  getDisplayDescription(): string {
    if (this.showFullDescription || this.studio.shortDescription.length <= 120) {
      return this.studio.shortDescription;
    }
    return this.studio.shortDescription.substring(0, 120) + '...';
  }

  getDisplaySpecialties(): string[] {
    return this.compact ? this.studio.specialties.slice(0, 2) : this.studio.specialties.slice(0, 3);
  }

  getExtraSpecialtiesCount(): number {
    const displayCount = this.compact ? 2 : 3;
    return Math.max(0, this.studio.specialties.length - displayCount);
  }

  getDisplayClassTypes(): string {
    const maxLength = this.compact ? 40 : 60;
    const classTypesText = this.studio.classTypes.join(' • ');
    
    if (classTypesText.length <= maxLength) {
      return classTypesText;
    }
    
    return classTypesText.substring(0, maxLength) + '...';
  }
}