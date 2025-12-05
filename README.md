# @porlone/rn-thermal-print

A React Native library for BLE thermal receipt printers. Works out of the box - no additional packages required.

[![npm version](https://img.shields.io/npm/v/@porlone/rn-thermal-print.svg)](https://www.npmjs.com/package/@porlone/rn-thermal-print)
[![License](https://img.shields.io/npm/l/@porlone/rn-thermal-print.svg)](https://github.com/porlone-dev/rn-thermal-print/blob/master/LICENSE)

## ✨ Features

- 🔋 **Works out of the box** - Built-in permission handling, no additional packages needed
- 📱 **Cross-platform**: iOS & Android
- 🔵 **Bluetooth Low Energy** printer support
- 🖼️ **Image printing** - Auto-detects URL or Base64
- 📊 **Smart table printing** - Auto column widths with frozen column support
- ⚡ **Promise-based API** with proper error handling
- 📘 **Full TypeScript** support with autocomplete

## Requirements

- React Native >= 0.70.0
- iOS >= 12.4
- Android API Level >= 21 (Android 5.0)

## Installation

```bash
npm install @porlone/rn-thermal-print
# or
yarn add @porlone/rn-thermal-print
```

### iOS

```bash
cd ios && pod install && cd ..
```

### Android

No additional steps required.

## Quick Start

```typescript
import {
  BLEPrinter,
  ColumnAlign,
  requestPermissions,
} from "@porlone/rn-thermal-print";

// 1. Request permissions (Android)
const hasPermission = await requestPermissions();
if (!hasPermission) {
  console.log("Bluetooth permissions not granted");
  return;
}

// 2. Initialize and get devices
await BLEPrinter.init();
const devices = await BLEPrinter.getDeviceList();
console.log("Available printers:", devices);

// 3. Connect to printer
await BLEPrinter.connect(devices[0].inner_mac_address);

// 4. Print!
await BLEPrinter.printText("Hello World!\n");
await BLEPrinter.printText("================\n", { cut: true });

// 5. Disconnect when done
await BLEPrinter.disconnect();
```

## v2.0.0 Breaking Changes

### Removed Functions

- `printColumnsText()` - Use `printTable()` instead
- `printBill()` - Use `printText()` with `{ cut: true, beep: true }`
- `printReceipt()` - Use `printTable()` instead
- `printImageBase64()` - Use `printImage()` (auto-detects base64)

### Renamed Methods

- `connectPrinter()` → `connect()`
- `closeConn()` → `disconnect()`

### New Features

- Built-in `requestPermissions()` - No need for `react-native-ble-plx` or `expo-location`
- `printImage()` now auto-detects URL vs base64
- `printTable()` with smart column widths and frozen columns

## API Reference

### Permission Functions

```typescript
// Request BLE permissions (Android only, iOS returns true)
const granted = await requestPermissions();

// Check if permissions are granted
const hasPermission = await checkPermissions();

// Also available on BLEPrinter object
await BLEPrinter.requestPermissions();
await BLEPrinter.checkPermissions();
```

### BLEPrinter

```typescript
// Initialize the printer module
await BLEPrinter.init();

// Get available printers
const devices = await BLEPrinter.getDeviceList();
// Returns: BLEDevice[] = [{ device_name: string, inner_mac_address: string }]

// Connect to printer
await BLEPrinter.connect(macAddress);

// Disconnect
await BLEPrinter.disconnect();

// Print text
await BLEPrinter.printText("Hello\n");
await BLEPrinter.printText("Goodbye\n", { cut: true, beep: true });

// Print image (URL or base64 - auto-detected)
await BLEPrinter.printImage("https://example.com/logo.png");
await BLEPrinter.printImage("data:image/png;base64,iVBORw0...");
await BLEPrinter.printImage("iVBORw0KGgoAAAANSU..."); // raw base64

// Print raw ESC/POS data
await BLEPrinter.printRaw(rawData);
```

### Smart Table Printing

`printTable()` automatically calculates column widths. Use `frozen: true` for columns that should never wrap (like prices).

```typescript
import { BLEPrinter, ColumnAlign } from "@porlone/rn-thermal-print";

await BLEPrinter.printTable(
  [
    { item: "Chicken Rice Bowl", qty: "2", price: "25.00" },
    { item: "Iced Lemon Tea Large Size", qty: "1", price: "8.50" },
    { item: "Mineral Water", qty: "3", price: "5.00" },
  ],
  [
    { key: "item" }, // Flexible column - wraps if needed
    { key: "qty", frozen: true, align: ColumnAlign.CENTER },
    { key: "price", frozen: true, align: ColumnAlign.RIGHT },
  ],
  { printerWidth: "80mm", showHeader: true }
);
```

**Output:**

```
item                          qty   price
Chicken Rice Bowl              2    25.00
Iced Lemon Tea Large Size      1     8.50
Mineral Water                  3     5.00
```

### TableColumn Options

| Option     | Type        | Description                               |
| ---------- | ----------- | ----------------------------------------- |
| `key`      | string      | Key in data object (autocomplete enabled) |
| `header`   | string      | Header text (defaults to key)             |
| `frozen`   | boolean     | If true, column won't wrap                |
| `align`    | ColumnAlign | LEFT, CENTER, or RIGHT                    |
| `minWidth` | number      | Minimum column width                      |
| `maxWidth` | number      | Maximum column width                      |

### PrintTableOptions

| Option         | Type             | Default | Description       |
| -------------- | ---------------- | ------- | ----------------- |
| `printerWidth` | '58mm' \| '80mm' | '80mm'  | Paper width       |
| `showHeader`   | boolean          | false   | Show header row   |
| `headerLine`   | boolean          | false   | Line after header |
| `separator`    | string           | ' '     | Column separator  |

## Types

```typescript
interface BLEDevice {
  device_name: string;
  inner_mac_address: string;
}

interface PrinterOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
}

interface PrinterImageOptions {
  imageWidth?: number;
  imageHeight?: number;
  printerWidthType?: "58" | "80";
  paddingX?: number; // iOS only
}

enum ColumnAlign {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

enum PrinterWidth {
  WIDTH_58MM = 58,
  WIDTH_80MM = 80,
}
```

## Error Handling

```typescript
import { PrinterError, PrinterErrorCode } from "@porlone/rn-thermal-print";

try {
  await BLEPrinter.connect(address);
} catch (error) {
  if (error instanceof PrinterError) {
    switch (error.code) {
      case PrinterErrorCode.CONNECTION_FAILED:
        console.log("Failed to connect to printer");
        break;
      case PrinterErrorCode.NOT_CONNECTED:
        console.log("Printer not connected");
        break;
      case PrinterErrorCode.PRINT_FAILED:
        console.log("Print failed");
        break;
    }
  }
}
```

### Error Codes

| Code                    | Description             |
| ----------------------- | ----------------------- |
| `NOT_INITIALIZED`       | Module not initialized  |
| `NOT_CONNECTED`         | No printer connected    |
| `PRINT_FAILED`          | Print operation failed  |
| `CONNECTION_FAILED`     | Failed to connect       |
| `DEVICE_NOT_FOUND`      | No devices found        |
| `BLUETOOTH_UNAVAILABLE` | Bluetooth not available |
| `INIT_ERROR`            | Initialization error    |

## Text Formatting

```typescript
import { COMMANDS } from "@porlone/rn-thermal-print";

// Bold
await BLEPrinter.printText(
  `${COMMANDS.TEXT_FORMAT.TXT_BOLD_ON}Bold Text${COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF}\n`
);

// Center align
await BLEPrinter.printText("<C>Centered Text</C>\n");

// Large text
await BLEPrinter.printText("<CB>Large Bold Center</CB>\n");
```

### Available Tags

- `<C>` - Center align
- `<B>` - Bold
- `<CB>` - Center + Bold (large)
- `<D>` - Double height
- `<CD>` - Center + Double height
- `<CM>` - Center + Medium

## Migration from v1.x

```typescript
// Before (v1.x)
import { BLEPrinter } from "@porlone/rn-thermal-print";
import { BleManager } from "react-native-ble-plx";
import * as Location from "expo-location";

// Manual permission handling required
const bleManager = new BleManager();
await Location.requestForegroundPermissionsAsync();
// ... complex permission logic

await BLEPrinter.connectPrinter(address);
await BLEPrinter.printBill("text");
await BLEPrinter.printImageBase64(base64);
await BLEPrinter.closeConn();

// After (v2.0)
import { BLEPrinter, requestPermissions } from "@porlone/rn-thermal-print";

// Simple - just one call!
await requestPermissions();

await BLEPrinter.connect(address);
await BLEPrinter.printText("text", { cut: true, beep: true });
await BLEPrinter.printImage(base64); // auto-detects
await BLEPrinter.disconnect();
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
