import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Subscription } from 'rxjs';
import { KngAudioRecorderEnhancedService } from '../../services/kng-audio-recorder-enhanced.service';
import { AudioLabels, $i18n } from '../../services/kng-audio-i18n.service';
import { RecorderState, ErrorCase, AudioNoteType, AudioNoteState } from '../../interfaces/audio.interfaces';
import { KngAssistantAiService } from 'src/app/kng-assistant-ai.service';
import { CommonModule } from '@angular/common';
import { KngAudioVisualizerComponent } from '../kng-audio-visualizer.component';
import { TranscriptionAccumulator } from '../../services/kng-audio-transcription-accumulator';


// Types déjà définis dans interfaces/audio.interfaces.ts

@Component({
  selector: 'kng-audio-note-enhanced',
  templateUrl: './kng-audio-note-enhanced.component.html',
  styleUrls: ['./kng-audio-note-enhanced.component.scss'],
  standalone: true,
  imports: [CommonModule, KngAudioVisualizerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngAudioNoteEnhancedComponent implements OnInit, OnDestroy {

  // ✅ Configuration
  @Input() type: AudioNoteType = 'item';
  @Input() hasCustomTitle: boolean = false;
  @Input() hasCustomDescription: boolean = false;
  @Input() hasCustomResponse: boolean = false;
  @Input() filename: string = '';
  @Input() disabled: boolean = false;
  // Uploadcare supprimé - utilise maintenant /api/transcribe
  @Input() amount: number = 0;
  @Input() locale: string = 'fr';
  @Input() compact: boolean = false;
  @Input() displayTranscription: boolean = true;

  // ✅ Events
  @Output() onAudioReady = new EventEmitter<{type: AudioNoteType, audioUrl: string, transcription: string, stream: boolean}>();
  @Output() onAudioError = new EventEmitter<{case: ErrorCase, message: string}>();
  @Output() onAudioLoading = new EventEmitter<boolean>();
  @Output() onStateChange = new EventEmitter<AudioNoteState>();

  // ✅ État interne (simplifié - pas de hasAudio car pas de persistance)
  audioState: AudioNoteState = {
    isRecording: false,
    isProcessing: false,
    hasError: false,
    canRetry: false,
    hasAudio: false, // Toujours false car pas de persistance
    started: false,
    chunkIndex: 0
  };

  audioTimeout: number = 60*5;

  // ✅ État transcription
  private isTranscribing = false;
  private transcriptionAccumulator = new TranscriptionAccumulator();

  recordingTime: number = 0;
  instanceId: string; // Généré automatiquement

  private subscription = new Subscription();
  private recordingTimer: any;

  // ✅ Labels i18n
  public get $i18n(): AudioLabels {
    return $i18n[this.locale];
  }

  constructor(
    private $assistant: KngAssistantAiService,
    private $audioEnhanced: KngAudioRecorderEnhancedService,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ Générer ID unique automatiquement
    this.instanceId = `audio-note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ✅ Getter pour l'état processing complet (processing + transcription)
  get isProcessingOrTranscribing(): boolean {
    return this.audioState.isProcessing || this.isTranscribing;
  }

  ngOnInit() {
    this.setupAudioServiceListeners();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  }

  private setupAudioServiceListeners() {
    // ✅ États du recorder
    this.subscription.add(
      this.$audioEnhanced.recorderState.subscribe(state => {
        this.audioState.isRecording = state === RecorderState.RECORDING;
        this.audioState.isProcessing = state === RecorderState.PROCESSING;

        if (state === RecorderState.RECORDING) {
          this.startRecordingTimer();
        } else {
          this.stopRecordingTimer();
        }

        // ✅ CORRECTION : Gestion auto-stop par détection de silence
        if (state === RecorderState.SILENCE) {
          console.log('🔇 Silence detected, stopping recording');
          this.stopRecording();
        }

        this.emitStateChange();
        this.cdr.detectChanges();
      })
    );

    // ✅ Erreurs
    this.subscription.add(
      this.$audioEnhanced.recorderError.subscribe(error => {
        this.audioState.hasError = true;
        this.audioState.errorMessage = error.message;
        this.audioState.canRetry = error.retry || false;

        this.onAudioError.emit({ case: error.case, message: error.message });
        this.emitStateChange();
        this.cdr.detectChanges();
      })
    );
  }

  private startRecordingTimer() {
    this.recordingTime = 0;
    this.recordingTimer = setInterval(() => {
      this.recordingTime++;
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  private emitStateChange() {
    this.onStateChange.emit({ ...this.audioState });
  }

  // ✅ API publique
  async toggleRecording() {
    if (this.audioState.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      this.dismissError();
      this.audioState.started = true;

      // ✅ Réinitialiser la transcription accumulée
      this.transcriptionAccumulator.reset();
      this.audioState.transcription = '';
      this.audioState.chunkIndex = 0;

      // Vérifier support et permissions
      if (!this.$audioEnhanced.isSupported) {
        throw new Error('Enregistrement audio non supporté par ce navigateur');
      }

      // Démarrer enregistrement
      await this.$audioEnhanced.startRecording({
        timeout: this.audioTimeout * 1000,
        quality: 'medium',
        stopOnSilence: true,
        timeSlice: 16000, // 8 secondes
        onChunk: async (data) => {
          await this.processChunk(data.typedBlob, this.audioState.chunkIndex);
          this.audioState.chunkIndex++;
        }
      });

    } catch (error: any) {
      console.error('❌ Start recording failed:', error);
      this.audioState.hasError = true;
      this.audioState.errorMessage = error.message;
      this.audioState.canRetry = true;
      this.emitStateChange();
    }
  }

  private async stopRecording() {
    try {
      this.onAudioLoading.emit(true);

      const result = await this.$audioEnhanced.stopRecording();

      // ✅ MODE CHUNK : En mode chunk, tous les chunks ont déjà été traités via processChunk()
      // Le blob peut être undefined car les données ont été streamées
      if (!result.blob) {
        // En mode chunk, c'est normal - tous les chunks ont déjà été transcrits
        this.isTranscribing = false;

        // ✅ Émettre le résultat final avec la transcription accumulée
        const finalTranscription = this.transcriptionAccumulator.getFullText();
        this.audioState.transcription = finalTranscription;

        // this.onAudioReady.emit({
        //   type: this.type,
        //   audioUrl: '',
        //   transcription: finalTranscription,
        //   stream: false
        // });

        this.onAudioLoading.emit(false);
        this.emitStateChange();
        this.cdr.detectChanges();
        return;
      }

      // ✅ MODE NORMAL : Si blob disponible, traiter normalement (fallback)
      const hasSound = await this.$audioEnhanced.detectSound({ blob: result.blob });
      if (!hasSound) {
        this.audioState.hasError = true;
        this.audioState.errorMessage = 'Aucun son détecté dans l\'enregistrement';
        this.audioState.canRetry = true;
        this.onAudioLoading.emit(false);
        this.emitStateChange();
        return;
      }

      // ✅ Transcription complète en mode normal (fallback si pas de chunks)
      await this.processWithWhisper(result.blob, '', result.duration, result.waveformData);

    } catch (error: any) {
      console.error('❌ Stop recording failed:', error);
      this.audioState.hasError = true;
      this.audioState.errorMessage = `Erreur d'enregistrement: ${error.message}`;
      this.audioState.canRetry = true;
      this.isTranscribing = false;
      this.onAudioLoading.emit(false);
      this.emitStateChange();
    }
  }

  private async processChunk(chunk: Blob, chunkIndex: number) {
    try {
      // Détecter le son
      const hasSound = await this.$audioEnhanced.detectSound({ blob: chunk });
      if (!hasSound && chunkIndex == 0) {
        this.audioState.hasError = true;
        this.audioState.errorMessage = 'Aucun son détecté dans l\'enregistrement';
        this.audioState.canRetry = true;
        this.onAudioLoading.emit(false);
        this.emitStateChange();
        return;
      }

      // ✅ Transcription directe sans upload
      await this.processWithWhisper(chunk!);

    } catch (error: any) {
      console.error('❌ Stop recording failed:', error);
      this.audioState.hasError = true;
      this.audioState.errorMessage = `Erreur d'enregistrement: ${error.message}`;
      this.audioState.canRetry = true;
      this.onAudioLoading.emit(false);
      this.emitStateChange();
    }
  }

  // ✅ uploadAndProcess supprimé - transcription directe sans persistance

  private async processWithWhisper(audioBlob: Blob, audioUrl?: string, duration?: number, waveformData?: number[]) {
    try {
      // ✅ Démarrer l'état transcription
      this.isTranscribing = true;
      this.cdr.detectChanges();

      // ✅ Obtenir le prompt pour Whisper (dernière phrase comme contexte)
      const promptForWhisper = this.transcriptionAccumulator.getPromptForWhisper();

      // ✅ Utiliser whisper du service assistant directement avec le blob
      const transcription = await this.$assistant.whisper({
        blob: audioBlob,
        type: this.type,
        silent: false,
        previousText: promptForWhisper
      });

      // ✅ Ajouter la nouvelle transcription (1-2 phrases) à l'accumulateur
      if (transcription && transcription.trim()) {
        this.transcriptionAccumulator.addTranscription(transcription.trim());
        this.audioState.transcription = this.transcriptionAccumulator.getFullText();
      }

      this.isTranscribing = false;

      // Émettre le résultat final
      this.onAudioReady.emit({
        type: this.type,
        audioUrl: '', // Pas d'URL persistante nécessaire
        transcription: this.audioState.transcription,
        stream: !!this.audioState.isRecording
      });

      this.emitStateChange();
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error('❌ Whisper processing failed:', error);

      // ✅ Arrêter l'état transcription en cas d'erreur
      this.isTranscribing = false;
      this.audioState.transcription = '';

      // Émettre l'audio sans transcription
      // this.onAudioReady.emit({
      //   type: this.type,
      //   audioUrl: '', // Pas d'URL persistante nécessaire
      //   transcription: '',
      //   stream: false
      // });

      this.cdr.detectChanges();
    }
  }

  // ✅ Méthodes panier supprimées - pas nécessaires pour transcription

  // ✅ Génération contexte simplifié (services externes supprimés)
  private async generateContext(): Promise<string> {
    // Context basique selon le type
    switch (this.type) {
      case 'support':
        return 'Demande de support client';
      case 'helper':
        return 'Assistance générale';
      case 'item':
        return 'Note sur un produit';
      default:
        return '';
    }
  }

  // ✅ Méthodes utilitaires (panier supprimé)

  onRetry() {
    this.dismissError();
    this.startRecording();
  }

  dismissError() {
    this.audioState.hasError = false;
    this.audioState.errorMessage = undefined;
    this.audioState.canRetry = false;
    this.emitStateChange();
  }

  // ✅ Méthodes audio supprimées - pas de persistance nécessaire

  // ✅ Helpers d'affichage avec i18n local
  getNoteTitle(): string {
    switch (this.type) {
      case 'prompt': return this.$i18n.title_prompt;
      case 'support': return this.$i18n.title_support;
      case 'helper': return this.$i18n.title_helper;
      default: return this.$i18n.title_prompt;
    }
  }

  getNoteDescription(): string {
    switch (this.type) {
      case 'prompt': return this.$i18n.desc_prompt;
      case 'support': return this.$i18n.desc_support;
      case 'helper': return this.$i18n.desc_helper;
      default: return this.$i18n.desc_prompt;
    }
  }

  getLoadingMessage(): string {
    if (this.audioState.isProcessing) {
      return this.$i18n.state_processing;
    }
    if (this.isTranscribing) {
      return this.$i18n.state_transcribing;
    }
    return this.$i18n.message_processing;
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
