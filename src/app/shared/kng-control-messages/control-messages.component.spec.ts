import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngControlMessagesComponent } from './control-messages.component';

describe('KngControlMessagesComponent', () => {
  let component: KngControlMessagesComponent;
  let fixture: ComponentFixture<KngControlMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngControlMessagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngControlMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
