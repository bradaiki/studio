import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { type  Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';

export interface Instructor {
  id: string;
  name: string;
  username: string;
  title: string;
  rank: string;
  bio: string;
  image: string;
  experience: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  certifications?: string[];
  isActive: boolean;
  studioId?: string;
}

export interface Studio {
  id: string;
  name: string;
  location: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  tagline: string;
  heroImage: string;
  primaryArt?: string;
  verified: boolean;
  isVerified?: boolean;
  memberCount: number;
  instructorCount?: number;
  established: string;
  establishedYear?: number;
  facilities?: string[];
  amenities?: string[];
  headInstructorId?: string;
  studioChiefId?: string;
  instructors: Instructor[];
  schedule: ClassSchedule[];
  pricing: PricingOption[];
  benefits: Benefit[];
  isMember: boolean;
  isInstructor: boolean;
  isStudioChief: boolean;
  
  // Computed properties for convenience
  headInstructor?: Instructor;
  studioChief?: Instructor;
}

// Keep for backward compatibility
export interface StudioInstructor extends Instructor {}

export interface ClassSchedule {
  id?: string;
  title: string; // Class name/type
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  startTime: string; // Time in HH:mm format
  endTime: string; // Time in HH:mm format
  instructor: string;
  level: string;
  description?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceEnd?: string; // ISO date string
  recurrenceDays?: number[]; // Days of week (0=Sunday, 1=Monday, etc.) for weekly recurrence
  color?: string; // For calendar display
  location?: string; // Specific room/area in studio
}

export interface PricingOption {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}





@Injectable({
  providedIn: 'root'
})
export class StudiosService {
  private studiosSubject = new BehaviorSubject<Studio[]>([]);
  public studios$ = this.studiosSubject.asObservable();
  private client = generateClient<Schema>();

  private allStudios: Studio[] = [];

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Load studios based on initial data source
    console.log('[StudiosService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadStudiosFromAPI();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe(() => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[StudiosService] Data source changed, reloading studios');
      this.loadStudiosFromAPI();
    });
  }

  // Get current user ID (this would normally come from auth service)
  private getCurrentUserId(): string {
    // For demo purposes, return hardcoded user ID
    return 'current_user_id';
  }

  // Update membership and instructor status for all studios
  private async updateStudioMembershipStatus(): Promise<void> {
    try {
      // Get current user
      const session = await fetchAuthSession();
      const userId = session.userSub;
      
      if (!userId) {
        console.log('[StudiosService] No authenticated user, skipping membership status update');
        return;
      }

      // Query StudioMembership table for user's memberships
      const membershipsResult = await (this.client.models as any).StudioMembership.list({
        filter: {
          userId: { eq: userId },
          isActive: { eq: true }
        },
        authMode: 'userPool'
      });

      const memberships = membershipsResult.data || [];
      console.log('[StudiosService] Found', memberships.length, 'active memberships for user');

      // Create maps for quick lookup
      const memberStudioIds = new Set<string>();
      const instructorStudioIds = new Set<string>();
      const adminStudioIds = new Set<string>();

      memberships.forEach((membership: any) => {
        memberStudioIds.add(membership.studioId);
        
        if (membership.membershipType === 'instructor' || membership.membershipType === 'admin') {
          instructorStudioIds.add(membership.studioId);
        }
        
        if (membership.membershipType === 'admin') {
          adminStudioIds.add(membership.studioId);
        }
      });

      // Also check if user is owner/chief of any studios
      const ownedStudiosResult = await (this.client.models as any).Studio.list({
        filter: {
          or: [
            { ownerId: { eq: userId } },
            { headInstructorId: { eq: userId } },
            { studioChiefId: { eq: userId } }
          ]
        },
        authMode: 'userPool'
      });

      const ownedStudios = ownedStudiosResult.data || [];
      ownedStudios.forEach((studio: any) => {
        if (studio.ownerId === userId || studio.studioChiefId === userId || studio.headInstructorId === userId) {
          instructorStudioIds.add(studio.id);
          adminStudioIds.add(studio.id);
        }
      });

      // Update all studios with membership status
      this.allStudios.forEach(studio => {
        studio.isMember = memberStudioIds.has(studio.id);
        studio.isInstructor = instructorStudioIds.has(studio.id);
        studio.isStudioChief = adminStudioIds.has(studio.id);
      });

      console.log('[StudiosService] Updated membership status:', {
        member: memberStudioIds.size,
        instructor: instructorStudioIds.size,
        admin: adminStudioIds.size
      });

    } catch (error) {
      console.error('[StudiosService] Failed to update membership status:', error);
      // Don't throw - just log and continue with default values
    }
  }

  // Get all studios
  getAllStudios(): Studio[] {
    return this.allStudios;
  }

  // Get studio by ID
  getStudioById(id: string): Studio | undefined {
    return this.allStudios.find(studio => studio.id === id);
  }

  // Get studio by name
  getStudioByName(name: string): Studio | undefined {
    return this.allStudios.find(studio => 
      studio.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Get studios by location
  getStudiosByLocation(location: string): Studio[] {
    return this.allStudios.filter(studio => 
      studio.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  // Get studio names mapping (for backward compatibility)
  getStudioNamesMapping(): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    this.allStudios.forEach(studio => {
      mapping[studio.id] = studio.name;
    });
    return mapping;
  }

  // Get user's studio memberships (this would normally come from user service)
  getUserStudioMemberships(): string[] {
    // For demo purposes, return hardcoded memberships
    return ['studio_1', 'studio_2'];
  }

  // Get user's instructor positions (this would normally come from user service)
  getUserInstructorships(): string[] {
    // For demo purposes, return hardcoded instructor positions
    return ['studio_2'];
  }

  // Get user's studio chief positions (this would normally come from user service)
  getUserStudioChiefships(): string[] {
    // For demo purposes, return hardcoded studio chief positions
    // In this case, the current user is the studio chief of Austin Aikido Center (studio_2)
    // Studio chiefs have full management access to their studios
    // Only studio chiefs can access the studio management page and see the management button
    return ['studio_2'];
  }

  // Get studios where user is a member
  getUserStudios(): Studio[] {
    return this.allStudios.filter(studio => studio.isMember);
  }

  // Get studios where user is an instructor
  getUserInstructorStudios(): Studio[] {
    return this.allStudios.filter(studio => studio.isInstructor);
  }

  // Get studios where user is a studio chief
  getUserStudioChiefStudios(): Studio[] {
    return this.allStudios.filter(studio => studio.isStudioChief);
  }

  // Get studios with enhanced filtering
  async getStudiosWithMembershipInfo(): Promise<Studio[]> {
    await this.updateStudioMembershipStatus();
    return this.allStudios;
  }

  // Search studios
  searchStudios(query: string): Studio[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allStudios;

    return this.allStudios.filter(studio => 
      studio.name.toLowerCase().includes(searchTerm) ||
      studio.location.toLowerCase().includes(searchTerm) ||
      studio.description.toLowerCase().includes(searchTerm) ||
      studio.tagline.toLowerCase().includes(searchTerm)
    );
  }

  // Create a new studio
  async createStudio(studioData: Partial<Studio>): Promise<Studio> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Studios Service] Creating studio in MOCK mode (local only)');
      // Create studio locally only
      const newStudio: Studio = {
        id: `studio_${Date.now()}`,
        name: studioData.name || 'New Studio',
        location: studioData.location || '',
        address: studioData.address || '',
        city: studioData.city || '',
        state: studioData.state || '',
        zipCode: studioData.zipCode || '00000',
        country: studioData.country || 'USA',
        phone: studioData.phone || '',
        email: studioData.email || '',
        website: studioData.website || '',
        description: studioData.description || '',
        tagline: studioData.tagline || '',
        heroImage: studioData.heroImage || '',
        primaryArt: studioData.primaryArt || '',
        verified: studioData.verified || false,
        isVerified: studioData.isVerified || false,
        memberCount: studioData.memberCount || 0,
        instructorCount: studioData.instructorCount || 0,
        established: studioData.established || '',
        establishedYear: studioData.establishedYear || undefined,
        facilities: studioData.facilities || [],
        amenities: studioData.amenities || [],
        headInstructorId: studioData.headInstructorId,
        studioChiefId: studioData.studioChiefId,
        instructors: studioData.instructors || [],
        schedule: studioData.schedule || [],
        pricing: studioData.pricing || [],
        benefits: studioData.benefits || [],
        isMember: studioData.isMember || false,
        isInstructor: studioData.isInstructor || false,
        isStudioChief: studioData.isStudioChief || false
      };
      
      this.allStudios.push(newStudio);
      this.studiosSubject.next(this.allStudios);
      console.log('[Studios Service] Studio created locally:', newStudio.id);
      return newStudio;
    }
    
    // Database mode - create in remote database
    console.log('[Studios Service] Creating studio in DATABASE mode');
    try {
      // Parse location to extract city and state if provided
      let city = studioData.city || '';
      let state = studioData.state || '';
      
      // If location is provided but city/state are not, try to parse location
      if (studioData.location && !city && !state) {
        const locationParts = studioData.location.split(',').map(p => p.trim());
        if (locationParts.length >= 2) {
          city = locationParts[0];
          state = locationParts[1];
        } else if (locationParts.length === 1) {
          city = locationParts[0];
        }
      }
      
      // First create the studio without instructors
      const createData: any = {
        name: studioData.name || 'New Studio',
        description: studioData.description || '',
        address: studioData.address || '',
        city: city || 'Unknown',
        state: state || 'Unknown',
        zipCode: studioData.zipCode || '00000',
        country: studioData.country || 'USA',
        phone: studioData.phone || '',
        email: studioData.email || '',
        website: studioData.website || '',
        primaryArt: studioData.primaryArt || '',
        instructorCount: studioData.instructorCount || 0,
        memberCount: studioData.memberCount || 0,
        establishedYear: studioData.establishedYear || null,
        facilities: studioData.facilities || [],
        amenities: studioData.amenities || [],
        isVerified: studioData.isVerified || false,
        // Legacy fields for backwards compatibility
        location: studioData.location || '',
        tagline: studioData.tagline || '',
        heroImage: studioData.heroImage || '',
        verified: studioData.verified || false,
        established: studioData.established || '',
        isMember: studioData.isMember || false,
        isInstructor: studioData.isInstructor || false
      };

      // Only add schedule and benefits if they have data
      if (studioData.schedule && studioData.schedule.length > 0) {
        try {
          // Validate and clean the schedule data
          const validSchedule = studioData.schedule.map(item => ({
            id: String(item.id || ''),
            title: String(item.title || ''),
            startDate: String(item.startDate || ''),
            endDate: String(item.endDate || ''),
            startTime: String(item.startTime || ''),
            endTime: String(item.endTime || ''),
            instructor: String(item.instructor || ''),
            level: String(item.level || ''),
            description: String(item.description || ''),
            isRecurring: Boolean(item.isRecurring),
            recurrencePattern: String(item.recurrencePattern || ''),
            recurrenceEnd: String(item.recurrenceEnd || ''),
            color: String(item.color || '#3880ff'),
            location: String(item.location || '')
          }));
          createData.schedule = JSON.stringify(validSchedule);
          console.log('Schedule data being sent:', JSON.stringify(validSchedule, null, 2));
        } catch (error) {
          console.warn('Invalid schedule data, skipping:', error);
        }
      }
      if (studioData.benefits && studioData.benefits.length > 0) {
        try {
          // Validate and clean the benefits data
          const validBenefits = studioData.benefits.map(item => ({
            icon: String(item.icon || ''),
            title: String(item.title || ''),
            description: String(item.description || '')
          }));
          createData.benefits = JSON.stringify(validBenefits);
          console.log('Benefits data being sent:', JSON.stringify(validBenefits, null, 2));
        } catch (error) {
          console.warn('Invalid benefits data, skipping:', error);
        }
      }

      console.log('Final createData being sent to GraphQL:', JSON.stringify(createData, null, 2));
      const studioResult = await (this.client.models as any)['Studio'].create(createData, {
        authMode: 'userPool'
      });

      if (studioResult.errors) {
        throw new Error(`GraphQL errors: ${studioResult.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (!studioResult.data) {
        throw new Error('Failed to create studio - no data returned');
      }

      const createdStudio = studioResult.data;
      const studioId = createdStudio.id;

      // Create instructors separately and link them to the studio
      const createdInstructors: Instructor[] = [];
      if (studioData.instructors && studioData.instructors.length > 0) {
        for (const instructorData of studioData.instructors) {
          try {
            // Create Person record
            const personResult = await (this.client.models as any)['Person'].create({
              name: instructorData.name,
              username: instructorData.username,
              avatar: instructorData.image || '',
              bio: instructorData.bio || '',
              rank: instructorData.rank || '',
              experience: instructorData.experience || '',
              title: instructorData.title || '',
              email: instructorData.email || '',
              phone: instructorData.phone || '',
              specialties: instructorData.specialties || [],
              certifications: instructorData.certifications || [],
              isActive: instructorData.isActive ?? true
            });

            if (personResult.data) {
              const personId = personResult.data.id;
              
              // Create PersonStudio relationship
              await (this.client.models as any)['PersonStudio'].create({
                personId: personId,
                studioId: studioId,
                role: instructorData.title?.toLowerCase().includes('chief') ? 'studio_chief' : 
                      instructorData.title?.toLowerCase().includes('head') ? 'head_instructor' : 'instructor',
                isActive: instructorData.isActive ?? true
              });

              createdInstructors.push({
                id: personId,
                name: personResult.data.name,
                username: personResult.data.username,
                title: personResult.data.title || '',
                rank: personResult.data.rank || '',
                bio: personResult.data.bio || '',
                image: personResult.data.avatar || '',
                experience: personResult.data.experience || '',
                email: personResult.data.email || '',
                phone: personResult.data.phone || '',
                specialties: personResult.data.specialties || [],
                certifications: personResult.data.certifications || [],
                isActive: personResult.data.isActive ?? true,
                studioId: studioId
              });
            }
          } catch (instructorError) {
            console.warn('Failed to create instructor:', instructorError);
          }
        }
      }

      // Update studio with head instructor and studio chief IDs if specified
      let headInstructorId = studioData.headInstructorId;
      let studioChiefId = studioData.studioChiefId;

      // If IDs were provided but don't match created instructors, try to find matches
      if (headInstructorId && !createdInstructors.find(i => i.id === headInstructorId)) {
        const headInstructor = createdInstructors.find(i => i.id === headInstructorId);
        headInstructorId = headInstructor?.id || undefined;
      }

      if (studioChiefId && !createdInstructors.find(i => i.id === studioChiefId)) {
        const studioChief = createdInstructors.find(i => i.id === studioChiefId);
        studioChiefId = studioChief?.id || undefined;
      }

      // Update studio with leadership IDs if we have them
      if (headInstructorId || studioChiefId) {
        await (this.client.models as any)['Studio'].update({
          id: studioId,
          headInstructorId: headInstructorId,
          studioChiefId: studioChiefId
        });
      }

      const result = studioResult;

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const createdStudio = result.data;
        const newStudio: Studio = {
          id: createdStudio.id,
          name: createdStudio.name,
          location: createdStudio.location,
          address: createdStudio.address,
          phone: createdStudio.phone || '',
          email: createdStudio.email || '',
          website: createdStudio.website || '',
          description: createdStudio.description,
          tagline: createdStudio.tagline || '',
          heroImage: createdStudio.heroImage || '',
          verified: createdStudio.verified || false,
          memberCount: createdStudio.memberCount || 0,
          established: createdStudio.established || '',
          headInstructorId: createdStudio.headInstructorId,
          studioChiefId: createdStudio.studioChiefId,
          instructors: createdInstructors,
          schedule: (createdStudio.schedule as ClassSchedule[]) || [],
          pricing: [], // Not stored in schema, use default empty array
          benefits: (createdStudio.benefits as Benefit[]) || [],
          isMember: createdStudio.isMember || false,
          isInstructor: createdStudio.isInstructor || false,
          isStudioChief: createdStudio.isStudioChief || false
        };

        this.allStudios.push(newStudio);
        this.studiosSubject.next(this.allStudios);
        console.log('Studio successfully created in DynamoDB:', newStudio);
        return newStudio;
      }

      throw new Error('Failed to create studio - no data returned');
    } catch (error) {
      console.error('Failed to create studio in DynamoDB:', error);
      throw new Error(`Failed to create studio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update studio
  async updateStudio(id: string, updates: Partial<Studio>): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Studios Service] Updating studio in MOCK mode (local only):', id);
      // Update locally only
      const index = this.allStudios.findIndex(studio => studio.id === id);
      if (index !== -1) {
        this.allStudios[index] = { ...this.allStudios[index], ...updates };
        this.studiosSubject.next(this.allStudios);
        console.log('[Studios Service] Studio updated locally');
        return true;
      }
      return false;
    }
    
    // Database mode - update in remote database
    console.log('[Studios Service] Updating studio in DATABASE mode:', id);
    try {
      const updateData: any = { id };
      
      // Handle each field carefully
      Object.keys(updates).forEach(key => {
        if (key === 'schedule' && updates.schedule) {
          if (updates.schedule.length > 0) {
            updateData.schedule = updates.schedule.map(item => ({
              id: String(item.id || ''),
              title: String(item.title || ''),
              startDate: String(item.startDate || ''),
              endDate: String(item.endDate || ''),
              startTime: String(item.startTime || ''),
              endTime: String(item.endTime || ''),
              instructor: String(item.instructor || ''),
              level: String(item.level || ''),
              description: String(item.description || ''),
              isRecurring: Boolean(item.isRecurring),
              recurrencePattern: String(item.recurrencePattern || ''),
              recurrenceEnd: String(item.recurrenceEnd || ''),
              color: String(item.color || '#3880ff'),
              location: String(item.location || '')
            }));
          }
        } else if (key === 'benefits' && updates.benefits) {
          if (updates.benefits.length > 0) {
            updateData.benefits = updates.benefits.map(item => ({
              icon: String(item.icon || ''),
              title: String(item.title || ''),
              description: String(item.description || '')
            }));
          }
        } else if (key !== 'instructors' && key !== 'pricing') {
          // Skip instructors and pricing as they're not stored in the schema
          updateData[key] = (updates as any)[key];
        }
      });

      console.log('Update data being sent to GraphQL:', JSON.stringify(updateData, null, 2));
      const result = await (this.client.models as any)['Studio'].update(updateData, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const index = this.allStudios.findIndex(studio => studio.id === id);
        if (index !== -1) {
          this.allStudios[index] = { ...this.allStudios[index], ...updates };
          this.studiosSubject.next(this.allStudios);
        }
        console.log('Studio successfully updated in DynamoDB');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update studio in DynamoDB:', error);
      throw new Error(`Failed to update studio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Remove studio
  async removeStudio(id: string): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Studios Service] Deleting studio in MOCK mode (local only):', id);
      // Delete locally only
      const index = this.allStudios.findIndex(studio => studio.id === id);
      if (index !== -1) {
        this.allStudios.splice(index, 1);
        this.studiosSubject.next(this.allStudios);
        console.log('[Studios Service] Studio deleted locally');
        return true;
      }
      return false;
    }
    
    // Database mode - delete from remote database
    console.log('[Studios Service] Deleting studio in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Studio'].delete({
        id
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const index = this.allStudios.findIndex(studio => studio.id === id);
      if (index !== -1) {
        this.allStudios.splice(index, 1);
        this.studiosSubject.next(this.allStudios);
      }
      console.log('Studio successfully deleted from DynamoDB');
      return true;
    } catch (error) {
      console.error('Failed to delete studio from DynamoDB:', error);
      throw new Error(`Failed to delete studio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load studios from GraphQL API or mock data
  private async loadStudiosFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[StudiosService] Clearing cached studios data');
      this.allStudios = [];
      this.studiosSubject.next(this.allStudios);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('[Studios Service] Loading studios from mock data');
        const mockStudios = this.mockDataService.getMockStudios();
        // Convert mock data to Studio interface
        this.allStudios = mockStudios.map((ms: any) => ({
          id: ms.id,
          name: ms.name,
          location: `${ms.city}, ${ms.state}`,
          address: ms.address,
          phone: ms.phone || '',
          email: ms.email || '',
          website: ms.website || '',
          description: ms.description,
          tagline: '',
          heroImage: ms.heroImage || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format',
          verified: ms.isVerified || false,
          memberCount: ms.memberCount || 0,
          established: ms.establishedYear?.toString() || '',
          instructors: [],
          schedule: [],
          pricing: [],
          benefits: [],
          isMember: false,
          isInstructor: false,
          isStudioChief: false
        }));
        this.studiosSubject.next(this.allStudios);
        console.log('[Studios Service] Loaded', this.allStudios.length, 'mock studios');
        return;
      }

      // Load from database
      console.log('[Studios Service] Loading studios from database');
      
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
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timeout after 10 seconds')), 10000)
      );
      
      const apiPromise = (this.client.models as any)['Studio'].list({
        authMode
      });
      
      const result = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiStudios = result.data || [];

      if (apiStudios && Array.isArray(apiStudios) && apiStudios.length > 0) {
        const convertedStudios: Studio[] = apiStudios.map((apiStudio: any) => {
          let schedule: ClassSchedule[] = [];
          let benefits: Benefit[] = [];
          
          try {
            if (apiStudio.schedule) {
              schedule = typeof apiStudio.schedule === 'string' 
                ? JSON.parse(apiStudio.schedule) 
                : apiStudio.schedule;
            }
          } catch (e) {
            console.warn('[Studios Service] Failed to parse schedule for studio:', apiStudio.id, e);
          }
          
          try {
            if (apiStudio.benefits) {
              benefits = typeof apiStudio.benefits === 'string'
                ? JSON.parse(apiStudio.benefits)
                : apiStudio.benefits;
            }
          } catch (e) {
            console.warn('[Studios Service] Failed to parse benefits for studio:', apiStudio.id, e);
          }
          
          return {
            id: apiStudio.id,
            name: apiStudio.name,
            location: apiStudio.location || `${apiStudio.city}, ${apiStudio.state}`,
            address: apiStudio.address,
            phone: apiStudio.phone || '',
            email: apiStudio.email || '',
            website: apiStudio.website || '',
            description: apiStudio.description,
            tagline: apiStudio.tagline || '',
            heroImage: apiStudio.heroImage || '',
            verified: apiStudio.verified || false,
            memberCount: apiStudio.memberCount || 0,
            established: apiStudio.established || '',
            headInstructorId: apiStudio.headInstructorId,
            studioChiefId: apiStudio.studioChiefId,
            instructors: [], // Will be loaded separately via PersonStudio relationships
            schedule: schedule,
            pricing: [], // Not stored in schema, use default empty array
            benefits: benefits,
            isMember: apiStudio.isMember || false,
            isInstructor: apiStudio.isInstructor || false,
            isStudioChief: apiStudio.isStudioChief || false
          };
        });

        // Merge API studios with local studios
        const mergedStudios = [...this.allStudios];
        
        convertedStudios.forEach((apiStudio: Studio) => {
          const existingIndex = mergedStudios.findIndex(studio => studio.id === apiStudio.id);
          if (existingIndex >= 0) {
            mergedStudios[existingIndex] = apiStudio;
          } else {
            mergedStudios.push(apiStudio);
          }
        });
        
        this.allStudios = mergedStudios;
        await this.updateStudioMembershipStatus();
        this.studiosSubject.next(this.allStudios);
        console.log('[Studios Service] Successfully loaded', convertedStudios.length, 'studios from API');
      } else {
        console.log('[Studios Service] No studios returned from API, using local data');
        // Ensure local studios are still emitted
        this.studiosSubject.next(this.allStudios);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[Studios Service] Failed to load studios from API:', errorMessage);
      
      // Log more details for debugging
      if (error instanceof Error && error.stack) {
        console.warn('[Studios Service] Error stack:', error.stack);
      }
      
      console.log('[Studios Service] Using local fallback data with', this.allStudios.length, 'studios');
      // Ensure local studios are available as fallback
      this.studiosSubject.next(this.allStudios);
    }
  }

  // Refresh studios from API
  async refreshStudiosFromAPI(): Promise<void> {
    console.log('[Studios Service] Manual refresh requested');
    await this.loadStudiosFromAPI();
  }

  // Force emit local studios (for debugging and ensuring data is available)
  async forceEmitLocalStudios(): Promise<void> {
    console.log('[Studios Service] Force emitting local studios:', this.allStudios.length);
    await this.updateStudioMembershipStatus();
    this.studiosSubject.next(this.allStudios);
  }

  // Helper method to get head instructor from studio
  getHeadInstructor(studio: Studio): Instructor | undefined {
    if (!studio.headInstructorId) return undefined;
    return studio.instructors.find(i => i.id === studio.headInstructorId);
  }

  // Helper method to get studio chief from studio
  getStudioChief(studio: Studio): Instructor | undefined {
    if (!studio.studioChiefId) return undefined;
    return studio.instructors.find(i => i.id === studio.studioChiefId);
  }

  // Helper method to enrich studio with computed properties
  enrichStudio(studio: Studio): Studio {
    return {
      ...studio,
      headInstructor: this.getHeadInstructor(studio),
      studioChief: this.getStudioChief(studio)
    };
  }

  /**
   * Load instructors for a studio from StudioMembership table
   */
  async loadStudioInstructors(studioId: string): Promise<Instructor[]> {
    try {
      console.log('[Studios Service] Loading instructors for studio:', studioId);

      // Query StudioMembership for instructors
      const result = await (this.client.models as any).StudioMembership.list({
        filter: {
          studioId: { eq: studioId },
          isActive: { eq: true },
          membershipType: { eq: 'instructor' }
        }
      });

      if (result.errors || !result.data) {
        console.error('[Studios Service] Failed to load instructors:', result.errors);
        return [];
      }

      const instructorUserIds = result.data.map((membership: any) => membership.userId);
      console.log('[Studios Service] Found', instructorUserIds.length, 'instructor memberships');

      if (instructorUserIds.length === 0) {
        return [];
      }

      // Load Person records for these instructors
      const instructors: Instructor[] = [];
      
      for (const userId of instructorUserIds) {
        try {
          const personResult = await (this.client.models as any).Person.list({
            filter: {
              userId: { eq: userId }
            }
          });

          if (personResult.data && personResult.data.length > 0) {
            const person = personResult.data[0];
            instructors.push({
              id: person.id,
              name: person.displayName || person.name || 'Unknown',
              username: person.username || person.handle || '',
              title: person.isInstructor ? 'Instructor' : '',
              image: person.profileImage || person.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg',
              bio: person.bio || '',
              rank: person.rank || '',
              experience: person.experience || '',
              specialties: person.specialties || [],
              certifications: [],
              isActive: true,
              email: '',
              phone: ''
            });
          }
        } catch (error) {
          console.error('[Studios Service] Failed to load person for instructor:', userId, error);
        }
      }

      console.log('[Studios Service] Loaded', instructors.length, 'instructors');
      return instructors;
    } catch (error) {
      console.error('[Studios Service] Failed to load studio instructors:', error);
      return [];
    }
  }

  /**
   * Load studio with full member data (instructors and students)
   */
  async loadStudioWithMembers(studioId: string): Promise<Studio | undefined> {
    const studio = this.getStudioById(studioId);
    if (!studio) {
      console.error('[Studios Service] Studio not found:', studioId);
      return undefined;
    }

    console.log('[Studios Service] Loading members for studio:', studio.name);

    // Load instructors
    const instructors = await this.loadStudioInstructors(studioId);
    studio.instructors = instructors;

    // Update the studio in allStudios array
    const index = this.allStudios.findIndex(s => s.id === studioId);
    if (index !== -1) {
      this.allStudios[index] = studio;
      this.studiosSubject.next(this.allStudios);
    }

    return this.enrichStudio(studio);
  }
}
