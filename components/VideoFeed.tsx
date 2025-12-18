
import React, { useState, useMemo, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Search, Bookmark, X, Send, ShieldCheck, Loader2, Crown, Trophy, Play } from 'lucide-react';
import { Project, Comment } from '../types';
import { MOCK_USER } from '../constants';
import { getRecommendedProjects } from '../services/recommendation';
import { api } from '../services/api';

interface VideoFeedProps {
  onSelectProject: (project: Project) => void;
  likedProjectIds: Set<string>;
  favoritedProjectIds: Set<string>;
  followedAuthors: Set<string>;
  toggleLike: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleFollow: (author: string) => void;
  onSearch: () => void;
  onOpenChessPractice?: () => void;
}

// Special promo item ID
const CHESS_PROMO_ID = 'chess_promo_card';
const APP_VERSION = 'v4.1 (Chess Live)'; // Version indicator

const VideoFeed: React.FC<VideoFeedProps> = ({ 
  onSelectProject, 
  likedProjectIds, 
  favoritedProjectIds,
  followedAuthors,
  toggleLike,
  toggleFavorite,
  toggleFollow,
  onSearch,
  onOpenChessPractice
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'following'>('recommended');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load data via API service
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        const data = await api.getProjects();
        setProjects(data);
        setLoading(false);
    };
    loadData();
  }, []);

  const feedProjects = useMemo(() => {
    // Safety check for empty data
    if (!projects || projects.length === 0) return [];
    
    let result: Project[] = [];
    
    if (activeTab === 'following') {
      const following = projects.filter(p => followedAuthors.has(p.author));
      result = following.length > 0 ? following : projects.slice(0, 5);
    } else {
      const allRecommended = getRecommendedProjects(MOCK_USER, projects);
      result = allRecommended.slice(0, 30);
      
      // Inject Chess Promo Card at INDEX 0 (Top of the feed)
      const promo: any = {
          id: CHESS_PROMO_ID,
          title: 'AI 象棋对弈练习',
          author: 'HiExplore 官方',
          videoUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800&auto=format&fit=crop', 
          likes: 99999,
          description: '想锻炼逻辑思维？来和 AI 老师傅下一盘棋。实时复盘，残局推演，看看你能下赢几级 AI。'
      };
      
      // Ensure it is the very first item
      result = [promo, ...result];
    }
    return result;
  }, [activeTab, followedAuthors, projects]);

  if (loading) return <div className="h-full w-full bg-black flex items-center justify-center text-white"><Loader2 size={48} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="relative h-full w-full bg-black text-white">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top h-24 flex items-end justify-center pointer-events-none bg-gradient-to-b from-black/60 via-black/20 to-transparent pb-4">
        {/* Centered Tabs */}
        <div className="flex flex-col items-center pointer-events-auto drop-shadow-md z-30">
           {/* Version Indicator for Debugging */}
           <div className="text-[9px] text-gray-500 font-mono mb-1">{APP_VERSION}</div>
           <div className="flex gap-6 font-bold text-lg">
              <button onClick={() => setActiveTab('following')} className={`transition-opacity duration-300 pb-1 ${activeTab === 'following' ? 'text-white border-b-2 border-white' : 'text-gray-200 opacity-60'}`}>关注</button>
              <button onClick={() => setActiveTab('recommended')} className={`transition-opacity duration-300 pb-1 ${activeTab === 'recommended' ? 'text-white border-b-2 border-white' : 'text-gray-200 opacity-60'}`}>推荐</button>
           </div>
        </div>

        {/* Search Icon - Absolute Right */}
        <button 
            onClick={onSearch} 
            className="absolute right-4 bottom-4 pointer-events-auto p-2 text-white/90 hover:text-white transition-transform active:scale-95 drop-shadow-md z-30"
        >
            <Search size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Floating Action Button (FAB) - FORCE Z-INDEX 9999 */}
      <button 
        onClick={onOpenChessPractice}
        className="fixed right-4 bottom-24 z-[9999] bg-red-600 text-white p-4 rounded-full shadow-2xl border-2 border-white/20 animate-bounce active:scale-95 transition-transform"
        style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)' }}
      >
         <Crown size={24} fill="white" />
         <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">New</div>
      </button>

      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black">
        {feedProjects.map((project, index) => {
            if (project.id === CHESS_PROMO_ID) {
                return (
                    <ChessPromoCard 
                        key={project.id} 
                        project={project} 
                        onOpen={onOpenChessPractice} 
                    />
                );
            }
            return (
              <VideoCard 
                key={project.id} 
                project={project} 
                isActive={true} 
                onSelect={() => onSelectProject(project)}
                isRecommended={activeTab === 'recommended' && index < 3} // Adjust badge logic
                isLiked={likedProjectIds.has(project.id)}
                isFavorited={favoritedProjectIds.has(project.id)}
                isFollowing={followedAuthors.has(project.author)}
                onToggleLike={() => toggleLike(project.id)}
                onToggleFavorite={() => toggleFavorite(project.id)}
                onToggleFollow={() => toggleFollow(project.author)}
              />
            );
        })}
        <div className="snap-start h-16 bg-black"></div>
      </div>
    </div>
  );
};

