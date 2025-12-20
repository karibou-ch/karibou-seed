# PWA Edgar - Configuration et Maintenance

> **Statut** : ✅ **IMPLÉMENTÉ** (Décembre 2025)

---

## ⚠️ POINTS CRITIQUES - À LIRE EN PREMIER

> **Ces règles sont essentielles pour éviter les bugs de page blanche après déploiement.**

### 1. Ordre des `dataGroups` dans `ngsw-config.json`

**Les règles spécifiques DOIVENT être AVANT les règles générales.** Le premier match gagne !

```
❌ INCORRECT:
  "/api/**"           ← matche TOUT, les suivants sont ignorés
  "/api/rules/**"
  
✅ CORRECT:
  "/api/rules/**"     ← règle spécifique EN PREMIER
  "/api/assistant/**"
  "/api/**"           ← fallback général EN DERNIER
```

### 2. Script de recovery PWA dans `index.html`

Le script de recovery doit :
1. **Désinscire le SW d'abord** (sinon il recache les vieux fichiers)
2. **Vider tous les caches**
3. **Recharger la page**

L'ordre est crucial pour éviter une boucle infinie.

### 3. Pattern de hash Angular

Les hashes Angular peuvent être de 8+ caractères (pas forcément 16+). Le pattern doit être :
```javascript
/\.[a-f0-9]{8,}\.(js|css|mjs)$/i
```

---

## 📋 État actuel

### ✅ Fichiers en place
- ✅ `ngsw-config.json` - Configuration du service worker
- ✅ `src/manifest.webmanifest` - Métadonnées PWA
- ✅ `src/assets/icons/` - 9 icônes PWA (72x72 → 512x512 + apple-touch-icon)
- ✅ `src/index.html` - Liens PWA et meta tags
- ✅ `angular.json` - `serviceWorker: true` + `ngswConfigPath`
- ✅ `app.component.ts` - Gestion des mises à jour automatiques

---

## 🔧 Configuration Nginx (CRITIQUE)

**Ces règles doivent être ajoutées AVANT les autres `location`** pour éviter les problèmes de cache :

```nginx
# === PWA SERVICE WORKER - FICHIERS CRITIQUES ===
# Ces fichiers ne doivent JAMAIS être cachés par le navigateur
location ~ ^/(ngsw\.json|ngsw-worker\.js)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header X-Robots-Tag "noindex, nofollow";
    try_files $uri =404;
}

# === index.html - Point d'entrée PWA ===
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    add_header X-Robots-Tag "noindex, nofollow";
}

# === Manifest PWA - Cache court ===
location = /manifest.webmanifest {
    add_header Cache-Control "public, max-age=3600";
    add_header X-Robots-Tag "noindex, nofollow";
}

# === Assets Angular hashés (main.abc123.js) - Cache long ===
location ~* \.[a-f0-9]{16,}\.(js|css)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Robots-Tag "noindex, nofollow";
    add_header X-Content-Type-Options "nosniff";
    access_log off;
}

# === .mjs (pdf.worker.mjs) - pas hashé, cache moyen ===
location ~* \.mjs$ {
    types { application/javascript mjs; }
    default_type application/javascript;
    add_header Cache-Control "public, max-age=604800";
    add_header X-Content-Type-Options "nosniff";
    add_header X-Robots-Tag "noindex, nofollow";
    access_log off;
    try_files $uri =404;
}
```

### Résumé des durées de cache

| Fichier | Cache-Control | Raison |
|---------|--------------|--------|
| `ngsw.json`, `ngsw-worker.js` | **no-cache** | Critique pour détecter les mises à jour |
| `index.html` | **no-cache** | Point d'entrée, doit toujours être frais |
| `manifest.webmanifest` | 1h | Peut changer (nom, icônes) |
| `*.abc123.js/css` (hashés) | 1 an + immutable | Hash = version unique |
| `pdf.worker.mjs` | 7 jours | Stable, pas hashé |
| Images, fonts | 7 jours | Rarement modifiés |

---

## 🔄 Code Angular - Mises à jour automatiques

Le fichier `app.component.ts` gère les mises à jour PWA :

