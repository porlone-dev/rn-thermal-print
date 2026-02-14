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
- 📱 **QR Code & Barcode** - Built-in generation and printing
- 💰 **Cash Drawer** - Open connected cash drawer
- 📋 **Print Queue** - Sequential print job processing
- ⚡ **Promise-based API** with proper error handling
- 🧵 **Thread-safe** - All Bluetooth operations run on background threads
- 🔄 **Auto-reconnect** - Configurable automatic reconnection on connection loss
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
import { BLEPrinter, requestPermissions } from "@porlone/rn-thermal-print";

// 1. Request permissions (Android)
const hasPermission = await requestPermissions();
if (!hasPermission) {
  console.log("Bluetooth permissions not granted");
  return;
}

// 2. Initialize and get devices
await BLEPrinter.init();
const devices = await BLEPrinter.getDeviceList();

// 3. Connect to printer
await BLEPrinter.connect(devices[0].inner_mac_address);

// 4. Print!
await BLEPrinter.printText("Hello World!\n");
await BLEPrinter.printQRCode("https://example.com");
await BLEPrinter.printText("\n", { cut: true });

// 5. Disconnect when done
await BLEPrinter.disconnect();
```

## Auto-Reconnect & Connection Options

Configure automatic reconnection on connection loss and connection timeout:

```typescript
// Connect with auto-reconnect
await BLEPrinter.connect(devices[0].inner_mac_address, {
  autoReconnect: true, // Enable auto-reconnect on connection loss
  maxReconnectAttempts: 3, // Maximum reconnection attempts (default: 3)
  reconnectDelay: 2000, // Delay between attempts in ms (default: 2000)
  timeout: 10000, // Connection timeout in ms (default: 10000)
});

// Connect with just timeout
await BLEPrinter.connect(devices[0].inner_mac_address, {
  timeout: 5000, // 5 second timeout
});
```

**Note**: Auto-reconnect is currently implemented for Android. iOS implementation stores the configuration but automatic reconnection depends on the underlying printer SDK.

### Connection Status

```typescript
// Check if printer is connected
const connected = await BLEPrinter.isConnected();
if (!connected) {
  await BLEPrinter.connect(address);
}
```

### Battery Level

Get printer battery level (if supported by the printer):

```typescript
// Get battery level
const batteryLevel = await BLEPrinter.getBatteryLevel();
// Returns: number (0-100) or -1 if unavailable/not supported

if (batteryLevel >= 0) {
  console.log(`Battery: ${batteryLevel}%`);
  if (batteryLevel < 20) {
    console.log("Low battery warning!");
  }
} else {
  console.log("Battery level not available");
}
```

**Note**: Most thermal printers don't support battery level queries via ESC/POS. This feature returns -1 for printers that don't support it. Implementation may need customization for specific printer models.

### Paper Status

Check printer paper status (if supported by the printer):

```typescript
// Get paper status
const paperStatus = await BLEPrinter.getPaperStatus();
// Returns: 'ok' | 'low' | 'empty' | 'unknown'

switch (paperStatus) {
  case "ok":
    console.log("Paper level is good");
    break;
  case "low":
    console.log("Paper running low");
    break;
  case "empty":
    console.log("Paper is empty!");
    break;
  case "unknown":
    console.log("Paper status unavailable");
    break;
}
```

**Note**: Paper status detection uses ESC/POS status commands. Some printers may not support this feature or may return 'unknown'. Implementation uses standard ESC/POS commands that work with most compatible printers.

### Complete Printer Status

Get all status information at once:

```typescript
// Get complete printer status
const status = await BLEPrinter.getPrinterStatus();

console.log(`Connected: ${status.isConnected}`);
console.log(`Battery: ${status.batteryLevel}%`);
console.log(`Paper: ${status.paperStatus}`);

// Example: Check before printing
const status = await BLEPrinter.getPrinterStatus();
if (!status.isConnected) {
  console.log("Printer not connected");
  return;
}
if (status.paperStatus === "empty") {
  console.log("Please load paper");
  return;
}
if (status.batteryLevel >= 0 && status.batteryLevel < 15) {
  console.log("Low battery warning");
}

