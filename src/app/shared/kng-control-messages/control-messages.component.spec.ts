import { async, ComponentFixture, TestBed } from '@angular/core/testing';

// TOCHECK
import { KngControlMessagesComponent } from './kng-control-messages.component';

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
