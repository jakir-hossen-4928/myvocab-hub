package com.sajuriyastudio.myvocabhub;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable the native WebView overscroll / rubber-band bounce.
        // This is the root cause of the whole-app UI shake on pull-to-refresh
        // and at scroll edges, and it also moves fixed navbar / bottom nav.
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
            }
        } catch (Exception ignored) {
            // Bridge/WebView are guarded by the null checks above.
        }
    }
}