// Proceed with printing
await BLEPrinter.printText("Hello World!\n", { cut: true });
```

### QR Code Printing

```typescript
// Print QR code with default size (200px)
await BLEPrinter.printQRCode("https://example.com");

// Print QR code with custom size
await BLEPrinter.printQRCode("https://example.com", { size: 300 });
```

### Barcode Printing

```typescript
// Print CODE128 barcode (default)
await BLEPrinter.printBarcode("1234567890");

// Print with specific type and size
await BLEPrinter.printBarcode("1234567890", "EAN13", {
  width: 300,
  height: 80,
});

// Supported types: CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR
```

### Cash Drawer

```typescript
// Open cash drawer connected to printer
await BLEPrinter.openCashDrawer();
```

### Print Queue

```typescript
// Queue multiple print jobs - processed sequentially
await BLEPrinter.queuePrint(async () => {
  await BLEPrinter.printText("Receipt #1\n");
});

await BLEPrinter.queuePrint(async () => {
  await BLEPrinter.printText("Receipt #2\n");
});

// Get queue length
const pending = BLEPrinter.getQueueLength();

// Clear queue
BLEPrinter.clearQueue();
```

## API Reference

### Connection Management

```typescript
// Initialize the printer module
await BLEPrinter.init();

// Get available printers
const devices = await BLEPrinter.getDeviceList();
// Returns: BLEDevice[] = [{ device_name: string, inner_mac_address: string }]

// Connect to printer
await BLEPrinter.connect(macAddress);

// Connect with options (auto-reconnect, timeout)
await BLEPrinter.connect(macAddress, {
  autoReconnect: true,
  maxReconnectAttempts: 3,
  reconnectDelay: 2000,
  timeout: 10000,
});

// Check connection status
const connected = await BLEPrinter.isConnected();

// Disconnect
await BLEPrinter.disconnect();
```

### Printer Status

```typescript
// Get battery level (0-100, or -1 if unavailable)
const batteryLevel = await BLEPrinter.getBatteryLevel();

// Get paper status
const paperStatus = await BLEPrinter.getPaperStatus();
// Returns: 'ok' | 'low' | 'empty' | 'unknown'

// Get complete status
const status = await BLEPrinter.getPrinterStatus();
// Returns: { isConnected: boolean, batteryLevel: number, paperStatus: string }
```

### Text Printing

```typescript
// Print text
await BLEPrinter.printText("Hello\n");

// Print with options
await BLEPrinter.printText("Goodbye\n", {
  cut: true, // Cut paper after printing
  beep: true, // Beep after printing
  encoding: "UTF8",
});
```

### Image Printing

```typescript
// Print from URL
await BLEPrinter.printImage("https://example.com/logo.png");

// Print from base64 (auto-detected)
await BLEPrinter.printImage("data:image/png;base64,iVBORw0...");
await BLEPrinter.printImage("iVBORw0KGgoAAAANSU..."); // raw base64

// With options
await BLEPrinter.printImage(imageSource, {
  imageWidth: 300,
  imageHeight: 200,
  printerWidthType: "80", // or "58"
});
```

### QR Code & Barcode

```typescript
// QR Code
await BLEPrinter.printQRCode(data, { size: 200 });

// Barcode
await BLEPrinter.printBarcode(data, type, { width: 300, height: 80 });

// Supported barcode types:
type BarcodeType =
  | "CODE128" // Default
  | "CODE39"
  | "EAN13"
  | "EAN8"
  | "UPC_A"
  | "UPC_E"
  | "ITF"
  | "CODABAR";
```

### Smart Table Printing

```typescript
import { BLEPrinter, ColumnAlign } from "@porlone/rn-thermal-print";

