import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngUiBottomActionsComponent } from './kng-ui-bottom-actions.component';

describe('KngBottomActionsComponent', () => {
  let component: KngUiBottomActionsComponent;
  let fixture: ComponentFixture<KngUiBottomActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngUiBottomActionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngUiBottomActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
