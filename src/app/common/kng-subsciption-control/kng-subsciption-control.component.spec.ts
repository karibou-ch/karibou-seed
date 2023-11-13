import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngSubsciptionControlComponent } from './kng-subsciption-control.component';

describe('KngSubsciptionControlComponent', () => {
  let component: KngSubsciptionControlComponent;
  let fixture: ComponentFixture<KngSubsciptionControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngSubsciptionControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngSubsciptionControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
