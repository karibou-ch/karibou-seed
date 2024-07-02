import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngStreamSentenceComponent } from './kng-stream-sentence.component';

describe('KngStreamSentenceComponent', () => {
  let component: KngStreamSentenceComponent;
  let fixture: ComponentFixture<KngStreamSentenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngStreamSentenceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngStreamSentenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
