import { NativeModules, Platform } from "react-native";

import * as EPToolkit from "./utils/EPToolkit";
import { processColumnText } from "./utils/print-column";
import { COMMANDS } from "./utils/printer-commands";

const RNBLEPrinter = NativeModules.RNBLEPrinter;

export interface PrinterOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
}

export enum PrinterWidth {
  "58mm" = 58,
  "80mm" = 80,
}

export interface PrinterImageOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
  imageWidth?: number;
  imageHeight?: number;
  printerWidthType?: PrinterWidth;
  // only ios
  paddingX?: number;
}

export interface IBLEPrinter {
  device_name: string;
  inner_mac_address: string;
}

export enum ColumnAlignment {
  LEFT,
  CENTER,
  RIGHT,
}

const textTo64Buffer = (text: string, opts: PrinterOptions) => {
  const defaultOptions = {
    beep: false,
    cut: false,
    tailingLine: false,
    encoding: "UTF8",
  };

  const options = {
    ...defaultOptions,
    ...opts,
  };

  const fixAndroid = "\n";
  const buffer = EPToolkit.exchange_text(text + fixAndroid, options);
  return buffer.toString("base64");
};

const billTo64Buffer = (text: string, opts: PrinterOptions) => {
  const defaultOptions = {
    beep: true,
    cut: true,
    encoding: "UTF8",
    tailingLine: true,
  };
  const options = {
    ...defaultOptions,
    ...opts,
  };
  const buffer = EPToolkit.exchange_text(text, options);
  return buffer.toString("base64");
};

const textPreprocessingIOS = (text: string, canCut = true, beep = true) => {
  let options = {
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

const queuePrint = (fn: Function): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fn();
      resolve();
    }, 100);
  });
};

const BLEPrinter = {
  init: (): Promise<void> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    ),

  getDeviceList: (): Promise<IBLEPrinter[]> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.getDeviceList(
        (printers: IBLEPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (inner_mac_address: string): Promise<IBLEPrinter> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.connectPrinter(
        inner_mac_address,
        (printer: IBLEPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    ),

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNBLEPrinter.closeConn();
      resolve();
    }),

  printText: async (text: string, opts: PrinterOptions = {}): Promise<void> => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, false, false);

      await queuePrint(() =>
        RNBLEPrinter.printRawData(
          processedText.text,
          processedText.opts,
          (error: Error) => console.warn(error)
        )
      );
    } else {
      await queuePrint(() =>
        RNBLEPrinter.printRawData(textTo64Buffer(text, opts), (error: Error) =>
          console.warn(error)
        )
      );
    }
  },

  printBill: async (text: string, opts: PrinterOptions = {}): Promise<void> => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(
        text,
        opts?.cut ?? true,
        opts.beep ?? true
      );
      await queuePrint(() =>
        RNBLEPrinter.printRawData(
          processedText.text,
          processedText.opts,
          (error: Error) => console.warn(error)
        )
      );
    } else {
      await queuePrint(() =>
        RNBLEPrinter.printRawData(billTo64Buffer(text, opts), (error: Error) =>
          console.warn(error)
        )
      );
    }
  },
  /**
   * image url
   * @param imgUrl
   * @param opts
   */
  printImage: async function (imgUrl: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      /**
       * just development
       */
      await queuePrint(() =>
        RNBLEPrinter.printImageData(imgUrl, opts, (error: Error) =>
          console.warn(error)
        )
      );
    } else {
      await queuePrint(() =>
        RNBLEPrinter.printImageData(
          imgUrl,
          opts?.imageWidth ?? 0,
          opts?.imageHeight ?? 0,
          (error: Error) => console.warn(error)
        )
      );
    }
  },
  /**
   * base 64 string
   * @param Base64
   * @param opts
   */
  printImageBase64: async function (
    Base64: string,
    opts: PrinterImageOptions = {}
  ) {
    if (Platform.OS === "ios") {
      /**
       * just development
       */
      await queuePrint(() =>
        RNBLEPrinter.printImageBase64(Base64, opts, (error: Error) =>
          console.warn(error)
        )
      );
    } else {
      /**
       * just development
       */
      await queuePrint(() =>
        RNBLEPrinter.printImageBase64(
          Base64,
          opts?.imageWidth ?? 0,
          opts?.imageHeight ?? 0,
          (error: Error) => console.warn(error)
        )
      );
    }
  },
  /**
   * android print with encoder
   * @param text
   */
  printRaw: async (text: string): Promise<void> => {
    if (Platform.OS === "ios") {
      var processedText = textPreprocessingIOS(text, false, false);

      await queuePrint(() =>
        RNBLEPrinter.printRawData(
          processedText.text,
          processedText.opts,
          (error: Error) => console.warn(error)
        )
      );
    } else {
      await queuePrint(() =>
        RNBLEPrinter.printRawData(text, (error: Error) => console.warn(error))
      );
    }
  },
  /**
   * `columnWidth`
   * 80mm => 46 character
   * 58mm => 30 character
   */
  printColumnsText: async (
    texts: string[],
    columnWidth: number[],
    columnAlignment: ColumnAlignment[],
    columnStyle: string[],
    opts: PrinterOptions = {}
  ): Promise<void> => {
    const result = processColumnText(
      texts,
      columnWidth,
      columnAlignment,
      columnStyle
    );
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(result, false, false);
      await queuePrint(() =>
        RNBLEPrinter.printRawData(
          processedText.text,
          processedText.opts,
          (error: Error) => console.warn(error)
        )
      );
    } else {
      await queuePrint(() =>
        RNBLEPrinter.printRawData(
          textTo64Buffer(result, opts),
          (error: Error) => console.warn(error)
        )
      );
    }
  },
};

export { BLEPrinter, COMMANDS };
