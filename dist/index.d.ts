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
export interface ConnectionOptions {
    /** Enable auto-reconnect on connection loss (default: false) */
    autoReconnect?: boolean;
    /** Maximum number of reconnection attempts (default: 3) */
    maxReconnectAttempts?: number;
    /** Delay between reconnection attempts in milliseconds (default: 2000) */
    reconnectDelay?: number;
    /** Connection timeout in milliseconds (default: 10000) */
    timeout?: number;
}
export interface PrinterStatus {
    /** Battery level percentage (0-100), -1 if unavailable */
    batteryLevel: number;
    /** Paper level status: 'ok', 'low', 'empty', or 'unknown' */
    paperStatus: 'ok' | 'low' | 'empty' | 'unknown';
    /** Whether printer is currently connected */
    isConnected: boolean;
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
export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC_A' | 'UPC_E' | 'ITF' | 'CODABAR';
export declare enum PrinterWidth {
    WIDTH_58MM = 58,
    WIDTH_80MM = 80
}
/**
 * Request Bluetooth and Location permissions required for BLE printing
 * @returns Promise<boolean> - true if all permissions granted
 */
export declare const requestPermissions: () => Promise<boolean>;
/**
 * Check if Bluetooth permissions are granted
 * @returns Promise<boolean>
 */
export declare const checkPermissions: () => Promise<boolean>;
export declare const BLEPrinter: {
    requestPermissions: () => Promise<boolean>;
    checkPermissions: () => Promise<boolean>;
    /**
     * Initialize the BLE printer module
     */
    init: () => Promise<void>;
    /**
     * Get list of paired/available BLE printers
     */
    getDeviceList: () => Promise<BLEDevice[]>;
    /**
     * Connect to a printer by MAC address
     * @param macAddress - The printer's MAC address
     * @param options - Connection options (auto-reconnect, timeout, etc.)
     */
    connect: (macAddress: string, options?: ConnectionOptions) => Promise<string>;
    /**
     * Disconnect from the current printer
     */
    disconnect: () => Promise<void>;
    /**
     * Check if printer is currently connected
     * @returns Promise<boolean>
     */
    isConnected: () => Promise<boolean>;
    /**
     * Print text
     * @param text - Text to print
     * @param opts - Print options
     */
    printText: (text: string, opts?: PrinterOptions) => Promise<void>;
    /**
     * Print image from URL or base64 string (auto-detected)
     * @param imageSource - Image URL or base64 string
     * @param opts - Image options
     */
    printImage: (imageSource: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * Print QR code
     * @param data - Data to encode in QR code
     * @param opts - QR code options
     */
    printQRCode: (data: string, opts?: QRCodeOptions) => Promise<void>;
    /**
     * Print barcode
     * @param data - Data to encode in barcode
     * @param type - Barcode type (CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR)
     * @param opts - Barcode options
     */
    printBarcode: (data: string, type?: BarcodeType, opts?: BarcodeOptions) => Promise<void>;
    /**
     * Print a table with automatic column width calculation
     * @param data - Array of objects
     * @param columns - Column configuration
     * @param tableOpts - Table options
     * @param printOpts - Print options
     */
    printTable: <T extends Record<string, string>>(data: T[], columns: TableColumn<keyof T & string>[], tableOpts?: PrintTableOptions, printOpts?: PrinterOptions) => Promise<void>;
    /**
     * Print raw ESC/POS data
     * @param data - Raw data to print
     */
    printRaw: (data: string) => Promise<void>;
    /**
     * Open cash drawer connected to the printer
     */
    openCashDrawer: () => Promise<void>;
    /**
     * Add a print job to the queue
     * Jobs are processed sequentially
     * @param job - Async function that performs the print operation
     */
    queuePrint: (job: () => Promise<void>) => Promise<void>;
    /**
     * Clear all pending print jobs
     */
    clearQueue: () => void;
    /**
     * Get number of pending print jobs
     */
    getQueueLength: () => number;
    /**
     * Get battery level of the printer
     * @returns Promise<number> - Battery level percentage (0-100), -1 if unavailable
     */
    getBatteryLevel: () => Promise<number>;
    /**
     * Get paper status of the printer
     * @returns Promise<string> - Paper status: 'ok', 'low', 'empty', or 'unknown'
     */
    getPaperStatus: () => Promise<"ok" | "low" | "empty" | "unknown">;
    /**
     * Get complete printer status including connection, battery, and paper
     * @returns Promise<PrinterStatus>
     */
    getPrinterStatus: () => Promise<PrinterStatus>;
};
export { COMMANDS };
export type { TableColumn, PrintTableOptions };
export { ColumnAlign };
export { PrinterError, PrinterErrorCode } from './errors';
export { generateTableText } from './utils/print-table';
export default BLEPrinter;
