
import { GoogleGenAI } from "@google/genai";
import { Project, ChatMessage, ResearchMission, ResearchLog } from "../types";
import { DEEPSEEK_API_KEY, DASHSCOPE_API_KEY, AI_PROVIDER, USE_PROXY, API_KEY as CONFIG_API_KEY } from "../config";

// Ensure we have a valid API Key
const getApiKey = () => process.env.API_KEY || CONFIG_API_KEY;

// Helper to initialize AI client with potential proxy
const createGeminiClient = (apiKey: string) => {
    return new GoogleGenAI({
        apiKey
    });
};

// Helper for fetch with timeout (15s default)
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
             throw new Error('请求超时 (15s Timeout). 建议检查网络或 VPN。');
        }
        throw error;
    }
};

// --- Streaming Generators ---

// 1. Qwen (Aliyun) Streaming
async function* streamQwen(messages: any[], systemInstruction: string) {
    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY.includes("YourDashScopeKeyHere")) {
        throw new Error("请在 config.ts 中配置阿里通义千问 API Key");
    }

    let baseUrl = USE_PROXY ? '/qwen-api' : 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const model = 'qwen-turbo'; 
    const headers: any = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
        "X-DashScope-SSE": "enable"
    };

    let response: Response;

    try {
        // Attempt 1: Try configured URL (Proxy)
        try {
            response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model,
                    messages: [{ role: "system", content: systemInstruction }, ...messages],
                    stream: true,
                    temperature: 0.5 
                })
            });
        } catch (e) {
            // Network error (e.g. Proxy not found), trigger fallback logic below
            response = { ok: false, status: 0 } as Response;
        }

        // Fallback: If Proxy 404s (e.g. static build) or fails, try Direct
        if ((!response.ok && (response.status === 404 || response.status === 0)) && USE_PROXY) {
            console.warn("Proxy endpoint failed, falling back to Direct Aliyun API...");
            baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
            response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model,
                    messages: [{ role: "system", content: systemInstruction }, ...messages],
                    stream: true,
                    temperature: 0.5 
                })
            });
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Qwen Error ${response.status}: ${errText.slice(0, 100)}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                if (trimmed.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices[0]?.delta?.content || "";
                        if (content) yield content;
                    } catch (e) { }
                }
            }
        }
    } catch (e: any) {
        console.error("Qwen Stream Exception:", e);
        throw e;
    }
}

// 2. DeepSeek Streaming
async function* streamDeepSeek(messages: any[], systemInstruction: string) {
  if (!DEEPSEEK_API_KEY) throw new Error("Missing DeepSeek API Key");

  let baseUrl = USE_PROXY ? '/deepseek-api' : 'https://api.deepseek.com';
  let response: Response;

  const reqBody = {
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemInstruction }, ...messages],
      stream: true, 
      temperature: 1.3 
  };
  const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
  };

  try {
    try {
        response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers, body: JSON.stringify(reqBody) });
    } catch(e) { response = { ok: false, status: 0 } as Response; }

    // Fallback logic
    if ((!response.ok && (response.status === 404 || response.status === 0)) && USE_PROXY) {
         console.warn("Proxy failed, falling back to Direct DeepSeek API...");
         baseUrl = 'https://api.deepseek.com';
         response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers, body: JSON.stringify(reqBody) });
    }

    if (!response.ok) throw new Error(`DeepSeek Error: ${response.status}`);
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; 

        for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
            try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices[0]?.delta?.content || "";
            if (content) yield content;
            } catch (e) { }
        }
        }
    }
  } catch (e: any) {
      console.error("DeepSeek Stream Exception:", e);
      throw e;
  }
}

