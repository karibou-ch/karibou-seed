import { Component, OnInit, OnDestroy } from '@angular/core';
import { i18n, KngNavigationStateService } from '../common';
import { Router } from '@angular/router';
import { CartService, Order, User, CalendarService, Hub } from 'kng2-core';
import { LoaderService } from 'kng2-core';
import { Subscription } from 'rxjs';
import {
  DEFAULT_INTENTIONS,
  IntentionsConfig,
  getIntentionContent,
  DEFAULT_ASSISTANT_QUESTIONS,
  AssistantQuestion
} from '../app.model';

/**
 * KngRootComponent - Hub d'aiguillage par intentions
 *
 * Ce composant est la page d'entrée après sélection du marché.
 * Il présente les 4 intentions fondamentales :
 * - Faire mes courses → /home
 * - Recevoir un buffet → /buffet
 * - Ne plus oublier → /subscriptions
 * - Besoin d'aide → /assistant
 *
 * Pour les utilisateurs authentifiés, il affiche également
 * des raccourcis vers leurs commandes et paramètres.
 */
@Component({
  selector: 'app-kng-root',
  templateUrl: './kng-root.component.html',
  styleUrls: ['./kng-root.component.scss']
})
export class KngRootComponent implements OnInit, OnDestroy {

  config: any;
  currentShippingDay: Date;
  subscription: Subscription;
  orders: Order[];
  user: User;

  //
  // Intentions configuration (from app.model.ts)
  intentions: IntentionsConfig = DEFAULT_INTENTIONS;
  assistantQuestions: AssistantQuestion[] = DEFAULT_ASSISTANT_QUESTIONS;

  static SCROLL_CACHE = 0;

  //
  // Labels i18n locaux (paramètres utilisateur)
  i18n: any = {
    fr: {
      hub_title: 'Que souhaitez-vous faire ?',
      hub_subtitle: 'Choisissez votre intention pour commencer',
      quick_actions_title: 'Accès rapides',
      title_account_sign: 'Identifiez-vous avec une session',
      title_account_mail: 'Votre adresse mail',
      title_account_shipping: 'Vos adresses de livraison',
      title_account_subscriptions: 'Vos abonnements',
      title_orders: 'Vos commandes',
      title_invoices_open: 'Vos factures',
      title_settings: 'Paramètres',
    },
    en: {
      hub_title: 'What would you like to do?',
      hub_subtitle: 'Choose your intention to get started',
      quick_actions_title: 'Quick actions',
      title_account_sign: 'Sign in with a session',
      title_account_mail: 'Your email address',
      title_account_shipping: 'Your delivery addresses',
      title_account_subscriptions: 'Your subscriptions',
      title_orders: 'Your orders',
      title_invoices_open: 'Your invoices',
      title_settings: 'Settings',
    }
  };


  constructor(
    public $i18n: i18n,
    public $cart: CartService,
    public $loader: LoaderService,
    public $calendar: CalendarService,
    private $navigation: KngNavigationStateService,
    private $router: Router,
  ) {
    const { config, user, orders } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.orders = orders || [];
    this.currentShippingDay = new Date();
    this.subscription = new Subscription();
  }


  get locale(): 'fr' | 'en' {
    return this.$i18n.locale as 'fr' | 'en';
  }

  set locale(value: 'fr' | 'en') {
    this.$i18n.locale = value;
  }

  get llabel() {
    return this.i18n[this.locale];
  }

  get label() {
    return this.$i18n.label();
  }

  get lockedHUB() {
    return this.$navigation.isLocked();
  }

  get store() {
    return this.$navigation.store;
  }

  get hub(): Hub {
    return this.config?.shared?.hub || {};
  }

  get isAuthenticated(): boolean {
    return this.user?.isAuthenticated() || false;
  }

  get tagLine() {
    if (!this.config || !this.config.shared.tagLine) {
      return {};
    }
    const shared = this.config.shared;
    const hub = this.config.shared.hub;
    return (hub && hub.name) ? hub.tagLine : shared.tagLine;
  }

  /**
   * Nombre de commandes en cours (authorized/prepaid)
   */
  get pendingOrdersCount(): number {
    if (!this.orders) return 0;
    return this.orders.filter(o =>
      o.payment?.status === 'authorized' || o.payment?.status === 'prepaid'
    ).length;
  }

  /**
   * Prochain jour de livraison formaté
   */
  get nextShippingDayFormatted(): string {
    const day = this.$calendar.nextShippingDay(this.hub, this.user);
    if (!day) return '';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return day.toLocaleDateString(this.locale === 'fr' ? 'fr-CH' : 'en-CH', options);
  }

  // === INTENTIONS GETTERS ===

  get intentionCourses() {
    return getIntentionContent(this.intentions, 'courses', this.locale);
  }

  get intentionBuffet() {
    return getIntentionContent(this.intentions, 'buffet', this.locale);
  }

  get intentionSubscription() {
    return getIntentionContent(this.intentions, 'subscription', this.locale);
  }

  get intentionAssistant() {
    return getIntentionContent(this.intentions, 'assistant', this.locale);
  }

  ngOnInit() {
    this.subscription.add(
      this.$loader.update().subscribe(emit => {
        if (emit.state && emit.state.order) {
          this.orders.unshift(emit.state.order);
        }

        if (emit.user) {
          this.user = emit.user;
        }

        if (!emit.config) {
          return;
        }
        this.config = emit.config;
      })
    );

    setTimeout(() => {
      document.body.scrollTop = 0;
    }, 100);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isAppReady() {
    return this.$navigation.store !== undefined;
  }

  // === NAVIGATION METHODS ===

  /**
   * Navigation vers une intention
   */
  navigateToIntention(route: string) {
    KngRootComponent.SCROLL_CACHE = 0;
    this.$router.navigate(['/store', this.store, route.replace('/', '')]);
  }

  /**
   * Navigation vers l'assistant avec une question
   */
  navigateToAssistantWithQuestion(question: AssistantQuestion) {
    this.$router.navigate(['/store', this.store, 'assistant', 'james'], {
      queryParams: { prompt: question.action }
    });
  }

  doLocaleSwitch() {
    this.$i18n.localeSwitch();
  }

  doOpenMarket(hub) {
    KngRootComponent.SCROLL_CACHE = 0;
    this.$router.navigate(['/store', hub.slug, 'home']);
  }
}
