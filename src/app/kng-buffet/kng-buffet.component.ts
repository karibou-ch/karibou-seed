import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
  HostListener
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
  Category
} from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n, KngNavigationStateService, ScrollStateService } from '../common';
import { BUFFET_I18N, BuffetLabels } from './kng-buffet-i18n';
import {
  BuffetFormState,
  BUFFET_ASSISTANT_QUESTIONS,
  AssistantQuestion,
  isDevisRequired,
  getPeopleRange
} from '../app.model';

/**
 * États du panel RIGHT
 */
export enum BuffetPanelState {
  FORM = 'form',           // Formulaire discriminants (nombre de personnes, date)
  KITS = 'kits',           // Liste des kits disponibles
  CONFIGURE = 'configure', // Configuration du kit sélectionné
  DEVIS = 'devis'          // Formulaire de demande de devis
}

/**
 * KngBuffetComponent
 *
 * Page principale pour les buffets événementiels.
 * Remplace l'ancienne page /home/business (deprecated).
 *
 * Structure 3 colonnes (comme kng-subscription):
 * - LEFT: Navigation et aide James encadré
 * - CENTER: Produits et configurateur
 * - RIGHT: Formulaire et actions
 */
@Component({
  selector: 'kng-buffet',
  templateUrl: './kng-buffet.component.html',
  styleUrls: ['./kng-buffet.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngBuffetComponent implements OnInit, OnDestroy {

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
    numberOfPeople: null,
    eventDate: null,
    isDevisMode: false,
    selectedKitId: null
  };

  // === PANEL STATE ===
  panelState: BuffetPanelState = BuffetPanelState.FORM;

  // === SCROLL STICKY ===
  menuStickyTransform: number = 0;

  // === ASSISTANT QUESTIONS (encadré buffet) ===
  assistantQuestions: AssistantQuestion[] = BUFFET_ASSISTANT_QUESTIONS;

  private subscription: Subscription;

  constructor(
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

    //
    // SYNCHRONE: Récupération immédiate des données cached
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

  /**
   * Labels i18n centralisés pour buffet
   */
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

  /**
   * Vérifie si le formulaire est valide
   */
  get isFormValid(): boolean {
    return (
      this.formState.numberOfPeople !== null &&
      this.formState.numberOfPeople >= 10 &&
      this.formState.eventDate !== null
    );
  }

  /**
   * Mode devis requis (date > J+6)
   */
  get isDevisMode(): boolean {
    if (!this.formState.eventDate) return false;
    return isDevisRequired(this.formState.eventDate, 6);
  }

  /**
   * Gamme de personnes formatée
   */
  get peopleRange(): string {
    if (!this.formState.numberOfPeople) return '';
    return getPeopleRange(this.formState.numberOfPeople);
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
    //
    // Restaurer le scroll si on revient d'une page produit
    if (!this.$scrollState.restore('buffet', 100)) {
      window.scroll(0, 0);
    }

    //
    // S'abonner aux changements de panel après swipe
    this.subscription.add(
      this.$navigation.swipePanel$().subscribe(panelIndex => {
        this.onSwipePanelChanged(panelIndex);
      })
    );

    //
    // Loader updates
    this.subscription.add(
      this.$loader.update().subscribe(emit => {
        this.isMobile = this.$navigation.isMobileOrTablet();

        if (emit.config) {
          this.config = emit.config;
        }

        if (emit.user) {
          this.user = emit.user;
        }

        if (emit.state) {
          this.loadProducts();
          this.$cdr.detectChanges();
        }
      })
    );

    //
    // Query params (pour pré-remplir le formulaire)
    this.subscription.add(
      this.$route.queryParams.subscribe(params => {
        this.handleQueryParams(params);
      })
    );

    //
    // Sauvegarder le scroll AVANT la navigation
    this.subscription.add(
      this.$router.events.pipe(
        filter(event => event instanceof NavigationStart)
      ).subscribe(() => {
        this.$scrollState.save('buffet');
      })
    );

    //
    // Mark as ready
    this.isReady = true;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  // === PRIVATE METHODS ===

  private handleQueryParams(params: any): void {
    //
    // Pré-remplir le nombre de personnes
    if (params['people']) {
      const people = parseInt(params['people'], 10);
      if (!isNaN(people) && people >= 10) {
        this.formState.numberOfPeople = people;
      }
    }

    //
    // Pré-remplir la date
    if (params['date']) {
      const date = new Date(params['date']);
      if (!isNaN(date.getTime()) && date > new Date()) {
        this.formState.eventDate = date;
      }
    }

    //
    // Vérifier le mode
    this.formState.isDevisMode = this.isDevisMode;
  }

  private loadProducts(): void {
    if (this.isLoading || this.products.length > 0) return;

    this.isLoading = true;

    const options: any = {
      available: true,
      status: true,
      when: this.currentShippingDay.toISOString(),
      hub: this.store,
      //
      // Filtre produits buffet (TODO: ajouter attribut buffet aux produits)
      // Pour l'instant, on charge tous les produits
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

  /**
   * Mise à jour du nombre de personnes
   */
  onPeopleChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value) && value >= 0) {
      this.formState.numberOfPeople = value;
    } else {
      this.formState.numberOfPeople = null;
    }
  }

  /**
   * Mise à jour de la date
   */
  onDateChange(date: Date): void {
    this.formState.eventDate = date;
    this.formState.isDevisMode = this.isDevisMode;
  }

  /**
   * Validation du formulaire et passage à l'étape suivante
   */
  onFormSubmit(): void {
    if (!this.isFormValid) return;

    if (this.isDevisMode) {
      //
      // Mode devis : passer directement au formulaire de devis
      this.panelState = BuffetPanelState.DEVIS;
    } else {
      //
      // Mode commande : afficher les kits
      this.panelState = BuffetPanelState.KITS;
      this.loadProducts();
    }

    document.body.classList.add('mdc-dialog-scroll-lock');
  }

  // === PUBLIC METHODS - NAVIGATION ===

  /**
   * Retour à l'étape précédente
   */
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

  /**
   * Navigation vers les favoris
   */
  onFavorites(): void {
    this.$navigation.searchAction('favoris');
  }

  /**
   * Navigation vers la page d'exploration (home)
   */
  navigateToHome(): void {
    this.$router.navigate(['/store', this.store, 'home']);
  }

  /**
   * Navigation vers les subscriptions
   */
  navigateToSubscriptions(): void {
    this.$router.navigate(['/store', this.store, 'subscriptions']);
  }

  /**
   * Navigation vers l'assistant James
   */
  navigateToAssistant(): void {
    this.$router.navigate(['/store', this.store, 'home', 'assistant', 'james']);
  }

  // === PUBLIC METHODS - KITS ===

  /**
   * Sélection d'un kit
   */
  selectKit(kitId: string): void {
    this.formState.selectedKitId = kitId;
    this.panelState = BuffetPanelState.CONFIGURE;
  }

  // === PUBLIC METHODS - DEVIS ===

  /**
   * Envoi du formulaire de devis
   */
  onDevisSubmit(formData: any): void {
    //
    // TODO: Implémenter l'envoi du devis
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
    const navbarHeight = 0;

    if (scrollY > navbarHeight) {
      this.menuStickyTransform = scrollY - navbarHeight;
    } else {
      this.menuStickyTransform = 0;
    }
  }

  private onSwipePanelChanged(panelIndex: number): void {
    if (panelIndex !== 1) {
      document.body.classList.add('mdc-dialog-scroll-lock');
    } else {
      document.body.classList.remove('mdc-dialog-scroll-lock');
    }
  }
}