// Special Promo Card Component
const ChessPromoCard: React.FC<{ project: Project; onOpen?: () => void }> = ({ project, onOpen }) => {
    return (
        <div className="relative h-full w-full snap-start flex items-center justify-center bg-gray-900 overflow-hidden select-none">
            <div className="absolute inset-0">
                <img src={project.videoUrl} className="w-full h-full object-cover opacity-60 scale-105 blur-sm" alt="chess" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm animate-fade-in-up">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6 border-2 border-white/20 transform rotate-3">
                    <Crown size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 leading-tight tracking-tight">AI 象棋<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">巅峰对决</span></h2>
                <p className="text-gray-300 text-sm mb-8 leading-relaxed font-medium">
                    {project.description}
                </p>
                <button 
                    onClick={onOpen}
                    className="bg-white text-black font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                >
                    <Play size={20} fill="black" />
                    立即开始挑战
                </button>
                <div className="mt-6 flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Trophy size={12} /> 实时段位</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span>智能复盘</span>
                </div>
            </div>
        </div>
    );
};

const VideoCard: React.FC<{ 
    project: Project; 
    isActive: boolean; 
    onSelect: () => void;
    isRecommended: boolean;
    isLiked: boolean;
    isFavorited: boolean;
    isFollowing: boolean;
    onToggleLike: () => void;
    onToggleFavorite: () => void;
    onToggleFollow: () => void;
}> = ({ project, onSelect, isRecommended, isLiked, isFavorited, isFollowing, onToggleLike, onToggleFavorite, onToggleFollow }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [imgError, setImgError] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleAction = (fn: () => void, msg: string, e: React.MouseEvent) => {
        e.stopPropagation();
        fn();
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const videoSrc = imgError ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop' : project.videoUrl;

    return (
        <div className="relative h-full w-full snap-start flex items-center justify-center bg-gray-900 overflow-hidden select-none">
          {toast && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-xl z-50 animate-fade-in-up border border-white/10 font-bold">{toast}</div>}

          <div className="absolute inset-0 overflow-hidden bg-black cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
             <img src={videoSrc} onError={() => setImgError(true)} alt={project.title} loading="lazy" className={`w-full h-full object-cover opacity-100 transition-transform ease-linear`} style={{ transform: isPlaying ? 'scale(1.2)' : 'scale(1.0)', transitionDuration: isPlaying ? '20s' : '0.5s' }} />
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20 pointer-events-none">
             <div className="mb-4 pointer-events-auto mr-12">
                 <div className="flex items-center gap-2 mb-2 flex-wrap">
                     <span className="bg-gray-800/80 px-2 py-0.5 rounded text-[10px] text-gray-300">@{project.author}</span>
                     {isRecommended && <span className="bg-blue-600/80 px-2 py-0.5 rounded text-[10px] font-bold">推荐</span>}
                     <span className="bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 rounded text-[10px] text-green-300 flex items-center gap-1"><ShieldCheck size={10} /> AI 校对</span>
                 </div>
                 <h2 className="text-lg font-bold leading-tight mb-2">{project.title}</h2>
                 <p className="text-sm text-gray-200 line-clamp-2 mb-3 opacity-90">{project.description}</p>
                 <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2">进入项目</button>
             </div>
          </div>

          <div className="absolute right-2 bottom-20 flex flex-col gap-6 items-center z-10 pointer-events-auto">
             <div className="relative">
                 <div className="w-10 h-10 rounded-full border border-white bg-gray-800 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author}`} className="w-full h-full" alt="avatar" /></div>
                 {!isFollowing && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5 border border-black cursor-pointer" onClick={(e) => handleAction(onToggleFollow, `已关注 ${project.author}`, e)}><div className="w-3 h-0.5 bg-white rotate-90 absolute top-1.5 left-1" /><div className="w-3 h-0.5 bg-white top-1.5 left-1 relative" /></div>}
             </div>
             <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => handleAction(onToggleLike, isLiked ? "取消点赞" : "已点赞", e)}>
                 <div className={`p-2 rounded-full bg-black/20 backdrop-blur-sm ${isLiked ? 'text-red-500' : 'text-white'}`}><Heart size={28} fill={isLiked ? "currentColor" : "none"} /></div>
                 <span className="text-xs font-bold">{project.likes + (isLiked ? 1 : 0)}</span>
             </div>
             <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
                 <div className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"><MessageCircle size={28} /></div>
                 <span className="text-xs font-bold">{project.comments?.length || 0}</span>
             </div>
             <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => handleAction(onToggleFavorite, isFavorited ? "取消收藏" : "已收藏", e)}>
                 <div className={`p-2 rounded-full bg-black/20 backdrop-blur-sm ${isFavorited ? 'text-yellow-400' : 'text-white'}`}><Bookmark size={28} fill={isFavorited ? "currentColor" : "none"} /></div>
                 <span className="text-xs font-bold">收藏</span>
             </div>
             <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => handleAction(() => {}, "模拟分享：链接已复制", e)}>
                 <div className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white"><Share2 size={28} /></div>
                 <span className="text-xs font-bold">分享</span>
             </div>
          </div>
          {showComments && <CommentDrawer comments={project.comments || []} onClose={() => setShowComments(false)} projectTitle={project.title} projectId={project.id} />}
        </div>
    );
};

