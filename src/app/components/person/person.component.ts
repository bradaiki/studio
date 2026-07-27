import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Person } from '../../services/people.service';
import {
  IonCard,
  IonCardContent,
  IonAvatar,
  IonButton,
  IonIcon,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAdd,
  personRemove,
  chatbubble,
  mail,
  location,
  calendar,
  person,
  checkmarkCircle,
  ellipsisHorizontal,
} from 'ionicons/icons';

// Person interface now imported from service

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonButton,
    IonIcon,
    IonChip,
  ],
})
export class PersonComponent {
  @Input() person!: Person;
  @Input() showFullBio: boolean = false;
  @Input() showStats: boolean = true;
  @Input() showTags: boolean = true;
  @Input() showActions: boolean = true;
  @Input() compact: boolean = false;

  @Output() followToggle = new EventEmitter<Person>();
  @Output() messageClick = new EventEmitter<Person>();
  @Output() profileClick = new EventEmitter<Person>();

  constructor(private router: Router) {
    addIcons({
      personAdd,
      personRemove,
      chatbubble,
      mail,
      location,
      calendar,
      person,
      checkmarkCircle,
      ellipsisHorizontal,
    });
  }

  onFollow() {
    this.person.isFollowing = !this.person.isFollowing;
    this.person.followers += this.person.isFollowing ? 1 : -1;
    this.followToggle.emit(this.person);
  }

  onMessage() {
    this.messageClick.emit(this.person);
  }

  onProfileClick() {
    this.profileClick.emit(this.person);
  }

  onMoreOptions() {
    console.log('More options for:', this.person.username);
    // In a real app, this would open an action sheet with more options
  }

  formatJoinDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getDisplayBio(): string {
    if (this.showFullBio || this.person.bio.length <= 100) {
      return this.person.bio;
    }
    return this.person.bio.substring(0, 100) + '...';
  }

  getFollowButtonText(): string {
    return this.person.isFollowing ? 'Following' : 'Follow';
  }

  getFollowButtonColor(): string {
    return this.person.isFollowing ? 'medium' : 'primary';
  }

  getFollowButtonFill(): string {
    return this.person.isFollowing ? 'outline' : 'solid';
  }

  getFollowIcon(): string {
    return this.person.isFollowing ? 'person-remove' : 'person-add';
  }
}
