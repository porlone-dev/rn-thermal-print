import { NativeModules, Platform, PermissionsAndroid } from "react-native";

import * as EPToolkit from "./utils/EPToolkit";
import { generateTableText, TableColumn, PrintTableOptions, ColumnAlign } from "./utils/print-table";
import { COMMANDS } from "./utils/printer-commands";
import { PrinterError, PrinterErrorCode, wrapError } from "./errors";

const { RNBLEPrinter: RNBLEPrinterModule } = NativeModules;

if (!RNBLEPrinterModule) {
  throw new PrinterError(
    'RNBLEPrinter native module is not available. Make sure the library is properly linked.',
    PrinterErrorCode.NOT_INITIALIZED
  );
}

const RNBLEPrinter = RNBLEPrinterModule;

// ============================================================================
// Types
// ============================================================================

export interface PrinterOptions {
  /** Beep after printing */
  beep?: boolean;
  /** Cut paper after printing */
  cut?: boolean;
  /** Add tailing line */
  tailingLine?: boolean;
  /** Text encoding (default: UTF8) */
  encoding?: string;
}

export interface PrinterImageOptions {
  /** Image width in pixels */
  imageWidth?: number;
  /** Image height in pixels */
  imageHeight?: number;
  /** Printer width type: '58' or '80' */
  printerWidthType?: '58' | '80';
  /** Padding X (iOS only) */
  paddingX?: number;
}

export interface BLEDevice {
  /** Device name */
  device_name: string;
  /** Device MAC address (used for connection) */
  inner_mac_address: string;
}

export interface QRCodeOptions {
  /** QR code size in pixels (default: 200) */
  size?: number;
}

export interface BarcodeOptions {
  /** Barcode width in pixels (default: 300) */
  width?: number;
  /** Barcode height in pixels (default: 80) */
  height?: number;
}

export type BarcodeType = 
  | 'CODE128' 
  | 'CODE39' 
  | 'EAN13' 
  | 'EAN8' 
  | 'UPC_A' 
  | 'UPC_E' 
  | 'ITF' 
  | 'CODABAR';

export enum PrinterWidth {
  WIDTH_58MM = 58,
  WIDTH_80MM = 80,
}

// ============================================================================
// Print Queue
// ============================================================================

type PrintJob = () => Promise<void>;

class PrintQueue {
  private queue: PrintJob[] = [];
  private isProcessing = false;

  async add(job: PrintJob): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await job();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        try {
          await job();
        } catch (error) {
          console.error('Print job failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }
}

const printQueue = new PrintQueue();

// ============================================================================
// Internal Helpers
// ============================================================================

const processTextAndroid = (text: string, opts: PrinterOptions) => {
  const buffer = EPToolkit.exchange_text(text + "\n", {
    beep: opts.beep ?? false,
    cut: opts.cut ?? false,
    tailingLine: opts.tailingLine ?? false,
    encoding: opts.encoding ?? "UTF8",
  });
  return buffer.toString("base64");
};

const processTextIOS = (text: string) => {
  return text
    .replace(/<\/?CB>/g, "")
    .replace(/<\/?CM>/g, "")
    .replace(/<\/?CD>/g, "")
    .replace(/<\/?C>/g, "")
    .replace(/<\/?D>/g, "")
    .replace(/<\/?B>/g, "")
    .replace(/<\/?M>/g, "");
};

const isBase64 = (str: string): boolean => {
  if (!str || str.length === 0) return false;
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://')) {
    return false;
  }
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  const cleanStr = str.replace(/^data:image\/[a-z]+;base64,/, '');
  return base64Regex.test(cleanStr.replace(/\s/g, ''));
};

// ============================================================================
// Permissions
// ============================================================================

/**
 * Request Bluetooth and Location permissions required for BLE printing
 * @returns Promise<boolean> - true if all permissions granted
 */
export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version as number;
    
    if (apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Failed to request permissions:', error);
    return false;
  }
};

/**
 * Check if Bluetooth permissions are granted
 * @returns Promise<boolean>
 */
export const checkPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version as number;
    
    if (apiLevel >= 31) {
      const bluetoothScan = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      const bluetoothConnect = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      const location = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return bluetoothScan && bluetoothConnect && location;
    } else {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  } catch {
    return false;
  }
};

// ============================================================================
// BLEPrinter API
// ============================================================================

