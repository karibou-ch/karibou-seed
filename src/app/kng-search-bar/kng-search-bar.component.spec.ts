import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngSearchBarComponent } from './kng-search-bar.component';

describe('KngSearchBarComponent', () => {
  let component: KngSearchBarComponent;
  let fixture: ComponentFixture<KngSearchBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngSearchBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
