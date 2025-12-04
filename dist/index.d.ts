import { COMMANDS } from "./utils/printer-commands";
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
    paddingX?: number;
}
interface IBLEPrinter {
    device_name: string;
    inner_mac_address: string;
}
declare enum ColumnAlignment {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}
declare enum PrinterWidth {
    "58mm" = 58,
    "80mm" = 80
}
declare const BLEPrinter: {
    /**
     * Initialize the BLE printer module
     */
    init: () => Promise<void>;
    /**
     * Get list of available BLE printers
     */
    getDeviceList: () => Promise<IBLEPrinter[]>;
    /**
     * Connect to a specific printer by MAC address
     */
    connectPrinter: (inner_mac_address: string) => Promise<string>;
    /**
     * Close the current printer connection
     */
    closeConn: () => Promise<void>;
    /**
     * Print text without cutting or beeping (use for building receipts line by line)
     */
    printText: (text: string, opts?: PrinterOptions) => Promise<void>;
    /**
     * Print text and finish the bill (cuts paper and beeps by default)
     */
    printBill: (text: string, opts?: PrinterOptions) => Promise<void>;
    /**
     * Print image from URL
     * @param imgUrl - Image URL to print
     * @param opts - Printer image options
     */
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * Print image from base64 string
     * @param base64 - Base64 encoded image string
     * @param opts - Printer image options
     */
    printImageBase64: (base64: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * Print raw data (primarily for Android with encoder support)
     * @param text - Raw text data to print
     */
    printRaw: (text: string) => Promise<void>;
    /**
     * Print text in columns
     * @param texts - Array of text for each column
     * @param columnWidth - Array of widths for each column (80mm => 46 chars, 58mm => 30 chars)
     * @param columnAlignment - Array of alignments for each column
     * @param columnStyle - Array of styles for each column
     * @param opts - Printer options
     */
    printColumnsText: (texts: string[], columnWidth: number[], columnAlignment: ColumnAlignment[], columnStyle?: string[], opts?: PrinterOptions) => Promise<void>;
};
export { BLEPrinter, COMMANDS };
export type { PrinterOptions, PrinterImageOptions, IBLEPrinter };
export { ColumnAlignment, PrinterWidth };
export { PrinterError, PrinterErrorCode } from './errors';
export type { Spec as NativeThermalPrinterSpec } from './NativeThermalPrinter';
