import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Unified interface for both events and classes
export interface Activity {
  id: string;
  title: string;
  description: string;
  
  // Type and category
  type: 'class' | 'event';
  category: 'regular-class' | 'seminar' | 'tournament' | 'testing' | 'workshop' | 'camp' | 'demonstration' | 'meetup' | 'special-class';
  
  // Scheduling information
  isRecurring: boolean;
  
  // For one-time activities (events or single classes)
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string for multi-day events
  startTime: string; // Time in HH:mm format
  endTime: string; // Time in HH:mm format
  
  // For recurring activities (regular classes)
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceDays?: number[]; // Days of week (0=Sunday, 1=Monday, etc.) for weekly recurrence
  recurrenceStart?: string; // When the recurring schedule starts
  recurrenceEnd?: string; // When the recurring schedule ends
  
  // Location and logistics
  location: string;
  address?: string;
  studioId?: string; // Link to studio if it's a studio activity
  
  // Instructor and difficulty
  instructor: string;
  instructorId?: string;
  instructorRank?: string;
  level: string; // 'beginner' | 'intermediate' | 'advanced' | 'all-levels' | custom levels
  
  // Participation and cost
  cost?: string;
  maxParticipants?: number;
  currentParticipants: number;
  
  // Visual and organizational
  image?: string;
  color?: string; // For calendar display
  featured?: boolean;
  tags: string[];
  
  // Contact and organization
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Additional information
  requirements?: string[];
  whatToBring?: string[];
  
  // Status
  isActive: boolean;
  isCancelled?: boolean;
  cancellationReason?: string;
}

// Helper interface for creating activities
export interface CreateActivityRequest {
  title: string;
  description: string;
  type: 'class' | 'event';
  category: Activity['category'];
  isRecurring: boolean;
  
  // Time information
  startTime: string;
  endTime: string;
  startDate?: string; // Required for one-time activities
  endDate?: string; // Optional for multi-day events
  
  // Recurrence (for recurring activities)
  recurrencePattern?: Activity['recurrencePattern'];
  recurrenceDays?: number[];
  recurrenceStart?: string;
  recurrenceEnd?: string;
  
  // Basic information
  location: string;
  address?: string;
  studioId?: string;
  instructor: string;
  instructorId?: string;
  level: string;
  
  // Optional details
  cost?: string;
  maxParticipants?: number;
  image?: string;
  color?: string;
  tags?: string[];
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  requirements?: string[];
  whatToBring?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  private allActivities: Activity[] = [];

  constructor() {
    this.initializeActivities();
  }

