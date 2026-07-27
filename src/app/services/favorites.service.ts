import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export type ItemType = 'art' | 'studio' | 'organization' | 'person' | 'event';

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  itemType: ItemType;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private client = generateClient();
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  private favoriteItemIds = new Set<string>();
  private currentUserId: string | null = null;

  constructor() {
    this.initializeUser();
  }

  private async initializeUser() {
    try {
      // Check if user has valid tokens first
      const session = await fetchAuthSession();
      if (!session.tokens) {
        console.log('[Favorites] No valid tokens, favorites disabled');
        return;
      }

      const user = await getCurrentUser();
      this.currentUserId = user.userId;
      await this.loadFavorites();
    } catch (error) {
      console.log('[Favorites] User not authenticated, favorites disabled');
    }
  }

  private async loadFavorites() {
    if (!this.currentUserId) return;

    try {
      const result = await (this.client.models as any)['Favorite'].list({
        filter: { userId: { eq: this.currentUserId } },
        authMode: 'userPool'
      });

      if (result.data) {
        const favorites: Favorite[] = result.data.map((fav: any) => ({
          id: fav.id,
          userId: fav.userId,
          itemId: fav.itemId,
          itemType: fav.itemType as ItemType,
          createdAt: fav.createdAt
        }));

        this.favoritesSubject.next(favorites);
        this.favoriteItemIds = new Set(favorites.map(f => f.itemId));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  async toggleFavorite(itemId: string, itemType: ItemType): Promise<boolean> {
    if (!this.currentUserId) {
      console.warn('User not authenticated');
      return false;
    }

    const isFavorited = this.isFavorite(itemId);

    if (isFavorited) {
      return await this.removeFavorite(itemId);
    } else {
      return await this.addFavorite(itemId, itemType);
    }
  }

  private async addFavorite(itemId: string, itemType: ItemType): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const result = await (this.client.models as any)['Favorite'].create({
        userId: this.currentUserId,
        itemId: itemId,
        itemType: itemType,
        createdAt: new Date().toISOString()
      });

      if (result.data) {
        const newFavorite: Favorite = {
          id: result.data.id,
          userId: result.data.userId,
          itemId: result.data.itemId,
          itemType: result.data.itemType as ItemType,
          createdAt: result.data.createdAt
        };

        const currentFavorites = this.favoritesSubject.value;
        this.favoritesSubject.next([...currentFavorites, newFavorite]);
        this.favoriteItemIds.add(itemId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }

  private async removeFavorite(itemId: string): Promise<boolean> {
    if (!this.currentUserId) return false;

    try {
      const currentFavorites = this.favoritesSubject.value;
      const favorite = currentFavorites.find(f => f.itemId === itemId);

      if (!favorite) return false;

      const result = await (this.client.models as any)['Favorite'].delete({
        id: favorite.id
      });

      if (result.data || !result.errors) {
        const updatedFavorites = currentFavorites.filter(f => f.itemId !== itemId);
        this.favoritesSubject.next(updatedFavorites);
        this.favoriteItemIds.delete(itemId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }

  isFavorite(itemId: string): boolean {
    return this.favoriteItemIds.has(itemId);
  }

  getFavoritesByType(itemType: ItemType): Favorite[] {
    return this.favoritesSubject.value.filter(f => f.itemType === itemType);
  }

  getAllFavorites(): Favorite[] {
    return this.favoritesSubject.value;
  }

  async refreshFavorites(): Promise<void> {
    await this.loadFavorites();
  }
}
