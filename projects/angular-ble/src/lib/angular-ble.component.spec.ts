import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularBleComponent } from './angular-ble.component';

describe('AngularBleComponent', () => {
  let component: AngularBleComponent;
  let fixture: ComponentFixture<AngularBleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AngularBleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularBleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
