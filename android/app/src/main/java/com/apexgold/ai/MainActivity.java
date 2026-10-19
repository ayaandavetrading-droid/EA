package com.apexgold.ai;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int REQUEST_CODE_SCREEN_CAPTURE = 1001;
    private WebView webView;
    private MediaProjectionManager projectionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);

        webView = new WebView(this);
        setContentView(webView);

        configureWebView();

        // Load local assets or remote production dashboard URL
        String targetUrl = "https://ea-chi.vercel.app/";
        webView.loadUrl(targetUrl);

        ApexScreenCaptureService.setFrameCallback(base64Jpeg -> runOnUiThread(() -> {
            String js = "if (window.onNativeAndroidFrame) { window.onNativeAndroidFrame('" + base64Jpeg + "'); }";
            webView.evaluateJavascript(js, null);
        }));
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Bridge to allow web app to command native screen capture
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void startScreenCapture() {
                runOnUiThread(() -> requestMediaProjection());
            }

            @JavascriptInterface
            public void stopScreenCapture() {
                runOnUiThread(() -> {
                    Intent stopIntent = new Intent(MainActivity.this, ApexScreenCaptureService.class);
                    stopIntent.setAction(ApexScreenCaptureService.ACTION_STOP);
                    startService(stopIntent);
                });
            }

            @JavascriptInterface
            public boolean isAvailable() {
                return true;
            }
        }, "ApexAndroidBridge");

        // Automatically approve WebRTC video capture permissions within native app
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    String[] resources = request.getResources();
                    for (String resource : resources) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            request.grant(resources);
                            return;
                        }
                    }
                    request.grant(resources);
                });
            }
        });

        webView.setWebViewClient(new WebViewClient());
    }

    private void requestMediaProjection() {
        if (projectionManager != null) {
            Intent intent = projectionManager.createScreenCaptureIntent();
            startActivityForResult(intent, REQUEST_CODE_SCREEN_CAPTURE);
        } else {
            Toast.makeText(this, "Screen capture not supported on this device.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_CODE_SCREEN_CAPTURE) {
            if (resultCode == RESULT_OK && data != null) {
                Intent serviceIntent = new Intent(this, ApexScreenCaptureService.class);
                serviceIntent.setAction(ApexScreenCaptureService.ACTION_START);
                serviceIntent.putExtra(ApexScreenCaptureService.EXTRA_RESULT_CODE, resultCode);
                serviceIntent.putExtra(ApexScreenCaptureService.EXTRA_RESULT_DATA, data);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent);
                } else {
                    startService(serviceIntent);
                }

                Toast.makeText(this, "Apex Gold AI: MT5 screen capture armed.", Toast.LENGTH_SHORT).show();
                webView.evaluateJavascript("if (window.onNativeScreenCaptureStarted) { window.onNativeScreenCaptureStarted(); }", null);
            } else {
                Toast.makeText(this, "Screen capture permission was cancelled.", Toast.LENGTH_SHORT).show();
                webView.evaluateJavascript("if (window.onNativeScreenCaptureDenied) { window.onNativeScreenCaptureDenied(); }", null);
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
