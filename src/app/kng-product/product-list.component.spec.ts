import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitListComponent } from './produit-list.component';

describe('ProduitListComponent', () => {
  let component: ProduitListComponent;
  let fixture: ComponentFixture<ProduitListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProduitListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProduitListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
