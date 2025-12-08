package com.pinmi.react.printer

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.pinmi.react.printer.adapter.BLEPrinterAdapter
import com.pinmi.react.printer.adapter.BLEPrinterDeviceId
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import java.io.ByteArrayOutputStream

@ReactModule(name = RNBLEPrinterModule.NAME)
class RNBLEPrinterModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var adapter: BLEPrinterAdapter? = null
    
    override fun getName(): String = NAME
    
    @ReactMethod
    fun init(promise: Promise) {
        try {
            adapter = BLEPrinterAdapter.getInstance()
            adapter?.init(
                reactApplicationContext,
                { promise.resolve("Init successful") },
                { error -> promise.reject("INIT_ERROR", error?.toString() ?: "Init failed") }
            )
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getDeviceList(promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Must call init first")
                return
            }
            
            val devices = adapter?.getDeviceList { error ->
                promise.reject("DEVICE_ERROR", error?.toString() ?: "Failed to get devices")
            }
            
            val deviceArray = Arguments.createArray()
            devices?.forEach { device ->
                deviceArray.pushMap(device.toRNWritableMap())
            }
            
            if (devices?.isNotEmpty() == true) {
                promise.resolve(deviceArray)
            } else {
                promise.reject("DEVICE_ERROR", "No devices found")
            }
        } catch (e: Exception) {
            promise.reject("DEVICE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun connectPrinter(address: String, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Must call init first")
                return
            }
            
            adapter?.selectDevice(
                BLEPrinterDeviceId.valueOf(address),
                { promise.resolve("Connected to printer") },
                { error -> promise.reject("CONNECTION_ERROR", error?.toString() ?: "Connection failed") }
            )
        } catch (e: Exception) {
            promise.reject("CONNECTION_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun closeConn(promise: Promise) {
        try {
            if (adapter == null) {
                adapter = BLEPrinterAdapter.getInstance()
            }
            adapter?.closeConnectionIfExists()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CLOSE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun printRawData(data: String, options: ReadableMap?, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            adapter?.printRawData(data) { error ->
                promise.reject("PRINT_ERROR", error?.toString() ?: "Print failed")
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun printImageData(url: String, options: ReadableMap?, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val imageWidth = options?.getInt("imageWidth") ?: 0
            val imageHeight = options?.getInt("imageHeight") ?: 0
            
            adapter?.printImageData(url, imageWidth, imageHeight) { error ->
                promise.reject("PRINT_ERROR", error?.toString() ?: "Print failed")
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun printImageBase64(base64: String, options: ReadableMap?, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val decodedBytes = Base64.decode(base64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            
            val imageWidth = options?.getInt("imageWidth") ?: 0
            val imageHeight = options?.getInt("imageHeight") ?: 0
            
            adapter?.printImageBase64(bitmap, imageWidth, imageHeight) { error ->
                promise.reject("PRINT_ERROR", error?.toString() ?: "Print failed")
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun isConnected(promise: Promise) {
        try {
            val connected = adapter?.isConnected() ?: false
            promise.resolve(connected)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
    
    @ReactMethod
    fun printQRCode(data: String, size: Int, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val qrSize = if (size > 0) size else 200
            val bitmap = generateQRCode(data, qrSize)
            
            if (bitmap != null) {
                adapter?.printImageBase64(bitmap, qrSize, qrSize) { error ->
                    promise.reject("PRINT_ERROR", error?.toString() ?: "QR print failed")
                }
                promise.resolve(null)
            } else {
                promise.reject("PRINT_ERROR", "Failed to generate QR code")
            }
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun printBarcode(data: String, type: String, width: Int, height: Int, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val barcodeWidth = if (width > 0) width else 300
            val barcodeHeight = if (height > 0) height else 80
            val barcodeFormat = when (type.uppercase()) {
                "CODE128" -> BarcodeFormat.CODE_128
                "CODE39" -> BarcodeFormat.CODE_39
                "EAN13" -> BarcodeFormat.EAN_13
                "EAN8" -> BarcodeFormat.EAN_8
                "UPC_A" -> BarcodeFormat.UPC_A
                "UPC_E" -> BarcodeFormat.UPC_E
                "ITF" -> BarcodeFormat.ITF
                "CODABAR" -> BarcodeFormat.CODABAR
                else -> BarcodeFormat.CODE_128
            }
            
            val bitmap = generateBarcode(data, barcodeFormat, barcodeWidth, barcodeHeight)
            
            if (bitmap != null) {
                adapter?.printImageBase64(bitmap, barcodeWidth, barcodeHeight) { error ->
                    promise.reject("PRINT_ERROR", error?.toString() ?: "Barcode print failed")
                }
                promise.resolve(null)
            } else {
                promise.reject("PRINT_ERROR", "Failed to generate barcode")
            }
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun openCashDrawer(promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            // ESC/POS command to open cash drawer (pulse to pin 2)
            val cashDrawerCommand = byteArrayOf(0x1B, 0x70, 0x00, 0x19, 0xFA.toByte())
            val base64Command = Base64.encodeToString(cashDrawerCommand, Base64.DEFAULT)
            
            adapter?.printRawData(base64Command) { error ->
                promise.reject("PRINT_ERROR", error?.toString() ?: "Cash drawer failed")
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    private fun generateQRCode(data: String, size: Int): Bitmap? {
        return try {
            val hints = hashMapOf<EncodeHintType, Any>(
                EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
                EncodeHintType.MARGIN to 1
            )
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, size, size, hints)
            
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
            for (x in 0 until size) {
                for (y in 0 until size) {
                    bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            bitmap
        } catch (e: Exception) {
            null
        }
    }
    
    private fun generateBarcode(data: String, format: BarcodeFormat, width: Int, height: Int): Bitmap? {
        return try {
            val writer = MultiFormatWriter()
            val bitMatrix = writer.encode(data, format, width, height)
            
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            bitmap
        } catch (e: Exception) {
            null
        }
    }
    
    companion object {
        const val NAME = "RNBLEPrinter"
    }
}
