import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Art } from './arts.service';

@Injectable({
  providedIn: 'root'
})
export class ArtsBackendService {
  private artsSubject = new BehaviorSubject<Art[]>([]);
  public arts$ = this.artsSubject.asObservable();

  private allArts: Art[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithBackend();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.loadArts();
  }

  // Load arts from backend or local storage
  async loadArts(): Promise<void> {
    try {
      if (this.isOnline) {
        // Note: This service is deprecated. Use ArtsService directly which now has GraphQL support.
        console.warn('ArtsBackendService is deprecated. Use ArtsService directly for GraphQL operations.');
        const arts: Art[] = [];
        this.allArts = arts as Art[];
        this.artsSubject.next(this.allArts);
        
        // Cache in local storage
        localStorage.setItem('arts_cache', JSON.stringify(this.allArts));
      } else {
        // Load from cache when offline
        const cached = localStorage.getItem('arts_cache');
        if (cached) {
          this.allArts = JSON.parse(cached);
          this.artsSubject.next(this.allArts);
        }
      }
    } catch (error) {
      console.error('Failed to load arts:', error);
      // Fallback to cache
      const cached = localStorage.getItem('arts_cache');
      if (cached) {
        this.allArts = JSON.parse(cached);
        this.artsSubject.next(this.allArts);
      }
    }
  }

  // Sync local changes with backend when coming online
  private async syncWithBackend(): Promise<void> {
    const pendingChanges = localStorage.getItem('pending_arts_changes');
    if (pendingChanges) {
      const changes = JSON.parse(pendingChanges);
      
      for (const change of changes) {
        try {
          switch (change.action) {
            case 'create':
              console.warn('ArtsBackendService is deprecated. Use ArtsService.createArt() instead.');
              break;
            case 'update':
              console.warn('ArtsBackendService is deprecated. Use ArtsService.updateArt() instead.');
              break;
            case 'delete':
              console.warn('ArtsBackendService is deprecated. Use ArtsService.deleteArt() instead.');
              break;
          }
        } catch (error) {
          console.error('Failed to sync change:', error);
        }
      }
      
      // Clear pending changes after sync
      localStorage.removeItem('pending_arts_changes');
      
      // Reload arts after sync
      await this.loadArts();
    }
  }

  // Get all arts
  getAllArts(): Art[] {
    return this.allArts;
  }

  // Get art by ID
  getArtById(id: string): Art | undefined {
    return this.allArts.find(art => art.id === id);
  }

  // Get arts by category
  getArtsByCategory(category: string): Art[] {
    if (category === 'all') return this.allArts;
    
    if (category === 'my-arts') {
      return this.allArts.filter(art => art.isUserPracticing === true);
    } else if (category === 'martial-arts') {
      return this.allArts.filter(art => art.category === 'martial-arts');
    } else if (category === 'wellness') {
      return this.allArts.filter(art => art.category === 'wellness');
    } else if (category === 'crafts') {
      return this.allArts.filter(art => art.category === 'crafts');
    } else {
      return this.allArts.filter(art => art.type === category);
    }
  }

  // Search arts
  searchArts(query: string): Art[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.allArts;

    return this.allArts.filter(art => 
      art.name.toLowerCase().includes(searchTerm) ||
      art.description.toLowerCase().includes(searchTerm) ||
      art.shortDescription.toLowerCase().includes(searchTerm) ||
      art.benefits.some(benefit => benefit.toLowerCase().includes(searchTerm)) ||
      art.techniques?.some(technique => technique.toLowerCase().includes(searchTerm)) ||
      art.mentalAspects.some(aspect => aspect.toLowerCase().includes(searchTerm))
    );
  }

  // Create a new art
  async createArt(artData: Partial<Art>): Promise<Art> {
    const newArt: Art = {
      id: this.generateId(),
      name: artData.name || 'New Art',
      type: artData.type || 'crafts',
      description: artData.description || '',
      shortDescription: artData.shortDescription || '',
      image: artData.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
      category: artData.category || 'crafts',
      origin: artData.origin || '',
      philosophy: artData.philosophy || '',
      benefits: artData.benefits || [],
      techniques: artData.techniques || [],
      equipment: artData.equipment || [],
      difficulty: artData.difficulty || 'beginner',
      physicalDemands: artData.physicalDemands || 'low',
      mentalAspects: artData.mentalAspects || [],
      relatedArts: artData.relatedArts || [],
      organizations: artData.organizations || [],
      studios: artData.studios || [],
      ownerId: 'current_user',
      isUserCreated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: artData.isPublic !== undefined ? artData.isPublic : true,
      isUserPracticing: artData.isUserPracticing || false
    };

    if (this.isOnline) {
      try {
        console.warn('ArtsBackendService is deprecated. Use ArtsService.createArt() instead.');
        const createdArt = newArt;
        this.allArts.push(createdArt as Art);
        this.artsSubject.next(this.allArts);
        return createdArt as Art;
      } catch (error) {
        console.error('Failed to create art online, saving for later sync:', error);
        this.addPendingChange('create', newArt.id, newArt);
      }
    } else {
      this.addPendingChange('create', newArt.id, newArt);
    }

    // Add to local cache
    this.allArts.push(newArt);
    this.artsSubject.next(this.allArts);
    return newArt;
  }

