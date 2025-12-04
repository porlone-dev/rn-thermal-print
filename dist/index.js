var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { NativeModules, Platform, TurboModuleRegistry } from "react-native";
import * as EPToolkit from "./utils/EPToolkit";
import { processColumnText } from "./utils/print-column";
import { COMMANDS } from "./utils/printer-commands";
import { PrinterError, PrinterErrorCode, wrapError } from "./errors";
// Automatic architecture detection
// @ts-ignore - __turboModuleProxy is not in React Native types but exists at runtime
var isTurboModuleEnabled = global.__turboModuleProxy != null;
var RNBLEPrinterModule = isTurboModuleEnabled
    ? TurboModuleRegistry.get('RNBLEPrinter')
    : NativeModules.RNBLEPrinter;
if (!RNBLEPrinterModule) {
    throw new PrinterError('RNBLEPrinter native module is not available. Make sure the library is properly linked.', PrinterErrorCode.NOT_INITIALIZED);
}
var RNBLEPrinter = RNBLEPrinterModule;
var ColumnAlignment;
(function (ColumnAlignment) {
    ColumnAlignment[ColumnAlignment["LEFT"] = 0] = "LEFT";
    ColumnAlignment[ColumnAlignment["CENTER"] = 1] = "CENTER";
    ColumnAlignment[ColumnAlignment["RIGHT"] = 2] = "RIGHT";
})(ColumnAlignment || (ColumnAlignment = {}));
var PrinterWidth;
(function (PrinterWidth) {
    PrinterWidth[PrinterWidth["58mm"] = 58] = "58mm";
    PrinterWidth[PrinterWidth["80mm"] = 80] = "80mm";
})(PrinterWidth || (PrinterWidth = {}));
// Helper function for processing text on Android
var processTextAndroid = function (text, opts) {
    var _a, _b, _c, _d;
    var fixAndroid = "\n";
    var buffer = EPToolkit.exchange_text(text + fixAndroid, {
        beep: (_a = opts.beep) !== null && _a !== void 0 ? _a : false,
        cut: (_b = opts.cut) !== null && _b !== void 0 ? _b : false,
        tailingLine: (_c = opts.tailingLine) !== null && _c !== void 0 ? _c : false,
        encoding: (_d = opts.encoding) !== null && _d !== void 0 ? _d : "UTF8",
    });
    return buffer.toString("base64");
};
// Helper function for processing text on iOS
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
var BLEPrinter = {
    /**
     * Initialize the BLE printer module
     */
    init: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.init()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    throw wrapError(error_1, PrinterErrorCode.INIT_ERROR);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Get list of available BLE printers
     */
    getDeviceList: function () { return __awaiter(void 0, void 0, void 0, function () {
        var devices, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.getDeviceList()];
                case 1:
                    devices = _a.sent();
                    return [2 /*return*/, devices];
                case 2:
                    error_2 = _a.sent();
                    throw wrapError(error_2, PrinterErrorCode.DEVICE_NOT_FOUND);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Connect to a specific printer by MAC address
     */
    connectPrinter: function (inner_mac_address) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.connectPrinter(inner_mac_address)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 2:
                    error_3 = _a.sent();
                    throw wrapError(error_3, PrinterErrorCode.CONNECTION_FAILED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Close the current printer connection
     */
    closeConn: function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, RNBLEPrinter.closeConn()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    throw wrapError(error_4, PrinterErrorCode.NOT_CONNECTED);
                case 3: return [2 /*return*/];
            }
        });
    }); },
    /**
     * Print text without cutting or beeping (use for building receipts line by line)
     */
    printText: function (text_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([text_1], args_1, true), void 0, function (text, opts) {
            var processedText, data, error_5;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText = processTextIOS(text);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, __assign(__assign({}, opts), { beep: false, cut: false }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        data = processTextAndroid(text, opts);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(data, opts)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        throw wrapError(error_5, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print text and finish the bill (cuts paper and beeps by default)
     */
    printBill: function (text_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([text_1], args_1, true), void 0, function (text, opts) {
            var finalOpts, processedText, buffer, data, error_6;
            var _a, _b, _c, _d;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        finalOpts = {
                            beep: (_a = opts.beep) !== null && _a !== void 0 ? _a : true,
                            cut: (_b = opts.cut) !== null && _b !== void 0 ? _b : true,
                            tailingLine: (_c = opts.tailingLine) !== null && _c !== void 0 ? _c : true,
                            encoding: (_d = opts.encoding) !== null && _d !== void 0 ? _d : "UTF8",
                        };
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText = processTextIOS(text);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, finalOpts)];
                    case 1:
                        _e.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        buffer = EPToolkit.exchange_text(text, finalOpts);
                        data = buffer.toString("base64");
                        return [4 /*yield*/, RNBLEPrinter.printRawData(data, finalOpts)];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_6 = _e.sent();
                        throw wrapError(error_6, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print image from URL
     * @param imgUrl - Image URL to print
     * @param opts - Printer image options
     */
    printImage: function (imgUrl_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([imgUrl_1], args_1, true), void 0, function (imgUrl, opts) {
            var error_7;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, RNBLEPrinter.printImageData(imgUrl, opts)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        throw wrapError(error_7, PrinterErrorCode.PRINT_FAILED);
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print image from base64 string
     * @param base64 - Base64 encoded image string
     * @param opts - Printer image options
     */
    printImageBase64: function (base64_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([base64_1], args_1, true), void 0, function (base64, opts) {
            var error_8;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, RNBLEPrinter.printImageBase64(base64, opts)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        throw wrapError(error_8, PrinterErrorCode.PRINT_FAILED);
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Print raw data (primarily for Android with encoder support)
     * @param text - Raw text data to print
     */
    printRaw: function (text) { return __awaiter(void 0, void 0, void 0, function () {
        var processedText, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                    processedText = processTextIOS(text);
                    return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, {
                            beep: false,
                            cut: false,
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, RNBLEPrinter.printRawData(text, {})];
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
    }); },
    /**
     * Print text in columns
     * @param texts - Array of text for each column
     * @param columnWidth - Array of widths for each column (80mm => 46 chars, 58mm => 30 chars)
     * @param columnAlignment - Array of alignments for each column
     * @param columnStyle - Array of styles for each column
     * @param opts - Printer options
     */
    printColumnsText: function (texts_1, columnWidth_1, columnAlignment_1) {
        var args_1 = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args_1[_i - 3] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([texts_1, columnWidth_1, columnAlignment_1], args_1, true), void 0, function (texts, columnWidth, columnAlignment, columnStyle, opts) {
            var result, processedText, data, error_10;
            if (columnStyle === void 0) { columnStyle = []; }
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        result = processColumnText(texts, columnWidth, columnAlignment, columnStyle);
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText = processTextIOS(result);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(processedText, __assign(__assign({}, opts), { beep: false, cut: false }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        data = processTextAndroid(result, opts);
                        return [4 /*yield*/, RNBLEPrinter.printRawData(data, opts)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_10 = _a.sent();
                        throw wrapError(error_10, PrinterErrorCode.PRINT_FAILED);
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
};
// Export main API
export { BLEPrinter, COMMANDS };
// Export enums
export { ColumnAlignment, PrinterWidth };
// Export error types
export { PrinterError, PrinterErrorCode } from './errors';
