import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { DataSourceService } from './data-source.service';
import { MockDataService } from './mock-data.service';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endDate?: string;
  location: string;
  address: string;
  type: 'seminar' | 'tournament' | 'testing' | 'workshop' | 'camp' | 'demonstration' | 'meetup';
  instructor: string;
  instructorRank: string;
  cost: string;
  maxParticipants?: number;
  currentParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  image: string;
  featured: boolean;
  tags: string[];
  organizer: string;
  contactEmail: string;
  contactPhone?: string;
  requirements?: string[];
  whatToBring?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();
  private client = generateClient();

  private allEvents: Event[] = [];

  constructor(
    private dataSourceService: DataSourceService,
    private mockDataService: MockDataService
  ) {
    // Load events based on initial data source
    console.log('[EventsService] Initializing with data source:', this.dataSourceService.getCurrentSource());
    this.loadEventsFromAPI();
    
    // Subscribe to data source changes (skip initial emission since we already loaded)
    let isFirstEmission = true;
    this.dataSourceService.dataSource$.subscribe(() => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return; // Skip first emission to avoid double-loading
      }
      console.log('[EventsService] Data source changed, reloading events');
      this.loadEventsFromAPI();
    });
  }

  // Get all events
  getAllEvents(): Event[] {
    return this.allEvents;
  }

  // Get event by ID
  getEventById(id: string): Event | undefined {
    return this.allEvents.find(event => event.id === id);
  }

  // Get events by type
  getEventsByType(type: Event['type']): Event[] {
    return this.allEvents.filter(event => event.type === type);
  }

  // Get featured events
  getFeaturedEvents(): Event[] {
    return this.allEvents.filter(event => event.featured);
  }

  // Get events by difficulty
  getEventsByDifficulty(difficulty: Event['difficulty']): Event[] {
    return this.allEvents.filter(event => event.difficulty === difficulty);
  }

  // Search events
  searchEvents(query: string): Event[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allEvents;

    return this.allEvents.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.location.toLowerCase().includes(searchTerm) ||
      event.instructor.toLowerCase().includes(searchTerm) ||
      event.organizer.toLowerCase().includes(searchTerm) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Get upcoming events (sorted by date)
  getUpcomingEvents(): Event[] {
    const now = new Date();
    return this.allEvents
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Get past events
  getPastEvents(): Event[] {
    const now = new Date();
    return this.allEvents
      .filter(event => new Date(event.date) < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Add new event
  async addEvent(event: Event): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Events Service] Creating event in MOCK mode (local only)');
      // Add locally only
      this.allEvents.push(event);
      this.eventsSubject.next(this.allEvents);
      console.log('[Events Service] Event created locally:', event.id);
      return true;
    }
    
    // Database mode - create in remote database
    console.log('[Events Service] Creating event in DATABASE mode');
    try {
      const result = await (this.client.models as any)['Event'].create({
        title: event.title,
        description: event.description,
        startDate: `${event.date}T${event.time}:00`,
        endDate: event.endDate ? `${event.endDate}T${event.time}:00` : `${event.date}T${event.time}:00`,
        location: event.location,
        address: event.address,
        organizerName: event.organizer,
        isFree: event.cost === 'Free',
        price: event.cost !== 'Free' ? parseFloat(event.cost.replace(/[^0-9.]/g, '')) : 0,
        maxAttendees: event.maxParticipants,
        currentAttendees: event.currentParticipants,
        image: event.image,
        tags: event.tags
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        this.allEvents.push(event);
        this.eventsSubject.next(this.allEvents);
        console.log('[Events Service] Event created in database');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Events Service] Failed to create event in database:', error);
      return false;
    }
  }

  // Update event
  async updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Events Service] Updating event in MOCK mode (local only):', id);
      // Update locally only
      const index = this.allEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        this.allEvents[index] = { ...this.allEvents[index], ...updates };
        this.eventsSubject.next(this.allEvents);
        console.log('[Events Service] Event updated locally');
        return true;
      }
      return false;
    }
    
    // Database mode - update in remote database
    console.log('[Events Service] Updating event in DATABASE mode:', id);
    try {
      const updateData: any = { id };
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.date || updates.time) {
        const date = updates.date || this.getEventById(id)?.date || '';
        const time = updates.time || this.getEventById(id)?.time || '00:00';
        updateData.startDate = `${date}T${time}:00`;
      }
      if (updates.location) updateData.location = updates.location;
      if (updates.address) updateData.address = updates.address;
      if (updates.organizer) updateData.organizerName = updates.organizer;
      if (updates.cost !== undefined) {
        updateData.isFree = updates.cost === 'Free';
        updateData.price = updates.cost !== 'Free' ? parseFloat(updates.cost.replace(/[^0-9.]/g, '')) : 0;
      }
      if (updates.maxParticipants !== undefined) updateData.maxAttendees = updates.maxParticipants;
      if (updates.currentParticipants !== undefined) updateData.currentAttendees = updates.currentParticipants;
      if (updates.image) updateData.image = updates.image;
      if (updates.tags) updateData.tags = updates.tags;

      const result = await (this.client.models as any)['Event'].update(updateData, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (result.data) {
        const index = this.allEvents.findIndex(event => event.id === id);
        if (index !== -1) {
          this.allEvents[index] = { ...this.allEvents[index], ...updates };
          this.eventsSubject.next(this.allEvents);
        }
        console.log('[Events Service] Event updated in database');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Events Service] Failed to update event in database:', error);
      return false;
    }
  }

  // Remove event
  async removeEvent(id: string): Promise<boolean> {
    // Check if using mock data mode
    if (this.dataSourceService.isUsingMockData()) {
      console.log('[Events Service] Deleting event in MOCK mode (local only):', id);
      // Delete locally only
      const index = this.allEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        this.allEvents.splice(index, 1);
        this.eventsSubject.next(this.allEvents);
        console.log('[Events Service] Event deleted locally');
        return true;
      }
      return false;
    }
    
    // Database mode - delete from remote database
    console.log('[Events Service] Deleting event in DATABASE mode:', id);
    try {
      const result = await (this.client.models as any)['Event'].delete({
        id
      }, {
        authMode: 'userPool'
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const index = this.allEvents.findIndex(event => event.id === id);
      if (index !== -1) {
        this.allEvents.splice(index, 1);
        this.eventsSubject.next(this.allEvents);
      }
      console.log('[Events Service] Event deleted from database');
      return true;
    } catch (error) {
      console.error('[Events Service] Failed to delete event from database:', error);
      return false;
    }
  }

  // Register for event
  registerForEvent(eventId: string): boolean {
    const event = this.getEventById(eventId);
    if (event && (!event.maxParticipants || event.currentParticipants < event.maxParticipants)) {
      event.currentParticipants++;
      this.eventsSubject.next(this.allEvents);
      return true;
    }
    return false;
  }

  // Unregister from event
  unregisterFromEvent(eventId: string): boolean {
    const event = this.getEventById(eventId);
    if (event && event.currentParticipants > 0) {
      event.currentParticipants--;
      this.eventsSubject.next(this.allEvents);
      return true;
    }
    return false;
  }

  // Check if event is sold out
  isEventSoldOut(eventId: string): boolean {
    const event = this.getEventById(eventId);
    return event ? (event.maxParticipants ? event.currentParticipants >= event.maxParticipants : false) : false;
  }

  // Get availability text
  getAvailabilityText(eventId: string): string {
    const event = this.getEventById(eventId);
    if (!event || !event.maxParticipants) return '';
    
    const remaining = event.maxParticipants - event.currentParticipants;
    if (remaining === 0) return 'Sold Out';
    if (remaining <= 5) return `${remaining} spots left`;
    return `${event.currentParticipants}/${event.maxParticipants} registered`;
  }

  // Load events from GraphQL API or mock data
  private async loadEventsFromAPI(): Promise<void> {
    try {
      // Clear existing data first to force refresh
      console.log('[EventsService] Clearing cached events data');
      this.allEvents = [];
      this.eventsSubject.next(this.allEvents);
      
      // Check if using mock data
      if (this.dataSourceService.isUsingMockData()) {
        console.log('Loading events from mock data');
        const mockEvents = this.mockDataService.getMockEvents();
        // Convert mock data to Event interface
        this.allEvents = mockEvents.map((me: any) => ({
          id: me.id,
          title: me.title,
          description: me.description,
          date: me.date,
          time: me.time || '00:00',
          endDate: me.endDate,
          location: me.location,
          address: me.address || '',
          type: me.type,
          instructor: me.instructor || '',
          instructorRank: me.instructorRank || '',
          cost: me.cost || 'Free',
          maxParticipants: me.maxParticipants,
          currentParticipants: me.currentParticipants || 0,
          difficulty: me.difficulty || 'all-levels',
          image: me.image || '',
          featured: me.featured || false,
          tags: me.tags || [],
          organizer: me.organizer || '',
          contactEmail: me.contactEmail || '',
          contactPhone: me.contactPhone,
          requirements: me.requirements,
          whatToBring: me.whatToBring
        }));
        this.eventsSubject.next(this.allEvents);
        console.log('Loaded', this.allEvents.length, 'mock events');
        return;
      }

      // Load from database
      console.log('Loading events from database');
      
      const result = await (this.client.models as any)['Event'].list({
        authMode: 'userPool'
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const apiEvents = result.data;

      if (apiEvents && Array.isArray(apiEvents)) {
        const convertedEvents: Event[] = apiEvents.map((apiEvent: any) => {
          // Extract date and time from startDate datetime
          const startDate = new Date(apiEvent.startDate);
          const endDate = new Date(apiEvent.endDate);
          
          return {
            id: apiEvent.id,
            title: apiEvent.title,
            description: apiEvent.description,
            date: startDate.toISOString().split('T')[0], // Extract date part
            time: startDate.toTimeString().slice(0, 5), // Extract time part (HH:MM)
            endDate: endDate.toISOString().split('T')[0],
            location: apiEvent.location,
            address: apiEvent.address || '',
            type: this.inferEventType(apiEvent.title), // Infer type from title
            instructor: apiEvent.organizerName || '',
            instructorRank: '',
            cost: apiEvent.isFree ? 'Free' : `$${apiEvent.price}`,
            maxParticipants: apiEvent.maxAttendees,
            currentParticipants: apiEvent.currentAttendees || 0,
            difficulty: 'all-levels',
            image: apiEvent.image || '',
            featured: false,
            tags: apiEvent.tags || [],
            organizer: apiEvent.organizerName || '',
            contactEmail: '',
            contactPhone: '',
            requirements: [],
            whatToBring: []
          };
        });
        
        this.allEvents = convertedEvents;
        this.eventsSubject.next(this.allEvents);
        console.log('Successfully loaded', this.allEvents.length, 'events from database');
      } else {
        this.allEvents = [];
        this.eventsSubject.next(this.allEvents);
      }
    } catch (error) {
      console.warn('Failed to load events:', error);
      this.allEvents = [];
      this.eventsSubject.next(this.allEvents);
    }
  }

  // Refresh events from API
  async refreshEventsFromAPI(): Promise<void> {
    await this.loadEventsFromAPI();
  }

  // Helper to infer event type from title
  private inferEventType(title: string): Event['type'] {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('seminar')) return 'seminar';
    if (lowerTitle.includes('tournament')) return 'tournament';
    if (lowerTitle.includes('workshop')) return 'workshop';
    if (lowerTitle.includes('meetup')) return 'meetup';
    if (lowerTitle.includes('camp')) return 'camp';
    if (lowerTitle.includes('testing')) return 'testing';
    if (lowerTitle.includes('demonstration')) return 'demonstration';
    return 'meetup'; // default
  }
}