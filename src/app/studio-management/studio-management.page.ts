import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudiosService, Studio, Instructor, ClassSchedule } from '../services/studios.service';
import { ActivitiesService, Activity, CreateActivityRequest } from '../services/activities.service';
import { StudioJoinRequestsComponent } from '../components/studio-join-requests/studio-join-requests.component';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonChip,

  IonAlert,
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonBadge,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  people, 
  calendar, 
  settings, 
  add, 
  personAdd, 
  create, 
  trash, 
  checkmarkCircle, 
  closeCircle,
  school,
  star,
  mail,
  call, 
  time, 
  location,
  person,
  chevronBack,
  chevronForward,
  close,
  repeat, card } from 'ionicons/icons';

@Component({
  selector: 'app-studio-management',
  templateUrl: './studio-management.page.html',
  styleUrls: ['./studio-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonChip,

    IonAlert,
    IonToast,
    IonSegment,
    IonSegmentButton,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonBadge,
    StudioJoinRequestsComponent
  ]
})
export class StudioManagementPage implements OnInit {
  studio: Studio | null = null;
  selectedSegment: string = 'join-requests';
  isAlertOpen = false;
  isToastOpen = false;
  toastMessage = '';
  alertButtons: any[] = ['OK'];

  // Schedule Management Properties
  scheduleView: 'week' | 'month' | 'year' = 'week';
  currentDate: Date = new Date();
  
  // Simple class modal properties
  isClassModalOpen = false;
  isEditingClass = false;

  // Activities Management Properties
  studioActivities: Activity[] = [];

  // Instructor Management Properties
  isInstructorModalOpen = false;
  isEditingInstructor = false;
  selectedInstructor: Instructor | null = null;

  // New Instructor Form
  newInstructor: Instructor = {
    id: '',
    name: '',
    username: '',
    title: 'Instructor',
    rank: '',
    bio: '',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    experience: '',
    email: '',
    phone: '',
    specialties: [],
    certifications: [],
    isActive: true,
    studioId: ''
  };

  // Simple class form - will be rebuilt
  newClass = {
    title: '',
    instructor: '',
    startTime: '',
    endTime: '',
    date: '',
    isRecurring: false,
    recurrenceDays: [] as number[],
    location: '',
    description: ''
  };

