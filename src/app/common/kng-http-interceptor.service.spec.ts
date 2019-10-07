import { TestBed } from '@angular/core/testing';

import { KngHttpInterceptorService } from './kng-http-interceptor.service';

describe('KngHttpInterceptorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KngHttpInterceptorService = TestBed.get(KngHttpInterceptorService);
    expect(service).toBeTruthy();
  });
});
