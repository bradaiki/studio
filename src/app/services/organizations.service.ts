import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';

export interface Organization {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  heroImage: string;
  description: string;
  founded: string;
  headquarters: string;
  website: string;
  email: string;
  phone: string;
  verified: boolean;
  memberCount: number;
  dojoCount: number;
  countryCount: number;
  philosophy?: {
    quote: string;
    attribution: string;
    description: string;
    image?: string;
  };
  statistics: Statistic[];
  programs: Program[];
  memberDojos: Dojo[];
  upcomingEvents: OrganizationEvent[];
  lineageFeatures: LineageFeature[];
  contact: ContactInfo;
  socialMedia: SocialMedia[];
  leadership: Leader[];
  achievements: Achievement[];
}

export interface Statistic {
  number: string;
  label: string;
}

export interface Program {
  name: string;
  description: string;
  level: string;
  duration: string;
  certification: string;
}

export interface Dojo {
  id: string;
  name: string;
  location: string;
  instructor: string;
  rank: string;
  students: number;
  established: string;
  image: string;
}

export interface OrganizationEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: 'seminar' | 'tournament' | 'testing' | 'workshop' | 'meetup';
  instructor: string;
  cost: string;
}

export interface LineageFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
}

export interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
  url: string;
  username?: string;
}