  // Calendar Data
  weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  months = ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Time slots for hourly calendar view
  timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];
  
  levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
  colors = [
    { name: 'Blue', value: '#3880ff' },
    { name: 'Green', value: '#10dc60' },
    { name: 'Red', value: '#f04141' },
    { name: 'Orange', value: '#ffce00' },
    { name: 'Purple', value: '#7044ff' },
    { name: 'Teal', value: '#0cd1e8' }
  ];

  // Instructor form options
  instructorTitles = ['Instructor', 'Senior Instructor', 'Assistant Instructor', 'Head Instructor', 'Studio Chief'];
  ranks = ['6th Kyu', '5th Kyu', '4th Kyu', '3rd Kyu', '2nd Kyu', '1st Kyu', 
           '1st Dan', '2nd Dan', '3rd Dan', '4th Dan', '5th Dan', '6th Dan', '7th Dan', '8th Dan'];
  commonSpecialties = ['Traditional Aikido', 'Weapons Training', 'Youth Programs', 'Beginner Training', 
                      'Advanced Techniques', 'Self Defense', 'Meditation', 'Philosophy'];
  commonCertifications = ['Aikikai Foundation', 'ASU Certified', 'Youth Instructor Certified', 
                         'Japan Training Certificate', 'First Aid Certified'];

  // Simple class form options
  classTypes = ['Regular Class', 'Workshop', 'Seminar', 'Special Event'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studiosService: StudiosService,
    private activitiesService: ActivitiesService,
    private alertController: AlertController
  ) {
    addIcons({settings,people,checkmarkCircle,calendar,school,personAdd,star,mail,call,create,trash,add,time,location,repeat,card,chevronBack,chevronForward,close,person,closeCircle});
  }

  ngOnInit() {
    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) {
      this.loadStudio(studioId);
    }
  }

  private loadStudio(studioId: string) {
    const foundStudio = this.studiosService.getStudioById(studioId);
    if (foundStudio) {
      // Check if current user is authorized to manage this studio (instructor or studio chief)
      if (foundStudio.isInstructor || foundStudio.isStudioChief) {
        this.studio = foundStudio;
        this.loadStudioActivities(studioId);
      } else {
        this.showToast('You are not authorized to manage this studio. Only instructors can access management features.');
        this.router.navigate(['/dash/studio', studioId]);
      }
    } else {
      this.showToast('Studio not found');
      this.router.navigate(['/dash/studios']);
    }
  }

  private loadStudioActivities(studioId: string) {
    this.studioActivities = this.activitiesService.getActivitiesByStudio(studioId);
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    
    // Ensure activities are loaded when switching to schedule view
    if (this.selectedSegment === 'schedule' && this.studio && this.studioActivities.length === 0) {
      this.loadStudioActivities(this.studio.id);
    }
  }

  addInstructor() {
    this.isEditingInstructor = false;
    this.selectedInstructor = null;
    this.resetInstructorForm();
    this.isInstructorModalOpen = true;
  }

  editInstructor(instructor: Instructor) {
    this.isEditingInstructor = true;
    this.selectedInstructor = instructor;
    this.newInstructor = { ...instructor };
    this.isInstructorModalOpen = true;
  }

  removeInstructor(instructor: Instructor) {
    this.isAlertOpen = true;
    this.alertButtons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Remove',
        role: 'confirm',
        handler: () => {
          this.confirmRemoveInstructor(instructor);
        }
      }
    ];
  }

  private confirmRemoveInstructor(instructor: Instructor) {
    if (!this.studio) return;
    
    const index = this.studio.instructors.findIndex(i => i.id === instructor.id);
    if (index !== -1) {
      this.studio.instructors.splice(index, 1);
      this.showToast(`${instructor.name} removed from studio`);
    }
  }

  toggleInstructorStatus(instructor: Instructor) {
    instructor.isActive = !instructor.isActive;
    this.showToast(`${instructor.name} ${instructor.isActive ? 'activated' : 'deactivated'}`);
  }

  // Schedule Management Methods
  manageSchedule() {
    this.selectedSegment = 'schedule';
  }

  changeScheduleView(view: any) {
    if (view === 'week' || view === 'month' || view === 'year') {
      this.scheduleView = view;
      
      // Ensure activities are loaded when changing view
      if (this.studio && this.studioActivities.length === 0) {
        this.loadStudioActivities(this.studio.id);
      }
    }
  }

  navigateDate(direction: 'prev' | 'next') {
    const currentDate = new Date(this.currentDate);
    
    switch (this.scheduleView) {
      case 'week':
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        currentDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    this.currentDate = currentDate;
  }

  goToToday() {
    this.currentDate = new Date();
    
    // Refresh activities when going to today
    if (this.studio) {
      this.loadStudioActivities(this.studio.id);
    }
  }

  // Schedule management methods - will be rebuilt

  // Calendar Helper Methods
  getWeekDates(): Date[] {
    const dates: Date[] = [];
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  getMonthDates(): Date[] {
    const dates: Date[] = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month and adjust to start of week
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks) for month view
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  getScheduleForDate(date: Date): Activity[] {
    return this.getActivitiesForDate(date);
  }

  isRecurringScheduleOnDate(schedule: ClassSchedule, date: Date): boolean {
    const scheduleStart = new Date(schedule.startDate);
    const scheduleEnd = schedule.recurrenceEnd ? new Date(schedule.recurrenceEnd) : null;
    
    // Check if date is within recurrence range
    if (date < scheduleStart || (scheduleEnd && date > scheduleEnd)) {
      return false;
    }
    
    switch (schedule.recurrencePattern) {
      case 'daily':
        return true;
      case 'weekly':
        // Check if the date's day of week is in the selected recurrence days
        if (schedule.recurrenceDays && schedule.recurrenceDays.length > 0) {
          return schedule.recurrenceDays.includes(date.getDay());
        }
        // Fallback to original behavior if no specific days selected
        return date.getDay() === scheduleStart.getDay();
      case 'monthly':
        return date.getDate() === scheduleStart.getDate();
      default:
        return false;
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Navigate to activity detail page
  navigateToActivity(activity: Activity) {
    this.router.navigate(['/dash/activity', activity.id]);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  getCurrentViewTitle(): string {
    switch (this.scheduleView) {
      case 'week':
        const weekDates = this.getWeekDates();
        const start = weekDates[0];
        const end = weekDates[6];
        if (start.getMonth() === end.getMonth()) {
          return `${this.months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
        } else {
          return `${this.months[start.getMonth()]} ${start.getDate()} - ${this.months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
        }
      case 'month':
        return `${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
      case 'year':
        return `${this.currentDate.getFullYear()}`;
      default:
        return '';
    }
  }

  studioSettings() {
    this.showToast('Studio settings functionality coming soon');
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }

  getInstructorRole(instructor: Instructor): string {
    if (this.studio?.headInstructorId === instructor.id) {
      return 'Head Instructor';
    }
    if (this.studio?.studioChiefId === instructor.id) {
      return 'Studio Chief';
    }
    return instructor.title || 'Instructor';
  }

  isHeadInstructor(instructor: Instructor): boolean {
    return this.studio?.headInstructorId === instructor.id;
  }

  isStudioChief(instructor: Instructor): boolean {
    return this.studio?.studioChiefId === instructor.id;
  }

  getMonthScheduleCount(monthIndex: number): number {
    if (!this.studio) return 0;
    
    const year = this.currentDate.getFullYear();
    return this.studioActivities.filter(activity => {
      if (activity.isRecurring) {
        // For recurring activities, check if they're active during this month
        const recurrenceStart = activity.recurrenceStart ? new Date(activity.recurrenceStart) : new Date();
        const recurrenceEnd = activity.recurrenceEnd ? new Date(activity.recurrenceEnd) : new Date(year, 11, 31);
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0);
        
        return recurrenceStart <= monthEnd && recurrenceEnd >= monthStart;
      } else {
        // For one-time activities, check the specific date
        const activityDate = new Date(activity.startDate!);
        return activityDate.getFullYear() === year && activityDate.getMonth() === monthIndex;
      }
    }).length;
  }

  // Simple day selection methods - will be rebuilt

  // Simple class management methods
  openClassModal() {
    this.isEditingClass = false;
    this.resetClassForm();
    this.isClassModalOpen = true;
  }

  closeClassModal() {
    this.isClassModalOpen = false;
    this.resetClassForm();
  }

  resetClassForm() {
    const today = new Date().toISOString().split('T')[0];
    this.newClass = {
      title: '',
      instructor: '',
      startTime: '19:00',
      endTime: '20:30',
      date: today,
      isRecurring: false,
      recurrenceDays: [],
      location: 'Main Dojo',
      description: ''
    };
    
    // Pre-populate with first instructor if available
    if (this.studio && this.studio.instructors && this.studio.instructors.length > 0) {
      this.newClass.instructor = this.studio.instructors[0].name;
    }
  }

  saveClass() {
    if (!this.validateClassForm()) {
      return;
    }

    if (!this.studio) return;

    // Create a simple activity object
    const classData: CreateActivityRequest = {
      title: this.newClass.title,
      description: this.newClass.description,
      type: 'class',
      category: 'regular-class',
      isRecurring: this.newClass.isRecurring,
      startTime: this.newClass.startTime,
      endTime: this.newClass.endTime,
      location: this.newClass.location,
      instructor: this.newClass.instructor,
      level: 'all-levels',
      tags: [],
      color: '#3880ff',
      studioId: this.studio.id,
      address: this.studio.address
    };

    if (this.newClass.isRecurring) {
      classData.recurrencePattern = 'weekly';
      classData.recurrenceDays = this.newClass.recurrenceDays;
      classData.recurrenceStart = '2023-01-01';
      classData.recurrenceEnd = '2025-12-31';
    } else {
      classData.startDate = this.newClass.date;
    }

    try {
      const createdActivity = this.activitiesService.createActivity(classData);
      this.showToast(`Class "${createdActivity.title}" created successfully`);
      this.loadStudioActivities(this.studio.id);
      this.closeClassModal();
    } catch (error) {
      console.error('Error creating class:', error);
      this.showToast('Error creating class. Please try again.');
    }
  }

  validateClassForm(): boolean {
    if (!this.newClass.title.trim()) {
      this.showToast('Please enter class title');
      return false;
    }
    if (!this.newClass.instructor.trim()) {
      this.showToast('Please select an instructor');
      return false;
    }
    if (!this.newClass.startTime || !this.newClass.endTime) {
      this.showToast('Please set start and end times');
      return false;
    }
    if (!this.newClass.isRecurring && !this.newClass.date) {
      this.showToast('Please set a date for one-time classes');
      return false;
    }
    if (this.newClass.isRecurring && this.newClass.recurrenceDays.length === 0) {
      this.showToast('Please select at least one day for recurring classes');
      return false;
    }
    return true;
  }

  // Simple day selection for recurring classes
  toggleDay(dayIndex: number) {
    const index = this.newClass.recurrenceDays.indexOf(dayIndex);
    if (index > -1) {
      this.newClass.recurrenceDays.splice(index, 1);
    } else {
      this.newClass.recurrenceDays.push(dayIndex);
    }
    this.newClass.recurrenceDays.sort();
  }

  isDaySelected(dayIndex: number): boolean {
    return this.newClass.recurrenceDays.includes(dayIndex);
  }

  // Simple edit and delete methods
  editActivity(activity: Activity) {
    this.showToast('Edit functionality will be added soon');
  }

  async deleteActivity(activity: Activity) {
    const alert = await this.alertController.create({
      header: 'Delete Activity',
      message: `Are you sure you want to delete "${activity.title}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteActivity(activity);
          }
        }
      ]
    });
    await alert.present();
  }

  confirmDeleteActivity(activity: Activity) {
    this.activitiesService.deleteActivity(activity.id);
    this.loadStudioActivities(this.studio!.id);
    this.showToast('Activity deleted successfully');
  }

  // Helper method for displaying recurring days
  getRecurringDaysText(days: number[]): string {
    if (!days || days.length === 0) return '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(dayIndex => dayNames[dayIndex]).join(', ');
  }

  // Get limited activities for display (max 20)
  getDisplayedActivities() {
    return this.studioActivities.slice(0, 20);
  }

  // Check if there are more activities than displayed
  hasMoreActivities(): boolean {
    return this.studioActivities.length > 20;
  }

  // Get activities for calendar display
  getActivitiesForDate(date: Date): Activity[] {
    // Use the already loaded studio activities instead of calling service again
    return this.studioActivities.filter(activity => {
      if (!activity.isActive) return false;
      
      if (activity.isRecurring) {
        return this.isRecurringActivityOnDate(activity, date);
      } else {
        // One-time activity
        const dateStr = date.toISOString().split('T')[0];
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
    // Use date comparison without time to avoid timezone issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(recurrenceStart.getFullYear(), recurrenceStart.getMonth(), recurrenceStart.getDate());
    const endOnly = recurrenceEnd ? new Date(recurrenceEnd.getFullYear(), recurrenceEnd.getMonth(), recurrenceEnd.getDate()) : null;
    
    if (dateOnly < startOnly || (endOnly && dateOnly > endOnly)) {
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

  // Simple form handlers - will be rebuilt

  // Instructor Management Methods
  closeInstructorModal() {
    this.isInstructorModalOpen = false;
    this.resetInstructorForm();
  }

  resetInstructorForm() {
    this.newInstructor = {
      id: '',
      name: '',
      username: '',
      title: 'Instructor',
      rank: '',
      bio: '',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      experience: '',
      email: '',
      phone: '',
      specialties: [],
      certifications: [],
      isActive: true,
      studioId: ''
    };
  }

  saveInstructor() {
    if (!this.validateInstructorForm()) {
      return;
    }

    if (!this.studio) return;

    if (this.isEditingInstructor && this.selectedInstructor) {
      // Update existing instructor
      const index = this.studio.instructors.findIndex(i => i.id === this.selectedInstructor!.id);
      if (index !== -1) {
        this.studio.instructors[index] = { ...this.newInstructor, id: this.selectedInstructor.id };
      }
      this.showToast('Instructor updated successfully');
    } else {
      // Add new instructor
      const newId = 'instructor_' + Date.now();
      const instructorToAdd = { 
        ...this.newInstructor, 
        id: newId,
        studioId: this.studio.id,
        username: this.generateUsername(this.newInstructor.name)
      };
      this.studio.instructors.push(instructorToAdd);
      this.showToast('New instructor added successfully');
    }

    this.closeInstructorModal();
  }

  validateInstructorForm(): boolean {
    if (!this.newInstructor.name.trim()) {
      this.showToast('Please enter instructor name');
      return false;
    }
    if (!this.newInstructor.title.trim()) {
      this.showToast('Please select instructor title');
      return false;
    }
    if (this.newInstructor.email && !this.isValidEmail(this.newInstructor.email)) {
      this.showToast('Please enter a valid email address');
      return false;
    }
    return true;
  }

  generateUsername(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20) + '_' + Math.floor(Math.random() * 1000);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Specialty and Certification Management
  addSpecialty(specialty: string) {
    if (!this.newInstructor.specialties) {
      this.newInstructor.specialties = [];
    }
    if (specialty && !this.newInstructor.specialties.includes(specialty)) {
      this.newInstructor.specialties.push(specialty);
    }
  }

  removeSpecialty(specialty: string) {
    if (!this.newInstructor.specialties) return;
    const index = this.newInstructor.specialties.indexOf(specialty);
    if (index > -1) {
      this.newInstructor.specialties.splice(index, 1);
    }
  }

  addCertification(certification: string) {
    if (!this.newInstructor.certifications) {
      this.newInstructor.certifications = [];
    }
    if (certification && !this.newInstructor.certifications.includes(certification)) {
      this.newInstructor.certifications.push(certification);
    }
  }

  removeCertification(certification: string) {
    if (!this.newInstructor.certifications) return;
    const index = this.newInstructor.certifications.indexOf(certification);
    if (index > -1) {
      this.newInstructor.certifications.splice(index, 1);
    }
  }

  onSpecialtyChange(event: any) {
    const specialty = event.detail.value;
    if (specialty && specialty !== 'custom') {
      this.addSpecialty(specialty);
    }
  }

  onCertificationChange(event: any) {
    const certification = event.detail.value;
    if (certification && certification !== 'custom') {
      this.addCertification(certification);
    }
  }

  // Hourly Calendar Methods (matching studio detail page)
  getActivitiesForTimeSlot(date: Date, timeSlot: string): Activity[] {
    const activities = this.getActivitiesForDate(date);
    return activities.filter(activity => {
      const activityStartHour = parseInt(activity.startTime.split(':')[0]);
      const activityEndHour = parseInt(activity.endTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      
      // Check if the time slot overlaps with the activity time
      return slotHour >= activityStartHour && slotHour < activityEndHour;
    });
  }

  // Calculate activity position and height for time grid
  getActivityStyle(activity: Activity): any {
    const startHour = parseInt(activity.startTime.split(':')[0]);
    const startMinute = parseInt(activity.startTime.split(':')[1]);
    const endHour = parseInt(activity.endTime.split(':')[0]);
    const endMinute = parseInt(activity.endTime.split(':')[1]);
    
    const startSlotIndex = this.timeSlots.findIndex(slot => parseInt(slot.split(':')[0]) <= startHour);
    const baseStartIndex = Math.max(0, startSlotIndex);
    
    // Calculate position as percentage from start of day (6 AM = 0%)
    const dayStartHour = 6;
    const totalHours = 17; // 6 AM to 11 PM = 17 hours
    
    const startOffset = ((startHour - dayStartHour) * 60 + startMinute) / (totalHours * 60) * 100;
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / (totalHours * 60) * 100;
    
    return {
      'top.%': startOffset,
      'height.%': Math.max(duration, 8), // Minimum 8% height for visibility
      'background-color': activity.color || '#3880ff',
      'position': 'absolute',
      'left': '2px',
      'right': '2px',
      'border-radius': '4px',
      'padding': '4px',
      'font-size': '11px',
      'color': 'white',
      'overflow': 'hidden',
      'z-index': 1
    };
  }

  // Get upcoming activities for list view
  getUpcomingActivities(): Activity[] {
    const now = new Date();
    return this.studioActivities
      .filter(activity => {
        if (activity.isRecurring) {
          // For recurring activities, check if they're still active
          return !activity.recurrenceEnd || new Date(activity.recurrenceEnd) >= now;
        } else {
          // For one-time activities, check the start date
          return activity.startDate && new Date(activity.startDate) >= now;
        }
      })
      .sort((a, b) => {
        // Sort by next occurrence
        const aNext = this.getNextOccurrence(a);
        const bNext = this.getNextOccurrence(b);
        return aNext.getTime() - bNext.getTime();
      });
  }

  private getNextOccurrence(activity: Activity): Date {
    const now = new Date();
    
    if (!activity.isRecurring && activity.startDate) {
      return new Date(activity.startDate);
    }
    
    if (activity.isRecurring && activity.recurrenceDays) {
      // Find next occurrence for recurring activity
      const today = now.getDay();
      const nextDays = activity.recurrenceDays.filter(day => day >= today);
      
      if (nextDays.length > 0) {
        const nextDay = Math.min(...nextDays);
        const daysUntil = nextDay - today;
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntil);
        return nextDate;
      } else {
        // Next week
        const nextDay = Math.min(...activity.recurrenceDays);
        const daysUntil = 7 - today + nextDay;
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntil);
        return nextDate;
      }
    }
    
    return now;
  }

  // Get current week title for calendar header
  getCurrentWeekTitle(): string {
    const weekDates = this.getWeekDates();
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${this.months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${this.months[start.getMonth()]} ${start.getDate()} - ${this.months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  }




}