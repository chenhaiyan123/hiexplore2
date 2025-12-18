
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lightbulb, Image as ImageIcon, Send, Bot, Rocket, Sparkles, RefreshCw, Mic, MicOff, Loader2, Calendar, Clock, PlayCircle, Plus, CheckCircle2, AlertCircle, Terminal, Code2, GitGraph, ChevronRight, Hash, Play, Pause, FolderOpen, Video, Box, Cuboid, Eye, Presentation, ExternalLink, X, FlaskConical, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ResearchMission, ResearchLog } from '../types';
import { streamIdea, startResearchMission, generateDailyResearchUpdate, generateSimulationImage } from '../services/gemini';
import TypingEffect from './TypingEffect';
import VoxelScene from './VoxelScene';

type IdeaMode = 'assist' | 'simulate' | 'delegate';

interface IdeaLabProps {
    onOpenChess?: () => void;
}

// Reuse the styling from ProjectDetail for consistency
const MarkdownComponents = () => ({
    h1: ({children}: any) => <h1 className="text-lg font-bold text-blue-300 mt-4 mb-2 border-b border-gray-700 pb-1">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-base font-bold text-blue-200 mt-3 mb-2">{children}</h2>,
    h3: ({children}: any) => <h3 className="text-sm font-bold text-gray-200 mt-2 mb-1">{children}</h3>,
    ul: ({children}: any) => <ul className="list-disc pl-4 space-y-1 text-gray-300">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal pl-4 space-y-1 text-gray-300">{children}</ol>,
    blockquote: ({children}: any) => (
        <div className="border-l-4 border-gray-600 pl-4 py-2 my-3 bg-gray-900/50 rounded-r-lg text-xs text-gray-400 italic">
            {children}
        </div>
    ),
    strong: ({children}: any) => <strong className="font-bold text-white">{children}</strong>,
    code: ({className, children, ...props}: any) => {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
            <div className="my-2 rounded-md overflow-hidden border border-gray-700 bg-[#0d1117]">
                <div className="px-3 py-1 bg-gray-800/50 text-xs text-gray-400 border-b border-gray-700 font-mono flex items-center gap-2">
                    <Terminal size={12} /> {match[1]}
                </div>
                <pre className="p-3 overflow-x-auto text-xs text-gray-300 font-mono">
                   <code className={className} {...props}>{children}</code>
                </pre>
            </div>
        ) : (
            <code className="bg-gray-800 px-1 py-0.5 rounded text-amber-200 font-mono text-xs" {...props}>{children}</code>
        )
    }
});

// Image Component with Fallback
const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [error, setError] = useState(false);
    if (error || !src) return <div className={`${className} bg-gray-800 flex items-center justify-center`}><ImageIcon className="text-gray-600" /></div>;
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};

// Phase Colors for UI
const PHASE_STYLES: Record<string, string> = {
    'Proposal': 'border-blue-500 text-blue-400 bg-blue-500/10',
    'Literature': 'border-purple-500 text-purple-400 bg-purple-500/10',
    'Prototyping': 'border-amber-500 text-amber-400 bg-amber-500/10',
    'Simulation': 'border-green-500 text-green-400 bg-green-500/10',
    'Refinement': 'border-pink-500 text-pink-400 bg-pink-500/10',
    'Completed': 'border-gray-500 text-gray-400 bg-gray-500/10'
};

