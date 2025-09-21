import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { KngAudioRecorderEnhancedService } from '../../services/kng-audio-recorder-enhanced.service';
import { AudioLabels, $i18n } from '../../services/kng-audio-i18n.service';
import { RecorderState, ErrorCase, AudioNoteType, AudioNoteState } from '../../interfaces/audio.interfaces';
import { UploadClient } from '@uploadcare/upload-client';

import { AssistantService, CartService, LoaderService } from 'kng2-core';

// Types déjà définis dans interfaces/audio.interfaces.ts

@Component({
  selector: 'kng-audio-note-enhanced',
  templateUrl: './kng-audio-note-enhanced.component.html',
  styleUrls: ['./kng-audio-note-enhanced.component.scss']
})
export class KngAudioNoteEnhancedComponent implements OnInit, OnDestroy {

  // ✅ Configuration
  @Input() type: AudioNoteType = 'item';
  @Input() hasCustomTitle: boolean = false;
  @Input() hasCustomDescription: boolean = false;
  @Input() hasCustomResponse: boolean = false;
  @Input() filename: string = '';
  @Input() key: string = ''; // Uploadcare key
  @Input() amount: number = 0;
  @Input() locale: string = 'fr';

  // ✅ Events
  @Output() onAudioReady = new EventEmitter<{type: AudioNoteType, audioUrl: string, transcription: string, cartUrl?: string}>();
  @Output() onAudioError = new EventEmitter<{case: ErrorCase, message: string}>();
  @Output() onAudioLoading = new EventEmitter<boolean>();
  @Output() onStateChange = new EventEmitter<AudioNoteState>();

  // ✅ État interne
  audioState: AudioNoteState = {
    isRecording: false,
    isProcessing: false,
    hasError: false,
    canRetry: false,
    hasAudio: false
  };

  includeCartInContext: boolean = false;
  latestOrder: any;
  cartUrl: string = '';
  recordingTime: number = 0;
  instanceId: string; // Généré automatiquement

  private subscription = new Subscription();
  private recordingTimer: any;

  // ✅ Labels i18n
  public get $i18n(): AudioLabels {
    return $i18n[this.locale];
  }