await BLEPrinter.printTable(
  [
    { item: "Chicken Rice Bowl", qty: "2", price: "25.00" },
    { item: "Iced Lemon Tea Large Size", qty: "1", price: "8.50" },
  ],
  [
    { key: "item" }, // Flexible - wraps if needed
    { key: "qty", frozen: true, align: ColumnAlign.CENTER },
    { key: "price", frozen: true, align: ColumnAlign.RIGHT },
  ],
  { printerWidth: "80mm", showHeader: true },
);
```

### Cash Drawer

```typescript
// Open cash drawer (sends ESC/POS command)
await BLEPrinter.openCashDrawer();
```

### Print Queue

```typescript
// Add job to queue
await BLEPrinter.queuePrint(async () => {
  await BLEPrinter.printText("Queued job\n");
});

// Get pending jobs count
const count = BLEPrinter.getQueueLength();

// Clear all pending jobs
BLEPrinter.clearQueue();
```

## Types

```typescript
interface BLEDevice {
  device_name: string;
  inner_mac_address: string;
}

interface ConnectionOptions {
  autoReconnect?: boolean; // Enable auto-reconnect (default: false)
  maxReconnectAttempts?: number; // Max reconnection attempts (default: 3)
  reconnectDelay?: number; // Delay between attempts in ms (default: 2000)
  timeout?: number; // Connection timeout in ms (default: 10000)
}

interface PrinterStatus {
  batteryLevel: number; // 0-100 or -1 if unavailable
  paperStatus: "ok" | "low" | "empty" | "unknown";
  isConnected: boolean;
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
  paddingX?: number;
}

interface QRCodeOptions {
  size?: number; // Default: 200
}

interface BarcodeOptions {
  width?: number; // Default: 300
  height?: number; // Default: 80
}

interface TableColumn<K> {
  key: K;
  header?: string;
  frozen?: boolean;
  align?: ColumnAlign;
  minWidth?: number;
  maxWidth?: number;
}

interface PrintTableOptions {
  printerWidth?: "58mm" | "80mm";
  showHeader?: boolean;
  headerLine?: boolean;
  separator?: string;
}

