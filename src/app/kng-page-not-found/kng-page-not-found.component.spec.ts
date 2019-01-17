import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngPageNotFoundComponent } from './kng-page-not-found.component';

describe('KngPageNotFoundComponent', () => {
  let component: KngPageNotFoundComponent;
  let fixture: ComponentFixture<KngPageNotFoundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngPageNotFoundComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngPageNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
