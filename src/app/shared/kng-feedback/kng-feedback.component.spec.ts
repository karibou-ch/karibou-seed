import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngFeedbackComponent } from './kng-feedback.component';

describe('KngFeedbackComponent', () => {
  let component: KngFeedbackComponent;
  let fixture: ComponentFixture<KngFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
