var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { NativeModules, Platform, PermissionsAndroid } from "react-native";
import * as EPToolkit from "./utils/EPToolkit";
import { generateTableText, ColumnAlign } from "./utils/print-table";
import { COMMANDS } from "./utils/printer-commands";
import { PrinterError, PrinterErrorCode, wrapError } from "./errors";
var RNBLEPrinterModule = NativeModules.RNBLEPrinter;
if (!RNBLEPrinterModule) {
    throw new PrinterError('RNBLEPrinter native module is not available. Make sure the library is properly linked.', PrinterErrorCode.NOT_INITIALIZED);
}
var RNBLEPrinter = RNBLEPrinterModule;
export var PrinterWidth;
(function (PrinterWidth) {
    PrinterWidth[PrinterWidth["WIDTH_58MM"] = 58] = "WIDTH_58MM";
    PrinterWidth[PrinterWidth["WIDTH_80MM"] = 80] = "WIDTH_80MM";
})(PrinterWidth || (PrinterWidth = {}));
var PrintQueue = /** @class */ (function () {
    function PrintQueue() {
        this.queue = [];
        this.isProcessing = false;
    }
    PrintQueue.prototype.add = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.queue.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, job()];
                                    case 1:
                                        _a.sent();
                                        resolve();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_1 = _a.sent();
                                        reject(error_1);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        _this.process();
                    })];
            });
        });
    };
    PrintQueue.prototype.process = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isProcessing || this.queue.length === 0)
                            return [2 /*return*/];
                        this.isProcessing = true;
                        _a.label = 1;
                    case 1:
                        if (!(this.queue.length > 0)) return [3 /*break*/, 6];
                        job = this.queue.shift();
                        if (!job) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, job()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Print job failed:', error_2);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 1];
                    case 6:
                        this.isProcessing = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    PrintQueue.prototype.clear = function () {
        this.queue = [];
    };
    Object.defineProperty(PrintQueue.prototype, "length", {
        get: function () {
            return this.queue.length;
        },
        enumerable: false,
        configurable: true
    });
    return PrintQueue;
}());
var printQueue = new PrintQueue();
// ============================================================================
// Internal Helpers
// ============================================================================
var processTextAndroid = function (text, opts) {
    var _a, _b, _c, _d;
    var buffer = EPToolkit.exchange_text(text + "\n", {
        beep: (_a = opts.beep) !== null && _a !== void 0 ? _a : false,
        cut: (_b = opts.cut) !== null && _b !== void 0 ? _b : false,
        tailingLine: (_c = opts.tailingLine) !== null && _c !== void 0 ? _c : false,
        encoding: (_d = opts.encoding) !== null && _d !== void 0 ? _d : "UTF8",
    });
    return buffer.toString("base64");
};
var processTextIOS = function (text) {
    return text
        .replace(/<\/?CB>/g, "")
        .replace(/<\/?CM>/g, "")
        .replace(/<\/?CD>/g, "")
        .replace(/<\/?C>/g, "")
        .replace(/<\/?D>/g, "")
        .replace(/<\/?B>/g, "")
        .replace(/<\/?M>/g, "");
};
var isBase64 = function (str) {
    if (!str || str.length === 0)
        return false;
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://')) {
        return false;
    }
    var base64Regex = /^[A-Za-z0-9+/]+=*$/;
    var cleanStr = str.replace(/^data:image\/[a-z]+;base64,/, '');
    return base64Regex.test(cleanStr.replace(/\s/g, ''));
};
// ============================================================================
// Permissions
// ============================================================================
/**
 * Request Bluetooth and Location permissions required for BLE printing
 * @returns Promise<boolean> - true if all permissions granted
 */
export var requestPermissions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apiLevel, results, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Platform.OS !== 'android') {
                    return [2 /*return*/, true];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                apiLevel = Platform.Version;
                if (!(apiLevel >= 31)) return [3 /*break*/, 3];
                return [4 /*yield*/, PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    ])];
            case 2:
                results = _a.sent();
                return [2 /*return*/, (results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
                        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
                        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED)];
            case 3: return [4 /*yield*/, PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)];
            case 4:
                result = _a.sent();
                return [2 /*return*/, result === PermissionsAndroid.RESULTS.GRANTED];
            case 5: return [3 /*break*/, 7];
            case 6:
                error_3 = _a.sent();
                console.error('Failed to request permissions:', error_3);
                return [2 /*return*/, false];
            case 7: return [2 /*return*/];
        }
    });
}); };
/**
 * Check if Bluetooth permissions are granted
 * @returns Promise<boolean>
 */
