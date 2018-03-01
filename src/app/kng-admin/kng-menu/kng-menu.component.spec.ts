import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngMenuComponent } from './kng-menu.component';

describe('KngMenuComponent', () => {
  let component: KngMenuComponent;
  let fixture: ComponentFixture<KngMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
