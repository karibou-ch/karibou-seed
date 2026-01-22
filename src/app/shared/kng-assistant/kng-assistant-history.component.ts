/**
 * KngAssistantHistoryComponent
 *
 * ✅ Copie du pattern kng-history de to-migrate-here
 * Les fonctionnalités mémoire et pin sont en commentaire FIXME
 */
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Config, User, ProductService, Product, AssistantService, AssistantState, AssistantMessage, AssistantStep, AnalyticsService } from 'kng2-core';
import { Router } from '@angular/router';
import { i18n } from 'src/app/common';

import './kng-assistant-wa';
import markdownit from 'markdown-it';

/**
 * Message étendu pour affichage avec produits
 */
export interface AssistantDisplayMessage extends AssistantMessage {
  assistant?: boolean;
  running?: boolean;
  audio?: boolean;
  products?: Product[];
  html?: string;
}

@Component({
  selector: 'kng-assistant-history',
  templateUrl: './kng-assistant-history.component.html',
  styleUrls: ['./kng-assistant-history.component.scss']
})
export class KngAssistantHistoryComponent implements OnInit, OnDestroy {

  @Input() agent: string = 'james';
  @Input() user: User;
  @Input() config: Config;
  @Input() withHeader: boolean = false;
  @Input() welcome: string = 'Bienvenue';
  @Input() welcomeDescription: string = 'Posez votre question à l\'assistant';

  // ✅ Links pour le welcome screen (comme l'original)
  linksByAgent = {
    'james': [
      { name: 'Qui es-tu ?', action: 'Bonjour James, qui es-tu ?' },
      { name: 'Mon Menu', action: 'Tu génères un menu de la semaine avec mon panier' },
      { name: 'Aide', action: '/help' },
    ]
  };

  // FIXME: renommé de chatEvt à chat pour compatibilité avec le template
  @Output() chat: EventEmitter<{ message: AssistantDisplayMessage, index: number }> = new EventEmitter();

  private destroy$ = new Subject<void>();
  private debounceScroll: any = null;

  // ✅ Copie exacte de l'original: discussionMessages
  discussionMessages: AssistantDisplayMessage[] = [];

  // ✅ Alias pour compatibilité avec le template existant
  get messages() { return this.discussionMessages; }

  // FIXME: ajouter pour la migration complète
  showPinnedProducts: boolean = false;

  markdown: any;
  isAssistantRuning: boolean = false;
  showSteps: boolean = true;
  currentDiscussionId: string | null = null;

  // FIXME: nécessite KngMemoriesService
  isDiscussionMemorized: boolean = false;
  // FIXME: nécessite loader data
  isGuest: boolean = false;

  // État pour action en cours
  private _isActionRunning = false;

