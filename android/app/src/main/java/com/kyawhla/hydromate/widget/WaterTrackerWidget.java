package com.kyawhla.hydromate.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.Toast;

import com.kyawhla.hydromate.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class WaterTrackerWidget extends AppWidgetProvider {

    private static final String TAG = "HydroMateWidget";
    
    public static final String PREFS_NAME = "HydroMateWidgetPrefs";
    public static final String KEY_CURRENT_INTAKE = "current_intake";
    public static final String KEY_DAILY_GOAL = "daily_goal";
    public static final String KEY_PENDING_ENTRIES = "pending_entries";
    public static final String KEY_LAST_SYNC_DATE = "last_sync_date";
    
    public static final String ACTION_ADD_WATER = "com.kyawhla.hydromate.ACTION_ADD_WATER";
    public static final String EXTRA_AMOUNT = "extra_amount";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Check if it's a new day and reset if needed
        checkAndResetForNewDay(context);
        
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        String action = intent.getAction();
        Log.d(TAG, "onReceive called with action: " + action);
        
        if (ACTION_ADD_WATER.equals(action)) {
            int amount = intent.getIntExtra(EXTRA_AMOUNT, 0);
            Log.d(TAG, "Adding water: " + amount + "ml");
            addWater(context, amount);
            
            // Show toast for feedback
            Toast.makeText(context, "+" + amount + "ml added!", Toast.LENGTH_SHORT).show();
        }
    }

    private void checkAndResetForNewDay(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastSyncDate = prefs.getString(KEY_LAST_SYNC_DATE, "");
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        
        if (!today.equals(lastSyncDate)) {
            // New day - reset current intake but keep pending entries for sync
            prefs.edit()
                .putInt(KEY_CURRENT_INTAKE, 0)
                .putString(KEY_LAST_SYNC_DATE, today)
                .apply();
        }
    }

    private void addWater(Context context, int amount) {
        Log.d(TAG, "addWater called with amount: " + amount);
        
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Update current intake for widget display
        int currentIntake = prefs.getInt(KEY_CURRENT_INTAKE, 0);
        int newIntake = currentIntake + amount;
        
        Log.d(TAG, "Current intake: " + currentIntake + " -> New intake: " + newIntake);
        
        // Store pending entry for sync with app
        String pendingEntriesJson = prefs.getString(KEY_PENDING_ENTRIES, "[]");
        try {
            JSONArray pendingEntries = new JSONArray(pendingEntriesJson);
            JSONObject entry = new JSONObject();
            entry.put("amount", amount);
            entry.put("timestamp", System.currentTimeMillis());
            entry.put("date", new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()));
            entry.put("time", new SimpleDateFormat("HH:mm", Locale.US).format(new Date()));
            pendingEntries.put(entry);
            
            prefs.edit()
                .putInt(KEY_CURRENT_INTAKE, newIntake)
                .putString(KEY_PENDING_ENTRIES, pendingEntries.toString())
                .putString(KEY_LAST_SYNC_DATE, new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()))
                .apply();
                
            Log.d(TAG, "Saved pending entry. Total pending: " + pendingEntries.length());
        } catch (Exception e) {
            Log.e(TAG, "Error saving pending entry", e);
            // Fallback: just update intake
            prefs.edit().putInt(KEY_CURRENT_INTAKE, newIntake).apply();
        }
        
        refreshAllWidgets(context);
    }
    
    // Get pending entries as JSON string
    public static String getPendingEntries(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_PENDING_ENTRIES, "[]");
    }
    
    // Clear pending entries after sync
    public static void clearPendingEntries(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PENDING_ENTRIES, "[]").apply();
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
        // Use unique data URI to ensure different PendingIntents for each button
        intent.setData(android.net.Uri.parse("hydromate://widget/add/" + amount));
        
        return PendingIntent.getBroadcast(
            context, 
            amount, // unique request code
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);
    }
}