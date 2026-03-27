import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { KngFeedbackComponent } from './kng-feedback.component';
import { i18n, NotifyService } from '../../common';
import { AssistantService, OrderService } from 'kng2-core';

describe('KngFeedbackComponent', () => {
  let component: KngFeedbackComponent;
  let fixture: ComponentFixture<KngFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KngFeedbackComponent ],
      providers: [
        {
          provide: i18n,
          useValue: {
            locale: 'fr',
            label: () => ({ weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi' })
          }
        },
        {
          provide: NotifyService,
          useValue: {
            open: () => undefined
          }
        },
        {
          provide: OrderService,
          useValue: {
            customerInvoices: () => of([]),
            findOrdersByUser: () => of([]),
            requestIssue: () => of({})
          }
        },
        {
          provide: AssistantService,
          useValue: {
            chat: () => of(''),
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KngFeedbackComponent);
    component = fixture.componentInstance;
    component.config = {
      shared: {
        hub: {},
        hubs: []
      }
    } as any;
    component.user = { id: 0 } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