// 3. Gemini Streaming
async function* streamGemini(contents: any[], systemInstruction: string) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing Gemini API Key");
    
    // Default to Direct SDK unless proxy is specifically requested AND works
    // If USE_PROXY is true, we try the fetch method first.
    
    if (USE_PROXY) {
        try {
            const baseUrl = '/google-api';
            const model = 'gemini-2.5-flash';
            const url = `${baseUrl}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
            
            const body: any = {
                contents: contents,
                generationConfig: { temperature: 0.7 }
            };
            if (systemInstruction) {
                body.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // Only consume body if 200 OK. If 404/500, throw to trigger fallback.
            if (!response.ok) throw new Error(`Proxy error ${response.status}`);
            
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunkText = decoder.decode(value, { stream: true });
                    const lines = chunkText.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const jsonStr = line.substring(5).trim();
                                if (!jsonStr) continue;
                                const json = JSON.parse(jsonStr);
                                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) yield text;
                            } catch (e) { }
                        }
                    }
                }
                return; // Proxy success
            }
        } catch (e) {
            console.warn("Gemini Proxy Stream failed, falling back to Direct SDK...", e);
            // Fall through to Direct SDK
        }
    }

    // Direct SDK Fallback (Robust)
    const ai = createGeminiClient(apiKey);
    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction }
        });

        for await (const chunk of response) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (e) {
        console.error("Gemini Direct Stream Error", e);
        throw e;
    }
}

// --- Non-Streaming Implementations ---

const callQwen = async (
    messages: { role: string; content: string }[],
    systemInstruction: string
): Promise<string> => {
    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY.includes("YourDashScopeKeyHere")) {
        return "请配置阿里通义千问 API Key";
    }

    let baseUrl = USE_PROXY ? '/qwen-api' : 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`
    };
    const body = JSON.stringify({
        model: "qwen-turbo", 
        messages: [{ role: "system", content: systemInstruction }, ...messages],
        stream: false
    });

    try {
        let response: Response;
        try {
             response = await fetchWithTimeout(`${baseUrl}/chat/completions`, { method: "POST", headers, body }, 12000);
        } catch(e) { response = { ok: false, status: 0 } as Response; }

        // Fallback
        if ((!response.ok && (response.status === 404 || response.status === 0)) && USE_PROXY) {
            baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
            response = await fetchWithTimeout(`${baseUrl}/chat/completions`, { method: "POST", headers, body }, 12000);
        }

        if (!response.ok) {
            if (response.status === 401) throw new Error("API Key 无效或过期");
            throw new Error(`Qwen Error: ${response.status}`);
        }
        
        const json = await response.json();
        return json.choices[0]?.message?.content || "";
    } catch (e: any) {
        console.error("Qwen Call Error", e);
        throw e; 
    }
};

const callDeepSeek = async (
  messages: { role: string; content: string }[],
  systemInstruction: string
): Promise<string> => {
  if (!DEEPSEEK_API_KEY) return "请配置 DeepSeek API Key";

  let baseUrl = USE_PROXY ? '/deepseek-api' : 'https://api.deepseek.com';
  const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
  };
  const body = JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemInstruction }, ...messages],
      stream: false
  });
  
  try {
    let response: Response;
    try {
        response = await fetchWithTimeout(`${baseUrl}/chat/completions`, { method: "POST", headers, body }, 12000);
    } catch(e) { response = { ok: false, status: 0 } as Response; }

    if ((!response.ok && (response.status === 404 || response.status === 0)) && USE_PROXY) {
         baseUrl = 'https://api.deepseek.com';
         response = await fetchWithTimeout(`${baseUrl}/chat/completions`, { method: "POST", headers, body }, 12000);
    }

    if (!response.ok) throw new Error(`DeepSeek Error: ${response.status}`);
    const json = await response.json();
    return json.choices[0]?.message?.content || "";
  } catch (e: any) {
    console.error("DeepSeek Call Error", e);
    throw e;
  }
};

const callGemini = async (
    contents: any[],
    systemInstruction: string
): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Error: No Gemini API Key";

    if (USE_PROXY) {
        try {
            const baseUrl = '/google-api'; 
            const model = 'gemini-2.5-flash';
            
            const body: any = {
                contents: contents,
                generationConfig: { temperature: 0.7 }
            };
            if (systemInstruction) {
                body.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await fetchWithTimeout(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }, 10000);

            if (!response.ok) throw new Error(`Proxy status: ${response.status}`);

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (e) {
            console.warn("Gemini Proxy Call failed, attempting Direct connection...", e);
        }
    }

    try {
        const ai = createGeminiClient(apiKey);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction }
        });
        return response.text || "";
    } catch (e) {
        console.error("Gemini Direct Call Error", e);
        throw e;
    }
};

// ================= EXPORTED FUNCTIONS (ROUTER) =================

export const streamIdea = async (
  userText: string,
  history: ChatMessage[],
  mode: 'assist' | 'simulate' | 'delegate',
  onChunk: (chunk: string) => void
) => {
    const systemPrompt = `You are an AI innovation partner in the HiExplore Lab. 
    Current Mode: ${mode}.
    
    Mode Instructions:
    - assist: Help the user plan and debug their DIY project. Be practical and encouraging.
    - simulate: You are a "Visual Architect". Focus on structure, logic, and spatial design.
      If the user asks to build/design a 3D structure (like a circuit, robot part, or building), output a Voxel Blueprint.
      Format: End your response with '___VOXEL_BLUEPRINT___' followed by a valid JSON object: { "blocks": [{ "x": 0, "y": 0, "z": 0, "type": "stone" }, ...] }.
      Valid block types: grass, dirt, stone, plank, redstone_wire, redstone_block, piston, piston_head, lamp_on, lamp_off, observer, glass.
      Coordinates: x, z are horizontal (approx -5 to 5), y is vertical (0 to 10).
      
      Otherwise, if purely illustrative, output '___IMAGE_PROMPT___' followed by a detailed English image generation prompt.

    - delegate: (Handled separately, but if here, act as a research assistant).

    If you have concrete suggestions for next steps, append them at the very end of your response in this format: 
    ___SUGGESTIONS___
    ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
    `;

    try {
        if (AI_PROVIDER === 'qwen') {
            const messages = history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
            messages.push({ role: 'user', content: userText });
            const iterator = streamQwen(messages, systemPrompt);
            for await (const chunk of iterator) onChunk(chunk);
        } else if (AI_PROVIDER === 'deepseek') {
             const messages = history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
             messages.push({ role: 'user', content: userText });
             const iterator = streamDeepSeek(messages, systemPrompt);
             for await (const chunk of iterator) onChunk(chunk);
        } else {
             const contents = history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
             }));
             contents.push({ role: 'user', parts: [{ text: userText }] });
             
             const iterator = streamGemini(contents, systemPrompt);
             for await (const chunk of iterator) onChunk(chunk);
        }
    } catch (e: any) {
        onChunk(`\n[系统错误] ${e.message || 'AI 连接中断'}。请检查网络。`);
        console.error(e);
    }
};

