import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, CartItemsContext, Config, User, LoaderService, AssistantService, AssistantState } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../common';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { KngAssistantHistoryComponent, AssistantDisplayMessage } from '../shared/kng-assistant/kng-assistant-history.component';
import { KngPromptComponent } from '../shared/kng-assistant/kng-prompt.component';

/**
 * KngAssistantBotComponent
 *
 * Composant page pour l'assistant James.
 * Utilise le pattern kng-sgc avec composants séparés:
 * - <kng-assistant-history> pour l'affichage des messages
 * - <kng-prompt> pour la saisie utilisateur
 */
@Component({
  selector: 'kng-assistant-bot',
  templateUrl: './kng-assistant-bot.component.html',
  styleUrls: ['./kng-assistant-bot.component.scss']
})
export class KngAssistantBotComponent implements OnInit, OnDestroy {

  @ViewChild('dialog', { static: true }) dialog: ElementRef;
  @ViewChild('history') history: KngAssistantHistoryComponent;
  @ViewChild('promptComponent') promptComponent: KngPromptComponent;

  user: User;
  config: Config;
  isReady = false;
  prompt: string;
  scrollToBottom: boolean;
  scrollBottomPosition: number;
  scrollStickedToolbar: boolean;
  autoRecord: boolean = false;

  // Agent configuration
  agent: "productsagent" | "quote" | "checkout" | "feedback" | "recipefull" | "james" = "james";

  // State from AssistantService
  currentState: AssistantState;

  private destroy$ = new Subject<void>();
  private chatSubscription: Subscription | null = null;

  tips = [
    { clazz: "", label: "Qui es-tu?", action: "Bonjour James, peux-tu me dire qui tu es et quels services tu proposes ?" },
    { clazz: "", label: "Mon Menu", action: "Tu génères un menu de la semaine avec les produits de mon panier, le format est soigné comme à l'hôtel." },
    { clazz: "", label: "Ma Box", action: "Propose-moi une box de fruits pour la semaine" },
    { clazz: "hide", label: "100 enfants", action: "La sélection de la semaine pour 100 enfants" },
    { clazz: "", label: "Ma recette", action: "Tu dois générer une recette en t'inspirant de mes commandes précédentes." },
  ];

