import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSignComponent } from './user-sign.component';

describe('UserSignComponent', () => {
  let component: UserSignComponent;
  let fixture: ComponentFixture<UserSignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserSignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
