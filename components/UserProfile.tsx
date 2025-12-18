import React, { useState, useRef } from 'react';
import { Settings, Share2, Grid, Heart, Star, Bookmark, Search, Edit2, Check, X, ExternalLink, Trash2, Info, ChevronRight, LogOut } from 'lucide-react';
import { UserProfile as UserProfileType, Project } from '../types';

interface UserProfileProps {
  user: UserProfileType;
  projects: Project[]; // All projects to lookup from
  likedProjectIds: Set<string>;
  favoritedProjectIds: Set<string>;
  followedAuthors: Set<string>;
  onSelectProject: (project: Project) => void;
  onUpdateProfile: (updates: Partial<UserProfileType>) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  projects, 
  likedProjectIds, 
  favoritedProjectIds, 
  followedAuthors,
  onSelectProject,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'works' | 'likes' | 'favorites'>('favorites');
  const [showSettings, setShowSettings] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio || "");

  const handleSaveProfile = () => {
    onUpdateProfile({
        name: editName,
        bio: editBio
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(user.name);
    setEditBio(user.bio || "");
    setIsEditing(false);
  };

  const handleClearCache = () => {
    if (confirm('确定要清除缓存吗？这将重置所有本地数据并刷新页面。')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  // Filter projects based on active tab
  const displayProjects = projects.filter(p => {
    if (activeTab === 'likes') return likedProjectIds.has(p.id);
    if (activeTab === 'favorites') return favoritedProjectIds.has(p.id);
    if (activeTab === 'works') return p.author === user.name;
    return false; 
  });

  const handleNativeShare = async () => {
      if (navigator.share) {
        try {
            await navigator.share({
                title: user.name,
                text: `查看 ${user.name} 的 HiExplore 主页`,
                url: window.location.href
            });
        } catch (e) { console.log('Share dismissed'); }
      } else {
          alert("已复制主页链接！");
      }
  };

  return (
    <div className="h-full w-full bg-black text-white overflow-y-auto pb-20 no-scrollbar relative">
      
      {/* Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            <div className="bg-gray-900 rounded-t-2xl z-10 border-t border-gray-800 animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 rounded-t-2xl z-20">
                    <h2 className="text-lg font-bold text-white">设置与合作</h2>
                    <button onClick={() => setShowSettings(false)} className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white"><X size={18}/></button>
                </div>
                
                <div className="overflow-y-auto p-4 space-y-6 pb-safe-bottom">
                    {/* Official Cooperation */}
                    <div className="space-y-2">
                       <h3 className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-wider">官方合作渠道</h3>
                       <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-lg">
                           <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                               官方认证
                           </div>
                           
                           <div className="flex flex-col items-center mb-4">
                               <div className="w-16 h-16 rounded-full bg-gray-700 mb-3 overflow-hidden border-2 border-white/20 shadow-xl">
                                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Chen" alt="陈老师" />
                               </div>
                               <h3 className="font-bold text-lg text-white">陈海雁 (陈老师)</h3>
                               <p className="text-xs text-gray-400 mt-1">HiExplore 创始人 / 课程咨询 / 商务合作</p>
                           </div>

                           <div className="bg-white p-3 rounded-xl shadow-inner mb-3">
                               {/* Placeholder for the user-provided QR code */}
                               <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://u.wechat.com/HiExplore_Chen&color=000000&bgcolor=ffffff`} 
                                    alt="陈老师二维码" 
                                    className="w-40 h-40 object-contain" 
                               />
                           </div>
                           <p className="text-[10px] text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                               长按保存或使用微信扫一扫
                           </p>
                       </div>
                    </div>

                    {/* Basic Settings */}
                    <div className="space-y-2">
                       <h3 className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-wider">通用设置</h3>
                       <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700/50">
                           <button onClick={handleClearCache} className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition active:bg-gray-700 border-b border-gray-700/50">
                               <div className="flex items-center gap-3">
                                   <div className="bg-red-500/10 p-2 rounded-lg text-red-400"><Trash2 size={18} /></div>
                                   <div className="text-left">
                                       <div className="font-medium text-sm text-gray-200">清除缓存</div>
                                       <div className="text-[10px] text-gray-500">修复显示异常，重置本地数据</div>
                                   </div>
                               </div>
                               <ChevronRight size={16} className="text-gray-600" />
                           </button>
                           
                           <button className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition active:bg-gray-700">
                               <div className="flex items-center gap-3">
                                   <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><Info size={18} /></div>
                                   <div className="text-left">
                                       <div className="font-medium text-sm text-gray-200">关于 HiExplore</div>
                                       <div className="text-[10px] text-gray-500">当前版本 v1.2.4 (Beta)</div>
                                   </div>
                               </div>
                               <span className="text-xs text-gray-500">已是最新</span>
                           </button>
                       </div>
                    </div>

                    <button 
                        onClick={() => {
                            if(confirm('确定退出登录吗？')) window.location.reload();
                        }} 
                        className="w-full bg-gray-800/50 text-red-400 font-bold py-3.5 rounded-xl border border-gray-800 hover:bg-gray-800 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> 退出登录
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header / Banner */}
      <div className="relative h-32 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center z-10">
            <div className="flex-1 bg-black/30 backdrop-blur-md rounded-full flex items-center px-3 py-2 border border-white/10 mr-3 transition-colors focus-within:bg-black/50 focus-within:border-blue-500/50 group">
                <Search size={14} className="text-gray-400 mr-2 shrink-0 group-focus-within:text-blue-400" />
                <input 
                    type="text" 
                    placeholder="搜索我的收藏、喜欢..." 
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-400 w-full" 
                />
            </div>
            <div className="flex gap-3 items-center">
                <button 
                    onClick={() => setShowSettings(true)}
                    className="bg-black/30 p-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-gray-800 transition active:scale-95"
                >
                    <Settings className="text-white w-4 h-4" />
                </button>
                <button 
                    onClick={handleNativeShare}
                    className="bg-black/30 p-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-gray-800 transition active:scale-95"
                >
                    <Share2 className="text-white w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 relative -top-12 mb-4">
        <div className="flex justify-between items-end mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-black bg-gray-700 overflow-hidden shadow-xl relative group">
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editName}`} 
                    alt="avatar" 
                    className="w-full h-full"
                />
            </div>
            
            <div className="flex gap-2 mb-4">
                {isEditing ? (
                    <>
                        <button 
                            onClick={handleCancelEdit}
                            className="bg-gray-800 px-4 py-2 rounded-md font-semibold text-sm border border-gray-700 hover:bg-gray-700 transition active:scale-95 flex items-center gap-1"
                        >
                            <X size={14} /> 取消
                        </button>
                        <button 
                            onClick={handleSaveProfile}
                            className="bg-blue-600 px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-500 transition active:scale-95 flex items-center gap-1"
                        >
                            <Check size={14} /> 保存
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-800 px-6 py-2 rounded-md font-semibold text-sm border border-gray-700 hover:bg-gray-700 transition active:scale-95 flex items-center gap-1"
                    >
                        <Edit2 size={14} /> 编辑资料
                    </button>
                )}
            </div>
        </div>

        {isEditing ? (
            <div className="mb-4 space-y-2">
                <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded p-2 w-full text-white font-bold"
                />
                <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded p-2 w-full text-sm text-gray-300 h-20 resize-none"
                    placeholder="写点什么介绍自己..."
                />
            </div>
        ) : (
            <>
                <h1 className="text-xl font-bold mb-1">{user.name}</h1>
                <p className="text-gray-400 text-sm mb-4">@{user.id} • {user.skillLevel} Maker</p>
                
                <div className="flex gap-6 mb-4 text-sm cursor-pointer">
                    <div><span className="font-bold text-white mr-1">{followedAuthors.size}</span><span className="text-gray-400">关注</span></div>
                    <div><span className="font-bold text-white mr-1">{user.stats?.followers || 348}</span><span className="text-gray-400">粉丝</span></div>
                    <div><span className="font-bold text-white mr-1">{likedProjectIds.size}</span><span className="text-gray-400">喜欢</span></div>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed mb-4">
                    {user.bio || "这个人很懒，什么都没写。"}
                </p>

                {/* Web Link */}
                <a href="https://www.hiexplore.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 text-sm hover:underline bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-500/20 mb-3">
                    <ExternalLink size={14} /> 访问 HiExplore 官网工作台
                </a>
            </>
        )}
        
        {/* Interests Tags */}
        <div className="flex gap-2 mt-2 flex-wrap">
            {user.interests.map(tag => (
                <span 
                    key={tag} 
                    className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300 border border-gray-700"
                >
                    {tag}
                </span>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-800 flex sticky top-0 bg-black z-10 shadow-lg">
        <button 
            onClick={() => setActiveTab('works')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-colors ${activeTab === 'works' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}
        >
            <Grid size={20} />
        </button>
        <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-colors ${activeTab === 'favorites' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}
        >
            <Bookmark size={20} />
        </button>
        <button 
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-colors ${activeTab === 'likes' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}
        >
            <Heart size={20} />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-0.5 pb-safe-bottom">
        {displayProjects.length > 0 ? (
            displayProjects.map(project => (
                <div 
                    key={project.id} 
                    className="aspect-[3/4] bg-gray-800 relative cursor-pointer group overflow-hidden active:opacity-90"
                    onClick={() => onSelectProject(project)}
                >
                    <img 
                        src={project.videoUrl} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white drop-shadow-md">
                        {activeTab === 'likes' ? <Heart size={12} fill="white" /> : <Star size={12} fill="white" />}
                        <span className="text-xs font-bold">{project.likes}</span>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-3 py-20 flex flex-col items-center justify-center text-gray-500">
                <Bookmark size={48} className="mb-2 opacity-30" />
                <p className="text-sm">暂无内容</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;