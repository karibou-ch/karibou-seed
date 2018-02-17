import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngHomeComponent } from './kng-home.component';

describe('KngHomeComponent', () => {
  let component: KngHomeComponent;
  let fixture: ComponentFixture<KngHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
