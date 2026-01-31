import { Routes } from '@angular/router';

/**
 * @deprecated Les routes sont maintenant définies dans app.routes.ts
 * Ce fichier est conservé pour rétrocompatibilité.
 *
 * ⚠️ NE PAS AJOUTER DE ROUTES ICI - cela cause des conflits avec les modules
 * lazy-loaded (cart, user, patreon, etc.) qui importent KngSharedModule.
 */
export const childrenRoute: Routes = [];

// Routes vides - tout est dans app.routes.ts
export const appRoutes: Routes = [];
