import { NgModule, ModuleWithProviders, InjectionToken  } from '@angular/core';
import { BrowserWebBluetooth } from './platform/browser';
import { CommonModule } from '@angular/common';
import { BluetoothService } from './bluetooth/bluetooth.service';
import { ConsoleLoggerService, NoLoggerService } from './logger.service';

export interface AWBOptions {
  enableTracing?: boolean;
}

export function browserWebBluetooth() {
  return new BrowserWebBluetooth();
}

export function consoleLoggerServiceConfig(options: AWBOptions) {
  if (options && options.enableTracing) {
    return new ConsoleLoggerService();
  } else {
    return new NoLoggerService();
  }
}
export function makeMeTokenInjector() {
  return new InjectionToken('AWBOptions');
}


@NgModule({
  imports: [CommonModule]
})
export class AngularBleModule {
  static forRoot(options: AWBOptions = {}): ModuleWithProviders {
    return {
      ngModule: AngularBleModule,
      providers: [
        BluetoothService,
        {
          provide: BrowserWebBluetooth,
          useFactory: browserWebBluetooth
        },
        {
          provide: makeMeTokenInjector,
          useValue: options
        },
        {
          provide: ConsoleLoggerService,
          useFactory: consoleLoggerServiceConfig,
          deps: [makeMeTokenInjector]
        }
      ]
    };
  }
}