export const BLEPrinter = {
  // -------------------------------------------------------------------------
  // Permissions
  // -------------------------------------------------------------------------
  
  requestPermissions,
  checkPermissions,

  // -------------------------------------------------------------------------
  // Connection Management
  // -------------------------------------------------------------------------

  /**
   * Initialize the BLE printer module
   */
  init: async (): Promise<void> => {
    try {
      await RNBLEPrinter.init();
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.INIT_ERROR);
    }
  },

  /**
   * Get list of paired/available BLE printers
   */
  getDeviceList: async (): Promise<BLEDevice[]> => {
    try {
      const devices = await RNBLEPrinter.getDeviceList();
      return devices as BLEDevice[];
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.DEVICE_NOT_FOUND);
    }
  },

  /**
   * Connect to a printer by MAC address
   * @param macAddress - The printer's MAC address
   */
  connect: async (macAddress: string): Promise<string> => {
    try {
      const result = await RNBLEPrinter.connectPrinter(macAddress);
      return result;
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.CONNECTION_FAILED);
    }
  },

  /**
   * Disconnect from the current printer
   */
  disconnect: async (): Promise<void> => {
    try {
      await RNBLEPrinter.closeConn();
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.NOT_CONNECTED);
    }
  },

  /**
   * Check if printer is currently connected
   * @returns Promise<boolean>
   */
  isConnected: async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // iOS implementation - check if m_printer exists
        return await RNBLEPrinter.isConnected?.() ?? false;
      }
      return await RNBLEPrinter.isConnected();
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Text Printing
  // -------------------------------------------------------------------------

  /**
   * Print text
   * @param text - Text to print
   * @param opts - Print options
   */
  printText: async (text: string, opts: PrinterOptions = {}): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        const processedText = processTextIOS(text);
        await RNBLEPrinter.printRawData(processedText, {
          beep: opts.beep ?? false,
          cut: opts.cut ?? false,
        });
      } else {
        const data = processTextAndroid(text, opts);
        await RNBLEPrinter.printRawData(data, opts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // Image Printing
  // -------------------------------------------------------------------------

  /**
   * Print image from URL or base64 string (auto-detected)
   * @param imageSource - Image URL or base64 string
   * @param opts - Image options
   */
  printImage: async (imageSource: string, opts: PrinterImageOptions = {}): Promise<void> => {
    try {
      if (isBase64(imageSource)) {
        const base64Data = imageSource.replace(/^data:image\/[a-z]+;base64,/, '');
        await RNBLEPrinter.printImageBase64(base64Data, opts);
      } else {
        await RNBLEPrinter.printImageData(imageSource, opts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // QR Code & Barcode
  // -------------------------------------------------------------------------

  /**
   * Print QR code
   * @param data - Data to encode in QR code
   * @param opts - QR code options
   */
  printQRCode: async (data: string, opts: QRCodeOptions = {}): Promise<void> => {
    try {
      const size = opts.size ?? 200;
      
      if (Platform.OS === 'ios') {
        // iOS: Generate QR code as image and print
        await RNBLEPrinter.printQRCode?.(data, size) ?? 
          Promise.reject(new Error('QR code not supported on this iOS version'));
      } else {
        await RNBLEPrinter.printQRCode(data, size);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  /**
   * Print barcode
   * @param data - Data to encode in barcode
   * @param type - Barcode type (CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR)
   * @param opts - Barcode options
   */
  printBarcode: async (
    data: string, 
    type: BarcodeType = 'CODE128', 
    opts: BarcodeOptions = {}
  ): Promise<void> => {
    try {
      const width = opts.width ?? 300;
      const height = opts.height ?? 80;
      
      if (Platform.OS === 'ios') {
        await RNBLEPrinter.printBarcode?.(data, type, width, height) ??
          Promise.reject(new Error('Barcode not supported on this iOS version'));
      } else {
        await RNBLEPrinter.printBarcode(data, type, width, height);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // Table Printing
  // -------------------------------------------------------------------------

  /**
   * Print a table with automatic column width calculation
   * @param data - Array of objects
   * @param columns - Column configuration
   * @param tableOpts - Table options
   * @param printOpts - Print options
   */
  printTable: async <T extends Record<string, string>>(
    data: T[],
    columns: TableColumn<keyof T & string>[],
    tableOpts: PrintTableOptions = {},
    printOpts: PrinterOptions = {}
  ): Promise<void> => {
    try {
      const result = generateTableText(data, columns, tableOpts);
      
      if (Platform.OS === "ios") {
        const processedText = processTextIOS(result);
        await RNBLEPrinter.printRawData(processedText, {
          beep: printOpts.beep ?? false,
          cut: printOpts.cut ?? false,
        });
      } else {
        const textData = processTextAndroid(result, printOpts);
        await RNBLEPrinter.printRawData(textData, printOpts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // Raw Printing
  // -------------------------------------------------------------------------

  /**
   * Print raw ESC/POS data
   * @param data - Raw data to print
   */
  printRaw: async (data: string): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        await RNBLEPrinter.printRawData(data, { beep: false, cut: false });
      } else {
        await RNBLEPrinter.printRawData(data, {});
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // Cash Drawer
  // -------------------------------------------------------------------------

  /**
   * Open cash drawer connected to the printer
   */
  openCashDrawer: async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Send ESC/POS command directly
        const cashDrawerCommand = '\x1B\x70\x00\x19\xFA';
        await RNBLEPrinter.printRawData(cashDrawerCommand, { beep: false, cut: false });
      } else {
        await RNBLEPrinter.openCashDrawer();
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  // -------------------------------------------------------------------------
  // Print Queue
  // -------------------------------------------------------------------------

  /**
   * Add a print job to the queue
   * Jobs are processed sequentially
   * @param job - Async function that performs the print operation
   */
  queuePrint: async (job: () => Promise<void>): Promise<void> => {
    return printQueue.add(job);
  },

  /**
   * Clear all pending print jobs
   */
  clearQueue: (): void => {
    printQueue.clear();
  },

  /**
   * Get number of pending print jobs
   */
  getQueueLength: (): number => {
    return printQueue.length;
  },
};

// ============================================================================
// Exports
// ============================================================================

export { COMMANDS };
export type { TableColumn, PrintTableOptions };
export { ColumnAlign };
export { PrinterError, PrinterErrorCode } from './errors';
export { generateTableText } from './utils/print-table';
export default BLEPrinter;
