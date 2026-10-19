package com.apexgold.ai;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.WindowManager;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class ApexScreenCaptureService extends Service {
    private static final String TAG = "ApexCaptureService";
    private static final String CHANNEL_ID = "ApexGold_ScreenSupervision";
    private static final int NOTIFICATION_ID = 2727;

    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private int screenDensity;
    private int displayWidth = 720;
    private int displayHeight = 1280;

    public static final String ACTION_START = "com.apexgold.ai.START_CAPTURE";
    public static final String ACTION_STOP = "com.apexgold.ai.STOP_CAPTURE";
    public static final String EXTRA_RESULT_CODE = "extra_result_code";
    public static final String EXTRA_RESULT_DATA = "extra_result_data";

    public interface FrameCallback {
        void onFrameCaptured(String base64Jpeg);
    }

    private static FrameCallback frameCallback;

    public static void setFrameCallback(FrameCallback callback) {
        frameCallback = callback;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if (ACTION_START.equals(action)) {
            int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
            Intent resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA);
            startForegroundWithNotification();
            initScreenCapture(resultCode, resultData);
            return START_STICKY;
        } else if (ACTION_STOP.equals(action)) {
            stopScreenCapture();
            stopSelf();
            return START_NOT_STICKY;
        }

        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Apex Gold AI Screen Supervision",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains live MT5 visual observation and automated trade management.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void startForegroundWithNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        Notification notification = builder
                .setContentTitle("Apex Gold AI — MT5 Screen Supervision")
                .setContentText("Observing XAUUSD chart. Autonomous execution active.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void initScreenCapture(int resultCode, Intent resultData) {
        if (resultData == null) return;

        MediaProjectionManager projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        if (projectionManager == null) return;

        mediaProjection = projectionManager.getMediaProjection(resultCode, resultData);
        if (mediaProjection == null) {
            Log.e(TAG, "Failed to obtain MediaProjection token");
            return;
        }

        WindowManager windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        DisplayMetrics metrics = new DisplayMetrics();
        if (windowManager != null) {
            windowManager.getDefaultDisplay().getRealMetrics(metrics);
            displayWidth = metrics.widthPixels / 2; // scale for AI Vision bandwidth efficiency
            displayHeight = metrics.heightPixels / 2;
            screenDensity = metrics.densityDpi;
        }

        imageReader = ImageReader.newInstance(displayWidth, displayHeight, PixelFormat.RGBA_8888, 2);
        virtualDisplay = mediaProjection.createVirtualDisplay(
                "ApexGoldVirtualDisplay",
                displayWidth,
                displayHeight,
                screenDensity,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader.getSurface(),
                null,
                null
        );

        imageReader.setOnImageAvailableListener(reader -> {
            Image image = null;
            try {
                image = reader.acquireLatestImage();
                if (image != null && frameCallback != null) {
                    Image.Plane[] planes = image.getPlanes();
                    ByteBuffer buffer = planes[0].getBuffer();
                    int pixelStride = planes[0].getPixelStride();
                    int rowStride = planes[0].getRowStride();
                    int rowPadding = rowStride - pixelStride * displayWidth;

                    Bitmap bitmap = Bitmap.createBitmap(
                            displayWidth + rowPadding / pixelStride,
                            displayHeight,
                            Bitmap.Config.ARGB_8888
                    );
                    bitmap.copyPixelsFromBuffer(buffer);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 75, baos);
                    String base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
                    frameCallback.onFrameCaptured(base64);
                    bitmap.recycle();
                }
            } catch (Exception e) {
                Log.w(TAG, "Frame capture error: " + e.getMessage());
            } finally {
                if (image != null) image.close();
            }
        }, null);
    }

    private void stopScreenCapture() {
        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }
        if (imageReader != null) {
            imageReader.close();
            imageReader = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopScreenCapture();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
