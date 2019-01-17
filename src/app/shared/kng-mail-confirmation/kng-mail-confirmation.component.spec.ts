import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngMailConfirmationComponent } from './kng-mail-confirmation.component';

describe('KngMailConfirmationComponent', () => {
  let component: KngMailConfirmationComponent;
  let fixture: ComponentFixture<KngMailConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngMailConfirmationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngMailConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