  private initializeActivities() {
    // Initialize with comprehensive mock data for all dojos
    this.allActivities = [
      // DENVER AIKIDO DOJO (studio_1) - Complete Schedule
      // Monday Classes
      {
        id: 'denver_mon_morning',
        title: 'Morning Aikido',
        description: 'Start your week with traditional Aikido practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '06:00',
        endTime: '07:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [1], // Monday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 8,
        maxParticipants: 20,
        color: '#3880ff',
        tags: ['traditional', 'morning', 'adults'],
        isActive: true
      },
      {
        id: 'denver_mon_evening',
        title: 'Adult Aikido',
        description: 'Traditional Aikido practice for adults of all levels',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [1], // Monday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 18,
        maxParticipants: 25,
        color: '#3880ff',
        tags: ['traditional', 'adults', 'evening'],
        isActive: true
      },
      
      // Tuesday Classes
      {
        id: 'denver_tue_lunch',
        title: 'Lunch Break Aikido',
        description: 'Quick midday practice session',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '12:00',
        endTime: '13:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [2], // Tuesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 6,
        maxParticipants: 15,
        color: '#ffce00',
        tags: ['lunch', 'quick', 'adults'],
        isActive: true
      },
      {
        id: 'denver_tue_evening',
        title: 'Beginner Aikido',
        description: 'Perfect for newcomers to Aikido',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '18:30',
        endTime: '20:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [2], // Tuesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'beginner',
        cost: 'Included in membership',
        currentParticipants: 12,
        maxParticipants: 20,
        color: '#10dc60',
        tags: ['beginner', 'fundamentals', 'evening'],
        isActive: true
      },
      
      // Wednesday Classes
      {
        id: 'denver_wed_evening',
        title: 'Advanced Aikido',
        description: 'Advanced techniques and weapons training',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [3], // Wednesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'advanced',
        cost: 'Included in membership',
        currentParticipants: 10,
        maxParticipants: 15,
        color: '#f04141',
        tags: ['advanced', 'weapons', 'evening'],
        isActive: true
      },
      
      // Thursday Classes
      {
        id: 'denver_thu_evening',
        title: 'Adult Aikido',
        description: 'Traditional Aikido practice for adults',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [4], // Thursday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 16,
        maxParticipants: 25,
        color: '#3880ff',
        tags: ['traditional', 'adults', 'evening'],
        isActive: true
      },
      
      // Friday Classes
      {
        id: 'denver_fri_evening',
        title: 'Weapons Training',
        description: 'Bokken, Jo, and Tanto practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [5], // Friday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Weapons Room',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'intermediate',
        cost: 'Included in membership',
        currentParticipants: 14,
        maxParticipants: 20,
        color: '#7044ff',
        tags: ['weapons', 'bokken', 'jo', 'tanto'],
        isActive: true
      },
      
      // Saturday Classes
      {
        id: 'denver_sat_morning',
        title: 'Open Practice',
        description: 'Self-directed practice time',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '10:00',
        endTime: '11:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [6], // Saturday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Various',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 8,
        maxParticipants: 30,
        color: '#ffce00',
        tags: ['open-practice', 'self-directed', 'weekend'],
        isActive: true
      },
      
      // AUSTIN AIKIDO CENTER (studio_2) - Complete Schedule
      // Monday Classes
      {
        id: 'austin_mon_evening',
        title: 'Fundamentals Class',
        description: 'Basic techniques and principles',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '18:30',
        endTime: '20:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [1], // Monday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Jessica Martinez',
        instructorId: 'instructor_2',
        instructorRank: '5th Dan',
        level: 'beginner',
        cost: 'Included in membership',
        currentParticipants: 14,
        maxParticipants: 25,
        color: '#10dc60',
        tags: ['fundamentals', 'beginner', 'evening'],
        isActive: true
      },
      
      // Tuesday Classes
      {
        id: 'austin_tue_morning',
        title: 'Morning Flow',
        description: 'Gentle morning Aikido practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '07:00',
        endTime: '08:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [2], // Tuesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Amanda Thompson',
        instructorId: 'instructor_3',
        instructorRank: '3rd Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 10,
        maxParticipants: 20,
        color: '#3880ff',
        tags: ['morning', 'gentle', 'flow'],
        isActive: true
      },
      {
        id: 'austin_tue_evening',
        title: 'Adult Aikido',
        description: 'Traditional Aikido for all skill levels',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '18:30',
        endTime: '20:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [2], // Tuesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Jessica Martinez',
        instructorId: 'instructor_2',
        instructorRank: '5th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 20,
        maxParticipants: 30,
        color: '#3880ff',
        tags: ['traditional', 'adults', 'evening'],
        isActive: true
      },
      
      // Wednesday Classes
      {
        id: 'austin_wed_lunch',
        title: 'Midday Practice',
        description: 'Lunch hour Aikido session',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '12:30',
        endTime: '13:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [3], // Wednesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Amanda Thompson',
        instructorId: 'instructor_3',
        instructorRank: '3rd Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 8,
        maxParticipants: 15,
        color: '#ffce00',
        tags: ['lunch', 'midday', 'quick'],
        isActive: true
      },
      
      // Thursday Classes
      {
        id: 'austin_thu_evening',
        title: 'Advanced Aikido',
        description: 'Advanced techniques and applications',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [4], // Thursday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Jessica Martinez',
        instructorId: 'instructor_2',
        instructorRank: '5th Dan',
        level: 'advanced',
        cost: 'Included in membership',
        currentParticipants: 12,
        maxParticipants: 20,
        color: '#f04141',
        tags: ['advanced', 'applications', 'evening'],
        isActive: true
      },
      
      // Friday Classes
      {
        id: 'austin_fri_evening',
        title: 'All Levels Practice',
        description: 'Mixed level practice session',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '18:30',
        endTime: '20:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [5], // Friday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Amanda Thompson',
        instructorId: 'instructor_3',
        instructorRank: '3rd Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 16,
        maxParticipants: 25,
        color: '#3880ff',
        tags: ['mixed-level', 'practice', 'evening'],
        isActive: true
      },
      
      // Saturday Classes
      {
        id: 'austin_sat_youth',
        title: 'Youth Aikido',
        description: 'Aikido for young practitioners',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '09:00',
        endTime: '10:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [6], // Saturday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Youth Room',
        studioId: 'studio_2',
        instructor: 'Amanda Thompson',
        instructorId: 'instructor_3',
        instructorRank: '3rd Dan',
        level: 'youth',
        cost: '$80/month',
        currentParticipants: 15,
        maxParticipants: 20,
        color: '#7044ff',
        tags: ['youth', 'kids', 'weekend'],
        isActive: true
      },
      {
        id: 'austin_sat_adult',
        title: 'Weekend Aikido',
        description: 'Weekend Aikido practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '11:00',
        endTime: '12:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [6], // Saturday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_2',
        instructor: 'Jessica Martinez',
        instructorId: 'instructor_2',
        instructorRank: '5th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 18,
        maxParticipants: 30,
        color: '#3880ff',
        tags: ['weekend', 'adults', 'relaxed'],
        isActive: true
      },
      
      // SEATTLE AIKIDO CENTER (studio_3) - Complete Schedule
      // Monday Classes
      {
        id: 'seattle_mon_morning',
        title: 'Early Bird Aikido',
        description: 'Start your day with Aikido',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '06:30',
        endTime: '08:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [1], // Monday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 12,
        maxParticipants: 25,
        color: '#3880ff',
        tags: ['early-bird', 'morning', 'traditional'],
        isActive: true
      },
      {
        id: 'seattle_mon_evening',
        title: 'Beginner Aikido',
        description: 'Introduction to Aikido fundamentals',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '18:00',
        endTime: '19:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [1], // Monday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'beginner',
        cost: 'Included in membership',
        currentParticipants: 16,
        maxParticipants: 25,
        color: '#10dc60',
        tags: ['beginner', 'fundamentals', 'evening'],
        isActive: true
      },
      
      // Tuesday Classes
      {
        id: 'seattle_tue_evening',
        title: 'Intermediate Aikido',
        description: 'Building on fundamental techniques',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [2], // Tuesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'intermediate',
        cost: 'Included in membership',
        currentParticipants: 18,
        maxParticipants: 25,
        color: '#ffce00',
        tags: ['intermediate', 'building', 'evening'],
        isActive: true
      },
      
      // Wednesday Classes
      {
        id: 'seattle_wed_evening',
        title: 'Advanced Aikido',
        description: 'Advanced techniques and philosophy',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [3], // Wednesday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'advanced',
        cost: 'Included in membership',
        currentParticipants: 14,
        maxParticipants: 20,
        color: '#f04141',
        tags: ['advanced', 'philosophy', 'evening'],
        isActive: true
      },
      
      // Thursday Classes
      {
        id: 'seattle_thu_lunch',
        title: 'Lunch Aikido',
        description: 'Midday practice session',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '12:00',
        endTime: '13:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [4], // Thursday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 8,
        maxParticipants: 15,
        color: '#3880ff',
        tags: ['lunch', 'midday', 'quick'],
        isActive: true
      },
      {
        id: 'seattle_thu_evening',
        title: 'All Levels Aikido',
        description: 'Mixed level practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [4], // Thursday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 22,
        maxParticipants: 30,
        color: '#3880ff',
        tags: ['mixed-level', 'practice', 'evening'],
        isActive: true
      },
      
      // Friday Classes
      {
        id: 'seattle_fri_evening',
        title: 'Weapons Training',
        description: 'Bokken, Jo, and Tanto practice',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '19:00',
        endTime: '20:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [5], // Friday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Weapons Room',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'intermediate',
        cost: 'Included in membership',
        currentParticipants: 16,
        maxParticipants: 20,
        color: '#7044ff',
        tags: ['weapons', 'bokken', 'jo', 'tanto'],
        isActive: true
      },
      
      // Saturday Classes
      {
        id: 'seattle_sat_morning',
        title: 'Weekend Workshop',
        description: 'Extended practice with special focus',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '09:00',
        endTime: '11:00',
        recurrencePattern: 'weekly',
        recurrenceDays: [6], // Saturday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Michael Chen',
        instructorId: 'instructor_4',
        instructorRank: '7th Dan',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 20,
        maxParticipants: 30,
        color: '#3880ff',
        tags: ['workshop', 'extended', 'weekend'],
        isActive: true
      },
      
      // Sunday Classes
      {
        id: 'seattle_sun_morning',
        title: 'Open Practice',
        description: 'Self-directed practice and review',
        type: 'class',
        category: 'regular-class',
        isRecurring: true,
        startTime: '10:00',
        endTime: '11:30',
        recurrencePattern: 'weekly',
        recurrenceDays: [0], // Sunday
        recurrenceStart: '2023-01-01',
        recurrenceEnd: '2025-12-31',
        location: 'Main Dojo',
        studioId: 'studio_3',
        instructor: 'Various',
        level: 'all-levels',
        cost: 'Included in membership',
        currentParticipants: 12,
        maxParticipants: 25,
        color: '#ffce00',
        tags: ['open-practice', 'self-directed', 'sunday'],
        isActive: true
      },
      
      // SPECIAL EVENTS AND WORKSHOPS
      {
        id: 'denver_weapons_workshop',
        title: 'Advanced Weapons Workshop',
        description: 'Special workshop focusing on advanced jo and bokken techniques',
        type: 'class',
        category: 'special-class',
        isRecurring: false,
        startDate: '2024-12-21',
        startTime: '14:00',
        endTime: '17:00',
        location: 'Main Dojo',
        studioId: 'studio_1',
        instructor: 'Robert Kim',
        instructorId: 'instructor_1',
        instructorRank: '7th Dan',
        level: 'advanced',
        cost: '$50',
        currentParticipants: 8,
        maxParticipants: 15,
        color: '#10dc60',
        tags: ['weapons', 'advanced', 'workshop'],
        requirements: ['Minimum 2nd Kyu', 'Own weapons'],
        whatToBring: ['Jo', 'Bokken', 'Water bottle'],
        isActive: true
      },
      {
        id: 'summer_intensive',
        title: 'Summer Intensive Seminar',
        description: 'Three-day intensive seminar with visiting master',
        type: 'event',
        category: 'seminar',
        isRecurring: false,
        startDate: '2024-12-20',
        endDate: '2024-12-22',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Austin Aikido Center',
        address: '1234 Harmony Way, Austin, TX 78704',
        studioId: 'studio_2',
        instructor: 'Yamada Sensei',
        instructorRank: '8th Dan',
        level: 'intermediate',
        cost: '$250',
        currentParticipants: 32,
        maxParticipants: 50,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
        color: '#f04141',
        featured: true,
        tags: ['intensive', 'seminar', 'visiting-master'],
        organizer: 'ASU Texas Region',
        contactEmail: 'events@asutexas.org',
        contactPhone: '+1 (512) 555-0123',
        requirements: ['Minimum 3rd Kyu', 'Current membership'],
        whatToBring: ['Gi', 'Hakama', 'Jo', 'Bokken'],
        isActive: true
      }
    ];
    
    this.activitiesSubject.next(this.allActivities);
  }

