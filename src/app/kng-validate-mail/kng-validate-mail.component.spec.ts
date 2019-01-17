import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngValidateMailComponent } from './kng-validate-mail.component';

describe('KngValidateMailComponent', () => {
  let component: KngValidateMailComponent;
  let fixture: ComponentFixture<KngValidateMailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngValidateMailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngValidateMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
