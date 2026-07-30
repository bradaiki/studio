import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../amplify/data/resource';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';


export interface Person {
  id: string;
  name: string;
  username: string;
  handle: string; // @handle format for display
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  followers: number;
  following: number;
  postsCount: number;
  isFollowing: boolean;
  tags: string[];
  isVerified: boolean;
  isAdmin?: boolean;
  rank?: string;
  studioAffiliations: string[]; // Unified field for studio affiliations
  experience?: string;
  specialties?: string[];
  achievements?: Achievement[];
  socialMedia?: SocialMediaLink[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'rank' | 'competition' | 'seminar' | 'teaching' | 'other';
  icon?: string;
}

export interface SocialMediaLink {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'website';
  url: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PeopleService {
  private client = generateClient<Schema>();
  private peopleSubject = new BehaviorSubject<Person[]>([]);
  public people$ = this.peopleSubject.asObservable();
  private dbLoadCache = new Map<string, { person: Person; timestamp: number }>(); // Cache for database loads
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  private allPeople: Person[] = [];

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Start with empty array, load from API
    console.log('[PeopleService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadPeopleFromAPI();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe(() => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[PeopleService] Data source changed, reloading people');
      this.loadPeopleFromAPI();
    });
  }

  // Load people from GraphQL API or mock data
  private async loadPeopleFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[PeopleService] Clearing cached people data');
      this.allPeople = [];
      this.peopleSubject.next(this.allPeople);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('Loading people from mock data');
        const mockPeople = this.mockDataService.getMockPeople();
        // Convert mock data to Person interface
        this.allPeople = mockPeople.map((mp: any) => ({
          id: mp.id,
          name: mp.displayName,
          username: mp.handle,
          handle: mp.handle,
          avatar: mp.profileImage || '',
          bio: mp.bio || '',
          location: mp.location || '',
          joinDate: mp.joinedDate || new Date().toISOString(),
          followers: 0,
          following: 0,
          postsCount: 0,
          isFollowing: false,
          tags: [],
          isVerified: mp.isVerified || false,
          isAdmin: mp.isAdmin === true,
          studioAffiliations: [],
          achievements: [],
          socialMedia: []
        }));
        this.peopleSubject.next(this.allPeople);
        console.log('Loaded', this.allPeople.length, 'mock people');
        return;
      }

      // Load from database
      console.log('Loading people from database');
      
      // Determine auth mode based on whether user is authenticated
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
      
      let result: any;
      result = await this.client.models.Person.list({
        limit: 1000,
        authMode
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiPeople = result.data;

      if (apiPeople && Array.isArray(apiPeople)) {
        // Convert GraphQL response to local Person interface
        const convertedPeople: Person[] = apiPeople.map((apiPerson: any) => ({
          id: apiPerson.userId || apiPerson.id,
          name: apiPerson.name || apiPerson.displayName || '',
          username: apiPerson.username || apiPerson.handle || '',
          handle: apiPerson.handle || '',
          avatar: apiPerson.avatar || apiPerson.profileImage || '',
          bio: apiPerson.bio || '',
          location: apiPerson.location || '',
          joinDate: apiPerson.createdAt || apiPerson.joinedDate || new Date().toISOString(),
          followers: apiPerson.followers || 0,
          following: apiPerson.following || 0,
          postsCount: apiPerson.postsCount || 0,
          isFollowing: false,
          tags: (apiPerson.tags || []).filter((t: any): t is string => t !== null),
          isVerified: apiPerson.isVerified || false,
          isAdmin: apiPerson.isAdmin === true,
          rank: apiPerson.rank || undefined,
          studioAffiliations: (apiPerson.studioAffiliations || []).filter((s: any): s is string => s !== null),
          experience: apiPerson.experience || undefined,
          specialties: (apiPerson.specialties || []).filter((s: any): s is string => s !== null),
          achievements: apiPerson.achievements ? JSON.parse(apiPerson.achievements as string) : [],
          socialMedia: apiPerson.socialMedia ? JSON.parse(apiPerson.socialMedia as string) : []
        }));

        // Use only API data, no merging with mock data
        this.allPeople = convertedPeople;
        this.peopleSubject.next(this.allPeople);
        console.log('Successfully loaded people from DynamoDB via GraphQL:', convertedPeople.length, 'people');
      } else {
        // No people in database
        this.allPeople = [];
        this.peopleSubject.next(this.allPeople);
        console.log('No people found in database');
      }
    } catch (error) {
      console.warn('Failed to load people from DynamoDB:', error);
      // Set empty array if API fails
      this.allPeople = [];
      this.peopleSubject.next(this.allPeople);
    }
  }

  // Refresh people from API
  async refreshPeopleFromAPI(): Promise<void> {
    await this.loadPeopleFromAPI();
  }

  // Get all people
  getAllPeople(): Person[] {
    return this.allPeople;
  }

  // Get person by ID
  getPersonById(id: string): Person | undefined {
    return this.allPeople.find(person => person.id === id);
  }

  // Get person by username
  getPersonByUsername(username: string): Person | undefined {
    return this.allPeople.find(person => 
      person.username.toLowerCase() === username.toLowerCase()
    );
  }

  // Get people by studio affiliation
  getPeopleByStudio(studioId: string): Person[] {
    return this.allPeople.filter(person => 
      person.studioAffiliations.includes(studioId)
    );
  }

  // Get all studio IDs for a person
  getPersonStudioIds(person: Person): string[] {
    return [...person.studioAffiliations];
  }

  // Get people by location
  getPeopleByLocation(location: string): Person[] {
    return this.allPeople.filter(person => 
      person.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  // Get people by rank
  getPeopleByRank(rank: string): Person[] {
    return this.allPeople.filter(person => 
      person.rank?.toLowerCase().includes(rank.toLowerCase())
    );
  }

  // Get followed people
  getFollowedPeople(): Person[] {
    return this.allPeople.filter(person => person.isFollowing);
  }

  // Search people
  searchPeople(query: string): Person[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allPeople;

    return this.allPeople.filter(person => 
      person.name.toLowerCase().includes(searchTerm) ||
      person.username.toLowerCase().includes(searchTerm) ||
      person.bio.toLowerCase().includes(searchTerm) ||
      person.location.toLowerCase().includes(searchTerm) ||
      (person.rank && person.rank.toLowerCase().includes(searchTerm)) ||
      person.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Toggle follow status
  toggleFollow(personId: string): boolean {
    const person = this.getPersonById(personId);
    if (person) {
      person.isFollowing = !person.isFollowing;
      person.followers += person.isFollowing ? 1 : -1;
      this.peopleSubject.next(this.allPeople);
      return person.isFollowing;
    }
    return false;
  }

  // Add new person
  async addPerson(person: Person): Promise<boolean> {
    try {
      // Add to local array
      this.allPeople.push(person);
      this.peopleSubject.next(this.allPeople);

      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[PeopleService] MOCK MODE: Adding person locally only');
        console.log('Person added to local mock data:', person);
        return true;
      }
      
      // DATABASE MODE: Persist to database
      console.log('[PeopleService] DATABASE MODE: Adding person to database');
      
      // Try to persist to database if available
      if (this.client?.models?.Person) {
        try {
          const result = await this.client.models.Person.create({
            handle: person.handle,
            displayName: person.name, // Required field - use name as displayName
            bio: person.bio,
            location: person.location,
            website: undefined, // Will be extracted from socialMedia array if needed
            profileImage: person.avatar,
            isInstructor: false,
            isVerified: person.isVerified || false,
            joinedDate: new Date().toISOString(),
            // Legacy fields for backwards compatibility
            userId: person.id,
            name: person.name,
            username: person.username,
            avatar: person.avatar,
            rank: person.rank,
            experience: person.experience,
            specialties: person.specialties || [],
            studioAffiliations: person.studioAffiliations || [],
            followers: person.followers || 0,
            following: person.following || 0,
            postsCount: person.postsCount || 0,
            tags: person.tags || [],
            achievements: person.achievements ? JSON.stringify(person.achievements) : undefined,
            socialMedia: person.socialMedia ? JSON.stringify(person.socialMedia) : undefined,
          }, {
            authMode: 'userPool'
          });

          console.log('Person created in database:', result);
        } catch (dbError) {
          console.error('Failed to create person in database:', dbError);
          throw dbError;
        }
      } else {
        console.warn('Person model not available in schema');
      }

      return true;
    } catch (error) {
      console.error('Error adding person:', error);
      throw error;
    }
  }

  // Update person
  async updatePerson(id: string, updates: Partial<Person>): Promise<boolean> {
    try {
      let localUpdateSuccess = false;
      let dbUpdateSuccess = false;
      
      // Update local array if person exists
      const index = this.allPeople.findIndex(person => person.id === id);
      if (index !== -1) {
        this.allPeople[index] = { ...this.allPeople[index], ...updates };
        this.peopleSubject.next(this.allPeople);
        localUpdateSuccess = true;
        console.log('Person updated in local array');
      } else {
        console.log('Person not found in local array, will try database update');
      }

      // Check data source mode
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[PeopleService] MOCK MODE: Updating person locally only');
        return localUpdateSuccess;
      }
      
      // DATABASE MODE: Update in database
      console.log('[PeopleService] DATABASE MODE: Updating person in database');
      
      // Try to update in database if available
      if (this.client?.models?.Person) {
        try {
          // Find the person record in database by userId
          const { data: people } = await this.client.models.Person.list({
            filter: { userId: { eq: id } },
            authMode: 'userPool'
          });

          if (people && people.length > 0) {
            const personRecord = people[0];
            
            // Prepare update data
            const updateData: any = {};
            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.username !== undefined) updateData.username = updates.username;
            if (updates.handle !== undefined) updateData.handle = updates.handle;
            if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
            if (updates.bio !== undefined) updateData.bio = updates.bio;
            if (updates.location !== undefined) updateData.location = updates.location;
            if (updates.rank !== undefined) updateData.rank = updates.rank;
            if (updates.experience !== undefined) updateData.experience = updates.experience;
            if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
            if (updates.studioAffiliations !== undefined) updateData.studioAffiliations = updates.studioAffiliations;
            if (updates.isVerified !== undefined) updateData.isVerified = updates.isVerified;
            if (updates.followers !== undefined) updateData.followers = updates.followers;
            if (updates.following !== undefined) updateData.following = updates.following;
            if (updates.postsCount !== undefined) updateData.postsCount = updates.postsCount;
            if (updates.tags !== undefined) updateData.tags = updates.tags;
            if (updates.achievements !== undefined) updateData.achievements = JSON.stringify(updates.achievements);
            if (updates.socialMedia !== undefined) updateData.socialMedia = JSON.stringify(updates.socialMedia);

            // Update in database
            const result = await this.client.models.Person.update({
              id: personRecord.id,
              ...updateData
            }, {
              authMode: 'userPool'
            });

            console.log('Person updated in database:', result);
            dbUpdateSuccess = true;
            
            // If person wasn't in local array, add it now with the updated data
            if (index === -1) {
              const updatedPerson = await this.getPersonByIdAsync(id);
              if (updatedPerson) {
                this.allPeople.push(updatedPerson);
                this.peopleSubject.next(this.allPeople);
                console.log('Added updated person to local array');
              }
            }
          } else {
            console.warn('Person not found in database with userId:', id);
          }
        } catch (dbError) {
          console.error('Database update failed:', dbError);
          throw dbError; // Re-throw to let caller know database update failed
        }
      } else {
        console.warn('Person model not available in schema');
      }

      // Return true if either local or database update succeeded
      return localUpdateSuccess || dbUpdateSuccess;
    } catch (error) {
      console.error('Error updating person:', error);
      throw error; // Re-throw so caller can handle the error
    }
  }

  // Get person by ID (checks database first, then local cache)
  async getPersonByIdAsync(id: string): Promise<Person | undefined> {
    // Check cache first
    const cached = this.dbLoadCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('Returning cached person:', id);
      return cached.person;
    }

    try {
      // Try to load from database if available
      if (this.client?.models?.Person) {
        try {
          console.log('[PeopleService] getPersonByIdAsync: querying DB for userId:', id);
          let person: Person | undefined;
          
          // First try: get by primary key (id) — works when Person.id === Cognito sub
          try {
            let getResult: any;
            try {
              getResult = await this.client.models.Person.get(
                { id },
                { authMode: 'userPool' }
              );
            } catch {
              getResult = await this.client.models.Person.get(
                { id },
                { authMode: 'iam' }
              );
            }
            if (getResult.data) {
              const dbPerson = getResult.data;
              person = {
                id: dbPerson.userId || dbPerson.id || id,
                name: dbPerson.name || '',
                username: dbPerson.username || '',
                handle: dbPerson.handle || '',
                avatar: dbPerson.avatar || '',
                bio: dbPerson.bio || '',
                location: dbPerson.location || '',
                joinDate: dbPerson.createdAt || new Date().toISOString(),
                followers: dbPerson.followers || 0,
                following: dbPerson.following || 0,
                postsCount: dbPerson.postsCount || 0,
                isFollowing: false,
                tags: (dbPerson.tags || []).filter((t: any): t is string => t !== null),
                isVerified: dbPerson.isVerified || false,
                isAdmin: (dbPerson as any).isAdmin === true,
                rank: dbPerson.rank || undefined,
                studioAffiliations: (dbPerson.studioAffiliations || []).filter((s: any): s is string => s !== null),
                experience: dbPerson.experience || undefined,
                specialties: (dbPerson.specialties || []).filter((s: any): s is string => s !== null),
                achievements: dbPerson.achievements ? JSON.parse(dbPerson.achievements as string) : [],
                socialMedia: dbPerson.socialMedia ? JSON.parse(dbPerson.socialMedia as string) : []
              };
              console.log('[PeopleService] getPersonByIdAsync: found by id:', person.handle);
            }
          } catch (getErr) {
            console.log('[PeopleService] getPersonByIdAsync: get by id failed:', getErr);
          }

          // Second try: list with filter on userId field (paginated scan — use large limit)
          if (!person) {
            let queryResult: any;
            try {
              queryResult = await this.client.models.Person.list({
                filter: { userId: { eq: id } },
                limit: 500,
                authMode: 'userPool'
              });
            } catch (authErr) {
              console.log('[PeopleService] getPersonByIdAsync: userPool list failed, falling back to iam');
              queryResult = await this.client.models.Person.list({
                filter: { userId: { eq: id } },
                limit: 500,
                authMode: 'iam'
              });
            }
            const people = queryResult.data;
            console.log('[PeopleService] getPersonByIdAsync: list found', people?.length || 0, 'results for userId:', id);

            if (people && people.length > 0) {
              const dbPerson = people[0];
              person = {
                id: dbPerson.userId || id,
                name: dbPerson.name || '',
                username: dbPerson.username || '',
                handle: dbPerson.handle || '',
                avatar: dbPerson.avatar || '',
                bio: dbPerson.bio || '',
                location: dbPerson.location || '',
                joinDate: dbPerson.createdAt || new Date().toISOString(),
                followers: dbPerson.followers || 0,
                following: dbPerson.following || 0,
                postsCount: dbPerson.postsCount || 0,
                isFollowing: false,
                tags: (dbPerson.tags || []).filter((t: any): t is string => t !== null),
                isVerified: dbPerson.isVerified || false,
                isAdmin: (dbPerson as any).isAdmin === true,
                rank: dbPerson.rank || undefined,
                studioAffiliations: (dbPerson.studioAffiliations || []).filter((s: any): s is string => s !== null),
                experience: dbPerson.experience || undefined,
                specialties: (dbPerson.specialties || []).filter((s: any): s is string => s !== null),
                achievements: dbPerson.achievements ? JSON.parse(dbPerson.achievements as string) : [],
                socialMedia: dbPerson.socialMedia ? JSON.parse(dbPerson.socialMedia as string) : []
              };
            }
          }

          if (person) {            // Update cache
            this.dbLoadCache.set(id, { person, timestamp: Date.now() });

            // Update local cache
            const index = this.allPeople.findIndex(p => p.id === id);
            if (index !== -1) {
              this.allPeople[index] = person;
            } else {
              this.allPeople.push(person);
            }
            this.peopleSubject.next(this.allPeople);

            console.log('Loaded person from database:', id);
            return person;
          }
        } catch (dbError) {
          console.warn('Database query failed, using local cache:', dbError);
          // Don't throw, just fall through to local cache
        }
      } else {
        console.log('Person model not available in schema, using local cache');
      }
    } catch (error) {
      console.warn('Error loading person from database, using cache:', error);
    }

    // Fallback to local cache
    console.log('Using local cache for person:', id);
    const localPerson = this.getPersonById(id);
    
    // Cache the local result
    if (localPerson) {
      this.dbLoadCache.set(id, { person: localPerson, timestamp: Date.now() });
    }
    
    return localPerson;
  }

  // Remove person
  removePerson(id: string): boolean {
    const index = this.allPeople.findIndex(person => person.id === id);
    if (index !== -1) {
      this.allPeople.splice(index, 1);
      this.peopleSubject.next(this.allPeople);
      return true;
    }
    return false;
  }

  // Get people stats
  getPeopleStats(): { total: number; verified: number; instructors: number; students: number } {
    const total = this.allPeople.length;
    const verified = this.allPeople.filter(p => p.isVerified).length;
    const instructors = this.allPeople.filter(p => 
      p.tags.includes('instructor') || 
      p.tags.includes('chief-instructor') || 
      p.tags.includes('assistant-instructor')
    ).length;
    const students = total - instructors;

    return { total, verified, instructors, students };
  }
}
