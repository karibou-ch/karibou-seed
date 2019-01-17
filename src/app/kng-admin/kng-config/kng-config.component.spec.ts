import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngConfigComponent } from './kng-config.component';

describe('KngConfigComponent', () => {
  let component: KngConfigComponent;
  let fixture: ComponentFixture<KngConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