  constructor(
    private $assistant: AssistantService,
    private $products: ProductService,
    private $metric: AnalyticsService,
    private $i18n: i18n,
    private $router: Router,
    private $ef: ElementRef,
    private $cdr: ChangeDetectorRef
  ) {
    this.user = new User({ displayName: 'Anonymous' });
    this.markdown = markdownit({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  get label() {
    return this.$i18n.label();
  }

  get displayName() {
    return this.user?.displayName || 'Vous';
  }

  get store() {
    return this.config?.shared?.hub?.slug;
  }

  get links() {
    return this.linksByAgent[this.agent] || [];
  }

  get lastMessage() {
    if (this.discussionMessages.length === 0) {
      return { steps: [], id: '', content: '', role: 'assistant' as const, timestamp: new Date() };
    }
    const last = this.discussionMessages[this.discussionMessages.length - 1];
    return {
      ...last,
      steps: last.steps || []
    };
  }

  isActionRunning(): boolean {
    return this._isActionRunning;
  }

  // ✅ Alias pour compatibilité avec le template (avec méthode)
  isAssistantRunning(): boolean {
    return this.isAssistantRuning;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.debounceScroll) {
      clearTimeout(this.debounceScroll);
    }
  }

  ngOnInit(): void {
    // ✅ Scroll to top on init (comme l'original)
    this.scrollToTop();

    // ✅ COPIE EXACTE: Subscribe to state$ ONLY for assistant running status + steps
    this.$assistant.state$.pipe(
      takeUntil(this.destroy$),
      filter(state => !this.agent || state.agent === this.agent)
    ).subscribe(state => {
      this.isAssistantRuning = (state?.status === 'running');

      // ✅ COPIE EXACTE: Update ONLY steps on last message (pas content!)
      // Le content est géré par discussion$ via updateTemporaryAssistantMessage()
      if (state.steps?.length && this.discussionMessages.length > 0) {
        const lastIndex = this.discussionMessages.length - 1;
        this.discussionMessages[lastIndex].steps = state.steps;
      }

      // ✅ COPIE EXACTE: Sync history after completion
      if (state?.status === 'end') {
        this.$assistant.history({ agent: this.agent, hub: this.store }).toPromise();
      }

      this.scrollToBottom();
      this.$cdr.markForCheck();
    });

    // ✅ COPIE EXACTE: Load initial history
    this.$assistant.history({ agent: this.agent, hub: this.store }).toPromise();

    // ✅ COPIE EXACTE: Subscribe to discussion$ for all message management
    this.$assistant.discussion$.pipe(
      takeUntil(this.destroy$),
      filter(discussion => !this.agent || discussion.agent === this.agent)
    ).subscribe(discussion => {
      if (!discussion.id) {
        this.currentDiscussionId = null;
        this.isDiscussionMemorized = false;
        return;
      }
      // ✅ COPIE EXACTE: assigner directement les messages
      this.discussionMessages = discussion.messages.map(msg => ({
        ...msg,
        assistant: msg.role === 'assistant',
        running: msg.id?.startsWith('temp-'),
        audio: false,
        products: [],
        html: this.renderMarkdown(msg.content)
      }));

      this.currentDiscussionId = discussion.id;

      // Load products for last assistant message (karibou-specific)
      if (this.discussionMessages.length) {
        const lastAssistant = [...this.discussionMessages].reverse().find(m => m.assistant);
        if (lastAssistant) {
          this.loadProducts(lastAssistant);
        }
      }

      this.scrollToBottom();
      this.$cdr.markForCheck();
    });
  }

  // ✅ Copie exacte: scroll methods
  private scrollToTop() {
    if (this.$ef) {
      setTimeout(() => {
        this.$ef.nativeElement.scrollTop = 0;
      }, 100);
    }
  }

  private scrollToBottom() {
    const element = this.$ef?.nativeElement;

    // Debounce: Cancel previous scroll if new one is requested
    if (this.debounceScroll || !element) {
      return;
    }

    this.debounceScroll = setTimeout(() => {
      this.debounceScroll = null;
      const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 400;
      // Only auto-scroll if user is near bottom (not manually scrolled up)
      if (!isNearBottom) {
        return;
      }
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }, 600);
  }

  // ✅ Copie exacte: renderStep
  renderStep(json: any) {
    try {
      return json.description || json.content;
    } catch (e) {
      return '';
    }
  }

  // ✅ Copie exacte: renderMarkdown
  renderMarkdown(message: string | undefined): string {
    if (!message) {
      return '';
    }
    return this.markdown.render(message.trim());
  }

  // ✅ Copie exacte: onAsk
  async onAsk(text: string) {
    await this.$assistant.chat({ q: text, agent: this.agent, hub: this.store }).toPromise();
  }

  // ✅ Méthode pour le template - émet l'événement chat
  onChat(message: AssistantDisplayMessage, index: number) {
    this.chat.emit({ message, index });
  }

  // ✅ Méthode loadHistory pour compatibilité avec kng-assistant.component
  async loadHistory(clear?: boolean) {
    const params: any = { agent: this.agent, hub: this.store };
    if (clear) params.clear = 'true';
    await this.$assistant.history(params).toPromise();
  }

  // ✅ Copie exacte: onCopyWithHtml
  async onCopyWithHtml(id: string, $event: any) {
    const target = document.getElementById(`msg-${id}`);
    if (!target) {
      return;
    }

    const formattedHtml = target.innerHTML;
    const plainText = target.innerText;

    const item = new ClipboardItem({
      'text/html': new Blob([formattedHtml], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    });

    try {
      await navigator.clipboard.write([item]);
    } catch (error) {
      console.error('Erreur lors de la copie du contenu:', error);
    }

    $event.preventDefault();
  }

  // ✅ Copie exacte: onMarkdownClick (renommé onClickAction)
  @HostListener('click', ['$event'])
  async onMarkdownClick($event) {
    const target = $event.target as HTMLElement;
    const href = target.getAttribute('href') || '';
    const text = target.innerText;

    if (!href) {
      return;
    }
    $event.stopPropagation();
    $event.preventDefault();

    // Handle external links
    const isExternalLink = ['mailto:', 'tel:', 'https://', 'ftp://'].some(prefix => href.indexOf(prefix) === 0);
    if (isExternalLink) {
      window.open(href, '_blank');
      return;
    }

    // Handle karibou-specific links
    const rules = [
      { regexp: /^\/store\/.*$/, prompt: '-', param: false },
      { regexp: /quote\/orders/, prompt: '5 exemples de produits pour ma demande de devis ', param: false },
      { regexp: /products\/cart/, prompt: 'Quelques recettes avec mon panier ', param: false },
      { regexp: /products\/box/, prompt: 'Le panier de fruits et légumes de la semaine', param: false },
      { regexp: /products\/school/, prompt: 'Une sélection pour 100 enfants', param: false },
      { regexp: /products\/orders/, prompt: 'Informations sur mes dernières commandes', param: false },
      { regexp: /popular\/([^)]+)/, prompt: 'Quelques recettes avec les produits populaires', param: false },
      { regexp: /recipe\/([^)]+)/, prompt: 'Le détail de la recette ', param: true },
      { regexp: /search\/([^)]+)/, prompt: 'Cherche les aliments séparés pour ', param: true },
      { regexp: /theme\/([^)]+)/, prompt: '10 recettes de la thématique ', param: true },
      { regexp: /document\/([^)]+)/, prompt: 'Je souhaite connaître ', param: true },
      { regexp: /sku\/([^)]+)/, prompt: 'Je souhaite des variations de ', param: true },
    ];

    for (const rule of rules) {
      const values = rule.regexp.exec(href);
      if (!values || !values.length) continue;

      if (rule.prompt === '-') {
        this.$router.navigateByUrl(values[0]);
        break;
      }

      const param = rule.param ? ("'" + decodeURI(values[1].replace(/_/gm, ' ')) + "'") : '';
      await this.$assistant.chat({ q: rule.prompt + param, agent: this.agent, hub: this.store }).toPromise();
      break;
    }
  }

  // ✅ Feedback - version karibou
  async onFeedback(message: any, feedback: string) {
    if (this._isActionRunning) return;
    this._isActionRunning = true;
    try {
      const index = this.discussionMessages.findIndex(msg => msg.id === message.id);
      if (index > -1) {
        const content = { ...this.discussionMessages[0], ...this.discussionMessages.slice(index - 1) };
        await this.$metric.feedback(feedback, content).toPromise();
      }
    } finally {
      this._isActionRunning = false;
      this.$cdr.markForCheck();
    }
  }

  // FIXME: nécessite KngPinnedService
  async onPin() {
    console.warn('Pin feature requires KngPinnedService');
  }

  // FIXME: nécessite KngMemoriesService
  async onMemorize() {
    console.warn('Memorize feature requires KngMemoriesService');
  }

  // ✅ Charger les produits depuis les SKUs
  private async loadProducts(message: AssistantDisplayMessage) {
    const skus = this.parseSKU(message.content);
    if (!skus.length) return;

    try {
      message.products = await this.$products.select({ skus }).toPromise();
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  private parseSKU(text: string): number[] {
    text = text || '';
    return (text.match(/10[0-9]{5}/gm) || []).filter(sku => +sku).map(s => +s);
  }
}
