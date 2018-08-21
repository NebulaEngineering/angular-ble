import { Injectable } from '@angular/core';
import * as aes from 'aes-js';
import { throws } from 'assert';

@Injectable({
  providedIn: 'root'
})
export class CypherAesService {
  private masterKey = [];
  private initialVector = [];
  private encryptMethod = 'CBC';
  private isStaticInitialVector = true;
  private enctrypMethodInstance;
  private isConfigExecuted = false;
  private additionalEncryptMethodParams;

  constructor() {}
  /**
   * Initial config used to initalice all required params
   * @param masterKey key used to encrypt and decrypt
   * @param initialVector vector used to encrypt abd decrypt except when ECB encrypt method is used
   * @param encryptMethod type of encrypt method is used, the possible options are: CBC, CTR, CFB, OFB, ECB
   * @param additionalEncryptMethodParams configuration params used by the selected encrypt method.
   * Note: if the method CTR or CFB is used this param is required otherwise is an optinal param.
   * By CTR require the param counter and by CFB require the param segmentSize
   * @param isStaticInitialVector defines if the initial vector is changed or not when the data are encrypted or not
   */
  config(
    masterKey,
    initialVector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    encryptMethod = 'CBC',
    additionalEncryptMethodParams = {},
    isStaticInitialVector = true
  ) {
    this.isConfigExecuted = true;
    this.masterKey = masterKey;
    this.initialVector = initialVector;
    this.encryptMethod = encryptMethod;
    this.isStaticInitialVector = isStaticInitialVector;
    this.additionalEncryptMethodParams = additionalEncryptMethodParams;
    if (!isStaticInitialVector) {
      this.enctrypMethodInstance = this.generateEncryptMethodInstance();
    }
  }
  /**
   * Encrypt the data using the encrypt method previously configured
   * @param dataArrayBuffer data to encrypt
   */
  encrypt(dataArrayBuffer: Uint8Array | Uint16Array | Uint32Array) {
    if (!this.isConfigExecuted) {
      throw new Error(
        'Must configurate cypher-aes before call this method, use the method config()'
      );
    }
    if (this.encryptMethod === 'CBC' || this.encryptMethod === 'ECB') {
      dataArrayBuffer = this.addPadding(dataArrayBuffer);
    }
    return this.isStaticInitialVector
      ? this.generateEncryptMethodInstance().encrypt(dataArrayBuffer)
      : this.enctrypMethodInstance.encrypt(dataArrayBuffer);
  }
  /**
   * Decrypt the data using the encrypt method previously configured
   * @param dataArrayBuffer data to decrypt
   */
  decrypt(dataArrayBuffer: Uint8Array | Uint16Array | Uint32Array) {
    if (!this.isConfigExecuted) {
      throw new Error(
        'Must configurate cypher-aes before call this method, use the method config()'
      );
    }
    return this.isStaticInitialVector
      ? this.generateEncryptMethodInstance().decrypt(dataArrayBuffer)
      : this.enctrypMethodInstance.decrypt(dataArrayBuffer);
  }
  /**
   * Change the current initalVector
   * @param initialVector new initalVector
   */
  changeInitialVector(initialVector) {
    if (!this.isStaticInitialVector) {
      this.enctrypMethodInstance = this.generateEncryptMethodInstance();
    }
    this.initialVector = initialVector;
  }

  /**
   * Change the current encyptMethod
   * @param encryptMethod new encryptMethod
   */
  changeEncryptMethod(encryptMethod) {
    if (!this.isStaticInitialVector) {
      this.enctrypMethodInstance = this.generateEncryptMethodInstance();
    }
    this.encryptMethod = encryptMethod;
  }

  /**
   * Change the current isStaticInitialVector
   * @param isStaticInitialVector new isStaticInitalVector
   */
  changeStaticInitialVector(isStaticInitialVector) {
    if (!isStaticInitialVector) {
      this.enctrypMethodInstance = this.generateEncryptMethodInstance();
    }
    this.isStaticInitialVector = isStaticInitialVector;
  }
  /**
   * Change the current masterKey
   * @param masterKey new masterKey
   */
  changeMasterKey(masterKey) {
    if (!this.isStaticInitialVector) {
      this.enctrypMethodInstance = this.generateEncryptMethodInstance();
    }
    this.masterKey = masterKey;
  }

  /**
   * Add padding to the list
   */
  private addPadding(arrayBuffer: Uint8Array | Uint16Array | Uint32Array) {
    const paddingLength = (Math.ceil(Array.from(arrayBuffer).length / 16)) * 16;
    const paddingList = new Array(paddingLength - Array.from(arrayBuffer).length).fill(0);
    return new Uint8Array(Array.from(arrayBuffer).concat(paddingList));
  }
  /**
   * generate a instance of the encrypt method using the current method configured
   */
  private generateEncryptMethodInstance() {
    let enctrypMethodInstance;
    switch (this.encryptMethod) {
      case 'CBC':
        enctrypMethodInstance = new aes.ModeOfOperation.cbc(
          this.masterKey,
          this.initialVector
        );
        break;
      case 'CTR':
        if (!this.additionalEncryptMethodParams.counter) {
          throw new Error('additionalEncryptMethodParams.counter is required to use encrypt method CTR');
        }
        enctrypMethodInstance = new aes.ModeOfOperation.ctr(
          this.masterKey,
          this.initialVector,
          new aes.Counter(this.additionalEncryptMethodParams.counter)
        );
        break;
      case 'CFB':
      if (!this.additionalEncryptMethodParams.segmentSize) {
        throw new Error('additionalEncryptMethodParams.segmentSize is required to use encrypt method CFB');
      }
        enctrypMethodInstance = new aes.ModeOfOperation.cfb(
          this.masterKey,
          this.initialVector,
          this.additionalEncryptMethodParams.segmentSize
        );
        break;
      case 'OFB':
        enctrypMethodInstance = new aes.ModeOfOperation.ofb(
          this.masterKey,
          this.initialVector
        );
        break;
      case 'ECB':
        enctrypMethodInstance = new aes.ModeOfOperation.ecb(this.masterKey);
        break;
    }
    return enctrypMethodInstance;
  }
  // #region UTILS
  /**
   * Convert the text to bytes
   * @param text Text to convert
   */
  textToBytes(text) {
    return aes.utils.utf8.toBytes(text);
  }
  /**
   * Convert the bytes to text
   * @param bytes Bytes to convert
   */
  bytesToText(bytes: Uint8Array | Uint16Array | Uint32Array) {
    return aes.utils.utf8.fromBytes(bytes);
  }

  /**
   * Convert the bytes to hex
   * @param bytes bytes to convert
   */
  bytesTohex(bytes) {
    return aes.utils.hex.fromBytes(bytes);
  }

  /**
   * Convert the hex to bytes
   * @param hex Hex to convert
   */
  hexToBytes(hex) {
    return aes.utils.hex.toBytes(hex);
  }
  // #endregion
}
