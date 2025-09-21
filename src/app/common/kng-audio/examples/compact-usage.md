# Usage du composant KngAudioNoteCompact

## 🎯 Version compacte sur une ligne

Le composant `kng-audio-note-compact` est une version minimaliste du système audio, parfaite pour l'intégration dans des interfaces denses.

> **Note**: Cette documentation reflète l'implémentation actuelle avec la structure i18n simplifiée `$i18n` et les inputs `locale` pour la gestion multilingue.

## 🚀 Usage basique

### Version inline simple
```html
<!-- ✅ Usage minimal - juste un bouton -->
<kng-audio-note-compact 
  type="item"
  [key]="uploadcareKey"
  (onAudioReady)="handleAudio($event)">
</kng-audio-note-compact>
```

### Dans une liste de produits
```html
<div class="product-item">
  <span>{{ product.title }}</span>
  <span>{{ product.price }} CHF</span>
  
  <!-- ✅ Note audio compacte -->
  <kng-audio-note-compact 
    type="item"
    [key]="config.shared.keys.pubUpcare"
    filename="note-{{ product.sku }}"
    (onAudioReady)="onProductNote($event)">
  </kng-audio-note-compact>
</div>
```

### Dans une barre d'outils
```html
<div class="toolbar">
  <button>Action 1</button>
  <button>Action 2</button>
  
  <!-- ✅ Audio compact en mode toolbar -->
  <kng-audio-note-compact 
    type="helper" 
    class="toolbar"
    [key]="uploadcareKey">
  </kng-audio-note-compact>
</div>
```

## 🎨 Modes d'affichage

### Mode normal (par défaut)
```html
<kng-audio-note-compact type="support">
</kng-audio-note-compact>
<!-- Résultat: [🎤] [Audio Player] [❌] -->
```

### Mode inline (dans du texte)
```html
<p>
  Vous avez une question ? 
  <kng-audio-note-compact type="helper" class="inline">
  </kng-audio-note-compact>
  Posez-la vocalement !
</p>
<!-- Résultat: Texte [🎤] texte -->
```

### Mode toolbar (icône seule)
```html
<div class="actions">
  <kng-audio-note-compact type="support" class="toolbar">
  </kng-audio-note-compact>
</div>
<!-- Résultat: [🎤] (lecteur audio caché) -->
```

## 🔧 Configuration

### Paramètres disponibles
```typescript
@Input() type: AudioNoteType = 'item';     // Type d'usage
@Input() filename: string = '';            // Nom fichier (optionnel)
@Input() key: string = '';                 // Clé Uploadcare
@Input() disabled: boolean = false;        // Désactiver le composant
@Input() locale: string = 'fr';            // Langue pour les labels (fr/en)
```

### Events
```typescript
(onAudioReady)="handleAudio($event)"      // Audio prêt
(onAudioError)="handleError($event)"      // Erreur
```

## 🎯 États visuels

### Icônes selon l'état
| État | Icône | Couleur | Tooltip |
|------|-------|---------|---------|
| **Prêt** | `mic` | Primaire | "Ajouter note vocale" |
| **Enregistrement** | `stop` | Rouge | "Arrêter (5s)" |
| **Traitement** | `hourglass_empty` | Secondaire | "Traitement..." |
| **Erreur** | `error` | Rouge | "Erreur - Réessayer" |
| **Succès** | `check_circle` | Vert | "Audio enregistré" |

### Indicateurs visuels
- **Volume temps réel** : Barre de progression en bas du bouton
- **Timer** : Affichage du temps d'enregistrement (5s, 10s...)
- **Animation pulse** : Pendant l'enregistrement
- **Animation spin** : Pendant le traitement

## 📱 Responsive

### Desktop (normal)
```css
.compact-btn {
  padding: 8px 12px;
  gap: 6px;
  font-size: 14px;
}
```

### Mobile (réduit)
```css
.compact-btn {
  padding: 6px 8px;
  gap: 4px;
  font-size: 12px;
}
```

## 🎨 Classes CSS personnalisées

### Modes d'intégration
```html
<!-- Mode normal -->
<kng-audio-note-compact type="item">
</kng-audio-note-compact>

<!-- Mode inline dans texte -->
<kng-audio-note-compact type="helper" class="inline">
</kng-audio-note-compact>

<!-- Mode toolbar (icône seule) -->
<kng-audio-note-compact type="support" class="toolbar">
</kng-audio-note-compact>
```

### Customisation CSS
```scss
// Personnaliser la couleur
.my-custom-audio {
  --audio-primary-color: #your-color;
  
  .compact-btn .icon {
    color: var(--audio-primary-color);
  }
}
```

## 🔍 Comparaison avec la version enhanced

| Aspect | Enhanced | Compact |
|--------|----------|---------|
| **Taille** | Multi-lignes | Une ligne |
| **Visualisation** | Waveform + Canvas | Indicateur volume simple |
| **Customisation** | Slots ng-content | Classes CSS |
| **Transcription** | Affichage complet | Pas d'affichage |
| **Gestion erreurs** | Interface complète | Tooltip + icône |
| **Usage** | Pages dédiées | Listes, toolbars, inline |

## 💡 Cas d'usage recommandés

### ✅ Utilisez Compact pour :
- **Listes de produits** : Note rapide par produit
- **Barres d'outils** : Action audio dans interface dense
- **Inline text** : Audio dans du contenu textuel
- **Dashboards** : Feedback rapide utilisateur
- **Mobile** : Interface optimisée espace réduit

### ✅ Utilisez Enhanced pour :
- **Pages dédiées** : Support, assistant, formulaires
- **Workflows complexes** : Avec transcription et contexte
- **Customisation avancée** : Slots et interface personnalisée
- **Debug/analyse** : Avec visualisation waveform

## 🚀 Exemple complet

```html
<!-- Dans une liste de commandes -->
<div class="order-item" *ngFor="let order of orders">
  <div class="order-info">
    <span>Commande #{{ order.oid }}</span>
    <span>{{ order.total }} CHF</span>
  </div>
  
  <!-- ✅ Note support compacte -->
  <kng-audio-note-compact 
    type="support"
    [key]="uploadcareKey"
    filename="support-order-{{ order.oid }}"
    (onAudioReady)="onOrderSupport(order, $event)"
    (onAudioError)="onAudioError($event)">
  </kng-audio-note-compact>
</div>
```

La version compacte offre **90% des fonctionnalités** dans **10% de l'espace** ! 🎯
