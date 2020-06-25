import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngOrderFeedbackComponent } from './kng-order-feedback.component';

describe('KngOrderFeedbackComponent', () => {
  let component: KngOrderFeedbackComponent;
  let fixture: ComponentFixture<KngOrderFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngOrderFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngOrderFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
