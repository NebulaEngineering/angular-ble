import { Injectable } from '@angular/core';
import { BluetoothCore } from '@manekinekko/angular-web-bluetooth';
import { map, mergeMap } from 'rxjs/operators';
import { GattServices } from './gatt-services';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  constructor(public ble: BluetoothCore) {}

  test() {
    return GattServices.BATTERY.SERVICE;
  }
  /**
   * Get the connected device
   */
  getDevice() {
    return this.ble.getDevice$();
  }
  /**
   *  get a stream of values emitted by the device
   */
  streamDeviceValues() {
    return this.ble
      .streamValues$()
      .pipe(map((value: DataView) => value.getUint8(0)));
  }

    /**
   * Get Battery Level GATT Characteristic value.
   *
   * @return Emites the value of the requested service read from the device
   */
  getBatteryLevel() {
    console.log('Getting Battery Service...');

    try {
      return (
        this.ble

          // 1) call the discover method will trigger the discovery process (by the browser)
          .discover$({
            acceptAllDevices: true,
            optionalServices: ['battery_service']
          })
          .pipe(
            // 2) get that service
            mergeMap((gatt: BluetoothRemoteGATTServer) => {
              return this.ble.getPrimaryService$(gatt, 'battery_service');
            }),
            // 3) get a specific characteristic on that service
            mergeMap((primaryService: BluetoothRemoteGATTService) => {
              return this.ble.getCharacteristic$(primaryService, 'battery_level');
            }),
            // 4) ask for the value of that characteristic (will return a DataView)
            mergeMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
              return this.ble.readValue$(characteristic);
            }),
            // 5) on that DataView, get the right value
            map((value: DataView) => value.getUint8(0))
          )
      );
    } catch (e) {
      console.error('Oops! can not read value from %s');
    }
  }
}
