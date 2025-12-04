import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    init(): Promise<void>;
    getDeviceList(): Promise<Array<{
        device_name: string;
        inner_mac_address: string;
    }>>;
    connectPrinter(address: string): Promise<string>;
    closeConn(): Promise<void>;
    printRawData(data: string, options?: {
        beep?: boolean;
        cut?: boolean;
        tailingLine?: boolean;
        encoding?: string;
        bold?: boolean;
        center?: boolean;
    }): Promise<void>;
    printImageData(url: string, options: {
        beep?: boolean;
        cut?: boolean;
        tailingLine?: boolean;
        encoding?: string;
        imageWidth?: number;
        imageHeight?: number;
        printerWidthType?: string;
        paddingX?: number;
    }): Promise<void>;
    printImageBase64(base64: string, options: {
        beep?: boolean;
        cut?: boolean;
        tailingLine?: boolean;
        encoding?: string;
        imageWidth?: number;
        imageHeight?: number;
        printerWidthType?: string;
        paddingX?: number;
    }): Promise<void>;
}
declare const _default: Spec | null;
export default _default;