```typescript
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { interval, filter, takeUntil } from 'rxjs';

private initServiceWorkerUpdates(): void {
  if (!this.$update.isEnabled) return;

  // Vérification périodique (toutes les 6 heures)
  // Note: les intervals sont throttle quand l'onglet est inactif,
  // donc on utilise Date.now() pour calculer le delta réel
  const checkInterval = 5 * 60 * 1000; // Vérifie toutes les 5 min
  const updateInterval = 6 * 60 * 60 * 1000; // Mais update si 6h écoulées
  let lastCheck = Date.now();

  interval(checkInterval).pipe(takeUntil(this._destroying$)).subscribe(() => {
    const now = Date.now();
    if (now - lastCheck >= updateInterval) {
      lastCheck = now;
      this.$update.checkForUpdate();
    }
  });

  // Nouvelle version disponible
  this.$update.versionUpdates.pipe(
    filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
    takeUntil(this._destroying$)
  ).subscribe(() => {
    alert('L\'application va se recharger pour appliquer une mise à jour.');
    this.$update.activateUpdate().then(() => window.location.reload());
  });

  // État irrécupérable du SW (cache corrompu)
  this.$update.unrecoverable.pipe(takeUntil(this._destroying$)).subscribe(event => {
    console.error('[SW] État irrécupérable:', event.reason);
    alert('L\'application a rencontré une erreur et doit être rechargée.');
    window.location.reload();
  });
}
```

### Pourquoi `Date.now()` au lieu de `interval` simple ?
Quand un onglet du navigateur est inactif, les timers/intervals sont throttle par le browser. En utilisant `Date.now()`, on calcule le temps réel écoulé depuis la dernière vérification, garantissant que la mise à jour se déclenche correctement même après une longue période d'inactivité.

---

