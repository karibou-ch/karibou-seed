import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngServerErrorFoundComponent } from './kng-server-error-found.component';

describe('KngServerErrorFoundComponent', () => {
  let component: KngServerErrorFoundComponent;
  let fixture: ComponentFixture<KngServerErrorFoundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngServerErrorFoundComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngServerErrorFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
