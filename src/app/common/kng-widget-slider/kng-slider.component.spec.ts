import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngSliderComponent } from './kng-slider.component';

describe('KngSliderComponent', () => {
  let component: KngSliderComponent;
  let fixture: ComponentFixture<KngSliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngSliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
