import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngCalendarComponent } from './kng-calendar.component';

describe('KngCalendarComponent', () => {
  let component: KngCalendarComponent;
  let fixture: ComponentFixture<KngCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngCalendarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
