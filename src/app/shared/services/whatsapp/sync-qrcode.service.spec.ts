import { TestBed } from '@angular/core/testing';

import { SyncQrcodeService } from './sync-qrcode.service';

describe('SyncQrcodeService', () => {
  let service: SyncQrcodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncQrcodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
