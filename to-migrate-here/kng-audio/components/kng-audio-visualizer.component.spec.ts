import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { KngAudioVisualizerComponent } from './kng-audio-visualizer.component';
import { KngAudioRecorderEnhancedService } from '../services/kng-audio-recorder-enhanced.service';
import { RecorderState } from '../interfaces/audio.interfaces';

// Mock service
class MockAudioRecorderService {
  recorderState = of(RecorderState.STOPPED);
  audioActivity = of({ volume: 0, frequency: 0, timestamp: 0, isActive: false });
}

describe('KngAudioVisualizerComponent', () => {
  let component: KngAudioVisualizerComponent;
  let fixture: ComponentFixture<KngAudioVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KngAudioVisualizerComponent],
      providers: [
        { provide: KngAudioRecorderEnhancedService, useClass: MockAudioRecorderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KngAudioVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default configuration', () => {
    expect(component.width).toBe(300);
    expect(component.height).toBe(80);
    expect(component.showRealtime).toBeTruthy();
    expect(component.showVolumeMeter).toBeTruthy();
    expect(component.showActivity).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.isRecording).toBeFalsy();
    expect(component.isActive).toBeFalsy();
    expect(component.volumeLevel).toBe(0);
    expect(component.activityStatus).toBe('Silencieux');
  });

  it('should update waveform data', () => {
    const testData = [0.1, 0.5, 0.8, 0.3, 0.2];
    component.setWaveformData(testData);

    expect(component.waveformData).toEqual(testData);
  });

  it('should update playback position', () => {
    component.waveformData = new Array(100).fill(0.5);
    component.setPlaybackPosition(0.5);

    expect(component.currentPosition).toBe(50);
  });

  it('should reset state correctly', () => {
    // Setup état
    component.volumeLevel = 0.8;
    component.isActive = true;
    component.currentPosition = 50;
    component.activityStatus = 'Voix détectée';

    component.reset();

    expect(component.volumeLevel).toBe(0);
    expect(component.isActive).toBeFalsy();
    expect(component.currentPosition).toBe(0);
    expect(component.activityStatus).toBe('Silencieux');
  });

  it('should show/hide elements based on configuration', () => {
    // Test showRealtime
    component.showRealtime = false;
    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas.hidden).toBeTruthy();

    // Test showVolumeMeter
    component.showVolumeMeter = false;
    fixture.detectChanges();

    const volumeMeter = fixture.nativeElement.querySelector('.volume-meter');
    expect(volumeMeter.hidden).toBeTruthy();

    // Test showActivity
    component.showActivity = false;
    fixture.detectChanges();

    const activityIndicator = fixture.nativeElement.querySelector('.activity-indicator');
    expect(activityIndicator.hidden).toBeTruthy();
  });

  it('should handle waveform data display', () => {
    const testData = [0.2, 0.5, 0.8, 0.3];
    component.waveformData = testData;
    component.showWaveform = true;

    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('.bar');
    expect(bars.length).toBe(testData.length);

    // Vérifier les hauteurs
    expect(bars[0].style.height).toBe('20%');
    expect(bars[1].style.height).toBe('50%');
    expect(bars[2].style.height).toBe('80%');
  });

  it('should apply CSS classes correctly', () => {
    const visualizer = fixture.nativeElement.querySelector('.audio-visualizer');

    // État initial
    expect(visualizer.classList.contains('recording')).toBeFalsy();
    expect(visualizer.classList.contains('active')).toBeFalsy();

    // État recording
    component.isRecording = true;
    fixture.detectChanges();
    expect(visualizer.classList.contains('recording')).toBeTruthy();

    // État active
    component.isActive = true;
    fixture.detectChanges();
    expect(visualizer.classList.contains('active')).toBeTruthy();
  });

  it('should update volume level display', () => {
    component.volumeLevel = 0.75;
    component.showVolumeMeter = true;

    fixture.detectChanges();

    const meterFill = fixture.nativeElement.querySelector('.meter-fill');
    expect(meterFill.style.width).toBe('75%');
  });
});
