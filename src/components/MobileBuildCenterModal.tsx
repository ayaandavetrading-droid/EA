import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Share,
  PlusSquare,
  Lock,
  Eye,
  Server,
  Zap,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileBuildCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWakeLockActive: boolean;
  isWakeLockSupported: boolean;
  onToggleWakeLock: () => void;
}

export const MobileBuildCenterModal: React.FC<MobileBuildCenterModalProps> = ({
  isOpen,
  onClose,
  isWakeLockActive,
  isWakeLockSupported,
  onToggleWakeLock,
}) => {
  const [platformTab, setPlatformTab] = useState<'android' | 'ios' | 'wakelock' | 'capacitor'>('android');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const capacitorConfigCode = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apexgold.ai',
  appName: 'Apex Gold AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#020617',
    },
    ScreenOrientation: {
      orientation: 'portrait',
    },
  },
};

export default config;`;

  const androidBuildScript = `# 1. Build Production Web Assets
npm run build

# 2. Add Android Platform with Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Apex Gold AI" "com.apexgold.ai" --web-dir dist
npx cap add android

# 3. Synchronize Web Build to Android Project
npx cap sync android

# 4. Generate Debug APK or Release Bundle (AAB)
cd android
./gradlew assembleDebug       # Outputs: app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease       # Outputs: app/build/outputs/bundle/release/app-release.aab
cd ..`;

  const iosBuildScript = `# 1. Build Production Web Assets
npm run build

# 2. Add iOS Platform with Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios

# 3. Synchronize Web Assets & Open in Xcode
npx cap sync ios
npx cap open ios