## 📦 Configuration ngsw-config.json

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/favicon-32x32.png",
          "/favicon-16x16.png",
          "/icon-tab.svg",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "app-critical",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/index.html"]
      }
    },
    {
      "name": "assets-critical",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/*.jpg",
          "/assets/*.png",
          "/assets/*.mjs",
          "/assets/icons/*"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "google-fonts",
      "urls": [
        "https://fonts.googleapis.com/**",
        "https://fonts.gstatic.com/**"
      ],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 20,
        "maxAge": "30d",
        "timeout": "10s"
      }
    },
    {
      "name": "api-freshness",
      "urls": ["/api/rules/**", "/api/assistant/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "5m",
        "timeout": "5s"
      }
    },
    {
      "name": "api-performance",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s"
      }
    }
  ]
}
```

### Stratégies de cache

| Groupe | Mode | Description |
|--------|------|-------------|
| `app` | prefetch | JS/CSS principal, chargé immédiatement |
| `app-critical` | prefetch | `index.html` séparé pour mises à jour rapides |
| `assets-critical` | prefetch | Images UI, icônes, pdf.worker |
| `assets` | lazy | Autres assets, chargés à la demande |
| `google-fonts` | performance | Cache 30 jours (changent rarement) |
| `api-freshness` | freshness | ⚠️ **EN PREMIER** - Cache 5m, `/api/rules/**` et `/api/assistant/**` |
| `api-performance` | performance | Fallback `/api/**`, cache 1h |

> ⚠️ **L'ordre des `dataGroups` est crucial** : les règles spécifiques (`api-freshness`) doivent être déclarées AVANT la règle générale (`api-performance`).

---

## 🛡️ Script de Recovery PWA

Le script dans `index.html` détecte les erreurs de chargement (fichiers hashés manquants après déploiement) et réinitialise le PWA automatiquement :

```javascript
(function() {
  if (!('serviceWorker' in navigator)) return;

  // Pattern élargi pour matcher les hashes Angular (8+ caractères hex)
  var hashPattern = /\.[a-f0-9]{8,}\.(js|css|mjs)$/i;
  var recovering = false;

  // Détecte les erreurs de chargement (404 sur fichiers hashés)
  window.addEventListener('error', function(event) {
    if (recovering) return;
    var target = event.target;
    var src = target && (target.src || target.href);

    if (src && hashPattern.test(src)) {
      recovering = true;
      fullReset();
    }
  }, true);

  // Écoute les messages du SW indiquant un état irrécupérable
  navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UNRECOVERABLE_STATE') {
      if (!recovering) {
        recovering = true;
        fullReset();
      }
    }
  });

  // Reset complet: désinscrit le SW, vide les caches, puis reload
  // ⚠️ L'ordre est crucial: SW d'abord pour éviter qu'il recache les vieux fichiers
  function fullReset() {
    navigator.serviceWorker.getRegistrations()
      .then(function(regs) {
        return Promise.all(regs.map(function(r) { return r.unregister(); }));
      })
      .then(function() { return caches.keys(); })
      .then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
      })
      .then(function() { window.location.reload(); })
      .catch(function() { window.location.reload(); });
  }
})();
```

**Séquence du reset :**
1. **Désinscription des SW** → empêche le recaching immédiat
2. **Suppression des caches** → vide les données obsolètes
3. **Reload** → télécharge la nouvelle version depuis le serveur

---

## 🖼️ Générer les icônes PWA

À partir du fichier source `src/assets/icon-logo.png` :

```bash
cd packages/agentic-client

# Créer le dossier si nécessaire
mkdir -p src/assets/icons

# Générer toutes les tailles avec ImageMagick
convert src/assets/icon-logo.png -resize 72x72 src/assets/icons/icon-72x72.png
convert src/assets/icon-logo.png -resize 96x96 src/assets/icons/icon-96x96.png
convert src/assets/icon-logo.png -resize 128x128 src/assets/icons/icon-128x128.png
convert src/assets/icon-logo.png -resize 144x144 src/assets/icons/icon-144x144.png
convert src/assets/icon-logo.png -resize 152x152 src/assets/icons/icon-152x152.png
convert src/assets/icon-logo.png -resize 192x192 src/assets/icons/icon-192x192.png
convert src/assets/icon-logo.png -resize 384x384 src/assets/icons/icon-384x384.png
convert src/assets/icon-logo.png -resize 512x512 src/assets/icons/icon-512x512.png
convert src/assets/icon-logo.png -resize 180x180 src/assets/icons/apple-touch-icon.png

# Vérifier les icônes générées
ls -la src/assets/icons/
```

**Prérequis** : ImageMagick doit être installé (`sudo apt install imagemagick`)

**Tailles requises** :
| Taille | Usage |
|--------|-------|
| 72x72, 96x96, 144x144, 192x192, 384x384, 512x512 | Android |
| 128x128 | Chrome |
| 152x152 | iOS |
| 180x180 (apple-touch-icon) | iOS home screen |

---

## 🧪 Tests et débogage

### Vérifier le PWA
```bash
# Build production
npm run build

# Vérifier les fichiers générés
ls -la dist/agentic-client/ngsw-worker.js dist/agentic-client/ngsw.json
```

### Chrome DevTools
1. **Application > Manifest** : Vérifier le manifest
2. **Application > Service Workers** : Voir l'état du SW
3. **Application > Cache Storage** : Voir les fichiers cachés

### Forcer une mise à jour
- URL avec `?ngsw-bypass=true` : Bypass le service worker
- DevTools > Application > Service Workers > **Unregister**

### Lighthouse
Chrome DevTools > Lighthouse > Cocher "Progressive Web App" > Analyze

---

## 🚀 Déploiement avec rsync

### Configuration actuelle

```bash
rsync -uad --delete /local/dist/ user@server:/var/www/app/
```

### ⚠️ Impact du `--delete` sur PWA

Avec `--delete`, les anciens fichiers hashés sont supprimés **immédiatement**. Si un utilisateur a encore l'ancien SW en cache, il peut rencontrer un 404 → page blanche.

**Le script de recovery dans `index.html` gère ce cas** en :
1. Détectant le 404 sur fichier hashé
2. Désinscrivant le SW
3. Vidant le cache
4. Rechargeant la page

### Alternative: Rétention temporaire (si problèmes persistants)

Si des pages blanches persistent après déploiement, passer à une stratégie de rétention :

```bash
# Étape 1: Ajouter les nouveaux fichiers SANS supprimer les anciens
rsync -uad /local/dist/ user@server:/var/www/app/

# Étape 2 (cron quotidien): Nettoyer les fichiers > 7 jours
find www/admin.karibou.ch/ -type f -name "*" -mtime +180 -delete

```

| Stratégie | Avantage | Inconvénient |
|-----------|----------|--------------|
| `--delete` + recovery script | Simple, workflow inchangé | Flash possible avant recovery |
| Rétention temporaire | Aucun 404 | Espace disque + cron à gérer |

---

## ⚠️ Notes importantes

1. **HTTPS requis** : Le PWA nécessite HTTPS en production (sauf localhost)
2. **Service Worker** : Activé uniquement en production (`environment.production`)
3. **Onglets inactifs** : Les timers sont throttle, d'où l'utilisation de `Date.now()`
4. **Cache nginx** : Les fichiers `ngsw*.js` et `index.html` ne doivent JAMAIS être cachés
5. **Mises à jour** : L'utilisateur est notifié et l'app se recharge automatiquement
6. **Déploiement rsync** : Le script de recovery gère les 404 causés par `--delete`

---

## 📚 Ressources

- [Angular Service Worker](https://angular.io/guide/service-worker-intro)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Checklist](https://web.dev/pwa-checklist/)
