# Module KngAudio

Module Angular centralisé pour la gestion des enregistrements audio avec visualisation temps réel et interface moderne.

## 🎯 Fonctionnalités

- ✅ **Enregistrement audio** robuste avec RecordRTC
- ✅ **Visualisation temps réel** avec canvas et waveform
- ✅ **Gestion d'erreurs** sophistiquée avec retry automatique
- ✅ **Interface moderne** avec états visuels et animations
- ✅ **Support multi-types** : item, support, helper
- ✅ **Transcription Whisper** intégrée
- ✅ **Upload Uploadcare** automatique

## 📦 Installation

```typescript
import { KngAudioModule } from './common/kng-audio';

@NgModule({
  imports: [
    KngAudioModule
  ]
})
export class YourModule { }
```

## 🚀 Usage

### Composant Note Audio Amélioré

```html
<kng-audio-note-enhanced
  type="item"
  [filename]="'note-' + product.sku"
  [key]="config.shared.keys.pubUpcare"
  [amount]="product.pricing.price"
  [locale]="currentLocale"
  (onAudioReady)="onAudioReady($event)"
  (onAudioError)="onAudioError($event)"
  (onStateChange)="onAudioStateChange($event)">
  
  <!-- ✅ Customisation via slots -->
  <div slot="header">
    <h3>Note pour {{ product.title }}</h3>
  </div>
  
  <div slot="response">
    <div class="custom-transcription">
      <!-- Interface personnalisée -->
    </div>
  </div>
</kng-audio-note-enhanced>
```

### Composant Note Audio Compact

```html
<kng-audio-note-compact
  type="support"
  [key]="config.shared.keys.pubUpcare"
  [locale]="currentLocale"
  (onAudioReady)="onAudioReady($event)"
  (onAudioError)="onAudioError($event)">
</kng-audio-note-compact>
```

### Composant Visualiseur Audio

```html
<kng-audio-visualizer
  [width]="'100%'"
  [height]="'100%'"
  [showRealtime]="true"
  [showWaveform]="false"
  [showVolumeMeter]="true"
  [showActivity]="true"
  [showLabel]="false"
  [waveformData]="audioWaveformData">
</kng-audio-visualizer>
```

### Service Audio Enhanced

```typescript
import { KngAudioRecorderEnhancedService, AudioActivityData } from './common/kng-audio';

constructor(private audioService: KngAudioRecorderEnhancedService) {
  // Écouter l'activité audio
  this.audioService.audioActivity.subscribe((data: AudioActivityData) => {
    console.log('Volume:', data.volume, 'Active:', data.isActive);
  });
}

async startRecording() {
  await this.audioService.startRecording({
    timeout: 30000,
    quality: 'high',
    stopOnSilence: false
  });
}
```

## 🎨 Types et Interfaces

### AudioNoteType
```typescript
type AudioNoteType = 'item' | 'support' | 'helper';
```

### AudioNoteState
```typescript
interface AudioNoteState {
  isRecording: boolean;
  isProcessing: boolean;
  hasError: boolean;
  errorMessage?: string;
  canRetry: boolean;
  hasAudio: boolean;
  transcription?: string;
  duration?: number;
  waveformData?: number[];
}
```

### AudioActivityData
```typescript
interface AudioActivityData {
  volume: number;
  frequency: number;
  timestamp: number;
  isActive: boolean;
}
```

## 🌍 Internationalisation (i18n)

Le module utilise une structure i18n simplifiée avec support français et anglais :

```typescript
import { $i18n } from './common/kng-audio';

// Accès direct aux labels
const frenchLabels = $i18n.fr;
const englishLabels = $i18n.en;

// Dans les composants
@Input() locale: string = 'fr'; // 'fr' ou 'en'
```

### Labels disponibles
```typescript
interface AudioLabels {
  // Titres
  title_item: string;           // "Note produit" / "Product Note"
  title_support: string;        // "Message support" / "Support Message"
  title_helper: string;         // "Assistant vocal" / "Voice Assistant"
  
  // Descriptions
  desc_item: string;            // "Ajoutez une note vocale..."
  desc_support: string;         // "Décrivez votre problème..."
  desc_helper: string;          // "Posez votre question..."
  
  // Actions et états
  action_record: string;        // "Dicter" / "Record"
  action_stop: string;          // "Arrêter" / "Stop"
  state_recording: string;      // "Enregistrement..." / "Recording..."
  state_processing: string;     // "Traitement..." / "Processing..."
  
  // Erreurs
  error_permission_denied: string;
  error_hardware_error: string;
  // ... autres erreurs
}
```

