var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
export var PrinterErrorCode;
(function (PrinterErrorCode) {
    PrinterErrorCode["NOT_INITIALIZED"] = "NOT_INITIALIZED";
    PrinterErrorCode["NOT_CONNECTED"] = "NOT_CONNECTED";
    PrinterErrorCode["PRINT_FAILED"] = "PRINT_FAILED";
    PrinterErrorCode["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    PrinterErrorCode["DEVICE_NOT_FOUND"] = "DEVICE_NOT_FOUND";
    PrinterErrorCode["BLUETOOTH_UNAVAILABLE"] = "BLUETOOTH_UNAVAILABLE";
    PrinterErrorCode["INIT_ERROR"] = "INIT_ERROR";
    PrinterErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(PrinterErrorCode || (PrinterErrorCode = {}));
var PrinterError = /** @class */ (function (_super) {
    __extends(PrinterError, _super);
    function PrinterError(message, code, originalError) {
        if (code === void 0) { code = PrinterErrorCode.UNKNOWN_ERROR; }
        var _this = _super.call(this, message) || this;
        _this.name = 'PrinterError';
        _this.code = code;
        _this.originalError = originalError;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, PrinterError);
        }
        return _this;
    }
    return PrinterError;
}(Error));
export { PrinterError };
export function wrapError(error, defaultCode) {
    if (defaultCode === void 0) { defaultCode = PrinterErrorCode.UNKNOWN_ERROR; }
    if (error instanceof PrinterError) {
        return error;
    }
    var message = (error === null || error === void 0 ? void 0 : error.message) || String(error);
    var code = (error === null || error === void 0 ? void 0 : error.code) || defaultCode;
    return new PrinterError(message, code, error);
}
