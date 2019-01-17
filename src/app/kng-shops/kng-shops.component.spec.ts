import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngShopsComponent } from './kng-shops.component';

describe('KngShopsComponent', () => {
  let component: KngShopsComponent;
  let fixture: ComponentFixture<KngShopsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngShopsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngShopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
