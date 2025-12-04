package com.pinmi.react.printer

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.pinmi.react.printer.adapter.BLEPrinterAdapter
import com.pinmi.react.printer.adapter.BLEPrinterDeviceId
import com.pinmi.react.printer.adapter.PrinterAdapter

class RNBLEPrinterTurboModule(reactContext: ReactApplicationContext) : NativeThermalPrinterSpec(reactContext) {
    
    private var adapter: PrinterAdapter? = null
    
    override fun getName(): String {
        return NAME
    }
    
    override fun init(promise: Promise) {
        try {
            adapter = BLEPrinterAdapter.getInstance()
            adapter?.init(
                reactApplicationContext,
                { promise.resolve("Initialization successful") },
                { error -> promise.reject("INIT_ERROR", error.toString()) }
            )
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e.message, e)
        }
    }
    
    override fun getDeviceList(promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Must call init first")
                return
            }
            
            val devices = adapter?.getDeviceList { error ->
                promise.reject("GET_DEVICES_ERROR", error.toString())
            }
            
            val deviceArray = WritableNativeArray()
            devices?.forEach { device ->
                deviceArray.pushMap(device.toRNWritableMap())
            }
            promise.resolve(deviceArray)
        } catch (e: Exception) {
            promise.reject("GET_DEVICES_ERROR", e.message, e)
        }
    }
    
    override fun connectPrinter(address: String, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Must call init first")
                return
            }
            
            adapter?.selectDevice(
                BLEPrinterDeviceId.valueOf(address),
                { promise.resolve("Connected to printer") },
                { error -> promise.reject("CONNECTION_ERROR", error.toString()) }
            )
        } catch (e: Exception) {
            promise.reject("CONNECTION_ERROR", e.message, e)
        }
    }
    
    override fun closeConn(promise: Promise) {
        try {
            adapter?.closeConnectionIfExists()
            promise.resolve("Connection closed")
        } catch (e: Exception) {
            promise.reject("CLOSE_ERROR", e.message, e)
        }
    }
    
    override fun printRawData(data: String, options: ReadableMap?, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            adapter?.printRawData(data) { error ->
                promise.reject("PRINT_ERROR", error.toString())
            }
            promise.resolve("Print successful")
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    override fun printImageData(url: String, options: ReadableMap, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val imageWidth = if (options.hasKey("imageWidth")) options.getInt("imageWidth") else 0
            val imageHeight = if (options.hasKey("imageHeight")) options.getInt("imageHeight") else 0
            
            adapter?.printImageData(url, imageWidth, imageHeight) { error ->
                promise.reject("PRINT_ERROR", error.toString())
            }
            promise.resolve("Image print successful")
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    override fun printImageBase64(base64: String, options: ReadableMap, promise: Promise) {
        try {
            if (adapter == null) {
                promise.reject("NOT_INITIALIZED", "Printer not initialized")
                return
            }
            
            val decodedBytes = Base64.decode(base64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            
            val imageWidth = if (options.hasKey("imageWidth")) options.getInt("imageWidth") else 0
            val imageHeight = if (options.hasKey("imageHeight")) options.getInt("imageHeight") else 0
            
            adapter?.printImageBase64(bitmap, imageWidth, imageHeight) { error ->
                promise.reject("PRINT_ERROR", error.toString())
            }
            promise.resolve("Image print successful")
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", e.message, e)
        }
    }
    
    companion object {
        const val NAME = "RNBLEPrinter"
    }
}
