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

## v2.1.0 New Features

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
await BLEPrinter.printBarcode("1234567890", "EAN13", { width: 300, height: 80 });

// Supported types: CODE128, CODE39, EAN13, EAN8, UPC_A, UPC_E, ITF, CODABAR
```

### Connection Status
```typescript
// Check if printer is connected
const connected = await BLEPrinter.isConnected();
if (!connected) {
  await BLEPrinter.connect(address);
}
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

// Check connection status
const connected = await BLEPrinter.isConnected();

// Disconnect
await BLEPrinter.disconnect();
```

### Text Printing

```typescript
// Print text
await BLEPrinter.printText("Hello\n");

// Print with options
await BLEPrinter.printText("Goodbye\n", { 
  cut: true,    // Cut paper after printing
  beep: true,   // Beep after printing
  encoding: "UTF8"
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
  printerWidthType: "80" // or "58"
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
  | 'CODE128'   // Default
  | 'CODE39' 
  | 'EAN13' 
  | 'EAN8' 
  | 'UPC_A' 
  | 'UPC_E' 
  | 'ITF' 
  | 'CODABAR';
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
    { key: "item" },  // Flexible - wraps if needed
    { key: "qty", frozen: true, align: ColumnAlign.CENTER },
    { key: "price", frozen: true, align: ColumnAlign.RIGHT },
  ],
  { printerWidth: "80mm", showHeader: true }
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
  size?: number;  // Default: 200
}

interface BarcodeOptions {
  width?: number;   // Default: 300
  height?: number;  // Default: 80
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

| Code | Description |
|------|-------------|
| `NOT_INITIALIZED` | Module not initialized |
| `NOT_CONNECTED` | No printer connected |
| `PRINT_FAILED` | Print operation failed |
| `CONNECTION_FAILED` | Failed to connect |
| `DEVICE_NOT_FOUND` | No devices found |
| `BLUETOOTH_UNAVAILABLE` | Bluetooth not available |
| `INIT_ERROR` | Initialization error |

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

## Complete Receipt Example

```typescript
import { BLEPrinter, ColumnAlign, COMMANDS } from "@porlone/rn-thermal-print";

async function printReceipt() {
  // Print header
  await BLEPrinter.printText("<CB>MY STORE</CB>\n");
  await BLEPrinter.printText("<C>123 Main Street</C>\n");
  await BLEPrinter.printText("<C>Tel: 123-456-7890</C>\n\n");
  
  // Print QR code for digital receipt
  await BLEPrinter.printQRCode("https://mystore.com/receipt/12345", { size: 150 });
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
    { printerWidth: "80mm" }
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
