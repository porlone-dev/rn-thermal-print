package com.pinmi.react.printer.adapter;

import static com.pinmi.react.printer.adapter.UtilsImage.getPixelsSlow;
import static com.pinmi.react.printer.adapter.UtilsImage.recollectSlice;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

/**
 * BLE Printer Adapter with proper threading, timeouts, and error handling.
 * All socket access is guarded by a ReentrantLock.
 * Connection and print operations run on background threads.
 */
public class BLEPrinterAdapter implements PrinterAdapter {

    private static BLEPrinterAdapter mInstance;

    private final String LOG_TAG = "RNBLEPrinter";

    // --- Socket & Device (guarded by socketLock) ---
    private BluetoothDevice mBluetoothDevice;
    private BluetoothSocket mBluetoothSocket;
    private final ReentrantLock socketLock = new ReentrantLock();

    // --- Connection state ---
    private final AtomicBoolean isConnecting = new AtomicBoolean(false);
    private final AtomicBoolean isDisconnecting = new AtomicBoolean(false);
    private volatile Thread activeConnectThread = null;

    private ReactApplicationContext mContext;

    // --- Auto-reconnect configuration ---
    private volatile boolean autoReconnect = false;
    private volatile int maxReconnectAttempts = 3;
    private volatile int reconnectDelay = 2000; // milliseconds
    private volatile int connectionTimeout = 10000; // milliseconds
    private volatile int reconnectAttempts = 0;
    private volatile String lastConnectedAddress = null;
    private final AtomicBoolean isReconnecting = new AtomicBoolean(false);

    // --- Thread pools ---
    private final ExecutorService connectionExecutor = Executors.newSingleThreadExecutor();
    private final ExecutorService printExecutor = Executors.newSingleThreadExecutor();
    private final ExecutorService imageExecutor = Executors.newSingleThreadExecutor();

    // --- ESC/POS constants ---
    private final static char ESC_CHAR = 0x1B;
    private static final byte[] SELECT_BIT_IMAGE_MODE = {0x1B, 0x2A, 33};
    private final static byte[] SET_LINE_SPACE_24 = new byte[]{ESC_CHAR, 0x33, 24};
    private final static byte[] SET_LINE_SPACE_32 = new byte[]{ESC_CHAR, 0x33, 32};
    private final static byte[] LINE_FEED = new byte[]{0x0A};
    private static final byte[] CENTER_ALIGN = {0x1B, 0X61, 0X31};

    private static final UUID PRINTER_UUID = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb");

    // --- Network timeouts ---
    private static final int NETWORK_CONNECT_TIMEOUT = 15000; // 15 seconds
    private static final int NETWORK_READ_TIMEOUT = 30000; // 30 seconds

    private BLEPrinterAdapter() {
    }