export const chatWithProjectAssistant = async (
  project: Project,
  history: ChatMessage[],
  newMessage: string,
  phase: string
): Promise<string> => {
    const systemPrompt = `You are ${project.aiStats.specializationTitle}, an expert AI mentor for the project "${project.title}".
    Current Phase: ${phase}.
    Your Capabilities: ${project.aiStats.capabilities.map(c => c.name).join(', ')}.
    Wisdom/Tips: ${project.aiStats.collectedWisdom.join('; ')}.
    Style: Professional, encouraging, and concise. Use Markdown.
    ALWAYS end your response with 3 suggested follow-up questions in this JSON format:
    ___SUGGESTIONS___
    ["Question 1", "Question 2", "Question 3"]
    `;

    const messages = history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }));
    messages.push({ role: 'user', content: newMessage });

    try {
        if (AI_PROVIDER === 'qwen') return await callQwen(messages, systemPrompt);
        if (AI_PROVIDER === 'deepseek') return await callDeepSeek(messages, systemPrompt);
        
        // Gemini Fallback
        const contents = history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: newMessage }] });
        return await callGemini(contents, systemPrompt);
    } catch (e: any) {
        return `[错误] ${e.message || '连接失败'}`;
    }
};

export const startResearchMission = async (topic: string): Promise<ResearchLog> => {
    const systemPrompt = "You are a lead researcher. Create an initial research proposal.";
    const prompt = `Topic: ${topic}. 
    Output a Research Proposal log (Day 1). Include:
    - Title: "Day 1: Research Proposal"
    - Content: A structured plan (Objectives, Methodology, Expected Outcome).
    - Tags: ["Proposal", "Planning"]
    Return ONLY the content text.
    `;
    
    let content = "";
    try {
        if (AI_PROVIDER === 'qwen') {
            content = await callQwen([{ role: 'user', content: prompt }], systemPrompt);
        } else if (AI_PROVIDER === 'deepseek') {
            content = await callDeepSeek([{ role: 'user', content: prompt }], systemPrompt);
        } else {
            content = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt);
        }
    } catch (e: any) {
        content = `研究启动失败: ${e.message}`;
    }

    return {
        day: 1,
        timestamp: Date.now(),
        phase: 'Proposal' as const,
        title: "Day 1: Research Proposal",
        content: content,
        tags: ["Proposal", "Planning"]
    };
};

export const generateDailyResearchUpdate = async (
    mission: ResearchMission,
    onChunk?: (chunk: string) => void
): Promise<ResearchLog> => {
    const nextDay = mission.currentDay + 1;
    const systemPrompt = `You are an autonomous AI Researcher. It is Day ${nextDay} of the mission: "${mission.topic}".
    Previous progress: ${mission.progress}%.
    Task: Execute the next phase of research. Simulate experiments, code writing, or literature review.
    Output: A detailed daily report.
    `;
    
    let fullContent = "";
    const prompt = "Generate today's report.";

    try {
        if (onChunk) {
            if (AI_PROVIDER === 'qwen') {
                 const iterator = streamQwen([{ role: 'user', content: prompt }], systemPrompt);
                 for await (const chunk of iterator) { fullContent += chunk; onChunk(chunk); }
            } else if (AI_PROVIDER === 'deepseek') {
                 const iterator = streamDeepSeek([{ role: 'user', content: prompt }], systemPrompt);
                 for await (const chunk of iterator) { fullContent += chunk; onChunk(chunk); }
            } else {
                 const iterator = streamGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt);
                 for await (const chunk of iterator) { fullContent += chunk; onChunk(chunk); }
            }
        } else {
            if (AI_PROVIDER === 'qwen') fullContent = await callQwen([{ role: 'user', content: prompt }], systemPrompt);
            else if (AI_PROVIDER === 'deepseek') fullContent = await callDeepSeek([{ role: 'user', content: prompt }], systemPrompt);
            else fullContent = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt);
        }
    } catch (e: any) {
        fullContent = `进度更新中断: ${e.message}`;
        if (onChunk) onChunk(fullContent);
    }

    let phase: any = 'Literature';
    if (mission.progress > 20) phase = 'Prototyping';
    if (mission.progress > 60) phase = 'Simulation';
    if (mission.progress > 90) phase = 'Refinement';

    return {
        day: nextDay,
        timestamp: Date.now(),
        phase: phase,
        title: `Day ${nextDay}: ${phase} Update`,
        content: fullContent,
        tags: [phase],
        progressDelta: Math.floor(Math.random() * 15) + 5
    };
};

