import { Injectable } from '@angular/core';
import { Art } from './arts.service';
import { 
  MOCK_ARTS, 
  MOCK_ORGANIZATIONS, 
  generateMockStudios, 
  generateMockPeople, 
  generateMockPosts, 
  generateMockEvents 
} from '../data/shared-mock-data';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private cachedStudios: any[] | null = null;
  private cachedPeople: any[] | null = null;
  private cachedPosts: any[] | null = null;
  private cachedEvents: any[] | null = null;

  constructor() {}

  // Mock Arts Data (5 arts)
  getMockArts(): Art[] {
    return MOCK_ARTS.map((art, index) => ({
      ...art,
      id: `mock-art-${index + 1}`,
      isUserPracticing: false
    })) as Art[];
  }

  // Mock Organizations (11 organizations)
  getMockOrganizations(): any[] {
    return MOCK_ORGANIZATIONS.map((org, index) => ({
      ...org,
      id: `mock-org-${index + 1}`
    }));
  }

  // Mock Studios (107 studios) - cached for performance
  getMockStudios(): any[] {
    if (!this.cachedStudios) {
      this.cachedStudios = generateMockStudios(107).map((studio, index) => ({
        ...studio,
        id: `mock-studio-${index + 1}`,
        isMember: index < 15, // First 15 studios are member studios
        isInstructor: index < 8, // First 8 studios user is an instructor
        isStudioChief: index < 3 // First 3 studios user is studio chief
      }));
    }
    return this.cachedStudios;
  }

  // Mock People (154 people) - cached for performance
  getMockPeople(): any[] {
    if (!this.cachedPeople) {
      this.cachedPeople = generateMockPeople(154).map((person, index) => ({
        ...person,
        id: `mock-person-${index + 1}`
      }));
    }
    return this.cachedPeople;
  }

  // Mock Posts (153 posts) - cached for performance
  getMockPosts(): any[] {
    if (!this.cachedPosts) {
      const people = this.getMockPeople();
      this.cachedPosts = generateMockPosts(153, people).map((post, index) => ({
        ...post,
        id: `mock-post-${index + 1}`
      }));
    }
    return this.cachedPosts;
  }

  // Mock Events (23 events) - cached for performance
  getMockEvents(): any[] {
    if (!this.cachedEvents) {
      const studios = this.getMockStudios();
      this.cachedEvents = generateMockEvents(23, studios).map((event, index) => ({
        ...event,
        id: `mock-event-${index + 1}`
      }));
    }
    return this.cachedEvents;
  }

  // Clear cache (useful for testing or refreshing data)
  clearCache(): void {
    this.cachedStudios = null;
    this.cachedPeople = null;
    this.cachedPosts = null;
    this.cachedEvents = null;
  }

  // Get all mock data at once
  getAllMockData() {
    return {
      arts: this.getMockArts(),
      organizations: this.getMockOrganizations(),
      studios: this.getMockStudios(),
      people: this.getMockPeople(),
      posts: this.getMockPosts(),
      events: this.getMockEvents()
    };
  }

  // Get counts
  getCounts() {
    return {
      arts: this.getMockArts().length,
      organizations: this.getMockOrganizations().length,
      studios: this.getMockStudios().length,
      people: this.getMockPeople().length,
      posts: this.getMockPosts().length,
      events: this.getMockEvents().length
    };
  }
}
