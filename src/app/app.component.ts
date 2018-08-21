import { Component, OnInit } from '@angular/core';
import { CypherAesService } from 'angular-ble';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  valueToEncrypt = '';
  encryptedHex = '';
  encryptedBytes = '';
  valueToDecrypt = '';
  decryptedHex = '';
  decryptedBytes = '';
  decryptedText = '';
  constructor(private cypherAesService: CypherAesService) {}

  title = 'angular-ble-app';

  ngOnInit(): void {
  }

  encryptValue() {
    this.cypherAesService.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]);
    const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(this.valueToEncrypt));
    this.encryptedHex = this.cypherAesService.bytesTohex(encryptedValue);
    this.encryptedBytes = '[' + Array.from(encryptedValue).toString() + ']';
  }

  decryptValue() {
    this.cypherAesService.config([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]);
    const decryptedValue = this.cypherAesService.decrypt(this.cypherAesService.hexToBytes(this.valueToDecrypt));
    this.decryptedHex = this.cypherAesService.bytesTohex(decryptedValue);
    this.decryptedBytes = '[' + Array.from(decryptedValue).toString() + ']';
    this.decryptedText = this.cypherAesService.bytesToText(decryptedValue);
  }
}
