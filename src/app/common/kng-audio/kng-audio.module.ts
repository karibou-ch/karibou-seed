import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ Services
import { KngAudioRecorderEnhancedService } from './services/kng-audio-recorder-enhanced.service';
// KngAudioI18nService supprimé - utilise maintenant l'export i18n direct

// ✅ Composants
import { KngAudioVisualizerComponent } from './components/kng-audio-visualizer.component';
import { KngAudioNoteEnhancedComponent } from './components/kng-audio-note-enhanced/kng-audio-note-enhanced.component';
import { KngAudioNoteCompactComponent } from './components/kng-audio-note-compact/kng-audio-note-compact.component';

@NgModule({
  declarations: [
    // ✅ Composants du module
    KngAudioVisualizerComponent,
    KngAudioNoteEnhancedComponent,
    KngAudioNoteCompactComponent
  ],
  imports: [
    // ✅ Modules requis
    CommonModule,
    FormsModule
  ],
  providers: [
    // ✅ Services du module
    KngAudioRecorderEnhancedService
  ],
  exports: [
    // ✅ Exports publics
    KngAudioVisualizerComponent,
    KngAudioNoteEnhancedComponent,
    KngAudioNoteCompactComponent
  ]
})
export class KngAudioModule { }
