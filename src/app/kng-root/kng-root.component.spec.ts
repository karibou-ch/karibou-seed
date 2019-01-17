import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngRootComponent } from './kng-root.component';

describe('KngRootComponent', () => {
  let component: KngRootComponent;
  let fixture: ComponentFixture<KngRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
