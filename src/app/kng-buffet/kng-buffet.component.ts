import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
  HostListener,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  CartService,
  Config,
  LoaderService,
  User,
  Hub,
  CalendarService,
  ProductService,
  Product,
  Category,
  AssistantService
} from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n, KngNavigationStateService, ScrollStateService } from '../common';
import { KngAssistantHistoryComponent, AssistantDisplayMessage } from '../shared/kng-assistant/kng-assistant-history.component';
import { BUFFET_I18N, BuffetLabels } from './kng-buffet-i18n';
import {
  BuffetFormState,
  BuffetKit,
  BuffetTheme,
  BuffetBudget,
  BuffetDevisExample,
  BuffetProcessStep,
  BUFFET_ASSISTANT_QUESTIONS,
  BUFFET_KITS,
  BUFFET_THEMES,
  BUFFET_BUDGETS,
  BUFFET_PROCESS,
  BUFFET_DEVIS_EXAMPLES,
  AssistantQuestion,
  isDevisRequired
} from '../app.model';

/**
 * États du panel RIGHT
 */
export enum BuffetPanelState {
  FORM = 'form',
  KITS = 'kits',
  CONFIGURE = 'configure',
  DEVIS = 'devis'
}

/**
 * KngBuffetComponent
 *
 * Page principale pour les buffets événementiels.
 * Structure 3 colonnes:
 * - LEFT: Exemples de devis
 * - CENTER: Hero + Kits + Process
 * - RIGHT: Configurateur avec James
 */
@Component({
  selector: 'kng-buffet',
  templateUrl: './kng-buffet.component.html',
  styleUrls: ['./kng-buffet.component.scss']
})
export class KngBuffetComponent implements OnInit, OnDestroy {

  // === VIEW CHILDREN ===
  @ViewChild('history') history: KngAssistantHistoryComponent;

  // === ASSISTANT CONFIG ===
  agent: 'productsagent' | 'quote' | 'checkout' | 'feedback' | 'recipefull' | 'james' = 'quote';

  // === BUFFET PROMPTS ===
  buffetPrompts: string[] = [
    'Un buffet pour 20 personnes',
    'Un plateau de fromages pour 15 personnes',
    'Un buffet végétarien pour 30 personnes',
    'Quelles quantités pour un apéro de 50 personnes ?',
    'Un petit-déjeuner d\'équipe pour 10 personnes'
  ];

  // === STATE ===
  isReady: boolean = false;
  isLoading: boolean = false;
  isMobile: boolean = false;

  // === DATA ===
  config: Config;
  user: User;
  categories: Category[] = [];
  products: Product[] = [];

  // === FORM STATE ===
  formState: BuffetFormState = {
    numberOfPeople: 10,
    eventDate: null,
    isDevisMode: false,
    selectedKitId: null,
    selectedThemes: [],
    selectedBudget: 2
  };

  // === PANEL STATE ===
  panelState: BuffetPanelState = BuffetPanelState.FORM;

  // === SCROLL STICKY ===
  menuStickyTransform: number = 0;

  // === DATA ===
  kits: BuffetKit[] = BUFFET_KITS;
  themes = BUFFET_THEMES;
  budgets = BUFFET_BUDGETS;
  processSteps: BuffetProcessStep[] = BUFFET_PROCESS;
  devisExamples: BuffetDevisExample[] = BUFFET_DEVIS_EXAMPLES;

  // === ASSISTANT QUESTIONS ===
  assistantQuestions: AssistantQuestion[] = BUFFET_ASSISTANT_QUESTIONS;

  private subscription: Subscription;

  constructor(
    private $assistant: AssistantService,
    private $cart: CartService,
    private $i18n: i18n,
    private $cdr: ChangeDetectorRef,
    private $loader: LoaderService,
    private $navigation: KngNavigationStateService,
    private $product: ProductService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $calendar: CalendarService,
    private $scrollState: ScrollStateService
  ) {
    this.subscription = new Subscription();
    const { config, user, categories } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.categories = categories || [];
  }

  // === GETTERS ===

  get locale(): string {
    return this.$i18n.locale;
  }

