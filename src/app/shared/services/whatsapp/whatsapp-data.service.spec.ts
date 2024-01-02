import { TestBed } from '@angular/core/testing';

import { WhatsappDataService } from './whatsapp-data.service';

describe('WhatsappDataService', () => {
  let service: WhatsappDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsappDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