export interface Leader {
  id: string;
  name: string;
  title: string;
  rank: string;
  bio: string;
  image: string;
  yearsWithOrg: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'recognition' | 'milestone' | 'expansion' | 'certification';
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {
  private organizationsSubject = new BehaviorSubject<Organization[]>([]);
  public organizations$ = this.organizationsSubject.asObservable();

  private allOrganizations: Organization[] = [];

  private client = generateClient();

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Load organizations based on initial data source
    console.log('[OrganizationsService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadOrganizationsFromAPI();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe((source) => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[OrganizationsService] Data source changed, reloading organizations');
      this.loadOrganizationsFromAPI();
    });
  }

  // Get all organizations
  getAllOrganizations(): Organization[] {
    return this.allOrganizations;
  }

  // Get organization by ID
  getOrganizationById(id: string): Organization | undefined {
    return this.allOrganizations.find(org => org.id === id);
  }

  // Get organization by name
  getOrganizationByName(name: string): Organization | undefined {
    return this.allOrganizations.find(org => 
      org.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Get organizations by location
  getOrganizationsByLocation(location: string): Organization[] {
    return this.allOrganizations.filter(org => 
      org.headquarters.toLowerCase().includes(location.toLowerCase())
    );
  }

  // Search organizations
  searchOrganizations(query: string): Organization[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allOrganizations;

    return this.allOrganizations.filter(org => 
      org.name.toLowerCase().includes(searchTerm) ||
      org.tagline.toLowerCase().includes(searchTerm) ||
      org.description.toLowerCase().includes(searchTerm) ||
      org.mission.toLowerCase().includes(searchTerm) ||
      org.headquarters.toLowerCase().includes(searchTerm)
    );
  }

  // Get organizations stats
  getOrganizationsStats(): { 
    totalOrgs: number; 
    totalMembers: number; 
    totalDojos: number; 
    totalCountries: number; 
  } {
    const totalOrgs = this.allOrganizations.length;
    const totalMembers = this.allOrganizations.reduce((sum, org) => sum + org.memberCount, 0);
    const totalDojos = this.allOrganizations.reduce((sum, org) => sum + org.dojoCount, 0);
    const totalCountries = Math.max(...this.allOrganizations.map(org => org.countryCount));

    return { totalOrgs, totalMembers, totalDojos, totalCountries };
  }

  // Create a new organization
  async createOrganization(orgData: Partial<Organization>): Promise<Organization> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Organizations Service] Creating organization in MOCK mode (local only)');
      // Create locally only
      const newOrg: Organization = {
        id: `org_${Date.now()}`,
        name: orgData.name || 'New Organization',
        tagline: orgData.tagline || '',
        mission: orgData.mission || '',
        heroImage: orgData.heroImage || '',
        description: orgData.description || '',
        founded: orgData.founded || '',
        headquarters: orgData.headquarters || '',
        website: orgData.website || '',
        email: orgData.email || '',
        phone: orgData.phone || '',
        verified: orgData.verified || false,
        memberCount: orgData.memberCount || 0,
        dojoCount: orgData.dojoCount || 0,
        countryCount: orgData.countryCount || 0,
        philosophy: orgData.philosophy,
        statistics: orgData.statistics || [],
        programs: orgData.programs || [],
        memberDojos: orgData.memberDojos || [],
        upcomingEvents: orgData.upcomingEvents || [],
        lineageFeatures: orgData.lineageFeatures || [],
        contact: orgData.contact || { email: '', phone: '', website: '' },
        socialMedia: orgData.socialMedia || [],
        leadership: orgData.leadership || [],
        achievements: orgData.achievements || []
      };
      
      this.allOrganizations.push(newOrg);
      this.organizationsSubject.next(this.allOrganizations);
      console.log('[Organizations Service] Organization created locally:', newOrg.id);
      return newOrg;
    }
    
    // Database mode - create in remote database
    console.log('[Organizations Service] Creating organization in DATABASE mode');
    try {
      const result = await (this.client.models as any)['Organization'].create({
        name: orgData.name || 'New Organization',
        tagline: orgData.tagline || '',
        mission: orgData.mission || '',
        heroImage: orgData.heroImage || '',
        description: orgData.description || '',
        founded: orgData.founded || '',
        headquarters: orgData.headquarters || '',
        website: orgData.website || '',
        email: orgData.email || '',
        phone: orgData.phone || '',
        verified: orgData.verified || false,
        memberCount: orgData.memberCount || 0,
        dojoCount: orgData.dojoCount || 0,
        countryCount: orgData.countryCount || 0,
        philosophy: orgData.philosophy || {},
        statistics: orgData.statistics || [],
        programs: orgData.programs || [],
        memberDojos: orgData.memberDojos || [],
        upcomingEvents: orgData.upcomingEvents || [],
        lineageFeatures: orgData.lineageFeatures || []
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const createdOrg = result.data;
        const newOrg: Organization = {
          id: createdOrg.id,
          name: createdOrg.name,
          tagline: createdOrg.tagline || '',
          mission: createdOrg.mission || '',
          heroImage: createdOrg.heroImage || '',
          description: createdOrg.description,
          founded: createdOrg.founded || '',
          headquarters: createdOrg.headquarters || '',
          website: createdOrg.website || '',
          email: createdOrg.email || '',
          phone: createdOrg.phone || '',
          verified: createdOrg.verified || false,
          memberCount: createdOrg.memberCount || 0,
          dojoCount: createdOrg.dojoCount || 0,
          countryCount: createdOrg.countryCount || 0,
          philosophy: (createdOrg.philosophy as any) || {},
          statistics: (createdOrg.statistics as Statistic[]) || [],
          programs: (createdOrg.programs as Program[]) || [],
          memberDojos: (createdOrg.memberDojos as Dojo[]) || [],
          upcomingEvents: (createdOrg.upcomingEvents as OrganizationEvent[]) || [],
          lineageFeatures: (createdOrg.lineageFeatures as LineageFeature[]) || [],
          contact: {
            email: createdOrg.email || '',
            phone: createdOrg.phone || '',
            website: createdOrg.website || ''
          },
          socialMedia: [],
          leadership: [],
          achievements: []
        };

        this.allOrganizations.push(newOrg);
        this.organizationsSubject.next(this.allOrganizations);
        console.log('Organization successfully created in DynamoDB:', newOrg);
        return newOrg;
      }

      throw new Error('Failed to create organization - no data returned');
    } catch (error) {
      console.error('Failed to create organization in DynamoDB:', error);
      throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add new organization (for backward compatibility)
  addOrganization(organization: Organization): void {
    this.allOrganizations.push(organization);
    this.organizationsSubject.next(this.allOrganizations);
  }

  // Update organization
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Organizations Service] Updating organization in MOCK mode (local only):', id);
      // Update locally only
      const index = this.allOrganizations.findIndex(org => org.id === id);
      if (index !== -1) {
        this.allOrganizations[index] = { ...this.allOrganizations[index], ...updates };
        this.organizationsSubject.next(this.allOrganizations);
        console.log('[Organizations Service] Organization updated locally');
        return true;
      }
      return false;
    }
    
    // Database mode - update in remote database
    console.log('[Organizations Service] Updating organization in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Organization'].update({
        id,
        ...updates
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const index = this.allOrganizations.findIndex(org => org.id === id);
        if (index !== -1) {
          this.allOrganizations[index] = { ...this.allOrganizations[index], ...updates };
          this.organizationsSubject.next(this.allOrganizations);
        }
        console.log('Organization successfully updated in DynamoDB');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update organization in DynamoDB:', error);
      throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Remove organization
  async removeOrganization(id: string): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Organizations Service] Deleting organization in MOCK mode (local only):', id);
      // Delete locally only
      const index = this.allOrganizations.findIndex(org => org.id === id);
      if (index !== -1) {
        this.allOrganizations.splice(index, 1);
        this.organizationsSubject.next(this.allOrganizations);
        console.log('[Organizations Service] Organization deleted locally');
        return true;
      }
      return false;
    }
    
    // Database mode - delete from remote database
    console.log('[Organizations Service] Deleting organization in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Organization'].delete({
        id
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const index = this.allOrganizations.findIndex(org => org.id === id);
      if (index !== -1) {
        this.allOrganizations.splice(index, 1);
        this.organizationsSubject.next(this.allOrganizations);
      }
      console.log('Organization successfully deleted from DynamoDB');
      return true;
    } catch (error) {
      console.error('Failed to delete organization from DynamoDB:', error);
      throw new Error(`Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load organizations from GraphQL API or mock data
  private async loadOrganizationsFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[OrganizationsService] Clearing cached organizations data');
      this.allOrganizations = [];
      this.organizationsSubject.next(this.allOrganizations);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('Loading organizations from mock data');
        const mockOrgs = this.mockDataService.getMockOrganizations();
        // Convert mock data to Organization interface
        this.allOrganizations = mockOrgs.map((mo: any) => ({
          id: mo.id,
          name: mo.name,
          tagline: '',
          mission: mo.description,
          heroImage: mo.heroImage || 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
          description: mo.description,
          founded: mo.foundedYear?.toString() || '',
          headquarters: mo.headquarters || '',
          website: mo.website || '',
          email: mo.contactEmail || '',
          phone: '',
          verified: mo.isVerified || false,
          memberCount: mo.memberCount || 0,
          dojoCount: 0,
          countryCount: 0,
          statistics: [],
          programs: [],
          memberDojos: [],
          upcomingEvents: [],
          lineageFeatures: [],
          contact: {
            email: mo.contactEmail || '',
            phone: '',
            website: mo.website || ''
          },
          socialMedia: [],
          leadership: [],
          achievements: []
        }));
        this.organizationsSubject.next(this.allOrganizations);
        console.log('Loaded', this.allOrganizations.length, 'mock organizations');
        return;
      }

      // Load from database
      console.log('Loading organizations from database');
      
      const result = await (this.client.models as any)['Organization'].list({
        authMode: 'userPool'
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiOrganizations = result.data;

      if (apiOrganizations && Array.isArray(apiOrganizations)) {
        const convertedOrganizations: Organization[] = apiOrganizations.map((apiOrg: any) => ({
          id: apiOrg.id,
          name: apiOrg.name,
          tagline: apiOrg.tagline || '',
          mission: apiOrg.mission || apiOrg.description || '',
          heroImage: apiOrg.heroImage || '',
          description: apiOrg.description,
          founded: apiOrg.founded || apiOrg.foundedYear?.toString() || '',
          headquarters: apiOrg.headquarters || '',
          website: apiOrg.website || '',
          email: apiOrg.email || apiOrg.contactEmail || '',
          phone: apiOrg.phone || '',
          verified: apiOrg.verified || apiOrg.isVerified || false,
          memberCount: apiOrg.memberCount || 0,
          dojoCount: apiOrg.dojoCount || 0,
          countryCount: apiOrg.countryCount || 0,
          philosophy: (apiOrg.philosophy as any) || {},
          statistics: (apiOrg.statistics as Statistic[]) || [],
          programs: (apiOrg.programs as Program[]) || [],
          memberDojos: (apiOrg.memberDojos as Dojo[]) || [],
          upcomingEvents: (apiOrg.upcomingEvents as OrganizationEvent[]) || [],
          lineageFeatures: (apiOrg.lineageFeatures as LineageFeature[]) || [],
          contact: {
            email: apiOrg.email || apiOrg.contactEmail || '',
            phone: apiOrg.phone || '',
            website: apiOrg.website || ''
          },
          socialMedia: [],
          leadership: [],
          achievements: []
        }));
        
        this.allOrganizations = convertedOrganizations;
        this.organizationsSubject.next(this.allOrganizations);
        console.log('Successfully loaded organizations from database');
      } else {
        this.allOrganizations = [];
        this.organizationsSubject.next(this.allOrganizations);
      }
    } catch (error) {
      console.warn('Failed to load organizations:', error);
      this.allOrganizations = [];
      this.organizationsSubject.next(this.allOrganizations);
    }
  }

  // Refresh organizations from API
  async refreshOrganizationsFromAPI(): Promise<void> {
    await this.loadOrganizationsFromAPI();
  }
}