const IdeaLab: React.FC<IdeaLabProps> = ({ onOpenChess }) => {
  const [mode, setMode] = useState<IdeaMode>('assist');
  
  // --- CHAT STATE (Assist & Simulate) ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
        const stored = localStorage.getItem('idealab_history');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [{
      id: 'init',
      role: 'model',
      text: '你好！我是 **AI 实践实验室**。请选择一种模式来开始：\n\n1. **AI 辅助**：我和你一起规划路径、陪伴探究。\n2. **数字模拟**：在数字孪生世界深度模拟推演。\n3. **AI 代理**：你给课题，我来做研究生，每日汇报进度。',
      timestamp: Date.now(),
      suggestions: ["我要做个自动喂食器", "设计一个隐藏门", "研究一下量子计算"]
    }];
  });

  // --- RESEARCH MISSION STATE (Delegate) ---
  const [activeMission, setActiveMission] = useState<ResearchMission | null>(() => {
      try {
          const stored = localStorage.getItem('active_research_mission');
          return stored ? JSON.parse(stored) : null;
      } catch (e) { return null; }
  });
  
  // Mission UI State
  const [showAddResource, setShowAddResource] = useState(false); // Modal state
  const [isAutoRun, setIsAutoRun] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<string>(''); // For loading indicator

  const endRef = useRef<HTMLDivElement>(null);
  const [typingCompleteIds, setTypingCompleteIds] = useState<Set<string>>(new Set());

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Streaming State for Research Updates
  const [streamingLog, setStreamingLog] = useState<{content: string, day: number} | null>(null);

  // Scroll logic
  useEffect(() => { 
      if (!streamingLog) {
          endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
      }
  }, [messages, loading, activeMission]);

  // Persistence
  useEffect(() => {
      const ids = new Set<string>();
      messages.forEach(m => ids.add(m.id));
      setTypingCompleteIds(ids);
  }, []);

  useEffect(() => { localStorage.setItem('idealab_history', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { 
      if (activeMission) localStorage.setItem('active_research_mission', JSON.stringify(activeMission));
      else localStorage.removeItem('active_research_mission');
  }, [activeMission]);

  // Thinking Phase Cycler
  useEffect(() => {
      let interval: any;
      if (loading) {
          const phases = ['正在分析需求...', '正在搜索知识库...', '正在构建逻辑...', '正在生成响应...'];
          let i = 0;
          setThinkingPhase(phases[0]);
          interval = setInterval(() => {
              i = (i + 1) % phases.length;
              setThinkingPhase(phases[i]);
          }, 2000);
      } else {
          setThinkingPhase('');
      }
      return () => clearInterval(interval);
  }, [loading]);

  // Auto Run Logic
  useEffect(() => {
      let timeout: any;
      if (isAutoRun && activeMission && !loading && activeMission.progress < 100) {
          timeout = setTimeout(() => {
              handleSimulateNextDay();
          }, 3000); // 3 seconds delay between days
      } else if (activeMission?.progress === 100) {
          setIsAutoRun(false);
      }
      return () => clearTimeout(timeout);
  }, [isAutoRun, activeMission, loading]);

  // Voice Setup (Simplified)
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'zh-CN';
            recognitionRef.current.onresult = (event: any) => setInput(Array.from(event.results).map((r: any) => r[0].transcript).join(''));
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("您的浏览器不支持语音识别");
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { recognitionRef.current?.start(); setIsListening(true); setInput(''); }
  };

  const handleClearHistory = () => {
      if (confirm("确定要清空实验室记录吗？")) {
          const initMsg: ChatMessage = { id: 'init_' + Date.now(), role: 'model', text: '记录已重置。', timestamp: Date.now(), suggestions: ["开始一个新项目"] };
          setMessages([initMsg]);
          setTypingCompleteIds(new Set([initMsg.id]));
          localStorage.removeItem('idealab_history');
          if (mode === 'delegate') {
              setActiveMission(null);
              localStorage.removeItem('active_research_mission');
          }
      }
  };

  // --- CHAT HANDLER (Assist & Simulate) ---
  const handleSendChat = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;
    
    // Guard clause: Chat handler should not run in delegate mode
    if (mode === 'delegate') return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setTypingCompleteIds(prev => new Set(prev).add(userMsg.id));
    setInput('');
    setLoading(true);

    // Initial AI Placeholder
    const aiMsgId = (Date.now()+1).toString();
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      text: '', // Start empty for streaming
      timestamp: Date.now(),
      isSimulated: mode !== 'assist',
    };
    setMessages(prev => [...prev, initialAiMsg]);

    // Stream Response
    let fullText = "";
    try {
        await streamIdea(textToSend, messages, mode, (chunk) => {
            fullText += chunk;
            setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { ...m, text: fullText } : m
            ));
        });
    } catch (e) {
        fullText += "\n[Connection Error] AI响应中断。";
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
    }

    let aiText = fullText;
    let suggestions: string[] = [];
    let imagePrompt: string | null = null;
    let generatedImageBase64: string | null = null;
    let voxelData: any = null;

    // Parse Suggestions
    if (fullText.includes('___SUGGESTIONS___')) {
        const parts = fullText.split('___SUGGESTIONS___');
        aiText = parts[0].trim();
        try { suggestions = JSON.parse(parts[1].trim()); } catch (e) {}
    }

    // Parse Image Prompt
    if (aiText.includes('___IMAGE_PROMPT___')) {
        const parts = aiText.split('___IMAGE_PROMPT___');
        aiText = parts[0].trim();
        imagePrompt = parts[1].trim();
    }

    // Parse Voxel Blueprint
    if (aiText.includes('___VOXEL_BLUEPRINT___')) {
        const parts = aiText.split('___VOXEL_BLUEPRINT___');
        aiText = parts[0].trim();
        try {
            const parsed = JSON.parse(parts[1].trim());
            if (parsed && parsed.blocks) {
                voxelData = parsed;
            }
        } catch (e) {
            console.error("Failed to parse voxel blueprint", e);
        }
    }

    // Update with Clean Text
    setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { 
            ...m, 
            text: aiText,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
            voxelData: voxelData
        } : m
    ));

    // Step 2: If there's an image prompt, generate it (kept for compatibility)
    if (imagePrompt) {
        setThinkingPhase("正在绘制概念图...");
        try {
            // Keep loading true while generating image
            const base64Img = await generateSimulationImage(imagePrompt);
            if (base64Img) {
                generatedImageBase64 = base64Img;
                setMessages(prev => prev.map(m => 
                    m.id === aiMsgId ? { ...m, imageUrl: generatedImageBase64! } : m
                ));
            }
        } catch (e) {
            console.error("Image generation failed", e);
        }
    }

    setLoading(false);
  };

  // --- AGENT HANDLER (Delegate) ---
  const handleStartMission = async () => {
      if (!input.trim() || loading) return;
      setLoading(true);
      const missionTopic = input;
      setInput('');
      
      const firstLog = await startResearchMission(missionTopic);
      
      const newMission: ResearchMission = {
          id: Date.now().toString(),
          topic: missionTopic,
          status: 'Active',
          currentDay: 1,
          progress: 5,
          logs: [firstLog],
          lastUpdated: Date.now(),
          longTermMemory: []
      };
      
      setActiveMission(newMission);
      setLoading(false);
  };

  const handleSimulateNextDay = async () => {
      if (!activeMission || loading) return;
      setLoading(true);
      
      // Initialize streaming state
      setStreamingLog({ content: '', day: activeMission.currentDay + 1 });
      
      const nextDay = activeMission.currentDay + 1;
      
      // Pass the callback to update UI in real-time
      const nextLog = await generateDailyResearchUpdate(activeMission, (chunk) => {
          setStreamingLog(prev => ({
              day: nextDay,
              content: (prev?.content || '') + chunk
          }));
      });
      
      // Clear streaming state and finalize log
      setStreamingLog(null);
      
      setActiveMission(prev => {
          if (!prev) return null;
          let newProgress = prev.progress + (nextLog.progressDelta || 5); 
          if (newProgress > 100) newProgress = 100; // Cap at 100
          
          return {
              ...prev,
              currentDay: nextLog.day,
              progress: Math.floor(newProgress),
              logs: [nextLog, ...prev.logs], // Prepend for timeline view (newest first)
              lastUpdated: Date.now()
          };
      });
      setLoading(false);
  };

  // Add Resource Handler
  const handleAddResource = (type: 'local' | 'link', content: any) => {
      if (!activeMission) return;
      
      // Create a "Manual" log entry for the resource
      const resourceLog: ResearchLog = {
          day: activeMission.currentDay,
          timestamp: Date.now(),
          phase: activeMission.logs[0].phase,
          title: `导师添加资料: ${content.name || '外部视频'}`,
          content: `导师上传了参考资料，请结合研究。`,
          tags: ['Reference'],
          video: type === 'local' ? {
              url: URL.createObjectURL(content),
              type: 'local',
              title: content.name
          } : {
              url: content,
              type: 'link',
              title: '外部链接视频'
          }
      };

      setActiveMission(prev => prev ? ({
          ...prev,
          logs: [resourceLog, ...prev.logs]
      }) : null);
      
      setShowAddResource(false);
  };

  const getThemeColor = () => {
    switch(mode) {
      case 'assist': return 'blue';
      case 'simulate': return 'green';
      case 'delegate': return 'amber';
    }
  };

  const markdownRenderers = useMemo(() => MarkdownComponents(), []);

  // --- RENDERERS ---

  const renderChatInterface = () => (
      <>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10 pb-28 scroll-smooth bg-[#0a0a0a] select-text cursor-text relative">
            {mode === 'simulate' && (
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            )}

            {messages.map((msg, idx) => {
              const isSim = mode === 'simulate' && msg.role === 'model';
              const isModel = msg.role === 'model';
              const isLast = idx === messages.length - 1;
              const shouldAnimate = isModel && isLast && !typingCompleteIds.has(msg.id);
              
              return (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up relative z-10`}>
                <div className={`relative max-w-[95%] shadow-sm ${
                  isSim ? 'w-full border-2 border-green-800 bg-[#1a1a1a] rounded-none font-mono' :
                  `rounded-2xl p-4 border ${msg.role === 'user' ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800'}`
                }`}>
                  {isSim && (
                      <div className="bg-[#2a2a2a] p-2 text-green-400 text-xs font-bold mb-2 border-b-2 border-green-800 flex items-center justify-between">
                          <div className="flex items-center gap-2"><Presentation size={14} /> VISUAL_PREVIEW_MODE</div>
                          <div className="flex gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          </div>
                      </div>
                  )}
                  
                  <div className={`markdown-body text-sm leading-relaxed p-2 ${isSim ? 'text-green-100' : 'text-gray-200'}`}>
                    {shouldAnimate ? (
                        <TypingEffect 
                            text={msg.text} 
                            onComplete={() => {
                                setTypingCompleteIds(prev => new Set(prev).add(msg.id));
                                endRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            components={markdownRenderers}
                        />
                    ) : (
                        <ReactMarkdown components={markdownRenderers}>{msg.text}</ReactMarkdown>
                    )}
                  </div>

                  {/* Voxel Scene Rendering */}
                  {msg.voxelData && (
                      <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 relative">
                           <VoxelScene blueprint={msg.voxelData} />
                           <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md pointer-events-none">
                              Interactive 3D View
                           </div>
                      </div>
                  )}

                  {/* Generated Image Rendering */}
                  {msg.imageUrl && (
                      <div className="mt-4 w-full rounded-lg overflow-hidden border border-gray-700 relative group">
                          <img 
                            src={`data:image/png;base64,${msg.imageUrl}`} 
                            alt="AI Generated Visualization" 
                            className="w-full h-auto object-cover"
                          />
                          <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md">
                              Generated by Nano Banana
                          </div>
                      </div>
                  )}
                </div>

                {isModel && msg.suggestions && (typingCompleteIds.has(msg.id) || !shouldAnimate) && (
                    <div className="mt-3 flex flex-wrap gap-2 animate-fade-in-up self-start">
                        {msg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSendChat(s)} className={`bg-gray-900 border border-gray-800 text-${getThemeColor()}-300 text-xs px-3 py-1.5 rounded-full transition-colors active:scale-95 shadow-sm`}>{s}</button>
                        ))}
                    </div>
                )}
              </div>
            )})}
            <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/80 backdrop-blur-md border-t border-gray-800 pb-safe-bottom">
            {/* Thinking Indicator */}
             {loading && (
                 <div className="absolute -top-10 left-0 right-0 flex justify-center z-10">
                     <div className="bg-gray-800/95 backdrop-blur-md text-gray-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 border border-gray-700 shadow-lg animate-fade-in-up">
                         <Loader2 size={12} className="animate-spin text-blue-400" />
                         <span>{thinkingPhase || 'AI 正在思考...'}</span>
                     </div>
                 </div>
             )}

             <div className="flex items-center gap-2">
                 <button onClick={() => setMode(prev => prev === 'assist' ? 'simulate' : 'assist')} className={`p-2.5 rounded-full border transition-colors ${mode === 'simulate' ? 'bg-green-600/20 text-green-400 border-green-600/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {mode === 'simulate' ? <Eye size={20} /> : <Sparkles size={20} />}
                 </button>
                 
                 <div className={`flex-1 flex items-center bg-gray-900 border rounded-full px-2 py-2 transition-all duration-300 ${isListening ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-gray-800 focus-within:border-blue-500'}`}>
                    <button onClick={toggleListening} disabled={loading} className={`p-2 rounded-full mr-1 transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'text-gray-400 hover:text-white'}`}>
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-500" 
                        placeholder={mode === 'delegate' && !activeMission ? "输入课题名称启动研究..." : "输入想法..."} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (mode === 'delegate' ? handleStartMission() : handleSendChat())} 
                    />
                    <button 
                        onClick={() => mode === 'delegate' ? handleStartMission() : handleSendChat()} 
                        disabled={loading || !input.trim()} 
                        className={`p-2 rounded-full ml-1 ${loading || !input.trim() ? 'text-gray-600' : 'text-blue-500 bg-blue-500/10'}`}
                    >
                        {mode === 'delegate' ? <Rocket size={18} /> : <Send size={18} />}
                    </button>
                 </div>
             </div>
        </div>
      </>
  );

  const renderMissionDashboard = () => {
       if (!activeMission) return (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
               <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
                   <Rocket size={40} className="text-amber-500" />
               </div>
               <h2 className="text-xl font-bold text-white mb-2">AI 代理 (Agent Mode)</h2>
               <p className="text-gray-400 text-sm mb-8 max-w-xs">
                   输入一个研究课题，AI 将作为你的研究生，自主进行文献调研、方案设计、仿真实验，并每日汇报进度。
               </p>
               <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-1 flex items-center">
                   <input 
                       className="flex-1 bg-transparent px-4 py-3 text-white outline-none" 
                       placeholder="例如：自适应植物浇水系统..."
                       value={input}
                       onChange={e => setInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleStartMission()}
                   />
                   <button 
                       onClick={handleStartMission} 
                       disabled={loading || !input.trim()}
                       className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-amber-500 transition disabled:opacity-50"
                   >
                       {loading ? <Loader2 className="animate-spin" /> : '立项'}
                   </button>
               </div>
           </div>
       );

       return (
           <div className="flex-1 flex flex-col overflow-hidden relative bg-[#050505]">
                {/* Header */}
                <div className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center shadow-lg z-10">
                    <div>
                        <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">Project Code: {activeMission.id.slice(-6)}</div>
                        <h2 className="text-lg font-bold text-white leading-tight">{activeMission.topic}</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white">{activeMission.progress}%</div>
                        <div className="text-[10px] text-gray-500">PROJECT COMPLETION</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-800">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-1000" style={{ width: `${activeMission.progress}%` }} />
                </div>

                {/* Logs Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scroll-smooth">
                    {/* Streaming Update Card */}
                    {streamingLog && (
                        <div className="border border-green-500/50 bg-green-900/10 rounded-xl p-4 animate-pulse">
                             <div className="flex items-center gap-2 mb-2">
                                 <Loader2 size={14} className="text-green-400 animate-spin" />
                                 <span className="text-xs font-bold text-green-400">正在生成 Day {streamingLog.day} 报告...</span>
                             </div>
                             <div className="markdown-body text-xs text-gray-300">
                                 <ReactMarkdown components={markdownRenderers}>{streamingLog.content}</ReactMarkdown>
                             </div>
                        </div>
                    )}

                    {activeMission.logs.map((log) => (
                        <div id={`log-day-${log.day}`} key={log.day} className="relative pl-6 border-l border-gray-800 animate-fade-in-up">
                            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-700 border border-black" />
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500">Day {log.day}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PHASE_STYLES[log.phase] || 'border-gray-700 text-gray-500'}`}>{log.phase}</span>
                            </div>
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-sm hover:border-gray-700 transition-colors">
                                <h3 className="font-bold text-gray-200 mb-2">{log.title}</h3>
                                {log.video && (
                                    <div className="mb-3 rounded-lg overflow-hidden bg-black border border-gray-800 relative group cursor-pointer">
                                        <div className="aspect-video flex items-center justify-center bg-gray-800">
                                            <PlayCircle size={32} className="text-white/50 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded backdrop-blur-md">
                                            {log.video.title}
                                        </div>
                                    </div>
                                )}
                                <div className="markdown-body text-sm text-gray-400 leading-relaxed">
                                     <ReactMarkdown components={markdownRenderers}>{log.content}</ReactMarkdown>
                                </div>
                                {log.imagePrompt && (
                                     <div className="mt-3 p-2 bg-black/30 rounded border border-gray-800 flex items-center gap-2 text-xs text-gray-500">
                                         <ImageIcon size={14} /> 
                                         <span>Visual Concept Generated</span>
                                     </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <div className="text-center py-4">
                        <span className="text-xs text-gray-600">Mission Started: {new Date(Number(activeMission.id)).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Agent Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-gray-800 pb-safe-bottom">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowAddResource(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                <Plus size={20} />
                            </div>
                            <span className="text-[10px]">投喂资料</span>
                        </button>

                        <div className="h-8 w-px bg-gray-800" />

                        <button 
                            onClick={handleSimulateNextDay} 
                            disabled={loading || activeMission.progress >= 100}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-gray-700"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><RefreshCw size={18} /> 推演下一天</>}
                        </button>
                        
                        <button 
                            onClick={() => setIsAutoRun(!isAutoRun)} 
                            disabled={activeMission.progress >= 100}
                            className={`flex flex-col items-center gap-1 transition-colors ${isAutoRun ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isAutoRun ? 'bg-green-500/20 border-green-500' : 'bg-gray-800 border-gray-700'}`}>
                                {isAutoRun ? <Pause size={20} /> : <Play size={20} />}
                            </div>
                            <span className="text-[10px]">自动</span>
                        </button>
                    </div>
                </div>

                {/* Add Resource Modal */}
                {showAddResource && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <div className="bg-gray-900 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl border border-gray-800 p-6 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white">添加参考资料</h3>
                                <button onClick={() => setShowAddResource(false)}><X size={20} className="text-gray-500" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="aspect-square bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition gap-2">
                                    <FolderOpen size={32} className="text-blue-400" />
                                    <span className="text-xs text-gray-300">本地视频/文档</span>
                                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleAddResource('local', e.target.files[0])} accept="video/*,image/*,.pdf" />
                                </label>
                                <button onClick={() => handleAddResource('link', 'https://example.com')} className="aspect-square bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition gap-2">
                                    <ExternalLink size={32} className="text-purple-400" />
                                    <span className="text-xs text-gray-300">粘贴链接</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
           </div>
       );
  };

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col text-white relative">
        {/* Header with Icon */}
        <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-800">
             <div className="flex items-center gap-2">
                 <div className="bg-blue-600 p-1.5 rounded-lg">
                    <FlaskConical size={18} className="text-white" />
                 </div>
                 <span className="font-bold text-lg tracking-tight">Idea Lab</span>
             </div>
             <div className="flex gap-2">
                 {/* New Chess Button */}
                 <button onClick={onOpenChess} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-700">
                    <Crown size={14} className="text-red-400" />
                    <span>象棋</span>
                 </button>

                 <button onClick={handleClearHistory} className="p-2 hover:bg-gray-800 rounded-full text-gray-500">
                     <RefreshCw size={14} />
                 </button>
             </div>
        </div>

        {/* Mode Switcher Tabs - Full Width */}
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-800">
             <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800 w-full">
                 <button onClick={() => setMode('assist')} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all text-center ${mode === 'assist' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                    AI 辅助
                 </button>
                 <button onClick={() => setMode('simulate')} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all text-center ${mode === 'simulate' ? 'bg-gray-800 text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                    数字模拟
                 </button>
                 <button onClick={() => setMode('delegate')} className={`flex-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all text-center ${mode === 'delegate' ? 'bg-gray-800 text-amber-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                    AI 代理
                 </button>
             </div>
        </div>

        {mode === 'delegate' ? renderMissionDashboard() : renderChatInterface()}
    </div>
  );
};

export default IdeaLab;
