import { NgModule } from '@angular/core';
import { AngularBleComponent } from './angular-ble.component';
import { WebBluetoothModule } from '@manekinekko/angular-web-bluetooth';

@NgModule({
  imports: [
    WebBluetoothModule.forRoot({
      enableTracing: false
    })
  ],
  declarations: [AngularBleComponent],
  exports: [AngularBleComponent]
})
export class AngularBleModule { }
