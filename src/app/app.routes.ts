import { Routes } from '@angular/router';
import { LoaderResolve } from 'kng2-core';

import { KngWelcomeComponent } from './kng-welcome/kng-welcome.component';
import { KngValidateMailComponent } from './kng-validate-mail/kng-validate-mail.component';
import { IsWelcomeGard } from './common';
import { KngServerErrorFoundComponent } from './kng-server-error-found/kng-server-error-found.component';
import { KngPageNotFoundComponent } from './kng-page-not-found/kng-page-not-found.component';
import { KngRootComponent } from './kng-root/kng-root.component';
import { KngNavigationStoreResolve } from './common/navigation.store.service';
import { KngNavbarWrapperComponent } from './common/kng-empty-root/kng-empty-root.component';

// Composants pour les routes (importés depuis shared-components)
import { KngHomeComponent } from './kng-home/kng-home.component';
import { ProductListComponent, ProductComponent, KngProductListByShopComponent } from './kng-product';
import { KngShopsComponent } from './kng-shops/kng-shops.component';
import { KngSubscriptionComponent } from './kng-subscription/kng-subscription.component';

/**
 * Routes enfants de /home (marché) - Catégories et listes de produits
 * Ces routes s'affichent dans le router-outlet de KngHomeComponent
 *
 * NOTE: Les routes /products sont maintenant au niveau store pour être
 * accessibles depuis n'importe quelle page (home, subscriptions, etc.)
 */
const homeChildrenRoutes: Routes = [
  // NOTE: /assistant est maintenant au niveau /store/:store/assistant (vue à part entière)
  { path: 'business', data: { business: true }, component: ProductListComponent },
  { path: 'subscription', data: { subscription: true }, component: ProductListComponent },
  { path: 'category/:category/:child', component: ProductListComponent },
  { path: 'category/:category', component: ProductListComponent },
  { path: 'category', pathMatch: 'full', redirectTo: '' },

  // Redirections pour URLs externes existantes → nouvelle route au niveau store
  { path: 'products/:sku/:title', redirectTo: '/store/:store/products/:sku/:title' },
  { path: 'products/:sku', redirectTo: '/store/:store/products/:sku' },
  { path: 'products', pathMatch: 'full', redirectTo: '/store/:store/products' },
];

/**
 * Routes enfants de /store/:store
 * Toutes sous le même wrapper (KngNavbarWrapperComponent)
 *
 * ARCHITECTURE CORRECTE:
 * /store/:store (KngNavbarWrapperComponent avec router-outlet)
 *   ├── /home (KngHomeComponent) - marché
 *   ├── /cart (KngCartModule) - panier
 *   ├── /me (UserModule) - compte utilisateur
 *   ├── /patreon (KngPatreonModule) - abonnements patreon
 *   ├── /shops (boutiques)
 *   └── /admin, /content, /subscriptions...
 */
