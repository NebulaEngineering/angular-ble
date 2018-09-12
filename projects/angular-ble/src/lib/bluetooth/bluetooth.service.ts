import { Injectable, EventEmitter } from '@angular/core';
import {
  map,
  mergeMap,
  concat,
  mapTo,
  filter,
  takeUntil,
  bufferToggle,
  scan,
  tap,
  take,
  timeout
} from 'rxjs/operators';
import {
  Observable,
  forkJoin,
  Subject,
  defer,
  fromEvent,
  of,
  from,
  interval
} from 'rxjs';
import { GattServices } from './gatt-services';
import { BrowserWebBluetooth } from '../platform/browser';
import { CypherAesService } from '../cypher/cypher-aes.service';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService extends Subject<BluetoothService> {
  public _device$: EventEmitter<BluetoothDevice>;
  private device: BluetoothDevice;
  private notifierListenerVsSubscriber = {};
  private notifierSubject = new Subject();
  constructor(
    public _webBle: BrowserWebBluetooth,
    private cypherAesService: CypherAesService
  ) {
    super();
    this._device$ = new EventEmitter<BluetoothDevice>();
  }
  /**
   * get the current device, if the device return null is because the connection has lost
   * @returns the current connceted device
   */
  getDevice$(): Observable<BluetoothDevice> {
    return this._device$;
  }
  /**
   * start a stream by notifiers characteristics
   * @param service The service to which the characteristic belongs
   * @param characteristic The characteristic whose value you want to listen
   * @param options object that contains the
   * startByte:number (required), stopByte:number (required),
   * lengthPosition: { start: number, end: number, lengthPadding: number } (required)
   * @returns A DataView than contains the characteristic value
   */
  startNotifierListener$(service, characteristic, options) {
    return of(service).pipe(
      map(serviceUiid => {
        // checks are a valid device connection
        if (!this.device) {
          throw new Error(
            'Must start a connection to a device before read the device value'
          );
        }
        if (
          !options ||
          !options.startByte ||
          !options.stopByte ||
          !options.lengthPosition
        ) {
          throw new Error(
            'invalid options object, Sample: {startByte: 0x01, stopByte: 0x03, messageType: 0x45, lengthPosition: { start: 0, end: 0 } }'
          );
        }
        return this.getPrimaryService$(serviceUiid)
          .pipe(
            mergeMap(primaryService =>
              this.getCharacteristic$(primaryService, characteristic)
            ),
            mergeMap((char: BluetoothRemoteGATTCharacteristic) => {
              return defer(() => {
                // enable the characteristic notifier
                return char.startNotifications();
              }).pipe(
                mergeMap(_ => {
                  // start the lister from the even characteristicvaluechanged to get all changes on the specific
                  // characteristic
                  return fromEvent(char, 'characteristicvaluechanged').pipe(
                    takeUntil(fromEvent(char, 'gattserverdisconnected')),
                    map((event: Event) => {
                      // get a event from the characteristic and map that
                      return {
                        startByteMatches: false,
                        stopByteMatches: false,
                        lengthMatches: false,
                        messageLength: 0,
                        data: Array.from(
                          new Uint8Array(
                            ((event.target as BluetoothRemoteGATTCharacteristic)
                              .value as DataView).buffer
                          )
                        )
                      };
                    }),
                    scan(
                      (acc, value) => {
                        // if the current accumulator value is a valid message, then is restarted to get the next
                        // message
                        if (
                          acc.lengthMatches &&
                          acc.startByteMatches &&
                          acc.stopByteMatches
                        ) {
                          acc = {
                            startByteMatches: false,
                            stopByteMatches: false,
                            lengthMatches: false,
                            messageLength: 0,
                            data: []
                          };
                        }
                        // validate the start byte
                        if (
                          !acc.startByteMatches &&
                          value.data[0] === options.startByte
                        ) {
                          // get the message length using the start and end position
                          acc.messageLength =
                            new DataView(
                              new Uint8Array(
                                value.data.slice(
                                  options.lengthPosition.start,
                                  options.lengthPosition.end
                                )
                              ).buffer
                            ).getInt16(0, false) +
                            (options.lengthPosition.lengthPadding
                              ? options.lengthPosition.lengthPadding
                              : 0);
                          // valid that the initial byte was found
                          acc.startByteMatches = true;
                        }
                        if (
                          !acc.stopByteMatches &&
                          value.data[value.data.length - 1] === options.stopByte
                        ) {
                          // valid that the end byte was found
                          acc.stopByteMatches = true;
                        }
                        // merge the new data bytes to the old bytes
                        acc.data = acc.data.concat(value.data);
                        acc.lengthMatches =
                          acc.startByteMatches &&
                          acc.stopByteMatches &&
                          acc.messageLength === acc.data.length;
                        return acc;
                      },
                      {
                        startByteMatches: false,
                        stopByteMatches: false,
                        lengthMatches: false,
                        messageLength: 0,
                        data: []
                      }
                    ),
                    // only publish the complete and valid message
                    filter(
                      data =>
                        data.lengthMatches &&
                        data.startByteMatches &&
                        data.stopByteMatches
                    ),
                    // remove all custom data and publish the message data
                    map(result => result.data)
                  );
                })
              );
            })
          )
          .subscribe(message => {
            this.notifierSubject.next(message);
          });
      }),
      // asociate the subscription to the characteristic
      map(sub => {
        const characterisitcVsSubscriber = {};
        characterisitcVsSubscriber[characteristic] = sub;
        return characterisitcVsSubscriber;
      }),
      // asociate the characteristic to the service
      map(charVsSub => {
        this.notifierListenerVsSubscriber[service] = charVsSub;
        return `notifier as subscribed: service= ${service}, characteristic= ${characteristic}`;
      })
    );
  }
  /**
   * Send a request to the device and wait a unique response
   * @param message Message to send
   * @param service The service to which the characteristic belongs
   * @param characteristic The characteristic whose value you want to send the message
   * @param responseType filter to use to identify the response, Sample: [{position: 3, byteToMatch: 0x83},
   *  {position: 13, byteToMatch: 0x45}]
   * @param cypherMasterKey master key to decrypt the message, only use this para if the message to receive is encrypted
   */
  sendAndWaitResponse$(
    message,
    service,
    characteristic,
    responseType,
    cypherMasterKey?
  ) {
    return forkJoin(
      this.subscribeToNotifierListener(responseType, cypherMasterKey).pipe(
        take(1)
      ),
      this.sendToNotifier$(message, service, characteristic)
    ).pipe(
      map(([messageResp, _]) => messageResp),
      timeout(2000)
    );
  }
  /**
   * Subscribe to the notifiers filtering by byte checking
   * @param filterOptions must specific the position and the byte to match Sample:
   * [{position: 3, byteToMatch: 0x83}, {position: 13, byteToMatch: 0x45}]
   * @param cypherMasterKey master key to decrypt the message, only use this para if the message to receive is encrypted
   */
  subscribeToNotifierListener(filterOptions, cypherMasterKey?) {
    return this.notifierSubject.asObservable().pipe(
      map(messageUnformated => {
        let messageFormmated = messageUnformated as any;
        if (cypherMasterKey) {
          const datablockLength = new DataView(
            new Uint8Array(messageFormmated.slice(1, 3)).buffer
          ).getInt16(0, false);
          this.cypherAesService.config(cypherMasterKey);
          const datablock = Array.from(
            this.cypherAesService.decrypt(
              (messageUnformated as any).slice(3, datablockLength + 3)
            )
          );
          messageFormmated = (messageUnformated as any)
            .slice(0, 3)
            .concat(datablock)
            .concat((messageUnformated as any).slice(-2));
        }
        return messageFormmated;
      }),
      filter(message => {
        let availableMessage = false;
        for (const option of filterOptions) {
          if (message[option.position] === option.byteToMatch) {
            availableMessage = true;
          } else {
            availableMessage = false;
            break;
          }
        }
        return availableMessage;
      })
    );
  }

  /**
   * Start a request to the browser to list all available bluetooth devices
   * @param options Options to request the devices the structure is:
   * acceptAllDevices: true|false
   * filters: BluetoothDataFilterInit (see https://webbluetoothcg.github.io/web-bluetooth/#dictdef-bluetoothlescanfilterinit for more info)
   * optionalServices: [] (services that are going to be used in
   * communication with the device, must use the UIID or GATT identfier to list ther services)
   */
  private discoverDevice$(
    options: RequestDeviceOptions = {} as RequestDeviceOptions
  ) {
    return defer(() => this._webBle.requestDevice(options)).pipe(
      mergeMap(device => {
        return defer(() => {
          device.addEventListener(
            'gattserverdisconnected',
            this.onDeviceDisconnected.bind(this)
          );
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
   * optionalServices: [] (services that are going to be used in
   * communication with the device, must use the UIID or GATT identfier to list ther services)
   * @returns the connected device
   */
  connectDevice$(options?: RequestDeviceOptions) {
    if (!options) {
      options = {
        acceptAllDevices: true,
        optionalServices: []
      };
    } else if (!options.optionalServices) {
      options.optionalServices = [];
    }
    options.optionalServices.push(GattServices.GENERIC_ACCESS.SERVICE);
    options.optionalServices.push(GattServices.BATTERY.SERVICE);
    options.optionalServices.push(GattServices.DEVICE_INFORMATION.SERVICE);
    return this.discoverDevice$(options).pipe(
      mergeMap(device => {
        return defer(() => device.gatt.connect());
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
    if (!this.device) {
      throw new Error(
        'Must start a connection to a device before read the device value'
      );
    }
    return this.getPrimaryService$(service).pipe(
      mergeMap(primaryService =>
        this.getCharacteristic$(primaryService, characteristic)
      ),
      mergeMap((characteristicValue: BluetoothRemoteGATTCharacteristic) =>
        this.readValue$(characteristicValue)
      )
    );
  }

  /**
   * write a value in the selected characteristic
   * @param characteristic the characterisitc where you want write the value
   * @param value value the value to write
   */
  writeDeviceValue$(service, characteristic, value) {
    if (!this.device) {
      throw new Error(
        'Must start a connection to a device before read the device value'
      );
    }
    return this.getPrimaryService$(service).pipe(
      mergeMap(primaryService =>
        this.getCharacteristic$(primaryService, characteristic)
      ),
      mergeMap((characteristicValue: BluetoothRemoteGATTCharacteristic) =>
        this.writeValue$(characteristicValue, value)
      )
    );
  }

  /**
   * get a primary service instance using the service UIID or GATT identifier
   * @param service service identifier
   * @return service instance
   */
  getPrimaryService$(service: BluetoothServiceUUID) {
    return of(this.device).pipe(
      mergeMap(device => {
        return device.gatt.getPrimaryService(service);
      })
    );
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
  private readValue$(
    characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<DataView> {
    return from(
      characteristic
        .readValue()
        .then(
          (data: DataView) => Promise.resolve(data),
          (error: DOMException) => Promise.reject(`${error.message}`)
        )
    );
  }

  /**
   * write a value in the selected characteristic
   * @param characteristic the characterisitc where you want write the value
   * @param value the value to write
   */
  private writeValue$(
    characteristic: BluetoothRemoteGATTCharacteristic,
    value: ArrayBuffer | Uint8Array
  ) {
    return defer(() =>
      characteristic
        .writeValue(value)
    );
  }

  /**
   * change the state of the characteristic to enable it
   * @param service  parent service of the characteristic
   * @param characteristic characteristic to change the state
   * @param state new state
   */
  enableCharacteristic$(
    service: BluetoothServiceUUID,
    characteristic: BluetoothCharacteristicUUID,
    state?: any
  ) {
    state = state || new Uint8Array([1]);
    return this.setCharacteristicState$(service, characteristic, state);
  }

  /**
   * change the state of the characteristic to disable it
   * @param service  parent service of the characteristic
   * @param characteristic characteristic to change the state
   * @param state new state
   */
  disbaleCharacteristic$(
    service: BluetoothServiceUUID,
    characteristic: BluetoothCharacteristicUUID,
    state?: any
  ) {
    state = state || new Uint8Array([0]);
    return this.setCharacteristicState$(service, characteristic, state);
  }

  /**
   * set a state to an specific characteristic
   * @param service  parent service of the characteristic
   * @param characteristic characteristic to change the state
   * @param state new state
   * @return
   */
  setCharacteristicState$(
    service: BluetoothServiceUUID,
    characteristic: BluetoothCharacteristicUUID,
    state: ArrayBuffer
  ) {
    const primaryService = this.getPrimaryService$(service);
    return primaryService.pipe(
      mergeMap(_primaryService =>
        this.getCharacteristic$(_primaryService, characteristic)
      ),
      map((_characteristic: BluetoothRemoteGATTCharacteristic) =>
        this.writeValue$(_characteristic, state)
      )
    );
  }

  /**
   * Send a message using a notifier characteristic
   * @param message message to send
   * @param service service to which the characteristic belongs
   * @param characteristic feature in which you want to send the notification
   */
  sendToNotifier$(message, service, characteristic) {
    return this.getPrimaryService$(service).pipe(
      mergeMap((primaryService: BluetoothRemoteGATTService) =>
        this.getCharacteristic$(primaryService, characteristic)
      ),
      mergeMap((char: BluetoothRemoteGATTCharacteristic) => {
        if (message.length > 16) {
          let obsTest = of(undefined);
          while (message.length > 16) {
            obsTest = obsTest.pipe(
              concat(this.writeValue$(char, message.slice(0, 16)))
            );
            message = message.slice(16, message.length);
          }
          if (message.length > 0) {
            obsTest = obsTest.pipe(concat(this.writeValue$(char, message)));
          }
          return obsTest;
        } else {
          return this.writeValue$(char, message);
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
    return this.readDeviceValue$(
      GattServices.BATTERY.SERVICE,
      GattServices.BATTERY.BATTERY_LEVEL
    ).pipe(map(value => value.getUint8(0)));
  }
  /**
   * This characteristic represents the name of the manufacturer of the device.
   */
  getManufacturerName$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.MANUFACTURER_NAME
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the model number that is assigned by the device vendor.
   */
  getModelNumber$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.MODEL_NUMBER
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the serial number for a particular instance of the device.
   */
  getSerialNumber$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.SERIAL_NUMBER
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the hardware revision for the hardware within the device.
   */
  getHardwareRevision$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.HARDWARE_REVISION
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the firmware revision for the firmware within the device.
   */
  getFirmwareRevision$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.FIRMWARE_REVISION
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents the software revision for the software within the device.
   */
  getSoftwareRevision$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.SOFTWARE_REVISION
    ).pipe(
      map(dataView =>
        this.cypherAesService.bytesToText(new Uint8Array(dataView.buffer))
      )
    );
  }
  /**
   * This characteristic represents a structure containing an Organizationally Unique Identifier
   *  (OUI) followed by a manufacturer-defined identifier and is unique for each individual instance of the product.
   */
  getSystemId$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.SYSTEM_ID
    );
  }
  /**
   * The PnP_ID characteristic is a set of values used to create a device ID value that is unique for this device.
   */
  getPnpId$() {
    return this.readDeviceValue$(
      GattServices.DEVICE_INFORMATION.SERVICE,
      GattServices.DEVICE_INFORMATION.PNP_ID
    );
  }
}
