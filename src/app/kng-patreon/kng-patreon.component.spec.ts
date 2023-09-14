import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngPatreonComponent } from './kng-patreon.component';

describe('KngPatreonComponent', () => {
  let component: KngPatreonComponent;
  let fixture: ComponentFixture<KngPatreonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngPatreonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngPatreonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
