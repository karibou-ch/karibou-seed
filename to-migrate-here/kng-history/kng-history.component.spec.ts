import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngAssistantHistoryComponent } from './kng-history.component';

describe('KngAssistantHistoryComponent', () => {
  let component: KngAssistantHistoryComponent;
  let fixture: ComponentFixture<KngAssistantHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [KngAssistantHistoryComponent],
    teardown: { destroyAfterEach: false }
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngAssistantHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
