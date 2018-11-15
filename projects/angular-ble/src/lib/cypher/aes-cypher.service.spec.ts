import { TestBed, inject } from '@angular/core/testing';

import { CypherAesService } from './cypher-aes.service';

describe('AesCypherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CypherAesService]
    });
  });

  it('should be created', inject([CypherAesService], (service: CypherAesService) => {
    expect(service).toBeTruthy();
  }));

  it('throw error when call encrypt without config', inject([CypherAesService], (service: CypherAesService) => {
    expect(function () { service.encrypt(new Uint8Array(16)); }).
      toThrow(new Error('Must configurate cypher-aes before call this method, use the method config()'));
  }));

  it('throw error when call decrypt without config', inject([CypherAesService], (service: CypherAesService) => {
    expect(function () { service.decrypt(new Uint8Array(16)); }).
      toThrow(new Error('Must configurate cypher-aes before call this method, use the method config()'));
  }));

  it('encrypt with def config', inject([CypherAesService], (service: CypherAesService) => {
    service.config([0x41, 0x43, 0x52, 0x31, 0x32, 0x35, 0x35, 0x55, 0x2D, 0x4A, 0x31, 0x20, 0x41, 0x75, 0x74, 0x68]);
    expect([55, 170, 117, 158, 245, 237, 15, 60, 243, 193, 110, 19, 192, 66, 140, 38])
      .toEqual(Array.from(service.encrypt(service.textToBytes('TextMustBe16Byte'))));
  }));

  it('decrypt with def config', inject([CypherAesService], (service: CypherAesService) => {
    service.config([0x41, 0x43, 0x52, 0x31, 0x32, 0x35, 0x35, 0x55, 0x2D, 0x4A, 0x31, 0x20, 0x41, 0x75, 0x74, 0x68]);
    expect('TextMustBe16Byte')
      .toEqual(service.bytesToText(service.decrypt(new Uint8Array([55,
        170, 117, 158, 245, 237, 15, 60, 243, 193, 110, 19, 192, 66, 140, 38]))));
  }));

  it('encrypt with initial vector', inject([CypherAesService], (service: CypherAesService) => {
    service.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ],
      [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ]);
    expect([16, 79, 176, 115, 249, 161, 49, 242, 202, 180, 145, 132, 187, 134, 76, 162])
      .toEqual(Array.from(service.encrypt(service.textToBytes('TextMustBe16Byte'))));
  }));

  it('decrypt with initial vector', inject([CypherAesService], (service: CypherAesService) => {
    service.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ],
      [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ]);
    expect('TextMustBe16Byte')
      .toEqual(service.bytesToText(
        service.decrypt(new Uint8Array([16, 79, 176, 115, 249, 161, 49, 242, 202, 180, 145, 132, 187, 134, 76, 162]))));
  }));

  it('encrypt with method CTR', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], undefined, 'CTR', {counter: 5});
    expect([143, 148, 252, 101, 14, 212, 112, 111, 121,
      19, 78, 143, 174, 156, 210, 4, 246, 31, 104, 126, 222, 170, 190, 21, 112, 94, 124, 48
      , 58, 166, 224, 223, 52, 66, 62, 233, 223, 77, 149, 189, 71, 231, 80, 228, 146, 178,
      173, 8, 215, 99, 175, 0, 35, 20, 27, 187])
      .toEqual(Array.from(service.encrypt(service.textToBytes('Text may be any length you wish, no padding is required.'))));
  }));

  it('decrypt with method CTR', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], undefined, 'CTR', {counter: 5});
    expect('Text may be any length you wish, no padding is required.')
      .toEqual(service.bytesToText(service.decrypt(new Uint8Array([143, 148, 252, 101, 14, 212, 112, 111, 121,
        19, 78, 143, 174, 156, 210, 4, 246, 31, 104, 126, 222, 170, 190, 21, 112, 94, 124, 48
        , 58, 166, 224, 223, 52, 66, 62, 233, 223, 77, 149, 189, 71, 231, 80, 228, 146, 178,
        173, 8, 215, 99, 175, 0, 35, 20, 27, 187]))));
  }));

  it('encrypt with method CFB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'CFB', { segmentSize: 8 });
    expect([85, 227, 175, 38, 56, 197, 96, 180, 253, 185, 210, 106, 99, 7, 51, 234, 96, 25, 126, 194,
      61, 235, 133, 177, 246, 15, 113, 241, 4, 9, 206, 39])
      .toEqual(Array.from(service.encrypt(service.textToBytes('TextMustBeAMultipleOfSegmentSize'))));
  }));

  it('decrypt with method CFB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'CFB', { segmentSize: 8 });
    expect('TextMustBeAMultipleOfSegmentSize')
      .toEqual(service.bytesToText(service.decrypt(new Uint8Array([85, 227, 175,
        38, 56, 197, 96, 180, 253, 185, 210, 106, 99, 7, 51, 234, 96, 25, 126, 194,
        61, 235, 133, 177, 246, 15, 113, 241, 4, 9, 206, 39]))));
  }));

  it('encrypt with method OFB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'OFB');
    expect([85, 227, 175, 38, 85, 221, 114, 185, 243, 36, 86, 4, 47, 57, 186, 233,
      172, 207, 246, 37, 145, 89, 230, 8, 190, 85, 161, 170, 49, 60, 89, 141, 180,
      177, 132, 6, 216, 156, 131, 132, 28, 157, 26, 241, 59, 86, 222, 142, 218, 143, 207, 233, 236, 142, 117, 232])
      .toEqual(Array.from(service.encrypt(service.textToBytes('Text may be any length you wish, no padding is required.'))));
  }));

  it('decrypt with method OFB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'OFB');
    expect('Text may be any length you wish, no padding is required.')
      .toEqual(service.bytesToText(service.decrypt(new Uint8Array([85, 227, 175, 38, 85, 221, 114, 185, 243, 36, 86, 4, 47, 57, 186, 233,
        172, 207, 246, 37, 145, 89, 230, 8, 190, 85, 161, 170, 49, 60, 89, 141, 180,
        177, 132, 6, 216, 156, 131, 132, 28, 157, 26, 241, 59, 86, 222, 142, 218, 143, 207, 233, 236, 142, 117, 232]))));
  }));

  it('encrypt with method ECB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      undefined, 'ECB');
    expect([167, 217, 59, 53, 54, 133, 25, 250, 195, 71, 73, 141, 236, 24, 180, 88])
      .toEqual(Array.from(service.encrypt(service.textToBytes('TextMustBe16Byte'))));
  }));

  it('decrypt with method ECB', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      undefined, 'ECB');
    expect('TextMustBe16Byte')
      .toEqual(service.bytesToText(service.decrypt(new Uint8Array([167, 217, 59, 53, 54,
        133, 25, 250, 195, 71, 73, 141, 236, 24, 180, 88]))));
  }));

  it('encrypt using padding', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect([236, 2, 2, 7, 71, 241, 150, 122, 27, 78, 208, 65, 141, 177, 4, 168,
      223, 34, 190, 63, 154, 249, 12, 171, 183, 175, 108, 70, 20, 177, 95, 35])
      .toEqual(Array.from(service.encrypt(service.textToBytes('Text must be using padding'))));
  }));

  it('generate cmac', inject([CypherAesService], (service: CypherAesService) => {
    service.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const result = service.aesCmac(
      new Uint8Array([0x6b, 0x33, 0x4d, 0x65, 0x6e, 0x2a, 0x70, 0x2f, 0x32, 0x2e, 0x33, 0x6a, 0x34, 0x61, 0x62, 0x42]),
      new Uint8Array([0x74, 0x68, 0x69, 0x73, 0x7c, 0x69, 0x73, 0x7c,
        0x61, 0x7c, 0x74, 0x65, 0x73, 0x74, 0x7c, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65]));
    expect([236, 2, 2, 7, 71, 241, 150, 122, 27, 78, 208, 65, 141, 177, 4, 168,
      223, 34, 190, 63, 154, 249, 12, 171, 183, 175, 108, 70, 20, 177, 95, 35])
      .toEqual(Array.from(service.encrypt(service.textToBytes('Text must be using padding'))));
  }));





});
