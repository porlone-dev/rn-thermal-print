#import <Foundation/Foundation.h>

#import "RNBLEPrinter.h"
#import "PrinterSDK.h"

@implementation RNBLEPrinter

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(init:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        _printerArray = [NSMutableArray new];
        m_printer = [[NSObject alloc] init];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleNetPrinterConnectedNotification:) name:@"NetPrinterConnected" object:nil];
        // API MISUSE: <CBCentralManager> can only accept this command while in the powered on state
        [[PrinterSDK defaultPrinterSDK] scanPrintersWithCompletion:^(Printer* printer){}];
        successCallback(@[@"Init successful"]);
    } @catch (NSException *exception) {
        errorCallback(@[@"No bluetooth adapter available"]);
    }
}

- (void)handleNetPrinterConnectedNotification:(NSNotification*)notification
{
    m_printer = nil;
}

RCT_EXPORT_METHOD(getDeviceList:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        !_printerArray ? [NSException raise:@"Null pointer exception" format:@"Must call init function first"] : nil;
        [[PrinterSDK defaultPrinterSDK] scanPrintersWithCompletion:^(Printer* printer){
            [_printerArray addObject:printer];
            NSMutableArray *mapped = [NSMutableArray arrayWithCapacity:[_printerArray count]];
            [_printerArray enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                NSDictionary *dict = @{ @"device_name" : printer.name, @"inner_mac_address" : printer.UUIDString};
                [mapped addObject:dict];
            }];
            NSMutableArray *uniquearray = (NSMutableArray *)[[NSSet setWithArray:mapped] allObjects];;
            successCallback(@[uniquearray]);
        }];
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(connectPrinter:(NSString *)inner_mac_address
                  options:(NSDictionary *)options
                  success:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        // Set connection options if provided
        if (options != nil) {
            _autoReconnect = [[options valueForKey:@"autoReconnect"] boolValue];
            _maxReconnectAttempts = [[options valueForKey:@"maxReconnectAttempts"] integerValue] ?: 3;
            _reconnectDelay = [[options valueForKey:@"reconnectDelay"] integerValue] ?: 2000;
            _connectionTimeout = [[options valueForKey:@"timeout"] integerValue] ?: 10000;
        } else {
            _autoReconnect = NO;
            _maxReconnectAttempts = 3;
            _reconnectDelay = 2000;
            _connectionTimeout = 10000;
        }
        
        __block BOOL found = NO;
        __block Printer* selectedPrinter = nil;
        [_printerArray enumerateObjectsUsingBlock: ^(id obj, NSUInteger idx, BOOL *stop){
            selectedPrinter = (Printer *)obj;
            if ([inner_mac_address isEqualToString:(selectedPrinter.UUIDString)]) {
                found = YES;
                *stop = YES;
            }
        }];

        if (found) {
            [[PrinterSDK defaultPrinterSDK] connectBT:selectedPrinter];
            [[NSNotificationCenter defaultCenter] postNotificationName:@"BLEPrinterConnected" object:nil];
            m_printer = selectedPrinter;
            _lastConnectedAddress = inner_mac_address;
            _reconnectAttempts = 0;
            successCallback(@[[NSString stringWithFormat:@"Connected to printer %@", selectedPrinter.name]]);
        } else {
            [NSException raise:@"Invalid connection" format:@"connectPrinter: Can't connect to printer %@", inner_mac_address];
        }
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printRawData:(NSString *)text
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"printRawData: Can't connect to printer"] : nil;

        NSData *decodedData = [[NSData alloc] initWithBase64EncodedString:text options:0];
        NSString *decodedString = [[NSString alloc] initWithData:decodedData encoding:NSUTF8StringEncoding];
        
        NSNumber* boldPtr = [options valueForKey:@"bold"];
        NSNumber* alignCenterPtr = [options valueForKey:@"center"];

        BOOL bold = (BOOL)[boldPtr intValue];
        BOOL alignCenter = (BOOL)[alignCenterPtr intValue];

        bold ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2108"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2100"];
        alignCenter ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6102"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6101"];
        [[PrinterSDK defaultPrinterSDK] printText:decodedString];

        NSNumber* beepPtr = [options valueForKey:@"beep"];
        NSNumber* cutPtr = [options valueForKey:@"cut"];

        BOOL beep = (BOOL)[beepPtr intValue];
        BOOL cut = (BOOL)[cutPtr intValue];

        beep ? [[PrinterSDK defaultPrinterSDK] beep] : nil;
        cut ? [[PrinterSDK defaultPrinterSDK] cutPaper] : nil;

    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printImageData:(NSString *)imgUrl
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {

        !m_printer ? [NSException raise:@"Invalid connection" format:@"Can't connect to printer"] : nil;
        NSURL* url = [NSURL URLWithString:imgUrl];
        NSData* imageData = [NSData dataWithContentsOfURL:url];

        NSString* printerWidthType = [options valueForKey:@"printerWidthType"];

        NSInteger printerWidth = 576;

        if(printerWidthType != nil && [printerWidthType isEqualToString:@"58"]) {
            printerWidth = 384;
        }

        if(imageData != nil){
            UIImage* image = [UIImage imageWithData:imageData];
            UIImage* printImage = [self getPrintImage:image printerOptions:options];

            [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
            [[PrinterSDK defaultPrinterSDK] printImage:printImage ];
        }

    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printImageBase64:(NSString *)base64Qr
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {

        !m_printer ? [NSException raise:@"Invalid connection" format:@"Can't connect to printer"] : nil;
        if(![base64Qr  isEqual: @""]){
            NSString *result = [@"data:image/png;base64," stringByAppendingString:base64Qr];
            NSURL *url = [NSURL URLWithString:result];
            NSData *imageData = [NSData dataWithContentsOfURL:url];
            NSString* printerWidthType = [options valueForKey:@"printerWidthType"];

            NSInteger printerWidth = 576;

            if(printerWidthType != nil && [printerWidthType isEqualToString:@"58"]) {
                printerWidth = 384;
            }

            if(imageData != nil){
                UIImage* image = [UIImage imageWithData:imageData];
                UIImage* printImage = [self getPrintImage:image printerOptions:options];

                [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
                [[PrinterSDK defaultPrinterSDK] printImage:printImage ];
            }
        }
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

-(UIImage *)getPrintImage:(UIImage *)image
           printerOptions:(NSDictionary *)options {
   NSNumber* nWidth = [options valueForKey:@"imageWidth"];
   NSNumber* nHeight = [options valueForKey:@"imageHeight"];
   NSNumber* nPaddingX = [options valueForKey:@"paddingX"];

   CGFloat newWidth = 150;
   if(nWidth != nil) {
       newWidth = [nWidth floatValue];
   }

   CGFloat newHeight = image.size.height;
   if(nHeight != nil) {
       newHeight = [nHeight floatValue];
   }

   CGFloat paddingX = 250;
   if(nPaddingX != nil) {
       paddingX = [nPaddingX floatValue];
   }

   CGFloat _newHeight = newHeight;
   CGSize newSize = CGSizeMake(newWidth, _newHeight);
   UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0);
   CGContextRef context = UIGraphicsGetCurrentContext();
   CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
   CGImageRef immageRef = image.CGImage;
   CGContextDrawImage(context, CGRectMake(0, 0, newWidth, newHeight), immageRef);
   CGImageRef newImageRef = CGBitmapContextCreateImage(context);
   UIImage* newImage = [UIImage imageWithCGImage:newImageRef];

   CGImageRelease(newImageRef);
   UIGraphicsEndImageContext();

   UIImage* paddedImage = [self addImagePadding:newImage paddingX:paddingX paddingY:0];
   return paddedImage;
}

-(UIImage *)addImagePadding:(UIImage * )image
                   paddingX: (CGFloat) paddingX
                   paddingY: (CGFloat) paddingY
{
    CGFloat width = image.size.width + paddingX;
    CGFloat height = image.size.height + paddingY;

    UIGraphicsBeginImageContextWithOptions(CGSizeMake(width, height), true, 0.0);
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSetFillColorWithColor(context, [UIColor whiteColor].CGColor);
    CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
    CGContextFillRect(context, CGRectMake(0, 0, width, height));
    CGFloat originX = (width - image.size.width)/2;
    CGFloat originY = (height -  image.size.height)/2;
    CGImageRef immageRef = image.CGImage;
    CGContextDrawImage(context, CGRectMake(originX, originY, image.size.width, image.size.height), immageRef);
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage* paddedImage = [UIImage imageWithCGImage:newImageRef];

    CGImageRelease(newImageRef);
    UIGraphicsEndImageContext();

    return paddedImage;
}

RCT_EXPORT_METHOD(closeConn) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"closeConn: Can't connect to printer"] : nil;
        [[PrinterSDK defaultPrinterSDK] disconnect];
        m_printer = nil;
    } @catch (NSException *exception) {
        NSLog(@"%@", exception.reason);
    }
}

