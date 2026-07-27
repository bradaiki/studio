import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private client = generateClient();

  constructor() {
    console.log('GraphQL API Service initialized with DynamoDB backend');
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch (error) {
      return null;
    }
  }

  // This service is now deprecated in favor of individual GraphQL-based services
  // (ArtsService, StudiosService, OrganizationsService, PeopleService, EventsService)
  // 
  // Each service now directly uses the GraphQL client for better type safety
  // and more efficient data operations with DynamoDB.
  //
  // If you need to access the GraphQL client directly, use:
  // import { generateClient } from 'aws-amplify/data';
  // import type { Schema } from '../../../amplify/data/resource';
  // const client = generateClient<Schema>();

  getGraphQLClient() {
    return this.client;
  }
}