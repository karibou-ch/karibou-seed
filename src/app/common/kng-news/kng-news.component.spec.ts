import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngNewsComponent } from './kng-news.component';

describe('KngNewsComponent', () => {
  let component: KngNewsComponent;
  let fixture: ComponentFixture<KngNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngNewsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
