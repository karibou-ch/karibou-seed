import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisashiftTickerComponent } from './visashift-ticker.component';

describe('VisashiftTickerComponent', () => {
  let component: VisashiftTickerComponent;
  let fixture: ComponentFixture<VisashiftTickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisashiftTickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisashiftTickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
