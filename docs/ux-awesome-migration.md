# Installation et Configuration de @awesome.me/webawesome dans Angular

Guide complet pour intégrer Web Awesome dans un projet Angular.

## 📦 1. Installation NPM

```bash
npm install @awesome.me/webawesome@^3.0.0
```

---

## ⚙️ 2. Configuration `angular.json`

Ajouter le thème CSS dans la section `styles` :

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles/styles.scss",
              "./node_modules/@awesome.me/webawesome/dist/styles/themes/default.css"
            ]
          }
        }
      }
    }
  }
}
```

---

## 🅰️ 3. Configuration Module Angular

Ajouter `CUSTOM_ELEMENTS_SCHEMA` pour autoriser les balises `wa-*` :

### app.module.ts

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... declarations, imports, providers
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Feature modules (common.module.ts, etc.)

**Important** : Ajouter aussi dans chaque module qui utilise des composants `wa-*` :

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... declarations, imports, exports
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CommonModule { }
```

---

## 📥 4. Import des Composants (Tree-shaking)

Créer un fichier d'imports par composant ou feature (ex: `webawesome.imports.ts`) :

```typescript
/**
 * Web Awesome Components - Imports sélectifs
 * 
 * @see https://webawesome.com/docs/components/button
 * @see https://webawesome.com/docs/components/drawer
 */

// Button - Boutons avec variants (pill, filled-outlined, etc.)
import '@awesome.me/webawesome/dist/components/button/button.js';

// Drawer - Menu latéral
import '@awesome.me/webawesome/dist/components/drawer/drawer.js';

// Icon - Icônes
import '@awesome.me/webawesome/dist/components/icon/icon.js';

// Input - Champs de saisie
import '@awesome.me/webawesome/dist/components/input/input.js';

// Dialog - Modales
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';

// Card - Cartes
import '@awesome.me/webawesome/dist/components/card/card.js';
```

Importer ce fichier dans le composant qui les utilise :

```typescript
// my-component.component.ts
import './webawesome.imports'; // Charge les web components

@Component({ ... })
export class MyComponent { }
```

---

## 🎨 5. Styles Globaux (SCSS)

Créer `src/styles/kng-awesome.scss` :

```scss
// ============================================================================
// Web Awesome - Styles globaux pour les composants wa-*
// ============================================================================
// Note: ::part() ne peut PAS avoir de sélecteurs descendants (> *)
// On ne peut styliser QUE le part lui-même
// ============================================================================

// Slot start - espacement inline
span[slot='start'] {
  margin-inline-end: 0.25em;
}

// Personnalisation wa-button
wa-button::part(base) {
  background-color: white;
}

// Personnalisation wa-drawer
wa-drawer::part(panel) {
  background-color: var(--mdc-theme-background);
}

// Personnalisation wa-input
wa-input::part(base) {
  border-radius: 0.5rem;
}
```

Importer dans `styles.scss` :

```scss
@import 'kng-awesome.scss';
```

---

## 🖼️ 6. Usage dans les Templates HTML

### Button

```html
<!-- Button filled -->
<wa-button variant="filled">
  <span slot="start">🛒</span>
  Ajouter au panier
</wa-button>

<!-- Button pill outlined -->
<wa-button variant="outlined" pill>
  Annuler
</wa-button>

<!-- Button avec icône -->
<wa-button variant="text">
  <wa-icon slot="start" name="heart"></wa-icon>
  Favoris
</wa-button>
```

### Drawer (menu latéral)

```html
<wa-drawer id="menu-drawer" placement="start">
  <nav>
    <a href="/home">Accueil</a>
    <a href="/products">Produits</a>
  </nav>
</wa-drawer>

<!-- Contrôle du drawer -->
<wa-button onclick="document.getElementById('menu-drawer').show()">
  ☰ Menu
</wa-button>
```

### Input

```html
<wa-input 
  label="Email" 
  type="email" 
  placeholder="votre@email.com"
  required>
</wa-input>
```

### Dialog

```html
<wa-dialog id="confirm-dialog" label="Confirmation">
  <p>Êtes-vous sûr de vouloir continuer ?</p>
  <wa-button slot="footer" variant="text">Annuler</wa-button>
  <wa-button slot="footer" variant="filled">Confirmer</wa-button>
</wa-dialog>
```

---

## 🔧 7. Interaction TypeScript avec Web Components

```typescript
// Accéder au web component
const drawer = document.getElementById('menu-drawer') as any;

// Méthodes disponibles
drawer.show();   // Ouvrir
drawer.hide();   // Fermer
drawer.toggle(); // Basculer

// Événements
drawer.addEventListener('wa-show', () => console.log('Drawer ouvert'));
drawer.addEventListener('wa-hide', () => console.log('Drawer fermé'));
drawer.addEventListener('wa-after-show', () => console.log('Animation terminée'));
```

