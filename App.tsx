
import React, { useState, useEffect, useCallback } from 'react';
import { Home, Lightbulb, Compass, User, Zap, Sparkles, Rocket, ChevronRight, Crown, X } from 'lucide-react';
import VideoFeed from './components/VideoFeed';
import ProjectDetail from './components/ProjectDetail';
import IdeaLab from './components/IdeaLab';
import UserProfile from './components/UserProfile';
import Discover from './components/Discover';
import LoginScreen from './components/LoginScreen';
import ChessPractice from './components/ChessPractice';
import { Project, ViewState, UserProfile as UserProfileType } from './types';
import { MOCK_PROJECTS, MOCK_USER } from './constants';

// --- Safe Storage Helper ---
const safeLocalStorage = {
  getItem: (key: string, defaultVal: any) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e);
      return defaultVal;
    }
  },
  setItem: (key: string, val: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage`, e);
    }
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // App Flow State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  // --- Global Persistent State ---
  const [userProfile, setUserProfile] = useState<UserProfileType>(() => 
    safeLocalStorage.getItem('app_user_profile', MOCK_USER)
  );
  const [likedProjectIds, setLikedProjectIds] = useState<Set<string>>(() => 
    new Set(safeLocalStorage.getItem('user_likes', []))
  );
  const [favoritedProjectIds, setFavoritedProjectIds] = useState<Set<string>>(() => 
    new Set(safeLocalStorage.getItem('user_favorites', []))
  );
  const [followedAuthors, setFollowedAuthors] = useState<Set<string>>(() => 
    new Set(safeLocalStorage.getItem('user_follows', []))
  );

  // --- Persistence Effects ---
  useEffect(() => {
    const hasSeenOnboarding = safeLocalStorage.getItem('has_seen_onboarding', false);
    const storedAuth = safeLocalStorage.getItem('is_authenticated', false);
    
    // Check if user has seen the Chess Feature announcement
    const hasSeenChessIntro = safeLocalStorage.getItem('has_seen_chess_v1', false);
    
    setIsAuthenticated(storedAuth);
    if (!hasSeenOnboarding) {
        setShowOnboarding(true);
    } else if (!hasSeenChessIntro && storedAuth) {
        // Show Chess Promo Modal if logged in and hasn't seen it
        setTimeout(() => setShowFeatureModal(true), 1000);
    }
  }, []);

  useEffect(() => { safeLocalStorage.setItem('app_user_profile', userProfile); }, [userProfile]);
  useEffect(() => { safeLocalStorage.setItem('user_likes', Array.from(likedProjectIds)); }, [likedProjectIds]);
  useEffect(() => { safeLocalStorage.setItem('user_favorites', Array.from(favoritedProjectIds)); }, [favoritedProjectIds]);
  useEffect(() => { safeLocalStorage.setItem('user_follows', Array.from(followedAuthors)); }, [followedAuthors]);
  useEffect(() => { safeLocalStorage.setItem('is_authenticated', isAuthenticated); }, [isAuthenticated]);

  // --- Action Handlers ---
  const handleFinishOnboarding = () => {
      setShowOnboarding(false);
      safeLocalStorage.setItem('has_seen_onboarding', true);
  };

  const handleCloseFeatureModal = () => {
      setShowFeatureModal(false);
      safeLocalStorage.setItem('has_seen_chess_v1', true);
  };

  const handleGoToChess = () => {
      handleCloseFeatureModal();
      setView(ViewState.CHESS_PRACTICE);
  };

  const handleLogin = (profileUpdates: Partial<UserProfileType>) => {
      setUserProfile(prev => ({ ...prev, ...profileUpdates }));
      setIsAuthenticated(true);
      // Check feature modal again after login
      const hasSeenChessIntro = safeLocalStorage.getItem('has_seen_chess_v1', false);
      if (!hasSeenChessIntro) {
          setTimeout(() => setShowFeatureModal(true), 500);
      }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setView(ViewState.DETAIL);
  };

  const handleBackToFeed = () => {
    setView(ViewState.FEED);
    setSelectedProject(null);
  };

  const toggleLike = (id: string) => {
    setLikedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavoritedProjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFollow = (authorName: string) => {
    setFollowedAuthors(prev => {
      const next = new Set(prev);
      if (next.has(authorName)) next.delete(authorName);
      else next.add(authorName);
      return next;
    });
  };

  const updateUserProfile = (updates: Partial<UserProfileType>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  // 1. Onboarding Screen
  if (showOnboarding) {
      return (
          <div className="fixed inset-0 h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden z-50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/20 to-black z-0" />
              <div className="z-10 flex flex-col items-center text-center animate-fade-in-up">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30">
                      <Zap size={48} className="text-white fill-white" />
                  </div>
                  <h1 className="text-3xl font-black text-white mb-2 tracking-tight">HiExplore</h1>
                  <p className="text-gray-400 mb-10 text-sm max-w-[260px]">你的移动端 AI 实践伴侣<br/>连接灵感与现实</p>
                  <button onClick={handleFinishOnboarding} className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-gray-200 transition active:scale-95">
                      开启探索之旅 <ChevronRight size={18} />
                  </button>
              </div>
          </div>
      );
  }

  // 2. Login Screen
  if (!isAuthenticated) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    // FIX: Using 'fixed inset-0' is more robust on iOS Safari than h-full/h-screen inside body
    // This pins the app to the viewport, preventing the bottom bar from being pushed off by the browser chrome.
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col bg-black overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      
      {/* Global Feature Announcement Modal */}
      {showFeatureModal && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in-up">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl">
                  <button onClick={handleCloseFeatureModal} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
                  <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg border-2 border-white/10">
                          <Crown size={40} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">新功能: AI 象棋</h2>
                      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                          HiExplore 实验室新增“象棋实践助手”。<br/>
                          不仅能下棋，还能帮你<strong>复盘分析</strong>每一手棋的优劣。挑战一下？
                      </p>
                      <button 
                          onClick={handleGoToChess}
                          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition active:scale-95 flex items-center justify-center gap-2"
                      >
                          <Rocket size={18} /> 立即体验
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {/* Persistent Views - IdeaLab stays mounted to keep AI conversation alive */}
        <div className={`h-full w-full ${view === ViewState.IDEA_LAB ? 'block' : 'hidden'}`}>
            <IdeaLab onOpenChess={() => setView(ViewState.CHESS_PRACTICE)} />
        </div>

        {/* Conditional Views */}
        {view === ViewState.FEED && (
          <VideoFeed 
            onSelectProject={handleSelectProject} 
            likedProjectIds={likedProjectIds}
            favoritedProjectIds={favoritedProjectIds}
            followedAuthors={followedAuthors}
            toggleLike={toggleLike}
            toggleFavorite={toggleFavorite}
            toggleFollow={toggleFollow}
            onSearch={() => setView(ViewState.DISCOVER)}
            onOpenChessPractice={() => setView(ViewState.CHESS_PRACTICE)}
          />
        )}
        {view === ViewState.DETAIL && selectedProject && (
          <ProjectDetail 
            key={selectedProject.id} /* CRITICAL FIX: Force re-mount on project change */
            project={selectedProject} 
            onBack={handleBackToFeed}
            isLiked={likedProjectIds.has(selectedProject.id)}
            isFavorited={favoritedProjectIds.has(selectedProject.id)}
            onToggleLike={() => toggleLike(selectedProject.id)}
            onToggleFavorite={() => toggleFavorite(selectedProject.id)}
          />
        )}
        {view === ViewState.DISCOVER && (
          <Discover 
             onSelectProject={handleSelectProject} 
             onOpenChessPractice={() => setView(ViewState.CHESS_PRACTICE)}
          />
        )}
        {view === ViewState.CHESS_PRACTICE && (
            <ChessPractice onBack={() => setView(ViewState.FEED)} />
        )}
        {view === ViewState.USER_PROFILE && (
          <UserProfile 
            user={userProfile} 
            projects={MOCK_PROJECTS}
            likedProjectIds={likedProjectIds}
            favoritedProjectIds={favoritedProjectIds}
            followedAuthors={followedAuthors}
            onSelectProject={handleSelectProject}
            onUpdateProfile={updateUserProfile}
          />
        )}
      </div>
      
      {/* Tab Bar - Hidden only in Detail view */}
      {view !== ViewState.DETAIL && (
        <div className="bg-black border-t border-gray-900 flex justify-around items-center px-2 z-50 shrink-0 h-16 safe-area-pb">
          <button onClick={() => setView(ViewState.FEED)} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${view === ViewState.FEED ? 'text-white' : 'text-gray-500'}`}>
            <Home size={24} strokeWidth={view === ViewState.FEED ? 2.5 : 2} />
            <span className="text-[10px] font-medium">推荐</span>
          </button>
          
          <button onClick={() => setView(ViewState.IDEA_LAB)} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${view === ViewState.IDEA_LAB ? 'text-purple-400' : 'text-gray-500'}`}>
            <Lightbulb size={24} strokeWidth={view === ViewState.IDEA_LAB ? 2.5 : 2} />
            <span className="text-[10px] font-medium">实验室</span>
          </button>

          {/* NEW: Dedicated Chess Tab */}
          <button onClick={() => setView(ViewState.CHESS_PRACTICE)} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${view === ViewState.CHESS_PRACTICE ? 'text-red-500' : 'text-gray-500'}`}>
             <div className={`p-1 rounded-full ${view === ViewState.CHESS_PRACTICE ? 'bg-red-500/20' : ''}`}>
               <Crown size={24} strokeWidth={view === ViewState.CHESS_PRACTICE ? 2.5 : 2} />
             </div>
             <span className="text-[10px] font-medium">AI 象棋</span>
          </button>
          
          <button onClick={() => setView(ViewState.DISCOVER)} className={`flex flex-col items-center gap-1 p-2 w-14 transition-colors ${view === ViewState.DISCOVER ? 'text-blue-400' : 'text-gray-500'}`}>
             <Compass size={24} strokeWidth={view === ViewState.DISCOVER ? 2.5 : 2} />
             <span className="text-[10px] font-medium">发现</span>
          </button>
          
          <button onClick={() => setView(ViewState.USER_PROFILE)} className={`flex-col items-center gap-1 p-2 w-14 flex transition-colors ${view === ViewState.USER_PROFILE ? 'text-white' : 'text-gray-500'}`}>
             <User size={24} strokeWidth={view === ViewState.USER_PROFILE ? 2.5 : 2} />
             <span className="text-[10px] font-medium">我</span>
          </button>
        </div>
      )}
      <style>{`
        .safe-area-pb {
            padding-bottom: max(4px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
};

export default App;