  // Get all activities
  getAllActivities(): Activity[] {
    return this.allActivities;
  }

  // Get activities by type
  getActivitiesByType(type: 'class' | 'event'): Activity[] {
    return this.allActivities.filter(activity => activity.type === type);
  }

  // Get classes (both regular and special)
  getClasses(): Activity[] {
    return this.getActivitiesByType('class');
  }

  // Get events
  getEvents(): Activity[] {
    return this.getActivitiesByType('event');
  }

  // Get recurring activities (regular classes)
  getRecurringActivities(): Activity[] {
    return this.allActivities.filter(activity => activity.isRecurring);
  }

  // Get one-time activities (events and special classes)
  getOneTimeActivities(): Activity[] {
    return this.allActivities.filter(activity => !activity.isRecurring);
  }

  // Get activities by studio
  getActivitiesByStudio(studioId: string): Activity[] {
    return this.allActivities.filter(activity => activity.studioId === studioId);
  }

  // Get activities by category
  getActivitiesByCategory(category: Activity['category']): Activity[] {
    return this.allActivities.filter(activity => activity.category === category);
  }

  // Get activity by ID
  getActivityById(id: string): Activity | undefined {
    return this.allActivities.find(activity => activity.id === id);
  }

  // Get activities for a specific date
  getActivitiesForDate(date: Date): Activity[] {
    const dateStr = date.toISOString().split('T')[0];
    
    return this.allActivities.filter(activity => {
      if (!activity.isActive) return false;
      
      if (activity.isRecurring) {
        return this.isRecurringActivityOnDate(activity, date);
      } else {
        // One-time activity
        if (activity.startDate === dateStr) return true;
        if (activity.endDate) {
          const start = new Date(activity.startDate!);
          const end = new Date(activity.endDate);
          return date >= start && date <= end;
        }
        return false;
      }
    });
  }

