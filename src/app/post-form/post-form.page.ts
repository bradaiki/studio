import { Component, OnInit, signal } from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonInput,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, image, pricetag } from 'ionicons/icons';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.page.html',
  styleUrls: ['./post-form.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonTextarea,
    IonInput,
    IonIcon,
  ],
})
export class PostFormPage implements OnInit {
  postForm: FormGroup;
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private toastController: ToastController,
  ) {
    addIcons({ save, image, pricetag });

    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      image: [''],
      tags: [''],
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.postForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      try {
        const formValue = this.postForm.value;

        // TODO: Implement post creation service
        console.log('Creating post:', formValue);

        await this.showToast('Post created successfully', 'success');
        this.router.navigate(['/dash/feed']);
      } catch (error) {
        console.error('Error creating post:', error);
        await this.showToast(
          'Error creating post. Please try again.',
          'danger',
        );
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      await this.showToast('Please fill in the required fields', 'warning');
    }
  }

  onCancel() {
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
}
