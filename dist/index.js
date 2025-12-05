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
    // Check if it's a URL
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://')) {
        return false;
    }
    // Check for base64 pattern
    var base64Regex = /^[A-Za-z0-9+/]+=*$/;
    // Remove data URI prefix if present
    var cleanStr = str.replace(/^data:image\/[a-z]+;base64,/, '');
    return base64Regex.test(cleanStr.replace(/\s/g, ''));
};
// ============================================================================
// Permissions
// ============================================================================
/**
 * Request Bluetooth and Location permissions required for BLE printing
 * Call this before using any printer functions
 * @returns Promise<boolean> - true if all permissions granted
 */
export var requestPermissions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apiLevel, results, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Platform.OS !== 'android') {
                    return [2 /*return*/, true]; // iOS handles permissions differently
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
                error_1 = _a.sent();
                console.error('Failed to request permissions:', error_1);
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
    /**
     * Request permissions required for BLE printing (Android)
     * @returns Promise<boolean> - true if all permissions granted
     */
    requestPermissions: requestPermissions,
    /**
     * Check if permissions are granted
     * @returns Promise<boolean>
     */
    checkPermissions: checkPermissions,
    /**
     * Initialize the BLE printer module
     * Must be called before scanning for devices
     */
    init: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.init()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    throw wrapError(error_2, PrinterErrorCode.INIT_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Get list of paired/available BLE printers
     * @returns Array of BLE devices
     */
    getDeviceList: function () { return __awaiter(void 0, void 0, void 0, function () {
        var devices, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.getDeviceList()];
                case 1:
                    devices = _a.sent();
                    return [2 /*return*/, devices];
                case 2:
                    error_3 = _a.sent();
                    throw wrapError(error_3, PrinterErrorCode.DEVICE_NOT_FOUND);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Connect to a printer by MAC address
     * @param macAddress - The printer's MAC address (inner_mac_address from getDeviceList)
     */
    connect: function (macAddress) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.connectPrinter(macAddress)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 2:
                    error_4 = _a.sent();
                    throw wrapError(error_4, PrinterErrorCode.CONNECTION_FAILED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Disconnect from the current printer
     */
    disconnect: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.closeConn()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    throw wrapError(error_5, PrinterErrorCode.NOT_CONNECTED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Print text
     * @param text - Text to print
     * @param opts - Print options (beep, cut, encoding)
     */
    printText: function (text_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([text_1], args_1, true), void 0, function (text, opts) {
            var processedText, data, error_6;
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
                        error_6 = _c.sent();
                        throw wrapError(error_6, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print image from URL or base64 string (auto-detected)
     * @param imageSource - Image URL (http/https/file) or base64 string
     * @param opts - Image options (width, height, printerWidth)
     */
    printImage: function (imageSource_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([imageSource_1], args_1, true), void 0, function (imageSource, opts) {
            var base64Data, error_7;
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
                        error_7 = _a.sent();
                        throw wrapError(error_7, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print raw ESC/POS data (advanced usage)
     * @param data - Raw data to print
     */
    printRaw: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var error_8;
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
                    error_8 = _a.sent();
                    throw wrapError(error_8, PrinterErrorCode.PRINT_FAILED);
                case 6: return [2 /*return*/];
            }
        });
    }); },
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
    printTable: function (data_1, columns_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([data_1, columns_1], args_1, true), void 0, function (data, columns, tableOpts, printOpts) {
            var result, processedText, textData, error_9;
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
                        error_9 = _c.sent();
                        throw wrapError(error_9, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
};
// ============================================================================
// Exports
// ============================================================================
// ESC/POS Commands
export { COMMANDS };
// Enums
export { ColumnAlign };
// Errors
export { PrinterError, PrinterErrorCode } from './errors';
// Utility for advanced usage
export { generateTableText } from './utils/print-table';
// Default export
export default BLEPrinter;
