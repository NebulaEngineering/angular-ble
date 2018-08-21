![NebulaE](docs/images/nebula.png 'Nebula Engineering SAS')

# @nebulae/angular-ble

The general purpose of this service is establish a communication channel between two devices using Bluetooth specifically implementing the [GATT](https://www.bluetooth.com/specifications/gatt/generic-attributes-overview)
protocol
, additionally, the library exposes multiple tools to facilitate the encrypt and decrypt, currently just is implemented the AES protocol using CBC, CTR, ECB, CFB and OFB modes of operation.

# Table of Contents

- [Installation](#installation)
- [AES cypher](#aes_cypher)
  - [Keys](#keys)
  - [Exposed Methods](#exposed_Methods)
    - [Common Modes of Operation](#common_modes_of_operation)
      - [CTR - Counter](#ctr)
      - [CBC - Cipher-Block Chaining](#cbc)
      - [CFB - Cipher Feedback](#cfb)
      - [OFB - Output Feedback](#ofb)
      - [ECB - Electronic Codebook](#ecb)
    - [Utils](#utils)
      - [config](#config)
      - [encrypt](#encrypt)
      - [changeInitialVector](#changeInitialVector)
      - [changeEncryptMethod](#changeEncryptMethod)
      - [changeStaticInitialVector](#changeStaticInitialVector)
      - [changeMasterKey](#changeMasterKey)
      - [textToBytes](#textToBytes)
      - [bytesToText](#bytesToText)
      - [bytesTohex](#bytesTohex)
      - [hexToBytes](#hexToBytes)
- [Bluetooth BLE](#aes_cypher)

# Installation <a name="installation"></a>

to install `@nebulae/angular-ble` library in your angular project just execute the command

```
npm install @nebulae/angular-ble
```

## Use it

- Import the `AngularBleModule` module

```javascript
import { NgModule } from '@angular/core';
import { AngularBleModule } from 'angular-ble';

import { AppComponent } from './app.component';

@NgModule({
  imports: [
    //...,
    AngularBleModule
  ]
  //...,
})
export class AppModule {}
```

- Use AES cypher in your service/component

  here is an annotated example using the `@nebulae/angular-ble` cypher service

  ```javascript
  import { Component, OnInit } from '@angular/core';
  import { CypherAesService } from 'angular-ble';
  @Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
  })
  export class AppComponent implements OnInit {
  // input value used to encrypt
  valueToEncrypt = '';
  // encrypted value converted to hex
  encryptedHex = '';
  // encrypted value converted to bytes
  encryptedBytes = '';
  // input value used to decrypt
  valueToDecrypt = '';
  // decrypted value converted to hex
  decryptedHex = '';
  // decrypted value converted to bytes
  decryptedBytes = '';
  // decrypted value converted to text
  decryptedText = '';
  constructor(private cypherAesService: CypherAesService) {}

  title = 'angular-ble-app';

  ngOnInit(): void {
  }

  encryptValue() {
    // Call this method to configurate the aes service
    this.cypherAesService.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]);
    /* Next to it call the service and specifically the method called encrypt, this returns an Uint8Array than contains the encrypted input value.
    The encrypt method only receives Uint8Array or Uint16Array or Uint32Array, because of this the text is parsed to Uint8Array
    */
    const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(this.valueToEncrypt));
    this.encryptedHex = this.cypherAesService.bytesTohex(encryptedValue);
    this.encryptedBytes = '[' + Array.from(encryptedValue).toString() + ']';
  }

  decryptValue() {
    // Call this method to configurate the aes service
    this.cypherAesService.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]);
    /* Next to it call the service and specifically the method called decrypt, this returns an Uint8Array than contains the decrypted input value.
    To this example the input receives an encrypted hexa. but the decrypt method only receives Uint8Array or Uint16Array or Uint32Array, because of this the hexa is parsed to Uint8Array
    */
    const decryptedValue = this.cypherAesService.decrypt(this.cypherAesService.hexToBytes(this.valueToDecrypt));
    this.decryptedHex = this.cypherAesService.bytesTohex(decryptedValue);
    this.decryptedBytes = '[' + Array.from(decryptedValue).toString() + ']';
    this.decryptedText = this.cypherAesService.bytesToText(decryptedValue);
  }
  }
  ```

  # AES cypher <a name="aes_cypher"></a>

  This service use as base the library [aes-js](https://www.npmjs.com/package/aes-js)
  ## Keys <a name="keys"></a>

    All keys must be 128 bits (16 bytes), 192 bits (24 bytes) or 256 bits (32 bytes) long.

    The library work with Array, Uint8Array and Buffer objects as well as any array-like object (i.e. must have a length property, and have a valid byte value for each entry).

  ```javascript
    // 128-bit, 192-bit and 256-bit keys
    const key_128 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const key_192 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
               16, 17, 18, 19, 20, 21, 22, 23];
    const key_256 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
               16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
               29, 30, 31];
    // or, you may use Uint8Array:
    const key_128_array = new Uint8Array(key_128);
    const key_192_array = new Uint8Array(key_192);
    const key_256_array = new Uint8Array(key_256);
  ```

  ## Exposed Methods <a name="exposed_Methods"></a>
  ### Common Modes of Operation <a name="common_modes_of_operation"></a>
  There are several modes of operations, each with various pros and cons. In general though, the **CBC** and **CTR** modes are recommended. The **ECB is NOT recommended.**, and is included primarily for completeness.

  #### CTR - Counter (recommended) <a name="ctr"></a>
  ```javascript
  const textToEncrypt = 'Text may be any length you wish, no padding is required.';
  // An example 128-bit key (16 bytes * 8 bits/byte = 128 bits), CTR doesnt require inital vector so this param is passed as undefined and as additional param is added the value counter (required)
  this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], undefined, 'CTR', {counter: 5});
  const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(textToEncrypt));

  console.log(encryptedValue);
  //The result must be: [143, 148, 252, 101, 14, 212, 112, 111, 121,
  //    19, 78, 143, 174, 156, 210, 4, 246, 31, 104, 126, 222, 170, 190, 21, 112, 94, 124, 48
  //    , 58, 166, 224, 223, 52, 66, 62, 233, 223, 77, 149, 189, 71, 231, 80, 228, 146, 178,
  //    173, 8, 215, 99, 175, 0, 35, 20, 27, 187]


  // When ready to decrypt the data, use the decrypt method
  const decryptedValue = this.cypherAesService.decrypt(new Uint8Array([143, 148, 252, 101, 14, 212, 112, 111, 121,
        19, 78, 143, 174, 156, 210, 4, 246, 31, 104, 126, 222, 170, 190, 21, 112, 94, 124, 48
        , 58, 166, 224, 223, 52, 66, 62, 233, 223, 77, 149, 189, 71, 231, 80, 228, 146, 178,
        173, 8, 215, 99, 175, 0, 35, 20, 27, 187]));
  console.log(this.cypherAesService.bytesToText(decryptedValue));
  //The result must be: Text may be any length you wish, no padding is required.
  ```
  #### CBC - Cipher-Block Chaining (recommended) <a name="cbc"></a>
  ```javascript
  // If the text is not a 16 byte size, the library use a padding method to fill the missing with 0xFF
  const textToEncrypt = 'TextMustBe16Byte';
  // An example 128-bit key
  // The initialization vector must be 16 bytes (this value is optional, the predefined value is a 16 bytes iv empty 0xFF)
  // The CBC method is the default so doesn't is necessary set the method type
  this.cypherAesService.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ],
      [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ]);
  const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(textToEncrypt));

  console.log(encryptedValue);
  //The result must be: [16, 79, 176, 115, 249, 161, 49, 242, 202, 180, 145, 132, 187, 134, 76, 162]


  // When ready to decrypt the data, use the decrypt method
  const decryptedValue = this.cypherAesService.decrypt(new Uint8Array([16, 79, 176, 115, 249, 161, 49, 242, 202, 180, 145, 132, 187, 134, 76, 162]));
  console.log(this.cypherAesService.bytesToText(decryptedValue));
  //The result must be: TextMustBe16Byte.
  ```

  #### CFB - Cipher Feedback <a name="cfb"></a>
  ```javascript
  // the text must be multiple of the segment size assigned
  const textToEncrypt = 'TextMustBeAMultipleOfSegmentSize';
  // An example 128-bit key
  // The initialization vector must be 16 bytes (this value is optional, the predefined value is a 16 bytes iv empty 0xFF)
  // As additional param is added the value segmentSize (required)
  this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'CFB', { segmentSize: 8 });
  const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(textToEncrypt));

  console.log(encryptedValue);
  //The result must be: [85, 227, 175, 38, 56, 197, 96, 180, 253, 185, 210, 106, 99, 7, 51, 234, 96, 25, 126, 194,
  //      61, 235, 133, 177, 246, 15, 113, 241, 4, 9, 206, 39]


  // When ready to decrypt the data, use the decrypt method
  const decryptedValue = this.cypherAesService.decrypt(new Uint8Array([85, 227, 175, 38, 56, 197, 96, 180, 253, 185, 210, 106, 99, 7, 51, 234, 96, 25, 126, 194, 61, 235, 133, 177, 246, 15, 113, 241, 4, 9, 206, 39]));
  console.log(this.cypherAesService.bytesToText(decryptedValue));
  //The result must be: TextMustBeAMultipleOfSegmentSize.
  ```

  #### OFB - Output Feedback <a name="ofb"></a>
  ```javascript

  const textToEncrypt = 'Text may be any length you wish, no padding is required.';
  // An example 128-bit key
  // The initialization vector must be 16 bytes (this value is optional, the predefined value is a 16 bytes iv empty 0xFF)
  this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 'OFB');
  const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(textToEncrypt));

  console.log(encryptedValue);
  //The result must be: [85, 227, 175, 38, 85, 221, 114, 185, 243, 36, 86, 4, 47, 57, 186, 233,
  //    172, 207, 246, 37, 145, 89, 230, 8, 190, 85, 161, 170, 49, 60, 89, 141, 180,
  //    177, 132, 6, 216, 156, 131, 132, 28, 157, 26, 241, 59, 86, 222, 142, 218, 143, 207, 233, 236, 142, 117, 232]


  // When ready to decrypt the data, use the decrypt method
  const decryptedValue = this.cypherAesService.decrypt(new Uint8Array([85, 227, 175, 38, 85, 221, 114, 185, 243, 36, 86, 4, 47, 57, 186, 233,
      172, 207, 246, 37, 145, 89, 230, 8, 190, 85, 161, 170, 49, 60, 89, 141, 180,
      177, 132, 6, 216, 156, 131, 132, 28, 157, 26, 241, 59, 86, 222, 142, 218, 143, 207, 233, 236, 142, 117, 232]));
  console.log(this.cypherAesService.bytesToText(decryptedValue));
  //The result must be: Text may be any length you wish, no padding is required..
  ```

  #### ECB - Electronic Codebook (NOT recommended) <a name="ecb"></a>
  ```javascript
  // If the text is not a 16 byte size, the library use a padding method to fill the missing with 0xFF
  const textToEncrypt = 'TextMustBe16Byte';
  // An example 128-bit key
  // ECB doesnt require inital vector so this param is passed as undefined  
  this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      undefined, 'ECB');
  const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(textToEncrypt));

  console.log(encryptedValue);
  //The result must be: [167, 217, 59, 53, 54,
  //      133, 25, 250, 195, 71, 73, 141, 236, 24, 180, 88]


  // When ready to decrypt the data, use the decrypt method
  const decryptedValue = this.cypherAesService.decrypt(new Uint8Array([167, 217, 59, 53, 54,
        133, 25, 250, 195, 71, 73, 141, 236, 24, 180, 88]));
  console.log(this.cypherAesService.bytesToText(decryptedValue));
  //The result must be: Text may be any length you wish, no padding is required..
  ```

  ### Utils <a name="utils"></a>

  #### config <a name="config"></a>
  This method is used to configurate the params required by the cypher service

  ```javascript
  // key used to encrypt and decrypt (Required) 
  const masterKey = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  // vector used to encrypt abd decrypt except when ECB encrypt method is used (optional)
  const initialVector = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
  // type of encrypt method is used, the possible options are: CBC, CTR, CFB, OFB, ECB (optional)
  const encryptMethod = 'CFB';
  //configuration params used by the selected encrypt method.
  // Note: if the method CTR or CFB is used this param is required otherwise is an optinal param.
  // By CTR require the param counter and by CFB require the param segmentSize
  const additionalEncryptMethodParams = { segmentSize: 8 };
  // defines if the initial vector is changed or not when the data are encrypted or not
  const isStaticInitialVector = true;

  this.cypherAesService.config(masterKey,
      initialVector, encryptMethod, additionalEncryptMethodParams, isStaticInitialVector);
  ```

  #### encrypt <a name="encrypt"></a>
  Encrypt the data using the encrypt method previously configured. The data must be a Uint8Array or Uint16Array or Uint32Array
  ```javascript
  this.cypherAesService.encrypt(dataToEncrypt)
  ```

  #### decrypt <a name="decrypt"></a>
  Decrypt the data using the encrypt method previously configured. The data must be a Uint8Array or Uint16Array or Uint32Array
  ```javascript
  this.cypherAesService.decrypt(dataToDecrypt)
  ```

  #### changeInitialVector <a name="changeInitialVector"></a>
  Change the current initalVector
  ```javascript
  this.cypherAesService.changeInitialVector(newInitalVector)
  ```

  #### changeEncryptMethod <a name="changeEncryptMethod"></a>
  Change the current encyptMethod
  ```javascript
  this.cypherAesService.changeEncryptMethod(newEncryptMethod)
  ```

  #### changeStaticInitialVector <a name="changeStaticInitialVector"></a>
  Change the current isStaticInitialVector
  ```javascript
  this.cypherAesService.changeStaticInitialVector(true|false)
  ```

  #### changeMasterKey <a name="changeMasterKey"></a>
  Change the current masterKey
  ```javascript
  this.cypherAesService.changeMasterKey(newMasterKey)
  ```

  #### textToBytes <a name="textToBytes"></a>
  Convert the text to bytes
  ```javascript
  this.cypherAesService.textToBytes(text)
  ```

  #### bytesToText <a name="bytesToText"></a>
  Convert the bytes to text
  ```javascript
  this.cypherAesService.bytesToText(bytes)
  ```

  #### bytesTohex <a name="bytesTohex"></a>
  Convert the bytes to hex
  ```javascript
  this.cypherAesService.bytesTohex(bytes)
  ```

  #### hexToBytes <a name="hexToBytes"></a>
  Convert the hex to bytes
  ```javascript
  this.cypherAesService.hexToBytes(hex)
  ```
