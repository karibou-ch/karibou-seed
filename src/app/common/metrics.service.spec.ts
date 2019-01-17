import { TestBed } from '@angular/core/testing';

import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MetricsService = TestBed.get(MetricsService);
    expect(service).toBeTruthy();
  });
});
