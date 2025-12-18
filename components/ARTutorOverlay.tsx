import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Camera, BrainCircuit, Activity, MousePointer2 } from 'lucide-react';

interface ARTutorOverlayProps {
  onClose: () => void;
  projectTitle: string;
}

const ARTutorOverlay: React.FC<ARTutorOverlayProps> = ({ onClose, projectTitle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<{label: string, x: number, y: number}[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [instruction, setInstruction] = useState("AI 正在分析你的操作环境...");

  // Mock AR Loop
  useEffect(() => {
    // Start Camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermissionGranted(true);
        }
      } catch (e) {
        console.error("Camera denied", e);
        setInstruction("无法访问摄像头，请检查权限。");
      }
    };
    startCamera();

    // Mock Object Detection Interval
    const interval = setInterval(() => {
        // Randomly simulate detecting things relevant to maker projects
        const mockItems = ['Arduino Uno', '面包板', '杜邦线', 'ESP32', '万用表'];
        const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)];
        
        // Random coordinates
        const x = 20 + Math.random() * 60;
        const y = 30 + Math.random() * 40;

        setDetectedObjects([{ label: randomItem, x, y }]);
        
        // Randomly update instruction
        if (Math.random() > 0.7) {
            const instructions = [
                `我看到你拿起了 ${randomItem}。`,
                "请将红线连接到 5V 引脚。",
                "注意！这个电容极性接反了。",
                "很好，现在的线路连接正确。"
            ];
            setInstruction(instructions[Math.floor(Math.random() * instructions.length)]);
            setAiSpeaking(true);
            setTimeout(() => setAiSpeaking(false), 2000);
        }

    }, 3000);

    return () => {
      clearInterval(interval);
      // Stop stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
       {/* Camera View */}
       <div className="flex-1 relative overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Mock AR Bounding Boxes */}
          {permissionGranted && detectedObjects.map((obj, i) => (
             <div 
                key={i}
                className="absolute border-2 border-green-500 bg-green-500/10 rounded-lg flex items-start justify-center transition-all duration-500"
                style={{ 
                    left: `${obj.x}%`, 
                    top: `${obj.y}%`, 
                    width: '120px', 
                    height: '120px' 
                }}
             >
                <div className="bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-b-sm">
                    {obj.label} (98%)
                </div>
                {/* Connecting Line to Center */}
                <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-green-500/50 -rotate-45 origin-left scale-0 animate-grow" />
             </div>
          ))}

          {/* AR Pointer Arrow (Mock Instruction) */}
          {aiSpeaking && (
              <div className="absolute top-[40%] left-[50%] animate-bounce">
                  <MousePointer2 size={48} className="text-purple-500 fill-purple-500/50 drop-shadow-2xl -rotate-12" />
                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs absolute top-12 left-6 whitespace-nowrap">
                      接这里
                  </span>
              </div>
          )}

          {/* Overlay UI */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
             <div className="flex items-center gap-2">
                 <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold border border-red-500/50 animate-pulse">
                     <span className="w-2 h-2 bg-red-500 rounded-full" />
                     LIVE
                 </div>
                 <h2 className="text-sm font-bold text-white shadow-sm">{projectTitle}</h2>
             </div>
             <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10">
                 <X size={20} />
             </button>
          </div>
       </div>

       {/* HUD Footer */}
       <div className="h-48 bg-gray-900 border-t border-gray-800 p-4 pb-safe-bottom relative">
          <div className="flex items-center gap-4 h-full">
             {/* AI Avatar / Viz */}
             <div className="w-20 h-20 rounded-full bg-black border-2 border-purple-500 flex items-center justify-center relative overflow-hidden shrink-0">
                 <BrainCircuit size={32} className="text-purple-400 relative z-10" />
                 {/* Voice Wave Animation */}
                 {aiSpeaking && (
                     <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
                         <div className="w-1 h-4 bg-purple-500 animate-[wave_0.5s_ease-in-out_infinite]" />
                         <div className="w-1 h-8 bg-purple-500 animate-[wave_0.5s_ease-in-out_infinite_0.1s]" />
                         <div className="w-1 h-6 bg-purple-500 animate-[wave_0.5s_ease-in-out_infinite_0.2s]" />
                     </div>
                 )}
             </div>

             {/* Text Instruction */}
             <div className="flex-1">
                 <div className="text-xs text-purple-400 font-bold mb-1 flex items-center gap-1">
                     <Activity size={12} />
                     AI 视觉导师
                 </div>
                 <div className="text-lg font-medium text-white leading-tight">
                     "{instruction}"
                 </div>
             </div>

             {/* Mic Toggle */}
             <button className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/50 active:scale-95 transition-transform">
                 <Mic size={24} />
             </button>
          </div>
       </div>
    </div>
  );
};

export default ARTutorOverlay;