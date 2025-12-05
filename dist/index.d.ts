import { TableColumn, PrintTableOptions, ColumnAlign } from "./utils/print-table";
import { COMMANDS } from "./utils/printer-commands";
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
export declare enum PrinterWidth {
    WIDTH_58MM = 58,
    WIDTH_80MM = 80
}
/**
 * Request Bluetooth and Location permissions required for BLE printing
 * Call this before using any printer functions
 * @returns Promise<boolean> - true if all permissions granted
 */
export declare const requestPermissions: () => Promise<boolean>;
/**
 * Check if Bluetooth permissions are granted
 * @returns Promise<boolean>
 */
export declare const checkPermissions: () => Promise<boolean>;
export declare const BLEPrinter: {
    /**
     * Request permissions required for BLE printing (Android)
     * @returns Promise<boolean> - true if all permissions granted
     */
    requestPermissions: () => Promise<boolean>;
    /**
     * Check if permissions are granted
     * @returns Promise<boolean>
     */
    checkPermissions: () => Promise<boolean>;
    /**
     * Initialize the BLE printer module
     * Must be called before scanning for devices
     */
    init: () => Promise<void>;
    /**
     * Get list of paired/available BLE printers
     * @returns Array of BLE devices
     */
    getDeviceList: () => Promise<BLEDevice[]>;
    /**
     * Connect to a printer by MAC address
     * @param macAddress - The printer's MAC address (inner_mac_address from getDeviceList)
     */
    connect: (macAddress: string) => Promise<string>;
    /**
     * Disconnect from the current printer
     */
    disconnect: () => Promise<void>;
    /**
     * Print text
     * @param text - Text to print
     * @param opts - Print options (beep, cut, encoding)
     */
    printText: (text: string, opts?: PrinterOptions) => Promise<void>;
    /**
     * Print image from URL or base64 string (auto-detected)
     * @param imageSource - Image URL (http/https/file) or base64 string
     * @param opts - Image options (width, height, printerWidth)
     */
    printImage: (imageSource: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * Print raw ESC/POS data (advanced usage)
     * @param data - Raw data to print
     */
    printRaw: (data: string) => Promise<void>;
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
    printTable: <T extends Record<string, string>>(data: T[], columns: TableColumn<keyof T & string>[], tableOpts?: PrintTableOptions, printOpts?: PrinterOptions) => Promise<void>;
};
export { COMMANDS };
export type { TableColumn, PrintTableOptions };
export { ColumnAlign };
export { PrinterError, PrinterErrorCode } from './errors';
export { generateTableText } from './utils/print-table';
export default BLEPrinter;