const storeChildrenRoutes: Routes = [
  // Path vide = accueil (KngRootComponent)
  { path: '', component: KngRootComponent, pathMatch: 'full' },

  // ============================================================================
  // ROUTE PRODUIT PARTAGÉE - Accessible depuis home, subscriptions, etc.
  // URL: /store/:store/products/:sku/:title
  // ============================================================================
  { path: 'products/:sku/:title', component: ProductComponent },
  { path: 'products/:sku', component: ProductComponent },
  { path: 'products', pathMatch: 'full', component: ProductComponent, data: { redirect: true } },

  // /home = marché avec ses enfants (catégories, listes)
  {
    path: 'home',
    component: KngHomeComponent,
    data: { departement: 'home' },
    children: homeChildrenRoutes
  },

  // ============================================================================
  // MODULES AU MÊME NIVEAU QUE HOME (pas enfants de home!)
  // ============================================================================
  { path: 'cart', loadChildren: () => import('./kng-cart/kng-cart.module').then(m => m.KngCartModule) },
  { path: 'me', loadChildren: () => import('./kng-user/user.module').then(m => m.UserModule) },
  { path: 'patreon', loadChildren: () => import('./kng-patreon/kng-patreon.module').then(m => m.KngPatreonModule) },
  { path: 'landing', loadChildren: () => import('./kng-shops/kng-shops.module').then(m => m.KngShopsModule) },
  { path: 'shops', component: KngShopsComponent },
  { path: 'shops/:shop/:child', component: KngProductListByShopComponent },
  { path: 'shops/:shop', component: KngProductListByShopComponent },

  // Modules admin et spécifiques
  {
    path: 'admin',
    loadChildren: () => import('./kng-admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'content',
    loadChildren: () => import('./kng-document/kng-document.module').then(m => m.KngDocumentModule)
  },
  // ✅ Composant direct (non lazy-loaded) pour permettre le cache RouteReuseStrategy
  {
    path: 'subscriptions',
    component: KngSubscriptionComponent,
    data: { departement: 'subscriptions' }
  },

  // ============================================================================
  // ASSISTANT - Vue à part entière (layout 3 colonnes)
  // ============================================================================
  {
    path: 'assistant',
    loadChildren: () => import('./kng-assistant-bot/kng-assistant-bot.module').then(m => m.KngAssistantBotModule)
  }

];

/**
 * Routes principales de l'application
 */
export const appRoutes: Routes = [
  // Routes standalone
  { path: 'me', loadChildren: () => import('./kng-user/user.module').then(m => m.UserModule) },
  {
    path: 'validate/:uid/:mail',
    component: KngValidateMailComponent,
    resolve: { loader: LoaderResolve }
  },

  // Store sans nom = choix du hub
  {
    path: 'store',
    component: KngNavbarWrapperComponent,
    resolve: { loader: LoaderResolve },
    children: [
      { path: '', component: KngRootComponent, pathMatch: 'full' }
    ]
  },

  // ============================================================================
  // ROUTE PRINCIPALE: /store/:store avec tous les enfants
  // ============================================================================
  {
    path: 'store/:store',
    component: KngNavbarWrapperComponent,
    resolve: { loader: KngNavigationStoreResolve },
    children: storeChildrenRoutes
  },

  /* ALIAS - Redirections pour rétrocompatibilité */
  { path: 'store/:store/cellar', pathMatch: 'full', redirectTo: '/store/:store/home' },
  { path: 'store/:store/grocery', pathMatch: 'full', redirectTo: '/store/:store/home' },

  // Anciennes URLs /home/xxx → nouvelles URLs /xxx
  { path: 'store/:store/home/cart', redirectTo: '/store/:store/cart' },
  { path: 'store/:store/home/me', redirectTo: '/store/:store/me' },
  { path: 'store/:store/home/patreon', redirectTo: '/store/:store/patreon' },
  { path: 'store/:store/home/shops', redirectTo: '/store/:store/shops' },
  { path: 'store/:store/home/landing', redirectTo: '/store/:store/landing' },
  { path: 'store/:store/home/assistant/:name', redirectTo: '/store/:store/assistant/:name' },
  { path: 'store/:store/home/assistant', redirectTo: '/store/:store/assistant' },

  { path: 'products/:sku/:title', pathMatch: 'full', redirectTo: '/store/artamis/products/:sku/:title' },
  { path: 'products/:sku', pathMatch: 'full', redirectTo: '/store/artamis/products/:sku' },
  { path: 'shop/:slug', pathMatch: 'full', redirectTo: '/store/artamis/shops/:slug' },
  { path: 'account/login', pathMatch: 'full', redirectTo: '/store/artamis/me/login' },
  { path: 'account/orders', pathMatch: 'full', redirectTo: '/store/artamis/me/orders' },
  { path: 'account/reminder', pathMatch: 'full', redirectTo: '/store/artamis/me/reminder' },

  // Page d'accueil
  {
    path: '',
    pathMatch: 'full',
    resolve: { loader: LoaderResolve },
    canActivate: [IsWelcomeGard],
    component: KngWelcomeComponent
  },

  // Erreurs
  { path: 'oops', component: KngServerErrorFoundComponent },
  { path: '**', component: KngPageNotFoundComponent },
];
