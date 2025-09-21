import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { KngAudioRecorderEnhancedService } from '../../services/kng-audio-recorder-enhanced.service';
import { $i18n, AudioLabels } from '../../services/kng-audio-i18n.service';
import { RecorderState, ErrorCase, AudioNoteType, AudioNoteState } from '../../interfaces/audio.interfaces';
import { UploadClient } from '@uploadcare/upload-client';

@Component({
  selector: 'kng-audio-note-compact',
  templateUrl: './kng-audio-note-compact.component.html',
  styleUrls: ['./kng-audio-note-compact.component.scss']
})
export class KngAudioNoteCompactComponent implements OnInit, OnDestroy {

  // ✅ Configuration minimale
  @Input() type: AudioNoteType = 'item';
  @Input() filename: string = '';
  @Input() key: string = '';
  @Input() disabled: boolean = false;
  @Input() locale: string = 'fr';

  // ✅ Events
  @Output() onAudioReady = new EventEmitter<{src: string, audio: string, note?: string, duration?: number}>();
  @Output() onAudioError = new EventEmitter<{case: ErrorCase, message: string}>();

  // ✅ État minimal
  isRecording = false;
  isProcessing = false;
  hasError = false;
  hasAudio = false;
  recordingTime = 0;
  volumeLevel = 0;
  instanceId: string;
  audioSrc: string = '';

  private subscription = new Subscription();
  private recordingTimer: any;

  // ✅ Labels i18n
  public get $i18n(): AudioLabels {
    return $i18n[this.locale]; // TODO: gérer la locale dynamiquement
  }

  constructor(
    private audioService: KngAudioRecorderEnhancedService,
    private cdr: ChangeDetectorRef
  ) {
    this.instanceId = `compact-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  ngOnInit() {
    // ✅ Écouter états
    this.subscription.add(
      this.audioService.recorderState.subscribe(state => {
        this.isRecording = state === RecorderState.RECORDING;
        this.isProcessing = state === RecorderState.PROCESSING;

        if (state === RecorderState.RECORDING) {
          this.startTimer();
        } else {
          this.stopTimer();
        }

        this.cdr.detectChanges();
      })
    );

    // ✅ Écouter erreurs
    this.subscription.add(
      this.audioService.recorderError.subscribe(error => {
        this.hasError = true;
        this.onAudioError.emit({ case: error.case, message: error.message });
        this.cdr.detectChanges();
      })
    );

    // ✅ Écouter activité pour volume
    this.subscription.add(
      this.audioService.audioActivity.subscribe(data => {
        this.volumeLevel = Math.min(data.volume * 3, 1);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.stopTimer();
  }

  private startTimer() {
    this.recordingTime = 0;
    this.recordingTimer = setInterval(() => {
      this.recordingTime++;
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  async toggleRecording() {
    if (this.disabled) return;

    try {
      if (this.isRecording) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    } catch (error) {
      console.error('❌ Recording toggle failed:', error);
    }
  }

  private async startRecording() {
    this.hasError = false;
    await this.audioService.startRecording({
      timeout: 30000,
      quality: 'medium'
    });
  }

  private async stopRecording() {
    try {
      const result = await this.audioService.stopRecording();

      if (!result.blob) {
        throw new Error('Aucun audio enregistré');
      }

      // Détecter le son
      const hasSound = await this.audioService.detectSound({ blob: result.blob });
      if (!hasSound) {
        this.hasError = true;
        return;
      }

      // Upload simple
      await this.uploadAudio(result.blob!, result.base64!, result.duration);

    } catch (error: any) {
      this.hasError = true;
      console.error('❌ Stop recording failed:', error);
    }
  }

  private async uploadAudio(blob: Blob, base64: string, duration: number) {
    try {
      const client = new UploadClient({ publicKey: this.key });
      const filename = this.filename || `${this.type}-compact-${Date.now()}`;

      const file = await client.uploadFile(blob, { fileName: filename });
      const audioUrl = file.cdnUrl.replace('https:', '');

      this.hasAudio = true;
      this.audioSrc = audioUrl;

      // Mettre à jour le lecteur audio
      const audioElement = document.querySelector(`#audio-compact-${this.instanceId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.src = audioUrl;
      }

      // Émettre résultat
      this.onAudioReady.emit({
        src: audioUrl,
        audio: base64,
        duration
      });

    } catch (error: any) {
      this.hasError = true;
      this.onAudioError.emit({
        case: ErrorCase.UPLOAD_FAILED,
        message: `Upload failed: ${error.message}`
      });
    }
  }

  clearAudio() {
    this.hasAudio = false;
    this.hasError = false;
    this.audioSrc = '';

    const audioElement = document.querySelector(`#audio-compact-${this.instanceId}`) as HTMLAudioElement;
    if (audioElement) {
      audioElement.src = '';
    }

    this.onAudioReady.emit({
      src: '',
      audio: ''
    });
  }

  getTooltip(): string {
    if (this.isProcessing) return this.$i18n.state_processing;
    if (this.isRecording) return this.$i18n.state_recording;
    if (this.hasError) return 'Erreur - Cliquer pour réessayer';
    if (this.hasAudio) return 'Audio enregistré';

    switch (this.type) {
      case 'item': return this.$i18n.desc_item;
      case 'support': return this.$i18n.desc_support;
      case 'helper': return this.$i18n.desc_helper;
      default: return this.$i18n.action_record;
    }
  }

  getNoteTitle(): string {
    switch (this.type) {
      case 'item': return this.$i18n.title_item;
      case 'support': return this.$i18n.title_support;
      case 'helper': return this.$i18n.title_helper;
      default: return this.$i18n.title_item;
    }
  }

  get buttonIcon(): string {
    if (this.isProcessing) return 'hourglass_empty';
    if (this.isRecording) return 'stop';
    if (this.hasError) return 'error';
    if (this.hasAudio) return 'check_circle';
    return 'mic';
  }

  get buttonClass(): string {
    let classes = 'audio-btn';
    if (this.isRecording) classes += ' recording';
    if (this.isProcessing) classes += ' processing';
    if (this.hasError) classes += ' error';
    if (this.hasAudio) classes += ' success';
    if (this.disabled) classes += ' disabled';
    return classes;
  }

  get statusText(): string {
    if (this.isProcessing) return this.$i18n.state_processing;
    if (this.isRecording) return `${this.recordingTime}s`;
    if (this.hasError) return '❌';
    if (this.hasAudio) return '✅';
    return '';
  }
}
