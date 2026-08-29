import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Utensils, 
  Volume2, 
  VolumeX,
  Keyboard
} from 'lucide-react';
import jsQR from 'jsqr';

interface DineInQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableSelected: (tableNum: string) => void;
  currentTableNumber: string | null;
  selectedCampusName?: string;
  onShowToast?: (title: string, msg: string) => void;
}

export const DineInQrScannerModal: React.FC<DineInQrScannerModalProps> = ({
  isOpen,
  onClose,
  onTableSelected,
  currentTableNumber,
  selectedCampusName = "Campus Canteen",
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play a pleasant Web Audio synth beep on success
  const playSuccessBeep = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6

      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio Context playback failed:", e);
    }
  };

  // Helper to parse table number from string (URL, JSON, or plain text)
  const extractTableNumber = (rawText: string): string | null => {
    if (!rawText) return null;
    const clean = rawText.trim();

    // 1. Check if it's a URL like https://.../?mode=dinein&table=5 or ?table=T-12
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.includes('?')) {
        const urlObj = new URL(clean, window.location.origin);
        const tbl = urlObj.searchParams.get('table') || urlObj.searchParams.get('t') || urlObj.searchParams.get('tableNumber');
        if (tbl) return tbl.trim();
      }
    } catch (e) {
      // not a strict URL
    }

    // 2. Check JSON
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.table) return String(parsed.table).trim();
        if (parsed.tableNumber) return String(parsed.tableNumber).trim();
      } catch (e) {
        // ignore
      }
    }

    // 3. Regex match for "Table 5", "Table-12", "T-04"
    const match = clean.match(/(?:table|tbl|t)[_:\s-]*([a-z0-9-]+)/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }

    // 4. If plain digits or short string like "5" or "12B"
    if (/^[a-z0-9-]+$/i.test(clean) && clean.length <= 10) {
      return clean.toUpperCase();
    }

    return clean;
  };

  const handleScanSuccess = (rawCode: string) => {
    const tableNum = extractTableNumber(rawCode);
    if (!tableNum) {
      setErrorMessage(`Unrecognized QR Code format: "${rawCode.slice(0, 30)}...". Please scan a Campus Canteen Table QR.`);
      return;
    }

    setScannedResult(tableNum);
    playSuccessBeep();
    stopCamera();

    if (onShowToast) {
      onShowToast("Table QR Scanned!", `Paired successfully with Canteen Table #${tableNum}`);
    }

    setTimeout(() => {
      onTableSelected(tableNum);
      onClose();
      setScannedResult(null);
    }, 1200);
  };

  // Camera initialization and continuous scanning loop
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraPermissionStatus('prompt');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionStatus('unsupported');
      setErrorMessage("Camera access is not supported by your browser environment. You can use the Image Upload or Quick Table Selector tabs.");
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      setCameraPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraPermissionStatus('denied');
      setErrorMessage(err?.message || "Camera permission was denied or camera is in use by another app.");
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities ? (track as any).getCapabilities() : {};
      if (capabilities.torch) {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } else {
        if (onShowToast) onShowToast("Flashlight", "Torch function is not supported on this device camera.");
      }
    } catch (e) {
      console.warn("Torch failed:", e);
    }
  };

  const tickScan = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code && code.data) {
        handleScanSuccess(code.data);
        return; // stop loop
      }
    }

    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  // Process uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScanSuccess(code.data);
        } else {
          setErrorMessage("Could not detect a valid QR code in the uploaded image. Please try a clearer picture.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manage camera lifecycle based on modal visibility and active tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#120709] border border-[#D4AF37]/30 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#3C2216]/60 flex items-center justify-between bg-gradient-to-r from-[#1B0A0D] to-[#120709]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#E23744]/20 border border-[#D4AF37]/30 text-[#D4AF37]">
                <QrCode className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#FEFAF6] flex items-center gap-2 font-display">
                  Scan Table QR Code
                  <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-bold border border-[#D4AF37]/30">
                    DINE-IN
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  {selectedCampusName} • Instant Table Service
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title={isMuted ? "Unmute scanner sound" : "Mute scanner sound"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Nav Tabs */}
          <div className="flex items-center p-2 bg-[#0C0405] border-b border-[#3C2216]/50 gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('camera'); setErrorMessage(null); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#E23744] text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#E23744] text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('manual'); setErrorMessage(null); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#E23744] text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Quick Table
            </button>
          </div>

          {/* Main Body Content */}
          <div className="p-5 flex-1 overflow-y-auto">
            {/* Scanned Success Banner Overlay */}
            {scannedResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center gap-4 my-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-emerald-300 font-display">
                    Table #{scannedResult} Paired!
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Your canteen table is set. Returning to your Dine-In menu...
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* TAB 1: LIVE CAMERA */}
                {activeTab === 'camera' && (
                  <div className="space-y-4">
                    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-[#D4AF37]/30 flex items-center justify-center shadow-inner group">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                      />

                      {/* Animated Scanner Laser Overlay Frame */}
                      {cameraPermissionStatus === 'granted' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                          {/* Targeting Box */}
                          <div className="relative w-56 h-56 border-2 border-[#D4AF37]/60 rounded-3xl shadow-[0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center overflow-hidden">
                            {/* Four Corner Accents */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl" />

                            {/* Animated Scanning Laser Line */}
                            <motion.div
                              animate={{ y: [-100, 100, -100] }}
                              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                              className="w-full h-1 bg-gradient-to-r from-transparent via-[#E23744] to-transparent shadow-[0_0_15px_#E23744]"
                            />
                          </div>

                          <p className="text-[11px] font-extrabold text-[#FEFAF6] bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm mt-4 tracking-wider">
                            Align Canteen Table QR inside frame
                          </p>
                        </div>
                      )}

                      {/* Camera Controls Overlay */}
                      {cameraPermissionStatus === 'granted' && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2.5 rounded-full border backdrop-blur-md transition-all cursor-pointer ${
                              torchOn
                                ? 'bg-amber-400 text-black border-amber-300 shadow-lg'
                                : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                            }`}
                            title="Toggle Flashlight"
                          >
                            <Zap className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                            className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                            title="Switch Camera"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Permission Denied / Prompt State */}
                      {cameraPermissionStatus === 'denied' && (
                        <div className="p-6 text-center space-y-3">
                          <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 inline-block">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <h5 className="font-extrabold text-sm text-rose-300">
                            Camera Access Required
                          </h5>
                          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                            Please allow camera permissions in your browser or iframe settings to scan table QR codes.
                          </p>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 bg-[#E23744] text-white text-xs font-extrabold rounded-xl shadow-md hover:bg-[#d01c2b] transition-all cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {cameraPermissionStatus === 'unsupported' && (
                        <div className="p-6 text-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                          <p className="text-xs text-zinc-300">
                            Webcam feed is not accessible in this view. Please use the Quick Table or Upload tabs below.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: UPLOAD IMAGE */}
                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video border-2 border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl bg-[#0C0405] hover:bg-[#180A0D] p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                    >
                      <div className="p-3.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-extrabold text-zinc-200">
                          Click or drag a photo of a Canteen QR Code
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          PNG, JPG, WEBP formats supported
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: QUICK TABLE / DEMO SELECTOR */}
                {activeTab === 'manual' && (
                  <div className="space-y-5">
                    {/* Manual Input Form */}
                    <div className="bg-[#0C0405] p-4 rounded-2xl border border-[#3C2216]/60">
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">
                        Enter Table Number directly:
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">
                            Table #
                          </span>
                          <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="e.g. 5, 12B, T-04"
                            className="w-full bg-[#180A0D] border border-[#3C2216] rounded-xl pl-20 pr-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!manualInput.trim()) return;
                            handleScanSuccess(manualInput.trim());
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-md cursor-pointer hover:brightness-110"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>

                    {/* Quick Demo Table Grid */}
                    <div>
                      <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span>Select Canteen Table:</span>
                        <span className="text-[10px] text-[#D4AF37] normal-case font-normal flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Instant Pair
                        </span>
                      </p>

                      <div className="grid grid-cols-4 gap-2.5">
                        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((num) => {
                          const isCurrent = currentTableNumber === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleScanSuccess(`TABLE-${num}`)}
                              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer font-display ${
                                isCurrent
                                  ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black border-amber-300 shadow-md ring-2 ring-[#D4AF37]/50'
                                  : 'bg-[#180A0D] hover:bg-[#251014] text-white font-extrabold border-[#3C2216] hover:border-[#D4AF37]/50'
                              }`}
                            >
                              <div className="text-[9px] opacity-70 uppercase tracking-widest font-sans">
                                Table
                              </div>
                              <div className="text-base font-black font-mono">
                                {num}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Alert Box */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-2 text-rose-300 text-xs mt-4"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-[#0C0405] border-t border-[#3C2216]/60 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-[#D4AF37]">
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In Kitchen Online</span>
            </div>
            {currentTableNumber ? (
              <span className="text-emerald-400 font-bold">
                Active Table: #{currentTableNumber}
              </span>
            ) : (
              <span className="text-zinc-500">
                No table paired yet
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
