import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

import * as EPToolkit from "./utils/EPToolkit";
import { processColumnText } from "./utils/print-column";
import { COMMANDS } from "./utils/printer-commands";
import { PrinterError, PrinterErrorCode, wrapError } from "./errors";
import type { Spec } from "./NativeThermalPrinter";

// Automatic architecture detection
// @ts-ignore - __turboModuleProxy is not in React Native types but exists at runtime
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const RNBLEPrinterModule: Spec | null = isTurboModuleEnabled
  ? TurboModuleRegistry.get<Spec>('RNBLEPrinter')
  : NativeModules.RNBLEPrinter;

if (!RNBLEPrinterModule) {
  throw new PrinterError(
    'RNBLEPrinter native module is not available. Make sure the library is properly linked.',
    PrinterErrorCode.NOT_INITIALIZED
  );
}

const RNBLEPrinter = RNBLEPrinterModule;

interface PrinterOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
}

interface PrinterImageOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
  imageWidth?: number;
  imageHeight?: number;
  printerWidthType?: string;
  paddingX?: number; // only iOS
}

interface IBLEPrinter {
  device_name: string;
  inner_mac_address: string;
}

enum ColumnAlignment {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

enum PrinterWidth {
  "58mm" = 58,
  "80mm" = 80,
}

// Helper function for processing text on Android
const processTextAndroid = (text: string, opts: PrinterOptions) => {
  const fixAndroid = "\n";
  const buffer = EPToolkit.exchange_text(text + fixAndroid, {
    beep: opts.beep ?? false,
    cut: opts.cut ?? false,
    tailingLine: opts.tailingLine ?? false,
    encoding: opts.encoding ?? "UTF8",
  });
  return buffer.toString("base64");
};

// Helper function for processing text on iOS
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

const BLEPrinter = {
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
   * Get list of available BLE printers
   */
  getDeviceList: async (): Promise<IBLEPrinter[]> => {
    try {
      const devices = await RNBLEPrinter.getDeviceList();
      return devices as IBLEPrinter[];
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.DEVICE_NOT_FOUND);
    }
  },

  /**
   * Connect to a specific printer by MAC address
   */
  connectPrinter: async (inner_mac_address: string): Promise<string> => {
    try {
      const result = await RNBLEPrinter.connectPrinter(inner_mac_address);
      return result;
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.CONNECTION_FAILED);
    }
  },

  /**
   * Close the current printer connection
   */
  closeConn: async (): Promise<void> => {
    try {
      await RNBLEPrinter.closeConn();
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.NOT_CONNECTED);
    }
  },

  /**
   * Print text without cutting or beeping (use for building receipts line by line)
   */
  printText: async (text: string, opts: PrinterOptions = {}): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        const processedText = processTextIOS(text);
        await RNBLEPrinter.printRawData(processedText, {
          ...opts,
          beep: false,
          cut: false,
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
   * Print text and finish the bill (cuts paper and beeps by default)
   */
  printBill: async (text: string, opts: PrinterOptions = {}): Promise<void> => {
    try {
      const finalOpts = {
        beep: opts.beep ?? true,
        cut: opts.cut ?? true,
        tailingLine: opts.tailingLine ?? true,
        encoding: opts.encoding ?? "UTF8",
      };

      if (Platform.OS === "ios") {
        const processedText = processTextIOS(text);
        await RNBLEPrinter.printRawData(processedText, finalOpts);
      } else {
        const buffer = EPToolkit.exchange_text(text, finalOpts);
        const data = buffer.toString("base64");
        await RNBLEPrinter.printRawData(data, finalOpts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },
  /**
   * Print image from URL
   * @param imgUrl - Image URL to print
   * @param opts - Printer image options
   */
  printImage: async (imgUrl: string, opts: PrinterImageOptions = {}): Promise<void> => {
    try {
      await RNBLEPrinter.printImageData(imgUrl, opts);
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },
  /**
   * Print image from base64 string
   * @param base64 - Base64 encoded image string
   * @param opts - Printer image options
   */
  printImageBase64: async (
    base64: string,
    opts: PrinterImageOptions = {}
  ): Promise<void> => {
    try {
      await RNBLEPrinter.printImageBase64(base64, opts);
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },
  /**
   * Print raw data (primarily for Android with encoder support)
   * @param text - Raw text data to print
   */
  printRaw: async (text: string): Promise<void> => {
    try {
      if (Platform.OS === "ios") {
        const processedText = processTextIOS(text);
        await RNBLEPrinter.printRawData(processedText, {
          beep: false,
          cut: false,
        });
      } else {
        await RNBLEPrinter.printRawData(text, {});
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },
  /**
   * Print text in columns
   * @param texts - Array of text for each column
   * @param columnWidth - Array of widths for each column (80mm => 46 chars, 58mm => 30 chars)
   * @param columnAlignment - Array of alignments for each column
   * @param columnStyle - Array of styles for each column
   * @param opts - Printer options
   */
  printColumnsText: async (
    texts: string[],
    columnWidth: number[],
    columnAlignment: ColumnAlignment[],
    columnStyle: string[] = [],
    opts: PrinterOptions = {}
  ): Promise<void> => {
    try {
      const result = processColumnText(
        texts,
        columnWidth,
        columnAlignment,
        columnStyle
      );
      
      if (Platform.OS === "ios") {
        const processedText = processTextIOS(result);
        await RNBLEPrinter.printRawData(processedText, {
          ...opts,
          beep: false,
          cut: false,
        });
      } else {
        const data = processTextAndroid(result, opts);
        await RNBLEPrinter.printRawData(data, opts);
      }
    } catch (error) {
      throw wrapError(error, PrinterErrorCode.PRINT_FAILED);
    }
  },
};

// Export main API
export { BLEPrinter, COMMANDS };

// Export types
export type { 
  PrinterOptions, 
  PrinterImageOptions, 
  IBLEPrinter
};

// Export enums
export { ColumnAlignment, PrinterWidth };

// Export error types
export { PrinterError, PrinterErrorCode } from './errors';

// Export TurboModule spec type
export type { Spec as NativeThermalPrinterSpec } from './NativeThermalPrinter';
