import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudiosService, Studio, Instructor, StudioInstructor, ClassSchedule, PricingOption, Benefit } from '../services/studios.service';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonAlert,
  IonToast,
  IonBackButton,
  IonButtons,
  IonDatetime
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, remove, save, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-studio-form',
  templateUrl: './studio-form.page.html',
  styleUrls: ['./studio-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonAlert,
    IonToast,
    IonBackButton,
    IonButtons,
    IonDatetime
  ]
})
export class StudioFormPage implements OnInit {
  studioForm: FormGroup;
  isEditMode = false;
  studioId: string | null = null;
  isSubmitting = false;
  showDeleteAlert = false;
  showToast = false;
  toastMessage = '';

  deleteAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.onDeleteAlertDismiss();
      }
    },
    {
      text: 'Delete',
      role: 'confirm',
      handler: () => {
        this.onDelete();
      }
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private studiosService: StudiosService
  ) {
    addIcons({ add, remove, save, arrowBack });
    
    this.studioForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phone: [''],
      email: ['', [Validators.email]],
      website: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      tagline: [''],
      heroImage: [''],
      verified: [false],
      memberCount: [0, [Validators.min(0)]],
      established: [''],
      headInstructorId: [''],
      studioChiefId: [''],
      instructors: this.fb.array([]),
      schedule: this.fb.array([]),
      pricing: this.fb.array([]),
      benefits: this.fb.array([]),
      isMember: [false],
      isInstructor: [false]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode = true;
        this.studioId = params['id'];
        this.loadStudio(params['id']);
      } else {
        this.addDefaultFormArrayItems();
      }
    });
  }

  loadStudio(id: string) {
    const studio = this.studiosService.getStudioById(id);
    if (studio) {
      this.populateForm(studio);
    } else {
      this.showToastMessage('Studio not found');
      this.router.navigate(['/dash/studios']);
    }
  }

  populateForm(studio: Studio) {
    this.studioForm.patchValue({
      name: studio.name,
      location: studio.location,
      address: studio.address,
      phone: studio.phone,
      email: studio.email,
      website: studio.website,
      description: studio.description,
      tagline: studio.tagline,
      heroImage: studio.heroImage,
      verified: studio.verified,
      memberCount: studio.memberCount,
      established: studio.established,
      headInstructorId: studio.headInstructorId,
      studioChiefId: studio.studioChiefId,
      isMember: studio.isMember,
      isInstructor: studio.isInstructor,
      isStudioChief: studio.isStudioChief
    });

    // Populate form arrays
    this.setInstructors(studio.instructors);
    this.setSchedule(studio.schedule);
    this.setPricing(studio.pricing);
    this.setBenefits(studio.benefits);
  }

  // Form Array Getters
  get instructors(): FormArray {
    return this.studioForm.get('instructors') as FormArray;
  }

  get schedule(): FormArray {
    return this.studioForm.get('schedule') as FormArray;
  }

  get pricing(): FormArray {
    return this.studioForm.get('pricing') as FormArray;
  }

  get benefits(): FormArray {
    return this.studioForm.get('benefits') as FormArray;
  }

  // Instructor methods
  createInstructorForm(instructor?: Instructor): FormGroup {
    return this.fb.group({
      id: [instructor?.id || this.generateId()],
      name: [instructor?.name || '', [Validators.required]],
      username: [instructor?.username || '', [Validators.required]],
      title: [instructor?.title || ''],
      rank: [instructor?.rank || ''],
      bio: [instructor?.bio || ''],
      image: [instructor?.image || ''],
      experience: [instructor?.experience || ''],
      email: [instructor?.email || ''],
      phone: [instructor?.phone || ''],
      specialties: this.fb.array(instructor?.specialties?.map((s: string) => this.fb.control(s)) || [this.fb.control('')]),
      certifications: this.fb.array(instructor?.certifications?.map((c: string) => this.fb.control(c)) || [this.fb.control('')]),
      isActive: [instructor?.isActive ?? true]
    });
  }

  addInstructor() {
    this.instructors.push(this.createInstructorForm());
  }

  removeInstructor(index: number) {
    this.instructors.removeAt(index);
  }

  setInstructors(instructors: Instructor[]) {
    const instructorFGs = instructors.map(instructor => this.createInstructorForm(instructor));
    const instructorFormArray = this.fb.array(instructorFGs);
    this.studioForm.setControl('instructors', instructorFormArray);
  }

  getInstructorSpecialties(instructorIndex: number): FormArray {
    return this.instructors.at(instructorIndex).get('specialties') as FormArray;
  }

  addInstructorSpecialty(instructorIndex: number) {
    this.getInstructorSpecialties(instructorIndex).push(this.fb.control(''));
  }

  removeInstructorSpecialty(instructorIndex: number, specialtyIndex: number) {
    this.getInstructorSpecialties(instructorIndex).removeAt(specialtyIndex);
  }

  getInstructorCertifications(instructorIndex: number): FormArray {
    return this.instructors.at(instructorIndex).get('certifications') as FormArray;
  }

  addInstructorCertification(instructorIndex: number) {
    this.getInstructorCertifications(instructorIndex).push(this.fb.control(''));
  }

  removeInstructorCertification(instructorIndex: number, certificationIndex: number) {
    this.getInstructorCertifications(instructorIndex).removeAt(certificationIndex);
  }

  // Schedule methods
  createScheduleForm(scheduleItem?: ClassSchedule): FormGroup {
    return this.fb.group({
      id: [scheduleItem?.id || this.generateId()],
      title: [scheduleItem?.title || '', [Validators.required]],
      startDate: [scheduleItem?.startDate || '', [Validators.required]],
      endDate: [scheduleItem?.endDate || ''],
      startTime: [scheduleItem?.startTime || '', [Validators.required]],
      endTime: [scheduleItem?.endTime || '', [Validators.required]],
      instructor: [scheduleItem?.instructor || '', [Validators.required]],
      level: [scheduleItem?.level || '', [Validators.required]],
      description: [scheduleItem?.description || ''],
      isRecurring: [scheduleItem?.isRecurring || false],
      recurrencePattern: [scheduleItem?.recurrencePattern || ''],
      recurrenceEnd: [scheduleItem?.recurrenceEnd || ''],
      color: [scheduleItem?.color || '#3880ff'],
      location: [scheduleItem?.location || '']
    });
  }

  addScheduleItem() {
    this.schedule.push(this.createScheduleForm());
  }

  removeScheduleItem(index: number) {
    this.schedule.removeAt(index);
  }

  setSchedule(schedule: ClassSchedule[]) {
    const scheduleFGs = schedule.map(item => this.createScheduleForm(item));
    const scheduleFormArray = this.fb.array(scheduleFGs);
    this.studioForm.setControl('schedule', scheduleFormArray);
  }

  // Pricing methods
  createPricingForm(pricing?: PricingOption): FormGroup {
    return this.fb.group({
      name: [pricing?.name || '', [Validators.required]],
      price: [pricing?.price || '', [Validators.required]],
      description: [pricing?.description || ''],
      features: this.fb.array(pricing?.features?.map(feature => this.fb.control(feature)) || [this.fb.control('')]),
      featured: [pricing?.featured || false]
    });
  }

  addPricingOption() {
    this.pricing.push(this.createPricingForm());
  }

  removePricingOption(index: number) {
    this.pricing.removeAt(index);
  }

  setPricing(pricing: PricingOption[]) {
    const pricingFGs = pricing.map(option => this.createPricingForm(option));
    const pricingFormArray = this.fb.array(pricingFGs);
    this.studioForm.setControl('pricing', pricingFormArray);
  }

  getPricingFeatures(pricingIndex: number): FormArray {
    return this.pricing.at(pricingIndex).get('features') as FormArray;
  }

  addPricingFeature(pricingIndex: number) {
    this.getPricingFeatures(pricingIndex).push(this.fb.control(''));
  }

  removePricingFeature(pricingIndex: number, featureIndex: number) {
    this.getPricingFeatures(pricingIndex).removeAt(featureIndex);
  }

  // Benefits methods
  createBenefitForm(benefit?: Benefit): FormGroup {
    return this.fb.group({
      icon: [benefit?.icon || '', [Validators.required]],
      title: [benefit?.title || '', [Validators.required]],
      description: [benefit?.description || '', [Validators.required]]
    });
  }

  addBenefit() {
    this.benefits.push(this.createBenefitForm());
  }

  removeBenefit(index: number) {
    this.benefits.removeAt(index);
  }

  setBenefits(benefits: Benefit[]) {
    const benefitFGs = benefits.map(benefit => this.createBenefitForm(benefit));
    const benefitFormArray = this.fb.array(benefitFGs);
    this.studioForm.setControl('benefits', benefitFormArray);
  }

  addDefaultFormArrayItems() {
    // Add default empty items for new studios
    this.addInstructor();
    this.addScheduleItem();
    this.addPricingOption();
    this.addBenefit();
  }

  async onSubmit() {
    if (this.studioForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      try {
        const formValue = this.studioForm.value;
        
        if (this.isEditMode && this.studioId) {
          await this.studiosService.updateStudio(this.studioId, formValue);
          this.showToastMessage('Studio updated successfully');
        } else {
          await this.studiosService.createStudio(formValue);
          this.showToastMessage('Studio created successfully');
        }
        
        this.router.navigate(['/dash/studios']);
      } catch (error) {
        console.error('Error saving studio:', error);
        this.showToastMessage('Error saving studio. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched(this.studioForm);
      this.showToastMessage('Please fill in all required fields');
    }
  }

  async onDelete() {
    if (this.isEditMode && this.studioId) {
      try {
        await this.studiosService.removeStudio(this.studioId);
        this.showToastMessage('Studio deleted successfully');
        this.router.navigate(['/dash/studios']);
      } catch (error) {
        console.error('Error deleting studio:', error);
        this.showToastMessage('Error deleting studio. Please try again.');
      }
    }
  }

  onCancel() {
    this.router.navigate(['/dash/studios']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  private generateId(): string {
    return 'item_' + Math.random().toString(36).substring(2, 9);
  }

  // Calendar methods
  getHighlightedDates() {
    const dates: any[] = [];
    this.schedule.controls.forEach(control => {
      const startDate = control.get('startDate')?.value;
      const color = control.get('color')?.value || '#3880ff';
      if (startDate) {
        dates.push({
          date: startDate,
          textColor: '#ffffff',
          backgroundColor: color
        });
      }
    });
    return dates;
  }

  onCalendarDateChange(event: any) {
    // Handle calendar date selection if needed
    console.log('Calendar date changed:', event.detail.value);
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastDismiss() {
    this.showToast = false;
  }

  onDeleteAlertDismiss() {
    this.showDeleteAlert = false;
  }

  confirmDelete() {
    this.showDeleteAlert = true;
  }
}