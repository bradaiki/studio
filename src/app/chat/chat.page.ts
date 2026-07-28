import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonInput,
  IonFooter,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonTextarea,
  IonFab,
  IonFabButton,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  send,
  add,
  chevronBack,
  peopleOutline,
  personOutline,
  homeOutline,
} from 'ionicons/icons';
import { Location } from '@angular/common';
import { ChatService } from '../services/chat.service';
import { PeopleService, Person } from '../services/people.service';
import { Chat, ChatMessage, CreateChatRequest } from '../models/chat.models';
import { Subscription } from 'rxjs';

interface ChatGroup {
  label: string;
  icon: string;
  chats: Chat[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonInput,
    IonFooter,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonTextarea,
    IonFab,
    IonFabButton,
    IonItemDivider,
  ],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent;
  chatGroups = signal<ChatGroup[]>([]);
  loading = signal(true);
  activeChat = signal<Chat | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  targetPerson = signal<Person | null>(null);
  highlightChatId = signal<string | null>(null);
  showNewChat = signal(false);
  newChatName = '';
  private targetUserId: string | null = null;
  private allChats: Chat[] = [];
  private messagesSub: Subscription | null = null;
  private chatsSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private chatService: ChatService,
    private peopleService: PeopleService,
  ) {
    addIcons({
      chatbubblesOutline,
      send,
      add,
      chevronBack,
      peopleOutline,
      personOutline,
      homeOutline,
    });
  }

  async ngOnInit() {
    this.chatsSub = this.chatService.chats$.subscribe((chats) => {
      this.allChats = chats;
      if (!this.activeChat()) this.buildGroups();
    });

    this.messagesSub = this.chatService.messages$.subscribe((allMsgs) => {
      const chat = this.activeChat();
      if (chat && allMsgs[chat.id]) {
        this.messages.set(allMsgs[chat.id]);
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    try {
      await this.chatService.loadUserChats();
      const chatId = this.route.snapshot.params['id'];
      this.targetUserId = this.route.snapshot.queryParamMap.get('userId');
      if (chatId) {
        await this.openChatById(chatId);
      } else if (this.targetUserId) {
        this.targetPerson.set(
          (await this.peopleService.getPersonByIdAsync(this.targetUserId)) ||
          null);
        this.scrollToRelevantChat();
      }
    } catch (e) {
      console.warn('[ChatPage] init error:', e);
    }
    this.loading.set(false);
  }

  ngOnDestroy() {
    this.chatsSub?.unsubscribe();
    this.messagesSub?.unsubscribe();
  }

  private buildGroups() {
    const sorted = this.sortByRecent(this.allChats);
    const priv = sorted.filter((c) => c.type === 'private');
    const group = sorted.filter((c) => c.type === 'group');
    const studio = sorted.filter((c) => c.type === 'studio');
    const groups: ChatGroup[] = [];
    if (priv.length)
      groups.push({
        label: 'Direct Messages',
        icon: 'person-outline',
        chats: priv,
      });
    if (group.length)
      groups.push({
        label: 'Group Chats',
        icon: 'people-outline',
        chats: group,
      });
    if (studio.length)
      groups.push({
        label: 'Studio Chats',
        icon: 'home-outline',
        chats: studio,
      });
    this.chatGroups.set(groups);
  }

  private sortByRecent(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
      const at = (a.lastMessageAt || a.updatedAt)?.getTime() || 0;
      const bt = (b.lastMessageAt || b.updatedAt)?.getTime() || 0;
      return bt - at;
    });
  }

  private scrollToRelevantChat() {
    if (!this.targetUserId) return;
    const uid = this.targetUserId;
    const person = this.targetPerson();
    const handle = person?.handle?.replace(/^@/, '') || '';
    const sorted = this.sortByRecent(this.allChats);
    const match = sorted.find((c) => {
      if (c.participantIds.includes(uid)) return true;
      if (handle && c.name.toLowerCase().includes(handle.toLowerCase()))
        return true;
      return false;
    });
    if (match) {
      this.highlightChatId.set(match.id);
      setTimeout(() => {
        document
          .getElementById('chat-item-' + match.id)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }

  async openChat(chat: Chat) {
    this.activeChat.set(chat);
    this.messages.set(await this.chatService.loadMessages(chat.id));
    this.router.navigate(['/dash/chat', chat.id], { replaceUrl: true });
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private async openChatById(chatId: string) {
    let chat = this.chatService.getChatById(chatId);
    if (!chat) {
      await this.chatService.loadUserChats();
      chat = this.chatService.getChatById(chatId);
    }
    if (chat) {
      this.activeChat.set(chat);
      this.messages.set(await this.chatService.loadMessages(chatId));
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  backToList() {
    this.activeChat.set(null);
    this.messages.set([]);
    this.buildGroups();
    this.router.navigate(['/dash/chat'], {
      replaceUrl: true,
      queryParams: this.targetUserId ? { userId: this.targetUserId } : {},
    });
  }

  async sendMessage() {
    const text = this.newMessage.trim();
    const chat = this.activeChat();
    if (!text || !chat) return;
    this.newMessage = '';
    try {
      await this.chatService.sendMessage({
        chatId: chat.id,
        message: text,
        messageType: 'text',
      });
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (e) {
      console.error('[ChatPage] send failed:', e);
      this.newMessage = text;
    }
  }

  onKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.sendMessage();
    }
  }

  openNewChat() {
    this.showNewChat.set(true);
    const person = this.targetPerson();
    this.newChatName = person
      ? `Chat with ${person.name || person.handle}`
      : '';
  }

  cancelNewChat() {
    this.showNewChat.set(false);
    this.newChatName = '';
  }

  async createNewChat() {
    const name = this.newChatName.trim();
    if (!name) return;
    const uid = this.chatService.getCurrentUserId();
    if (!uid) return;
    const participants = [uid];
    let chatType: 'private' | 'group' = 'group';
    if (this.targetUserId && this.targetUserId !== uid) {
      participants.push(this.targetUserId);
      chatType = 'private';
    }
    const chat = await this.chatService.createChat({
      name,
      type: chatType,
      participantIds: participants,
      accessLevel: chatType === 'private' ? 'private' : 'public',
      settings: {
        allowLeaving: true,
        allowMuting: true,
        allowInviting: chatType !== 'private',
        isPublic: chatType !== 'private',
      },
    });
    this.showNewChat.set(false);
    this.newChatName = '';
    await this.openChat(chat);
  }

  onBack() {
    this.location.back();
  }
  private scrollToBottom() {
    this.content?.scrollToBottom(200);
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  trackByChat(_i: number, c: Chat) {
    return c.id;
  }
  trackByMsg(_i: number, m: ChatMessage) {
    return m.id;
  }
  trackByGroup(_i: number, g: ChatGroup) {
    return g.label;
  }
}
