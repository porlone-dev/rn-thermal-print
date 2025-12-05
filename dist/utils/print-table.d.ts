/**
 * Smart table printing utility
 * Automatically calculates column widths and handles text wrapping
 */
export declare enum ColumnAlign {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}
export interface TableColumn<K extends string = string> {
    /** Key in the data object */
    key: K;
    /** Optional header text (defaults to key) */
    header?: string;
    /** Column alignment (default: LEFT, frozen columns default to RIGHT) */
    align?: ColumnAlign;
    /** If true, this column will not wrap and maintains its content width */
    frozen?: boolean;
    /** Minimum width for the column */
    minWidth?: number;
    /** Maximum width for the column (only applies to non-frozen) */
    maxWidth?: number;
}
export interface PrintTableOptions {
    /** Printer width: '58mm' (32 chars) or '80mm' (48 chars). Default: '80mm' */
    printerWidth?: '58mm' | '80mm';
    /** Show header row. Default: false */
    showHeader?: boolean;
    /** Column separator. Default: ' ' */
    separator?: string;
    /** Add separator line after header. Default: false */
    headerLine?: boolean;
    /** Character for header line. Default: '-' */
    headerLineChar?: string;
}
/**
 * Generate formatted table text from data
 */
export declare const generateTableText: <T extends Record<string, string>>(data: T[], columns: TableColumn<keyof T & string>[], options?: PrintTableOptions) => string;
/**
 * Helper to create a simple two-column receipt layout
 * @param items - Array of {label, value} items
 * @param options - Print options
 */
export declare const generateReceiptText: (items: {
    label: string;
    value: string;
}[], options?: PrintTableOptions) => string;
