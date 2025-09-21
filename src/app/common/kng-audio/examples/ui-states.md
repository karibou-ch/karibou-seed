# États UI des contrôles audio compacts

## 🎯 Design compact en ligne (flex-row, no-wrap)

> **Note**: Cette documentation reflète l'implémentation actuelle avec la structure i18n simplifiée `$i18n` et les inputs `locale` pour la gestion multilingue.

### État 1: Initial 
```
|                                   [🎙️]|
```
- **Élément** : Bouton micro circulaire (48px)
- **Action** : Clic pour démarrer l'enregistrement
- **Style** : Bordure primaire, background transparent avec hover

```html
<div class="control-row">
  <button class="btn-mic">
    <span class="material-symbols-outlined">mic</span>
  </button>
</div>
```

### État 2: Recording
```
|[visual   audio]         [⏹]|
```
- **Élément gauche** : Visualiseur audio + timer (flex: 1)
- **Élément droit** : Bouton stop circulaire (40px)
- **Animation** : Visualiseur temps réel + timer incrémental
- **Style** : Container avec background primaire, bouton stop rouge

```html
<div class="control-row">
  <div class="visual-audio">
    <kng-audio-visualizer [width]="120" [height]="32"></kng-audio-visualizer>
    <span class="timer">{{ recordingTime }}s</span>
  </div>
  <button class="btn-stop">
    <span class="material-symbols-outlined">stop</span>
  </button>
</div>
```

### État 3: Audio prêt
```
|[ audio player]       [❎]|
```
- **Élément gauche** : Lecteur audio HTML5 (flex: 1)
- **Élément droit** : Bouton clear circulaire (32px)
- **Fonctionnalité** : Lecture audio + suppression
- **Style** : Lecteur avec border-radius, bouton clear rouge

```html
<div class="control-row">
  <audio class="audio-player" controls></audio>
  <button class="btn-clear">
    <span class="material-symbols-outlined">close</span>
  </button>
</div>
```

### État 4: Processing (bonus)
```
|[⏳ Traitement...]|
```
- **Élément** : Indicateur de traitement avec spinner
- **Animation** : Spinner rotatif
- **Style** : Background secondaire avec bordure

```html
<div class="control-row">
  <div class="processing-indicator">
    <span class="material-symbols-outlined spinning">autorenew</span>
    <span>Traitement...</span>
  </div>
</div>
```

## 🎨 Spécifications CSS

### Container principal
```scss
.audio-controls {
  display: flex;
  justify-content: center;
  min-height: 40px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;        // ✅ Pas de retour à la ligne
  width: 100%;
  max-width: 400px;
}
```

### Tailles des éléments
- **Bouton mic initial** : 48px × 48px (plus visible)
- **Bouton stop** : 40px × 40px (action critique)
- **Bouton clear** : 32px × 32px (action secondaire)
- **Visualiseur** : 120px × 32px (compact)
- **Lecteur audio** : flex: 1, height: 40px

### Couleurs par état
- **Initial** : Couleur primaire du thème
- **Recording** : Rouge (#f44336) pour stop
- **Success** : Vert (#4CAF50) pour validation
- **Processing** : Couleur secondaire du thème
- **Error** : Rouge avec background d'alerte

## 📱 Responsive

### Desktop (≥768px)
```
|                                   [🎙️]|  (48px button)
|[visualizer 120px]    [timer]     [⏹]|  (40px stop)
|[audio player flex]              [❎]|  (32px clear)
```

### Mobile (<768px)
```
|                            [🎙️]|  (40px button)
|[visualizer 100px] [timer]  [⏹]|  (36px stop)
|[audio player flex]        [❎]|  (28px clear)
```

## 🔄 Transitions

### Animations fluides
- **Hover** : `transform: scale(1.05)` + `box-shadow`
- **Recording** : Animation pulse sur le bouton stop
- **Processing** : Spinner rotatif continu
- **Success** : Transition douce vers lecteur audio

### Timing
- **Transition** : `all 0.2s ease` pour les interactions
- **Hover** : `all 0.3s ease` pour les effets
- **Animations** : `1s` pour pulse/spin

## 💡 Avantages du design

### ✅ Compacité
- **Une seule ligne** : Hauteur fixe ~40-48px
- **Largeur flexible** : S'adapte au container parent
- **États exclusifs** : Un seul état visible à la fois

### ✅ Clarté
- **Actions évidentes** : Boutons avec icônes universelles
- **Feedback visuel** : États clairement différenciés
- **Progression logique** : Micro → Enregistrement → Lecture

### ✅ Performance
- **Rendu conditionnel** : Seul l'état actuel est dans le DOM
- **Animations optimisées** : CSS transforms + GPU acceleration
- **Lazy loading** : Visualiseur créé seulement si nécessaire

Cette interface compacte offre une **expérience utilisateur fluide** dans un **espace minimal** ! 🎯
