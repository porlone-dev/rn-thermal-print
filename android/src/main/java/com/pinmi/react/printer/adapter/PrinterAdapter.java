package com.pinmi.react.printer.adapter;

import android.graphics.Bitmap;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.List;

/**
 * Interface for printer adapters.
 * All implementations must be thread-safe.
 * 
 * Print methods accept both a successCallback and an errorCallback.
 * The implementation MUST invoke exactly one of them when the operation
 * completes (whether synchronously or asynchronously).
 * This guarantees that the React Native Promise is resolved/rejected
 * only after the actual I/O finishes — which is critical for print ordering.
 */
public interface PrinterAdapter {

    public void init(ReactApplicationContext reactContext, Callback successCallback, Callback errorCallback);

    public List<PrinterDevice> getDeviceList(Callback errorCallback);

    public void selectDevice(PrinterDeviceId printerDeviceId, Callback successCallback, Callback errorCallback);

    public void closeConnectionIfExists();

    /**
     * Check if the printer is currently connected.
     */
    public boolean isConnected();

    public void printRawData(String rawBase64Data, Callback successCallback, Callback errorCallback);

    public void printImageData(String imageUrl, int imageWidth, int imageHeight, Callback successCallback, Callback errorCallback);

    public void printImageBase64(Bitmap imageUrl, int imageWidth, int imageHeight, Callback successCallback, Callback errorCallback);
}
