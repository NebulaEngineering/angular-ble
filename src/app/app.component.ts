import { Component, OnInit } from '@angular/core';
import { CypherAesService } from 'angular-ble';
import { BluetoothService } from 'angular-ble';
import { mergeMap } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // #region AES_CYPHER_VARIABLES
  valueToEncrypt = '';
  encryptedHex = '';
  encryptedBytes = '';
  valueToDecrypt = '';
  decryptedHex = '';
  decryptedBytes = '';
  decryptedText = '';
  // #endregion

  // #region BLUETOOTH_VARIABLES
  deviceConnected = false;
  batteryLevel = '';
  manufacturerName = '';
  modelNumber = '';
  serialNumber = '';
  hardwareRevision = '';
  firmwareRevision = '';
  softwareRevision = '';
  systemId = '';
  pnpId = '';
  // #endregion

  constructor(private cypherAesService: CypherAesService,
    private bluetoothService: BluetoothService) { }

  title = 'angular-ble-app';

  ngOnInit(): void {
    this.bluetoothService.getDevice$().subscribe(device => {

      this.deviceConnected = device? true : false;
      
    });
  }

  // #region AES_CYPHER_METHODS
  encryptValue() {
    this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const encryptedValue = this.cypherAesService.encrypt(this.cypherAesService.textToBytes(this.valueToEncrypt));
    this.encryptedHex = this.cypherAesService.bytesTohex(encryptedValue);
    this.encryptedBytes = '[' + Array.from(encryptedValue).toString() + ']';
  }

  decryptValue() {
    this.cypherAesService.config([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const decryptedValue = this.cypherAesService.decrypt(this.cypherAesService.hexToBytes(this.valueToDecrypt));
    this.decryptedHex = this.cypherAesService.bytesTohex(decryptedValue);
    this.decryptedBytes = '[' + Array.from(decryptedValue).toString() + ']';
    this.decryptedText = this.cypherAesService.bytesToText(decryptedValue);
  }
  // #endregion


  // #region BLUETOOTH_METHODS

  connectToDevice() {
    this.bluetoothService.connectDevice$().subscribe(res => {});
  }

  disconnectToDevice() {
    this.bluetoothService.disconnectDevice();
  }

  getBatteryLevel() {
    this.bluetoothService.getBatteryLevel$().subscribe(res => {
      console.log('nivel de bateria: ', res);
      this.batteryLevel = res+"";
    })
  }

  getManufacturerName() {
    this.bluetoothService.getManufacturerName$().subscribe(res => {
      this.manufacturerName = res;
      
    });
  }

  getModelNumber() {
    this.bluetoothService.getModelNumber$().subscribe(res => {
      this.modelNumber = res;
      
    });
  }
  getSerialNumber() {
    this.bluetoothService.getSerialNumber$().subscribe(res => {
      this.serialNumber = res;
      
    });
  }

  getHardwareRevision() {
    this.bluetoothService.getHardwareRevision$().subscribe(res => {
      this.hardwareRevision = res;
      
    });
  }

  getFirmwareRevision() {
    this.bluetoothService.getFirmwareRevision$().subscribe(res => {
      this.firmwareRevision = res;
      
    });
  }

  getSoftwareRevision() {
    this.bluetoothService.getSoftwareRevision$().subscribe(res => {
      this.softwareRevision = res;
      
    });
  }

  getSystemId() {
    this.bluetoothService.getSystemId$().subscribe(res => {
      this.systemId = res+"";
      
    });
  }

  getPnpId() {
    this.bluetoothService.getPnpId$().subscribe(res => {
      this.pnpId = res+"";
    });
  }

  startNotifier() {
    this.bluetoothService.startNotifierListener$('battery_service','battery_level').subscribe(result => {
      console.log('stream value: ', result);
    });
  }
  

  
  // #endregion


}
