import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { type Schema } from '../../../amplify/data/resource';
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
export class DataSeedingService {
  private client = generateClient<Schema>({ authMode: 'userPool' });

  constructor() {}

  async seedDatabase(): Promise<{ success: boolean; message: string; counts: any }> {
    try {
      // Check authentication
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('Must be authenticated to seed database');
      }

      const counts = {
        arts: 0,
        organizations: 0,
        studios: 0,
        people: 0,
        posts: 0,
        events: 0
      };

      // Seed Arts (5)
      console.log('Seeding arts...');
      const arts = await this.seedArts();
      counts.arts = arts.length;

      // Seed Organizations (11)
      console.log('Seeding organizations...');
      const orgs = await this.seedOrganizations();
      counts.organizations = orgs.length;

      // Seed Studios (107)
      console.log('Seeding studios...');
      const studios = await this.seedStudios();
      counts.studios = studios.length;

      // Seed People (154)
      console.log('Seeding people...');
      const people = await this.seedPeople();
      counts.people = people.length;

      // Seed Posts (153)
      console.log('Seeding posts...');
      const posts = await this.seedPosts(people);
      counts.posts = posts.length;

      // Seed Events (23)
      console.log('Seeding events...');
      const events = await this.seedEvents(studios);
      counts.events = events.length;

      return {
        success: true,
        message: 'Database seeded successfully',
        counts
      };
    } catch (error) {
      console.error('Seeding failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        counts: {}
      };
    }
  }

  private async seedArts(): Promise<any[]> {
    const created = [];
    for (const art of MOCK_ARTS) {
      try {
        const result = await (this.client.models as any)['Art'].create(art);
        if (!result.errors && result.data) {
          created.push(result.data);
        }
      } catch (error) {
        console.warn('Failed to create art:', art.name, error);
      }
    }
    return created;
  }

  private async seedOrganizations(): Promise<any[]> {
    const created = [];
    for (const org of MOCK_ORGANIZATIONS) {
      try {
        // Transform organization data to match schema (exclude heroImage)
        const orgToCreate = {
          name: org.name,
          description: org.description,
          type: org.type,
          foundedYear: org.foundedYear,
          headquarters: org.headquarters,
          memberCount: org.memberCount,
          website: org.website,
          contactEmail: org.contactEmail,
          isVerified: org.isVerified
        };
        
        const result = await (this.client.models as any)['Organization'].create(orgToCreate);
        if (!result.errors && result.data) {
          created.push(result.data);
        } else if (result.errors) {
          console.warn('Failed to create organization:', org.name, result.errors);
        }
      } catch (error) {
        console.warn('Failed to create organization:', org.name, error);
      }
    }
    return created;
  }

  private async seedStudios(): Promise<any[]> {
    const studiosData = generateMockStudios(107);
    const created = [];
    
    for (let index = 0; index < studiosData.length; index++) {
      const studio = studiosData[index];
      try {
        // Transform studio data to match schema
        // Mark first 15 studios as member studios, first 8 as instructor studios, first 3 as studio chief
        const studioToCreate = {
          name: studio.name,
          description: studio.description,
          address: studio.address,
          city: studio.city,
          state: studio.state,
          zipCode: studio.zipCode,
          country: studio.country,
          phone: studio.phone || '',
          email: studio.email || '',
          website: studio.website || '',
          primaryArt: studio.primaryArt || '',
          instructorCount: studio.instructorCount || 0,
          memberCount: studio.memberCount || 0,
          establishedYear: studio.establishedYear || null,
          facilities: studio.facilities || [],
          amenities: studio.amenities || [],
          isVerified: studio.isVerified || false,
          heroImage: studio.heroImage || '',
          isMember: index < 15, // First 15 studios are member studios
          isInstructor: index < 8, // First 8 studios user is an instructor
          isStudioChief: index < 3 // First 3 studios user is studio chief
        };
        
        const result = await (this.client.models as any)['Studio'].create(studioToCreate);
        if (!result.errors && result.data) {
          created.push(result.data);
        } else if (result.errors) {
          console.warn('Failed to create studio:', studio.name, result.errors);
        }
      } catch (error) {
        console.warn('Failed to create studio:', studio.name, error);
      }
    }
    return created;
  }

  private async seedPeople(): Promise<any[]> {
    const peopleData = generateMockPeople(154);
    const created = [];
    
    for (const person of peopleData) {
      try {
        const result = await (this.client.models as any)['Person'].create(person);
        if (!result.errors && result.data) {
          created.push(result.data);
        }
      } catch (error) {
        console.warn('Failed to create person:', person.handle, error);
      }
    }
    return created;
  }

  private async seedPosts(people: any[]): Promise<any[]> {
    const postsData = generateMockPosts(153, people);
    const created = [];
    
    for (const post of postsData) {
      try {
        // Transform post data to match schema
        const postToCreate = {
          content: post.content,
          authorId: post.authorId,
          authorName: post.authorName,
          authorHandle: post.authorHandle,
          authorImage: post.authorImage || '',
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          images: [],
          tags: [],
          isPublic: true
        };
        
        const result = await (this.client.models as any)['Post'].create(postToCreate);
        if (!result.errors && result.data) {
          created.push(result.data);
        } else if (result.errors) {
          console.warn('Failed to create post:', result.errors);
        }
      } catch (error) {
        console.warn('Failed to create post:', error);
      }
    }
    return created;
  }

  private async seedEvents(studios: any[]): Promise<any[]> {
    const eventsData = generateMockEvents(23, studios);
    const created = [];
    
    for (const event of eventsData) {
      try {
        // Transform event data to match schema
        // Combine date and time into startDate datetime
        const startDateTime = new Date(`${event.date}T${event.time}:00`);
        const endDateTime = new Date(`${event.endDate}T${event.time}:00`);
        endDateTime.setHours(endDateTime.getHours() + 2); // Add 2 hours for event duration
        
        const eventToCreate = {
          title: event.title,
          description: event.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          location: event.location,
          address: event.address || '',
          city: event.address?.split(',')[0]?.trim() || '',
          state: event.address?.split(',')[1]?.trim() || '',
          zipCode: '',
          organizerId: studios[0]?.id || 'mock-organizer',
          organizerName: event.organizer || event.location,
          maxAttendees: event.maxParticipants || 50,
          currentAttendees: event.currentParticipants || 0,
          price: parseFloat(event.cost?.replace(/[^0-9.]/g, '') || '0'),
          isVirtual: false,
          isFree: event.cost === 'Free',
          tags: event.tags || [],
          image: event.image || ''
        };
        
        const result = await (this.client.models as any)['Event'].create(eventToCreate);
        if (!result.errors && result.data) {
          created.push(result.data);
        } else if (result.errors) {
          console.warn('Failed to create event:', event.title, result.errors);
        }
      } catch (error) {
        console.warn('Failed to create event:', event.title, error);
      }
    }
    return created;
  }
}
