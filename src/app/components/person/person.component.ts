import { Component, input, output } from '@angular/core';

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
  person = input.required<Person>();
  showFullBio = input(false);
  showStats = input(true);
  showTags = input(true);
  showActions = input(true);
  compact = input(false);

  followToggle = output<Person>();
  messageClick = output<Person>();
  profileClick = output<Person>();

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
    const p = this.person();
    p.isFollowing = !p.isFollowing;
    p.followers += p.isFollowing ? 1 : -1;
    this.followToggle.emit(p);
  }

  onMessage() {
    this.messageClick.emit(this.person());
  }

  onProfileClick() {
    this.profileClick.emit(this.person());
  }

  onMoreOptions() {
    console.log('More options for:', this.person().username);
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
    const p = this.person();
    if (this.showFullBio() || p.bio.length <= 100) {
      return p.bio;
    }
    return p.bio.substring(0, 100) + '...';
  }

  getFollowButtonText(): string {
    return this.person().isFollowing ? 'Following' : 'Follow';
  }

  getFollowButtonColor(): string {
    return this.person().isFollowing ? 'medium' : 'primary';
  }

  getFollowButtonFill(): string {
    return this.person().isFollowing ? 'outline' : 'solid';
  }

  getFollowIcon(): string {
    return this.person().isFollowing ? 'person-remove' : 'person-add';
  }
}
