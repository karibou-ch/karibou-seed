import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngAssistantBotComponent } from './kng-assistant-bot.component';

describe('KngAssistantBotComponent', () => {
  let component: KngAssistantBotComponent;
  let fixture: ComponentFixture<KngAssistantBotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KngAssistantBotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngAssistantBotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
