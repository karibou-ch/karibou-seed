import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { KngAudioNoteEnhancedComponent } from './kng-audio-note-enhanced.component';
import { KngAudioRecorderEnhancedService } from '../../services/kng-audio-recorder-enhanced.service';
// KngAudioI18nService supprimé - utilise maintenant l'export i18n direct
import { KngAudioVisualizerComponent } from '../kng-audio-visualizer.component';

// Mock services
class MockAudioRecorderService {
  recorderState = of('STOPPED');
  recorderError = of(null);
  audioActivity = of({ volume: 0, frequency: 0, timestamp: 0, isActive: false });

  get isSupported() { return true; }
  async startRecording() {}
  async stopRecording() { return { duration: 0 }; }
  async detectSound() { return true; }
}

class MockAssistantService {
  chat() { return of({ text: 'Test transcription' }); }
}

class MockCartService {
  getShared() { return of({ cid: 'test-cart-id' }); }
}

class MockLoaderService {
  getLatestCoreData() {
    return {
      orders: [{ oid: 'test-order', status: 'fulfilled' }]
    };
  }
}

describe('KngAudioNoteEnhancedComponent', () => {
  let component: KngAudioNoteEnhancedComponent;
  let fixture: ComponentFixture<KngAudioNoteEnhancedComponent>;
  let audioService: MockAudioRecorderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        KngAudioNoteEnhancedComponent,
        KngAudioVisualizerComponent
      ],
      imports: [FormsModule],
      providers: [
        { provide: KngAudioRecorderEnhancedService, useClass: MockAudioRecorderService },
        { provide: 'AssistantService', useClass: MockAssistantService },
        { provide: 'CartService', useClass: MockCartService },
        { provide: 'LoaderService', useClass: MockLoaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: () => null },
              paramMap: { get: () => 'test-store' }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KngAudioNoteEnhancedComponent);
    component = fixture.componentInstance;
    audioService = TestBed.inject(KngAudioRecorderEnhancedService) as any;

    // Configuration de base
    component.type = 'item';
    component.key = 'test-key';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate unique instanceId automatically', () => {
    expect(component.instanceId).toBeTruthy();
    expect(component.instanceId).toContain('audio-note-');
  });

  it('should have correct initial state', () => {
    expect(component.audioState.isRecording).toBeFalse();
    expect(component.audioState.isProcessing).toBeFalse();
    expect(component.audioState.hasError).toBeFalse();
    expect(component.audioState.hasAudio).toBeFalse();
  });

  it('should return correct title for each type', () => {
    component.type = 'item';
    expect(component.getNoteTitle()).toContain('produit');

    component.type = 'support';
    expect(component.getNoteTitle()).toContain('support');

    component.type = 'helper';
    expect(component.getNoteTitle()).toContain('assistant');
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(65)).toBe('1:05');
    expect(component.formatDuration(125)).toBe('2:05');
    expect(component.formatDuration(30)).toBe('0:30');
  });

  it('should handle toggle cart include', () => {
    const initialValue = component.includeCartInContext;
    component.onToggleCartInclude();
    expect(component.includeCartInContext).toBe(!initialValue);
  });

  it('should clear audio state correctly', () => {
    // Setup état avec audio
    component.audioState.hasAudio = true;
    component.audioState.transcription = 'Test transcription';
    component.cartUrl = 'test-url';

    component.clearAudio();

    expect(component.audioState.hasAudio).toBeFalse();
    expect(component.audioState.transcription).toBeUndefined();
    expect(component.cartUrl).toBe('');
  });

  it('should emit events correctly', () => {
    spyOn(component.onAudioReady, 'emit');
    spyOn(component.onStateChange, 'emit');

    component.clearAudio();

    expect(component.onAudioReady.emit).toHaveBeenCalledWith({
      src: '',
      audio: '',
      note: ''
    });
    expect(component.onStateChange.emit).toHaveBeenCalled();
  });

  it('should handle error state', () => {
    component.audioState.hasError = true;
    component.audioState.errorMessage = 'Test error';
    component.audioState.canRetry = true;

    fixture.detectChanges();

    const errorSection = fixture.nativeElement.querySelector('.error-section');
    expect(errorSection).toBeTruthy();

    const retryBtn = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn).toBeTruthy();
  });

  it('should show/hide elements based on state', () => {
    // État initial - pas d'audio
    fixture.detectChanges();

    let audioElement = fixture.nativeElement.querySelector('audio');
    expect(audioElement.hidden).toBeTruthy();

    let clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeFalsy();

    // Avec audio
    component.audioState.hasAudio = true;
    fixture.detectChanges();

    audioElement = fixture.nativeElement.querySelector('audio');
    expect(audioElement.hidden).toBeFalsy();

    clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('should handle custom slots', () => {
    component.hasCustomTitle = true;
    component.hasCustomResponse = true;

    fixture.detectChanges();

    const noteHeader = fixture.nativeElement.querySelector('.note-header');
    expect(noteHeader).toBeFalsy();

    const defaultResponse = fixture.nativeElement.querySelector('.default-response');
    expect(defaultResponse).toBeFalsy();
  });
});
