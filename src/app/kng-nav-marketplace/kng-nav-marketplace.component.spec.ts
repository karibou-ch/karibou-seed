import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngNavMarketplaceComponent } from './kng-nav-marketplace.component';

describe('KngNavMarketplaceComponent', () => {
  let component: KngNavMarketplaceComponent;
  let fixture: ComponentFixture<KngNavMarketplaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngNavMarketplaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngNavMarketplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
