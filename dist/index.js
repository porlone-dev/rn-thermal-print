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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
import { NativeModules, Platform } from "react-native";
import * as EPToolkit from "./utils/EPToolkit";
import { processColumnText } from "./utils/print-column";
import { COMMANDS } from "./utils/printer-commands";
var RNBLEPrinter = NativeModules.RNBLEPrinter;
export var PrinterWidth;
(function (PrinterWidth) {
    PrinterWidth[PrinterWidth["58mm"] = 58] = "58mm";
    PrinterWidth[PrinterWidth["80mm"] = 80] = "80mm";
})(PrinterWidth || (PrinterWidth = {}));
export var ColumnAlignment;
(function (ColumnAlignment) {
    ColumnAlignment[ColumnAlignment["LEFT"] = 0] = "LEFT";
    ColumnAlignment[ColumnAlignment["CENTER"] = 1] = "CENTER";
    ColumnAlignment[ColumnAlignment["RIGHT"] = 2] = "RIGHT";
})(ColumnAlignment || (ColumnAlignment = {}));
var textTo64Buffer = function (text, opts) {
    var defaultOptions = {
        beep: false,
        cut: false,
        tailingLine: false,
        encoding: "UTF8",
    };
    var options = __assign(__assign({}, defaultOptions), opts);
    var fixAndroid = "\n";
    var buffer = EPToolkit.exchange_text(text + fixAndroid, options);
    return buffer.toString("base64");
};
var billTo64Buffer = function (text, opts) {
    var defaultOptions = {
        beep: true,
        cut: true,
        encoding: "UTF8",
        tailingLine: true,
    };
    var options = __assign(__assign({}, defaultOptions), opts);
    var buffer = EPToolkit.exchange_text(text, options);
    return buffer.toString("base64");
};
var textPreprocessingIOS = function (text, canCut, beep) {
    if (canCut === void 0) { canCut = true; }
    if (beep === void 0) { beep = true; }
    var options = {
        beep: beep,
        cut: canCut,
    };
    return {
        text: text
            .replace(/<\/?CB>/g, "")
            .replace(/<\/?CM>/g, "")
            .replace(/<\/?CD>/g, "")
            .replace(/<\/?C>/g, "")
            .replace(/<\/?D>/g, "")
            .replace(/<\/?B>/g, "")
            .replace(/<\/?M>/g, ""),
        opts: options,
    };
};
var queuePrint = function (fn) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            fn();
            resolve();
        }, 100);
    });
};
var BLEPrinter = {
    init: function () {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.init(function () { return resolve(); }, function (error) { return reject(error); });
        });
    },
    getDeviceList: function () {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.getDeviceList(function (printers) { return resolve(printers); }, function (error) { return reject(error); });
        });
    },
    connectPrinter: function (inner_mac_address) {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.connectPrinter(inner_mac_address, function (printer) { return resolve(printer); }, function (error) { return reject(error); });
        });
    },
    closeConn: function () {
        return new Promise(function (resolve) {
            RNBLEPrinter.closeConn();
            resolve();
        });
    },
    printText: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(void 0, void 0, void 0, function () {
            var processedText_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText_1 = textPreprocessingIOS(text, false, false);
                        return [4 /*yield*/, queuePrint(function () {
                                return RNBLEPrinter.printRawData(processedText_1.text, processedText_1.opts, function (error) { return console.warn(error); });
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, queuePrint(function () {
                            return RNBLEPrinter.printRawData(textTo64Buffer(text, opts), function (error) {
                                return console.warn(error);
                            });
                        })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    printBill: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(void 0, void 0, void 0, function () {
            var processedText_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText_2 = textPreprocessingIOS(text, (_a = opts === null || opts === void 0 ? void 0 : opts.cut) !== null && _a !== void 0 ? _a : true, (_b = opts.beep) !== null && _b !== void 0 ? _b : true);
                        return [4 /*yield*/, queuePrint(function () {
                                return RNBLEPrinter.printRawData(processedText_2.text, processedText_2.opts, function (error) { return console.warn(error); });
                            })];
                    case 1:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, queuePrint(function () {
                            return RNBLEPrinter.printRawData(billTo64Buffer(text, opts), function (error) {
                                return console.warn(error);
                            });
                        })];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: function (imgUrl, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        /**
                         * just development
                         */
                        return [4 /*yield*/, queuePrint(function () {
                                return RNBLEPrinter.printImageData(imgUrl, opts, function (error) {
                                    return console.warn(error);
                                });
                            })];
                    case 1:
                        /**
                         * just development
                         */
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, queuePrint(function () {
                            var _a, _b;
                            return RNBLEPrinter.printImageData(imgUrl, (_a = opts === null || opts === void 0 ? void 0 : opts.imageWidth) !== null && _a !== void 0 ? _a : 0, (_b = opts === null || opts === void 0 ? void 0 : opts.imageHeight) !== null && _b !== void 0 ? _b : 0, function (error) { return console.warn(error); });
                        })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * base 64 string
     * @param Base64
     * @param opts
     */
    printImageBase64: function (Base64, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        /**
                         * just development
                         */
                        return [4 /*yield*/, queuePrint(function () {
                                return RNBLEPrinter.printImageBase64(Base64, opts, function (error) {
                                    return console.warn(error);
                                });
                            })];
                    case 1:
                        /**
                         * just development
                         */
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: 
                    /**
                     * just development
                     */
                    return [4 /*yield*/, queuePrint(function () {
                            var _a, _b;
                            return RNBLEPrinter.printImageBase64(Base64, (_a = opts === null || opts === void 0 ? void 0 : opts.imageWidth) !== null && _a !== void 0 ? _a : 0, (_b = opts === null || opts === void 0 ? void 0 : opts.imageHeight) !== null && _b !== void 0 ? _b : 0, function (error) { return console.warn(error); });
                        })];
                    case 3:
                        /**
                         * just development
                         */
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * android print with encoder
     * @param text
     */
    printRaw: function (text) { return __awaiter(void 0, void 0, void 0, function () {
        var processedText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                    processedText = textPreprocessingIOS(text, false, false);
                    return [4 /*yield*/, queuePrint(function () {
                            return RNBLEPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, queuePrint(function () {
                        return RNBLEPrinter.printRawData(text, function (error) { return console.warn(error); });
                    })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); },
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: function (texts, columnWidth, columnAlignment, columnStyle, opts) {
        if (opts === void 0) { opts = {}; }
        return __awaiter(void 0, void 0, void 0, function () {
            var result, processedText_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = processColumnText(texts, columnWidth, columnAlignment, columnStyle);
                        if (!(Platform.OS === "ios")) return [3 /*break*/, 2];
                        processedText_3 = textPreprocessingIOS(result, false, false);
                        return [4 /*yield*/, queuePrint(function () {
                                return RNBLEPrinter.printRawData(processedText_3.text, processedText_3.opts, function (error) { return console.warn(error); });
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, queuePrint(function () {
                            return RNBLEPrinter.printRawData(textTo64Buffer(result, opts), function (error) { return console.warn(error); });
                        })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
};
export { BLEPrinter, COMMANDS };
