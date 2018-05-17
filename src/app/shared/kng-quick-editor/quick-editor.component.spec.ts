import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngQuickEditorComponent } from './quick-editor.component';

describe('KngQuickEditorComponent', () => {
  let component: KngQuickEditorComponent;
  let fixture: ComponentFixture<KngQuickEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngQuickEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngQuickEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