const CommentDrawer: React.FC<{ comments: Comment[]; onClose: () => void; projectTitle: string; projectId: string; }> = ({ comments: initialComments, onClose, projectId }) => {
    const [comments, setComments] = useState<Comment[]>(() => {
        try { return JSON.parse(localStorage.getItem(`comments_${projectId}`)!) || initialComments; } catch { return initialComments; }
    });
    const [input, setInput] = useState('');
    useEffect(() => { localStorage.setItem(`comments_${projectId}`, JSON.stringify(comments)); }, [comments, projectId]);

    const handleSend = () => {
        if (!input.trim()) return;
        setComments([{ id: Date.now().toString(), username: MOCK_USER.name, text: input, timestamp: Date.now() }, ...comments]);
        setInput('');
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="bg-gray-900 rounded-t-2xl max-h-[70%] flex flex-col z-10 border-t border-gray-800">
                <div className="p-3 border-b border-gray-800 flex justify-between items-center"><span className="text-sm font-bold">{comments.length} 条评论</span><button onClick={onClose}><X size={18} /></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.map(c => (
                        <div key={c.id} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} alt="avatar" /></div>
                            <div className="flex-1"><div className="text-xs text-gray-400 font-bold mb-0.5">{c.username}</div><div className="text-sm text-gray-200">{c.text}</div></div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-gray-900 border-t border-gray-800 pb-safe-bottom">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="写评论..." className="flex-1 bg-transparent outline-none text-sm text-white" />
                        <button onClick={handleSend} disabled={!input.trim()} className="text-blue-500"><Send size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default VideoFeed;