## 🔧 Configuration

### Options d'enregistrement
```typescript
interface AudioRecordingOptions {
  timeout?: number;           // 30000ms par défaut
  timeSlice?: number;         // Pour chunks temps réel
  onChunk?: (data) => void;   // Callback chunks
  stopOnSilence?: boolean;    // Arrêt automatique
  quality?: 'low' | 'medium' | 'high';
}
```

### Configuration visualiseur
```typescript
interface AudioVisualizerConfig {
  width?: string;             // '100%' par défaut
  height?: string;            // '100%' par défaut
  showRealtime?: boolean;     // true par défaut
  showWaveform?: boolean;     // false par défaut
  showVolumeMeter?: boolean;  // true par défaut
  showActivity?: boolean;     // true par défaut
  showLabel?: boolean;        // true par défaut
}
```

## 📋 Events

### KngAudioNoteEnhancedComponent

```typescript
// Audio prêt avec transcription
(onAudioReady)="handleAudioReady($event)"
// { src: string, audio: string, note?: string, duration?: number, waveformData?: number[] }

// Erreur d'enregistrement
(onAudioError)="handleAudioError($event)"
// { case: ErrorCase, message: string }

// Changement d'état
(onStateChange)="handleStateChange($event)"
// AudioNoteState

// État de chargement
(onAudioLoading)="handleLoading($event)"
// boolean
```

## 🎯 Exemples d'usage

### Note produit simple
```html
<kng-audio-note-enhanced
  type="item"
  [filename]="'product-' + product.sku"
  [key]="uploadcareKey"
  [locale]="'fr'"
  (onAudioReady)="onProductNote($event)">
</kng-audio-note-enhanced>
```

### Support avec contexte panier
```html
<kng-audio-note-enhanced
  type="support"
  [filename]="'support-ticket'"
  [includeCartContext]="true"
  [key]="uploadcareKey"
  [locale]="currentLocale"
  (onAudioReady)="onSupportMessage($event)">
  
  <div slot="header">
    <h3>🎧 Décrivez votre problème</h3>
    <p>Notre équipe vous répondra rapidement</p>
  </div>
</kng-audio-note-enhanced>
```

### Assistant vocal
```html
<kng-audio-note-enhanced
  type="helper"
  [filename]="'voice-assistant'"
  [key]="uploadcareKey"
  [locale]="currentLocale"
  (onAudioReady)="onAssistantQuery($event)">
  
  <div slot="response">
    <div class="assistant-response">
      <div class="avatar">🤖</div>
      <div class="message" [innerHTML]="assistantResponse"></div>
    </div>
  </div>
</kng-audio-note-enhanced>
```

## 🔍 Debug et Monitoring

Le service intègre des logs détaillés :

```
🎤 Audio stream acquired successfully
🔊 Audio analysis: 15% active segments, max: 0.234, result: true
✅ Recording stopped successfully { duration: 5.2, size: 87456, type: "audio/webm", waveformPoints: 100 }
```

## ⚠️ Gestion d'erreurs

Le module gère automatiquement :
- ✅ **Permissions microphone** refusées
- ✅ **Hardware non disponible**
- ✅ **Navigateur non supporté**
- ✅ **Timeouts** d'enregistrement
- ✅ **Échecs upload**
- ✅ **Retry automatique** avec backoff exponentiel

## 🎨 Customisation CSS

Les composants utilisent les variables CSS du thème :

```css
:root {
  --mdc-theme-primary: #your-color;
  --mdc-theme-secondary: #your-accent;
  --mdc-theme-surface: #your-surface;
}
```

## 📱 Compatibilité

- ✅ **Chrome** 66+ (recommandé)
- ✅ **Firefox** 60+
- ✅ **Safari** 14+
- ✅ **Edge** 79+
- ⚠️ **Mobile** : Limitations iOS Safari pour enregistrement

## 🔄 Migration depuis l'ancien système

```typescript
// ❌ ANCIEN
import { KngAudioRecorderService } from 'shared/kng-audio-recorder.service';
import { KngAudioNoteComponent } from 'shared/kng-audio-note';

// ✅ NOUVEAU
import { KngAudioRecorderEnhancedService, KngAudioNoteEnhancedComponent } from 'common/kng-audio';
```

Le nouveau système est **rétrocompatible** et peut coexister avec l'ancien pendant la migration.
