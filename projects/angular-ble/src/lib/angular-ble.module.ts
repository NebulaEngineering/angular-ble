import { NgModule, ModuleWithProviders  } from '@angular/core';
import { BrowserWebBluetooth } from './platform/browser';
import { CommonModule } from '@angular/common';
import { BluetoothService } from './bluetooth/bluetooth.service';

export function browserWebBluetooth() {
  return new BrowserWebBluetooth();
}


@NgModule({
  imports: [CommonModule]
})
export class AngularBleModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AngularBleModule,
      providers: [
        BluetoothService,
        {
          provide: BrowserWebBluetooth,
          useFactory: browserWebBluetooth
        }
      ]
    };
  }
}
