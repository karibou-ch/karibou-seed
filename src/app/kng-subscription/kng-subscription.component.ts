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
  CartSubscription,
  Config,
  LoaderService,
  User,
  Hub,
  CalendarService,
  Order,
  ProductService,
  Product,
  Category
} from 'kng2-core';
import { Subscription } from 'rxjs';
import { i18n, KngNavigationStateService, ScrollStateService } from '../common';
import { SUBSCRIPTION_I18N, SubscriptionLabels } from './kng-subscription-i18n';

/**
 * États du panel RIGHT
 */
export enum SubscriptionPanelState {
  LIST = 'list',       // Liste des abonnements
  DETAIL = 'detail',   // Détail d'un abonnement existant
  CREATE = 'create'    // Création d'un nouvel abonnement
}

@Component({
  selector: 'kng-subscription',
  templateUrl: './kng-subscription.component.html',
  styleUrls: ['./kng-subscription.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KngSubscriptionComponent implements OnInit, OnDestroy {

  // === STATE ===
  isReady: boolean = false;
  isLoading: boolean = false;
  isMobile: boolean = false;

  // === DATA ===
  config: Config;
  user: User;
  categories: Category[] = [];
  products: Product[] = [];
  contracts: CartSubscription[] = [];
  currentContract: CartSubscription | null = null;

  // === PANEL STATE ===
  panelState: SubscriptionPanelState = SubscriptionPanelState.LIST;

  // === SCROLL STICKY (simulated for swipe mode) ===
  menuStickyTransform: number = 0;

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

    // ✅ SYNCHRONE: Récupération immédiate des données cached
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
   * Labels i18n centralisés pour subscriptions
   */
  get slabel(): SubscriptionLabels {
    return SUBSCRIPTION_I18N[this.locale] || SUBSCRIPTION_I18N.fr;
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

  get isB2BSchool(): boolean {
    return this.user?.plan?.name === 'b2b-school';
  }

  get userRouterLink(): string[] {
    const target = this.isAuthenticated ? 'orders' : 'login';
    return ['/store', this.store, 'home', 'me', target];
  }

  get currentShippingDay(): Date {
    return this.$cart.getCurrentShippingDay() || this.$calendar.nextShippingDay(this.hub, this.user);
  }

  /**
   * Contrats ouverts (actifs ou nécessitant action)
   */
  get openContracts(): CartSubscription[] {
    return this.contracts.filter(contract => {
      if (contract.status === 'active') return true;
      if (contract.status === 'incomplete' && contract.latestPaymentIntent) {
        return ['requires_action', 'requires_payment_method'].includes(
          contract.latestPaymentIntent.status
        );
      }
      return false;
    });
  }

  get hasContracts(): boolean {
    return this.openContracts.length > 0;
  }

  get isListState(): boolean {
    return this.panelState === SubscriptionPanelState.LIST;
  }

  get isDetailState(): boolean {
    return this.panelState === SubscriptionPanelState.DETAIL;
  }

  get isCreateState(): boolean {
    return this.panelState === SubscriptionPanelState.CREATE;
  }

  // === LIFECYCLE ===

  ngOnInit(): void {
    // Restaurer le scroll si on revient d'une page produit, sinon scroll en haut
    if (!this.$scrollState.restore('subscriptions', 100)) {
      window.scroll(0, 0);
    }

    // S'abonner aux changements de panel après swipe
    this.subscription.add(
      this.$navigation.swipePanel$().subscribe(panelIndex => {
        this.onSwipePanelChanged(panelIndex);
      })
    );

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

    // Subscriptions
    this.subscription.add(
      this.$cart.subscription$.subscribe(contracts => {
        this.contracts = contracts;
        this.checkQueryParams();
      })
    );

    // Initial load
    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
      this.checkQueryParams();
    });

    // Query params for opening contract detail
    this.subscription.add(
      this.$route.queryParams.subscribe(params => {
        this.checkQueryParams();
      })
    );

    // ✅ Sauvegarder le scroll AVANT la navigation (pas dans ngOnDestroy qui est trop tard)
    this.subscription.add(
      this.$router.events.pipe(
        filter(event => event instanceof NavigationStart)
      ).subscribe(() => {
        this.$scrollState.save('subscriptions');
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.body.classList.remove('mdc-dialog-scroll-lock');
  }

  // === PRIVATE METHODS ===

  private checkQueryParams(): void {
    const params = this.$route.snapshot.queryParams;
    const contractId = params['contract'];

    if (contractId) {
      const contract = this.contracts.find(c => c.id === contractId);
      if (contract) {
        this.openContractDetail(contract);
      }
    }
  }

  private loadProducts(): void {
    if (this.isLoading || this.products.length > 0) return;

    this.isLoading = true;

    const options: any = {
      available: true,
      status: true,
      when: this.currentShippingDay.toISOString(),
      hub: this.store,
      subscription: true // Filtre produits disponibles en subscription
    };

    this.$product.select(options).subscribe(
      (products: Product[]) => {
        this.products = products.filter(p => p.categories?.name);
        this.isReady = true;
        this.isLoading = false;
        this.$cdr.markForCheck();
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  // === PUBLIC METHODS ===

  /**
   * Ouvre le détail d'un contrat existant
   */
  openContractDetail(contract: CartSubscription): void {
    this.currentContract = contract;
    this.panelState = SubscriptionPanelState.DETAIL;
    document.body.classList.add('mdc-dialog-scroll-lock');

    // Update URL
    this.$router.navigate([], {
      relativeTo: this.$route,
      queryParams: { contract: contract.id },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Ouvre le panel de création
   */
  openCreatePanel(): void {
    this.currentContract = null;
    this.panelState = SubscriptionPanelState.CREATE;
    document.body.classList.add('mdc-dialog-scroll-lock');
  }

  /**
   * Retour à la liste
   */
  closePanel(): void {
    this.currentContract = null;
    this.panelState = SubscriptionPanelState.LIST;
    document.body.classList.remove('mdc-dialog-scroll-lock');

    // Clear URL params
    this.$router.navigate([], {
      relativeTo: this.$route,
      queryParams: { contract: null, action: null, reason: null, intent: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /**
   * Callback après mise à jour réussie d'un contrat
   */
  onContractUpdated(updatedContract: CartSubscription): void {
    this.$cart.subscriptionsGet().subscribe(contracts => {
      this.contracts = contracts;
      this.currentContract = contracts.find(c => c.id === updatedContract.id) || null;
    });
  }

  /**
   * Callback pour ajouter des produits à un contrat
   */
  onAddItemToContract(): void {
    if (!this.currentContract) return;

    const hub = this.currentContract.items?.[0]?.hub || this.hub.slug;
    const plan = this.currentContract.plan ? `&plan=${this.currentContract.plan}` : '';
    const url = `/store/${hub}/subscription?view=products&id=${this.currentContract.id}${plan}`;
    this.$router.navigateByUrl(url);
  }

  /**
   * Navigation vers la page d'exploration produits
   */
  navigateToProducts(): void {
    this.$router.navigate(['/store', this.store, 'subscription'], {
      queryParams: { view: 'products' }
    });
  }

  /**
   * Navigation vers les favoris
   */
  onFavorites(): void {
    this.$navigation.searchAction('favoris');
  }

  /**
   * Obtenir le jour de la semaine formaté
   */
  getDayOfWeek(idx: number): string {
    return this.label.weekdays?.split('_')[idx] || '';
  }

  /**
   * Obtenir la fréquence formatée
   */
  getFrequency(contract: CartSubscription): string {
    return this.label[contract.frequency] || contract.frequency;
  }

  /**
   * Description courte du contrat
   */
  getContractDescription(contract: CartSubscription): string {
    return `${this.getDayOfWeek(contract.dayOfWeek)} ${this.getFrequency(contract)}`;
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
