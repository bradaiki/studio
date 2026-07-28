import { Component, input } from '@angular/core';

import {
  IonCard,
  IonCardHeader,
  IonAvatar,
  IonButton,
  IonIcon,
  IonText,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  personAdd,
  personRemove,
  chatbubble,
  mail,
  location,
  calendar,
} from 'ionicons/icons';
import { PostComponent, Post } from '../post/post.component';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  handle: string;
  avatar: string;
  bio: string;
  location?: string;
  joinDate: string;
  followers: number;
  following: number;
  postsCount: number;
  isFollowing: boolean;
  posts: Post[];
  tags?: string[];
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonCard,
    IonCardHeader,
    IonAvatar,
    IonButton,
    IonIcon,
    IonText,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    PostComponent,
  ],
})
export class UserProfileComponent {
  profile = input.required<UserProfile>();
  showPosts = input<boolean>(true);

  constructor() {
    addIcons({ personAdd, personRemove, chatbubble, mail, location, calendar });
  }

  onFollow() {
    const p = this.profile();
    p.isFollowing = !p.isFollowing;
    p.followers += p.isFollowing ? 1 : -1;
  }

  onMessage() {
    console.log('Message user:', this.profile().username);
  }

  onEmail() {
    console.log('Email user:', this.profile().username);
  }

  formatJoinDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }
}
