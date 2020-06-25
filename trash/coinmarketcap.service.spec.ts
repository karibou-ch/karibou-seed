import { TestBed, inject } from '@angular/core/testing';

import { CoinmarketcapService } from './coinmarketcap.service';

describe('CoinmarketcapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoinmarketcapService]
    });
  });

  it('should be created', inject([CoinmarketcapService], (service: CoinmarketcapService) => {
    expect(service).toBeTruthy();
  }));
});
