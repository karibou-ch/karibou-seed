import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngWelcomeComponent } from './kng-welcome.component';

describe('KngWelcomeComponent', () => {
  let component: KngWelcomeComponent;
  let fixture: ComponentFixture<KngWelcomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngWelcomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngWelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
