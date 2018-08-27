import { Injectable, EventEmitter } from '@angular/core';
import { map, mergeMap, concat, mapTo, filter, takeUntil } from 'rxjs/operators';
import { Observable, forkJoin, Subject, defer, fromEvent, of, from } from "rxjs";
import { GattServices } from './gatt-services';
import { BrowserWebBluetooth } from '../platform/browser';
import { CypherAesService } from '../cypher/cypher-aes.service';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService extends Subject<BluetoothService>{
  public _device$: EventEmitter<BluetoothDevice>;
  private device: BluetoothDevice;
  constructor(public _webBle: BrowserWebBluetooth, private cypherAesService: CypherAesService) {
    super();
    this._device$ = new EventEmitter<BluetoothDevice>();
  }
  /**
   * get the current device, if the device return null is because the connection has lost
   */
  getDevice$(): Observable<BluetoothDevice> {
    return this._device$;
  }
  /**
   * start a stream by notifiers characteristics
   * @param characteristic The characteristic whose value you want to listen
   * @return a DataView than contains the characteristic value
   */
  startNotifierListener$(service, characteristic): Observable<DataView> {
    if (this.device) {
      return this.getPrimaryService$(service).pipe(
        mergeMap(primaryService => this.getCharacteristic$(primaryService, characteristic)),
        mergeMap((char: BluetoothRemoteGATTCharacteristic) => {
          return fromEvent(char, 'characteristicvaluechanged').pipe(
            takeUntil(fromEvent(char,'gattserverdisconnected')),
            map((event: Event) => (event.target as BluetoothRemoteGATTCharacteristic).value as DataView) 
          )
        })
      )
    }
    else {
      throw new Error(
        'Must start a connection to a device before read the device value'
      );
    }
  }
/**
 * Start a request to the browser to list all available bluetooth devices
 * @param options Options to request the devices
 */
  private discoverDevice$(options: RequestDeviceOptions = {} as RequestDeviceOptions) {
    return defer(() => this._webBle.requestDevice(options)).pipe(
      mergeMap(device => {
        return defer(() => {
          device.addEventListener('gattserverdisconnected', this.onDeviceDisconnected.bind(this));
          this.device = device;
          this._device$.emit(device);
          return of(device);
        });
      })
    );

  }
  /**
   * Discover all available devices and connect to a selected device
   * @param options Options to request the devices the structure is:
   * acceptAllDevices: true|false
   * filters: BluetoothDataFilterInit (see https://webbluetoothcg.github.io/web-bluetooth/#dictdef-bluetoothlescanfilterinit for more info)
   * optionalServices: [] (services that are going to be used in communication with the device, must use the UIID or GATT identfier to list ther services) 
   */
  connectDevice$(options?: RequestDeviceOptions) {
    if (!options) {
      options = {
        acceptAllDevices: true,
        optionalServices: [GattServices.GENERIC_ACCESS.SERVICE,GattServices.BATTERY.SERVICE, GattServices.DEVICE_INFORMATION.SERVICE]
      };
    }
    else {
      options.optionalServices.push(GattServices.GENERIC_ACCESS.SERVICE);
      options.optionalServices.push(GattServices.BATTERY.SERVICE);
      options.optionalServices.push(GattServices.DEVICE_INFORMATION.SERVICE);
    }
    return this.discoverDevice$(options).pipe(
      mergeMap(device => {
        return defer(() => device.gatt.connect())
      })
    );
  }
  /**
   * Disconnect the current device
   */
  disconnectDevice() {
    this.device.gatt.disconnect();
  }

  /**
   * Event that listen when the device connection is lost
   * @param event
   */
  private onDeviceDisconnected(event: Event) {
    this.device = null;
    this._device$.emit(null);
  }
  /**
   * get a data from the device using the characteristic
   * @param service UUID or GATT identifier service
   * @param characteristic UUID or GATT identifier characteristic
   * @return The characteristic data in a DataView object
   */
  readDeviceValue$(service, characteristic) {
    if (this.device) {
      return this.getPrimaryService$(service).pipe(
        mergeMap(primaryService => this.getCharacteristic$(primaryService, characteristic)),
        mergeMap((characteristicValue: BluetoothRemoteGATTCharacteristic) => this.readValue$(characteristicValue))
      );
    }
    else {
      throw new Error(
        'Must start a connection to a device before read the device value'
      );
    }
  }

  /**
   * write a value in the selected characteristic
  * @param characteristic the characterisitc where you want write the value
  * @param value the value to write
  * @return
  */
  writeDeviceValue$(service, characteristic, value) {
    if (this.device) {
      return this.getPrimaryService$(service).pipe(
        mergeMap(primaryService => this.getCharacteristic$(primaryService, characteristic)),
        mergeMap((characteristicValue: BluetoothRemoteGATTCharacteristic) => this.writeValue$(characteristicValue, value))
      );
    }
    else {
      throw new Error(
        'Must start a connection to a device before read the device value'
      );
    }
  }


  /**
   * get a primary service instance using the service UIID or GATT identifier
   * @param service service identifier
   * @return service instance
   */
  getPrimaryService$(service: BluetoothServiceUUID) {
    return of(this.device).pipe(mergeMap(device => {
      return device.gatt.getPrimaryService(service);
    }));
  }

  /**
   * Get a characterisitic instance using the service instance and a characteristic UUID
   * @param primaryService service instance
   * @param characteristic characterisitic identifier
   * @return characteristic instance
   */
  getCharacteristic$(
    primaryService: BluetoothRemoteGATTService,
    characteristic: BluetoothCharacteristicUUID
  ): Observable<void | BluetoothRemoteGATTCharacteristic> {
    return defer(() => primaryService.getCharacteristic(characteristic));
  }



  /**
   * read the characteristic value
   * @param characteristic characteristic instance
   * @return The characteristic data in a DataView object
   */
  private readValue$(characteristic: BluetoothRemoteGATTCharacteristic): Observable<DataView> {
    return from(
      characteristic
        .readValue()
        .then((data: DataView) => Promise.resolve(data), (error: DOMException) => Promise.reject(`${error.message}`))
    );
  }

  /**
   * write a value in the selected characteristic
  * @param characteristic the characterisitc where you want write the value
  * @param value the value to write
  * @return
  */
  private writeValue$(characteristic: BluetoothRemoteGATTCharacteristic, value: ArrayBuffer | Uint8Array) {
    return from(characteristic.writeValue(value).then(_ => Promise.resolve(), (error: DOMException) => Promise.reject(`${error.message}`)));
  }

  /**
 * change the state of the characteristic to enable it
 * @param service  parent service of the characteristic
 * @param characteristic characteristic to change the state
 * @param state new state
 */
  enableCharacteristic$(service: BluetoothServiceUUID, characteristic: BluetoothCharacteristicUUID, state?: any) {
    state = state || new Uint8Array([1]);
    return this.setCharacteristicState$(service, characteristic, state);
  }

  /**
   * change the state of the characteristic to disable it
   * @param service  parent service of the characteristic
   * @param characteristic characteristic to change the state
   * @param state new state
   */
  disbaleCharacteristic$(service: BluetoothServiceUUID, characteristic: BluetoothCharacteristicUUID, state?: any) {
    state = state || new Uint8Array([0]);
    return this.setCharacteristicState$(service, characteristic, state);
  }

  /**
   * set a state to an specific characteristic
   * @param service parent service of the characteristic
   * @param characteristic characteristic to change the state
   * @param state new state
   * @return
   */
  setCharacteristicState$(service: BluetoothServiceUUID, characteristic: BluetoothCharacteristicUUID, state: ArrayBuffer) {
    const primaryService = this.getPrimaryService$(service);
    return primaryService
      .pipe(
        mergeMap(_primaryService => this.getCharacteristic$(_primaryService, characteristic)),
        map((_characteristic: BluetoothRemoteGATTCharacteristic) => this.writeValue$(_characteristic, state))
      )
  }

  /**
   * Send a message using a notifier characteristic
   * @param message message to send
   * @param service service to which the characteristic belongs
   * @param characteristic feature in which you want to send the notification
   */
  sendToNotifier$(message, service, characteristic) {
    return this.getPrimaryService$(service).pipe(
      mergeMap((service: BluetoothRemoteGATTService) => this.getCharacteristic$(service, characteristic)),
      mergeMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
        if (message.length > 16) {
          let obsTest = of(undefined);
          while (message.length > 16) {
            obsTest = obsTest.pipe(
              concat(this.writeValue$(characteristic, message.slice(0, 16)))
            );
            message = message.slice(16, message.length);
          }
          if (message.length > 0) {
            obsTest = obsTest.pipe(
              concat(this.writeValue$(characteristic, message))
            );
          }
          return obsTest;
        } else {
          return this.writeValue$(characteristic, message);
        }
      })
    );
  }
  /**
   * The Battery Level characteristic is read using the GATT Read Characteristic
   *  Value sub-procedure and returns the current battery level as a percentage
   *  from 0% to 100%; 0% represents a battery that is fully discharged, 100% 
   * represents a battery that is fully charged
   */
  getBatteryLevel$() {
    return this.readDeviceValue$(GattServices.BATTERY.SERVICE, GattServices.BATTERY.BATTERY_LEVEL).pipe(
      map(value => value.getUint8(0))
    );
  }
  /**
   * This characteristic represents the name of the manufacturer of the device.
   */
  getManufacturerName$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.MANUFACTURER_NAME).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the model number that is assigned by the device vendor.
   */
  getModelNumber$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.MODEL_NUMBER).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the serial number for a particular instance of the device.
   */
  getSerialNumber$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.SERIAL_NUMBER).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the hardware revision for the hardware within the device.
   */
  getHardwareRevision$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.HARDWARE_REVISION).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the firmware revision for the firmware within the device.
   */
  getFirmwareRevision$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.FIRMWARE_REVISION).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the software revision for the software within the device.
   */
  getSoftwareRevision$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.SOFTWARE_REVISION).pipe(
      map(dataView => this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents a structure containing an Organizationally Unique Identifier
   *  (OUI) followed by a manufacturer-defined identifier and is unique for each individual instance of the product.
   */
  getSystemId$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.SYSTEM_ID);
  }
  /**
   * The PnP_ID characteristic is a set of values used to create a device ID value that is unique for this device.
   */
  getPnpId$() {
    return this.readDeviceValue$(GattServices.DEVICE_INFORMATION.SERVICE, GattServices.DEVICE_INFORMATION.PNP_ID);
  }



}