import { Injectable } from '@angular/core';
import { BluetoothService } from '../bluetooth/bluetooth.service';

@Injectable()
export class BrowserWebBluetooth {
  public _ble;

  constructor() {
    this._ble = navigator.bluetooth;
    if (!this._ble) {
      console.log('error cargando bluetooth');
      // bluetoothService.setBluetoothAvailable(false);
      // throw new Error('Your browser does not support Smart Bluetooth. See http://caniuse.com/#search=Bluetooth for more details.');
    } else {
      // bluetoothService.setBluetoothAvailable(true);
    }
  }

  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice> {
    return this._ble.requestDevice(options);
  }
}