  get label(): any {
    return this.$i18n.label();
  }

  get blabel(): BuffetLabels {
    return BUFFET_I18N[this.locale] || BUFFET_I18N.fr;
  }

  get store(): string {
    return this.$navigation.store;
  }

  get hub(): Hub {
    return this.config?.shared?.hub || {} as Hub;
  }

  get isAuthenticated(): boolean {
    return this.user?.isAuthenticated() || false;
  }

  get userRouterLink(): string[] {
    const target = this.isAuthenticated ? 'orders' : 'login';
    return ['/store', this.store, 'home', 'me', target];
  }

  get currentShippingDay(): Date {
    return this.$cart.getCurrentShippingDay() || this.$calendar.nextShippingDay(this.hub, this.user);
  }

  get isFormValid(): boolean {
    return (
      this.formState.numberOfPeople !== null &&
      this.formState.numberOfPeople >= 5 &&
      this.formState.eventDate !== null
    );
  }

  get isDevisMode(): boolean {
    if (!this.formState.eventDate) return false;
    return isDevisRequired(this.formState.eventDate, 6);
  }

  get filteredKits(): BuffetKit[] {
    if (this.formState.selectedThemes.length === 0) {
      return this.kits;
    }
    return this.kits.filter(kit =>
      kit.themes.some(t => this.formState.selectedThemes.includes(t))
    );
  }

  // === ASSISTANT GETTERS ===

  get messagesCount(): number {
    return this.history?.discussionMessages?.length || 0;
  }

  get messagesLimit(): boolean {
    return this.messagesCount > 10;
  }

  // === PANEL STATE GETTERS ===

  get isFormState(): boolean {
    return this.panelState === BuffetPanelState.FORM;
  }

  get isKitsState(): boolean {
    return this.panelState === BuffetPanelState.KITS;
  }

  get isConfigureState(): boolean {
    return this.panelState === BuffetPanelState.CONFIGURE;
  }

  get isDevisState(): boolean {
    return this.panelState === BuffetPanelState.DEVIS;
  }

  // === LIFECYCLE ===

