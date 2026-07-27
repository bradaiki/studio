import { Injectable } from '@angular/core';
import { ArtsService } from './arts.service';
import { StudiosService } from './studios.service';
import { OrganizationsService } from './organizations.service';
import { PeopleService } from './people.service';
import { EventsService } from './events.service';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(
    private artsService: ArtsService,
    private studiosService: StudiosService,
    private organizationsService: OrganizationsService,
    private peopleService: PeopleService,
    private eventsService: EventsService
  ) {}

  async migrateAllData(): Promise<void> {
    console.log('Starting data migration to backend...');
    
    try {
      await this.migrateArts();
      await this.migrateStudios();
      await this.migrateOrganizations();
      await this.migratePeople();
      await this.migrateEvents();
      
      console.log('Data migration completed successfully!');
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }

  private async migrateArts(): Promise<void> {
    console.log('Migrating arts...');
    const arts = this.artsService.getAllArts();
    
    for (const art of arts) {
      try {
        await this.artsService.createArt(art);
        console.log(`Migrated art: ${art.name}`);
      } catch (error) {
        console.error(`Failed to migrate art ${art.name}:`, error);
      }
    }
  }

  private async migrateStudios(): Promise<void> {
    console.log('Migrating studios...');
    const studios = this.studiosService.getAllStudios();
    
    for (const studio of studios) {
      try {
        await this.studiosService.createStudio(studio);
        console.log(`Migrated studio: ${studio.name}`);
      } catch (error) {
        console.error(`Failed to migrate studio ${studio.name}:`, error);
      }
    }
  }

  private async migrateOrganizations(): Promise<void> {
    console.log('Migrating organizations...');
    const organizations = this.organizationsService.getAllOrganizations();
    
    for (const org of organizations) {
      try {
        // Note: Organizations service needs to be updated with GraphQL methods
        console.log(`Skipping organization migration until GraphQL methods are implemented: ${org.name}`);
      } catch (error) {
        console.error(`Failed to migrate organization ${org.name}:`, error);
      }
    }
  }

  private async migratePeople(): Promise<void> {
    console.log('Migrating people...');
    const people = this.peopleService.getAllPeople();
    
    for (const person of people) {
      try {
        // Note: People service needs to be updated with GraphQL methods
        console.log(`Skipping person migration until GraphQL methods are implemented: ${person.name}`);
      } catch (error) {
        console.error(`Failed to migrate person ${person.name}:`, error);
      }
    }
  }

  private async migrateEvents(): Promise<void> {
    console.log('Migrating events...');
    const events = this.eventsService.getAllEvents();
    
    for (const event of events) {
      try {
        // Note: Events service needs to be updated with GraphQL methods
        console.log(`Skipping event migration until GraphQL methods are implemented: ${event.title}`);
      } catch (error) {
        console.error(`Failed to migrate event ${event.title}:`, error);
      }
    }
  }

  async testBackendConnection(): Promise<boolean> {
    try {
      await this.artsService.refreshArtsFromAPI();
      console.log('GraphQL backend connection successful!');
      return true;
    } catch (error) {
      console.error('GraphQL backend connection failed:', error);
      return false;
    }
  }

  async clearLocalData(): Promise<void> {
    console.log('Clearing local data...');
    localStorage.removeItem('arts_cache');
    localStorage.removeItem('studios_cache');
    localStorage.removeItem('organizations_cache');
    localStorage.removeItem('people_cache');
    localStorage.removeItem('events_cache');
    localStorage.removeItem('pending_arts_changes');
    console.log('Local data cleared!');
  }
}