  constructor(
    private $assistant: AssistantService,
    private $audioEnhanced: KngAudioRecorderEnhancedService,
    private $loader: LoaderService,
    private $cart: CartService,
    private $route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ Générer ID unique automatiquement
    this.instanceId = `audio-note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ✅ Récupération données pour contexte
    const { orders } = this.$loader.getLatestCoreData();
    this.latestOrder = orders && orders[0] ? orders[0] : null;
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

      // Vérifier support et permissions
      if (!this.$audioEnhanced.isSupported) {
        throw new Error('Enregistrement audio non supporté par ce navigateur');
      }

      const hasPermission = await this.$audioEnhanced.isAudioGranted();
      if (!hasPermission) {
        throw new Error('Permission microphone requise');
      }

      // Démarrer enregistrement
      await this.$audioEnhanced.startRecording({
        timeout: 30000, // 30 secondes max
        quality: 'medium',
        stopOnSilence: false
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

      if (!result.blob) {
        throw new Error('Aucun audio enregistré');
      }

      // Détecter le son
      const hasSound = await this.$audioEnhanced.detectSound({ blob: result.blob });
      if (!hasSound) {
        this.audioState.hasError = true;
        this.audioState.errorMessage = 'Aucun son détecté dans l\'enregistrement';
        this.audioState.canRetry = true;
        this.onAudioLoading.emit(false);
        this.emitStateChange();
        return;
      }

      // Upload vers Uploadcare
      await this.uploadAndProcess(result.blob!, result.base64!, result.duration, result.waveformData);

    } catch (error: any) {
      console.error('❌ Stop recording failed:', error);
      this.audioState.hasError = true;
      this.audioState.errorMessage = `Erreur d'enregistrement: ${error.message}`;
      this.audioState.canRetry = true;
      this.onAudioLoading.emit(false);
      this.emitStateChange();
    }
  }

  private async uploadAndProcess(blob: Blob, base64: string, duration: number, waveformData?: number[]) {
    try {
      // Upload
      const client = new UploadClient({ publicKey: this.key });
      const finalFilename = this.filename || `${this.type}-audio-${Date.now()}`;

      const file = await client.uploadFile(blob, { fileName: finalFilename });
      const audioUrl = file.cdnUrl.replace('https:', '');

      // Mettre à jour l'état
      this.audioState.hasAudio = true;
      this.audioState.duration = duration;
      this.audioState.waveformData = waveformData;

      // Configurer le lecteur audio
      const audioElement = document.querySelector(`#audio-${this.instanceId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.src = audioUrl;
      }

      // Transcription Whisper
      await this.processWithWhisper(base64, audioUrl, duration, waveformData);

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      throw new Error(`Échec de l'upload: ${error.message}`);
    } finally {
      this.onAudioLoading.emit(false);
    }
  }

  private async processWithWhisper(base64: string, audioUrl: string, duration: number, waveformData?: number[]) {
    try {
      const context = await this.generateContext();

      const params = {
        body: {
          audio: base64,
          whisperOnly: true,
          context: context
        },
        q: 'whisper'
      };

      this.audioState.transcription = '';

      this.$assistant.chat(params).subscribe(
        (content) => {
          this.audioState.transcription += content.text;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('❌ Whisper error:', error);
          this.audioState.transcription = '';
          // Émettre quand même l'audio sans transcription
          this.onAudioReady.emit({
            type: this.type,
            audioUrl: audioUrl,
            transcription: '',
            cartUrl: this.includeCartInContext ? this.getCartUrl() : undefined
          });
        },
        () => {
          // Nettoyage final
          this.audioState.transcription = this.audioState.transcription?.trim().replace('**traitement...**', '') || '';

          // Émettre le résultat final
          this.onAudioReady.emit({
            type: this.type,
            audioUrl: audioUrl,
            transcription: this.audioState.transcription,
            cartUrl: this.includeCartInContext ? this.getCartUrl() : undefined
          });

          this.emitStateChange();
        }
      );

    } catch (error: any) {
      console.error('❌ Whisper processing failed:', error);
      // Émettre l'audio sans transcription
      this.onAudioReady.emit({
        type: this.type,
        audioUrl: audioUrl,
        transcription: '',
        cartUrl: this.includeCartInContext ? this.getCartUrl() : undefined
      });
    }
  }

  // ✅ Génération URL panier partagé
  private getCartUrl(): string {
    // TODO: Implémenter génération URL panier partagé
    return `${window.location.origin}/cart/shared/${Date.now()}`;
  }

  // ✅ Génération contexte selon type (identique à la version originale)
  private async generateContext(): Promise<string> {
    let context = '';

    if (this.type === 'support' && this.latestOrder) {
      context += `\n--- Dernière commande ---\n`;
      context += `Numéro: ${this.latestOrder.oid}\n`;
      context += `Date: ${new Date(this.latestOrder.shipping.when).toLocaleDateString()}\n`;
      context += `Montant: ${this.latestOrder.payment.amount} CHF\n`;
      context += `Statut: ${this.latestOrder.status}\n`;
    }

    if (this.includeCartInContext && (this.type === 'helper' || this.type === 'support')) {
      const cartUrl = await this.generateCartUrl();
      if (cartUrl) {
        context += `\n--- Panier client ---\n`;
        context += `Lien: ${cartUrl}\n`;
        this.cartUrl = cartUrl;
      }
    }

    return context;
  }

  private async generateCartUrl(): Promise<string> {
    try {
      const cart = await this.$cart.getShared('current').toPromise();
      const uuid = cart.cid;
      if (!uuid) return '';

      const plan = this.$route.snapshot.queryParamMap.get('plan');
      const view = this.$route.snapshot.queryParamMap.get('view');
      const params = new URLSearchParams();
      if (plan) params.set('plan', plan);
      if (view) params.set('view', view);

      const store = this.$route.snapshot.paramMap.get('store');
      const baseUrl = `${window.location.protocol}//${window.location.host}/store/${store}/home/cart/${uuid}`;

      return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    } catch (error) {
      console.error('Erreur génération URL panier:', error);
      return '';
    }
  }

  // ✅ Méthodes utilitaires
  onToggleCartInclude() {
    this.includeCartInContext = !this.includeCartInContext;
  }

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

  clearAudio() {
    this.audioState.hasAudio = false;
    this.audioState.transcription = undefined;
    this.audioState.duration = undefined;
    this.audioState.waveformData = undefined;
    this.cartUrl = '';

    const audioElement = document.querySelector(`#audio-${this.instanceId}`) as HTMLAudioElement;
    if (audioElement) {
      audioElement.src = '';
    }

    this.onAudioReady.emit({
      type: this.type,
      audioUrl: '',
      transcription: '',
      cartUrl: undefined
    });

    this.emitStateChange();
  }

  // ✅ Gestionnaires audio HTML
  onAudioLoaded(event: Event) {
    // Audio chargé avec succès
  }

  onAudioTimeUpdate(event: Event) {
    // Mise à jour position de lecture pour visualiseur
    const audio = event.target as HTMLAudioElement;
    if (audio.duration && this.audioState.waveformData) {
      const position = audio.currentTime / audio.duration;
      // Mettre à jour le visualiseur si nécessaire
    }
  }

  // ✅ Helpers d'affichage avec i18n local
  getNoteTitle(): string {
    switch (this.type) {
      case 'item': return this.$i18n.title_item;
      case 'support': return this.$i18n.title_support;
      case 'helper': return this.$i18n.title_helper;
      default: return this.$i18n.title_item;
    }
  }

  getNoteDescription(): string {
    switch (this.type) {
      case 'item': return this.$i18n.desc_item;
      case 'support': return this.$i18n.desc_support;
      case 'helper': return this.$i18n.desc_helper;
      default: return this.$i18n.desc_item;
    }
  }

  getLoadingMessage(): string {
    if (this.audioState.isProcessing) {
      return this.$i18n.state_processing;
    }
    return this.$i18n.message_processing;
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
