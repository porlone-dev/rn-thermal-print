# @porlone/rn-thermal-print

A React Native library for thermal receipt printers with **React Native New Architecture** support.

[![npm version](https://img.shields.io/npm/v/@porlone/rn-thermal-print.svg)](https://www.npmjs.com/package/@porlone/rn-thermal-print)
[![License](https://img.shields.io/npm/l/@porlone/rn-thermal-print.svg)](https://github.com/porlone-dev/rn-thermal-print/blob/master/LICENSE)

## ✨ Features

- 🚀 **React Native New Architecture** support (TurboModules)
- 🔄 **Backward compatible** with old architecture
- 📱 **Cross-platform**: iOS & Android
- 🔵 **Bluetooth Low Energy** printer support
- 🖼️ **Image printing** (URL & Base64)
- 📝 **Text formatting** with alignment, bold, and sizing
- 📊 **Column-based printing** for receipts
- ⚡ **Promise-based API** with proper error handling
- 📘 **Full TypeScript** support

This repository is originally forked from https://github.com/thiendangit/react-native-thermal-receipt-printer-image-qr with major improvements for the new architecture.

<br />
<div style="display: flex; flex-direction: row; align-self: center; align-items: center">
<img src="image/invoice.jpg" alt="bill" width="270" height="580"/>
<img src="image/_screenshot.jpg" alt="screenshot" width="270" height="580"/>
</div>

## Requirements

- React Native >= 0.70.0 (recommended: 0.74.0)
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

No additional steps required. Gradle will handle the setup.

### Enabling New Architecture (Optional)

To take advantage of the new architecture (TurboModules):

#### iOS
In your `ios/Podfile`:
```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

#### Android
In your `android/gradle.properties`:
```properties
newArchEnabled=true
```

**Note:** The library automatically detects which architecture is enabled and uses the appropriate implementation!

## Quick Start

```typescript
import { BLEPrinter, COMMANDS, PrinterError, PrinterErrorCode } from '@porlone/rn-thermal-print';

// Initialize the printer
const initPrinter = async () => {
  try {
    await BLEPrinter.init();
    const devices = await BLEPrinter.getDeviceList();
    console.log('Available printers:', devices);
  } catch (error) {
    if (error instanceof PrinterError) {
      console.error('Printer error:', error.code, error.message);
    }
  }
};

// Connect and print
const printReceipt = async (deviceAddress: string) => {
  try {
    await BLEPrinter.connectPrinter(deviceAddress);
    
    await BLEPrinter.printText('<C>My Store</C>\n');
    await BLEPrinter.printText('<B>Receipt #12345</B>\n');
    await BLEPrinter.printText('------------------------\n');
    await BLEPrinter.printBill('<C>Thank you!</C>');
    
    await BLEPrinter.closeConn();
  } catch (error) {
    if (error instanceof PrinterError) {
      switch (error.code) {
        case PrinterErrorCode.NOT_CONNECTED:
          console.error('Printer not connected');
          break;
        case PrinterErrorCode.PRINT_FAILED:
          console.error('Failed to print');
          break;
      }
    }
  }
};
```

## API Reference

### BLEPrinter

All methods return **Promises** and throw **PrinterError** on failure.

```typescript
interface BLEPrinter {
  /**
   * Initialize the BLE printer module
   */
  init(): Promise<void>;
  
  /**
   * Get list of available BLE printers
   */
  getDeviceList(): Promise<IBLEPrinter[]>;
  
  /**
   * Connect to a specific printer by MAC address
   */
  connectPrinter(inner_mac_address: string): Promise<string>;
  
  /**
   * Close the current printer connection
   */
  closeConn(): Promise<void>;
  
  /**
   * Print text without cutting or beeping (for building receipts line by line)
   */
  printText(text: string, opts?: PrinterOptions): Promise<void>;
  
  /**
   * Print text and finish the bill (cuts paper and beeps by default)
   */
  printBill(text: string, opts?: PrinterOptions): Promise<void>;
  
  /**
   * Print image from URL
   */
  printImage(imgUrl: string, opts?: PrinterImageOptions): Promise<void>;
  
  /**
   * Print image from base64 string
   */
  printImageBase64(base64: string, opts?: PrinterImageOptions): Promise<void>;
  
  /**
   * Print raw data (primarily for Android with encoder support)
   */
  printRaw(text: string): Promise<void>;
  
  /**
   * Print text in columns
   * 80mm => 46 characters
   * 58mm => 30 characters
   */
  printColumnsText(
    texts: string[],
    columnWidth: number[],
    columnAlignment: ColumnAlignment[],
    columnStyle?: string[],
    opts?: PrinterOptions
  ): Promise<void>;
}
```

### Types

```typescript
interface IBLEPrinter {
  device_name: string;
  inner_mac_address: string;
}

interface PrinterOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
}

interface PrinterImageOptions extends PrinterOptions {
  imageWidth?: number;
  imageHeight?: number;
  printerWidthType?: '58' | '80';
  paddingX?: number;  // iOS only
}

enum ColumnAlignment {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

enum PrinterWidth {
  "58mm" = 58,
  "80mm" = 80,
}
```

### Error Handling

```typescript
enum PrinterErrorCode {
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  PRINT_FAILED = 'PRINT_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  BLUETOOTH_UNAVAILABLE = 'BLUETOOTH_UNAVAILABLE',
  INIT_ERROR = 'INIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class PrinterError extends Error {
  code: PrinterErrorCode;
  originalError?: Error;
}
```

## Styling

```js
import { COMMANDS, ColumnAlignment } from "@porlone/rn-thermal-print";
```

[See more here](https://github.com/porlone-dev/rn-thermal-print/blob/main/dist/utils/printer-commands.js)

## Example

**`Print Columns Text`**

```tsx
const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
let orderList = [
  ["1. Skirt Palas Labuh Muslimah Fashion", "x2", "500$"],
  ["2. BLOUSE ROPOL VIRAL MUSLIMAH FASHION", "x4222", "500$"],
  [
    "3. Women Crew Neck Button Down Ruffle Collar Loose Blouse",
    "x1",
    "30000000000000$",
  ],
  ["4. Retro Buttons Up Full Sleeve Loose", "x10", "200$"],
  ["5. Retro Buttons Up", "x10", "200$"],
];
let columnAlignment = [
  ColumnAlignment.LEFT,
  ColumnAlignment.CENTER,
  ColumnAlignment.RIGHT,
];
let columnWidth = [46 - (7 + 12), 7, 12];
const header = ["Product list", "Qty", "Price"];
Printer.printColumnsText(header, columnWidth, columnAlignment, [
  `${BOLD_ON}`,
  "",
  "",
]);
for (let i in orderList) {
  Printer.printColumnsText(orderList[i], columnWidth, columnAlignment, [
    `${BOLD_OFF}`,
    "",
    "",
  ]);
}
Printer.printBill(`${CENTER}Thank you\n`);
```

**`Print image`**

```tsx
Printer.printImage(
  "https://media-cdn.tripadvisor.com/media/photo-m/1280/1b/3a/bd/b5/the-food-bill.jpg",
  {
    imageWidth: 575,
    // imageHeight: 1000,
    // paddingX: 100
  }
);
```

[See more here](https://github.com/porlone-dev/rn-thermal-print/blob/main/example/src/HomeScreen.tsx)

```
