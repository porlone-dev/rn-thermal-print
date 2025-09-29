import { COMMANDS } from "./utils/printer-commands";
export interface PrinterOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
}
export declare enum PrinterWidth {
    "58mm" = 58,
    "80mm" = 80
}
export interface PrinterImageOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
    imageWidth?: number;
    imageHeight?: number;
    printerWidthType?: PrinterWidth;
    paddingX?: number;
}
export interface IBLEPrinter {
    device_name: string;
    inner_mac_address: string;
}
export declare enum ColumnAlignment {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}
declare const BLEPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<IBLEPrinter[]>;
    connectPrinter: (inner_mac_address: string) => Promise<IBLEPrinter>;
    closeConn: () => Promise<void>;
    printText: (text: string, opts?: PrinterOptions) => Promise<void>;
    printBill: (text: string, opts?: PrinterOptions) => Promise<void>;
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * base 64 string
     * @param Base64
     * @param opts
     */
    printImageBase64: (Base64: string, opts?: PrinterImageOptions) => Promise<void>;
    /**
     * android print with encoder
     * @param text
     */
    printRaw: (text: string) => Promise<void>;
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: (texts: string[], columnWidth: number[], columnAlignment: ColumnAlignment[], columnStyle: string[], opts?: PrinterOptions) => Promise<void>;
};
export { BLEPrinter, COMMANDS };
