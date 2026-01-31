import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KngPromptComponent } from './kng-prompt.component';

describe('KngPromptComponent', () => {
  let component: KngPromptComponent;
  let fixture: ComponentFixture<KngPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [KngPromptComponent],
    teardown: { destroyAfterEach: false }
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KngPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
