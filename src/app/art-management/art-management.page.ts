import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArtsService, Art } from '../services/arts.service';
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
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  settings, 
  create, 
  trash, 
  checkmarkCircle, 
  add,
  chevronBack,
  close,
  save,
  informationCircle,
  shieldOutline,
  leafOutline,
  constructOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-art-management',
  templateUrl: './art-management.page.html',
  styleUrls: ['./art-management.page.scss'],
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
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ]
})
export class ArtManagementPage implements OnInit {
  art: Art | null = null;
  editedArt: Partial<Art> = {};
  selectedSegment: string = 'basic';
  isToastOpen = false;
  toastMessage = '';
  hasUnsavedChanges = false;

  // Form options
  categories = [
    { value: 'martial-arts', label: 'Martial Arts', icon: 'shield-outline' },
    { value: 'wellness', label: 'Wellness', icon: 'leaf-outline' },
    { value: 'crafts', label: 'Crafts', icon: 'construct-outline' }
  ];

  difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'all-levels', label: 'All Levels' }
  ];

  physicalDemandLevels = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' }
  ];

  // Temporary input fields for arrays
  newBenefit = '';
  newTechnique = '';
  newEquipment = '';
  newMentalAspect = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private artsService: ArtsService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      settings,
      create,
      trash,
      checkmarkCircle,
      add,
      chevronBack,
      close,
      save,
      informationCircle,
      shieldOutline,
      leafOutline,
      constructOutline
    });
  }

  ngOnInit() {
    const artId = this.route.snapshot.paramMap.get('id');
    if (artId) {
      this.loadArt(artId);
    }
  }

  private loadArt(artId: string) {
    const foundArt = this.artsService.getArtById(artId);
    if (foundArt) {
      // Check if current user is authorized to manage this art
      if (this.artsService.canUserEditArt(foundArt)) {
        this.art = foundArt;
        this.initializeEditedArt();
      } else {
        this.showToast('You are not authorized to manage this art. Only the owner can edit.');
        this.router.navigate(['/dash/art', artId]);
      }
    } else {
      this.showToast('Art not found');
      this.router.navigate(['/dash/arts']);
    }
  }

  private initializeEditedArt() {
    if (!this.art) return;
    
    this.editedArt = {
      name: this.art.name,
      description: this.art.description,
      shortDescription: this.art.shortDescription,
      image: this.art.image,
      category: this.art.category,
      origin: this.art.origin,
      philosophy: this.art.philosophy,
      benefits: [...(this.art.benefits || [])],
      techniques: [...(this.art.techniques || [])],
      equipment: [...(this.art.equipment || [])],
      difficulty: this.art.difficulty,
      physicalDemands: this.art.physicalDemands,
      mentalAspects: [...(this.art.mentalAspects || [])],
      isPublic: this.art.isPublic !== undefined ? this.art.isPublic : false // Default to false if undefined
    };
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }

  onFieldChange() {
    this.hasUnsavedChanges = true;
  }

  // Array management methods
  addBenefit() {
    if (this.newBenefit.trim()) {
      if (!this.editedArt.benefits) this.editedArt.benefits = [];
      this.editedArt.benefits.push(this.newBenefit.trim());
      this.newBenefit = '';
      this.hasUnsavedChanges = true;
    }
  }

  removeBenefit(index: number) {
    if (this.editedArt.benefits) {
      this.editedArt.benefits.splice(index, 1);
      this.hasUnsavedChanges = true;
    }
  }

  addTechnique() {
    if (this.newTechnique.trim()) {
      if (!this.editedArt.techniques) this.editedArt.techniques = [];
      this.editedArt.techniques.push(this.newTechnique.trim());
      this.newTechnique = '';
      this.hasUnsavedChanges = true;
    }
  }

  removeTechnique(index: number) {
    if (this.editedArt.techniques) {
      this.editedArt.techniques.splice(index, 1);
      this.hasUnsavedChanges = true;
    }
  }

  addEquipment() {
    if (this.newEquipment.trim()) {
      if (!this.editedArt.equipment) this.editedArt.equipment = [];
      this.editedArt.equipment.push(this.newEquipment.trim());
      this.newEquipment = '';
      this.hasUnsavedChanges = true;
    }
  }

  removeEquipment(index: number) {
    if (this.editedArt.equipment) {
      this.editedArt.equipment.splice(index, 1);
      this.hasUnsavedChanges = true;
    }
  }

  addMentalAspect() {
    if (this.newMentalAspect.trim()) {
      if (!this.editedArt.mentalAspects) this.editedArt.mentalAspects = [];
      this.editedArt.mentalAspects.push(this.newMentalAspect.trim());
      this.newMentalAspect = '';
      this.hasUnsavedChanges = true;
    }
  }

  removeMentalAspect(index: number) {
    if (this.editedArt.mentalAspects) {
      this.editedArt.mentalAspects.splice(index, 1);
      this.hasUnsavedChanges = true;
    }
  }

  async saveChanges() {
    if (!this.art || !this.validateForm()) {
      return;
    }

    try {
      // Update the art with edited values
      const updatedArt = await this.artsService.updateArt(this.art.id, this.editedArt);
      
      if (updatedArt) {
        this.art = updatedArt;
        this.hasUnsavedChanges = false;
        this.showToast('Changes saved successfully');
      } else {
        throw new Error('Update returned null');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      this.showToast('Error saving changes. Please try again.');
    }
  }

  async discardChanges() {
    if (!this.hasUnsavedChanges) {
      this.goBack();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Discard Changes?',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Discard',
          role: 'destructive',
          handler: () => {
            this.initializeEditedArt();
            this.hasUnsavedChanges = false;
            this.goBack();
          }
        }
      ]
    });

    await alert.present();
  }

  validateForm(): boolean {
    if (!this.editedArt.name?.trim()) {
      this.showToast('Please enter an art name');
      return false;
    }
    if (!this.editedArt.description?.trim()) {
      this.showToast('Please enter a description');
      return false;
    }
    if (!this.editedArt.shortDescription?.trim()) {
      this.showToast('Please enter a short description');
      return false;
    }
    if (!this.editedArt.category) {
      this.showToast('Please select a category');
      return false;
    }
    if (!this.editedArt.difficulty) {
      this.showToast('Please select a difficulty level');
      return false;
    }
    if (!this.editedArt.physicalDemands) {
      this.showToast('Please select physical demands level');
      return false;
    }
    return true;
  }

  goBack() {
    if (this.art) {
      this.router.navigate(['/dash/art', this.art.id]);
    } else {
      this.router.navigate(['/dash/arts']);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.icon || 'informationCircle';
  }
}