  // Update an existing art
  async updateArt(artId: string, updates: Partial<Art>): Promise<Art | null> {
    const artIndex = this.allArts.findIndex(art => art.id === artId);
    if (artIndex === -1) return null;

    const art = this.allArts[artIndex];
    
    // Check if user owns this art
    if (!this.canUserEditArt(art)) {
      throw new Error('You do not have permission to edit this art');
    }

    const updatedArt = {
      ...art,
      ...updates,
      id: artId,
      ownerId: art.ownerId,
      createdAt: art.createdAt,
      updatedAt: new Date().toISOString()
    };

    if (this.isOnline) {
      try {
        console.warn('ArtsBackendService is deprecated. Use ArtsService.updateArt() instead.');
        const result = updatedArt;
        this.allArts[artIndex] = result as Art;
        this.artsSubject.next(this.allArts);
        return result as Art;
      } catch (error) {
        console.error('Failed to update art online, saving for later sync:', error);
        this.addPendingChange('update', artId, updatedArt);
      }
    } else {
      this.addPendingChange('update', artId, updatedArt);
    }

    // Update local cache
    this.allArts[artIndex] = updatedArt;
    this.artsSubject.next(this.allArts);
    return updatedArt;
  }

  // Delete an art
  async deleteArt(artId: string): Promise<boolean> {
    const artIndex = this.allArts.findIndex(art => art.id === artId);
    if (artIndex === -1) return false;

    const art = this.allArts[artIndex];
    
    // Check if user owns this art
    if (!this.canUserEditArt(art)) {
      throw new Error('You do not have permission to delete this art');
    }

    if (this.isOnline) {
      try {
        console.warn('ArtsBackendService is deprecated. Use ArtsService.deleteArt() instead.');
      } catch (error) {
        console.error('Failed to delete art online, saving for later sync:', error);
        this.addPendingChange('delete', artId, null);
      }
    } else {
      this.addPendingChange('delete', artId, null);
    }

    // Remove from local cache
    this.allArts.splice(artIndex, 1);
    this.artsSubject.next(this.allArts);
    return true;
  }

  // Toggle user practicing status for an art
  async toggleUserPracticing(artId: string): Promise<boolean> {
    const art = this.getArtById(artId);
    if (art) {
      const newStatus = !art.isUserPracticing;
      await this.updateArt(artId, { isUserPracticing: newStatus });
      return newStatus;
    }
    return false;
  }

  // Check if current user can edit/delete an art
  canUserEditArt(art: Art): boolean {
    return art.ownerId === 'current_user' || art.isUserCreated === true;
  }

  // Get user's practiced arts
  getUserPracticedArts(): Art[] {
    return this.allArts.filter(art => art.isUserPracticing === true);
  }

  // Get arts created by current user
  getUserCreatedArts(): Art[] {
    return this.allArts.filter(art => art.isUserCreated === true);
  }

  // Get organizations for an art
  getArtOrganizations(artId: string): string[] {
    const art = this.getArtById(artId);
    return art ? art.organizations : [];
  }

  // Get studios for an art
  getArtStudios(artId: string): string[] {
    const art = this.getArtById(artId);
    return art ? art.studios : [];
  }

  // Get related arts
  getRelatedArts(artId: string): Art[] {
    const art = this.getArtById(artId);
    if (!art) return [];

    return this.allArts.filter(a => 
      a.id !== artId && (
        art.relatedArts.includes(a.id) ||
        a.relatedArts.includes(artId) ||
        a.category === art.category
      )
    );
  }

  // Private helper methods
  private generateId(): string {
    return 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private addPendingChange(action: string, id: string, data: any): void {
    const pending = localStorage.getItem('pending_arts_changes');
    const changes = pending ? JSON.parse(pending) : [];
    
    changes.push({ action, id, data, timestamp: Date.now() });
    localStorage.setItem('pending_arts_changes', JSON.stringify(changes));
  }
}