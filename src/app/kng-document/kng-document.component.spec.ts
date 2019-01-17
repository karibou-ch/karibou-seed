import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KngDocumentComponent } from './kng-document.component';

describe('KngDocumentComponent', () => {
  let component: KngDocumentComponent;
  let fixture: ComponentFixture<KngDocumentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
