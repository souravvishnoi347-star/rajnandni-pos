package com.rajnandni.pos;

import android.content.res.AssetManager;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        try {
            AssetManager am = getAssets();
            InputStream is = am.open("capacitor.config.json");
            byte[] bytes = new byte[is.available()];
            int read = is.read(bytes);
            is.close();

            if (read > 0) {
                String jsonStr = new String(bytes, 0, read, StandardCharsets.UTF_8);
                JSONObject json = new JSONObject(jsonStr);

                JSONObject serverObj = json.optJSONObject("server");
                if (serverObj == null) {
                    serverObj = new JSONObject();
                    json.put("server", serverObj);
                }

                // Explicitly inject the flavor-specific target URL
                String targetUrl = BuildConfig.TARGET_URL;
                if (targetUrl != null && !targetUrl.isEmpty()) {
                    serverObj.put("url", targetUrl);
                }

                this.config = new CapConfig(am, json);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.load();

        // Extra guarantee: Ensure the WebView directly loads the flavor-specific target URL
        try {
            final String targetUrl = BuildConfig.TARGET_URL;
            if (targetUrl != null && !targetUrl.isEmpty() && getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().loadUrl(targetUrl);
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
