import { Component, OnInit, signal } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  OrganizationsService,
  Organization,
  Statistic,
  Program,
  Dojo,
  OrganizationEvent,
  LineageFeature,
  SocialMedia,
  Leader,
  Achievement,
} from '../services/organizations.service';
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
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, remove, save, arrowBack } from 'ionicons/icons';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-org-form',
  templateUrl: './org-form.page.html',
  styleUrls: ['./org-form.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
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
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonBackButton,
    IonButtons,
  ],
})
export class OrgFormPage implements OnInit {
  orgForm: FormGroup;
  isEditMode = signal(false);
  orgId = signal<string | null>(null);
  isSubmitting = signal(false);
  showDeleteAlert = signal(false);
  showToast = signal(false);
  toastMessage = signal('');

  deleteAlertButtons: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private organizationsService: OrganizationsService,
    public translationService: TranslationService,
  ) {
    addIcons({ add, remove, save, arrowBack });

    this.deleteAlertButtons = [
      {
        text: this.translationService.getTranslation('app.cancel'),
        role: 'cancel',
        handler: () => { this.onDeleteAlertDismiss(); },
      },
      {
        text: this.translationService.getTranslation('app.delete'),
        role: 'confirm',
        handler: () => { this.onDelete(); },
      },
    ];

    this.orgForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      tagline: [''],
      mission: ['', [Validators.required, Validators.minLength(10)]],
      heroImage: [''],
      description: ['', [Validators.required, Validators.minLength(10)]],
      founded: [''],
      headquarters: [''],
      website: [''],
      email: ['', [Validators.email]],
      phone: [''],
      verified: [false],
      memberCount: [0, [Validators.min(0)]],
      dojoCount: [0, [Validators.min(0)]],
      countryCount: [0, [Validators.min(0)]],
      philosophy: this.fb.group({
        quote: [''],
        attribution: [''],
        description: [''],
        image: [''],
      }),
      statistics: this.fb.array([]),
      programs: this.fb.array([]),
      memberDojos: this.fb.array([]),
      upcomingEvents: this.fb.array([]),
      lineageFeatures: this.fb.array([]),
      socialMedia: this.fb.array([]),
      leadership: this.fb.array([]),
      achievements: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.orgId.set(params['id']);
        this.loadOrganization(params['id']);
      } else {
        this.addDefaultFormArrayItems();
      }
    });
  }

  loadOrganization(id: string) {
    const org = this.organizationsService.getOrganizationById(id);
    if (org) {
      this.populateForm(org);
    } else {
      this.showToastMessage(this.translationService.getTranslation('org_form.not_found'));
      this.router.navigate(['/dash/orgs']);
    }
  }

  populateForm(org: Organization) {
    this.orgForm.patchValue({
      name: org.name,
      tagline: org.tagline,
      mission: org.mission,
      heroImage: org.heroImage,
      description: org.description,
      founded: org.founded,
      headquarters: org.headquarters,
      website: org.website,
      email: org.email,
      phone: org.phone,
      verified: org.verified,
      memberCount: org.memberCount,
      dojoCount: org.dojoCount,
      countryCount: org.countryCount,
      philosophy: org.philosophy || {},
    });

    // Populate form arrays
    this.setStatistics(org.statistics);
    this.setPrograms(org.programs);
    this.setMemberDojos(org.memberDojos);
    this.setUpcomingEvents(org.upcomingEvents);
    this.setLineageFeatures(org.lineageFeatures);
    this.setSocialMedia(org.socialMedia);
    this.setLeadership(org.leadership || []);
    this.setAchievements(org.achievements || []);
  }

  // Form Array Getters
  get statistics(): FormArray {
    return this.orgForm.get('statistics') as FormArray;
  }

  get programs(): FormArray {
    return this.orgForm.get('programs') as FormArray;
  }

  get memberDojos(): FormArray {
    return this.orgForm.get('memberDojos') as FormArray;
  }

  get upcomingEvents(): FormArray {
    return this.orgForm.get('upcomingEvents') as FormArray;
  }

  get lineageFeatures(): FormArray {
    return this.orgForm.get('lineageFeatures') as FormArray;
  }

  get socialMedia(): FormArray {
    return this.orgForm.get('socialMedia') as FormArray;
  }

  get leadership(): FormArray {
    return this.orgForm.get('leadership') as FormArray;
  }

  get achievements(): FormArray {
    return this.orgForm.get('achievements') as FormArray;
  }

  // Statistics methods
  createStatisticForm(statistic?: Statistic): FormGroup {
    return this.fb.group({
      number: [statistic?.number || '', [Validators.required]],
      label: [statistic?.label || '', [Validators.required]],
    });
  }

  addStatistic() {
    this.statistics.push(this.createStatisticForm());
  }

  removeStatistic(index: number) {
    this.statistics.removeAt(index);
  }

  setStatistics(statistics: Statistic[]) {
    const statisticFGs = statistics.map((stat) =>
      this.createStatisticForm(stat),
    );
    const statisticFormArray = this.fb.array(statisticFGs);
    this.orgForm.setControl('statistics', statisticFormArray);
  }

  // Programs methods
  createProgramForm(program?: Program): FormGroup {
    return this.fb.group({
      name: [program?.name || '', [Validators.required]],
      description: [program?.description || '', [Validators.required]],
      level: [program?.level || ''],
      duration: [program?.duration || ''],
      certification: [program?.certification || ''],
    });
  }

  addProgram() {
    this.programs.push(this.createProgramForm());
  }

  removeProgram(index: number) {
    this.programs.removeAt(index);
  }

  setPrograms(programs: Program[]) {
    const programFGs = programs.map((program) =>
      this.createProgramForm(program),
    );
    const programFormArray = this.fb.array(programFGs);
    this.orgForm.setControl('programs', programFormArray);
  }

  // Member Dojos methods
  createDojoForm(dojo?: Dojo): FormGroup {
    return this.fb.group({
      id: [dojo?.id || this.generateId()],
      name: [dojo?.name || '', [Validators.required]],
      location: [dojo?.location || '', [Validators.required]],
      instructor: [dojo?.instructor || ''],
      rank: [dojo?.rank || ''],
      students: [dojo?.students || 0, [Validators.min(0)]],
      established: [dojo?.established || ''],
      image: [dojo?.image || ''],
    });
  }

  addDojo() {
    this.memberDojos.push(this.createDojoForm());
  }

  removeDojo(index: number) {
    this.memberDojos.removeAt(index);
  }

  setMemberDojos(dojos: Dojo[]) {
    const dojoFGs = dojos.map((dojo) => this.createDojoForm(dojo));
    const dojoFormArray = this.fb.array(dojoFGs);
    this.orgForm.setControl('memberDojos', dojoFormArray);
  }

  // Events methods
  createEventForm(event?: OrganizationEvent): FormGroup {
    return this.fb.group({
      id: [event?.id || this.generateId()],
      title: [event?.title || '', [Validators.required]],
      date: [event?.date || '', [Validators.required]],
      location: [event?.location || '', [Validators.required]],
      type: [event?.type || 'seminar', [Validators.required]],
      instructor: [event?.instructor || ''],
      cost: [event?.cost || ''],
    });
  }

  addEvent() {
    this.upcomingEvents.push(this.createEventForm());
  }

  removeEvent(index: number) {
    this.upcomingEvents.removeAt(index);
  }

  setUpcomingEvents(events: OrganizationEvent[]) {
    const eventFGs = events.map((event) => this.createEventForm(event));
    const eventFormArray = this.fb.array(eventFGs);
    this.orgForm.setControl('upcomingEvents', eventFormArray);
  }

  // Lineage Features methods
  createLineageFeatureForm(feature?: LineageFeature): FormGroup {
    return this.fb.group({
      icon: [feature?.icon || '', [Validators.required]],
      title: [feature?.title || '', [Validators.required]],
      description: [feature?.description || '', [Validators.required]],
    });
  }

  addLineageFeature() {
    this.lineageFeatures.push(this.createLineageFeatureForm());
  }

  removeLineageFeature(index: number) {
    this.lineageFeatures.removeAt(index);
  }

  setLineageFeatures(features: LineageFeature[]) {
    const featureFGs = features.map((feature) =>
      this.createLineageFeatureForm(feature),
    );
    const featureFormArray = this.fb.array(featureFGs);
    this.orgForm.setControl('lineageFeatures', featureFormArray);
  }

  // Social Media methods
  createSocialMediaForm(social?: SocialMedia): FormGroup {
    return this.fb.group({
      platform: [social?.platform || 'facebook', [Validators.required]],
      url: [social?.url || '', [Validators.required]],
      username: [social?.username || ''],
    });
  }

  addSocialMedia() {
    this.socialMedia.push(this.createSocialMediaForm());
  }

  removeSocialMedia(index: number) {
    this.socialMedia.removeAt(index);
  }

  setSocialMedia(socialMedia: SocialMedia[]) {
    const socialFGs = socialMedia.map((social) =>
      this.createSocialMediaForm(social),
    );
    const socialFormArray = this.fb.array(socialFGs);
    this.orgForm.setControl('socialMedia', socialFormArray);
  }

  // Leadership methods
  createLeaderForm(leader?: Leader): FormGroup {
    return this.fb.group({
      id: [leader?.id || this.generateId()],
      name: [leader?.name || '', [Validators.required]],
      title: [leader?.title || '', [Validators.required]],
      rank: [leader?.rank || ''],
      bio: [leader?.bio || ''],
      image: [leader?.image || ''],
      yearsWithOrg: [leader?.yearsWithOrg || 0, [Validators.min(0)]],
    });
  }

  addLeader() {
    this.leadership.push(this.createLeaderForm());
  }

  removeLeader(index: number) {
    this.leadership.removeAt(index);
  }

  setLeadership(leaders: Leader[]) {
    const leaderFGs = leaders.map((leader) => this.createLeaderForm(leader));
    const leaderFormArray = this.fb.array(leaderFGs);
    this.orgForm.setControl('leadership', leaderFormArray);
  }

  // Achievements methods
  createAchievementForm(achievement?: Achievement): FormGroup {
    return this.fb.group({
      id: [achievement?.id || this.generateId()],
      title: [achievement?.title || '', [Validators.required]],
      description: [achievement?.description || '', [Validators.required]],
      date: [achievement?.date || '', [Validators.required]],
      type: [achievement?.type || 'milestone', [Validators.required]],
      icon: [achievement?.icon || ''],
    });
  }

  addAchievement() {
    this.achievements.push(this.createAchievementForm());
  }

  removeAchievement(index: number) {
    this.achievements.removeAt(index);
  }

  setAchievements(achievements: Achievement[]) {
    const achievementFGs = achievements.map((achievement) =>
      this.createAchievementForm(achievement),
    );
    const achievementFormArray = this.fb.array(achievementFGs);
    this.orgForm.setControl('achievements', achievementFormArray);
  }

  addDefaultFormArrayItems() {
    // Add default empty items for new organizations
    this.addStatistic();
    this.addProgram();
    this.addDojo();
    this.addEvent();
    this.addLineageFeature();
    this.addSocialMedia();
    this.addLeader();
    this.addAchievement();
  }

  async onSubmit() {
    if (this.orgForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      try {
        const formValue = this.orgForm.value;

        // Ensure contact info is properly structured
        formValue.contact = {
          email: formValue.email || '',
          phone: formValue.phone || '',
          website: formValue.website || '',
        };

        if (this.isEditMode() && this.orgId()) {
          await this.organizationsService.updateOrganization(
            this.orgId()!,
            formValue,
          );
          this.showToastMessage(this.translationService.getTranslation('messages.updated'));
        } else {
          await this.organizationsService.createOrganization(formValue);
          this.showToastMessage(this.translationService.getTranslation('messages.created'));
        }

        this.router.navigate(['/dash/orgs']);
      } catch (error) {
        console.error('Error saving organization:', error);
        this.showToastMessage(this.translationService.getTranslation('messages.error_saving'));
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.markFormGroupTouched(this.orgForm);
      this.showToastMessage(this.translationService.getTranslation('errors.validation'));
    }
  }

  async onDelete() {
    if (this.isEditMode() && this.orgId()) {
      try {
        await this.organizationsService.removeOrganization(this.orgId()!);
        this.showToastMessage('Organization deleted successfully');
        this.router.navigate(['/dash/orgs']);
      } catch (error) {
        console.error('Error deleting organization:', error);
        this.showToastMessage('Error deleting organization. Please try again.');
      }
    }
  }

  onCancel() {
    this.router.navigate(['/dash/orgs']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
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
    return 'org_' + Math.random().toString(36).substr(2, 9);
  }

  private showToastMessage(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
  }

  onToastDismiss() {
    this.showToast.set(false);
  }

  onDeleteAlertDismiss() {
    this.showDeleteAlert.set(false);
  }

  confirmDelete() {
    this.showDeleteAlert.set(true);
  }
}
