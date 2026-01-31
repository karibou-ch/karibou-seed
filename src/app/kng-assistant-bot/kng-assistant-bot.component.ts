import { ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, CartItemsContext, Config, User, LoaderService, AssistantService, AssistantState, Product, Category, ProductService } from 'kng2-core';
import { KngNavigationStateService, i18n } from '../common';
import { Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { EnumMetrics, MetricsService } from '../common/metrics.service';
import { KngAssistantHistoryComponent, AssistantDisplayMessage } from '../shared/kng-assistant/kng-assistant-history.component';
import { KngPromptComponent } from '../shared/kng-assistant/kng-prompt.component';

/**
 * KngAssistantBotComponent
 *
 * Vue à part entière pour l'assistant James (layout 3 colonnes).
 *
 * Architecture:
 * - SIDE (gauche): Menu de navigation rapide
 * - CENTER: Historique de conversation + Produits suggérés
 * - RIGHT: Prompt de saisie + Tips
 *
 * Composants utilisés:
 * - <kng-assistant-history> pour l'affichage des messages
 * - <kng-prompt> pour la saisie utilisateur
 * - <kng-product-thumbnail> pour les produits suggérés
 */
@Component({
  selector: 'kng-assistant-bot',
  templateUrl: './kng-assistant-bot.component.html',
  styleUrls: ['./kng-assistant-bot.component.scss']
})
export class KngAssistantBotComponent implements OnInit, OnDestroy {

  @ViewChild('history') history: KngAssistantHistoryComponent;
  @ViewChild('promptComponent') promptComponent: KngPromptComponent;

  user: User;
  config: Config;
  isReady = false;
  prompt: string;
  autoRecord: boolean = false;

  // Agent configuration
  agent: "productsagent" | "quote" | "checkout" | "feedback" | "recipefull" | "james" = "james";

  // State from AssistantService
  currentState: AssistantState;

  // ✅ Produits suggérés par l'assistant (via onProducts event)
  assistantProducts: Product[] = [];

  // ✅ Titre de la sélection (envoyé par pushProducts)
  productsTitle: string = '';

  // 🔧 Guard + debounce contre les fetches dupliqués de pushProducts
  private lastProcessedStepKey: string = '';
  private pushProductsDebounce: any;

  // ✅ Catégories disponibles basées sur les produits (comme kng-home)
  availableCategories: { [key: string]: boolean } = {};
  categories: Category[] = [];
  displaySlug: string = '';
  categorySlug: string = '';

  // === SCROLL STICKY (simulated for swipe mode) ===
  menuStickyTransform: number = 0;

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
    "Je cherche des produits pour un apéro terroir",
    "Quels fromages suisses avez-vous ?",
    "Des fruits et légumes de saison",
    "Je veux les produits pour un barbecue ce weekend",
    "Produits pour un brunch du dimanche",
    "Des produits sans gluten",
    "Je cherche du pain artisanal frais",
    "Viandes pour une fondue bourguignonne",
    "Produits bio et locaux",
    "Des pâtes fraîches artisanales",
    "Je cherche des produits végétariens",
    "Chocolats et confiseries suisses",
    "Produits pour un plateau de charcuterie",
    "Des vins rouges de la région",
    "Je veux faire des pizzas maison",
    "Ingrédients pour une raclette",
    "Produits laitiers fermiers",
    "Des conserves et bocaux artisanaux",
    "Je cherche des épices et condiments",
    "Huiles d'olive de qualité",
    "Miels et confitures artisanaux",
    "Poissons et fruits de mer frais",
    "Des légumes pour une soupe maison"
  ];

  constructor(
    private $i18n: i18n,
    private $cart: CartService,
    private $assistant: AssistantService,
    private $products: ProductService,
    private $metrics: MetricsService,
    private $navigation: KngNavigationStateService,
    private $loader: LoaderService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $cdr: ChangeDetectorRef
  ) {
    // bind infinite scroll callback function
    // ✅ SYNCHRONE: Récupération immédiate des données cached

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

    // Get agent from route param
    const name = this.$route.snapshot.paramMap.get('name');
    if (name && ['productsagent', 'quote', 'checkout', 'feedback', 'recipefull', 'james'].includes(name)) {
      this.agent = name as any;
    }

    // Get cached data
    const { config, user, categories } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.categories = categories || [];

  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get label() {
    return this.$i18n.label();
  }

  get locale(): string {
    return this.$i18n.locale;
  }

  get displayName() {
    return this.user?.displayName || '';
  }

  get store() {
    return this.hub && this.config.shared.hub.slug;
  }

  get hub() {
    return this.config && this.config.shared.hub;
  }

  get isAuthenticated(): boolean {
    return this.user?.isAuthenticated() || false;
  }

  get isB2BSchool(): boolean {
    return this.user?.plan?.name === 'b2b-school';
  }

  get userRouterLink(): string[] {
    const target = this.isAuthenticated ? 'orders' : 'login';
    return ['/store', this.store, 'me', target];
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

  /**
   * Tips visibles (sans classe 'hide')
   */
  get visibleTips() {
    return this.tips.filter(tip => !tip.clazz?.includes('hide'));
  }

  /**
   * Exemples de prompts affichés (limité à 5)
   */
  get displayedPrompts() {
    return this.prompts.slice(0, 10);
  }

  /**
   * Catégories triées pour le grouped-list (basé sur les produits assistant)
   * ✅ Logique identique à kng-home.component.ts
   * ✅ Utilise this.categories (chargé séparément) au lieu de config.shared.categories
   */
  get productCategories(): Category[] {
    if (!this.assistantProducts?.length || !this.categories?.length) {
      return [];
    }

    // Filtrer les catégories actives qui ont des produits disponibles (comme kng-home)
    return this.categories
      .filter((c: Category) =>
        c.active &&
        c.type === 'Category' &&
        this.availableCategories[c.name]
      )
      .sort((a: Category, b: Category) => (a.weight || 0) - (b.weight || 0));
  }


  get sortedCategories() {

    // Filter categories for group HOME
    return this.categories = this.categories.sort(this.sortByWeight).filter(c => {
      return (c.active) &&
             (c.type === 'Category') &&
             this.availableCategories[c.name];
    });
  }


  sortByWeight(a: Category, b: Category) {
    return a.weight - b.weight;
  }

  scrollToSlug(slug: string) {
    this.categorySlug = slug;
    this.displaySlug = slug;
  }



  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    // S'assurer de déverrouiller le scroll du body
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  async ngOnInit() {
    // S'abonner aux changements de panel après swipe
    this.$navigation.swipePanel$().pipe(
      takeUntil(this.destroy$)
    ).subscribe(panelIndex => {
      this.onSwipePanelChanged(panelIndex);
    });

    // Subscribe to assistant state
    this.$assistant.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((state: any) => {
      this.currentState = state;

      //
      // ✅ Handle pushProducts data from agent
      // 🔧 FIX: Guard + debounce 500ms pour éviter les fetches multiples
      const lastStep = state.steps?.length && state.steps[state.steps.length - 1];
      const stepKey = lastStep?.data?.skus?.join(',');

      if (lastStep && lastStep.data?.type === 'products' &&
          lastStep.data.skus?.length &&
          stepKey !== this.lastProcessedStepKey) {

        // Premier appel = replace, appels suivants = append
        const shouldAppend = !!this.lastProcessedStepKey;
        this.lastProcessedStepKey = stepKey;
        this.productsTitle = lastStep.data.title || this.productsTitle;

        clearTimeout(this.pushProductsDebounce);
        this.pushProductsDebounce = setTimeout(() => {
          this.$products.select({ skus: lastStep.data.skus }).subscribe({
            next: (products) => {
              this.onProducts(products, shouldAppend);
              this.$cdr.markForCheck();
            },
            error: (err) => console.error('Error loading pushed products:', err)
          });
        }, 500);
      }

      if (state.status === 'end') {
        // Clear query params after completion
        this.$router.navigate([], {
          relativeTo: this.$route,
          queryParams: { prompt: null, menu: null, recipe: null, variant: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }

      this.$cdr.markForCheck();
    });

    //
    // ✅ Subscribe to discussion$ for initial products fallback
    // Si la discussion contient des steps type 'products' mais assistantProducts vide
    // → Charger les favoris du client (popular=true)
    this.$assistant.discussion$.pipe(
      takeUntil(this.destroy$),
      filter((discussion: any) => !this.agent || discussion.agent === this.agent)
    ).subscribe((discussion: any) => {
      if (!discussion.id) return;

      const hasProductSteps = discussion.steps?.some((s: any) => s.data?.type === 'products');
      if (!this.assistantProducts.length && !this.lastProcessedStepKey) {
        this.productsTitle = 'Vos favoris ✨';

        //
        // Charger les produits populaires (favoris) via select
        const when = this.$cart.getCurrentShippingDay();
        const params = {
          status: true,
          available: true,
          popular: true,
          hub: this.store,
          when: when?.toISOString()
        };

        this.$products.select(params).subscribe({
          next: (products) => {
            this.onProducts(products);
            this.$cdr.markForCheck();
          },
          error: (err) => console.error('Error loading favoris:', err)
        });
      }
    });

    // Publish metrics
    const metric = {
      path: window.location.pathname,
      hub: this.store,
      action: 'james',
      title: document.title
    };
    this.$metrics.event(EnumMetrics.metric_view_page, metric);

    // Handle initial prompt from query params
    if (this.prompt) {
      setTimeout(() => {
        const params = {
          q: this.prompt,
          agent: this.agent,
          hub: this.store
        };
        this.$assistant.chat(params).subscribe();
        this.prompt = null;
      }, 500);
    }

    this.isReady = true;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  /**
   * Sticky menu simulé via translateY pour contourner le problème CSS :
   * position: sticky ne fonctionne pas quand un ancêtre a overflow-x: auto (swipe)
   */
  @HostListener('window:scroll', ['$event'])
  onScrollToStick($event) {
    // Active seulement en mode swipe (mobile/tablet ≤1199px)
    if (window.innerWidth >= 1200) {
      this.menuStickyTransform = 0;
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset;
    const navbarHeight = 0; // --mdc-theme-top-bar

    if (scrollY > navbarHeight) {
      this.menuStickyTransform = scrollY - navbarHeight;
    } else {
      this.menuStickyTransform = 0;
    }
  }

  /**
   * Réagit aux changements de panel après un swipe.
   * Verrouille le scroll body si on n'est pas sur center pour permettre le sticky.
   * Panel index: 0=side, 1=center, 2=custom, 3=right
   */
  private onSwipePanelChanged(panelIndex: number) {
    // Verrouille le scroll si on n'est PAS sur le panel center (index 1)
    if (panelIndex !== 1) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }

  /**
   * Handle tip/prompt click - envoie le message à l'assistant ET recherche les produits
   */
  onTipClick(action: string) {
    if (!action || action === '-') return;

    // Envoyer à l'assistant
    const params = {
      q: action,
      agent: this.agent,
      hub: this.store
    };
    this.$assistant.chat(params).subscribe();

    // Recherche de produits basée sur la question
    this.searchProducts(action);
  }

  /**
   * Handle chat event from prompt - recherche de produits basée sur la question
   */
  onPromptChat(query: string) {
    if (!query?.trim()) return;
    this.searchProducts(query);
  }

  /**
   * Recherche de produits via ProductService
   * ✅ Logique identique à kng-home pour construire availableCategories
   */
  private searchProducts(query: string) {
    //only the first time,
    if(this.assistantProducts.length) {
      return;
    }
    this.productsTitle = `Produits bruts pour <br/><span class="light">"${query}" ✨</span> `;
    this.$products.search(query).subscribe({
      next: (products) => {
        this.onProducts(products);
        this.$cdr.markForCheck();
      },
      error: (err) => {
        console.error('Product search error:', err);
        this.assistantProducts = [];
        this.availableCategories = {};
        this.$cdr.markForCheck();
      }
    });
  }

  /**
   * Handle clear request from prompt component
   * Reset products state when history is cleared
   */
  async onClearRequest() {
    this.productsTitle = '';
    this.assistantProducts = [];
    this.availableCategories = {};
    this.lastProcessedStepKey = '';
    this.displaySlug = '';
    this.categorySlug = '';
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

  /**
   * ✅ Handle products emitted by history component
   * ✅ Logique identique à kng-home pour construire availableCategories
   */
  onHistoryProducts(products: Product[]) {


    console.log('🔍 onHistoryProducts:', this.assistantProducts.length, 'products,',
      Object.keys(this.availableCategories).length, 'categories');
    this.$cdr.markForCheck();
  }

  onProducts(products: Product[], append: boolean = false) {
    // Filtrer les produits avec une catégorie valide (comme kng-home)
    const validProducts = (products || []).filter(
      (product: Product) => product.categories && product.categories.name
    );

    if (append) {
      //
      // ✅ Mode append: ajouter sans doublons (basé sur SKU)
      const existingSkus = new Set(this.assistantProducts.map(p => p.sku));
      const newProducts = validProducts.filter(p => !existingSkus.has(p.sku));
      this.assistantProducts = [...this.assistantProducts, ...newProducts];
    } else {
      //
      // Mode replace: reset complet
      this.availableCategories = {};
      this.assistantProducts = validProducts;
    }

    // Reconstruire availableCategories
    this.assistantProducts.forEach((product: Product) => {
      this.availableCategories[product.categories.name] = true;
    });
    this.$cdr.markForCheck();
  }
}
