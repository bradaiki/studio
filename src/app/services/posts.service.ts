import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorImage?: string;
  likes: number;
  comments: number;
  shares: number;
  images?: string[];
  tags?: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  private allPosts: Post[] = [];
  private client = generateClient();

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Load posts based on initial data source
    console.log('[PostsService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadPostsFromAPI();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe(() => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[PostsService] Data source changed, reloading posts');
      this.loadPostsFromAPI();
    });
  }

  // Get all posts
  getAllPosts(): Post[] {
    return this.allPosts;
  }

  // Get post by ID
  getPostById(id: string): Post | undefined {
    return this.allPosts.find(post => post.id === id);
  }

  // Get posts by author
  getPostsByAuthor(authorId: string): Post[] {
    return this.allPosts.filter(post => post.authorId === authorId);
  }

  // Search posts
  searchPosts(query: string): Post[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allPosts;

    return this.allPosts.filter(post => 
      post.content.toLowerCase().includes(searchTerm) ||
      post.authorName.toLowerCase().includes(searchTerm) ||
      post.authorHandle.toLowerCase().includes(searchTerm) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Create a new post
  async createPost(postData: Partial<Post>): Promise<Post> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Posts Service] Creating post in MOCK mode (local only)');
      // Create locally only
      const newPost: Post = {
        id: `post_${Date.now()}`,
        content: postData.content || '',
        authorId: postData.authorId || '',
        authorName: postData.authorName || '',
        authorHandle: postData.authorHandle || '',
        authorImage: postData.authorImage,
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        shares: postData.shares || 0,
        images: postData.images || [],
        tags: postData.tags || [],
        isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.allPosts.unshift(newPost); // Add to beginning
      this.postsSubject.next(this.allPosts);
      console.log('[Posts Service] Post created locally:', newPost.id);
      return newPost;
    }
    
    // Database mode - create in remote database
    console.log('[Posts Service] Creating post in DATABASE mode');
    try {
      const result = await (this.client.models as any)['Post'].create({
        content: postData.content || '',
        authorId: postData.authorId || '',
        authorName: postData.authorName || '',
        authorHandle: postData.authorHandle || '',
        authorImage: postData.authorImage || '',
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        shares: postData.shares || 0,
        images: postData.images || [],
        tags: postData.tags || [],
        isPublic: postData.isPublic !== undefined ? postData.isPublic : true
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const createdPost = result.data;
        const newPost: Post = {
          id: createdPost.id,
          content: createdPost.content,
          authorId: createdPost.authorId,
          authorName: createdPost.authorName,
          authorHandle: createdPost.authorHandle,
          authorImage: createdPost.authorImage || undefined,
          likes: createdPost.likes || 0,
          comments: createdPost.comments || 0,
          shares: createdPost.shares || 0,
          images: (createdPost.images as string[]) || [],
          tags: (createdPost.tags as string[]) || [],
          isPublic: createdPost.isPublic !== undefined ? createdPost.isPublic : true,
          createdAt: createdPost.createdAt,
          updatedAt: createdPost.updatedAt
        };

        this.allPosts.unshift(newPost); // Add to beginning
        this.postsSubject.next(this.allPosts);
        console.log('Post successfully created in DynamoDB:', newPost);
        return newPost;
      }

      throw new Error('Failed to create post - no data returned');
    } catch (error) {
      console.error('Failed to create post in DynamoDB:', error);
      throw new Error(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update post
  async updatePost(id: string, updates: Partial<Post>): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Posts Service] Updating post in MOCK mode (local only):', id);
      // Update locally only
      const index = this.allPosts.findIndex(post => post.id === id);
      if (index !== -1) {
        this.allPosts[index] = { ...this.allPosts[index], ...updates, updatedAt: new Date().toISOString() };
        this.postsSubject.next(this.allPosts);
        console.log('[Posts Service] Post updated locally');
        return true;
      }
      return false;
    }
    
    // Database mode - update in remote database
    console.log('[Posts Service] Updating post in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Post'].update({
        id,
        ...updates
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const index = this.allPosts.findIndex(post => post.id === id);
        if (index !== -1) {
          this.allPosts[index] = { ...this.allPosts[index], ...updates };
          this.postsSubject.next(this.allPosts);
        }
        console.log('Post successfully updated in DynamoDB');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update post in DynamoDB:', error);
      throw new Error(`Failed to update post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete post
  async deletePost(id: string): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Posts Service] Deleting post in MOCK mode (local only):', id);
      // Delete locally only
      const index = this.allPosts.findIndex(post => post.id === id);
      if (index !== -1) {
        this.allPosts.splice(index, 1);
        this.postsSubject.next(this.allPosts);
        console.log('[Posts Service] Post deleted locally');
        return true;
      }
      return false;
    }
    
    // Database mode - delete from remote database
    console.log('[Posts Service] Deleting post in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Post'].delete({
        id
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const index = this.allPosts.findIndex(post => post.id === id);
      if (index !== -1) {
        this.allPosts.splice(index, 1);
        this.postsSubject.next(this.allPosts);
      }
      console.log('Post successfully deleted from DynamoDB');
      return true;
    } catch (error) {
      console.error('Failed to delete post from DynamoDB:', error);
      throw new Error(`Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Like/unlike post
  async toggleLike(postId: string, increment: boolean): Promise<boolean> {
    const post = this.getPostById(postId);
    if (!post) return false;

    const newLikes = increment ? post.likes + 1 : Math.max(0, post.likes - 1);
    return await this.updatePost(postId, { likes: newLikes });
  }

  // Load posts from GraphQL API or mock data
  private async loadPostsFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[PostsService] Clearing cached posts data');
      this.allPosts = [];
      this.postsSubject.next(this.allPosts);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('Loading posts from mock data');
        const mockPosts = this.mockDataService.getMockPosts();
        // Convert mock data to Post interface
        this.allPosts = mockPosts.map((mp: any) => ({
          id: mp.id,
          content: mp.content,
          authorId: mp.authorId,
          authorName: mp.authorName,
          authorHandle: mp.authorHandle,
          authorImage: mp.authorImage,
          likes: mp.likes || 0,
          comments: mp.comments || 0,
          shares: mp.shares || 0,
          images: [],
          tags: [],
          isPublic: true,
          createdAt: mp.createdAt
        }));
        this.postsSubject.next(this.allPosts);
        console.log('Loaded', this.allPosts.length, 'mock posts');
        return;
      }

      // Load from database
      console.log('Loading posts from database');
      
      let userId: string | null = null;
      try {
        const session = await fetchAuthSession();
        if (session.tokens && session.identityId) {
          userId = session.identityId;
        }
      } catch (e) {
        // User not authenticated
      }
      
      const authMode = userId ? 'userPool' : 'iam';
      
      const result = await (this.client.models as any)['Post'].list({
        authMode
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiPosts = result.data;

      if (apiPosts && Array.isArray(apiPosts)) {
        const convertedPosts: Post[] = apiPosts.map((apiPost: any) => ({
          id: apiPost.id,
          content: apiPost.content,
          authorId: apiPost.authorId,
          authorName: apiPost.authorName,
          authorHandle: apiPost.authorHandle,
          authorImage: apiPost.authorImage || undefined,
          likes: apiPost.likes || 0,
          comments: apiPost.comments || 0,
          shares: apiPost.shares || 0,
          images: (apiPost.images as string[]) || [],
          tags: (apiPost.tags as string[]) || [],
          isPublic: apiPost.isPublic !== undefined ? apiPost.isPublic : true,
          createdAt: apiPost.createdAt,
          updatedAt: apiPost.updatedAt
        }));
        
        // Sort by creation date (newest first)
        this.allPosts = convertedPosts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        this.postsSubject.next(this.allPosts);
        console.log('Successfully loaded posts from database');
      } else {
        this.allPosts = [];
        this.postsSubject.next(this.allPosts);
      }
    } catch (error) {
      console.warn('Failed to load posts:', error);
      this.allPosts = [];
      this.postsSubject.next(this.allPosts);
    }
  }

  // Refresh posts from API
  async refreshPostsFromAPI(): Promise<void> {
    await this.loadPostsFromAPI();
  }
}
