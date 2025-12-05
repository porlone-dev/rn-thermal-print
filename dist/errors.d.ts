export declare enum PrinterErrorCode {
    NOT_INITIALIZED = "NOT_INITIALIZED",
    NOT_CONNECTED = "NOT_CONNECTED",
    PRINT_FAILED = "PRINT_FAILED",
    CONNECTION_FAILED = "CONNECTION_FAILED",
    DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
    BLUETOOTH_UNAVAILABLE = "BLUETOOTH_UNAVAILABLE",
    INIT_ERROR = "INIT_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class PrinterError extends Error {
    code: PrinterErrorCode;
    originalError?: Error;
    constructor(message: string, code?: PrinterErrorCode, originalError?: Error);
}
export declare function wrapError(error: any, defaultCode?: PrinterErrorCode): PrinterError;
