package com.pinmi.react.printer

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

// Old architecture fallback - delegates to existing Java implementation
class RNBLEPrinterTurboModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val javaModule = RNBLEPrinterModule(reactContext)
    
    override fun getName(): String = "RNBLEPrinter"
    
    @ReactMethod
    fun init(promise: Promise) {
        // Wrap callback-based API to promise-based
        javaModule.init(
            { promise.resolve("Initialization successful") },
            { error -> promise.reject("INIT_ERROR", error.toString()) }
        )
    }
    
    @ReactMethod
    fun getDeviceList(promise: Promise) {
        javaModule.getDeviceList(
            { devices -> promise.resolve(devices) },
            { error -> promise.reject("GET_DEVICES_ERROR", error.toString()) }
        )
    }
    
    @ReactMethod
    fun connectPrinter(address: String, promise: Promise) {
        javaModule.connectPrinter(
            address,
            { promise.resolve("Connected to printer") },
            { error -> promise.reject("CONNECTION_ERROR", error.toString()) }
        )
    }
    
    @ReactMethod
    fun closeConn(promise: Promise) {
        javaModule.closeConn()
        promise.resolve("Connection closed")
    }
    
    @ReactMethod
    fun printRawData(data: String, options: ReadableMap?, promise: Promise) {
        javaModule.printRawData(data) { error ->
            if (error != null) {
                promise.reject("PRINT_ERROR", error.toString())
            } else {
                promise.resolve("Print successful")
            }
        }
    }
    
    @ReactMethod
    fun printImageData(url: String, options: ReadableMap, promise: Promise) {
        val imageWidth = if (options.hasKey("imageWidth")) options.getInt("imageWidth") else 0
        val imageHeight = if (options.hasKey("imageHeight")) options.getInt("imageHeight") else 0
        
        javaModule.printImageData(url, imageWidth, imageHeight) { error ->
            if (error != null) {
                promise.reject("PRINT_ERROR", error.toString())
            } else {
                promise.resolve("Image print successful")
            }
        }
    }
    
    @ReactMethod
    fun printImageBase64(base64: String, options: ReadableMap, promise: Promise) {
        val imageWidth = if (options.hasKey("imageWidth")) options.getInt("imageWidth") else 0
        val imageHeight = if (options.hasKey("imageHeight")) options.getInt("imageHeight") else 0
        
        javaModule.printImageBase64(base64, imageWidth, imageHeight) { error ->
            if (error != null) {
                promise.reject("PRINT_ERROR", error.toString())
            } else {
                promise.resolve("Image print successful")
            }
        }
    }
}