export const generateSimulationImage = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  // Image generation still uses Gemini for now as Qwen VL integration requires different endpoint
  const ai = createGeminiClient(apiKey);
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) return part.inlineData.data || null;
      }
      return null;
  } catch (e) {
      console.error("Image gen error", e);
      return null;
  }
};

// --- CHESS PRACTICE COACH ---

export interface ChessFeedback {
    analysis: string;
    criticalMoveIndex: number; 
}

export const getChessCoachFeedback = async (
    mode: 'analysis_win' | 'analysis_loss' | 'general',
    pgnList: string[],
): Promise<ChessFeedback> => {
    const pgnString = pgnList.map((m, i) => `${i}. ${m}`).join('\n');

    const LOSS_SYSTEM_PROMPT = `
    你是一个 AI 象棋实践助手（Practice Assistant）。
    目标：帮助用户通过“修正一个关键行为错误”来改进决策习惯。
    1. 找出整盘棋中“一个、且只有一个”最关键的失误。
    2. 对失误进行「行为标签化」。
    3. 生成极简反馈文案。
    4. 生成「行为约束规则」。
    
    【输出格式 - 必须严格返回 JSON】
    请务必返回合法的 JSON 格式。不要包含任何 markdown 格式标记。
    {
        "criticalMoveIndex": 15,  
        "analysis": "【关键失误】..."
    }
    `;

    const WIN_SYSTEM_PROMPT = `
    你是一个 AI 象棋实践助手。
    用户赢了，请简短点评这盘棋最精彩的一手。
    【输出格式 - 必须严格返回 JSON】
    {
        "criticalMoveIndex": 20, 
        "analysis": "【神之一手】..."
    }
    `;
    
    let systemInstruction = mode === 'analysis_loss' ? LOSS_SYSTEM_PROMPT : WIN_SYSTEM_PROMPT;
    let prompt = "";

    if (mode === 'analysis_loss') prompt = `我输了（红方）。棋谱如下：\n${pgnString}\n\n找出唯一关键失误并生成 JSON 反馈。`;
    else if (mode === 'analysis_win') prompt = `我赢了（红方）。棋谱如下：\n${pgnString}\n\n找出最精彩的一手并生成 JSON 反馈。`;
    else prompt = `分析这盘棋：\n${pgnString}`;

    let responseText = "";
    const messages = [{ role: 'user', content: prompt }];

    try {
        if (AI_PROVIDER === 'qwen') {
            responseText = await callQwen(messages, systemInstruction);
        } else if (AI_PROVIDER === 'deepseek') {
            responseText = await callDeepSeek(messages, systemInstruction);
        } else {
            responseText = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], systemInstruction);
        }

        let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1) cleanText = cleanText.substring(start, end + 1);
        
        const json = JSON.parse(cleanText);
        return json;
    } catch (e: any) {
        console.error("Coach Feedback Error", e);
        // Pass the actual network error to the UI
        return { 
            analysis: `⚠️ 复盘失败: ${e.message}\n\n建议: 关闭 VPN 后重试 (阿里云国内直连更快)。`, 
            criticalMoveIndex: -1 
        };
    }
};

export const getXiangqiMoveCommentary = async (
    fen: string,
    lastMove: string
): Promise<string> => {
    const systemInstruction = `你是一个严格的象棋"照镜子"AI。
    任务：点评用户（红方）刚走的这一步棋。
    规则：只评价已发生的行为，语言简练（30字以内）。`;
    
    const prompt = `当前局面(类FEN): ${fen}\n用户刚走的棋: ${lastMove}\n请点评。`;
    const messages = [{ role: 'user', content: prompt }];

    try {
        if (AI_PROVIDER === 'qwen') return await callQwen(messages, systemInstruction);
        if (AI_PROVIDER === 'deepseek') return await callDeepSeek(messages, systemInstruction);
        return await callGemini([{ role: 'user', parts: [{ text: prompt }] }], systemInstruction);
    } catch (e: any) {
        return "Thinking... (Net Error)";
    }
};
