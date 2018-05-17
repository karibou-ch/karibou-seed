import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngFooterComponent } from './kng-footer.component';

describe('KngFooterComponent', () => {
  let component: KngFooterComponent;
  let fixture: ComponentFixture<KngFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
