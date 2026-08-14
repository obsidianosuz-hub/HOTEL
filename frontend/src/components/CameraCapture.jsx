import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCcw } from 'lucide-react';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Kameraga ulanib bo'lmadi. Qurilmangizda kamera yo'q yoki ruxsat berilmagan.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg p-4 relative flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 text-white">
          <h3 className="font-semibold text-lg">Kameradan rasmga olish</h3>
          <button onClick={() => { stopCamera(); onCancel(); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/20">
          {error ? (
            <div className="p-6 text-center text-red-400 bg-red-900/20 rounded-xl">
              <p>{error}</p>
              <button onClick={startCamera} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg flex items-center gap-2 mx-auto transition-colors">
                <RefreshCcw className="w-4 h-4" /> Qayta urinish
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="mt-6 flex justify-center pb-8 md:pb-0">
          {!error && (
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white/50 flex items-center justify-center hover:border-white transition-all bg-white/20 hover:bg-white/30"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
