@AGENTS.md

## Local Android dev build (this Windows machine)

Expo Go **cannot** run this app: `modules/rise-alarm` is a local native module, so testing requires a
development build installed on the device (moto g85 5G, package `com.riseriot.app`).

### Why the build needs special setup

Windows' 260-character path limit breaks Gradle/CMake/ninja inside `react-native-reanimated`. Three
workarounds are needed together:

1. `node_modules` is a junction to `E:\r\node_modules`. The directory must literally be named
   `node_modules`, or Node/autolinking can't resolve packages.
2. Build through a `subst` mapping, never from a drive root — `expo-modules-autolinking` walks up
   looking for `package.json` and never checks the drive root, failing with
   `Couldn't find "package.json" up from path "R:\"`.

   ```powershell
   subst S: E:\Mobile_app\RiseRiot_app
   cd S:\RiseRiot\android
   ```

3. `android/app/build.gradle` carries a local-only workaround inside the `android { }` block:

   ```gradle
   externalNativeBuild {
       cmake {
           buildStagingDirectory = file("E:/c")
       }
   }
   ```

   This is the one deliberate exception to the "never edit generated native directories" rule above.
   `android/` is generated and gitignored, so `npx expo prebuild --clean` wipes it — re-add it if the
   build starts failing with `ninja: error: mkdir(...): No such file or directory`.

### Build

```powershell
./android/gradlew -p android assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk` (~95 MB, ~10 min cold). Confirm
`BUILD SUCCESSFUL` in the log — the exit code is unreliable when piping through `tail`.

### Install and run

The phone reaches the PC over its mobile hotspot (`192.168.137.1`) via wireless adb:

```powershell
adb connect 192.168.137.100:<port>   # port changes every time wireless debugging is toggled
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client          # do NOT pass --localhost
```

`--localhost` binds Metro to IPv6 `::1` only, which the dev client can't reach. In LAN mode it binds
`::` (dual-stack) and works through `adb reverse`. Then open the **RiseRiot** dev build and tap the
discovered server (`http://192.168.137.1:8081`).

### Notes

- Trust a TCP probe over the IP Android prints in developer options — that address can be stale
  (it showed `192.168.137.36` while the phone was actually `.100`). Ping/ARP can both fail while the
  hotspot still reports a connected client.
- Two Metro instances can each bind port 8081 (`::1` and `::`); kill the stale one before connecting.
- `package-lock.json` is out of sync, which breaks `eas build`; EAS also uploads ~355 MB because the
  `node_modules` junction is included, so it needs a `.easignore` before cloud builds work.

## Day-to-day workflow

Decide up front which loop you're in:

| You changed… | Rebuild the APK? |
| --- | --- |
| `.ts` / `.tsx` / styles / any JavaScript or TypeScript | No — Metro reloads it |
| `modules/rise-alarm/**/*.kt`, `app.json` (permissions, plugins, name), or added a native library | Yes |

If unsure: anything under `modules/`, or a new package with native code, needs a rebuild.

Note the split in the alarm feature specifically — challenge UI, sound-picker screen, history and
styling live in `src/**` (JS only), while the code that actually fires an alarm
(`AlarmScheduler.kt`, `AlarmReceiver.kt`, `AlarmNotifier.kt`, notification channels, permissions) is
native and will not change on the device until you rebuild.

### A. JS-only change — no rebuild

Setup once per session (after reconnecting the phone or rebooting the PC):

```powershell
cd E:\Mobile_app\RiseRiot_app\RiseRiot
adb connect 192.168.137.100:<port>
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client          # leave this window open; no --localhost
```

Open the RiseRiot dev build on the phone, tap the listed server, then just save files — Fast Refresh
pushes the change in a second or two. Press `r` in the Metro window (or shake the device → Reload) to
force a full reload. Reinstall nothing.

### B. Native change — rebuild

```powershell
S:\RiseRiot\android\gradlew --stop                                  # optional; frees memory
cd S:\RiseRiot\android
.\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
adb install -r E:\Mobile_app\RiseRiot_app\RiseRiot\android\app\build\outputs\apk\debug\app-debug.apk
cd E:\Mobile_app\RiseRiot_app\RiseRiot
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client
```

Build from `S:\RiseRiot\android` — never from `E:\...` or a drive root (see the autolinking note
above). `adb install -r` keeps existing alarms and settings. Warm rebuilds with only Kotlin changes
take 1–3 minutes; a cold build is ~10.

### Testing an alarm for real

Kill the app first, so the in-app JS timer isn't what rings:

```powershell
adb shell am force-stop com.riseriot.app
```

Set an alarm two minutes out, then leave the app or lock the phone. That exercises
`AlarmManager` → full-screen intent → alarm screen, which is the path Expo Go can never show.

### Running on the PC instead

```powershell
npx expo start --web
```

Layout checks only: `rise-alarm` resolves to `null` on web, so nothing will ring.

### Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Launcher shows, app never loads; "Cannot connect to Expo CLI" | Metro not running, or was started with `--localhost` (binds `::1` only) — restart without it |
| `adb: no devices/emulators found` | Reconnect with the current wireless-debugging port; confirm with a TCP probe |
| `Couldn't find "package.json" up from path` | Build was started from a drive root — use `S:\RiseRiot\android` |
| `ninja: error: mkdir(...): No such file or directory` | The `buildStagingDirectory` block is missing (usually after `expo prebuild --clean`) — re-add it |
| Port 8081 already in use | A stale Metro is still alive on `::1`; kill that process, keep the new one |

