package com.rajnandni.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        try {
            String url = BuildConfig.TARGET_URL;
            if (url != null && !url.isEmpty()) {
                this.config = new CapConfig.Builder(this)
                    .setServerUrl(url)
                    .setAllowMixedContent(true)
                    .setHTML5mode(true)
                    .create();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.load();
    }
}
