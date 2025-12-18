
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send, Sparkles, Bot, Target, Ruler, Hammer, Microscope, Users, Zap, Brain, ShieldCheck, Star, ShoppingCart, ExternalLink, Mic, MicOff, Volume2, Square, Trash2, Bookmark, Check, Copy, MousePointerClick, ArrowRight, Video, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Project, ChatMessage } from '../types';
import { chatWithProjectAssistant } from '../services/gemini';
import ARTutorOverlay from './ARTutorOverlay';
import TypingEffect from './TypingEffect';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  isLiked?: boolean;
  isFavorited?: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;
}

type PracticePhase = 'Define' | 'Plan' | 'Act' | 'Analyze';

// --- Custom Markdown Components ---
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return <code className="bg-gray-800 px-1 py-0.5 rounded text-red-300 font-mono text-xs" {...props}>{children}</code>;
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] shadow-lg">
      <div className="flex justify-between items-center px-3 py-1.5 bg-gray-800/50 border-b border-gray-700 text-xs text-gray-400 select-none">
        <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
            <span className="ml-2 font-mono text-blue-300">{lang || 'Code'}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          <span className={copied ? 'text-green-400' : ''}>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <code className={className} {...props}>{children}</code>
      </pre>
    </div>
  );
};

const SmartListItem = ({ children, setPhase, setToast, ...props }: any) => {
    let textContent = '';
    try {
        const extractText = (node: any): string => {
            if (typeof node === 'string') return node;
            if (Array.isArray(node)) return node.map(extractText).join(' ');
            if (typeof node === 'object' && node !== null && 'props' in node && node.props.children) {
                return extractText(node.props.children);
            }
            return '';
        };
        textContent = extractText(children);
    } catch (e) { }

    const keywords: Record<string, PracticePhase> = {
        '连接': 'Act', '焊接': 'Act', '组装': 'Act', '代码': 'Act', '编写': 'Act', '上传': 'Act', '打印': 'Act',
        '接线': 'Act', '烧录': 'Act', '测试': 'Analyze', '检查': 'Analyze', '调试': 'Analyze', '分析': 'Analyze',
        '报错': 'Analyze', '准备': 'Plan', '购买': 'Plan', '清单': 'Plan', '定义': 'Define', '目标': 'Define'
    };

    let detectedPhase: PracticePhase | null = null;
    for (const [key, phase] of Object.entries(keywords)) {
        if (textContent.includes(key)) {
            detectedPhase = phase;
            break;
        }
    }

    if (detectedPhase) {
        return (
            <li 
                className="group cursor-pointer my-3 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-750 transition-all list-none shadow-md active:scale-95" 
                onClick={() => {
                    setPhase(detectedPhase!);
                    if(setToast) setToast(`✅ 已切换到：${detectedPhase} 阶段`);
                }} 
                {...props}
            >
                <div className="flex gap-3 items-start">
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner ${
                        detectedPhase === 'Act' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                        detectedPhase === 'Analyze' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                        detectedPhase === 'Plan' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
                        'bg-gray-500/20 border-gray-500/30 text-gray-400'
                    }`}>
                        {detectedPhase === 'Act' && <Hammer size={16} />}
                        {detectedPhase === 'Analyze' && <Microscope size={16} />}
                        {detectedPhase === 'Plan' && <Ruler size={16} />}
                        {detectedPhase === 'Define' && <Target size={16} />}
                    </div>
                    <div className="flex-1">
                        <div className="text-white font-medium leading-relaxed text-sm">{children}</div>
                        <div className="mt-2 flex items-center justify-between">
                             <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium group-hover:text-blue-300 transition-colors">
                                <MousePointerClick size={12} /> <span>点击执行</span>
                             </div>
                             <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-600 text-gray-300 bg-gray-900 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white transition-colors">
                                Go {detectedPhase} <ArrowRight size={10} />
                             </div>
                        </div>
                    </div>
                </div>
            </li>
        );
    }
    return <li className="mb-2 leading-relaxed pl-1 ml-1" {...props}><span className="ml-2 text-gray-300">{children}</span></li>;
};

// Styling components
const MarkdownComponents = (setPhase: any, setToast: any) => ({
    code: CodeBlock,
    li: (props: any) => <SmartListItem setPhase={setPhase} setToast={setToast} {...props} />,
    // Headers
    h1: ({children}: any) => <h1 className="text-lg font-bold text-blue-300 mt-4 mb-2 border-b border-gray-700 pb-1">{children}</h1>,
    h2: ({children}: any) => <h2 className="text-base font-bold text-blue-200 mt-3 mb-2">{children}</h2>,
    h3: ({children}: any) => <h3 className="text-sm font-bold text-gray-200 mt-2 mb-1">{children}</h3>,
    // Lists
    ul: ({children}: any) => <ul className="list-disc pl-4 space-y-1 text-gray-300">{children}</ul>,
    ol: ({children}: any) => <ol className="list-decimal pl-4 space-y-1 text-gray-300">{children}</ol>,
    // Blockquote (Thinking Process)
    blockquote: ({children}: any) => (
        <div className="border-l-4 border-gray-600 pl-4 py-2 my-3 bg-gray-900/50 rounded-r-lg text-xs text-gray-400 italic">
            {children}
        </div>
    ),
    // Bold
    strong: ({children}: any) => <strong className="font-bold text-white">{children}</strong>
});

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, isFavorited, onToggleFavorite }) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'chat'>(
      project.steps && project.steps.length > 0 ? 'steps' : 'chat'
  );
  
  const [phase, setPhase] = useState<PracticePhase>(() => {
      const stored = localStorage.getItem(`phase_${project.id}`);
      return (stored as PracticePhase) || 'Plan';
  });

  const [showAR, setShowAR] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      const stored = localStorage.getItem(`chat_history_${project.id}`);
      if (stored) return JSON.parse(stored);
      
      return [{
        id: 'welcome',
        role: 'model',
        text: `> 💭 **Thinking:** Initializing specialized persona for ${project.title}. Loading context from wisdom database...\n\n你好！我是 **${project.aiStats.specializationTitle}**。\n\n我已经协助了 ${project.aiStats.studentsHelped} 位极客。根据集体智慧，我已准备好辅导你。\n\n当前处于 **规划(Plan)** 阶段，有什么我可以帮你的吗？`,
        timestamp: Date.now(),
        suggestions: ["我要怎么开始？", "有哪些注意事项？", "列出材料清单"]
      }];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Track completely finished messages to avoid re-typing old ones
  const [typingCompleteIds, setTypingCompleteIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const baseVoiceTextRef = useRef(''); // Ref to store text before voice input starts

  useEffect(() => { localStorage.setItem(`chat_history_${project.id}`, JSON.stringify(messages)); }, [messages, project.id]);
  useEffect(() => { localStorage.setItem(`phase_${project.id}`, phase); }, [phase, project.id]);

  // Initial load: mark all existing messages as "typed" so they show instantly
  useEffect(() => {
      const ids = new Set<string>();
      messages.forEach(m => ids.add(m.id));
      setTypingCompleteIds(ids);
  }, []);

  const handleClearHistory = () => {
      if (confirm("确定要清空聊天记录吗？")) {
          const welcomeMsg: ChatMessage = { id: 'welcome_reset_' + Date.now(), role: 'model', text: `已重置。我是 **${project.aiStats.specializationTitle}**，请指示。`, timestamp: Date.now(), suggestions: ["第一步做什么？"] };
          setMessages([welcomeMsg]);
          setTypingCompleteIds(new Set([welcomeMsg.id]));
          localStorage.removeItem(`chat_history_${project.id}`);
      }
  };

  const handleToggleFav = () => {
      if (onToggleFavorite) {
          onToggleFavorite();
          const msg = !isFavorited ? "已收藏" : "已取消收藏";
          setToast(msg);
          setTimeout(() => setToast(null), 2000);
      }
  };

  // Voice Logic
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'zh-CN';
            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
                // Append the transcript to the text that existed before listening started
                setInputText(baseVoiceTextRef.current + (baseVoiceTextRef.current && transcript ? '' : '') + transcript);
            };
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }
    return () => { if (synthRef.current?.speaking) synthRef.current.cancel(); };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("您的浏览器不支持语音识别。");
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    } else {
        baseVoiceTextRef.current = inputText; // Capture current text
        recognitionRef.current?.start();
        setIsListening(true);
        // Do NOT clear inputText here to allow appending
    }
  };

  const speakText = (text: string, msgId: string) => {
    if (synthRef.current.speaking) {
        synthRef.current.cancel();
        if (isSpeaking === msgId) { setIsSpeaking(null); return; }
    }
    const cleanText = text.replace(/[*#`>]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synthRef.current.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh-CN') || v.lang.includes('cmn'));
    if (zhVoice) utterance.voice = zhVoice;
    utterance.lang = 'zh-CN';
    utterance.onend = () => setIsSpeaking(null);
    setIsSpeaking(msgId);
    synthRef.current.speak(utterance);
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages, activeTab, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    // Mark user message as typed immediately
    setTypingCompleteIds(prev => new Set(prev).add(userMsg.id));
    
    setInputText('');
    setIsLoading(true);
    setActiveTab('chat');

    // Call AI
    const rawResponse = await chatWithProjectAssistant(project, messages, textToSend, phase);
    
    // Parse Suggestions
    let aiText = rawResponse;
    let suggestions: string[] = [];
    
    if (rawResponse.includes('___SUGGESTIONS___')) {
        const parts = rawResponse.split('___SUGGESTIONS___');
        aiText = parts[0].trim();
        try {
            suggestions = JSON.parse(parts[1].trim());
        } catch (e) {
            console.error("Failed to parse suggestions", e);
        }
    }

    const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: aiText, 
        timestamp: Date.now(),
        suggestions: suggestions.length > 0 ? suggestions : undefined
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const smartCapabilities = useMemo(() => {
    return project.aiStats.capabilities.map(c => ({...c, isBoosted: true})).slice(0, 5);
  }, [project]);

  const PhaseIcon = ({ p, active }: { p: PracticePhase, active: boolean }) => {
    const color = active ? 'text-blue-400' : 'text-gray-600';
    switch (p) {
        case 'Define': return <Target size={16} className={color} />;
        case 'Plan': return <Ruler size={16} className={color} />;
        case 'Act': return <Hammer size={16} className={color} />;
        case 'Analyze': return <Microscope size={16} className={color} />;
    }
    return null;
  };

  const handleTypingComplete = (id: string) => {
      setTypingCompleteIds(prev => new Set(prev).add(id));
      scrollToBottom();
  };

  const markdownRenderers = useMemo(() => MarkdownComponents(setPhase, setToast), [setPhase, setToast]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white relative">
      {showAR && <ARTutorOverlay onClose={() => setShowAR(false)} projectTitle={project.title} />}

      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-800 bg-gray-900 z-10 relative shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full"><ArrowLeft size={20} /></button>
        <div className="ml-2 flex-1">
          <h1 className="text-md font-bold truncate">{project.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-green-400 border border-green-800 bg-green-900/30 px-1 rounded flex items-center gap-1">
                 <Users size={8} /> {project.aiStats.studentsHelped}人
              </span>
              <span className="text-[10px] text-blue-300 border border-blue-800 bg-blue-900/30 px-1 rounded flex items-center gap-1">
                 <ShieldCheck size={8} /> AI 校对
              </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleToggleFav} className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${isFavorited ? 'text-yellow-400' : 'text-gray-400'}`}>
                <Star size={20} fill={isFavorited ? "currentColor" : "none"} />
            </button>
            <div className="flex bg-gray-800 rounded-lg p-1">
            {project.steps && project.steps.length > 0 && (
                <button className={`px-3 py-1 text-xs font-medium rounded-md transition ${activeTab === 'steps' ? 'bg-gray-700 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('steps')}>教程</button>
            )}
            <button className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('chat')}>
                <Sparkles size={12} /> 老师傅
            </button>
            </div>
        </div>
        {toast && (
             <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-xl z-50 animate-fade-in-up flex items-center gap-2 shadow-2xl border border-white/10 w-max">
                <Check size={20} className="text-green-400" />
                <span className="font-bold text-sm">{toast}</span>
             </div>
          )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Steps View */}
        {project.steps && (
        <div className={`absolute inset-0 overflow-y-auto p-4 transition-transform duration-300 ${activeTab === 'steps' ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="mb-6">
             <img src={project.videoUrl} className="w-full h-48 object-cover rounded-lg mb-4 shadow-lg border border-gray-800" alt="Project Cover" loading="lazy" />
             <p className="text-gray-300 text-sm leading-relaxed mb-4">{project.description}</p>
             <div className="flex gap-2">
                <span className="text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700 px-2 py-1 rounded">难度: {project.difficulty}</span>
                {project.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">#{tag}</span>)}
             </div>
           </div>
           
           {project.materials && project.materials.length > 0 && (
             <div className="bg-gray-900/80 rounded-xl p-4 border border-gray-800 mb-6 shadow-md">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2"><ShoppingCart size={18} className="text-green-400"/> 材料清单</h3>
                <div className="space-y-2">
                   {project.materials.map(m => (
                      <div key={m.id} className="flex justify-between items-center text-sm bg-black/40 p-2.5 rounded">
                         <span className="text-gray-300">{m.name}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-yellow-400 font-mono font-bold">{m.price}</span>
                            <a href={`https://s.taobao.com/search?q=${encodeURIComponent(m.name)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-orange-500 text-white px-2 py-1 rounded flex items-center gap-1">淘宝 <ExternalLink size={10} /></a>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           <h3 className="font-bold text-lg mb-4 border-l-4 border-blue-500 pl-3">制作流程</h3>
           <div className="space-y-6">
             {project.steps.map((step, index) => (
               <div key={step.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                 <h4 className="font-bold text-blue-400 mb-1">Step {index + 1}</h4>
                 <h5 className="text-base font-semibold mb-2">{step.title}</h5>
                 {step.image && <img src={step.image} alt={step.title} className="w-full h-40 object-cover rounded-lg mb-3 bg-gray-800" loading="lazy" />}
                 <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                 <button onClick={() => { handleSend(`我在做第${index+1}步"${step.title}"时遇到问题：`); setPhase('Act'); setActiveTab('chat'); }} className="mt-3 text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300"><Bot size={14} /> 这一步有问题？问问老师傅</button>
               </div>
             ))}
           </div>
           <div className="h-20"></div>
        </div>
        )}

        {/* Chat View */}
        <div className={`absolute inset-0 flex flex-col bg-gray-950 transition-transform duration-300 ${activeTab === 'chat' ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="bg-gray-900 p-3 border-b border-gray-800 relative">
             <button onClick={handleClearHistory} className="absolute top-2 right-2 text-gray-600 hover:text-red-400 p-1.5 hover:bg-gray-800 rounded transition-colors"><Trash2 size={14} /></button>
             <div className="flex items-start gap-3">
                <div className="bg-blue-900/50 p-2 rounded-lg border border-blue-500/30"><Bot size={24} className="text-blue-400" /></div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">{project.aiStats.specializationTitle} <div className="flex gap-0.5"><Zap size={10} className="text-yellow-400 fill-current" /></div></h3>
                    <div className="mt-2 space-y-1.5">
                        {smartCapabilities.map((cap) => (
                            <div key={cap.name} className="flex items-center gap-2">
                                <span className={`text-[10px] w-16 text-right ${cap.isBoosted ? 'text-purple-300' : 'text-gray-400'}`}>{cap.name}</span>
                                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div className={`h-full ${cap.isBoosted ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} style={{ width: `${cap.level * 10}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
             <div className="mt-3 bg-black/40 rounded p-2 border border-gray-800 flex items-start gap-2">
                 <Brain size={14} className="text-pink-400 mt-0.5 shrink-0" />
                 <div className="overflow-hidden h-4 flex-1">
                     <div className="text-[10px] text-gray-300 animate-[marquee_10s_linear_infinite] whitespace-nowrap">
                         <span className="text-pink-400 font-bold mr-2">集体智慧(Hive Mind):</span> {project.aiStats.collectedWisdom.join(" • ")}
                     </div>
                 </div>
             </div>
           </div>

           <div className="bg-gray-900/50 border-b border-gray-800 p-2 space-y-2">
             <div className="flex justify-between items-center bg-black/40 rounded-lg p-1">
                {(['Define', 'Plan', 'Act', 'Analyze'] as PracticePhase[]).map((p) => (
                    <button key={p} onClick={() => setPhase(p)} className={`flex flex-col items-center flex-1 py-1 rounded transition-colors ${phase === p ? 'bg-gray-800 shadow-sm border border-gray-700' : 'hover:bg-gray-800/50 border border-transparent'}`}>
                        <PhaseIcon p={p} active={phase === p} />
                        <span className={`text-[9px] mt-1 font-bold ${phase === p ? 'text-blue-400' : 'text-gray-600'}`}>{p}</span>
                    </button>
                ))}
             </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
             {messages.map((msg, index) => {
                 const isLast = index === messages.length - 1;
                 const isModel = msg.role === 'model';
                 // Only animate the last message if it's from AI and not marked as complete yet
                 const shouldAnimate = isModel && isLast && !typingCompleteIds.has(msg.id);
                 
                 return (
                   <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                      <div className={`max-w-[90%] rounded-2xl p-3 text-sm shadow-md transition-all ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                        {msg.role === 'model' && (
                            <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs justify-between">
                               <div className="flex items-center gap-2"><Bot size={14} /> <span>AI 老师傅</span></div>
                               <button onClick={() => speakText(msg.text, msg.id)} className="p-1 rounded-full hover:bg-gray-700 text-gray-500">{isSpeaking === msg.id ? <Square size={12} className="fill-current" /> : <Volume2 size={12} />}</button>
                            </div>
                        )}
                        <div className="markdown-body">
                            {shouldAnimate ? (
                                <TypingEffect 
                                    text={msg.text} 
                                    onComplete={() => handleTypingComplete(msg.id)}
                                    components={markdownRenderers}
                                />
                            ) : (
                                <ReactMarkdown components={markdownRenderers}>
                                    {msg.text}
                                </ReactMarkdown>
                            )}
                        </div>
                      </div>
                      
                      {/* Follow-up Suggestions (Only show if fully typed or historical) */}
                      {isModel && msg.suggestions && (typingCompleteIds.has(msg.id) || !shouldAnimate) && (
                          <div className="mt-3 ml-2 flex flex-wrap gap-2 animate-fade-in-up">
                              {msg.suggestions.map((s, i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => handleSend(s)}
                                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-blue-300 text-xs px-3 py-1.5 rounded-full transition-colors active:scale-95 shadow-sm text-left max-w-[200px] truncate"
                                  >
                                      {s}
                                  </button>
                              ))}
                          </div>
                      )}
                   </div>
                 );
             })}
             <div ref={messagesEndRef} />
           </div>

           <div className="p-3 bg-gray-900 border-t border-gray-800 pb-safe-bottom relative">
             {/* Loading Indicator (Absolute positioned above input) */}
             {isLoading && (
                 <div className="absolute -top-10 left-0 right-0 flex justify-center z-10">
                     <div className="bg-gray-800/95 backdrop-blur-md text-gray-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 border border-gray-700 shadow-lg animate-fade-in-up">
                         <Loader2 size={12} className="animate-spin text-blue-400" />
                         <span>老师傅正在思考...</span>
                     </div>
                 </div>
             )}
             
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowAR(true)} className="p-2.5 rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/50"><Video size={20} /></button>
                 <div className={`flex-1 flex items-center bg-gray-950 border rounded-full px-2 py-2 transition-all duration-300 ${isListening ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-gray-700 focus-within:border-blue-500'}`}>
                    <button onClick={toggleListening} disabled={isLoading} className={`p-2 rounded-full mr-1 transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'text-gray-400 hover:text-white'}`}>{isListening ? <MicOff size={18} /> : <Mic size={18} />}</button>
                    <input type="text" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-500" placeholder={isListening ? "请说话..." : "输入消息..."} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                    <button onClick={() => handleSend()} disabled={isLoading || !inputText.trim()} className={`p-2 rounded-full ml-1 ${isLoading || !inputText.trim() ? 'text-gray-600' : 'text-blue-500 bg-blue-500/10'}`}><Send size={18} /></button>
                 </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