  ngOnInit(): void {
    if (!this.$scrollState.restore('buffet', 100)) {
      window.scroll(0, 0);
    }

    this.subscription.add(
      this.$navigation.swipePanel$().subscribe(panelIndex => {
        this.onSwipePanelChanged(panelIndex);
      })
    );

    this.subscription.add(
      this.$loader.update().subscribe(emit => {
        this.isMobile = this.$navigation.isMobileOrTablet();
        if (emit.config) this.config = emit.config;
        if (emit.user) this.user = emit.user;
        if (emit.state) {
          this.loadProducts();
          this.$cdr.detectChanges();
        }
      })
    );

    this.subscription.add(
      this.$route.queryParams.subscribe(params => {
        this.handleQueryParams(params);
      })
    );

    this.subscription.add(
      this.$router.events.pipe(
        filter(event => event instanceof NavigationStart)
      ).subscribe(() => {
        this.$scrollState.save('buffet');
      })
    );

    this.isReady = true;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  // === PRIVATE METHODS ===

  private handleQueryParams(params: any): void {
    if (params['people']) {
      const people = parseInt(params['people'], 10);
      if (!isNaN(people) && people >= 5) {
        this.formState.numberOfPeople = people;
      }
    }
    if (params['date']) {
      const date = new Date(params['date']);
      if (!isNaN(date.getTime()) && date > new Date()) {
        this.formState.eventDate = date;
      }
    }
    this.formState.isDevisMode = this.isDevisMode;
  }

  private loadProducts(): void {
    if (this.isLoading || this.products.length > 0) return;
    this.isLoading = true;

    const options: any = {
      available: true,
      status: true,
      when: this.currentShippingDay.toISOString(),
      hub: this.store
    };

    this.$product.select(options).subscribe(
      (products: Product[]) => {
        this.products = products.filter(p => p.categories?.name);
        this.isLoading = false;
        this.$cdr.markForCheck();
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  // === PUBLIC METHODS - FORM ===

  onPeopleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.formState.numberOfPeople = !isNaN(value) && value >= 0 ? value : null;
  }

  adjustPeople(delta: number): void {
    const current = this.formState.numberOfPeople || 10;
    this.formState.numberOfPeople = Math.max(5, current + delta);
  }

  toggleTheme(themeId: BuffetTheme): void {
    const idx = this.formState.selectedThemes.indexOf(themeId);
    if (idx >= 0) {
      this.formState.selectedThemes.splice(idx, 1);
    } else {
      this.formState.selectedThemes.push(themeId);
    }
  }

  isThemeSelected(themeId: BuffetTheme): boolean {
    return this.formState.selectedThemes.includes(themeId);
  }

  setBudget(budget: BuffetBudget): void {
    this.formState.selectedBudget = budget;
  }

  onDateChange(date: Date): void {
    this.formState.eventDate = date;
    this.formState.isDevisMode = this.isDevisMode;
  }

  onFormSubmit(): void {
    if (!this.isFormValid) return;

    if (this.isDevisMode) {
      this.panelState = BuffetPanelState.DEVIS;
    } else {
      this.panelState = BuffetPanelState.KITS;
      this.loadProducts();
    }
    document.body.classList.add('mdc-dialog-scroll-lock');
  }

  // === PUBLIC METHODS - NAVIGATION ===

  goBack(): void {
    switch (this.panelState) {
      case BuffetPanelState.KITS:
      case BuffetPanelState.DEVIS:
        this.panelState = BuffetPanelState.FORM;
        document.body.classList.remove('mdc-dialog-scroll-lock');
        break;
      case BuffetPanelState.CONFIGURE:
        this.panelState = BuffetPanelState.KITS;
        break;
    }
  }

  onFavorites(): void {
    this.$navigation.searchAction('favoris');
  }

  navigateToHome(): void {
    this.$router.navigate(['/store', this.store, 'home']);
  }

  navigateToSubscriptions(): void {
    this.$router.navigate(['/store', this.store, 'subscriptions']);
  }

  navigateToAssistant(): void {
    this.$router.navigate(['/store', this.store, 'home', 'assistant', 'james']);
  }

  navigateToAssistantWithPrompt(prompt: string): void {
    if (!prompt?.trim()) return;
    this.$router.navigate(['/store', this.store, 'home', 'assistant', 'james'], {
      queryParams: { prompt: prompt.trim() }
    });
  }

  // === PUBLIC METHODS - ASSISTANT ===

  onTipClick(prompt: string): void {
    if (!prompt?.trim()) return;
    const params = {
      q: prompt.trim(),
      agent: this.agent,
      hub: this.store
    };
    this.$assistant.chat(params).subscribe();
  }

  onPromptChat(query: string): void {
    if (!query?.trim()) return;
    // Le kng-prompt gère déjà l'envoi au service assistant
  }

  onHistoryChat($event: { message: AssistantDisplayMessage; index: number }): void {
    console.log('Continue conversation from:', $event);
  }

  onHistoryProducts($event: Product[]): void {
    if ($event?.length) {
      this.products = $event;
      this.$cdr.markForCheck();
    }
  }

  onClearRequest(): void {
    this.products = [];
    this.$cdr.markForCheck();
  }

  // === PUBLIC METHODS - KITS ===

  selectKit(kitId: string): void {
    this.formState.selectedKitId = kitId;
    this.panelState = BuffetPanelState.CONFIGURE;
  }

  // === PUBLIC METHODS - DEVIS ===

  onDevisSubmit(formData: any): void {
    console.log('Devis submitted:', formData, this.formState);
  }

  // === SCROLL HANDLING ===

  @HostListener('window:scroll', ['$event'])
  onScrollToStick(): void {
    if (window.innerWidth >= 1200) {
      this.menuStickyTransform = 0;
      return;
    }
    const scrollY = window.scrollY || window.pageYOffset;
    this.menuStickyTransform = scrollY > 0 ? scrollY : 0;
  }

  private onSwipePanelChanged(panelIndex: number): void {
    if (panelIndex !== 1) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }
}
