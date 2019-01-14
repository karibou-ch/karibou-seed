import { TestBed } from '@angular/core/testing';

import { KngDocumentLoaderService } from './kng-document-loader.service';

describe('KngDocumentLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KngDocumentLoaderService = TestBed.get(KngDocumentLoaderService);
    expect(service).toBeTruthy();
  });
});
