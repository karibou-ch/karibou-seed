import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngSubscriptionControlComponent } from './kng-subscription-control.component';

describe('KngSubscriptionControlComponent', () => {
  let component: KngSubscriptionControlComponent;
  let fixture: ComponentFixture<KngSubscriptionControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngSubscriptionControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngSubscriptionControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
