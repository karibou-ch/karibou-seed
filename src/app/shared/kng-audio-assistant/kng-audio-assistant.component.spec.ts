import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngAudioNoteComponent } from './kng-audio-note.component';

describe('KngAudioNoteComponent', () => {
  let component: KngAudioNoteComponent;
  let fixture: ComponentFixture<KngAudioNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngAudioNoteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngAudioNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