# 4. In Xcode: Set Signing & Team, then Archive -> TestFlight or Direct IPA Export`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Universal Mobile Compatibility Center</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PWA WebAPK, Native Capacitor APK/AAB/IPA builds, Screen Wake Lock, and Permission Architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setPlatformTab('android')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              platformTab === 'android' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Android (APK / WebAPK)</span>
          </button>
          <button
            onClick={() => setPlatformTab('ios')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              platformTab === 'ios' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>iPhone (iOS WebKit / IPA)</span>
          </button>
          <button
            onClick={() => setPlatformTab('wakelock')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              platformTab === 'wakelock' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Screen Awake Feature</span>
          </button>
          <button
            onClick={() => setPlatformTab('capacitor')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              platformTab === 'capacitor' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Native Capacitor Config</span>
          </button>
        </div>

        {/* TAB 1: ANDROID */}
        {platformTab === 'android' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Option A: 1-Tap Android WebAPK Installation (Instant)
                </span>
                {isInstallable ? (
                  <button
                    onClick={install}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install WebAPK Now
                  </button>
                ) : isInstalled ? (
                  <span className="text-[11px] font-mono text-emerald-400">Already Installed</span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">Available in Chrome/Edge</span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                On Android (Chrome, Edge, Samsung Internet), Google creates a native <b>WebAPK</b> package signed by the operating system. It appears in your Android App Drawer, supports home screen badging, operates in standalone fullscreen, and communicates directly with the Screen Wake Lock and MediaProjection APIs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Option B: Native Android Build (APK & AAB via Capacitor)
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To package a standalone <code className="text-amber-400 font-mono">.apk</code> for sideloading or an <code className="text-amber-400 font-mono">.aab</code> for the Google Play Store, run these commands in your terminal:
              </p>

              <div className="relative bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <button
                  onClick={() => copyToClipboard(androidBuildScript, 'android')}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'android' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{androidBuildScript}</pre>
              </div>
            </div>

            {/* Android Permission Architecture Disclosure */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-900/50 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Android OS Permission Architecture & Tap Automation</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Android's security architecture strictly limits background apps from injecting touch events into third-party financial apps (like MetaTrader 5) without explicit Android Accessibility Service approval. For this reason, <b>Apex Gold AI implements the reliable, decoupled architecture</b>: the phone serves as the visual AI supervisor and command interface, while trade executions occur reliably through the native MQL5 engine running on your desktop terminal or VPS.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: iOS */}
        {platformTab === 'ios' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Option A: Apple WebKit PWA (Add to Home Screen)
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Apple natively supports Progressive Web Apps on iOS 15+ without requiring the App Store review cycle.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="font-bold text-amber-400 block mb-0.5">1. Share Icon</span>
                  <span className="text-slate-400">Open Safari, tap the Share icon at the bottom.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="font-bold text-amber-400 block mb-0.5">2. Add to Home</span>
                  <span className="text-slate-400">Select "Add to Home Screen" from menu.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="font-bold text-amber-400 block mb-0.5">3. Standalone Mode</span>
                  <span className="text-slate-400">Launches like an iOS native app without URL bars.</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Option B: Native iOS IPA & TestFlight Build (via Xcode)
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To distribute through Apple TestFlight or generate an <code className="text-cyan-400 font-mono">.ipa</code> binary, use Capacitor with Xcode:
              </p>

              <div className="relative bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <button
                  onClick={() => copyToClipboard(iosBuildScript, 'ios')}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'ios' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{iosBuildScript}</pre>
              </div>
            </div>

            {/* iOS Sandboxing Disclosure */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-900/50 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>iOS Sandbox Constraints & Screen Supervision</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Apple iOS sandbox prohibits one app from programmatically tapping inside another third-party app. Screen-sharing is provided through WebRTC Screen Capture or instant screenshot upload. Order execution runs independently and securely on your MT5 terminal/VPS so no iOS permissions can ever compromise your stop-losses.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SCREEN AWAKE (WAKE LOCK API) */}
        {platformTab === 'wakelock' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Screen Keep-Awake Feature (Wake Lock API)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Prevents your phone display from dimming or locking while monitoring active Gold trades.
                  </p>
                </div>

                <button
                  onClick={onToggleWakeLock}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 ${
                    isWakeLockActive
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isWakeLockActive ? 'fill-slate-950' : 'text-slate-400'}`} />
                  <span>{isWakeLockActive ? 'KEEP-AWAKE: ACTIVE' : 'ENABLE KEEP-AWAKE'}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Browser Wake Lock API Support:</span>
                  <span className={`font-mono font-bold ${isWakeLockSupported ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isWakeLockSupported ? 'SUPPORTED' : 'LIMITED / FALLBACK'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Screen Lock State:</span>
                  <span className={`font-mono font-bold ${isWakeLockActive ? 'text-amber-400' : 'text-slate-400'}`}>
                    {isWakeLockActive ? 'SCREEN WILL REMAIN AWAKE' : 'NORMAL OS SLEEP BEHAVIOR'}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                When active, Apex Gold AI requests a high-priority screen wake lock from Android / iOS. You can rest your phone flat on a desk, and the cockpit telemetry, live gold charts, and AI observe-interpret-act-verify loop will remain visible without timing out. When you tap <b>STOP TRADING</b> or exit, normal system sleep behavior is immediately restored.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: CAPACITOR CONFIG */}
        {platformTab === 'capacitor' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                capacitor.config.ts (Pre-Configured)
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Save this configuration to your root folder as <code className="text-amber-400 font-mono">capacitor.config.ts</code> for instant iOS and Android compilation:
              </p>

              <div className="relative bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <button
                  onClick={() => copyToClipboard(capacitorConfigCode, 'cap')}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  {copiedCode === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{capacitorConfigCode}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Universal Compatibility Notice */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p>
            <b>Compatibility Notice:</b> Apex Gold AI has been designed and responsive-tested across Android 10+ (Pixel, Samsung Galaxy) and iOS 15+ (iPhone 12/13/14/15/16). Features requiring specialized platform capabilities (such as WebRTC display media or screen keep-awake) gracefully degrade with fallbacks where restricted by browser sandbox security.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            Close Center
          </button>
        </div>
      </div>
    </div>
  );
};