    public static BLEPrinterAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new BLEPrinterAdapter();
        }
        return mInstance;
    }

    // =========================================================================
    // Initialization
    // =========================================================================

    @Override
    public void init(ReactApplicationContext reactContext, Callback successCallback, Callback errorCallback) {
        this.mContext = reactContext;
        BluetoothAdapter bluetoothAdapter = getBTAdapter();
        if (bluetoothAdapter == null) {
            errorCallback.invoke("No bluetooth adapter available");
            return;
        }
        if (!bluetoothAdapter.isEnabled()) {
            errorCallback.invoke("bluetooth adapter is not enabled");
            return;
        }
        successCallback.invoke();
    }

    private static BluetoothAdapter getBTAdapter() {
        return BluetoothAdapter.getDefaultAdapter();
    }

    // =========================================================================
    // Device Listing
    // =========================================================================

    @Override
    public List<PrinterDevice> getDeviceList(Callback errorCallback) {
        BluetoothAdapter bluetoothAdapter = getBTAdapter();
        List<PrinterDevice> printerDevices = new ArrayList<>();
        if (bluetoothAdapter == null) {
            errorCallback.invoke("No bluetooth adapter available");
            return printerDevices;
        }
        if (!bluetoothAdapter.isEnabled()) {
            errorCallback.invoke("bluetooth is not enabled");
            return printerDevices;
        }
        Set<BluetoothDevice> pairedDevices = getBTAdapter().getBondedDevices();
        for (BluetoothDevice device : pairedDevices) {
            printerDevices.add(new BLEPrinterDevice(device));
        }
        return printerDevices;
    }

    // =========================================================================
    // Connection Management
    // =========================================================================

    @Override
    public void selectDevice(PrinterDeviceId printerDeviceId, Callback successCallback, Callback errorCallback) {
        BluetoothAdapter bluetoothAdapter = getBTAdapter();
        if (bluetoothAdapter == null) {
            errorCallback.invoke("No bluetooth adapter available");
            return;
        }
        if (!bluetoothAdapter.isEnabled()) {
            errorCallback.invoke("bluetooth is not enabled");
            return;
        }

        BLEPrinterDeviceId blePrinterDeviceId = (BLEPrinterDeviceId) printerDeviceId;

        // Check if already connected to this device
        socketLock.lock();
        try {
            if (this.mBluetoothDevice != null) {
                if (this.mBluetoothDevice.getAddress().equals(blePrinterDeviceId.getInnerMacAddress())
                        && this.mBluetoothSocket != null && mBluetoothSocket.isConnected()) {
                    Log.v(LOG_TAG, "Already connected, skipping reconnect");
                    successCallback.invoke(new BLEPrinterDevice(this.mBluetoothDevice).toRNWritableMap());
                    return;
                }
            }
        } finally {
            socketLock.unlock();
        }

        // Close existing connection first  
        closeConnectionIfExistsSync();

        Set<BluetoothDevice> pairedDevices = getBTAdapter().getBondedDevices();

        for (BluetoothDevice device : pairedDevices) {
            if (device.getAddress().equals(blePrinterDeviceId.getInnerMacAddress())) {
                // Run connection on background thread
                connectBluetoothDeviceAsync(device, successCallback, errorCallback);
                return;
            }
        }

        String errorText = "Can not find the specified printing device, please perform Bluetooth pairing in the system settings first.";
        try {
            Toast.makeText(this.mContext, errorText, Toast.LENGTH_LONG).show();
        } catch (Exception ignored) {
        }
        errorCallback.invoke(errorText);
    }

    /**
     * Async connection — runs on connectionExecutor so the React Native thread is never blocked.
     */
    private void connectBluetoothDeviceAsync(final BluetoothDevice device,
                                             final Callback successCallback,
                                             final Callback errorCallback) {
        if (isConnecting.getAndSet(true)) {
            errorCallback.invoke("CONNECTION_FAILED: Another connection attempt is already in progress");
            return;
        }

        connectionExecutor.submit(() -> {
            try {
                connectBluetoothDeviceSync(device);

                // Success — invoke callback
                new Handler(Looper.getMainLooper()).post(() -> {
                    successCallback.invoke(new BLEPrinterDevice(device).toRNWritableMap());
                });
            } catch (IOException e) {
                Log.e(LOG_TAG, "Connection failed: " + e.getMessage());
                new Handler(Looper.getMainLooper()).post(() -> {
                    errorCallback.invoke("CONNECTION_FAILED: " + e.getMessage());
                });
            } finally {
                isConnecting.set(false);
            }
        });
    }

    /**
     * Synchronous connection with timeout. Called from background thread only.
     */
    private void connectBluetoothDeviceSync(BluetoothDevice device) throws IOException {
        // --- Primary attempt: insecure RFCOMM ---
        try {
            BluetoothSocket socket = device.createInsecureRfcommSocketToServiceRecord(PRINTER_UUID);
            connectSocketWithTimeout(socket, device);
            return;
        } catch (IOException e) {
            Log.d(LOG_TAG, "Primary connection failed, trying fallback: " + e.getMessage());
        }

        // --- Fallback attempt: reflection-based RFCOMM ---
        try {
            BluetoothSocket socket = (BluetoothSocket) device.getClass()
                    .getMethod("createRfcommSocket", new Class[]{int.class})
                    .invoke(device, 1);
            connectSocketWithTimeout(socket, device);
        } catch (Exception e) {
            throw new IOException("CONNECTION_FAILED: " + e.getMessage());
        }
    }

    /**
     * Connects a socket with a configurable timeout.
     * Spawns a connect thread and waits up to `connectionTimeout` ms.
     * If the timeout fires first, the socket is closed to unblock connect().
     */
    private void connectSocketWithTimeout(final BluetoothSocket socket, BluetoothDevice device) throws IOException {
        final AtomicBoolean connected = new AtomicBoolean(false);
        final AtomicBoolean timedOut = new AtomicBoolean(false);
        final IOException[] connectError = {null};

        Thread connectThread = new Thread(() -> {
            try {
                socket.connect();
                connected.set(true);
            } catch (IOException e) {
                connectError[0] = e;
            }
        }, "BLE-Connect-Thread");

        // Schedule a timeout to close the socket if connect() hangs
        ScheduledExecutorService timeoutExecutor = Executors.newSingleThreadScheduledExecutor();
        Future<?> timeoutFuture = timeoutExecutor.schedule(() -> {
            if (!connected.get()) {
                timedOut.set(true);
                try {
                    socket.close();
                } catch (IOException ignored) {
                }
            }
        }, connectionTimeout, TimeUnit.MILLISECONDS);

        socketLock.lock();
        try {
            activeConnectThread = connectThread;
        } finally {
            socketLock.unlock();
        }

        connectThread.start();

        try {
            connectThread.join(connectionTimeout + 2000); // Extra buffer beyond timeout
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try {
                socket.close();
            } catch (IOException ignored) {
            }
            throw new IOException("Connection interrupted");
        } finally {
            timeoutFuture.cancel(false);
            timeoutExecutor.shutdownNow();
            socketLock.lock();
            try {
                activeConnectThread = null;
            } finally {
                socketLock.unlock();
            }
        }

        if (timedOut.get() || !connected.get()) {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
            String msg = timedOut.get()
                    ? "Connection timeout after " + connectionTimeout + "ms"
                    : (connectError[0] != null ? connectError[0].getMessage() : "Connection failed");
            throw new IOException(msg);
        }

        // Connection successful — update state
        socketLock.lock();
        try {
            this.mBluetoothSocket = socket;
            this.mBluetoothDevice = device;
        } finally {
            socketLock.unlock();
        }

        this.lastConnectedAddress = device.getAddress();
        this.reconnectAttempts = 0;
        this.isReconnecting.set(false);

        Log.d(LOG_TAG, "Connected to " + device.getName() + " [" + device.getAddress() + "]");
    }

    // =========================================================================
    // Disconnection
    // =========================================================================

    @Override
    public void closeConnectionIfExists() {
        closeConnectionIfExistsSync();
    }

    /**
     * Synchronously closes the socket, waits for it to finish, 
     * cancels any in-flight connection, and nulls out references.
     */
    private void closeConnectionIfExistsSync() {
        isDisconnecting.set(true);

        socketLock.lock();
        try {
            // Cancel in-flight connection if any
            if (activeConnectThread != null) {
                activeConnectThread.interrupt();
                activeConnectThread = null;
            }

            if (this.mBluetoothSocket != null) {
                try {
                    this.mBluetoothSocket.close();
                } catch (IOException e) {
                    Log.e(LOG_TAG, "Error closing socket: " + e.getMessage());
                }
                this.mBluetoothSocket = null;
            }

            this.mBluetoothDevice = null;
        } finally {
            socketLock.unlock();
            isDisconnecting.set(false);
            isConnecting.set(false);
        }

        Log.d(LOG_TAG, "Connection closed");
    }

    // =========================================================================
    // Connection Status
    // =========================================================================

    @Override
    public boolean isConnected() {
        socketLock.lock();
        try {
            return this.mBluetoothSocket != null && this.mBluetoothSocket.isConnected();
        } finally {
            socketLock.unlock();
        }
    }

    // =========================================================================
    // Connection Options
    // =========================================================================

    public void setConnectionOptions(boolean autoReconnect, int maxAttempts, int reconnectDelay, int timeout) {
        this.autoReconnect = autoReconnect;
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = reconnectDelay;
        this.connectionTimeout = timeout;
    }

    // =========================================================================
    // Auto-Reconnect
    // =========================================================================

    /**
     * Attempts auto-reconnect on a background thread.
     * Called when a print operation detects a disconnected socket.
     */
    private void attemptReconnect() {
        if (!autoReconnect || lastConnectedAddress == null) {
            return;
        }

        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.d(LOG_TAG, "Max reconnect attempts (" + maxReconnectAttempts + ") reached, giving up");
            reconnectAttempts = 0;
            isReconnecting.set(false);
            return;
        }

        if (!isReconnecting.compareAndSet(false, true)) {
            Log.d(LOG_TAG, "Reconnect already in progress, skipping");
            return;
        }

        connectionExecutor.submit(() -> {
            try {
                reconnectAttempts++;
                Log.d(LOG_TAG, "Attempting reconnect " + reconnectAttempts + "/" + maxReconnectAttempts);

                Thread.sleep(reconnectDelay);

                // Check if we got disconnected intentionally during the delay
                if (isDisconnecting.get()) {
                    isReconnecting.set(false);
                    return;
                }

                Set<BluetoothDevice> pairedDevices = getBTAdapter().getBondedDevices();
                for (BluetoothDevice device : pairedDevices) {
                    if (device.getAddress().equals(lastConnectedAddress)) {
                        connectBluetoothDeviceSync(device);
                        Log.d(LOG_TAG, "Reconnection successful");
                        reconnectAttempts = 0;
                        isReconnecting.set(false);
                        return;
                    }
                }

                Log.e(LOG_TAG, "Device not found in paired devices for reconnect");
                isReconnecting.set(false);
                // Retry
                if (reconnectAttempts < maxReconnectAttempts) {
                    isReconnecting.set(false);
                    attemptReconnect();
                }
            } catch (Exception e) {
                Log.e(LOG_TAG, "Reconnection attempt " + reconnectAttempts + " failed: " + e.getMessage());
                isReconnecting.set(false);
                // Retry
                if (reconnectAttempts < maxReconnectAttempts) {
                    attemptReconnect();
                } else {
                    reconnectAttempts = 0;
                }
            }
        });
    }

    // =========================================================================
    // Printer Status (Battery & Paper)
    // =========================================================================

    public int getBatteryLevel() {
        socketLock.lock();
        try {
            if (this.mBluetoothSocket == null || !this.mBluetoothSocket.isConnected()) {
                return -1;
            }

            OutputStream printerOutputStream = this.mBluetoothSocket.getOutputStream();
            InputStream printerInputStream = this.mBluetoothSocket.getInputStream();

            // ESC/POS status query (0x10 0x04 0x01)
            byte[] statusCommand = new byte[]{0x10, 0x04, 0x01};
            printerOutputStream.write(statusCommand);
            printerOutputStream.flush();

            Thread.sleep(100);
            if (printerInputStream.available() > 0) {
                byte[] response = new byte[printerInputStream.available()];
                printerInputStream.read(response);
                // Parse battery level (printer-specific)
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to get battery level: " + e.getMessage());
        } finally {
            socketLock.unlock();
        }

        return -1;
    }

    public String getPaperStatus() {
        socketLock.lock();
        try {
            if (this.mBluetoothSocket == null || !this.mBluetoothSocket.isConnected()) {
                return "unknown";
            }

            OutputStream printerOutputStream = this.mBluetoothSocket.getOutputStream();
            InputStream printerInputStream = this.mBluetoothSocket.getInputStream();

            // ESC/POS paper sensor status (0x10 0x04 0x04)
            byte[] statusCommand = new byte[]{0x10, 0x04, 0x04};
            printerOutputStream.write(statusCommand);
            printerOutputStream.flush();

            Thread.sleep(100);
            if (printerInputStream.available() > 0) {
                byte[] response = new byte[printerInputStream.available()];
                printerInputStream.read(response);

                if (response.length > 0) {
                    int status = response[0] & 0xFF;
                    if ((status & 0x20) != 0) return "empty";
                    if ((status & 0x40) != 0) return "low";
                    return "ok";
                }
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to get paper status: " + e.getMessage());
        } finally {
            socketLock.unlock();
        }

        return "unknown";
    }

    // =========================================================================
    // Raw Data Printing
    // =========================================================================

    @Override
    public void printRawData(String rawBase64Data, Callback errorCallback) {
        socketLock.lock();
        try {
            if (this.mBluetoothSocket == null || !this.mBluetoothSocket.isConnected()) {
                socketLock.unlock();
                // Try auto-reconnect
                if (autoReconnect && lastConnectedAddress != null) {
                    attemptReconnect();
                }
                errorCallback.invoke("NOT_CONNECTED: Printer is not connected");
                return;
            }
        } finally {
            if (socketLock.isHeldByCurrentThread()) {
                socketLock.unlock();
            }
        }

        final String rawData = rawBase64Data;

        printExecutor.submit(() -> {
            socketLock.lock();
            try {
                if (this.mBluetoothSocket == null || !this.mBluetoothSocket.isConnected()) {
                    new Handler(Looper.getMainLooper()).post(() -> {
                        if (autoReconnect) attemptReconnect();
                        errorCallback.invoke("NOT_CONNECTED: Connection lost during print");
                    });
                    return;
                }

                byte[] bytes = Base64.decode(rawData, Base64.DEFAULT);
                OutputStream printerOutputStream = this.mBluetoothSocket.getOutputStream();
                printerOutputStream.write(bytes, 0, bytes.length);
                printerOutputStream.flush();

                Log.v(LOG_TAG, "Raw data printed successfully (" + bytes.length + " bytes)");
            } catch (IOException e) {
                Log.e(LOG_TAG, "Failed to print raw data: " + e.getMessage());
                e.printStackTrace();
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (autoReconnect) attemptReconnect();
                    errorCallback.invoke("PRINT_FAILED: " + e.getMessage());
                });
            } finally {
                socketLock.unlock();
            }
        });
    }

    // =========================================================================
    // Image Printing — URL (background network I/O)
    // =========================================================================

    /**
     * Download bitmap from URL on a background thread with proper timeouts.
     */
    public static Bitmap getBitmapFromURL(String src) {
        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.setConnectTimeout(NETWORK_CONNECT_TIMEOUT);
            connection.setReadTimeout(NETWORK_READ_TIMEOUT);
            connection.connect();

            InputStream input = connection.getInputStream();
            Bitmap myBitmap = BitmapFactory.decodeStream(input);
            input.close();
            connection.disconnect();

            if (myBitmap == null) {
                return null;
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            myBitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
            return myBitmap;
        } catch (IOException e) {
            Log.e("RNBLEPrinter", "Failed to download image: " + e.getMessage());
            return null;
        }
    }

    @Override
    public void printImageData(String imageUrl, int imageWidth, int imageHeight, Callback errorCallback) {
        // Download image on background thread, then print
        imageExecutor.submit(() -> {
            final Bitmap bitmapImage = getBitmapFromURL(imageUrl);

            if (bitmapImage == null) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    errorCallback.invoke("PRINT_FAILED: Failed to download image from URL");
                });
                return;
            }

            printBitmapInternal(bitmapImage, imageWidth, imageHeight, errorCallback);
        });
    }

    // =========================================================================
    // Image Printing — Base64  
    // =========================================================================

    @Override
    public void printImageBase64(final Bitmap bitmapImage, int imageWidth, int imageHeight, Callback errorCallback) {
        if (bitmapImage == null) {
            errorCallback.invoke("PRINT_FAILED: image not found");
            return;
        }

        printExecutor.submit(() -> {
            printBitmapInternal(bitmapImage, imageWidth, imageHeight, errorCallback);
        });
    }

    // =========================================================================
    // Internal bitmap printing — thread-safe
    // =========================================================================

    private void printBitmapInternal(Bitmap bitmapImage, int imageWidth, int imageHeight, Callback errorCallback) {
        socketLock.lock();
        try {
            if (this.mBluetoothSocket == null || !this.mBluetoothSocket.isConnected()) {
                new Handler(Looper.getMainLooper()).post(() -> {
                    if (autoReconnect) attemptReconnect();
                    errorCallback.invoke("NOT_CONNECTED: Printer is not connected");
                });
                return;
            }

            int[][] pixels = getPixelsSlow(bitmapImage, imageWidth, imageHeight);
            OutputStream printerOutputStream = this.mBluetoothSocket.getOutputStream();

            printerOutputStream.write(SET_LINE_SPACE_24);
            printerOutputStream.write(CENTER_ALIGN);

            for (int y = 0; y < pixels.length; y += 24) {
                printerOutputStream.write(SELECT_BIT_IMAGE_MODE);
                printerOutputStream.write(new byte[]{
                        (byte) (0x00ff & pixels[y].length),
                        (byte) ((0xff00 & pixels[y].length) >> 8)
                });
                for (int x = 0; x < pixels[y].length; x++) {
                    printerOutputStream.write(recollectSlice(y, x, pixels));
                }
                printerOutputStream.write(LINE_FEED);
            }
            printerOutputStream.write(SET_LINE_SPACE_32);
            printerOutputStream.write(LINE_FEED);
            printerOutputStream.flush();

            Log.v(LOG_TAG, "Image printed successfully");
        } catch (IOException e) {
            Log.e(LOG_TAG, "Failed to print image: " + e.getMessage());
            e.printStackTrace();
            new Handler(Looper.getMainLooper()).post(() -> {
                if (autoReconnect) attemptReconnect();
                errorCallback.invoke("PRINT_FAILED: " + e.getMessage());
            });
        } finally {
            socketLock.unlock();
        }
    }
}
