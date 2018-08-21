![NebulaE](docs/images/nebula.png 'Nebula Engineering SAS')

# @nebulae/angular-ble

The general purpose of this service is establish a communication channel between two devices using Bluetooth specifically implementing the [GATT](https://www.bluetooth.com/specifications/gatt/generic-attributes-overview)
protocol
, additionally, the library exposes multiple tools to facilitate the encrypt and decrypt, currently just is implemented the AES protocol using CBC, CTR, ECB, CFB and OFB modes of operation.

# Table of Contents

- [Installation](#installation)
- [AES cypher](#aes_cypher)
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
