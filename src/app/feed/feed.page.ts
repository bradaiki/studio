import { Component, OnInit, ViewChild, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { PostComponent, Post } from '../components/post/post.component';
import { StudiosService } from '../services/studios.service';
import { FavoritesService } from '../services/favorites.service';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, newspaperOutline } from 'ionicons/icons';

@Component({
  selector: 'app-feed',
  templateUrl: 'feed.page.html',
  styleUrls: ['feed.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonIcon,
    PostComponent,
    TranslateModule,
  ],
})
export class FeedPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

  // Keep as regular property - used with [(ngModel)]
  selectedFeed: string = 'clubs';

  // Convert to signals
  displayedPosts = signal<Post[]>([]);

  // Infinite scroll properties - separate state for each feed
  private pageSize = 10;
  private scrollStates = new Map<string, { page: number; displayed: Post[] }>();
  private currentFilterKey = '';

  // All posts will be loaded from mock data or database
  private clubsPosts: Post[] = [];
  private studioMemberPosts: Post[] = [];
  private discoverPosts: Post[] = [];
  private lookPosts: Post[] = [];

  constructor(
    private studiosService: StudiosService,
    private favoritesService: FavoritesService,
    private postsService: PostsService,
    private router: Router,
  ) {
    addIcons({ add, newspaperOutline });
  }

  ngOnInit() {
    // Add some fake favorites for demo purposes
    this.addDemoFavorites();

    // Subscribe to posts from the service
    this.postsService.posts$.subscribe((posts) => {
      // Convert PostsService.Post to feed Post format
      this.discoverPosts = posts.map((p) => ({
        id: p.id,
        author: {
          id: p.authorId,
          name: p.authorName,
          username: p.authorHandle,
          avatar:
            p.authorImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(p.authorName)}&size=150&background=random&color=fff`,
          type: 'person' as const,
        },
        content: p.content,
        image: p.images && p.images.length > 0 ? p.images[0] : undefined,
        timestamp: p.createdAt || new Date().toISOString(),
        likes: p.likes,
        comments: p.comments,
        isLiked: false,
        tags: p.tags || [],
        isReported: false,
        isHidden: false,
        postType: 'share' as const,
      }));

      // Clear scroll states to force refresh
      this.scrollStates.clear();
      this.currentFilterKey = '';
      this.updateDisplayedPosts();
    });
  }

  private addDemoFavorites() {
    // Simulate favoriting some entities for the Look feed
  }

  get currentPosts(): Post[] {
    let posts: Post[];
    if (this.selectedFeed === 'clubs') {
      posts = this.getClubsPosts();
    } else if (this.selectedFeed === 'look') {
      posts = this.getLookPosts();
    } else {
      posts = this.discoverPosts;
    }

    return posts;
  }

  private updateDisplayedPosts() {
    const posts = this.currentPosts;

    // Create unique key for this feed
    const filterKey = this.selectedFeed;

    // Check if feed changed
    if (filterKey !== this.currentFilterKey) {
      this.currentFilterKey = filterKey;

      // Get or create state for this feed
      if (!this.scrollStates.has(filterKey)) {
        this.scrollStates.set(filterKey, { page: 0, displayed: [] });
      }

      const state = this.scrollStates.get(filterKey)!;

      // If state is empty, load initial items
      if (state.displayed.length === 0) {
        this.loadInitialPosts(state, posts);
      }

      this.displayedPosts.set(state.displayed);
    }
  }

  private loadInitialPosts(
    state: { page: number; displayed: Post[] },
    source: Post[],
  ) {
    state.page = 0;
    state.displayed = [];
    this.loadMorePostsForState(state, source);
  }

  private loadMorePostsForState(
    state: { page: number; displayed: Post[] },
    source: Post[],
  ) {
    const startIndex = state.page * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const newPosts = source.slice(startIndex, endIndex);
    state.displayed = [...state.displayed, ...newPosts];
    state.page++;
  }

  loadMore(event: any) {
    setTimeout(() => {
      const state = this.scrollStates.get(this.currentFilterKey);
      if (!state) {
        event.target.complete();
        return;
      }

      // Get fresh posts for current feed
      const posts = this.currentPosts;
      const startIndex = state.page * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const newPosts = posts.slice(startIndex, endIndex);

      // Only add if there are new posts
      if (newPosts.length > 0) {
        state.displayed = [...state.displayed, ...newPosts];
        state.page++;
        this.displayedPosts.set(state.displayed);
      }

      event.target.complete();

      // Disable infinite scroll when all items are loaded
      if (state.displayed.length >= posts.length || newPosts.length === 0) {
        event.target.disabled = true;
      }
    }, 500);
  }

  private getClubsPosts(): Post[] {
    const userStudioMemberships =
      this.studiosService.getUserStudioMemberships();
    const userOrganizationMemberships: string[] = ['org_1'];
    const userAttendingEvents: string[] = [];

    const allPosts = [
      ...this.clubsPosts,
      ...this.studioMemberPosts,
      ...this.discoverPosts,
    ];

    const filteredPosts = allPosts.filter((post) => {
      if (
        post.author.type === 'studio' &&
        userStudioMemberships.includes(post.author.id)
      ) {
        return true;
      }
      if (
        post.author.type === 'organization' &&
        userOrganizationMemberships.includes(post.author.id)
      ) {
        return true;
      }
      if (
        post.author.type === 'event' &&
        userAttendingEvents.includes(post.author.id)
      ) {
        return true;
      }
      if (
        post.author.type === 'person' &&
        post.author.studioAffiliations &&
        post.author.studioAffiliations.some((studioId) =>
          userStudioMemberships.includes(studioId),
        )
      ) {
        return true;
      }
      if (
        post.relatedEntity &&
        post.relatedEntity.type === 'studio' &&
        userStudioMemberships.includes(post.relatedEntity.id)
      ) {
        return true;
      }
      if (
        post.relatedEntity &&
        post.relatedEntity.type === 'organization' &&
        userOrganizationMemberships.includes(post.relatedEntity.id)
      ) {
        return true;
      }
      return false;
    });

    return filteredPosts.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  private getLookPosts(): Post[] {
    const favorites = this.favoritesService.getAllFavorites();
    const favoritedIds = new Set(favorites.map((f) => f.itemId));

    const demoFavoritedIds = new Set([
      'studio_3',
      'person_8',
      'org_3',
      'event_2',
      'art_2',
      'person_9',
    ]);

    const allFavoritedIds = new Set([...favoritedIds, ...demoFavoritedIds]);

    const allPosts = [
      ...this.clubsPosts,
      ...this.studioMemberPosts,
      ...this.discoverPosts,
      ...this.lookPosts,
    ];

    const filteredPosts = allPosts.filter((post) => {
      if (allFavoritedIds.has(post.author.id)) {
        return true;
      }
      if (post.relatedEntity && allFavoritedIds.has(post.relatedEntity.id)) {
        return true;
      }
      return false;
    });

    return filteredPosts.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  onFeedChange(event: any) {
    this.selectedFeed = event.detail.value;

    const newFilterKey = this.selectedFeed;

    if (newFilterKey !== this.currentFilterKey) {
      const posts = this.currentPosts;
      const state = { page: 0, displayed: [] };
      this.scrollStates.set(newFilterKey, state);
      this.loadInitialPosts(state, posts);
      this.displayedPosts.set(state.displayed);
      this.currentFilterKey = newFilterKey;
    }

    // Re-enable infinite scroll
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }

  handleRefresh(event: any) {
    setTimeout(async () => {
      await this.postsService.refreshPostsFromAPI();
      event.target.complete();
    }, 1000);
  }

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  createPost() {
    this.router.navigate(['/dash/post-form']);
  }
}