  prompts = [
    "j'aimerais préparer un événement pour mon entreprise",
    "Les 5 meilleures recettes de cuisine française",
    "Les 5 meilleures recettes de cuisine italienne",
    "Les 5 meilleures recettes de cuisine de la mer",
    "La recette du Hamburgers texans",
    "La recette de Viande hachée façon Cambodgienne",
    "La recette Gyudon Japonais",
    "La recette Blanquette de veau traditionnelle",
    "La recette Lasagnes à la bolognaise",
    "La recette de La Vraie Moussaka Grecque",
    "La recette du Filet mignon en croûte",
    "La recette de Béchamel rapide et facile",
    "La recette du Gratin dauphinois",
    "La recette du Sauté de veau au chorizo",
    "La recette du Boeuf Bourguignon rapide",
    "La recette du Couscous poulet et merguez",
    "La recette du Chili con carne",
    "La recette du Lapin à la moutarde maison",
    "La recette de la Ratatouille",
    "La Mayonnaise maison",
    "La Sauce béarnaise",
    "La Sauce au poivre",
    "La Sauce aigre-douce"
  ];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $assistant: AssistantService,
    private $metrics: MetricsService,
    private $navigation: KngNavigationStateService,
    private $loader: LoaderService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef
  ) {
    // Parse query params for initial prompt
    const recipe = this.$route.snapshot.queryParamMap.get('recipe');
    if (recipe) {
      this.prompt = "Les 5 meilleures recettes avec " + recipe;
    }
    const variant = this.$route.snapshot.queryParamMap.get('variant');
    if (variant) {
      this.prompt = "Les 5 meilleures associations avec " + variant;
    }
    const menu = this.$route.snapshot.queryParamMap.get('menu');
    if (menu) {
      this.prompt = "Mes repas de la semaine inspirés de mon panier";
    }
    const prompt = this.$route.snapshot.queryParamMap.get('prompt');
    if (prompt) {
      this.prompt = prompt;
    }

    // Get cached data
    const { config, user } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.scrollBottomPosition = 0;
  }

  get label() {
    return this.$i18n.label();
  }

  get container() {
    return this.dialog;
  }

  get displayName() {
    return this.user.displayName;
  }

  get store() {
    return this.hub && this.config.shared.hub.slug;
  }

  get hub() {
    return this.config && this.config.shared.hub;
  }

  get clientWidth() {
    if (!this.dialog || !this.dialog.nativeElement) {
      return 0;
    }
    const container = this.dialog.nativeElement.children[1];
    const width = container.clientWidth;
    const remValue = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const widthMinus2rem = width - (2 * remValue);
    return Math.max(0, widthMinus2rem);
  }

  get cartAmount() {
    const ctx: CartItemsContext = {
      forSubscription: false,
      hub: this.store
    };
    return this.$cart.subTotal(ctx).toFixed(2);
  }

  get isAssistantRuning() {
    return this.currentState?.status === 'running';
  }

  get audioIsRecording() {
    return this.promptComponent?.audioIsRecording || false;
  }

  get messagesCount() {
    return this.history?.discussionMessages?.length || 0;
  }

  get messagesLimit() {
    return this.messagesCount > 20;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  async ngOnInit() {
    // Subscribe to assistant state
    this.$assistant.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.currentState = state;

      if (state.status === 'end') {
        // Clear query params after completion
        this.$router.navigate([], {
          relativeTo: this.$route,
          queryParams: { prompt: null, menu: null, recipe: null, variant: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }

      this.onScrollToBottom();
      this.$cdr.markForCheck();
    });

    // Publish metrics
    const metric = {
      path: window.location.pathname,
      hub: this.store,
      action: 'james',
      title: document.title
    };
    this.$metrics.event(EnumMetrics.metric_view_page, metric);

    // Register scroll event
    this.$navigation.registerScrollEvent(this.container, 10).pipe(
      takeUntil(this.destroy$)
    ).subscribe(scroll => {
      this.scrollToBottom = scroll.direction <= 0 && (scroll.position + 100) > this.scrollBottomPosition;
      this.$cdr.markForCheck();
    });

    // Handle initial prompt
    if (this.prompt) {
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
      this.container.nativeElement.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

      // ✅ Send initial prompt directly via service
      setTimeout(() => {
        const params = {
          q: this.prompt,
          agent: this.agent,
          hub: this.store
        };
        this.$assistant.chat(params).subscribe();
        this.prompt = null; // Clear after sending
      }, 500);
    }

    this.isReady = true;
  }

  ngAfterViewInit() {
    this.onScrollToBottom();
  }

  ngAfterViewChecked() {
    document.body.classList.add('mdc-dialog-scroll-lock');
  }

  clean() {
    this.isReady = false;
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  onScrollToBottom() {
    setTimeout(() => {
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
      this.scrollBottomPosition = this.container.nativeElement.scrollTop;
      this.scrollStickedToolbar = (this.container.nativeElement.scrollTop > 40);
    }, 500);
  }

  /**
   * Handle chat request from prompt component
   * ✅ Optionnel maintenant - le prompt appelle $assistant.chat() directement
   * Gardé pour compatibilité et scroll
   */
  onChatRequest($event: { prompt?: string, audio?: string }) {
    // Le prompt appelle déjà $assistant.chat() directement
    // On gère juste le scroll ici
    this.onScrollToBottom();
    this.$cdr.markForCheck();
  }

  /**
   * Handle clear request from prompt component
   * ✅ Optionnel maintenant - le prompt appelle $assistant.history(clear) directement
   */
  async onClearRequest() {
    // Le prompt appelle déjà $assistant.history({ clear: true }) directement
    // On peut optionnellement recharger l'affichage
    if (this.history) {
      this.$cdr.markForCheck();
    }
  }

  /**
   * Handle chat action from history component
   */
  onHistoryChat($event: { message: AssistantDisplayMessage, index: number }) {
    console.log('Continue conversation from:', $event);
  }

  onClose(closedialog: boolean) {
    this.clean();
    const query = this.$route.snapshot.queryParams;
    const landing = query['source'] || query['fbclid'];
    if (landing || !this.$navigation.hasHistory) {
      return this.$router.navigate(['../../'], { relativeTo: this.$route });
    }
    this.$navigation.back();
  }
}