enum ColumnAlign {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
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
  `${COMMANDS.TEXT_FORMAT.TXT_BOLD_ON}Bold Text${COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF}\n`,
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

## Complete Receipt Example

```typescript
import { BLEPrinter, ColumnAlign, COMMANDS } from "@porlone/rn-thermal-print";

async function printReceipt() {
  // Print header
  await BLEPrinter.printText("<CB>MY STORE</CB>\n");
  await BLEPrinter.printText("<C>123 Main Street</C>\n");
  await BLEPrinter.printText("<C>Tel: 123-456-7890</C>\n\n");

  // Print QR code for digital receipt
  await BLEPrinter.printQRCode("https://mystore.com/receipt/12345", {
    size: 150,
  });
  await BLEPrinter.printText("\n");

  // Print items table
  await BLEPrinter.printTable(
    [
      { item: "Coffee", qty: "2", price: "10.00" },
      { item: "Sandwich", qty: "1", price: "15.00" },
    ],
    [
      { key: "item" },
      { key: "qty", frozen: true, align: ColumnAlign.CENTER },
      { key: "price", frozen: true, align: ColumnAlign.RIGHT },
    ],
    { printerWidth: "80mm" },
  );

  await BLEPrinter.printText("\n--------------------------------\n");
  await BLEPrinter.printText("Total:                    $35.00\n");
  await BLEPrinter.printText("\n<C>Thank you!</C>\n");

  // Print barcode
  await BLEPrinter.printBarcode("RCP12345", "CODE128");

  // Cut paper
  await BLEPrinter.printText("\n", { cut: true });

  // Open cash drawer
  await BLEPrinter.openCashDrawer();
}
```

---

## Changelog

### v2.2.0 — Threading & Reliability (2026-02-14)

**🔴 Critical Fixes:**

- **`connect()` no longer blocks the UI thread** — `BluetoothSocket.connect()` now runs on a background `ExecutorService` with a configurable timeout (default: 10 seconds). Previously, connecting to a powered-off or out-of-range printer would freeze the entire React Native app for 12-30+ seconds.
- **`printImage()` with URL no longer performs network I/O on the main thread** — Image downloads now run on a dedicated background executor with proper network timeouts (15s connect, 30s read).

**🟡 High Priority Fixes:**

- **Added `isConnected()` API** — New native method and JS bridge to check connection status without attempting a print operation. Returns `Promise<boolean>`.
- **`disconnect()` now properly waits for socket closure** — The socket is closed synchronously, references are nulled, and any in-flight connection attempt is cancelled. This prevents races when `connect()` is called immediately after `disconnect()`.
- **Print failures now properly reject promises** — All print methods (`printText`, `printRaw`, `printImage`, `printQRCode`, `printBarcode`, `openCashDrawer`) now check `isConnected()` before attempting writes. IOExceptions during printing are properly reported to JavaScript with `PRINT_FAILED` or `NOT_CONNECTED` error codes instead of silently failing.

**🟢 Medium Priority Fixes:**

- **Thread safety across all methods** — All socket access is now guarded by a `ReentrantLock`. Connection state is tracked with `AtomicBoolean`. This prevents `NullPointerException` and `IOException` crashes from concurrent `disconnect()` + `printText()` calls.
- **Auto-reconnect reliability improvements** — Reconnection logic now uses `AtomicBoolean` guards to prevent duplicate reconnect attempts. Reconnection runs on the connection executor thread and properly resets state on success/failure.

**📋 Other Improvements:**

- Added `NOT_CONNECTED` pre-flight checks in `RNBLEPrinterModule.kt` for all operations.
- `PrinterAdapter` interface now includes `isConnected()` method.
- Added `AtomicBoolean` error guards in Kotlin module to prevent double-rejection of React Native promises.

### v2.1.0 — Auto-Reconnect & Printer Status

**New Features:**

- **Auto-reconnect** — Configure automatic reconnection on connection loss with `ConnectionOptions` (`autoReconnect`, `maxReconnectAttempts`, `reconnectDelay`, `timeout`).
- **Connection timeout** — Configurable timeout for Bluetooth connections (default: 10 seconds).
- **`isConnected()` API** — Check if the printer is currently connected without attempting a print.
- **Battery level** — Get printer battery level via `getBatteryLevel()`. Returns 0-100 or -1 if unsupported.
- **Paper status** — Get paper sensor status via `getPaperStatus()`. Returns `'ok'`, `'low'`, `'empty'`, or `'unknown'`.
- **Complete printer status** — Get all status information at once via `getPrinterStatus()`.

### v2.0.0 — Major Rewrite

**Breaking Changes:**

- Migrated Android native module from Java to **Kotlin** (`RNBLEPrinterModule.kt`).
- All methods now use **Promise-based API** instead of mixed callback/promise patterns.
- Renamed `selectDevice()` to `connectPrinter()` in native module.
- Image printing auto-detection: pass URL or base64 string to `printImage()`.

**New Features:**

- **QR Code printing** — Built-in QR code generation via ZXing library.
- **Barcode printing** — Support for CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR.
- **Smart table printing** — Auto column widths, frozen columns, text wrapping, configurable alignment.
- **Cash drawer** — Open connected cash drawer via ESC/POS command.
- **Print queue** — Sequential print job processing with `queuePrint()`, `getQueueLength()`, `clearQueue()`.
- **Built-in permissions** — `requestPermissions()` and `checkPermissions()` for Android 12+ BLE permissions.
- **Full TypeScript support** — Complete type definitions with autocomplete.
- **Error handling** — Structured `PrinterError` class with `PrinterErrorCode` enum.
- **Text formatting tags** — `<C>`, `<B>`, `<CB>`, `<D>`, `<CD>`, `<CM>` for styled text.

### v1.0.0 — Initial Release

- Basic BLE thermal printer support for Android & iOS.
- Text printing with ESC/POS commands.
- Image printing from URL.
- Base64 image printing.
- Bluetooth device discovery and pairing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
