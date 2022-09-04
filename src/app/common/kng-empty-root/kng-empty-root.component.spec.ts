import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngEmptyRootComponent } from './kng-empty-root.component';

describe('KngEmptyRootComponent', () => {
  let component: KngEmptyRootComponent;
  let fixture: ComponentFixture<KngEmptyRootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngEmptyRootComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngEmptyRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
