import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MdcSearchBarComponent } from './mdc-search-bar.component';

describe('MdcSearchBarComponent', () => {
  let component: MdcSearchBarComponent;
  let fixture: ComponentFixture<MdcSearchBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MdcSearchBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MdcSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
