#ifdef RCT_NEW_ARCH_ENABLED
#import "RNBLEPrinterTurbo.h"
#import "PrinterSDK.h"
#import <React/RCTConvert.h>

@implementation RNBLEPrinterTurbo
{
    NSMutableArray* _printerArray;
    NSObject* m_printer;
    bool hasListeners;
}

RCT_EXPORT_MODULE(RNBLEPrinter)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeThermalPrinterSpecJSI>(params);
}

- (void)handleNetPrinterConnectedNotification:(NSNotification*)notification
{
    m_printer = nil;
}

RCT_EXPORT_METHOD(init:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        _printerArray = [NSMutableArray new];
        m_printer = [[NSObject alloc] init];
        [[NSNotificationCenter defaultCenter] addObserver:self 
                                                 selector:@selector(handleNetPrinterConnectedNotification:) 
                                                     name:@"NetPrinterConnected" 
                                                   object:nil];
        [[PrinterSDK defaultPrinterSDK] scanPrintersWithCompletion:^(Printer* printer){}];
        resolve(@"Init successful");
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", @"No bluetooth adapter available", nil);
    }
}

RCT_EXPORT_METHOD(getDeviceList:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!_printerArray) {
            reject(@"NOT_INITIALIZED", @"Must call init function first", nil);
            return;
        }
        
        [[PrinterSDK defaultPrinterSDK] scanPrintersWithCompletion:^(Printer* printer){
            [_printerArray addObject:printer];
            NSMutableArray *mapped = [NSMutableArray arrayWithCapacity:[_printerArray count]];
            [_printerArray enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                Printer* p = (Printer*)obj;
                NSDictionary *dict = @{ 
                    @"device_name" : p.name, 
                    @"inner_mac_address" : p.UUIDString
                };
                [mapped addObject:dict];
            }];
            NSMutableArray *uniquearray = (NSMutableArray *)[[NSSet setWithArray:mapped] allObjects];
            resolve(uniquearray);
        }];
    } @catch (NSException *exception) {
        reject(@"GET_DEVICES_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(connectPrinter:(NSString *)address
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        __block BOOL found = NO;
        __block Printer* selectedPrinter = nil;
        [_printerArray enumerateObjectsUsingBlock: ^(id obj, NSUInteger idx, BOOL *stop){
            selectedPrinter = (Printer *)obj;
            if ([address isEqualToString:(selectedPrinter.UUIDString)]) {
                found = YES;
                *stop = YES;
            }
        }];

        if (found) {
            [[PrinterSDK defaultPrinterSDK] connectBT:selectedPrinter];
            [[NSNotificationCenter defaultCenter] postNotificationName:@"BLEPrinterConnected" object:nil];
            m_printer = selectedPrinter;
            resolve([NSString stringWithFormat:@"Connected to printer %@", selectedPrinter.name]);
        } else {
            reject(@"CONNECTION_ERROR", 
                   [NSString stringWithFormat:@"Can't connect to printer %@", address], 
                   nil);
        }
    } @catch (NSException *exception) {
        reject(@"CONNECTION_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(closeConn:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!m_printer) {
            reject(@"NOT_CONNECTED", @"Printer is not connected", nil);
            return;
        }
        [[PrinterSDK defaultPrinterSDK] disconnect];
        m_printer = nil;
        resolve(@"Connection closed");
    } @catch (NSException *exception) {
        reject(@"CLOSE_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printRawData:(NSString *)data
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!m_printer) {
            reject(@"NOT_CONNECTED", @"Printer is not connected", nil);
            return;
        }

        NSData *decodedData = [[NSData alloc] initWithBase64EncodedString:data options:0];
        NSString *decodedString = [[NSString alloc] initWithData:decodedData encoding:NSUTF8StringEncoding];
        
        NSNumber* boldPtr = [options valueForKey:@"bold"];
        NSNumber* alignCenterPtr = [options valueForKey:@"center"];

        BOOL bold = boldPtr ? [boldPtr boolValue] : NO;
        BOOL alignCenter = alignCenterPtr ? [alignCenterPtr boolValue] : NO;

        bold ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2108"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2100"];
        alignCenter ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6102"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6101"];
        [[PrinterSDK defaultPrinterSDK] printText:decodedString];

        NSNumber* beepPtr = [options valueForKey:@"beep"];
        NSNumber* cutPtr = [options valueForKey:@"cut"];

        BOOL beep = beepPtr ? [beepPtr boolValue] : NO;
        BOOL cut = cutPtr ? [cutPtr boolValue] : NO;

        beep ? [[PrinterSDK defaultPrinterSDK] beep] : nil;
        cut ? [[PrinterSDK defaultPrinterSDK] cutPaper] : nil;
        
        resolve(@"Print successful");
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printImageData:(NSString *)url
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!m_printer) {
            reject(@"NOT_CONNECTED", @"Printer is not connected", nil);
            return;
        }
        
        NSURL* imageUrl = [NSURL URLWithString:url];
        NSData* imageData = [NSData dataWithContentsOfURL:imageUrl];

        NSString* printerWidthType = [options valueForKey:@"printerWidthType"];
        NSInteger printerWidth = 576;

        if(printerWidthType != nil && [printerWidthType isEqualToString:@"58"]) {
            printerWidth = 384;
        }

        if(imageData != nil){
            UIImage* image = [UIImage imageWithData:imageData];
            UIImage* printImage = [self getPrintImage:image printerOptions:options];

            [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
            [[PrinterSDK defaultPrinterSDK] printImage:printImage];
            resolve(@"Image print successful");
        } else {
            reject(@"PRINT_ERROR", @"Failed to load image", nil);
        }
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(printImageBase64:(NSString *)base64
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!m_printer) {
            reject(@"NOT_CONNECTED", @"Printer is not connected", nil);
            return;
        }
        
        if(![base64 isEqual: @""]){
            NSString *result = [@"data:image/png;base64," stringByAppendingString:base64];
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
                [[PrinterSDK defaultPrinterSDK] printImage:printImage];
                resolve(@"Image print successful");
            } else {
                reject(@"PRINT_ERROR", @"Failed to decode image", nil);
            }
        } else {
            reject(@"PRINT_ERROR", @"Empty base64 string", nil);
        }
    } @catch (NSException *exception) {
        reject(@"PRINT_ERROR", exception.reason, nil);
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

-(UIImage *)addImagePadding:(UIImage *)image
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
    CGFloat originY = (height - image.size.height)/2;
    CGImageRef immageRef = image.CGImage;
    CGContextDrawImage(context, CGRectMake(originX, originY, image.size.width, image.size.height), immageRef);
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage* paddedImage = [UIImage imageWithCGImage:newImageRef];

    CGImageRelease(newImageRef);
    UIGraphicsEndImageContext();

    return paddedImage;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeThermalPrinterSpecJSI>(params);
}

@end

#endif
