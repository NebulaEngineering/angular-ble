import { TestBed, inject } from '@angular/core/testing';

import { AngularBleService } from './angular-ble.service';

describe('AngularBleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AngularBleService]
    });
  });

  it('should be created', inject([AngularBleService], (service: AngularBleService) => {
    expect(service).toBeTruthy();
  }));
});