export var checkPermissions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apiLevel, bluetoothScan, bluetoothConnect, location, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (Platform.OS !== 'android') {
                    return [2 /*return*/, true];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 8, , 9]);
                apiLevel = Platform.Version;
                if (!(apiLevel >= 31)) return [3 /*break*/, 5];
                return [4 /*yield*/, PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)];
            case 2:
                bluetoothScan = _b.sent();
                return [4 /*yield*/, PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)];
            case 3:
                bluetoothConnect = _b.sent();
                return [4 /*yield*/, PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)];
            case 4:
                location = _b.sent();
                return [2 /*return*/, bluetoothScan && bluetoothConnect && location];
            case 5: return [4 /*yield*/, PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)];
            case 6: return [2 /*return*/, _b.sent()];
            case 7: return [3 /*break*/, 9];
            case 8:
                _a = _b.sent();
                return [2 /*return*/, false];
            case 9: return [2 /*return*/];
        }
    });
}); };
// ============================================================================
// BLEPrinter API
// ============================================================================
export var BLEPrinter = {
    // -------------------------------------------------------------------------
    // Permissions
    // -------------------------------------------------------------------------
    requestPermissions: requestPermissions,
    checkPermissions: checkPermissions,
    // -------------------------------------------------------------------------
    // Connection Management
    // -------------------------------------------------------------------------
    /**
     * Initialize the BLE printer module
     */
    init: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.init()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    throw wrapError(error_4, PrinterErrorCode.INIT_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Get list of paired/available BLE printers
     */
    getDeviceList: function () { return __awaiter(void 0, void 0, void 0, function () {
        var devices, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.getDeviceList()];
                case 1:
                    devices = _a.sent();
                    return [2 /*return*/, devices];
                case 2:
                    error_5 = _a.sent();
                    throw wrapError(error_5, PrinterErrorCode.DEVICE_NOT_FOUND);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Connect to a printer by MAC address
     * @param macAddress - The printer's MAC address
     */
    connect: function (macAddress) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.connectPrinter(macAddress)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 2:
                    error_6 = _a.sent();
                    throw wrapError(error_6, PrinterErrorCode.CONNECTION_FAILED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Disconnect from the current printer
     */
    disconnect: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.closeConn()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    throw wrapError(error_7, PrinterErrorCode.NOT_CONNECTED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Check if printer is currently connected
     * @returns Promise<boolean>
     */
    isConnected: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, , 5]);
                    if (!(Platform.OS === 'ios')) return [3 /*break*/, 2];
                    return [4 /*yield*/, ((_b = RNBLEPrinter.isConnected) === null || _b === void 0 ? void 0 : _b.call(RNBLEPrinter))];
                case 1: 
                // iOS implementation - check if m_printer exists
                return [2 /*return*/, (_c = _d.sent()) !== null && _c !== void 0 ? _c : false];
                case 2: return [4 /*yield*/, RNBLEPrinter.isConnected()];
                case 3: return [2 /*return*/, _d.sent()];
                case 4:
                    _a = _d.sent();
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); },
    // -------------------------------------------------------------------------
    // Text Printing
    // -------------------------------------------------------------------------
    /**
     * Print text
     * @param text - Text to print
     * @param opts - Print options
     */
    printText: function (text_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([text_1], args_1, true), void 0, function (text, opts) {
            var processedText, data, error_8;
            var _a, _b;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText = processTextIOS(text);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, {
                                beep: (_a = opts.beep) !== null && _a !== void 0 ? _a : false,
                                cut: (_b = opts.cut) !== null && _b !== void 0 ? _b : false,
                            })];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        data = processTextAndroid(text, opts);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(data, opts)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_8 = _c.sent();
                        throw wrapError(error_8, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    // -------------------------------------------------------------------------
    // Image Printing
    // -------------------------------------------------------------------------
    /**
     * Print image from URL or base64 string (auto-detected)
     * @param imageSource - Image URL or base64 string
     * @param opts - Image options
     */
    printImage: function (imageSource_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([imageSource_1], args_1, true), void 0, function (imageSource, opts) {
            var base64Data, error_9;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!isBase64(imageSource)) return [3 /*break*/, 2];
                        base64Data = imageSource.replace(/^data:image\/[a-z]+;base64,/, '');
                        return [4 /*yield*/, RNBLEPrinter.printImageBase64(base64Data, opts)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, RNBLEPrinter.printImageData(imageSource, opts)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_9 = _a.sent();
                        throw wrapError(error_9, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    // -------------------------------------------------------------------------
    // QR Code & Barcode
    // -------------------------------------------------------------------------
    /**
     * Print QR code
     * @param data - Data to encode in QR code
     * @param opts - QR code options
     */
    printQRCode: function (data_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([data_1], args_1, true), void 0, function (data, opts) {
            var size, error_10;
            var _a, _b, _c;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, , 6]);
                        size = (_a = opts.size) !== null && _a !== void 0 ? _a : 200;
                        if (!(Platform.OS === 'ios')) return [3 /*break*/, 2];
                        // iOS: Generate QR code as image and print
                        return [4 /*yield*/, ((_b = RNBLEPrinter.printQRCode) === null || _b === void 0 ? void 0 : _b.call(RNBLEPrinter, data, size))];
                    case 1:
                        // iOS: Generate QR code as image and print
                        (_c = _d.sent()) !== null && _c !== void 0 ? _c : Promise.reject(new Error('QR code not supported on this iOS version'));
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, RNBLEPrinter.printQRCode(data, size)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_10 = _d.sent();
                        throw wrapError(error_10, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print barcode
     * @param data - Data to encode in barcode
     * @param type - Barcode type (CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR)
     * @param opts - Barcode options
     */
    printBarcode: function (data_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([data_1], args_1, true), void 0, function (data, type, opts) {
            var width, height, error_11;
            var _a, _b, _c, _d;
            if (type === void 0) { type = 'CODE128'; }
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        width = (_a = opts.width) !== null && _a !== void 0 ? _a : 300;
                        height = (_b = opts.height) !== null && _b !== void 0 ? _b : 80;
                        if (!(Platform.OS === 'ios')) return [3 /*break*/, 2];
                        return [4 /*yield*/, ((_c = RNBLEPrinter.printBarcode) === null || _c === void 0 ? void 0 : _c.call(RNBLEPrinter, data, type, width, height))];
                    case 1:
                        (_d = _e.sent()) !== null && _d !== void 0 ? _d : Promise.reject(new Error('Barcode not supported on this iOS version'));
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, RNBLEPrinter.printBarcode(data, type, width, height)];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_11 = _e.sent();
                        throw wrapError(error_11, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    // -------------------------------------------------------------------------
    // Table Printing
    // -------------------------------------------------------------------------
    /**
     * Print a table with automatic column width calculation
     * @param data - Array of objects
     * @param columns - Column configuration
     * @param tableOpts - Table options
     * @param printOpts - Print options
     */
    printTable: function (data_1, columns_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([data_1, columns_1], args_1, true), void 0, function (data, columns, tableOpts, printOpts) {
            var result, processedText, textData, error_12;
            var _a, _b;
            if (tableOpts === void 0) { tableOpts = {}; }
            if (printOpts === void 0) { printOpts = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        result = generateTableText(data, columns, tableOpts);
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText = processTextIOS(result);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, {
                                beep: (_a = printOpts.beep) !== null && _a !== void 0 ? _a : false,
                                cut: (_b = printOpts.cut) !== null && _b !== void 0 ? _b : false,
                            })];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        textData = processTextAndroid(result, printOpts);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(textData, printOpts)];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_12 = _c.sent();
                        throw wrapError(error_12, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    // -------------------------------------------------------------------------
    // Raw Printing
    // -------------------------------------------------------------------------
    /**
     * Print raw ESC/POS data
     * @param data - Raw data to print
     */
    printRaw: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                    return [4 /*yield*/, RNBLEPrinter.printRawData(data, { beep: false, cut: false })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, RNBLEPrinter.printRawData(data, {})];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_13 = _a.sent();
                    throw wrapError(error_13, PrinterErrorCode.PRINT_FAILED);
                case 6: return [2 /*return*/];
            }
        });
    }); },
    // -------------------------------------------------------------------------
    // Cash Drawer
    // -------------------------------------------------------------------------
    /**
     * Open cash drawer connected to the printer
     */
    openCashDrawer: function () { return __awaiter(void 0, void 0, void 0, function () {
        var cashDrawerCommand, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(Platform.OS === 'ios')) return [3 /*break*/, 2];
                    cashDrawerCommand = '\x1B\x70\x00\x19\xFA';
                    return [4 /*yield*/, RNBLEPrinter.printRawData(cashDrawerCommand, { beep: false, cut: false })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, RNBLEPrinter.openCashDrawer()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_14 = _a.sent();
                    throw wrapError(error_14, PrinterErrorCode.PRINT_FAILED);
                case 6: return [2 /*return*/];
            }
        });
    }); },
    // -------------------------------------------------------------------------
    // Print Queue
    // -------------------------------------------------------------------------
    /**
     * Add a print job to the queue
     * Jobs are processed sequentially
     * @param job - Async function that performs the print operation
     */
    queuePrint: function (job) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, printQueue.add(job)];
        });
    }); },
    /**
     * Clear all pending print jobs
     */
    clearQueue: function () {
        printQueue.clear();
    },
    /**
     * Get number of pending print jobs
     */
    getQueueLength: function () {
        return printQueue.length;
    },
};
// ============================================================================
// Exports
// ============================================================================
export { COMMANDS };
export { ColumnAlign };
export { PrinterError, PrinterErrorCode } from './errors';
export { generateTableText } from './utils/print-table';
export default BLEPrinter;
