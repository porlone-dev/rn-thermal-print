export enum PrinterErrorCode {
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  PRINT_FAILED = 'PRINT_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  BLUETOOTH_UNAVAILABLE = 'BLUETOOTH_UNAVAILABLE',
  INIT_ERROR = 'INIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class PrinterError extends Error {
  code: PrinterErrorCode;
  originalError?: Error;

  constructor(message: string, code: PrinterErrorCode = PrinterErrorCode.UNKNOWN_ERROR, originalError?: Error) {
    super(message);
    this.name = 'PrinterError';
    this.code = code;
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrinterError);
    }
  }
}

export function wrapError(error: any, defaultCode: PrinterErrorCode = PrinterErrorCode.UNKNOWN_ERROR): PrinterError {
  if (error instanceof PrinterError) {
    return error;
  }
  
  const message = error?.message || String(error);
  const code = error?.code || defaultCode;
  
  return new PrinterError(message, code, error);
}
