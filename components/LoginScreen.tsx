
import React, { useState, useEffect } from 'react';
import { Smartphone, MessageSquare, ArrowRight, Loader2, CheckCircle2, QrCode, UserCircle2, Crown, Activity, Wifi, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { AI_PROVIDER, USE_PROXY } from '../config';

interface LoginScreenProps {
  onLogin: (userProfile: Partial<UserProfile>) => void;
}

const APP_VERSION = 'v4.4 (Manual Deploy)';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<'phone' | 'wechat'>('phone');
  
  // Phone State
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'verify'>('input');

  // WeChat State
  const [qrScanned, setQrScanned] = useState(false);

  // Debug State
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMsg, setPingMsg] = useState('');

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendCode = () => {
    if (phone.length !== 11) {
      alert("请输入有效的11位手机号码");
      return;
    }
    setLoading(true);
    // Simulate network request
    setTimeout(() => {
      setLoading(false);
      setTimer(60);
      setStep('verify');
      alert(`[HiExplore] 您的验证码是: 8888`); 
    }, 1000);
  };

  const handlePhoneLogin = async () => {
    if (code !== '8888') {
      alert("验证码错误 (测试请用 8888)");
      return;
    }
    setLoading(true);
    
    // Call the unified API layer
    const result = await api.login(phone, code);
    
    if (result.success) {
        onLogin({
            ...result.user,
            skillLevel: 'Beginner',
            interests: ['新手入门']
        });
    } else {
        alert("登录失败，请重试");
        setLoading(false);
    }
  };

  const handleWeChatMock = () => {
    setLoading(true);
    setTimeout(() => {
        setQrScanned(true);
        setTimeout(() => {
            const mockUser: Partial<UserProfile> = {
                name: `HiExplore 用户_${Math.floor(Math.random()*1000)}`,
                id: `wx_${Date.now()}`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=wx_${Date.now()}`,
                skillLevel: 'Beginner',
                interests: ['科技', '创意']
            };
            onLogin(mockUser);
        }, 1500);
    }, 1500);
  };

  // Guest Login
  const handleGuestLogin = () => {
      onLogin({
          name: '游客',
          id: 'guest',
          skillLevel: 'Beginner',
          interests: ['游客体验']
      });
  };

  // --- Network Diagnosis ---
  const checkAIConnection = async () => {
      setPingStatus('testing');
      setPingMsg('正在测试 AI 连通性...');
      
      let url = '';
      if (AI_PROVIDER === 'qwen') {
          url = USE_PROXY ? '/qwen-api/chat/completions' : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      } else if (AI_PROVIDER === 'deepseek') {
          url = USE_PROXY ? '/deepseek-api/chat/completions' : 'https://api.deepseek.com/chat/completions';
      } else {
          url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=TEST';
      }

      try {
          // We expect a 401 (Unauthorized) or 400 because we aren't sending a real body/key,
          // but getting a response means the Network Path is open.
          // If we get a TypeError (Network Error), it means blocked.
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 5000);
          
          const res = await fetch(url, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal
          });
          clearTimeout(id);

          if (res.status === 404 && USE_PROXY) {
              setPingStatus('error');
              setPingMsg('❌ 代理 404: Vercel 配置未生效');
          } else if (res.status === 401 || res.status === 400 || res.ok) {
              setPingStatus('success');
              setPingMsg(`✅ 连接成功 (${AI_PROVIDER})`);
          } else {
              setPingStatus('error');
              setPingMsg(`⚠️ 状态码: ${res.status}`);
          }
      } catch (e: any) {
          setPingStatus('error');
          setPingMsg(`❌ 连接失败: ${e.name === 'AbortError' ? '超时' : '网络错误 (CORS/VPN)'}`);
      }
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-900/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[100px]" />

      <div className="z-10 w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight">HiExplore</h1>
          <p className="text-gray-400 text-sm">欢迎来到 AI 实践实验室</p>
        </div>
        
        {/* Feature Highlight */}
        <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl p-4 mb-8 flex items-center gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-[9px] font-bold text-white rounded-bl-lg">NEW</div>
             <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/30">
                 <Crown className="text-red-500" size={24} />
             </div>
             <div className="text-left">
                 <h3 className="font-bold text-white text-sm">上线了！AI 象棋助手</h3>
                 <p className="text-xs text-gray-500">不用登录，先去体验一下？</p>
             </div>
             <button onClick={handleGuestLogin} className="ml-auto bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-200">
                 去体验
             </button>
        </div>

        {/* Method Tabs */}
        <div className="flex bg-gray-900/50 p-1 rounded-xl mb-8 border border-gray-800">
          <button 
            onClick={() => setMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${method === 'phone' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500'}`}
          >
            <Smartphone size={18} /> 手机号登录
          </button>
          <button 
             onClick={() => setMethod('wechat')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${method === 'wechat' ? 'bg-[#07C160]/20 text-[#07C160] shadow-lg border border-[#07C160]/30' : 'text-gray-500'}`}
          >
            <MessageSquare size={18} /> 微信一键登录
          </button>
        </div>

        {method === 'phone' && (
          <div className="space-y-4">
            {step === 'input' ? (
                <div className="space-y-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-blue-500 transition-colors">
                        <span className="text-gray-400 font-bold">+86</span>
                        <input 
                            type="tel" 
                            className="bg-transparent border-none outline-none text-white w-full font-medium"
                            placeholder="请输入手机号码"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                            maxLength={11}
                        />
                    </div>
                    <button 
                        onClick={handleSendCode}
                        disabled={phone.length < 11 || loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            phone.length === 11 && !loading 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>获取验证码 <ArrowRight size={20} /></>}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="text-center mb-2">
                        <span className="text-gray-400 text-xs">验证码已发送至 +86 {phone}</span>
                    </div>
                    <div className="flex gap-2 justify-center">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="w-12 h-14 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-xl font-bold relative">
                                {code[i] || ''}
                                {code.length === i && <div className="absolute w-0.5 h-6 bg-blue-500 animate-pulse" />}
                            </div>
                        ))}
                    </div>
                    {/* Hidden Input for capturing typing */}
                    <input 
                        className="opacity-0 absolute inset-0 z-0 h-0"
                        value={code}
                        onChange={e => setCode(e.target.value.slice(0, 4))}
                        autoFocus
                    />
                    
                    {/* Virtual Keypad Simulation */}
                    <input 
                        type="tel"
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center tracking-[1em] font-bold text-white focus:border-blue-500 outline-none"
                        placeholder="----"
                        value={code}
                        onChange={e => setCode(e.target.value.slice(0, 4))}
                        maxLength={4}
                    />

                    <button 
                        onClick={handlePhoneLogin}
                        disabled={code.length < 4 || loading}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            code.length === 4 && !loading
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                         {loading ? <Loader2 size={20} className="animate-spin" /> : '登录 / 注册'}
                    </button>
                    
                    <div className="text-center">
                        <button 
                            disabled={timer > 0}
                            onClick={handleSendCode}
                            className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                            {timer > 0 ? `${timer}秒后重新获取` : '重新获取验证码'}
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}

        {method === 'wechat' && (
             <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in-up">
                 <div className="w-48 h-48 bg-white p-2 rounded-xl relative group cursor-pointer" onClick={handleWeChatMock}>
                     {/* Mock QR */}
                     <div className="w-full h-full border-4 border-black flex items-center justify-center relative overflow-hidden">
                        {!qrScanned ? (
                             <QrCode size={120} className="text-black" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-green-600 animate-scale-in">
                                <CheckCircle2 size={64} />
                                <span className="font-bold mt-2">扫描成功</span>
                            </div>
                        )}
                        {!qrScanned && !loading && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_10px_#07C160] animate-[scan_2s_linear_infinite]" />
                        )}
                        {loading && !qrScanned && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                                <Loader2 size={32} className="text-green-600 animate-spin" />
                            </div>
                        )}
                     </div>
                 </div>
                 
                 <div className="text-center space-y-2">
                     <p className="text-white font-bold">{qrScanned ? '正在登录...' : '微信扫码登录'}</p>
                     <p className="text-xs text-gray-500">{qrScanned ? '请在手机上确认授权' : '使用微信扫一扫登录 HiExplore'}</p>
                 </div>
             </div>
        )}
        
        {method !== 'phone' && (
             <div className="mt-8 text-center">
                 <button onClick={handleGuestLogin} className="text-xs text-gray-500 hover:text-white flex items-center justify-center gap-1 mx-auto">
                     <UserCircle2 size={14} /> 我是新用户，先随便逛逛
                 </button>
             </div>
        )}
      </div>

      {/* --- DEBUG & VERSION FOOTER --- */}
      <div className="fixed bottom-4 flex flex-col items-center gap-2">
         <div 
            onClick={checkAIConnection}
            className={`px-3 py-1 rounded-full text-[10px] border flex items-center gap-1.5 cursor-pointer transition-colors ${
                pingStatus === 'success' ? 'bg-green-900/30 border-green-500/30 text-green-400' :
                pingStatus === 'error' ? 'bg-red-900/30 border-red-500/30 text-red-400' :
                'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'
            }`}
         >
             {pingStatus === 'testing' ? <Loader2 size={10} className="animate-spin" /> : <Activity size={10} />}
             {pingMsg || '点击测试 AI 连通性'}
         </div>
         <div className="text-[9px] text-gray-600 font-mono">
            Build: {APP_VERSION}
         </div>
      </div>
    </div>
  );
};

export default LoginScreen;
