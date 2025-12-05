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

export enum PrinterWidth {
  WIDTH_58MM = 58,
  WIDTH_80MM = 80,
}

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
  // Check if it's a URL
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://')) {
    return false;
  }
  // Check for base64 pattern
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  // Remove data URI prefix if present
  const cleanStr = str.replace(/^data:image\/[a-z]+;base64,/, '');
  return base64Regex.test(cleanStr.replace(/\s/g, ''));
};

// ============================================================================
// Permissions
// ============================================================================

/**
 * Request Bluetooth and Location permissions required for BLE printing
 * Call this before using any printer functions
 * @returns Promise<boolean> - true if all permissions granted
 */
export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions differently
  }

  try {
    const apiLevel = Platform.Version as number;
    
    if (apiLevel >= 31) {
      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
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
      // Android < 12 only requires location
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
  /**
   * Request permissions required for BLE printing (Android)
   * @returns Promise<boolean> - true if all permissions granted
   */
  requestPermissions,

  /**
   * Check if permissions are granted
   * @returns Promise<boolean>
   */
  checkPermissions,

  /**
   * Initialize the BLE printer module
   * Must be called before scanning for devices
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
   * @returns Array of BLE devices
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
   * @param macAddress - The printer's MAC address (inner_mac_address from getDeviceList)
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
   * Print text
   * @param text - Text to print
   * @param opts - Print options (beep, cut, encoding)
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

  /**
   * Print image from URL or base64 string (auto-detected)
   * @param imageSource - Image URL (http/https/file) or base64 string
   * @param opts - Image options (width, height, printerWidth)
   */
  printImage: async (imageSource: string, opts: PrinterImageOptions = {}): Promise<void> => {
    try {
      if (isBase64(imageSource)) {
        // Remove data URI prefix if present
        const base64Data = imageSource.replace(/^data:image\/[a-z]+;base64,/, '');
        await RNBLEPrinter.printImageBase64(base64Data, opts);
      } else {
        await RNBLEPrinter.printImageData(imageSource, opts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },

  /**
   * Print raw ESC/POS data (advanced usage)
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

  /**
   * Print a table with automatic column width calculation
   * Supports frozen columns that won't wrap
   * 
   * @param data - Array of objects with key-value pairs
   * @param columns - Column configuration (key autocomplete based on data)
   * @param tableOpts - Table options (printerWidth, showHeader)
   * @param printOpts - Print options (beep, cut)
   * 
   * @example
   * await BLEPrinter.printTable(
   *   [
   *     { item: 'Coffee', qty: '2', price: '50.00' },
   *     { item: 'Sandwich with Extra Cheese', qty: '1', price: '35.00' },
   *   ],
   *   [
   *     { key: 'item' },  // Flexible - wraps if needed
   *     { key: 'qty', frozen: true, align: ColumnAlign.CENTER },
   *     { key: 'price', frozen: true, align: ColumnAlign.RIGHT },
   *   ],
   *   { printerWidth: '80mm' }
   * );
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
};

// ============================================================================
// Exports
// ============================================================================

// ESC/POS Commands
export { COMMANDS };

// Types (re-export from print-table)
export type { TableColumn, PrintTableOptions };

// Enums
export { ColumnAlign };

// Errors
export { PrinterError, PrinterErrorCode } from './errors';

// Utility for advanced usage
export { generateTableText } from './utils/print-table';

// Default export
export default BLEPrinter;
