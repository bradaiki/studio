import { Component, OnInit, signal, computed } from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location as AngularLocation } from '@angular/common';
import { ArtsService, Art } from '../services/arts.service';
import { TranslationService } from '../services/translation.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonList,
  IonReorderGroup,
  IonReorder,
  IonFab,
  IonFabButton,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  save,
  add,
  trash,
  reorderThree,
  checkmarkCircle,
  closeCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-art-form',
  templateUrl: './art-form.page.html',
  styleUrls: ['./art-form.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonList,
    IonReorderGroup,
    IonReorder,
    IonFab,
    IonFabButton,
  ],
})
export class ArtFormPage implements OnInit {
  artForm: FormGroup;
  isEditMode = signal(false);
  artId = signal<string | null>(null);
  loading = signal(false);

  artTypes = [
    { value: 'aikido', label: 'Aikido' },
    { value: 'karate', label: 'Karate' },
    { value: 'taekwondo', label: 'Taekwondo' },
    { value: 'jujitsu', label: 'Jiu-Jitsu' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'kickboxing', label: 'Kickboxing' },
    { value: 'judo', label: 'Judo' },
    { value: 'pottery', label: 'Pottery' },
    { value: 'woodworking', label: 'Woodworking' },
    { value: 'jewelry', label: 'Jewelry Making' },
    { value: 'painting', label: 'Painting' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'crafts', label: 'General Crafts' },
  ];

  categories = [
    { value: 'martial-arts', label: 'Martial Arts' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'crafts', label: 'Crafts' },
  ];

  difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' },
  ];

  physicalDemands = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: AngularLocation,
    private artsService: ArtsService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translationService: TranslationService,
  ) {
    addIcons({
      arrowBack,
      save,
      add,
      trash,
      reorderThree,
      checkmarkCircle,
      closeCircle,
    });

    this.artForm = this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id'] && params['id'] !== 'new') {
        this.artId.set(params['id']);
        this.isEditMode.set(true);
        this.loadArt();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['crafts', Validators.required],
      category: ['crafts', Validators.required],
      shortDescription: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      image: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
      ],
      origin: [''],
      philosophy: [''],
      difficulty: ['beginner', Validators.required],
      physicalDemands: ['low', Validators.required],
      isPublic: [false],
      benefits: this.fb.array([]),
      techniques: this.fb.array([]),
      equipment: this.fb.array([]),
      mentalAspects: this.fb.array([]),
    });
  }

  loadArt() {
    if (!this.artId()) return;

    const art = this.artsService.getArtById(this.artId()!);
    if (!art) {
      this.showToast(this.translationService.getTranslation('art_form.not_found'), 'danger');
      this.router.navigate(['/tabs/arts']);
      return;
    }

    // Check if user can edit this art
    if (!this.artsService.canUserEditArt(art)) {
      this.showToast(this.translationService.getTranslation('art_form.no_permission'), 'danger');
      this.router.navigate(['/dash/art', this.artId()]);
      return;
    }

    // Populate form with art data
    this.artForm.patchValue({
      name: art.name,
      type: art.type,
      category: art.category,
      shortDescription: art.shortDescription,
      description: art.description,
      image: art.image,
      origin: art.origin || '',
      philosophy: art.philosophy || '',
      difficulty: art.difficulty,
      physicalDemands: art.physicalDemands,
      isPublic: art.isPublic !== false,
    });

    // Populate arrays
    this.setFormArray('benefits', art.benefits);
    this.setFormArray('techniques', art.techniques || []);
    this.setFormArray('equipment', art.equipment || []);
    this.setFormArray('mentalAspects', art.mentalAspects);
  }

  setFormArray(arrayName: string, values: string[]) {
    const formArray = this.artForm.get(arrayName) as FormArray;
    formArray.clear();
    values.forEach((value) => {
      formArray.push(this.fb.control(value, Validators.required));
    });
  }

  getFormArray(arrayName: string): FormArray {
    return this.artForm.get(arrayName) as FormArray;
  }

  addArrayItem(arrayName: string) {
    const formArray = this.getFormArray(arrayName);
    formArray.push(this.fb.control('', Validators.required));
  }

  removeArrayItem(arrayName: string, index: number) {
    const formArray = this.getFormArray(arrayName);
    formArray.removeAt(index);
  }

  async onSave() {
    if (this.artForm.invalid) {
      this.showToast(this.translationService.getTranslation('errors.validation'), 'warning');
      return;
    }

    this.loading.set(true);

    try {
      const formValue = this.artForm.value;

      if (this.isEditMode() && this.artId()) {
        // Update existing art
        const updatedArt = await this.artsService.updateArt(
          this.artId()!,
          formValue,
        );
        if (updatedArt) {
          this.showToast(this.translationService.getTranslation('messages.updated'), 'success');
          this.router.navigate(['/dash/art', this.artId()]);
        }
      } else {
        // Create new art
        const newArt = await this.artsService.createArt(formValue);
        this.showToast(this.translationService.getTranslation('messages.created'), 'success');
        this.router.navigate(['/dash/art', newArt.id]);
      }
    } catch (error: any) {
      this.showToast(error.message || this.translationService.getTranslation('errors.unknown'), 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async onDelete() {
    if (!this.isEditMode() || !this.artId()) return;

    const alert = await this.alertController.create({
      header: 'Delete Art',
      message:
        'Are you sure you want to delete this art? This action cannot be undone.',
      buttons: [
        {
          text: this.translationService.getTranslation('app.cancel'),
          role: 'cancel',
        },
        {
          text: this.translationService.getTranslation('app.delete'),
          role: 'destructive',
          handler: () => {
            this.deleteArt();
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteArt() {
    if (!this.artId()) return;

    try {
      const success = await this.artsService.deleteArt(this.artId()!);
      if (success) {
        this.showToast(this.translationService.getTranslation('messages.deleted'), 'success');
        this.router.navigate(['/tabs/arts']);
      }
    } catch (error: any) {
      this.showToast(error.message || this.translationService.getTranslation('messages.error_deleting'), 'danger');
    }
  }

  onBack() {
    this.location.back();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  pageTitle = computed(() => this.isEditMode() ? 'Edit Art' : 'Create New Art');
}
