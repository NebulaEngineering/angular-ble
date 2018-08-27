export const GattServices = {
  GENERIC_ACCESS: {
    SERVICE: 'generic_access',
    DEVICE_NAME: 'device_name',
    APPEARANCE: 'appearance',
    PRIVACY_FLAG: 'privacy_flag',
    RECONNECTION_ADDRESS: 'reconnection_address',
    PERIPHERAL_PREFERRED_CONNECTION_PARAMETERS: 'peripheral_preferred_connection_parameters'
  },
  BATTERY: {
    SERVICE: 'battery_service',
    BATTERY_LEVEL: 'battery_level'
  },
  DEVICE_INFORMATION: {
    SERVICE: 'device_information',
    MANUFACTURER_NAME: 'manufacturer_name_string',
    MODEL_NUMBER: 'model_number_string',
    SERIAL_NUMBER: 'serial_number_string',
    HARDWARE_REVISION: 'hardware_revision_string',
    FIRMWARE_REVISION: 'firmware_revision_string',
    SOFTWARE_REVISION: 'software_revision_string',
    SYSTEM_ID: 'system_id',
    PNP_ID: 'pnp_id'
  }
};

export const GATT_SERVICES = Object.keys(GattServices).map(
  key => GattServices[key].SERVICE
);
