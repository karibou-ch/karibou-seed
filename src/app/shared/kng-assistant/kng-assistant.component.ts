import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Config, User, AssistantService, AssistantState, parseSteps, AnalyticsService } from 'kng2-core';
import { i18n } from 'src/app/common';
import { KngAssistantHistoryComponent, AssistantDisplayMessage } from './kng-assistant-history.component';
import { KngPromptComponent } from './kng-prompt.component';

// Re-export for backward compatibility
export { AssistantState } from 'kng2-core';
export { AssistantDisplayMessage } from './kng-assistant-history.component';

/**
 * KngAssistantComponent
 *
 * Composant principal intégrant:
 * - <kng-assistant-history> pour l'affichage des messages
 * - <kng-prompt> pour la saisie utilisateur
 *
 * Pattern inspiré de kng-sgc.component avec composants Web Awesome.
 */
@Component({
  selector: 'kng-assistant',
  templateUrl: './kng-assistant.component.html',
  styleUrls: ['./kng-assistant.component.scss']
})
export class KngAssistantComponent implements OnInit, OnDestroy {

  @ViewChild('history') historyComponent: KngAssistantHistoryComponent;
  @ViewChild('promptComponent') promptComponent: KngPromptComponent;

  @Output() assistant: EventEmitter<AssistantState> = new EventEmitter<AssistantState>();

  @Input() user: User;
  @Input() config: Config;
  @Input() widget: boolean = true;
  @Input() agent: "productsagent" | "quote" | "checkout" | "feedback" | "recipefull" | "james" = "james";

  @Input() tips: Array<{ clazz?: string, label: string, action: string }> = [];
  @Input() prompts: string[] = [];
  @Input() autoRecord: boolean = false;
  @Input() thinking: boolean = false;

  @Input() set prompt(value: string) {
    this._prompt = value;
    if (value && this.isReady) {
      this.onChat({ prompt: value });
    }
  }

  private _prompt: string = '';
  private destroy$ = new Subject<void>();
  private chatSubscription: Subscription | null = null;

  isReady: boolean = false;
  isFeedbackReady: boolean = false;
  isMailSent: boolean = false;
  error: string = '';
  currentState: AssistantState;

  constructor(
    private $assistant: AssistantService,
    private $metric: AnalyticsService,
    private $i18n: i18n,
    private $cdr: ChangeDetectorRef
  ) {
    this.user = new User({ displayName: 'Anonymous' });
  }

  get label() {
    return this.$i18n.label();
  }

  get store() {
    return this.config?.shared?.hub?.slug;
  }

  get hub() {
    return this.config?.shared?.hub;
  }

  get prompt() {
    return this._prompt;
  }

  get isAssistantRunning() {
    return this.currentState?.status === 'running';
  }

  get messagesCount() {
    return this.historyComponent?.discussionMessages?.length || 0;
  }

  get messagesLimit() {
    return this.messagesCount > 20;
  }

  get audioIsRecording() {
    return this.promptComponent?.audioIsRecording || false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    // Subscribe to state changes
    this.$assistant.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.currentState = state;
      this.emitState(state.status);
      this.$cdr.markForCheck();
    });

    this.isReady = true;

    // Si un prompt initial est défini
    if (this._prompt) {
      this.onChat({ prompt: this._prompt });
    }
  }

  /**
   * Emit state to parent component
   */
  private emitState(status: string) {
    const state: AssistantState = {
      status: status as any,
      usage: this.currentState?.usage,
      agent: this.agent,
      content: this.currentState?.content,
      steps: this.currentState?.steps,
      error: this.error
    };
    this.assistant.emit(state);
  }

  /**
   * Handle chat request from prompt component
   */
  onChatRequest($event: { prompt?: string, audio?: string, agent?: string, ragname?: string, thinking?: boolean }) {
    // Use thinking from event if provided, otherwise use component input
    if ($event.thinking !== undefined) {
      this.thinking = $event.thinking;
    }
    this.onChat($event);
  }

  /**
   * Handle thinking change from prompt component
   */
  onThinkingChange(thinking: boolean) {
    this.thinking = thinking;
  }

  /**
   * Handle clear request from prompt component
   */
  onClearRequest() {
    this.onClear();
  }

  /**
   * Handle chat request
   */
  onChat($event: { prompt?: string, audio?: string }) {
    if (this.chatSubscription) {
      return;
    }

    const params: any = { hub: this.store, agent: this.agent };

    if ($event.audio) {
      params.body = { audio: $event.audio };
      params.q = "( ͡° ᴥ ͡°)"; // Audio marker
    } else {
      params.q = $event.prompt;
    }

    if (!params.q) return;

    this.error = '';
    this.emitState('start');

    this.chatSubscription = this.$assistant.chat(params).subscribe({
      next: (chunk) => {
        // Le service gère automatiquement la mise à jour de la discussion
        this.$cdr.markForCheck();
      },
      error: (err) => {
        this.chatSubscription = null;
        this.error = err.error || err.message;
        this.isFeedbackReady = false;
        this.emitState('error');
      },
      complete: () => {
        this.chatSubscription = null;
        this.isFeedbackReady = true;
        this.emitState('end');
      }
    });
  }

  /**
   * Handle clear request from prompt component
   */
  async onClear() {
    if (this.historyComponent) {
      await this.historyComponent.loadHistory(true);
    }
  }

  /**
   * Handle chat action from history component
   */
  onHistoryChat($event: { message: AssistantDisplayMessage, index: number }) {
    // Could be used to continue conversation from a specific point
    console.log('Chat from history:', $event);
  }

  /**
   * Abort current request
   */
  abort() {
    if (!this.chatSubscription) return;
    this.chatSubscription.unsubscribe();
    this.chatSubscription = null;
    this.$assistant.abort();
  }

  /**
   * Public methods for external control (compatibility)
   */
  audioRecord($event?: Event) {
    this.promptComponent?.toggleAudioRecorder();
  }

  onPrompt($event: Event, action: string) {
    this.onChat({ prompt: action });
  }
}
