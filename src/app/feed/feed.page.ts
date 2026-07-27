import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
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
    CommonModule,
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
    TranslateModule
  ],
})
export class FeedPage implements OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;
  
  selectedFeed: string = 'clubs';
  displayedPosts: Post[] = [];
  
  // Infinite scroll properties - separate state for each feed
  private pageSize = 10;
  private scrollStates = new Map<string, { page: number; displayed: Post[] }>();
  private currentFilterKey = '';
  
  // All posts will be loaded from mock data or database
  clubsPosts: Post[] = [];
  studioMemberPosts: Post[] = [];
  discoverPosts: Post[] = [];
  lookPosts: Post[] = [];

  constructor(
    private studiosService: StudiosService,
    private favoritesService: FavoritesService,
    private postsService: PostsService,
    private router: Router
  ) {
    addIcons({ add, newspaperOutline });
  }

  ngOnInit() {
    // Add some fake favorites for demo purposes
    this.addDemoFavorites();
    
    // Subscribe to posts from the service
    this.postsService.posts$.subscribe(posts => {
      // Convert PostsService.Post to feed Post format
      this.discoverPosts = posts.map(p => ({
        id: p.id,
        author: {
          id: p.authorId,
          name: p.authorName,
          username: p.authorHandle,
          avatar: p.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.authorName)}&size=150&background=random&color=fff`,
          type: 'person' as const
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
        postType: 'share' as const
      }));
      
      // Clear scroll states to force refresh
      this.scrollStates.clear();
      this.currentFilterKey = '';
      this.updateDisplayedPosts();
    });
  }

  private addDemoFavorites() {
    // Simulate favoriting some entities for the Look feed
    // In a real app, these would be stored in the database
    // For demo, we'll just add them to the local favorites list
    
    // Note: These IDs should match the author IDs in the posts below
    // The favorites service will handle these when the user actually favorites items
  }

  get currentPosts(): Post[] {
    let posts: Post[];
    if (this.selectedFeed === 'clubs') {
      // Filter posts from clubs/memberships
      posts = this.getClubsPosts();
    } else if (this.selectedFeed === 'look') {
      // Filter posts from followed/favorited entities
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
      
      this.displayedPosts = state.displayed;
    }
  }

  private loadInitialPosts(state: { page: number; displayed: Post[] }, source: Post[]) {
    state.page = 0;
    state.displayed = [];
    this.loadMorePostsForState(state, source);
  }

  private loadMorePostsForState(state: { page: number; displayed: Post[] }, source: Post[]) {
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
      
      console.log('Infinite scroll triggered:', {
        currentFeed: this.currentFilterKey,
        totalPosts: posts.length,
        displayedCount: state.displayed.length,
        page: state.page,
        startIndex,
        endIndex,
        newPostsCount: newPosts.length
      });
      
      // Only add if there are new posts
      if (newPosts.length > 0) {
        state.displayed = [...state.displayed, ...newPosts];
        state.page++;
        this.displayedPosts = state.displayed;
        
        console.log('After loading:', {
          displayedCount: state.displayed.length,
          totalPosts: posts.length,
          hasMore: state.displayed.length < posts.length
        });
      }
      
      event.target.complete();
      
      // Disable infinite scroll when all items are loaded
      if (state.displayed.length >= posts.length || newPosts.length === 0) {
        console.log('Disabling infinite scroll - all posts loaded');
        event.target.disabled = true;
      }
    }, 500);
  }

  private getClubsPosts(): Post[] {
    // Get user's studio memberships
    const userStudioMemberships = this.studiosService.getUserStudioMemberships();
    
    // TODO: Get user's organization memberships (when organizations service is available)
    const userOrganizationMemberships: string[] = ['org_1']; // Placeholder
    
    // TODO: Get events user is attending (when events service is available)
    const userAttendingEvents: string[] = []; // Placeholder
    
    // Combine all posts
    const allPosts = [
      ...this.clubsPosts,
      ...this.studioMemberPosts,
      ...this.discoverPosts
    ];
    
    // Filter posts based on:
    // 1. Posts from studios user is a member of
    // 2. Posts from organizations user is a member of
    // 3. Posts from events user is attending
    // 4. Posts from people who belong to the same studios
    const filteredPosts = allPosts.filter(post => {
      // Check if post is from a studio the user is a member of
      if (post.author.type === 'studio' && 
          userStudioMemberships.includes(post.author.id)) {
        return true;
      }
      
      // Check if post is from an organization the user is a member of
      if (post.author.type === 'organization' && 
          userOrganizationMemberships.includes(post.author.id)) {
        return true;
      }
      
      // Check if post is from an event the user is attending
      if (post.author.type === 'event' && 
          userAttendingEvents.includes(post.author.id)) {
        return true;
      }
      
      // Check if post is from a person who belongs to the same studios
      if (post.author.type === 'person' && 
          post.author.studioAffiliations && 
          post.author.studioAffiliations.some(studioId => 
            userStudioMemberships.includes(studioId)
          )) {
        return true;
      }
      
      // Check if related entity is a studio the user is a member of
      if (post.relatedEntity && 
          post.relatedEntity.type === 'studio' && 
          userStudioMemberships.includes(post.relatedEntity.id)) {
        return true;
      }
      
      // Check if related entity is an organization the user is a member of
      if (post.relatedEntity && 
          post.relatedEntity.type === 'organization' && 
          userOrganizationMemberships.includes(post.relatedEntity.id)) {
        return true;
      }
      
      return false;
    });
    
    // Sort by timestamp (newest first)
    return filteredPosts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private getLookPosts(): Post[] {
    // Get all favorites
    const favorites = this.favoritesService.getAllFavorites();
    const favoritedIds = new Set(favorites.map(f => f.itemId));
    
    // Add demo favorited IDs for the Look feed
    // These simulate entities the user has favorited
    const demoFavoritedIds = new Set([
      'studio_3',        // Seattle Aikido Center
      'person_8',        // Takeshi Yamamoto
      'org_3',           // International Aikido Federation
      'event_2',         // Summer Aikido Intensive
      'art_2',           // Aikido Philosophy & History
      'person_9'         // Elena Rodriguez
    ]);
    
    // Combine favorited IDs
    const allFavoritedIds = new Set([...favoritedIds, ...demoFavoritedIds]);
    
    // Combine all posts including Look posts
    const allPosts = [
      ...this.clubsPosts,
      ...this.studioMemberPosts,
      ...this.discoverPosts,
      ...this.lookPosts
    ];
    
    // Filter posts based on:
    // 1. Author is favorited (person, organization, studio, event, art)
    // 2. Related entity is favorited
    const filteredPosts = allPosts.filter(post => {
      // Check if author is favorited
      if (allFavoritedIds.has(post.author.id)) {
        return true;
      }
      
      // Check if related entity is favorited
      if (post.relatedEntity && allFavoritedIds.has(post.relatedEntity.id)) {
        return true;
      }
      
      return false;
    });
    
    // Sort by timestamp (newest first)
    return filteredPosts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private getStudioMemberPosts(): Post[] {
    // Filter posts from people who train at the same studios as the user
    const userStudioMemberships = this.studiosService.getUserStudioMemberships();
    return this.studioMemberPosts.filter(post => 
      post.author.type === 'person' && 
      post.author.studioAffiliations && 
      post.author.studioAffiliations.some(studioId => 
        userStudioMemberships.includes(studioId)
      )
    );
  }

  onFeedChange(event: any) {
    this.selectedFeed = event.detail.value;
    
    // Get the new filter key
    const newFilterKey = this.selectedFeed;
    
    // If this is a new feed, create fresh state
    if (newFilterKey !== this.currentFilterKey) {
      // Create new state for this feed
      const posts = this.currentPosts;
      const state = { page: 0, displayed: [] };
      this.scrollStates.set(newFilterKey, state);
      this.loadInitialPosts(state, posts);
      this.displayedPosts = state.displayed;
      this.currentFilterKey = newFilterKey;
    }
    
    // Re-enable infinite scroll
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
  }

  handleRefresh(event: any) {
    setTimeout(async () => {
      // Reload posts from the service
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