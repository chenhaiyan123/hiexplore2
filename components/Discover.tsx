
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Camera, ScanLine, Flame, Trophy, ChevronRight, Zap, ShoppingBag, ShieldCheck, X, Loader2, ImageOff, ArrowUpCircle, Sparkles, Home, Wrench, ChefHat, Map, History, Clock, GraduationCap, Crown } from 'lucide-react';
import { Project } from '../types';
import { MOCK_PROJECTS, COMPETITION_PROJECTS, COLLEGE_PROJECTS, LIFE_ASSISTANT_PROJECTS } from '../constants';

interface DiscoverProps {
  onSelectProject: (p: Project) => void;
  onOpenChessPractice: () => void;
}

// Image Component with Fallback
const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [error, setError] = useState(false);
    
    // Built-in fallbacks for different categories if Unsplash fails
    const FALLBACK_IMAGES: Record<string, string> = {
        'default': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
        'robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
        'code': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
    };

    const getFallback = () => {
        const lowerAlt = alt.toLowerCase();
        if (lowerAlt.includes('robot') || lowerAlt.includes('arm')) return FALLBACK_IMAGES['robot'];
        if (lowerAlt.includes('code') || lowerAlt.includes('python')) return FALLBACK_IMAGES['code'];
        return FALLBACK_IMAGES['default'];
    };
    
    if (error) {
        return (
            <div className={`relative ${className} overflow-hidden`}>
                <img src={getFallback()} className="w-full h-full object-cover opacity-50" alt="fallback" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-black/40">
                    <ImageOff size={24} className="mb-1" />
                </div>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

const Discover: React.FC<DiscoverProps> = ({ onSelectProject, onOpenChessPractice }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Project | null>(null);
  
  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(20);
  const [showHistory, setShowHistory] = useState(false);
  
  // Persistent Search History
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
      try {
          const stored = localStorage.getItem('search_history');
          return stored ? JSON.parse(stored) : [];
      } catch (e) { return []; }
  });
  
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      try {
          localStorage.setItem('search_history', JSON.stringify(searchHistory));
      } catch (e) {}
  }, [searchHistory]);

  const addToHistory = (term: string) => {
      if (!term.trim()) return;
      setSearchHistory(prev => {
          const next = [term, ...prev.filter(t => t !== term)].slice(0, 5); // Keep last 5 unique
          return next;
      });
  };

  const removeHistory = (term: string) => {
      setSearchHistory(prev => prev.filter(t => t !== term));
  };

  // Filter Logic
  const filteredProjects = useMemo(() => {
    let result = MOCK_PROJECTS;

    if (activeFilter) {
        const lowerFilter = activeFilter.toLowerCase().replace('#', '');
        result = result.filter(p => 
            p.tags.some(t => t.toLowerCase().includes(lowerFilter)) ||
            p.title.toLowerCase().includes(lowerFilter) ||
            p.description.toLowerCase().includes(lowerFilter)
        );
    }

    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.title.toLowerCase().includes(lowerQuery) ||
            p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            p.author.toLowerCase().includes(lowerQuery)
        );
    }

    if (!activeFilter && !searchQuery) {
        return result.slice(15); 
    }

    return result;
  }, [activeFilter, searchQuery]);

  // Pagination Logic
  const displayProjects = filteredProjects.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProjects.length;

  const handleLoadMore = () => {
      setVisibleLimit(prev => prev + 20);
  };

  const handleFilter = (tag: string) => {
      setActiveFilter(tag);
      setSearchQuery('');
      setVisibleLimit(20);
      addToHistory(tag);
      setTimeout(() => {
          listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
  };

  const handleClearFilter = () => {
      setActiveFilter(null);
      setSearchQuery('');
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setShowHistory(false);
          addToHistory(searchQuery);
      }
  };

  // Mock Scanning Process
  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
        const found = MOCK_PROJECTS.find(p => p.id === 'p1') || MOCK_PROJECTS[0];
        setScanResult(found);
    }, 2500);
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-20 relative">
      
      {/* AR Scanner Modal */}
      {isScanning && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
             <div className="absolute inset-0 overflow-hidden">
                 <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-blue-500/50 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-[scan_2s_linear_infinite]" />
                        <div className="absolute top-2 left-2 text-xs font-mono text-blue-400">ANALYZING...</div>
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
                    </div>
                 </div>
             </div>

             {scanResult && (
                 <div className="absolute bottom-10 left-4 right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 animate-fade-in-up">
                     <div className="flex items-start gap-4">
                         <ImageWithFallback src={scanResult.videoUrl} alt="scan" className="w-16 h-16 rounded bg-gray-800 object-cover" />
                         <div className="flex-1">
                             <div className="text-xs text-blue-400 font-bold mb-1">识别成功: 舵机 + 亚克力</div>
                             <h3 className="font-bold text-white mb-1">{scanResult.title}</h3>
                             <button 
                                onClick={() => { setIsScanning(false); onSelectProject(scanResult); }}
                                className="text-xs bg-blue-600 px-3 py-1.5 rounded-full text-white font-medium"
                             >
                                查看推荐项目
                             </button>
                         </div>
                     </div>
                     <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 text-gray-500 p-2">✕</button>
                 </div>
             )}

             {!scanResult && (
                 <div className="absolute bottom-20 text-center">
                     <p className="text-blue-300 font-mono text-sm animate-pulse">正在识别元件...</p>
                 </div>
             )}
          </div>
      )}

      {/* Header */}
      <div className="pt-safe-top px-4 py-4 flex items-center gap-4 bg-gradient-to-b from-black via-black/90 to-transparent sticky top-0 z-20">
         <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
             <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value) setActiveFilter(null);
                }}
                onKeyDown={handleSearchKey}
                placeholder="搜索灵感、零件、教程..." 
                className="w-full bg-gray-900 border border-gray-800 rounded-full pl-9 pr-10 py-2.5 text-sm text-gray-300 focus:border-blue-500 outline-none transition-colors shadow-lg" 
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <X size={14} />
                </button>
            )}

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && !searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden p-2 z-30 animate-fade-in-up">
                    <div className="text-[10px] text-gray-500 px-2 py-1 flex items-center gap-1"><Clock size={10} /> 最近搜索</div>
                    {searchHistory.map((term, i) => (
                        <div key={i} className="flex justify-between items-center hover:bg-gray-800 rounded px-2 py-2 cursor-pointer group">
                             <div 
                                className="flex-1 text-sm text-gray-300"
                                onClick={() => { setSearchQuery(term); handleFilter(term); setShowHistory(false); }}
                             >
                                 {term}
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); removeHistory(term); }} className="text-gray-600 hover:text-red-400 p-1">
                                 <X size={12} />
                             </button>
                        </div>
                    ))}
                </div>
            )}
         </div>
         <button 
            onClick={handleScan}
            className="p-2.5 bg-gray-800 rounded-full text-white hover:bg-gray-700 border border-gray-700 relative group active:scale-95 transition-transform shadow-lg"
         >
             <Camera size={20} />
             <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-black">
                 <ScanLine size={8} />
             </div>
         </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1">

        {/* --- CHESS CHALLENGE ENTRY --- */}
        <div className="px-4 mb-8">
            <div 
                onClick={onOpenChessPractice}
                className="relative h-28 rounded-2xl overflow-hidden group cursor-pointer border border-gray-800 active:opacity-90 transition-opacity bg-gray-900"
            >
                {/* Chess Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}></div>

                <div className="absolute inset-0 p-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-600/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-600/30">
                                HOT
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">PRACTICE</span>
                        </div>
                        <h2 className="text-xl font-bold text-white leading-tight">AI 象棋实践助手</h2>
                        <p className="text-xs text-gray-400 mt-1">从下棋到复盘，打造完美闭环。</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Crown size={24} className="text-white" />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Weekly Challenge Banner */}
        <div className="px-4 mb-8">
            <div 
                onClick={() => handleFilter('纸板')}
                className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer border border-gray-800 active:opacity-90 transition-opacity"
            >
                <img src="https://images.unsplash.com/photo-1605548230624-8d2d639e70e9?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="challenge" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-center items-start">
                    <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2">Weekly Challenge</span>
                    <h2 className="text-2xl font-black italic leading-none mb-1">废旧纸箱</h2>
                    <h2 className="text-2xl font-black italic leading-none mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">机甲改造赛</h2>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-300 bg-black/50 px-2 py-1 rounded backdrop-blur-md">
                        <Trophy size={12} className="text-yellow-400" />
                        <span>3,421 人已参与</span>
                        <span className="w-px h-3 bg-gray-600 mx-1" />
                        <span>点击查看</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SPECIAL TOPICS --- */}
        
        {/* K12 White-listed Competitions */}
        <div className="mb-8 pl-4">
             <div className="flex items-center justify-between pr-4 mb-3">
                <h3 className="font-bold flex items-center gap-2 text-purple-200">
                    <Trophy size={18} className="text-purple-500" /> 
                    教育部白名单赛项
                </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pr-4 no-scrollbar">
                {COMPETITION_PROJECTS.map(project => (
                    <div 
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className="min-w-[280px] bg-gradient-to-br from-purple-900/40 to-gray-900 rounded-xl border border-purple-500/30 overflow-hidden cursor-pointer relative group"
                    >
                        <div className="h-28 relative">
                             <ImageWithFallback src={project.videoUrl} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                             <div className="absolute top-2 left-2 bg-purple-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
                                 AI 教练版
                             </div>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-sm mb-1 line-clamp-1">{project.title}</h4>
                            <p className="text-[10px] text-gray-400 line-clamp-2 mb-2">{project.description}</p>
                            <div className="flex items-center gap-2 text-[10px] text-purple-300">
                                <ShieldCheck size={10} />
                                <span>官方认证赛道</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* College Competitions */}
        <div className="mb-8 pl-4">
             <div className="flex items-center justify-between pr-4 mb-3">
                <h3 className="font-bold flex items-center gap-2 text-blue-200">
                    <GraduationCap size={18} className="text-blue-500" /> 
                    大学生高水平赛事
                </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pr-4 no-scrollbar">
                {COLLEGE_PROJECTS.map(project => (
                    <div 
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className="min-w-[280px] bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl border border-blue-500/30 overflow-hidden cursor-pointer relative group"
                    >
                        <div className="h-28 relative">
                             <ImageWithFallback src={project.videoUrl} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                             <div className="absolute top-2 left-2 bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
                                 学术/双创
                             </div>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-sm mb-1 line-clamp-1">{project.title}</h4>
                            <p className="text-[10px] text-gray-400 line-clamp-2 mb-2">{project.description}</p>
                            <div className="flex items-center gap-2 text-[10px] text-blue-300">
                                <ShieldCheck size={10} />
                                <span>含金量 MAX</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Physical Life Assistants */}
        <div className="mb-8 pl-4">
             <div className="flex items-center justify-between pr-4 mb-3">
                <h3 className="font-bold flex items-center gap-2 text-green-200">
                    <Sparkles size={18} className="text-green-500" /> 
                    AI 生活物理助手
                </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 pr-4 no-scrollbar">
                {LIFE_ASSISTANT_PROJECTS.map(project => (
                    <div 
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className="min-w-[140px] flex flex-col items-center cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-800 mb-2 border border-gray-700 group-hover:border-green-500 transition-colors flex items-center justify-center relative overflow-hidden">
                             <ImageWithFallback src={project.videoUrl} alt={project.title} className="w-full h-full object-cover opacity-80" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 {project.tags.includes('美食') && <ChefHat size={20} className="text-white drop-shadow-md" />}
                                 {project.tags.includes('维修') && <Wrench size={20} className="text-white drop-shadow-md" />}
                                 {project.tags.includes('整理') && <Search size={20} className="text-white drop-shadow-md" />}
                                 {project.tags.includes('旅行') && <Map size={20} className="text-white drop-shadow-md" />}
                             </div>
                        </div>
                        <div className="text-xs font-bold text-center">{project.title.split(' ')[0]}</div>
                        <div className="text-[10px] text-gray-500">{project.aiStats.specializationTitle}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Trending Tags */}
        <div className="mb-8">
            <div className="px-4 flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                    <Flame size={18} className="text-orange-500" /> 
                    当下流行
                </h3>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                {['#ESP32', '#机械臂', '#透明设计', '#赛博朋克', '#桌面摆件', '#树莓派AI'].map((tag, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleFilter(tag)}
                        className={`shrink-0 border px-4 py-3 rounded-xl flex flex-col gap-1 min-w-[100px] cursor-pointer active:scale-95 transition text-left ${
                            activeFilter === tag 
                            ? 'bg-orange-500/20 border-orange-500 text-orange-200' 
                            : 'bg-gray-900 border-gray-800 hover:bg-gray-800'
                        }`}
                    >
                        <span className="font-bold text-sm">{tag}</span>
                        <span className={`text-[10px] ${activeFilter === tag ? 'text-orange-300/70' : 'text-gray-500'}`}>
                            {(Math.random() * 10).toFixed(1)}w 浏览
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Categories */}
        <div className="px-4 mb-8">
            <h3 className="font-bold mb-3 flex items-center gap-2">
                <Zap size={18} className="text-blue-500" />
                技能图谱
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { name: '微控制器', filter: 'ESP32', count: 120, color: 'bg-blue-500' },
                    { name: '3D 打印', filter: '3D打印', count: 85, color: 'bg-orange-500' },
                    { name: '机械结构', filter: '机械', count: 64, color: 'bg-gray-500' },
                    { name: 'AI 编程', filter: 'Python', count: 42, color: 'bg-green-500' },
                ].map((cat) => (
                    <div 
                        key={cat.name} 
                        onClick={() => handleFilter(cat.filter)}
                        className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between group cursor-pointer hover:bg-gray-800 transition-colors active:scale-95"
                    >
                        <div>
                            <div className="font-bold text-sm mb-1">{cat.name}</div>
                            <div className="text-[10px] text-gray-500">{cat.count} 个项目</div>
                        </div>
                        <div className={`w-2 h-8 rounded-full ${cat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    </div>
                ))}
            </div>
        </div>

        {/* Infinite Explore Grid */}
        <div className="px-4 min-h-screen" ref={listRef}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                    <ShoppingBag size={18} className="text-purple-500" />
                    {activeFilter || searchQuery ? '搜索结果' : '探索无限 (200+)'}
                </h3>
                {(activeFilter || searchQuery) && (
                    <button onClick={handleClearFilter} className="text-xs text-gray-400 flex items-center gap-1 hover:text-white">
                        <X size={12} /> 清除筛选
                    </button>
                )}
            </div>

            {/* Filter Status Bar */}
            {(activeFilter || searchQuery) && (
                <div className="mb-4 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-200 flex justify-between items-center">
                    <span>
                        找到 {filteredProjects.length} 个关于 
                        <span className="font-bold text-white mx-1">
                            {activeFilter || searchQuery}
                        </span>
                        的项目
                    </span>
                </div>
            )}
            
            <div className="columns-2 gap-3 space-y-3 pb-8">
                {displayProjects.map((project) => (
                    <div 
                        key={project.id} 
                        className="break-inside-avoid bg-gray-900 rounded-xl overflow-hidden border border-gray-800 cursor-pointer hover:border-gray-600 transition-colors active:opacity-80 relative group"
                        onClick={() => onSelectProject(project)}
                    >
                        <div className="aspect-[4/5] relative bg-gray-800">
                            <ImageWithFallback src={project.videoUrl} alt={project.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80" />
                            
                            {/* AI Verified Badge */}
                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1 rounded-full border border-green-500/30 shadow-sm">
                                <ShieldCheck size={12} className="text-green-400" />
                            </div>

                            <div className="absolute bottom-2 left-2 right-2">
                                <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1">{project.title}</h4>
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                    <span>@{project.author}</span>
                                    <span className="text-yellow-400 font-bold">{project.materials ? '¥' : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {displayProjects.length === 0 && (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                    <Search size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">没有找到相关项目</p>
                    <button onClick={handleClearFilter} className="mt-4 text-blue-400 text-xs">查看全部</button>
                </div>
            )}

            {/* Load More Trigger */}
            {hasMore && (
                <div className="pb-8 pt-4 flex justify-center">
                    <button 
                        onClick={handleLoadMore}
                        className="bg-gray-800 text-gray-300 px-6 py-2 rounded-full text-xs font-bold border border-gray-700 hover:bg-gray-700 active:scale-95 transition flex items-center gap-2"
                    >
                        <ArrowUpCircle size={14} />
                        加载更多 ({filteredProjects.length - displayProjects.length})
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Discover;
