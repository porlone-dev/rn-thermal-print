package com.pinmi.react.printer

import android.graphics.BitmapFactory
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
    
    companion object {
        const val NAME = "RNBLEPrinter"
    }
}
