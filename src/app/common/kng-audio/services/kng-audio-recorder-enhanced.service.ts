import { EventEmitter, Injectable } from '@angular/core';
import { RecordRTCPromisesHandler } from "recordrtc";
import {
  RecordedAudioOutput,
  ErrorCase,
  RecorderState,
  AudioActivityData,
  AudioRecordingOptions
} from '../interfaces/audio.interfaces';

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

  // ✅ AMÉLIORATION : Configuration
  private config = {
    sampleRate: 44100,
    channelCount: 1,
    bitRate: 128000,
    timeout: 15000,
    silenceTimeout: 5000,
    volumeThreshold: 0.01
  };

  constructor() {
    this._recorderState = RecorderState.STOPPED;
  }

  get state(): RecorderState {
    return this._recorderState;
  }

  get recordTime(): number {
    if (!this._recordTime) {
      return 0;
    }
    return parseFloat(((Date.now() - this._recordTime) / 1000).toFixed(2));
  }

  get isSupported(): boolean {
    return !!(navigator.mediaDevices && 
             navigator.mediaDevices.getUserMedia && 
             (window as any).MediaRecorder);
  }

  // ✅ AMÉLIORATION : Fermeture propre avec cleanup
  closeAudioStream(): void {
    try {
      // Stop animation frame
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      // Stop recorder
      if (this.recorder) {
        this.recorder.stopRecording();
        this.recorder = null;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }

      // Stop stream tracks
      if (this.stream && this.stream.active) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎤 Audio track stopped:', track.kind);
        });
        this.stream = null;
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

  // ✅ AMÉLIORATION : Détection son plus robuste
  async detectSound(content: {blob?: Blob, url?: string}): Promise<boolean> {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();

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

      // ✅ AMÉLIORATION : Analyse plus sophistiquée
      let maxVolume = 0;
      let activeSegments = 0;
      const segmentSize = Math.floor(floats32.length / 100); // 100 segments

      for (let i = 0; i < floats32.length; i += segmentSize) {
        let segmentSum = 0;
        for (let j = i; j < Math.min(i + segmentSize, floats32.length); j++) {
          const amplitude = Math.abs(floats32[j]);
          segmentSum += amplitude * amplitude;
          maxVolume = Math.max(maxVolume, amplitude);
        }

        const segmentVolume = Math.sqrt(segmentSum / segmentSize);
        if (segmentVolume > this.config.volumeThreshold) {
          activeSegments++;
        }
      }

      await audioCtx.close();

      // Au moins 5% des segments doivent être actifs
      const isActive = (activeSegments / 100) > 0.05 && maxVolume > this.config.volumeThreshold;

      console.log(`🔊 Audio analysis: ${activeSegments}% active segments, max: ${maxVolume.toFixed(3)}, result: ${isActive}`);
      return isActive;

    } catch (error) {
      console.error('❌ Error detecting sound:', error);
      return false;
    }
  }

  // ✅ AMÉLIORATION : Vérification permissions avec retry
  async isAudioGranted(): Promise<boolean> {
    if (!this.isSupported) {
      this.recorderError.emit({
        case: ErrorCase.BROWSER_NOT_SUPPORTED,
        message: 'Votre navigateur ne supporte pas l\'enregistrement audio'
      });
      return false;
    }

    try {
      // Test permissions
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    } catch {
      // Fallback: try to access stream directly
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  // ✅ AMÉLIORATION : Gestion stream avec retry et meilleure UX
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

      let errorCase = ErrorCase.HARDWARE_ERROR;
      let message = 'Erreur d\'accès au microphone';
      let retry = true;

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorCase = ErrorCase.USER_CONSENT_FAILED;
        message = 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
        retry = false;
      } else if (err.name === 'NotFoundError') {
        errorCase = ErrorCase.HARDWARE_ERROR;
        message = 'Aucun microphone détecté. Vérifiez que votre microphone est connecté.';
        retry = false;
      }

      this.recorderError.emit({ case: errorCase, message, retry });
      throw err;
    }
  }

  // ✅ AMÉLIORATION : Démarrage avec configuration avancée
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {

    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit({
        case: ErrorCase.ALREADY_RECORDING,
        message: 'Enregistrement déjà en cours'
      });
      return;
    }

    try {
      this._recordTime = Date.now();
      this._recorderState = RecorderState.RECORDING;

      this.stream = await this.getAudioStream();

      // ✅ AMÉLIORATION : Configuration qualité
      const qualityConfig = {
        low: { bitRate: 64000, sampleRate: 22050 },
        medium: { bitRate: 128000, sampleRate: 44100 },
        high: { bitRate: 256000, sampleRate: 48000 }
      };

      const quality = qualityConfig[options.quality || 'medium'];

      // Detect best mime type
      const mimeTypes = [
        'audio/webm; codecs=opus',
        'audio/webm; codec=opus',
        'audio/webm',
        'audio/mp4; codec=mp3',
        'audio/mp4'
      ];

      let mimeType = 'audio/webm';
      for (const type of mimeTypes) {
        if ((window as any).MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      // ✅ AMÉLIORATION : Configuration RecordRTC optimisée
      const rtcOptions: any = {
        type: 'audio' as const,
        mimeType: window['MIMETYPE'] || mimeType,
        numberOfAudioChannels: this.config.channelCount,
        desiredSampRate: quality.sampleRate,
        bitRate: quality.bitRate,
        timeSlice: options.timeSlice || 1000,
        debugger: false
      };

      // ✅ AMÉLIORATION : Gestion chunks temps réel
      if (options.onChunk && options.timeSlice) {
        rtcOptions.ondataavailable = async (blob: Blob) => {
          const typedBlob = new Blob([blob], { type: mimeType });
          const base64 = await this.blobToBase64(blob);
          options.onChunk!({ typedBlob, base64 });
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
      this.clear();

      this.recorderError.emit({
        case: ErrorCase.HARDWARE_ERROR,
        message: `Erreur de démarrage: ${err.message}`,
        retry: true
      });

      throw err;
    }
  }

  // ✅ AMÉLIORATION : Arrêt avec cleanup complet et données enrichies
  async stopRecording(): Promise<{blob?: Blob, base64?: string, duration: number, waveformData?: number[]}> {
    clearTimeout(this._recordTimeout);

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

      await this.recorder.stopRecording();
      const blob = await this.recorder.getBlob();
      const base64 = await this.recorder.getDataURL();

      // ✅ NOUVEAU : Génération waveform data pour visualisation
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
        message: `Erreur d'arrêt: ${err.message}`
      });

      return { duration };

    } finally {
      this._recorderState = RecorderState.STOPPED;
      this.recorderState.emit(this._recorderState);
      this.clear();
    }
  }

  // ✅ NOUVEAU : Génération données waveform pour visualisation
  private async generateWaveformData(blob: Blob, points: number = 100): Promise<number[]> {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();

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

      await audioCtx.close();
      return waveformData;

    } catch (error) {
      console.error('❌ Error generating waveform data:', error);
      return [];
    }
  }

  // ✅ AMÉLIORATION : Détection silence plus sophistiquée
  private startSilenceDetection(): void {
    if (!this.audioContext || !this.analyser) return;

    let silenceStart = 0;
    const silenceThreshold = 0.01;
    const silenceTimeout = this.config.silenceTimeout;

    const checkSilence = () => {
      if (this.state !== RecorderState.RECORDING) return;

      const bufferLength = this.analyser!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser!.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength / 255;

      if (average < silenceThreshold) {
        if (silenceStart === 0) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > silenceTimeout) {
          console.log('🔇 Silence detected, stopping recording');
          this.recorderState.emit(RecorderState.SILENCE);
          return;
        }
      } else {
        silenceStart = 0;
      }

      setTimeout(checkSilence, 100);
    };

    checkSilence();
  }

  // ✅ AMÉLIORATION : Conversion base64 avec gestion erreurs
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

  // ✅ AMÉLIORATION : Retry mechanism
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

  // ✅ AMÉLIORATION : Cleanup complet
  private clear(): void {
    this.closeAudioStream();
    this._recorderState = RecorderState.STOPPED;
    this._avgVolume = 0;
    this._retryCount = 0;
  }
}
