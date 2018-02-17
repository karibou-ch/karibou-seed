import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngDepartementComponent } from './welcome.component';

describe('KngDepartementComponent', () => {
  let component: KngDepartementComponent;
  let fixture: ComponentFixture<KngDepartementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngDepartementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngDepartementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
