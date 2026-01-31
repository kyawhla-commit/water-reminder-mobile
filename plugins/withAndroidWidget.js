const {
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Widget layout XML - Standard (2x2)
const WIDGET_LAYOUT = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="@drawable/widget_background"
    android:gravity="center">

    <TextView
        android:id="@+id/text_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="💧 HydroMate"
        android:textSize="14sp"
        android:textColor="#2196F3"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/text_percentage"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0%"
        android:textSize="36sp"
        android:textColor="#1976D2"
        android:textStyle="bold"
        android:layout_marginTop="8dp" />

    <ProgressBar
        android:id="@+id/progress_bar"
        style="@android:style/Widget.ProgressBar.Horizontal"
        android:layout_width="match_parent"
        android:layout_height="8dp"
        android:layout_marginTop="8dp"
        android:layout_marginBottom="8dp"
        android:max="100"
        android:progress="0"
        android:progressDrawable="@drawable/widget_progress" />

    <TextView
        android:id="@+id/text_intake"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0 / 2000 ml"
        android:textSize="12sp"
        android:textColor="#666666" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center"
        android:layout_marginTop="12dp">

        <Button
            android:id="@+id/btn_add_150"
            android:layout_width="0dp"
            android:layout_height="36dp"
            android:layout_weight="1"
            android:layout_marginEnd="4dp"
            android:text="+150ml"
            android:textSize="11sp"
            android:textColor="#FFFFFF"
            android:background="@drawable/widget_button" />

        <Button
            android:id="@+id/btn_add_250"
            android:layout_width="0dp"
            android:layout_height="36dp"
            android:layout_weight="1"
            android:layout_marginStart="4dp"
            android:text="+250ml"
            android:textSize="11sp"
            android:textColor="#FFFFFF"
            android:background="@drawable/widget_button" />

    </LinearLayout>

</LinearLayout>`;

// Small Widget layout XML (1x1) - Just percentage and quick add
const WIDGET_LAYOUT_SMALL = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container_small"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="8dp"
    android:background="@drawable/widget_background"
    android:gravity="center">

    <TextView
        android:id="@+id/text_percentage_small"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0%"
        android:textSize="24sp"
        android:textColor="#1976D2"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/text_emoji"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="💧"
        android:textSize="20sp"
        android:layout_marginTop="4dp" />

    <Button
        android:id="@+id/btn_add_quick"
        android:layout_width="match_parent"
        android:layout_height="28dp"
        android:layout_marginTop="8dp"
        android:text="+250ml"
        android:textSize="10sp"
        android:textColor="#FFFFFF"
        android:background="@drawable/widget_button" />

</LinearLayout>`;

// Wide Widget layout XML (4x1) - Horizontal progress
const WIDGET_LAYOUT_WIDE = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_container_wide"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="horizontal"
    android:padding="12dp"
    android:background="@drawable/widget_background"
    android:gravity="center_vertical">

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/text_title_wide"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="💧 HydroMate"
            android:textSize="12sp"
            android:textColor="#2196F3"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/text_intake_wide"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="0 / 2000 ml"
            android:textSize="14sp"
            android:textColor="#333333"
            android:textStyle="bold"
            android:layout_marginTop="2dp" />

        <ProgressBar
            android:id="@+id/progress_bar_wide"
            style="@android:style/Widget.ProgressBar.Horizontal"
            android:layout_width="match_parent"
            android:layout_height="6dp"
            android:layout_marginTop="6dp"
            android:max="100"
            android:progress="0"
            android:progressDrawable="@drawable/widget_progress" />

    </LinearLayout>

    <TextView
        android:id="@+id/text_percentage_wide"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0%"
        android:textSize="28sp"
        android:textColor="#1976D2"
        android:textStyle="bold"
        android:layout_marginStart="16dp"
        android:layout_marginEnd="8dp" />

    <Button
        android:id="@+id/btn_add_wide"
        android:layout_width="60dp"
        android:layout_height="36dp"
        android:text="+250"
        android:textSize="11sp"
        android:textColor="#FFFFFF"
        android:background="@drawable/widget_button" />

</LinearLayout>`;

// Widget background drawable
const WIDGET_BACKGROUND = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <corners android:radius="16dp" />
    <stroke
        android:width="1dp"
        android:color="#E0E0E0" />
</shape>`;

// Widget button drawable
const WIDGET_BUTTON = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#2196F3" />
    <corners android:radius="8dp" />
</shape>`;

// Widget progress drawable
const WIDGET_PROGRESS = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/background">
        <shape android:shape="rectangle">
            <solid android:color="#E3F2FD" />
            <corners android:radius="4dp" />
        </shape>
    </item>
    <item android:id="@android:id/progress">
        <clip>
            <shape android:shape="rectangle">
                <solid android:color="#2196F3" />
                <corners android:radius="4dp" />
            </shape>
        </clip>
    </item>
</layer-list>`;

// Widget info XML
const WIDGET_INFO = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="180dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_water_tracker"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview"
    android:description="@string/widget_description" />`;

// Small widget info XML (1x1)
const WIDGET_INFO_SMALL = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="70dp"
    android:minHeight="70dp"
    android:targetCellWidth="1"
    android:targetCellHeight="1"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_water_tracker_small"
    android:resizeMode="none"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview"
    android:description="@string/widget_description_small" />`;

// Wide widget info XML (4x1)
const WIDGET_INFO_WIDE = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="70dp"
    android:targetCellWidth="4"
    android:targetCellHeight="1"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_water_tracker_wide"
    android:resizeMode="horizontal"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview"
    android:description="@string/widget_description_wide" />`;

// Widget preview placeholder
const WIDGET_PREVIEW = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#E3F2FD" />
    <corners android:radius="16dp" />
    <stroke
        android:width="2dp"
        android:color="#2196F3" />
</shape>`;

// Widget Java class
const getWidgetJava = (packageName) => `package ${packageName}.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import ${packageName}.R;

public class WaterTrackerWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "HydroMateWidgetPrefs";
    public static final String KEY_CURRENT_INTAKE = "current_intake";
    public static final String KEY_DAILY_GOAL = "daily_goal";
    
    public static final String ACTION_ADD_WATER = "${packageName}.ACTION_ADD_WATER";
    public static final String EXTRA_AMOUNT = "extra_amount";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        if (ACTION_ADD_WATER.equals(intent.getAction())) {
            int amount = intent.getIntExtra(EXTRA_AMOUNT, 0);
            addWater(context, amount);
        }
    }

    private void addWater(Context context, int amount) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int currentIntake = prefs.getInt(KEY_CURRENT_INTAKE, 0);
        int newIntake = currentIntake + amount;
        
        prefs.edit().putInt(KEY_CURRENT_INTAKE, newIntake).apply();
        refreshAllWidgets(context);
    }

    public static void refreshAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, WaterTrackerWidget.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
        
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int currentIntake = prefs.getInt(KEY_CURRENT_INTAKE, 0);
        int dailyGoal = prefs.getInt(KEY_DAILY_GOAL, 2000);
        
        int percentage = dailyGoal > 0 ? Math.min((currentIntake * 100) / dailyGoal, 100) : 0;
        
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_water_tracker);
        
        views.setTextViewText(R.id.text_percentage, percentage + "%");
        views.setTextViewText(R.id.text_intake, currentIntake + " / " + dailyGoal + " ml");
        views.setProgressBar(R.id.progress_bar, 100, percentage, false);
        
        views.setOnClickPendingIntent(R.id.btn_add_150, createAddWaterIntent(context, 150));
        views.setOnClickPendingIntent(R.id.btn_add_250, createAddWaterIntent(context, 250));
        
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            PendingIntent launchPendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_container, launchPendingIntent);
        }
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent createAddWaterIntent(Context context, int amount) {
        Intent intent = new Intent(context, WaterTrackerWidget.class);
        intent.setAction(ACTION_ADD_WATER);
        intent.putExtra(EXTRA_AMOUNT, amount);
        return PendingIntent.getBroadcast(
            context, amount, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}`;

// Native Module for React Native bridge
const getWidgetModuleJava = (packageName) => `package ${packageName}.widget;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class HydroMateWidgetModule extends ReactContextBaseJavaModule {

    public HydroMateWidgetModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "HydroMateWidget";
    }

    @ReactMethod
    public void updateWidget(int currentIntake, int dailyGoal, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(
                WaterTrackerWidget.PREFS_NAME, Context.MODE_PRIVATE);
            
            prefs.edit()
                .putInt(WaterTrackerWidget.KEY_CURRENT_INTAKE, currentIntake)
                .putInt(WaterTrackerWidget.KEY_DAILY_GOAL, dailyGoal)
                .apply();
            
            WaterTrackerWidget.refreshAllWidgets(context);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void resetWidget(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(
                WaterTrackerWidget.PREFS_NAME, Context.MODE_PRIVATE);
            
            prefs.edit()
                .putInt(WaterTrackerWidget.KEY_CURRENT_INTAKE, 0)
                .apply();
            
            WaterTrackerWidget.refreshAllWidgets(context);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}`;

// Package class to register the module
const getWidgetPackageJava = (packageName) => `package ${packageName}.widget;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HydroMateWidgetPackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new HydroMateWidgetModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}`;

const withAndroidWidget = (config) => {
  const packageName = config.android?.package || 'com.kyawhla.hydromate';

  // Add widget strings
  config = withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];
    
    const addString = (name, value) => {
      const existing = strings.find(s => s.$.name === name);
      if (!existing) {
        strings.push({ $: { name }, _: value });
      }
    };

    addString('widget_name', 'HydroMate Water Tracker');
    addString('widget_name_small', 'HydroMate Quick');
    addString('widget_name_wide', 'HydroMate Progress');
    addString('widget_description', 'Track your daily water intake with quick add buttons');
    addString('widget_description_small', 'Quick water tracking at a glance');
    addString('widget_description_wide', 'Horizontal progress bar with quick add');
    
    config.modResults.resources.string = strings;
    return config;
  });

  // Add widget receiver to AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];
    
    if (!application.receiver) {
      application.receiver = [];
    }
    
    const widgetReceiverExists = application.receiver.some(
      (receiver) => receiver.$['android:name'] === '.widget.WaterTrackerWidget'
    );
    
    if (!widgetReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': '.widget.WaterTrackerWidget',
          'android:exported': 'true',
          'android:label': '@string/widget_name',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': `${packageName}.ACTION_ADD_WATER` } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widget_water_tracker_info',
            },
          },
        ],
      });
    }
    
    return config;
  });

  // Create all widget files
  config = withDangerousMod(config, ['android', async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const androidPath = path.join(projectRoot, 'android', 'app', 'src', 'main');
    
    // Create directories
    const widgetJavaPath = path.join(androidPath, 'java', ...packageName.split('.'), 'widget');
    const dirs = [
      path.join(androidPath, 'res', 'layout'),
      path.join(androidPath, 'res', 'drawable'),
      path.join(androidPath, 'res', 'xml'),
      widgetJavaPath,
    ];
    
    for (const dir of dirs) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write layout file
    fs.writeFileSync(
      path.join(androidPath, 'res', 'layout', 'widget_water_tracker.xml'),
      WIDGET_LAYOUT
    );
    
    // Write small layout file
    fs.writeFileSync(
      path.join(androidPath, 'res', 'layout', 'widget_water_tracker_small.xml'),
      WIDGET_LAYOUT_SMALL
    );
    
    // Write wide layout file
    fs.writeFileSync(
      path.join(androidPath, 'res', 'layout', 'widget_water_tracker_wide.xml'),
      WIDGET_LAYOUT_WIDE
    );
    
    // Write drawable files
    fs.writeFileSync(
      path.join(androidPath, 'res', 'drawable', 'widget_background.xml'),
      WIDGET_BACKGROUND
    );
    fs.writeFileSync(
      path.join(androidPath, 'res', 'drawable', 'widget_button.xml'),
      WIDGET_BUTTON
    );
    fs.writeFileSync(
      path.join(androidPath, 'res', 'drawable', 'widget_progress.xml'),
      WIDGET_PROGRESS
    );
    fs.writeFileSync(
      path.join(androidPath, 'res', 'drawable', 'widget_preview.xml'),
      WIDGET_PREVIEW
    );
    
    // Write widget info XML
    fs.writeFileSync(
      path.join(androidPath, 'res', 'xml', 'widget_water_tracker_info.xml'),
      WIDGET_INFO
    );
    
    // Write small widget info XML
    fs.writeFileSync(
      path.join(androidPath, 'res', 'xml', 'widget_water_tracker_small_info.xml'),
      WIDGET_INFO_SMALL
    );
    
    // Write wide widget info XML
    fs.writeFileSync(
      path.join(androidPath, 'res', 'xml', 'widget_water_tracker_wide_info.xml'),
      WIDGET_INFO_WIDE
    );
    
    // Write Java files
    fs.writeFileSync(
      path.join(widgetJavaPath, 'WaterTrackerWidget.java'),
      getWidgetJava(packageName)
    );
    fs.writeFileSync(
      path.join(widgetJavaPath, 'HydroMateWidgetModule.java'),
      getWidgetModuleJava(packageName)
    );
    fs.writeFileSync(
      path.join(widgetJavaPath, 'HydroMateWidgetPackage.java'),
      getWidgetPackageJava(packageName)
    );
    
    // Modify MainApplication.kt to register the package
    const mainAppPath = path.join(androidPath, 'java', ...packageName.split('.'), 'MainApplication.kt');
    if (fs.existsSync(mainAppPath)) {
      let mainAppContent = fs.readFileSync(mainAppPath, 'utf8');
      
      // Add import if not exists
      const importStatement = `import ${packageName}.widget.HydroMateWidgetPackage`;
      if (!mainAppContent.includes(importStatement)) {
        mainAppContent = mainAppContent.replace(
          /^(package .+\n)/m,
          `$1\n${importStatement}\n`
        );
      }
      
      // Add package to getPackages - handle Kotlin syntax
      if (!mainAppContent.includes('add(HydroMateWidgetPackage())')) {
        // Match the apply block and add our package
        mainAppContent = mainAppContent.replace(
          /(PackageList\(this\)\.packages\.apply \{\s*\n\s*)(\/\/ Packages)/,
          `$1add(HydroMateWidgetPackage())\n              $2`
        );
      }
      
      fs.writeFileSync(mainAppPath, mainAppContent);
    }
    
    return config;
  }]);

  return config;
};

module.exports = withAndroidWidget;
