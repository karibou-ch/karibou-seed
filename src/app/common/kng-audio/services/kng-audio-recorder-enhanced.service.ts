import { EventEmitter, Injectable } from '@angular/core';
import { RecordRTCPromisesHandler, StereoAudioRecorder } from "recordrtc";
import {
  RecordedAudioOutput,
  ErrorCase,
  RecorderState,
  AudioActivityData,
  AudioRecordingOptions
} from '../interfaces/audio.interfaces';
import { $i18n, AudioLabels } from './kng-audio-i18n.service';

/**
 * Service d'enregistrement audio avancé avec gestion des permissions et compatibilité multi-navigateurs
 *
 * @description
 * Service complet pour l'enregistrement audio avec:
 * - Gestion intelligente des permissions microphone
 * - Détection d'activité audio temps réel
 * - Support multi-navigateurs et multi-plateformes
 * - Gestion d'erreurs fine avec instructions utilisateur
 * - Génération de données waveform pour visualisation
 *
 * @compatibility
 * ✅ **Desktop:**
 * - Chrome 47+ (Windows/Mac/Linux)
 * - Firefox 55+ (Windows/Mac/Linux)
 * - Safari 11+ (macOS)
 * - Edge 79+ (Windows/Mac)
 *
 * ✅ **Mobile:**
 * - Chrome Mobile 47+ (Android/iOS)
 * - Safari Mobile 11+ (iOS)
 * - Samsung Internet 5.0+ (Android)
 * - Firefox Mobile 68+ (Android)
 *
 * ⚠️ **Limitations connues:**
 * - Android Browser natif: navigator.permissions non supporté (fallback implémenté)
 * - iOS Safari < 11: getUserMedia non supporté
 * - WebView apps: permissions peuvent être limitées selon l'app
 *
 * @example
 * ```typescript
 * // Vérification support
 * if (!this.$audio.isSupported) {
 *   console.error('Navigateur non supporté');
 *   return;
 * }
 *
 * // Enregistrement simple
 * try {
 *   await this.$audio.startRecording({
 *     timeout: 30000,
 *     quality: 'medium'
 *   });
 *
 *   const result = await this.$audio.stopRecording();
 *   console.log('Audio enregistré:', result.duration, 'secondes');
 * } catch (error) {
 *   console.error('Erreur enregistrement:', error);
 * }
 * ```
 *
 * @author Karibou Team
 * @since 2024
 * @version 2.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class KngAudioRecorderEnhancedService {

  // ✅ AMÉLIORATION : Events plus détaillés
  public recorderError = new EventEmitter<{case: ErrorCase, message: string, retry?: boolean}>();
  public recorderState = new EventEmitter<RecorderState>();
  public audioActivity = new EventEmitter<AudioActivityData>();

  // ✅ AMÉLIORATION : États internes plus robustes
  private _recorderState: RecorderState = RecorderState.STOPPED;
  private _recordTime = 0;
  private _avgVolume = 0;
  private _recordTimeout: any = 0;
  private _retryCount = 0;
  private _maxRetries = 3;

  // ✅ AMÉLIORATION : Gestion hardware
  private stream: MediaStream | null = null;
  private recorder: RecordRTCPromisesHandler | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;

  // ✅ MERGE: Ajout des champs pour gestion du mode chunk depuis to-migrate-here
  private _lastOptions?: AudioRecordingOptions;
  private _streamedBytes = 0;
  private _silenceDetectionActive = false; // Flag pour arrêter la détection de silence

  // ✅ AMÉLIORATION : Configuration
  private config = {
    sampleRate: 44100,
    channelCount: 1,
    bitRate: 128000,
    timeout: 15000,
    silenceTimeout: 3000,
    volumeThreshold: 0.01,
    silenceThreshold: 0.1  // ✅ CORRECTION : Seuil plus élevé (0.05 au lieu de 0.01)
  };

  // ✅ NOUVEAU : Support i18n
  private locale: 'fr' | 'en' | string = 'fr';
  private get labels(): AudioLabels {
    return $i18n[this.locale];
  }

  constructor() {
    this._recorderState = RecorderState.STOPPED;
    // Détection automatique de la langue
    this.locale = (navigator.language.startsWith('fr')) ? 'fr' : 'en';
  }

  /**
   * Change la langue des messages d'erreur et instructions
   *
   * @param {string} locale - Langue: 'fr' ou 'en'
   *
   * @example
   * ```typescript
   * this.$audio.setLocale('en');
   * ```
   */
  setLocale(locale: 'fr' | 'en' | string): void {
    this.locale = locale;
  }

  /**
   * Ajuste le seuil de détection du silence
   *
   * @param threshold - Nouveau seuil (0.0 à 1.0)
   * @param timeout - Nouveau timeout en millisecondes (optionnel)
   *
   * @description
   * Permet d'ajuster dynamiquement la sensibilité de la détection de silence.
   * Valeurs recommandées :
   * - 0.01 : Très sensible (détecte le moindre bruit de fond)
   * - 0.05 : Sensibilité normale (recommandé)
   * - 0.1 : Moins sensible (nécessite un silence plus marqué)
   *
   * @example
   * ```typescript
   * // Rendre la détection moins sensible
   * audioService.configureSilenceDetection(0.1, 5000);
   * ```
   */
  configureSilenceDetection(threshold: number, timeout?: number): void {
    if (threshold < 0 || threshold > 1) {
      console.warn('⚠️ Silence threshold should be between 0 and 1');
      return;
    }

    this.config.silenceThreshold = threshold;
    if (timeout !== undefined) {
      this.config.silenceTimeout = timeout;
    }

    console.log(`🔇 Silence detection configured - Threshold: ${threshold}, Timeout: ${this.config.silenceTimeout}ms`);
  }

  /**
   * Obtient les statistiques de volume actuelles
   *
   * @returns Objet avec les statistiques de volume ou null si pas d'enregistrement
   *
   * @description
   * Utile pour déboguer la détection de silence et ajuster les seuils.
   *
   * @example
   * ```typescript
   * const stats = audioService.getVolumeStats();
   * if (stats) {
   *   console.log(`Volume: ${stats.average}, Max: ${stats.max}, Silence: ${stats.isSilent}`);
   * }
   * ```
   */
  getVolumeStats(): { average: number; max: number; min: number; isSilent: boolean } | null {
    if (!this.analyser || this.state !== RecorderState.RECORDING) {
      return null;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    let max = 0;
    let min = 255;

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      sum += value;
      max = Math.max(max, value);
      min = Math.min(min, value);
    }

    const average = sum / bufferLength / 255;
    const normalizedMax = max / 255;
    const normalizedMin = min / 255;
    const isSilent = average < this.config.silenceThreshold;

    return {
      average: parseFloat(average.toFixed(4)),
      max: parseFloat(normalizedMax.toFixed(4)),
      min: parseFloat(normalizedMin.toFixed(4)),
      isSilent
    };
  }

  /**
   * État actuel de l'enregistreur
   * @returns {RecorderState} État: RECORDING, STOPPED, PAUSED, SILENCE, PROCESSING
   */
  get state(): RecorderState {
    return this._recorderState;
  }

  /**
   * Temps d'enregistrement en cours en secondes
   * @returns {number} Durée en secondes depuis le début de l'enregistrement
   */
  get recordTime(): number {
    if (!this._recordTime) {
      return 0;
    }
    return parseFloat(((Date.now() - this._recordTime) / 1000).toFixed(2));
  }

  /**
   * Vérifie si le navigateur supporte l'enregistrement audio
   *
   * @description
   * Teste la disponibilité des APIs requises:
   * - navigator.mediaDevices.getUserMedia (accès microphone)
   * - MediaRecorder (enregistrement audio)
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Chrome Mobile, Safari Mobile, Samsung Internet 5.0+
   * ❌ Internet Explorer (non supporté)
   * ❌ iOS Safari < 11 (non supporté)
   *
   * @returns {boolean} true si le navigateur supporte l'enregistrement audio
   *
   * @example
   * ```typescript
   * if (!this.$audio.isSupported) {
   *   this.showError('Votre navigateur ne supporte pas l\'enregistrement audio');
   *   return;
   * }
   * ```
   */
  get isSupported(): boolean {
    return !!(navigator.mediaDevices &&
             navigator.mediaDevices.getUserMedia &&
             (window as any).MediaRecorder);
  }

  /**
   * Ferme proprement le flux audio et libère les ressources
   *
   * @description
   * Nettoie toutes les ressources audio:
   * - Arrête l'enregistrement en cours
   * - Ferme le contexte audio
   * - Libère les tracks du stream
   * - Annule les animations en cours
   *
   * @compatibility
   * ✅ Tous navigateurs supportés
   *
   * @example
   * ```typescript
   * // Nettoyage manuel (optionnel, fait automatiquement)
   * await this.$audio.closeAudioStream();
   * ```
   *
   * @note MERGE: Améliorations iOS depuis to-migrate-here (async + meilleure gestion tracks)
   */
  async closeAudioStream(): Promise<void> {
    try {
      // Stop animation frame
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      // Stop recorder
      if (this.recorder) {
        try {
          await this.recorder.stopRecording();
        } catch (err) {
          console.warn('⚠️ Recorder stop error (ignored):', err);
        }
        this.recorder = null;
      }

      // ✅ MERGE iOS: Arrêter TOUS les tracks du stream, même si !active
      if (this.stream) {
        const tracks = this.stream.getTracks();
        tracks.forEach(track => {
          // Forcer l'arrêt même si déjà stopped
          if (track.readyState !== 'ended') {
            track.stop();
            console.log('🎤 Audio track stopped:', track.kind, track.readyState);
          }
        });
        this.stream = null;
      }

      // ✅ MERGE iOS: Await close() pour garantir fermeture complète
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          await this.audioContext.close();
          console.log('🔊 AudioContext closed successfully');
        } catch (err) {
          console.warn('⚠️ AudioContext close error (ignored):', err);
        }
        this.audioContext = null;
      }

      this.analyser = null;
    } catch (error) {
      console.error('❌ Error closing audio stream:', error);
    }
  }

  // ✅ AMÉLIORATION : Détection volume temps réel avec visualisation
  private startVolumeDetection(): void {
    if (!this.audioContext || !this.analyser || !this.stream) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detectVolume = () => {
      if (this.state !== RecorderState.RECORDING) {
        return;
      }

      this.analyser!.getByteFrequencyData(dataArray);

      // Calculate volume
      let sum = 0;
      let max = 0;
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = dataArray[i] / 255;
        sum += amplitude * amplitude;
        max = Math.max(max, amplitude);
      }

      const volume = Math.sqrt(sum / bufferLength);
      const frequency = max;

      this._avgVolume = (volume + this._avgVolume) / 2;

      // ✅ NOUVEAU : Émission activité audio pour visualisation
      const activityData: AudioActivityData = {
        volume,
        frequency,
        timestamp: Date.now(),
        isActive: volume > this.config.volumeThreshold
      };

      this.audioActivity.emit(activityData);

      // Continue monitoring
      this.animationFrame = requestAnimationFrame(detectVolume);
    };

    detectVolume();
  }

  /**
   * Détecte la présence de son dans un fichier audio
   *
   * @description
   * Analyse un fichier audio pour détecter la présence de contenu sonore.
   * Utilise une analyse par segments pour éviter les faux positifs.
   *
   * @param {Object} content - Contenu audio à analyser
   * @param {Blob} [content.blob] - Blob audio à analyser
   * @param {string} [content.url] - URL du fichier audio à analyser
   *
   * @returns {Promise<boolean>} true si du son est détecté
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Tous navigateurs mobiles supportés
   *
   * @example
   * ```typescript
   * const hasSound = await this.$audio.detectSound({blob: audioBlob});
   * if (!hasSound) {
   *   console.log('Aucun son détecté dans l\'enregistrement');
   * }
   * ```
   *
   * @note MERGE: Améliorations depuis to-migrate-here (meilleure gestion des segments + finally)
   */
  async detectSound(content: {blob?: Blob, url?: string}): Promise<boolean> {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();

    try {
      let arrayBuffer: ArrayBuffer;

      if (content.url) {
        const response = await fetch(content.url);
        arrayBuffer = await response.arrayBuffer();
      } else if (content.blob) {
        arrayBuffer = await content.blob.arrayBuffer();
      } else {
        return false;
      }

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const floats32 = audioBuffer.getChannelData(0);

      // ⚠️ Audio vide → pas de son
      if (!floats32.length) {
        console.log('🔊 Audio analysis: empty buffer, result: false');
        return false;
      }

      let maxVolume = 0;
      let activeSegments = 0;

      // ✅ MERGE: Toujours un segmentSize >= 1
      const targetSegments = 100;
      const segmentSize = Math.max(1, Math.floor(floats32.length / targetSegments));

      let segmentsCount = 0;

      for (let i = 0; i < floats32.length; i += segmentSize) {
        const start = i;
        const end = Math.min(i + segmentSize, floats32.length);
        const effectiveSize = end - start;

        if (effectiveSize <= 0) {
          continue;
        }

        let segmentSum = 0;

        for (let j = start; j < end; j++) {
          const amplitude = Math.abs(floats32[j]);
          segmentSum += amplitude * amplitude;
          maxVolume = Math.max(maxVolume, amplitude);
        }

        const segmentVolume = Math.sqrt(segmentSum / effectiveSize);

        if (segmentVolume > this.config.volumeThreshold) {
          activeSegments++;
        }

        segmentsCount++;
      }

      const ratio = segmentsCount > 0 ? activeSegments / segmentsCount : 0;
      const isActive = ratio > 0.05 && maxVolume > this.config.volumeThreshold;

      console.log(
        `🔊 Audio analysis: ${Math.round(ratio * 100)}% active segments, ` +
        `max: ${maxVolume.toFixed(3)}, result: ${isActive}`
      );

      return isActive;

    } catch (error) {
      console.error('❌ Error detecting sound:', error);
      return false;
    } finally {
      // ✅ MERGE: Toujours fermer l'AudioContext
      try {
        await audioCtx.close();
        console.log('🔊 detectSound AudioContext closed');
      } catch (err) {
        console.warn('⚠️ detectSound AudioContext close error:', err);
      }
    }
  }

  /**
   * @deprecated Utiliser isSupported à la place
   *
   * @description
   * ⚠️ DEPRECATED: Cette méthode est un lazy check qui ne vérifie pas réellement les permissions.
   * Utiliser `isSupported` pour vérifier le support navigateur.
   * Les permissions sont demandées automatiquement lors de `startRecording()`.
   *
   * @returns {Promise<boolean>} Retourne la valeur de isSupported
   *
   * @see {@link isSupported} Pour vérifier le support navigateur
   * @see {@link getPermissionState} Pour vérifier l'état des permissions (debug)
   */
  async isAudioGranted(): Promise<boolean> {
    console.warn('⚠️ isAudioGranted is deprecated - use isSupported instead. Permission will be requested on startRecording()');
    return this.isSupported;
  }

  /**
   * Obtient l'état actuel des permissions microphone (pour debug)
   *
   * @description
   * Vérifie l'état des permissions sans déclencher de demande.
   * ⚠️ ATTENTION: navigator.permissions pas supporté sur Android Browser natif.
   *
   * @returns {Promise<string>} État: 'granted', 'denied', 'prompt', 'unknown'
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 16+, Edge 79+
   * ❌ Android Browser natif (retourne 'prompt')
   * ❌ iOS Safari < 16 (retourne 'prompt')
   *
   * @example
   * ```typescript
   * const state = await this.$audio.getPermissionState();
   * console.log('Permission state:', state);
   * ```
   */
  async getPermissionState(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    if (!this.isSupported) {
      return 'unknown';
    }

    try {
      // ⚠️ ATTENTION : navigator.permissions pas supporté sur Android Browser
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state as 'granted' | 'denied' | 'prompt';
    } catch {
      // Fallback: assume permission needed (safer approach)
      return 'prompt';
    }
  }

  /**
   * Demande explicitement la permission microphone après annulation
   *
   * @description
   * Tente d'obtenir la permission microphone de façon explicite.
   * Utile après une annulation utilisateur (Escape) ou un refus initial.
   *
   * @returns {Promise<Object>} Résultat avec success boolean et error optionnel
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Chrome Mobile, Safari Mobile, Samsung Internet 5.0+
   * ⚠️ Certains navigateurs nécessitent un rechargement de page après refus
   *
   * @example
   * ```typescript
   * const result = await this.$audio.requestPermissionExplicitly();
   * if (result.success) {
   *   console.log('Permission accordée');
   * } else {
   *   console.error('Permission refusée:', result.error);
   * }
   * ```
   */
  async requestPermissionExplicitly(): Promise<{success: boolean, error?: string}> {
    if (!this.isSupported) {
      return {
        success: false,
        error: this.labels.system_navigator_not_supported
      };
    }

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStream.getTracks().forEach(track => track.stop());
      return {success: true};
    } catch (err: any) {
      return {
        success: false,
        error: this.getDetailedErrorMessage(err)
      };
    }
  }

  /**
   * Obtient le flux audio du microphone avec gestion d'erreurs avancée
   *
   * @description
   * Acquiert l'accès au microphone et configure le contexte audio.
   * Gère automatiquement les permissions et fournit des messages d'erreur détaillés.
   *
   * @returns {Promise<MediaStream>} Flux audio du microphone
   * @throws {Error} Erreur avec message détaillé selon le type de problème
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Chrome Mobile, Safari Mobile, Samsung Internet 5.0+
   * ⚠️ iOS Safari nécessite interaction utilisateur (geste tactile/clic)
   *
   * @example
   * ```typescript
   * try {
   *   const stream = await this.$audio.getAudioStream();
   *   console.log('Microphone accessible');
   * } catch (error) {
   *   console.error('Erreur microphone:', error.message);
   * }
   * ```
   */
  async getAudioStream(): Promise<MediaStream> {
    if (this.stream && this.stream.active) {
      return this.stream;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // ✅ AMÉLIORATION : Setup audio context pour monitoring
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      console.log('🎤 Audio stream acquired successfully');
      return this.stream;

    } catch (err: any) {
      console.error('❌ Error accessing audio stream:', err);

      const errorDetails = this.getDetailedErrorInfo(err);
      this.recorderError.emit(errorDetails);
      throw err;
    }
  }

  // ✅ NOUVEAU : Gestion d'erreurs fine avec instructions utilisateur
  private getDetailedErrorInfo(err: any): {case: ErrorCase, message: string, retry: boolean, instructions?: string} {
    let errorCase = ErrorCase.HARDWARE_ERROR;
    let message = this.labels.error_hardware_error;
    let retry = true;
    let instructions = '';

    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        errorCase = ErrorCase.USER_CONSENT_FAILED;
        message = this.labels.error_permission_denied;
        retry = true; // ✅ CORRECTION : Permettre retry même pour permission denied
        instructions = this.getPermissionInstructions();
        break;

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        errorCase = ErrorCase.HARDWARE_ERROR;
        message = this.labels.error_microphone_not_found;
        retry = false;
        instructions = this.labels.instructions_microphone_connect;
        break;

      case 'NotReadableError':
      case 'TrackStartError':
        errorCase = ErrorCase.HARDWARE_ERROR;
        message = this.labels.error_microphone_occupied;
        retry = true;
        instructions = this.labels.instructions_microphone_close_apps;
        break;

      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        errorCase = ErrorCase.HARDWARE_ERROR;
        message = this.labels.error_microphone_config;
        retry = false;
        instructions = this.labels.instructions_microphone_config;
        break;

      case 'TypeError':
        errorCase = ErrorCase.BROWSER_NOT_SUPPORTED;
        message = this.labels.error_technical;
        retry = false;
        instructions = this.labels.instructions_technical_support;
        break;

      default:
        errorCase = ErrorCase.HARDWARE_ERROR;
        message = this.labels.error_unknown;
        retry = true;
        instructions = this.labels.instructions_retry_later;
        break;
    }

    return { case: errorCase, message, retry, instructions };
  }

  /**
   * Génère des instructions spécifiques selon le navigateur pour autoriser le microphone
   *
   * @private
   * @description
   * Détecte le navigateur utilisé et retourne des instructions précises
   * pour autoriser l'accès au microphone dans les paramètres.
   *
   * @returns {string} Instructions détaillées selon le navigateur
   *
   * @compatibility
   * ✅ Instructions pour: Chrome, Firefox, Safari, Edge, autres
   */
  private getPermissionInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      return this.labels.instructions_chrome;
    } else if (userAgent.includes('firefox')) {
      return this.labels.instructions_firefox;
    } else if (userAgent.includes('safari')) {
      return this.labels.instructions_safari;
    } else if (userAgent.includes('edge')) {
      return this.labels.instructions_edge;
    } else if (userAgent.includes('samsungbrowser')) {
      return this.labels.instructions_samsung;
    } else {
      return this.labels.instructions_generic;
    }
  }

  // ✅ NOUVEAU : Message d'erreur simple pour requestPermissionExplicitly
  private getDetailedErrorMessage(err: any): string {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return this.labels.system_permission_retry;
      case 'NotFoundError':
        return this.labels.error_microphone_not_found;
      case 'NotReadableError':
        return this.labels.error_microphone_occupied;
      default:
        return this.labels.error_hardware_error;
    }
  }

  /**
   * Démarre l'enregistrement audio avec options avancées
   *
   * @description
   * Lance l'enregistrement audio avec configuration personnalisable:
   * - Qualité audio (low/medium/high)
   * - Timeout automatique
   * - Détection de silence
   * - Streaming temps réel par chunks
   *
   * @param {AudioRecordingOptions} [options={}] Options d'enregistrement
   * @param {number} [options.timeout] Timeout en ms (défaut: 15000)
   * @param {number} [options.timeSlice] Intervalle chunks en ms
   * @param {Function} [options.onChunk] Callback pour chunks temps réel
   * @param {boolean} [options.stopOnSilence] Arrêt automatique sur silence
   * @param {'low'|'medium'|'high'} [options.quality='medium'] Qualité audio
   *
   * @returns {Promise<void>} Promise résolue quand l'enregistrement démarre
   * @throws {Error} Erreur si enregistrement impossible
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Chrome Mobile, Safari Mobile, Samsung Internet 5.0+
   * ⚠️ iOS Safari: nécessite interaction utilisateur pour démarrer
   *
   * @example
   * ```typescript
   * // Enregistrement simple
   * await this.$audio.startRecording();
   *
   * // Enregistrement avec options
   * await this.$audio.startRecording({
   *   timeout: 30000,
   *   quality: 'high',
   *   stopOnSilence: true
   * });
   *
   * // Streaming temps réel
   * await this.$audio.startRecording({
   *   timeSlice: 1000,
   *   onChunk: (data) => {
   *     console.log('Chunk reçu:', data.typedBlob.size, 'bytes');
   *   }
   * });
   * ```
   */
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit({
        case: ErrorCase.ALREADY_RECORDING,
        message: this.labels.error_already_recording
      });
      return;
    }

    try {
      this._recordTime = Date.now();
      this._recorderState = RecorderState.RECORDING;
      // ✅ MERGE: Tracking des options et bytes streamés depuis to-migrate-here
      this._lastOptions = options;
      this._streamedBytes = 0;

      this.stream = await this.getAudioStream();

      // ✅ Configuration qualité (conservée pour compatibilité)
      const qualityConfig = {
        low: { bitRate: 64000, sampleRate: 22050 },
        medium: { bitRate: 128000, sampleRate: 44100 },
        high: { bitRate: 256000, sampleRate: 48000 }
      };

      const quality = qualityConfig[options.quality || 'medium'];

      // ✅ MIGRATION: Format WAV PCM 16-bit optimal pour transcription Whisper
      // StereoAudioRecorder force le format WAV cohérent avec l'API de transcription
      const mimeType = 'audio/wav';
      console.log('🎵 Format audio forcé:', mimeType, '(WAV PCM 16-bit)');

      // ✅ Configuration RecordRTC optimisée pour transcription
      const rtcOptions: any = {
        type: 'audio' as const,
        mimeType,
        recorderType: StereoAudioRecorder,  // ✅ Force WAV format
        numberOfAudioChannels: 1,           // Mono pour transcription
        desiredSampRate: 16000,             // 16kHz optimal pour Whisper
        bitsPerSecond: 16,                  // 16-bit PCM
        debugger: false
      };

      // Ajout des options de configuration
      if (options.timeSlice) {
        rtcOptions.timeSlice = options.timeSlice;
      }

      // ✅ MERGE: Gestion chunks temps réel avec comptabilisation des bytes streamés
      if (options.onChunk && options.timeSlice) {
        rtcOptions.ondataavailable = async (blob: Blob) => {
          console.log('🎵 ondataavailable', blob.size, 'bytes');
          const typedBlob = new Blob([blob], { type: mimeType });

          // Comptabiliser ce qui a déjà été streamé
          this._streamedBytes += typedBlob.size;

          const base64 = await this.blobToBase64(typedBlob);
          await options.onChunk!({ typedBlob, base64 });
        };
      }

      this.recorder = new RecordRTCPromisesHandler(this.stream, rtcOptions);
      await this.recorder.startRecording();

      // Start volume monitoring
      this.startVolumeDetection();

      this.recorderState.emit(this._recorderState);

      // ✅ AMÉLIORATION : Timeout avec cleanup
      if (options.timeout) {
        this._recordTimeout = setTimeout(() => {
          console.log('⏰ Recording timeout reached');
          this.recorderState.emit(RecorderState.SILENCE);
        }, options.timeout);
      }

      // ✅ AMÉLIORATION : Détection silence optionnelle
      if (options.stopOnSilence) {
        this.startSilenceDetection();
      }

      console.log('🎤 Recording started successfully');

    } catch (err: any) {
      console.error('❌ Recording start failed:', err);
      await this.clear();

      this.recorderError.emit({
        case: ErrorCase.HARDWARE_ERROR,
        message: `${this.labels.error_hardware_error}: ${err.message}`,
        retry: true
      });

      throw err;
    }
  }

  /**
   * Arrête l'enregistrement et retourne les données audio
   *
   * @description
   * Termine l'enregistrement en cours et retourne:
   * - Blob audio encodé
   * - Données base64 pour upload
   * - Durée d'enregistrement
   * - Données waveform pour visualisation
   *
   * @returns {Promise<Object>} Données d'enregistrement
   * @returns {Blob} [returns.blob] Fichier audio encodé
   * @returns {string} [returns.base64] Données base64 pour upload
   * @returns {number} returns.duration Durée en secondes
   * @returns {number[]} [returns.waveformData] Points waveform pour visualisation
   *
   * @compatibility
   * ✅ Chrome 47+, Firefox 55+, Safari 11+, Edge 79+
   * ✅ Tous navigateurs mobiles supportés
   *
   * @example
   * ```typescript
   * const result = await this.$audio.stopRecording();
   * console.log(`Enregistrement: ${result.duration}s, ${result.blob?.size} bytes`);
   *
   * if (result.waveformData) {
   *   this.displayWaveform(result.waveformData);
   * }
   * ```
   */
  /**
   * @note MERGE: Amélioration mode chunk depuis to-migrate-here
   * En mode chunk avec timeSlice, les données sont déjà émises via ondataavailable
   * Le blob final peut être vide ou ne pas exister car toutes les données ont été streamées
   */
  async stopRecording(): Promise<{blob?: Blob, base64?: string, duration: number, waveformData?: number[]}> {
    //
    // ✅ MERGE: Annuler immédiatement les timers et détection de silence
    clearTimeout(this._recordTimeout);
    this._silenceDetectionActive = false;

    const duration = this.recordTime;
    this._recordTime = 0;
    this._recordTimeout = 0;

    if (this._recorderState === RecorderState.STOPPED) {
      return { duration };
    }

    try {
      this._recorderState = RecorderState.PROCESSING;
      this.recorderState.emit(this._recorderState);

      if (!this.recorder) {
        throw new Error('No recorder instance');
      }

      const options = this._lastOptions;
      const isChunkMode = !!(options?.onChunk && options.timeSlice);

      await this.recorder.stopRecording();
      const blob = await this.recorder.getBlob();

      // ✅ MERGE MODE CHUNK : En mode chunk avec timeSlice, les données sont déjà émises via ondataavailable
      // Le blob final peut être vide ou ne pas exister car toutes les données ont été streamées
      if (isChunkMode) {
        console.log('📦 Stop recording in chunk mode - all chunks already emitted via ondataavailable');

        try {
          // Vérifier s'il reste des données non streamées
          if (blob && blob.size > 0 && blob.size >= 44) {
            // ✅ Vérifier que le chunk final est assez grand pour être un WAV valide (min 44 bytes header)
            // Les chunks trop petits ne sont pas des WAV valides et causent des erreurs serveur
            console.log(`📦 Emitting final partial chunk: ${blob.size} bytes`, blob.type);
            const lastTyped = new Blob([blob], { type: blob.type });
            const lastBase64 = await this.blobToBase64(lastTyped);
            await options!.onChunk!({ typedBlob: lastTyped, base64: lastBase64 });
          }
        } catch (err) {
          console.log('⚠️ No final blob available in chunk mode (expected behavior)');
        }

        // En mode chunk, on ne retourne pas de blob car tout a déjà été traité
        return { duration };
      }

      // ✅ MODE NORMAL : Sans timeSlice, obtenir le blob complet normalement
      if (!blob || blob.size === 0) {
        console.warn('⚠️ Empty blob after stopRecording - this should not happen in normal mode');
        return { duration };
      }

      const base64 = await this.recorder.getDataURL();

      // Génération waveform data pour visualisation
      const waveformData = await this.generateWaveformData(blob);

      console.log('✅ Recording stopped successfully', {
        duration,
        size: blob.size,
        type: blob.type,
        waveformPoints: waveformData?.length
      });

      return {
        blob,
        base64,
        duration,
        waveformData
      };

    } catch (err: any) {
      console.error('❌ Recording stop failed:', err);
      this.recorderError.emit({
        case: ErrorCase.HARDWARE_ERROR,
        message: `${this.labels.error_hardware_error}: ${err.message}`
      });

      return { duration };

    } finally {
      this._recorderState = RecorderState.STOPPED;
      this.recorderState.emit(this._recorderState);

      // ✅ MERGE: Reset des infos de streaming
      this._lastOptions = undefined;
      this._streamedBytes = 0;

      await this.clear();
    }
  }

  // ✅ MERGE: Génération données waveform pour visualisation avec garantie fermeture AudioContext
  private async generateWaveformData(blob: Blob, points: number = 100): Promise<number[]> {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      const samplesPerPoint = Math.floor(channelData.length / points);
      const waveformData: number[] = [];

      for (let i = 0; i < points; i++) {
        const start = i * samplesPerPoint;
        const end = Math.min(start + samplesPerPoint, channelData.length);

        let max = 0;
        for (let j = start; j < end; j++) {
          max = Math.max(max, Math.abs(channelData[j]));
        }

        waveformData.push(max);
      }

      return waveformData;

    } catch (error) {
      console.error('❌ Error generating waveform data:', error);
      return [];
    } finally {
      // ✅ MERGE iOS : Garantir fermeture dans finally (même en cas d'erreur)
      try {
        await audioCtx.close();
        console.log('🔊 generateWaveform AudioContext closed');
      } catch (err) {
        console.warn('⚠️ generateWaveform AudioContext close error:', err);
      }
    }
  }

  // ✅ MERGE: Détection silence plus sophistiquée avec flag d'arrêt immédiat
  private startSilenceDetection(): void {
    if (!this.audioContext || !this.analyser) {
      console.warn('🔇 Silence detection: AudioContext ou Analyser non disponible');
      return;
    }

    //
    // ✅ MERGE: Activer le flag de détection
    this._silenceDetectionActive = true;

    let silenceStart = 0;
    const silenceThreshold = this.config.silenceThreshold; // ✅ Utilise config centralisée
    const silenceTimeout = this.config.silenceTimeout;
    let logCounter = 0; // Pour éviter trop de logs

    const checkSilence = () => {
      //
      // ✅ MERGE: Vérifier le flag en plus de l'état pour arrêt immédiat
      if (!this._silenceDetectionActive || this.state !== RecorderState.RECORDING) {
        console.log('🔇 Silence detection stopped - flag:', this._silenceDetectionActive, 'state:', this.state);
        return;
      }

      const bufferLength = this.analyser!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser!.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength / 255;

      // ✅ LOGS DÉTAILLÉS : Log toutes les 10 mesures (1 seconde)
      logCounter++;

      if (average < silenceThreshold) {
        if (silenceStart === 0) {
          silenceStart = Date.now();
        } else {
          const silenceDuration = Date.now() - silenceStart;
          if (silenceDuration > silenceTimeout) {
            this.recorderState.emit(RecorderState.SILENCE);
            return;
          } else {
            // Log progression du silence
            if (silenceDuration % 500 === 0) { // Toutes les 500ms
            }
          }
        }
      } else {
        silenceStart = 0;
      }

      setTimeout(checkSilence, 100);
    };

    checkSilence();
  }

  /**
   * Convertit un Blob en chaîne base64
   *
   * @description
   * Convertit un fichier Blob en représentation base64 pour upload ou stockage.
   * Gère les erreurs de lecture et de conversion.
   *
   * @param {Blob} blob - Blob à convertir
   * @returns {Promise<string>} Chaîne base64 (avec préfixe data:)
   * @throws {Error} Erreur si conversion impossible
   *
   * @compatibility
   * ✅ Tous navigateurs supportés (FileReader API universelle)
   *
   * @example
   * ```typescript
   * const base64 = await this.$audio.blobToBase64(audioBlob);
   * console.log('Base64 length:', base64.length);
   * ```
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Mécanisme de retry avec backoff exponentiel
   *
   * @description
   * Exécute une opération avec retry automatique en cas d'échec.
   * Utilise un backoff exponentiel pour espacer les tentatives.
   *
   * @template T
   * @param {Function} operation - Fonction à exécuter avec retry
   * @param {number} [maxRetries=3] - Nombre maximum de tentatives
   * @returns {Promise<T>} Résultat de l'opération
   * @throws {Error} Dernière erreur si toutes les tentatives échouent
   *
   * @compatibility
   * ✅ Tous navigateurs supportés
   *
   * @example
   * ```typescript
   * const result = await this.$audio.retryOperation(
   *   () => this.getAudioStream(),
   *   3
   * );
   * ```
   */
  async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = this._maxRetries): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  // ✅ MERGE: Cleanup complet avec reset du flag de silence
  private async clear(): Promise<void> {
    this._silenceDetectionActive = false;
    await this.closeAudioStream();
    this._recorderState = RecorderState.STOPPED;
    this._avgVolume = 0;
    this._retryCount = 0;
  }
}
