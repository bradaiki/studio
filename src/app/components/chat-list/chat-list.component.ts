import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonIcon,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonItemGroup,
  IonItemDivider,
  IonNote,
  IonSpinner,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbles,
  people,
  time,
  add,
  person,
  lockClosed,
  globe,
  mail,
  search,
  funnel,
  close,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatPersistenceService } from '../../services/chat-persistence.service';
import { ChatListItem } from '../../models/chat.models';
import {
  StudioChatOrganizer,
  OrganizedStudioChats,
} from '../../services/studio-chat-organizer.service';
import { ChatAccessController } from '../../services/chat-access-controller.service';
import {
  AccessControlService,
  ChatInvitation,
} from '../../services/access-control.service';

@Component({
  selector: 'app-chat-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Chats</ion-title>
        <ion-button slot="end" fill="clear" (click)="toggleSearch()">
          <ion-icon
            [name]="showSearch ? 'close' : 'search'"
            slot="icon-only"
          ></ion-icon>
        </ion-button>
        <ion-button slot="end" fill="clear" (click)="createNewChat()">
          <ion-icon name="add" slot="icon-only"></ion-icon>
        </ion-button>
      </ion-toolbar>

      <!-- Search and Filter Section -->
      @if (showSearch) {
        <ion-toolbar class="search-toolbar">
          <ion-searchbar
            [(ngModel)]="searchQuery"
            (ionInput)="onSearchInput($event)"
            (ionClear)="clearSearch()"
            placeholder="Search chats..."
            debounce="300"
            show-clear-button="focus"
          >
          </ion-searchbar>
        </ion-toolbar>
      }

      @if (showSearch) {
        <ion-toolbar class="filter-toolbar">
          <ion-segment
            [(ngModel)]="selectedFilter"
            (ionChange)="onFilterChange($event)"
            value="all"
          >
            <ion-segment-button value="all">
              <ion-label>All</ion-label>
            </ion-segment-button>
            <ion-segment-button value="public">
              <ion-icon name="globe"></ion-icon>
              <ion-label>Public</ion-label>
            </ion-segment-button>
            <ion-segment-button value="private">
              <ion-icon name="lockClosed"></ion-icon>
              <ion-label>Private</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content>
      <div class="chat-list-container">
        <!-- Loading state -->
        @if (isLoading) {
          <div class="loading-container">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Loading chats...</p>
          </div>
        }

        <!-- Search Results Info -->
        @if (
          showSearch && !isLoading && (searchQuery || selectedFilter !== 'all')
        ) {
          <div class="search-info">
            <ion-card class="search-results-card">
              <ion-card-content>
                <p class="search-results-text">
                  @if (searchQuery) {
                    <span>
                      {{ getSearchResultsCount() }} result(s) for "{{
                        searchQuery
                      }}"
                    </span>
                  }
                  @if (!searchQuery && selectedFilter !== 'all') {
                    <span>
                      {{ getFilterResultsCount() }} {{ selectedFilter }} chat(s)
                    </span>
                  }
                  @if (searchQuery && selectedFilter !== 'all') {
                    <span> in {{ selectedFilter }} chats </span>
                  }
                </p>
                @if (searchQuery || selectedFilter !== 'all') {
                  <ion-button
                    fill="clear"
                    size="small"
                    (click)="clearAllFilters()"
                  >
                    <ion-icon name="close" slot="start"></ion-icon>
                    Clear filters
                  </ion-button>
                }
              </ion-card-content>
            </ion-card>
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading && isEmpty) {
          <ion-card class="empty-state">
            <ion-card-header>
              <ion-card-title>
                {{ getEmptyStateTitle() }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ getEmptyStateMessage() }}</p>
              @if (!searchQuery && selectedFilter === 'all') {
                <ion-button expand="block" (click)="createNewChat()">
                  <ion-icon name="add" slot="start"></ion-icon>
                  Create New Chat
                </ion-button>
              }
              @if (searchQuery || selectedFilter !== 'all') {
                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="clearAllFilters()"
                >
                  <ion-icon name="close" slot="start"></ion-icon>
                  Clear Search & Filters
                </ion-button>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Organized chat list -->
        @if (!isLoading && !isEmpty) {
          <div class="organized-chats">
            <!-- Pending Invitations Section -->
            @if (filteredOrganizedChats.invitationsPending.length > 0) {
              <ion-item-group class="invitations-section">
                <ion-item-divider color="warning">
                  <ion-icon name="mail" slot="start"></ion-icon>
                  <ion-label>
                    <h2>Pending Invitations</h2>
                    <p>
                      {{
                        filteredOrganizedChats.invitationsPending.length
                      }}
                      invitation(s)
                    </p>
                  </ion-label>
                </ion-item-divider>
                @for (
                  invitation of filteredOrganizedChats.invitationsPending;
                  track invitation
                ) {
                  <ion-item class="invitation-item">
                    <ion-avatar slot="start">
                      <ion-icon name="mail" color="warning"></ion-icon>
                    </ion-avatar>
                    <ion-label>
                      <h3>{{ invitation.chatName || 'Private Chat' }}</h3>
                      <p>Invited by {{ invitation.inviterName }}</p>
                      <ion-note>{{
                        formatTime(invitation.createdAt)
                      }}</ion-note>
                    </ion-label>
                    <div slot="end" class="invitation-actions">
                      <ion-button
                        size="small"
                        fill="solid"
                        color="success"
                        (click)="acceptInvitation(invitation)"
                      >
                        Accept
                      </ion-button>
                      <ion-button
                        size="small"
                        fill="outline"
                        color="medium"
                        (click)="declineInvitation(invitation)"
                      >
                        Decline
                      </ion-button>
                    </div>
                  </ion-item>
                }
              </ion-item-group>
            }
            <!-- Public Chats Section -->
            @if (filteredOrganizedChats.totalPublic > 0) {
              <ion-item-group class="public-chats-section">
                <ion-item-divider color="primary">
                  <ion-icon name="globe" slot="start"></ion-icon>
                  <ion-label>
                    <h2>Public Chats</h2>
                    <p>
                      {{ filteredOrganizedChats.totalPublic }} chat(s) • Open to
                      all studio members
                    </p>
                  </ion-label>
                </ion-item-divider>
                @for (
                  chatItem of filteredOrganizedChats.publicChats;
                  track chatItem
                ) {
                  <ion-item
                    button
                    (click)="onChatClick(chatItem)"
                    class="chat-item public-chat"
                  >
                    <ion-avatar slot="start">
                      <ion-icon
                        [name]="getChatTypeIcon(chatItem.chat.type)"
                        [color]="getChatTypeColor(chatItem.chat.type)"
                        class="chat-type-icon"
                      >
                      </ion-icon>
                    </ion-avatar>
                    <ion-label>
                      <div class="chat-header">
                        <h2
                          class="chat-name"
                          [innerHTML]="highlightSearchTerm(chatItem.chat.name)"
                        ></h2>
                        <div class="chat-meta">
                          <ion-chip color="primary" size="small" outline="true">
                            <ion-icon name="globe" slot="start"></ion-icon>
                            Public
                          </ion-chip>
                          @if (chatItem.lastMessage) {
                            <span class="last-message-time">
                              {{ formatTime(chatItem.lastMessage.timestamp) }}
                            </span>
                          }
                        </div>
                      </div>
                      <div class="chat-details">
                        @if (chatItem.lastMessage) {
                          <p class="last-message">
                            <strong
                              >{{ chatItem.lastMessage.senderName }}:</strong
                            >
                            <span
                              [innerHTML]="
                                highlightSearchTerm(
                                  chatItem.lastMessage.message
                                )
                              "
                            ></span>
                          </p>
                        }
                        @if (!chatItem.lastMessage) {
                          <p class="no-messages">No messages yet</p>
                        }
                        <div class="chat-info">
                          <span class="participant-count">
                            <ion-icon name="people"></ion-icon>
                            {{ chatItem.participants.length }} participants
                          </span>
                        </div>
                      </div>
                    </ion-label>
                    <div slot="end" class="chat-badges">
                      @if (chatItem.unreadCount > 0) {
                        <ion-badge color="primary">
                          {{ chatItem.unreadCount }}
                        </ion-badge>
                      }
                    </div>
                  </ion-item>
                }
              </ion-item-group>
            }
            <!-- Private Chats Section -->
            @if (filteredOrganizedChats.totalPrivate > 0) {
              <ion-item-group class="private-chats-section">
                <ion-item-divider color="secondary">
                  <ion-icon name="lockClosed" slot="start"></ion-icon>
                  <ion-label>
                    <h2>Private Chats</h2>
                    <p>
                      {{ filteredOrganizedChats.totalPrivate }} chat(s) •
                      Invitation only
                    </p>
                  </ion-label>
                </ion-item-divider>
                @for (
                  chatItem of filteredOrganizedChats.privateChats;
                  track chatItem
                ) {
                  <ion-item
                    button
                    (click)="onChatClick(chatItem)"
                    class="chat-item private-chat"
                  >
                    <ion-avatar slot="start">
                      <ion-icon
                        [name]="getChatTypeIcon(chatItem.chat.type)"
                        [color]="getChatTypeColor(chatItem.chat.type)"
                        class="chat-type-icon"
                      >
                      </ion-icon>
                    </ion-avatar>
                    <ion-label>
                      <div class="chat-header">
                        <h2
                          class="chat-name"
                          [innerHTML]="highlightSearchTerm(chatItem.chat.name)"
                        ></h2>
                        <div class="chat-meta">
                          <ion-chip
                            color="secondary"
                            size="small"
                            outline="true"
                          >
                            <ion-icon name="lockClosed" slot="start"></ion-icon>
                            Private
                          </ion-chip>
                          @if (chatItem.lastMessage) {
                            <span class="last-message-time">
                              {{ formatTime(chatItem.lastMessage.timestamp) }}
                            </span>
                          }
                        </div>
                      </div>
                      <div class="chat-details">
                        @if (chatItem.lastMessage) {
                          <p class="last-message">
                            <strong
                              >{{ chatItem.lastMessage.senderName }}:</strong
                            >
                            <span
                              [innerHTML]="
                                highlightSearchTerm(
                                  chatItem.lastMessage.message
                                )
                              "
                            ></span>
                          </p>
                        }
                        @if (!chatItem.lastMessage) {
                          <p class="no-messages">No messages yet</p>
                        }
                        <div class="chat-info">
                          <span class="participant-count">
                            <ion-icon name="people"></ion-icon>
                            {{ chatItem.participants.length }} participants
                          </span>
                        </div>
                      </div>
                    </ion-label>
                    <div slot="end" class="chat-badges">
                      @if (chatItem.unreadCount > 0) {
                        <ion-badge color="secondary">
                          {{ chatItem.unreadCount }}
                        </ion-badge>
                      }
                    </div>
                  </ion-item>
                }
              </ion-item-group>
            }
            <!-- Empty sections message -->
            @if (
              filteredOrganizedChats.totalPublic === 0 &&
              filteredOrganizedChats.totalPrivate === 0 &&
              filteredOrganizedChats.invitationsPending.length === 0
            ) {
              <ion-card class="empty-organized">
                <ion-card-content>
                  <p>No accessible chats found for this studio.</p>
                  <ion-button fill="outline" (click)="refreshChats()">
                    <ion-icon name="refresh" slot="start"></ion-icon>
                    Refresh
                  </ion-button>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .chat-list-container {
        padding: 16px;
      }

      .search-toolbar {
        --background: var(--ion-color-light);
        --border-color: var(--ion-color-medium);
      }

      .filter-toolbar {
        --background: var(--ion-color-light);
        --border-color: var(--ion-color-medium);
        padding: 8px 16px;
      }

      .filter-toolbar ion-segment {
        --background: var(--ion-color-light-shade);
      }

      .search-info {
        margin: 8px 0;
      }

      .search-results-card {
        margin: 0;
        --background: var(--ion-color-light-tint);
      }

      .search-results-card ion-card-content {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .search-results-text {
        margin: 0;
        font-size: 14px;
        color: var(--ion-color-medium-shade);
      }

      .search-highlight {
        background-color: var(--ion-color-warning-tint);
        color: var(--ion-color-warning-contrast);
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 600;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }

      .loading-container p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }

      .empty-state {
        margin: 20px 0;
        text-align: center;
      }

      .empty-state ion-card-content {
        padding: 24px;
      }

      .empty-state ion-card-content p {
        color: var(--ion-color-medium);
        margin-bottom: 20px;
      }

      .empty-organized {
        margin: 20px 0;
        text-align: center;
      }

      .empty-organized ion-card-content {
        padding: 24px;
      }

      .empty-organized ion-card-content p {
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      .organized-chats {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .invitations-section,
      .public-chats-section,
      .private-chats-section {
        margin-bottom: 8px;
      }

      .invitations-section ion-item-divider {
        --background: var(--ion-color-warning-tint);
        --color: var(--ion-color-warning-contrast);
      }

      .public-chats-section ion-item-divider {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary-contrast);
      }

      .private-chats-section ion-item-divider {
        --background: var(--ion-color-secondary-tint);
        --color: var(--ion-color-secondary-contrast);
      }

      .invitation-item {
        --padding-start: 16px;
        --padding-end: 16px;
        margin-bottom: 4px;
        border-radius: 8px;
        --background: var(--ion-color-warning-tint);
      }

      .invitation-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .chat-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --inner-padding-end: 0;
        margin-bottom: 8px;
        border-radius: 12px;
        --background: var(--ion-color-light);
      }

      .chat-item:hover {
        --background: var(--ion-color-light-shade);
      }

      .public-chat {
        border-left: 4px solid var(--ion-color-primary);
      }

      .private-chat {
        border-left: 4px solid var(--ion-color-secondary);
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 4px;
      }

      .chat-name {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: var(--ion-color-dark);
      }

      .chat-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .last-message-time {
        font-size: 12px;
        color: var(--ion-color-medium);
        white-space: nowrap;
      }

      .last-message {
        font-size: 14px;
        color: var(--ion-color-dark);
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 250px;
      }

      .last-message strong {
        color: var(--ion-color-primary);
      }

      .no-messages {
        font-size: 14px;
        color: var(--ion-color-medium);
        font-style: italic;
        margin: 0 0 4px 0;
      }

      .chat-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .participant-count {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      .participant-count ion-icon {
        font-size: 14px;
      }

      .chat-type-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--ion-color-light-shade);
      }

      .chat-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .chat-badges ion-badge {
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }

      @media (prefers-color-scheme: dark) {
        .search-toolbar,
        .filter-toolbar {
          --background: var(--ion-color-dark);
        }

        .filter-toolbar ion-segment {
          --background: var(--ion-color-dark-shade);
        }

        .search-results-card {
          --background: var(--ion-color-dark-tint);
        }

        .search-highlight {
          background-color: var(--ion-color-warning-shade);
          color: var(--ion-color-warning-contrast);
        }

        .chat-item {
          --background: var(--ion-color-dark);
        }

        .chat-item:hover {
          --background: var(--ion-color-dark-shade);
        }

        .chat-type-icon {
          background: var(--ion-color-dark-shade);
        }

        .invitation-item {
          --background: var(--ion-color-warning-shade);
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    FormsModule,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonIcon,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonItemGroup,
    IonItemDivider,
    IonNote,
    IonSpinner,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
  ],
})
export class ChatListComponent implements OnInit, OnDestroy {
  @Input() studioId?: string; // Optional studio ID for filtering chats

  // Legacy chat list (for backward compatibility)
  chatList: ChatListItem[] = [];

  // Organized chats with access control
  organizedChats: OrganizedStudioChats = {
    publicChats: [],
    privateChats: [],
    invitationsPending: [],
    totalPublic: 0,
    totalPrivate: 0,
  };

  // Filtered chats for search and filtering
  filteredOrganizedChats: OrganizedStudioChats = {
    publicChats: [],
    privateChats: [],
    invitationsPending: [],
    totalPublic: 0,
    totalPrivate: 0,
  };

  // Search and filter state
  showSearch = false;
  searchQuery = '';
  selectedFilter: 'all' | 'public' | 'private' = 'all';

  // Loading and state management
  isLoading = false;
  isEmpty = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private chatPersistenceService: ChatPersistenceService,
    private studioChatOrganizer: StudioChatOrganizer,
    private chatAccessController: ChatAccessController,
    private accessControlService: AccessControlService,
    private router: Router,
    private toastController: ToastController,
  ) {
    addIcons({
      chatbubbles,
      people,
      time,
      add,
      person,
      lockClosed,
      globe,
      mail,
      search,
      funnel,
      close,
    });
  }

  ngOnInit() {
    this.loadOrganizedChats();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Load chats organized by access control (public/private sections)
   * Implements Requirements 6.1, 6.2, 6.4
   */
  private async loadOrganizedChats() {
    try {
      this.isLoading = true;

      if (this.studioId) {
        // Load studio-specific chats with access control
        this.organizedChats =
          await this.chatAccessController.getStudioChatsForUser(this.studioId);
      } else {
        // Load all user chats and organize them
        const chatListSub = this.chatService
          .getChatList()
          .subscribe(async (chatList) => {
            try {
              // Use the organizer to separate public/private chats
              this.organizedChats =
                this.studioChatOrganizer.organizeStudioChats(chatList);

              // Apply current search and filters
              this.applySearchAndFilters();

              // Get pending invitations if access controller is available
              if (this.chatAccessController.isServiceReady()) {
                const userId = this.chatAccessController.getCurrentUserId();
                if (userId) {
                  try {
                    const invitations =
                      await this.accessControlService.getUserChatInvitations(
                        userId,
                      );
                    // Enrich invitations with chat details
                    this.organizedChats.invitationsPending =
                      await this.enrichInvitations(invitations);
                    console.log(
                      'Loaded',
                      invitations.length,
                      'pending invitations for user:',
                      userId,
                    );
                  } catch (error) {
                    console.error('Failed to load invitations:', error);
                    this.organizedChats.invitationsPending = [];
                  }
                }
              }

              this.updateEmptyState();
            } catch (error) {
              console.error('Error organizing chats:', error);
              this.handleLoadError();
            }
          });

        this.subscriptions.push(chatListSub);
      }

      // Apply initial search and filters
      this.applySearchAndFilters();
      this.updateEmptyState();
    } catch (error) {
      console.error('Error loading organized chats:', error);
      this.handleLoadError();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update empty state based on filtered organized chats
   */
  private updateEmptyState() {
    this.isEmpty =
      this.filteredOrganizedChats.totalPublic === 0 &&
      this.filteredOrganizedChats.totalPrivate === 0 &&
      this.filteredOrganizedChats.invitationsPending.length === 0;
  }

  /**
   * Handle loading errors
   */
  private handleLoadError() {
    this.organizedChats = {
      publicChats: [],
      privateChats: [],
      invitationsPending: [],
      totalPublic: 0,
      totalPrivate: 0,
    };
    this.filteredOrganizedChats = { ...this.organizedChats };
    this.updateEmptyState();
  }

  /**
   * Toggle search interface visibility
   */
  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.clearAllFilters();
    }
  }

  /**
   * Handle search input with debouncing
   * Implements Requirements 6.5 - search functionality that respects access control
   */
  onSearchInput(event: any) {
    this.searchQuery = event.target.value?.toLowerCase() || '';
    this.applySearchAndFilters();
  }

  /**
   * Clear search query
   */
  clearSearch() {
    this.searchQuery = '';
    this.applySearchAndFilters();
  }

  /**
   * Handle filter change
   * Implements Requirements 6.5 - filtering options for public/private chats
   */
  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.applySearchAndFilters();
  }

  /**
   * Clear all search and filter criteria
   */
  clearAllFilters() {
    this.searchQuery = '';
    this.selectedFilter = 'all';
    this.applySearchAndFilters();
  }

  /**
   * Apply search and filter criteria to organized chats
   * Respects access control permissions - only searches through chats user has access to
   * Implements Requirements 6.5
   */
  private applySearchAndFilters() {
    // Start with the original organized chats (already filtered by access control)
    let filteredPublicChats = [...this.organizedChats.publicChats];
    let filteredPrivateChats = [...this.organizedChats.privateChats];
    let filteredInvitations = [...this.organizedChats.invitationsPending];

    // Apply search query if present
    if (this.searchQuery.trim()) {
      filteredPublicChats = this.filterChatsBySearch(filteredPublicChats);
      filteredPrivateChats = this.filterChatsBySearch(filteredPrivateChats);
      filteredInvitations = this.filterInvitationsBySearch(filteredInvitations);
    }

    // Apply type filter
    switch (this.selectedFilter) {
      case 'public':
        filteredPrivateChats = [];
        filteredInvitations = [];
        break;
      case 'private':
        filteredPublicChats = [];
        // Keep invitations as they're related to private chats
        break;
      case 'all':
      default:
        // Keep all filtered results
        break;
    }

    // Update filtered organized chats
    this.filteredOrganizedChats = {
      publicChats: filteredPublicChats,
      privateChats: filteredPrivateChats,
      invitationsPending: filteredInvitations,
      totalPublic: filteredPublicChats.length,
      totalPrivate: filteredPrivateChats.length,
    };

    this.updateEmptyState();
  }

  /**
   * Filter chat list items by search query
   * Searches in chat name, last message content, and participant names
   */
  private filterChatsBySearch(chats: ChatListItem[]): ChatListItem[] {
    if (!this.searchQuery.trim()) {
      return chats;
    }

    const query = this.searchQuery.toLowerCase();

    return chats.filter((chatItem) => {
      // Search in chat name
      if (chatItem.chat.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search in last message content
      if (chatItem.lastMessage?.message.toLowerCase().includes(query)) {
        return true;
      }

      // Search in last message sender name
      if (chatItem.lastMessage?.senderName.toLowerCase().includes(query)) {
        return true;
      }

      // Search in participant names (if available)
      if (
        chatItem.participants.some((participant) =>
          participant.userName?.toLowerCase().includes(query),
        )
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Filter invitations by search query
   * Searches in chat name and inviter name
   */
  private filterInvitationsBySearch(invitations: any[]): any[] {
    if (!this.searchQuery.trim()) {
      return invitations;
    }

    const query = this.searchQuery.toLowerCase();

    return invitations.filter((invitation) => {
      // Search in chat name
      if (invitation.chatName?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in inviter name
      if (invitation.inviterName?.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Highlight search terms in text
   */
  highlightSearchTerm(text: string): string {
    if (!this.searchQuery.trim() || !text) {
      return text;
    }

    const query = this.searchQuery.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Get search results count for display
   */
  getSearchResultsCount(): number {
    return (
      this.filteredOrganizedChats.totalPublic +
      this.filteredOrganizedChats.totalPrivate +
      this.filteredOrganizedChats.invitationsPending.length
    );
  }

  /**
   * Get filter results count for display
   */
  getFilterResultsCount(): number {
    switch (this.selectedFilter) {
      case 'public':
        return this.filteredOrganizedChats.totalPublic;
      case 'private':
        return (
          this.filteredOrganizedChats.totalPrivate +
          this.filteredOrganizedChats.invitationsPending.length
        );
      default:
        return this.getSearchResultsCount();
    }
  }

  /**
   * Get appropriate empty state title based on current filters
   */
  getEmptyStateTitle(): string {
    if (this.searchQuery) {
      return 'No Search Results';
    }
    if (this.selectedFilter === 'public') {
      return 'No Public Chats';
    }
    if (this.selectedFilter === 'private') {
      return 'No Private Chats';
    }
    return 'No Chats Yet';
  }

  /**
   * Get appropriate empty state message based on current filters
   */
  getEmptyStateMessage(): string {
    if (this.searchQuery) {
      return `No chats found matching "${this.searchQuery}". Try adjusting your search terms or filters.`;
    }
    if (this.selectedFilter === 'public') {
      return 'No public chats are available in this studio. Public chats are open to all studio members.';
    }
    if (this.selectedFilter === 'private') {
      return 'No private chats are accessible to you. Private chats require an invitation to join.';
    }
    return 'Start a conversation by creating a new chat or joining a studio.';
  }

  /**
   * Refresh chats (reload organized chats)
   */
  async refreshChats() {
    console.log('Refreshing chats...');
    await this.loadOrganizedChats();
  }

  /**
   * Enrich invitations with chat details for display
   */
  private async enrichInvitations(
    invitations: ChatInvitation[],
  ): Promise<any[]> {
    const enrichedInvitations = [];

    for (const invitation of invitations) {
      try {
        // Get chat details to enrich the invitation
        const chat = await this.chatPersistenceService.getChatById(
          invitation.chatId,
        );

        const enriched = {
          ...invitation,
          chatName: chat?.name || 'Private Chat',
          inviterName: invitation.invitedBy, // This could be enriched with actual user name
          createdAt: invitation.invitedAt,
          studioId: chat?.studioId,
        };

        enrichedInvitations.push(enriched);
      } catch (error) {
        console.error('Failed to enrich invitation:', invitation.id, error);
        // Add the invitation without enrichment
        enrichedInvitations.push({
          ...invitation,
          chatName: 'Private Chat',
          inviterName: invitation.invitedBy,
          createdAt: invitation.invitedAt,
        });
      }
    }

    return enrichedInvitations;
  }

  /**
   * Accept a chat invitation
   */
  async acceptInvitation(invitation: any) {
    try {
      console.log('Accepting invitation:', invitation);

      // Accept the invitation through the access control service
      await this.accessControlService.acceptChatInvitation(invitation.id);

      // Show success message
      const toast = await this.toastController.create({
        message: `Successfully joined "${invitation.chatName || 'Private Chat'}"!`,
        duration: 3000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Navigate to the newly accessible chat
      if (invitation.studioId && invitation.chatId) {
        this.router.navigate(['/studio', invitation.studioId], {
          queryParams: { chatId: invitation.chatId },
        });
      }

      // Refresh the chat list to show the newly accessible chat and remove the invitation
      await this.refreshChats();
    } catch (error) {
      console.error('Error accepting invitation:', error);

      // Show error message
      const toast = await this.toastController.create({
        message: 'Failed to accept invitation. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }

  /**
   * Decline a chat invitation
   */
  async declineInvitation(invitation: any) {
    try {
      console.log('Declining invitation:', invitation);

      // Decline the invitation through the access control service
      await this.accessControlService.declineChatInvitation(invitation.id);

      // Remove from local list
      this.organizedChats.invitationsPending =
        this.organizedChats.invitationsPending.filter(
          (inv) => inv.id !== invitation.id,
        );

      // Show confirmation message
      const toast = await this.toastController.create({
        message: `Declined invitation to "${invitation.chatName || 'Private Chat'}"`,
        duration: 2000,
        color: 'medium',
        position: 'top',
      });
      await toast.present();

      // Apply filters to update the display
      this.applySearchAndFilters();
    } catch (error) {
      console.error('Error declining invitation:', error);

      // Show error message
      const toast = await this.toastController.create({
        message: 'Failed to decline invitation. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  getChatTypeIcon(type: string): string {
    switch (type) {
      case 'studio':
        return 'people';
      case 'group':
        return 'chatbubbles';
      case 'private':
        return 'person';
      default:
        return 'chatbubbles';
    }
  }

  getChatTypeColor(type: string): string {
    switch (type) {
      case 'studio':
        return 'primary';
      case 'group':
        return 'secondary';
      case 'private':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  onChatClick(chatItem: ChatListItem) {
    console.log('Chat clicked:', chatItem.chat.name);
    // In a real app, this would navigate to the chat detail page
    // or open the chat in a modal/sidebar
  }

  async createNewChat() {
    try {
      const newChat = await this.chatService.createChat({
        name: 'New Group Chat',
        description: 'A new group chat',
        type: 'group',
        participantIds: ['user1', 'user2'], // Would be selected from a user picker
        settings: {
          allowLeaving: true,
          allowMuting: true,
          allowInviting: true,
          isPublic: false,
        },
      });

      console.log('New chat created:', newChat);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }
}