RCT_EXPORT_METHOD(isConnected:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL connected = m_printer != nil;
        resolve(@(connected));
    } @catch (NSException *exception) {
        resolve(@(NO));
    }
}

RCT_EXPORT_METHOD(printQRCode:(NSString *)data
                  size:(NSInteger)size
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"printQRCode: Can't connect to printer"] : nil;
        
        // Generate QR code using Core Image
        NSData *qrData = [data dataUsingEncoding:NSUTF8StringEncoding];
        CIFilter *qrFilter = [CIFilter filterWithName:@"CIQRCodeGenerator"];
        [qrFilter setValue:qrData forKey:@"inputMessage"];
        [qrFilter setValue:@"M" forKey:@"inputCorrectionLevel"];
        
        CIImage *qrImage = qrFilter.outputImage;
        
        // Scale QR code to desired size
        CGFloat scale = (CGFloat)size / qrImage.extent.size.width;
        CIImage *scaledImage = [qrImage imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
        
        CIContext *context = [CIContext contextWithOptions:nil];
        CGImageRef cgImage = [context createCGImage:scaledImage fromRect:scaledImage.extent];
        UIImage *uiImage = [UIImage imageWithCGImage:cgImage];
        CGImageRelease(cgImage);
        
        // Print the QR code image
        NSString* printerWidthType = @"80";
        NSInteger printerWidth = 576;
        
        [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
        [[PrinterSDK defaultPrinterSDK] printImage:uiImage];
        
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printBarcode:(NSString *)data
                  type:(NSString *)type
                  width:(NSInteger)width
                  height:(NSInteger)height
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"printBarcode: Can't connect to printer"] : nil;
        
        // Generate barcode using Core Image
        CIFilter *barcodeFilter = [CIFilter filterWithName:@"CICode128BarcodeGenerator"];
        NSData *barcodeData = [data dataUsingEncoding:NSASCIIStringEncoding];
        [barcodeFilter setValue:barcodeData forKey:@"inputMessage"];
        
        CIImage *barcodeImage = barcodeFilter.outputImage;
        
        if (barcodeImage == nil) {
            reject(@"PRINT_ERROR", @"Failed to generate barcode", nil);
            return;
        }
        
        // Scale barcode to desired size
        CGFloat scaleX = (CGFloat)width / barcodeImage.extent.size.width;
        CGFloat scaleY = (CGFloat)height / barcodeImage.extent.size.height;
        CIImage *scaledImage = [barcodeImage imageByApplyingTransform:CGAffineTransformMakeScale(scaleX, scaleY)];
        
        CIContext *context = [CIContext contextWithOptions:nil];
        CGImageRef cgImage = [context createCGImage:scaledImage fromRect:scaledImage.extent];
        UIImage *uiImage = [UIImage imageWithCGImage:cgImage];
        CGImageRelease(cgImage);
        
        // Print the barcode image
        NSInteger printerWidth = 576;
        [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
        [[PrinterSDK defaultPrinterSDK] printImage:uiImage];
        
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(openCashDrawer:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"openCashDrawer: Can't connect to printer"] : nil;
        
        // Send ESC/POS command to open cash drawer
        NSData *cashDrawerCommand = [[NSData alloc] initWithBytes:"\x1B\x70\x00\x19\xFA" length:5];
        [[PrinterSDK defaultPrinterSDK] sendData:cashDrawerCommand];
        
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getBatteryLevel:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        if (m_printer == nil) {
            resolve(@(-1));
            return;
        }
        
        // Most thermal printers don't support battery level query via ESC/POS
        // This is a generic implementation - actual command may vary by printer model
        // For now, return -1 (unavailable)
        
        // If printer supports battery query, you can send ESC/POS command here
        // Example: NSData *statusCommand = [[NSData alloc] initWithBytes:"\x10\x04\x01" length:3];
        // [[PrinterSDK defaultPrinterSDK] sendData:statusCommand];
        // Then read response...
        
        resolve(@(-1));
    } @catch (NSException *exception) {
        resolve(@(-1));
    }
}

RCT_EXPORT_METHOD(getPaperStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    @try {
        if (m_printer == nil) {
            resolve(@"unknown");
            return;
        }
        
        // ESC/POS command to query paper sensor status
        // This is a generic implementation - actual command may vary by printer model
        // Most printers support this command: 0x10 0x04 0x04
        
        // For now, return "unknown" as actual implementation depends on printer model
        // and would require reading response from printer
        
        resolve(@"unknown");
    } @catch (NSException *exception) {
        resolve(@"unknown");
    }
}

@end

