import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { KngAudioRecorderEnhancedService } from '../services/kng-audio-recorder-enhanced.service';
import { AudioActivityData, RecorderState } from '../interfaces/audio.interfaces';

@Component({
  selector: 'kng-audio-visualizer',
  templateUrl: './kng-audio-visualizer.component.html',
  styleUrls: ['./kng-audio-visualizer.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KngAudioVisualizerComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // ✅ Configuration
  @Input() showRealtime = true;
  @Input() showWaveform = false;
  @Input() showVolumeMeter = true;
  @Input() showActivity = false;
  @Input() showLabel = true;  // ✅ NOUVEAU: Afficher les labels ou maximiser l'espace graphique
  @Input() waveformData: number[] = [];
  @Input() currentPosition = 0; // Pour la lecture

  // ✅ État interne
  isRecording = false;
  isActive = false;
  volumeLevel = 0;
  activityStatus = 'Silencieux';

  private subscription = new Subscription();
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrame!: number;
  private activityHistory: number[] = [];

  constructor(
    private audioService: KngAudioRecorderEnhancedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // ✅ Écouter les changements d'état
    this.subscription.add(
      this.audioService.recorderState.subscribe(state => {
        this.isRecording = state === RecorderState.RECORDING;
        this.updateActivityStatus();
        this.cdr.detectChanges();
      })
    );

    // ✅ Écouter l'activité audio
    this.subscription.add(
      this.audioService.audioActivity.subscribe(data => {
        this.updateVisualization(data);
      })
    );
  }

  ngAfterViewInit() {
    if (this.showRealtime && this.canvasRef) {
      this.canvas = this.canvasRef.nativeElement;
      this.ctx = this.canvas.getContext('2d')!;
      this.setupCanvasSize();
      this.initCanvas();
    }
  }

  private setupCanvasSize() {
    // ✅ Adapter aux dimensions du container
    const container = this.canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.canvas.width = rect.width - 8; // Padding
      this.canvas.height = rect.height - 8;
    } else {
      // Fallback si pas de container
      this.canvas.width = 120;
      this.canvas.height = 32;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private initCanvas() {
    // ✅ Configuration canvas
    this.ctx.fillStyle = 'rgba(var(--mdc-theme-primary), 0.8)';
    this.ctx.strokeStyle = 'rgb(var(--mdc-theme-primary))';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    // Fond initial
    this.clearCanvas();
  }

  private clearCanvas() {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  private updateVisualization(data: AudioActivityData) {
    // ✅ Mise à jour niveau sonore
    this.volumeLevel = Math.min(data.volume * 5, 1); // Amplifier pour l'affichage
    this.isActive = data.isActive;

    // ✅ Historique d'activité
    this.activityHistory.push(data.volume);
    if (this.activityHistory.length > 50) {
      this.activityHistory.shift();
    }

    // ✅ Mise à jour status
    this.updateActivityStatus();

    // ✅ Rendu canvas temps réel
    if (this.showRealtime && this.ctx) {
      this.drawRealTimeWaveform(data);
    }

    this.cdr.detectChanges();
  }

  private updateActivityStatus() {
    if (!this.isRecording) {
      this.activityStatus = 'Arrêté';
      return;
    }

    const avgVolume = this.activityHistory.length > 0
      ? this.activityHistory.reduce((a, b) => a + b, 0) / this.activityHistory.length
      : 0;

    if (avgVolume > 0.1) {
      this.activityStatus = 'Voix détectée';
    } else if (avgVolume > 0.02) {
      this.activityStatus = 'Activité faible';
    } else {
      this.activityStatus = 'Silencieux';
    }
  }

  private drawRealTimeWaveform(data: AudioActivityData) {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // ✅ Effet de défilement
    const imageData = this.ctx.getImageData(1, 0, canvasWidth - 1, canvasHeight);
    this.clearCanvas();
    this.ctx.putImageData(imageData, 0, 0);

    // ✅ Dessiner nouvelle barre
    const barHeight = Math.min(data.volume * canvasHeight * 2, canvasHeight);
    const x = canvasWidth - 2;
    const y = (canvasHeight - barHeight) / 2;

    // Gradient selon l'intensité
    const gradient = this.ctx.createLinearGradient(0, 0, 0, canvasHeight);
    if (data.volume > 0.5) {
      gradient.addColorStop(0, '#F44336');
      gradient.addColorStop(1, '#FF9800');
    } else if (data.volume > 0.2) {
      gradient.addColorStop(0, '#FF9800');
      gradient.addColorStop(1, '#4CAF50');
    } else {
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(1, '#2196F3');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, 2, barHeight);

    // ✅ Ligne centrale
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, canvasHeight / 2);
    this.ctx.lineTo(canvasWidth, canvasHeight / 2);
    this.ctx.stroke();
  }

  // ✅ API publique pour contrôler la visualisation
  public setWaveformData(data: number[]) {
    this.waveformData = data;
    this.cdr.detectChanges();
  }

  public setPlaybackPosition(position: number) {
    this.currentPosition = Math.floor(position * this.waveformData.length);
    this.cdr.detectChanges();
  }

  public reset() {
    this.volumeLevel = 0;
    this.isActive = false;
    this.activityHistory = [];
    this.currentPosition = 0;
    this.activityStatus = 'Silencieux';

    if (this.ctx) {
      this.clearCanvas();
    }

    this.cdr.detectChanges();
  }
}
