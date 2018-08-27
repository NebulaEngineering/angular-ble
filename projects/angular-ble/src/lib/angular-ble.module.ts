import { NgModule } from '@angular/core';
import { AngularBleComponent } from './angular-ble.component';
import { BrowserWebBluetooth } from './platform/browser';

export function browserWebBluetooth() {
  return new BrowserWebBluetooth();
}

@NgModule({
  declarations: [AngularBleComponent],
  providers: [
    {
      provide: BrowserWebBluetooth,
      useFactory: browserWebBluetooth
    }
  ],
  exports: [AngularBleComponent]
})
export class AngularBleModule { }
