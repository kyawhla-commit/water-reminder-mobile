package com.kyawhla.hydromate.widget;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import org.json.JSONArray;
import org.json.JSONObject;

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
    
    @ReactMethod
    public void getPendingEntries(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String pendingJson = WaterTrackerWidget.getPendingEntries(context);
            
            JSONArray jsonArray = new JSONArray(pendingJson);
            WritableArray result = Arguments.createArray();
            
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject entry = jsonArray.getJSONObject(i);
                WritableMap map = Arguments.createMap();
                map.putInt("amount", entry.getInt("amount"));
                map.putDouble("timestamp", entry.getLong("timestamp"));
                map.putString("date", entry.getString("date"));
                map.putString("time", entry.getString("time"));
                result.pushMap(map);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void clearPendingEntries(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            WaterTrackerWidget.clearPendingEntries(context);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void syncAndClearPendingEntries(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String pendingJson = WaterTrackerWidget.getPendingEntries(context);
            
            JSONArray jsonArray = new JSONArray(pendingJson);
            WritableArray result = Arguments.createArray();
            
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject entry = jsonArray.getJSONObject(i);
                WritableMap map = Arguments.createMap();
                map.putInt("amount", entry.getInt("amount"));
                map.putDouble("timestamp", entry.getLong("timestamp"));
                map.putString("date", entry.getString("date"));
                map.putString("time", entry.getString("time"));
                result.pushMap(map);
            }
            
            // Clear after reading
            WaterTrackerWidget.clearPendingEntries(context);
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getWidgetData(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(
                WaterTrackerWidget.PREFS_NAME, Context.MODE_PRIVATE);
            
            WritableMap result = Arguments.createMap();
            result.putInt("currentIntake", prefs.getInt(WaterTrackerWidget.KEY_CURRENT_INTAKE, 0));
            result.putInt("dailyGoal", prefs.getInt(WaterTrackerWidget.KEY_DAILY_GOAL, 2000));
            result.putString("lastSyncDate", prefs.getString(WaterTrackerWidget.KEY_LAST_SYNC_DATE, ""));
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}