  // Check if recurring activity occurs on specific date
  private isRecurringActivityOnDate(activity: Activity, date: Date): boolean {
    if (!activity.recurrenceStart) return false;
    
    const recurrenceStart = new Date(activity.recurrenceStart);
    const recurrenceEnd = activity.recurrenceEnd ? new Date(activity.recurrenceEnd) : null;
    
    // Check if date is within recurrence range
    if (date < recurrenceStart || (recurrenceEnd && date > recurrenceEnd)) {
      return false;
    }
    
    switch (activity.recurrencePattern) {
      case 'daily':
        return true;
      case 'weekly':
        if (activity.recurrenceDays && activity.recurrenceDays.length > 0) {
          return activity.recurrenceDays.includes(date.getDay());
        }
        return date.getDay() === recurrenceStart.getDay();
      case 'monthly':
        return date.getDate() === recurrenceStart.getDate();
      default:
        return false;
    }
  }

  // Get upcoming activities
  getUpcomingActivities(): Activity[] {
    const now = new Date();
    const upcoming: Activity[] = [];
    
    this.allActivities.forEach(activity => {
      if (!activity.isActive) return;
      
      if (activity.isRecurring) {
        // For recurring activities, check if they have future occurrences
        if (!activity.recurrenceEnd || new Date(activity.recurrenceEnd) >= now) {
          upcoming.push(activity);
        }
      } else {
        // For one-time activities, check the start date
        if (activity.startDate && new Date(activity.startDate) >= now) {
          upcoming.push(activity);
        }
      }
    });
    
    return upcoming.sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate) : new Date(a.recurrenceStart || '');
      const bDate = b.startDate ? new Date(b.startDate) : new Date(b.recurrenceStart || '');
      return aDate.getTime() - bDate.getTime();
    });
  }

  // Create new activity
  createActivity(request: CreateActivityRequest): Activity {
    const activity: Activity = {
      id: this.generateId(),
      title: request.title,
      description: request.description,
      type: request.type,
      category: request.category,
      isRecurring: request.isRecurring,
      startTime: request.startTime,
      endTime: request.endTime,
      location: request.location,
      instructor: request.instructor,
      level: request.level,
      currentParticipants: 0,
      tags: request.tags || [],
      isActive: true,
      
      // Optional fields
      ...(request.startDate && { startDate: request.startDate }),
      ...(request.endDate && { endDate: request.endDate }),
      ...(request.recurrencePattern && { recurrencePattern: request.recurrencePattern }),
      ...(request.recurrenceDays && { recurrenceDays: request.recurrenceDays }),
      ...(request.recurrenceStart && { recurrenceStart: request.recurrenceStart }),
      ...(request.recurrenceEnd && { recurrenceEnd: request.recurrenceEnd }),
      ...(request.address && { address: request.address }),
      ...(request.studioId && { studioId: request.studioId }),
      ...(request.instructorId && { instructorId: request.instructorId }),
      ...(request.cost && { cost: request.cost }),
      ...(request.maxParticipants && { maxParticipants: request.maxParticipants }),
      ...(request.image && { image: request.image }),
      ...(request.color && { color: request.color }),
      ...(request.organizer && { organizer: request.organizer }),
      ...(request.contactEmail && { contactEmail: request.contactEmail }),
      ...(request.contactPhone && { contactPhone: request.contactPhone }),
      ...(request.requirements && { requirements: request.requirements }),
      ...(request.whatToBring && { whatToBring: request.whatToBring })
    };
    
    this.allActivities.push(activity);
    this.activitiesSubject.next(this.allActivities);
    return activity;
  }

  // Update activity
  updateActivity(id: string, updates: Partial<Activity>): boolean {
    const index = this.allActivities.findIndex(activity => activity.id === id);
    if (index !== -1) {
      this.allActivities[index] = { ...this.allActivities[index], ...updates };
      this.activitiesSubject.next(this.allActivities);
      return true;
    }
    return false;
  }

  // Delete activity
  deleteActivity(id: string): boolean {
    const index = this.allActivities.findIndex(activity => activity.id === id);
    if (index !== -1) {
      this.allActivities.splice(index, 1);
      this.activitiesSubject.next(this.allActivities);
      return true;
    }
    return false;
  }

  // Cancel activity
  cancelActivity(id: string, reason?: string): boolean {
    return this.updateActivity(id, { 
      isCancelled: true, 
      cancellationReason: reason,
      isActive: false 
    });
  }

  // Register for activity
  registerForActivity(activityId: string): boolean {
    const activity = this.getActivityById(activityId);
    if (activity && (!activity.maxParticipants || activity.currentParticipants < activity.maxParticipants)) {
      activity.currentParticipants++;
      this.activitiesSubject.next(this.allActivities);
      return true;
    }
    return false;
  }

  // Unregister from activity
  unregisterFromActivity(activityId: string): boolean {
    const activity = this.getActivityById(activityId);
    if (activity && activity.currentParticipants > 0) {
      activity.currentParticipants--;
      this.activitiesSubject.next(this.allActivities);
      return true;
    }
    return false;
  }

  // Search activities
  searchActivities(query: string): Activity[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allActivities;

    return this.allActivities.filter(activity => 
      activity.title.toLowerCase().includes(searchTerm) ||
      activity.description.toLowerCase().includes(searchTerm) ||
      activity.location.toLowerCase().includes(searchTerm) ||
      activity.instructor.toLowerCase().includes(searchTerm) ||
      activity.organizer?.toLowerCase().includes(searchTerm) ||
      activity.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Helper methods
  private generateId(): string {
    return 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Convert legacy ClassSchedule to Activity
  convertClassScheduleToActivity(classSchedule: any, studioId: string): Activity {
    return {
      id: classSchedule.id || this.generateId(),
      title: classSchedule.title,
      description: classSchedule.description || '',
      type: 'class',
      category: 'regular-class',
      isRecurring: classSchedule.isRecurring,
      startTime: classSchedule.startTime,
      endTime: classSchedule.endTime,
      startDate: classSchedule.isRecurring ? undefined : classSchedule.startDate,
      endDate: classSchedule.isRecurring ? undefined : classSchedule.endDate,
      recurrencePattern: classSchedule.recurrencePattern,
      recurrenceDays: classSchedule.recurrenceDays,
      recurrenceStart: classSchedule.isRecurring ? classSchedule.startDate : undefined,
      recurrenceEnd: classSchedule.recurrenceEnd,
      location: classSchedule.location || 'Main Dojo',
      studioId: studioId,
      instructor: classSchedule.instructor,
      level: classSchedule.level,
      currentParticipants: 0,
      color: classSchedule.color,
      tags: [],
      isActive: true
    };
  }

  // Convert legacy Event to Activity
  convertEventToActivity(event: any): Activity {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: 'event',
      category: event.type as Activity['category'],
      isRecurring: false,
      startDate: event.date,
      endDate: event.endDate,
      startTime: event.time,
      endTime: event.endTime || event.time, // Fallback if no end time
      location: event.location,
      address: event.address,
      instructor: event.instructor,
      instructorRank: event.instructorRank,
      level: event.difficulty,
      cost: event.cost,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      image: event.image,
      featured: event.featured,
      tags: event.tags,
      organizer: event.organizer,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      requirements: event.requirements,
      whatToBring: event.whatToBring,
      isActive: true
    };
  }
}