### Dans un composant Angular

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  template: `
    <wa-drawer #menuDrawer placement="start">
      <nav>...</nav>
    </wa-drawer>
    <wa-button (click)="openMenu()">Menu</wa-button>
  `
})
export class MenuComponent implements AfterViewInit {
  @ViewChild('menuDrawer') drawerRef!: ElementRef;

  openMenu() {
    this.drawerRef.nativeElement.show();
  }

  closeMenu() {
    this.drawerRef.nativeElement.hide();
  }
}
```

---

## 🎭 8. Personnalisation via CSS Custom Properties

```scss
// Variables CSS de WebAwesome (peuvent être redéfinies dans :root)
:root {
  // Couleurs primaires
  --wa-color-primary-500: var(--mdc-theme-primary);
  --wa-color-primary-600: var(--mdc-theme-primary-dark);
  
  // Typographie
  --wa-font-sans: var(--mdc-theme-font);
  --wa-font-size-medium: 1rem;
  
  // Bordures
  --wa-border-radius-medium: 0.5rem;
  --wa-border-radius-large: 1rem;
  
  // Espacements
  --wa-spacing-medium: 1rem;
}
```

---

## 🎯 9. CSS Parts - Personnalisation Avancée

Les Web Components exposent des "parts" stylisables via `::part()` :

```scss
// Structure type d'un wa-button
// <wa-button>
//   #shadow-root
//     <button part="base">
//       <slot name="start"></slot>
//       <slot></slot>
//       <slot name="end"></slot>
//     </button>
// </wa-button>

// Styliser le part "base"
wa-button::part(base) {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

// État hover
wa-button::part(base):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

// Variante spécifique
wa-button[variant="filled"]::part(base) {
  background: linear-gradient(135deg, var(--mdc-theme-primary), var(--mdc-theme-secondary));
}
```

**⚠️ Limitations `::part()`** :
- Pas de sélecteurs descendants (`::part(base) > span` ❌)
- Pas de sélecteurs combinés (`::part(base)::part(label)` ❌)
- Un seul part par règle

---

## 📁 10. Structure Fichiers Recommandée

```
src/
├── styles/
│   ├── styles.scss           ← @import 'kng-awesome.scss';
│   └── kng-awesome.scss      ← Styles globaux wa-*
├── app/
│   ├── app.module.ts         ← CUSTOM_ELEMENTS_SCHEMA
│   └── common/
│       ├── common.module.ts  ← CUSTOM_ELEMENTS_SCHEMA
│       └── my-component/
│           ├── webawesome.imports.ts  ← Imports composants
│           └── my-component.component.ts
angular.json                  ← Thème default.css
package.json                  ← @awesome.me/webawesome: ^3.0.0
```

---

## 📋 11. Checklist Migration

- [ ] `npm install @awesome.me/webawesome@^3.0.0`
- [ ] Ajouter thème CSS dans `angular.json`
- [ ] Ajouter `CUSTOM_ELEMENTS_SCHEMA` dans `app.module.ts`
- [ ] Ajouter `CUSTOM_ELEMENTS_SCHEMA` dans les feature modules concernés
- [ ] Créer fichier d'imports sélectifs
- [ ] Créer `kng-awesome.scss` pour styles globaux
- [ ] Importer dans `styles.scss`

---

## 📚 Ressources

- **Documentation officielle** : https://webawesome.com/docs
- **Composants** : https://webawesome.com/docs/components/button
- **Thèmes** : https://webawesome.com/docs/getting-started/themes
- **CSS Parts** : https://webawesome.com/docs/getting-started/customizing#css-parts
- **Icônes** : https://webawesome.com/docs/components/icon

---

## 🔄 Composants Disponibles

| Composant | Import | Usage |
|-----------|--------|-------|
| Button | `button/button.js` | `<wa-button>` |
| Drawer | `drawer/drawer.js` | `<wa-drawer>` |
| Dialog | `dialog/dialog.js` | `<wa-dialog>` |
| Input | `input/input.js` | `<wa-input>` |
| Icon | `icon/icon.js` | `<wa-icon>` |
| Card | `card/card.js` | `<wa-card>` |
| Checkbox | `checkbox/checkbox.js` | `<wa-checkbox>` |
| Radio | `radio/radio.js` | `<wa-radio>` |
| Select | `select/select.js` | `<wa-select>` |
| Switch | `switch/switch.js` | `<wa-switch>` |
| Tooltip | `tooltip/tooltip.js` | `<wa-tooltip>` |
| Badge | `badge/badge.js` | `<wa-badge>` |
| Avatar | `avatar/avatar.js` | `<wa-avatar>` |
| Spinner | `spinner/spinner.js` | `<wa-spinner>` |
| Progress | `progress-bar/progress-bar.js` | `<wa-progress-bar>` |
| Tab | `tab-group/tab-group.js` | `<wa-tab-group>` |
| Menu | `menu/menu.js` | `<wa-menu>` |
| Dropdown | `dropdown/dropdown.js` | `<wa-dropdown>` |
