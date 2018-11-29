import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngUserReminderComponent } from './kng-user-reminder.component';

describe('KngUserReminderComponent', () => {
  let component: KngUserReminderComponent;
  let fixture: ComponentFixture<KngUserReminderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngUserReminderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngUserReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
