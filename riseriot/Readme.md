All the pieces are still in place (S: → E:\Mobile_app\RiseRiot_app, phone connected, junction intact). Here's the workflow.

---

First, decide which kind of change you made

┌─────────────────────────────────────────────────────────────────────────────────────────────┬───────────────────────┐
│                                        You changed…                                         │   Rebuild the APK?    │
├─────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────┤
│ .ts / .tsx / styles / any JS                                                                │ No — Metro reloads it │
├─────────────────────────────────────────────────────────────────────────────────────────────┼───────────────────────┤
│ modules/rise-alarm/**/*.kt, app.json (permissions, plugin, name), or added a native library │ Yes                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┴───────────────────────┘

If you're not sure: if you touched anything under modules/ or added a package with native code, rebuild.

---

A. JS-only change — the everyday loop

One-time setup per session (do this whenever you've reconnected the phone or rebooted the PC):

cd E:\Mobile_app\RiseRiot_app\RiseRiot
adb connect 192.168.137.100:36399      # new port each time wireless debugging is toggled
adb reverse tcp:8081 tcp:8081

Start the dev server (leave this window open — it's what feeds the app its code):

npx expo start --dev-client

Do not add --localhost; it makes Metro listen on IPv6 only and the phone can't reach it.

Open the app on the phone → RiseRiot (Development Build). If the launcher appears, tap the server it lists (http://192.168.137.1:8081) or type localhost:8081 and Connect.

Now edit and save. The phone updates within a second or two automatically (Fast Refresh). No APK, no reinstall. If it ever stops updating, type r in the Metro window to force a full reload, or shake the phone → Reload.

▎ Metro dies if the PC runs low on memory — that's what happened earlier. If the app says "Cannot connect to Expo CLI", just re-run npx expo start --dev-client.

---

B. Native change — rebuild and reinstall

1. Free memory first (optional but it makes the build faster and stops Metro getting killed):

S:\RiseRiot\android\gradlew --stop

2. Build from the S: drive — this is the part that matters. Never build from E:\... or from a drive root:

cd S:\RiseRiot\android
.\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain

Wait for BUILD SUCCESSFUL (about 10 min cold, 1–3 min when only Kotlin changed). If you see subst errors, the mapping is gone — run subst S: E:\Mobile_app\RiseRiot_app first.

3. Install the new APK:

adb install -r E:\Mobile_app\RiseRiot_app\RiseRiot\android\app\build\outputs\apk\debug\app-debug.apk

-r keeps your alarms and settings. It takes ~30 s for the 95 MB file.

4. Start Metro and open the app (same as section A):

cd E:\Mobile_app\RiseRiot_app\RiseRiot
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client

---

Which one do I need if the alarm code changed?

The alarm behaviour is split:

- Challenge UI, sound selection screen, history, styling → src/** → JS only, section A.
- How the alarm actually fires (AlarmScheduler.kt, AlarmReceiver.kt, AlarmNotifier.kt, notification channels, permissions) → native, section B. Without rebuilding, your phone keeps running the old Kotlin code no matter what Metro sends.

---

Testing an alarm properly

adb shell am force-stop com.riseriot.app      # kill the app first

Then set an alarm 2 minutes out in the app, and close it (or lock the phone). This tests the real path: AlarmManager → full-screen intent → alarm screen. Inside the running app it's the JS timer, which is the easy case — Expo Go could have shown you that.

---

Running it on the PC instead (no phone)

npx expo start --web

Useful for quick layout checks only. rise-alarm returns null on web, so no alarm will ring there — scheduling, ringing, and the sound are phone-only.

---

If something breaks

┌───────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐
│                Symptom                │                                        Fix                                         │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ App stuck on launcher / "Cannot       │ Metro isn't running or is ::1-only → npx expo start --dev-client (no --localhost)  │
│ connect to Expo CLI"                  │                                                                                    │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ adb: no devices                       │ adb connect 192.168.137.100:<current port from Developer options> — verify the     │
│                                       │ port with a TCP test, not the IP shown                                             │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ Couldn't find "package.json" up from  │ Build from S:\RiseRiot\android, not a drive root                                   │
│ path                                  │                                                                                    │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ ninja: error: mkdir(...) after expo   │ Re-add the buildStagingDirectory = file("E:/c") block to android/app/build.gradle  │
│ prebuild --clean                      │                                                                                    │
├───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ Port 8081 already in use              │ An old Metro is alive on ::1 → kill it, keep the new one                           │
└───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘

The full build recipe is also in CLAUDE.md now, so a future session doesn't have to rediscover it. Want me to add this day-to-day loop (sections A and B) there too?