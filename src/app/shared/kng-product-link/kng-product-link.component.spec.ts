import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngProductLinkComponent } from './kng-product-link.component';

describe('KngProductLinkComponent', () => {
  let component: KngProductLinkComponent;
  let fixture: ComponentFixture<KngProductLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngProductLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngProductLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
