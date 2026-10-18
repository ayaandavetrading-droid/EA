import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, Check, X, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenMobileCenter?: () => void;
  variant?: 'header' | 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenMobileCenter,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  // If already running in standalone mode, display a verified installed pill
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[11px] font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Installed PWA App</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Chromium / Android Direct 1-Tap WebAPK Install */}
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
            title="Install Apex Gold AI on Android or Desktop"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* iOS Safari 'Add to Home Screen' Flow */}
        {isIOS && !isInstallable && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold transition-all"
            title="Install on iPhone / iPad"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Install on iOS</span>
          </button>
        )}

        {/* Universal Mobile Build Center Button */}
        {onOpenMobileCenter && (
          <button
            onClick={onOpenMobileCenter}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 text-xs font-medium transition-all"
            title="Android APK / iOS Build & Compatibility Center"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Mobile Build & APK</span>
          </button>
        )}
      </div>

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Add to Home Screen (Apple WebKit)</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Step 1: Tap Share</span>
                  <span className="text-[11px] text-slate-400">Tap the Share button in Safari's bottom toolbar.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Step 2: Add to Home Screen</span>
                  <span className="text-[11px] text-slate-400">Scroll down the menu and tap <b>"Add to Home Screen"</b>.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Step 3: Launch Fullscreen</span>
                  <span className="text-[11px] text-slate-400">Open Apex Gold AI from your home screen with fullscreen standalone display and WakeLock.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
