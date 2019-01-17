import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngNavbarComponent } from './kng-navbar.component';

describe('KngNavbarComponent', () => {
  let component: KngNavbarComponent;
  let fixture: ComponentFixture<KngNavbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngNavbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
