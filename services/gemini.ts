
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Project, ChatMessage, ResearchMission, ResearchLog } from "../types";
import { AI_MODEL_TEXT, AI_MODEL_IMAGE } from "../config";

// Initialization: ALWAYS use a named parameter for apiKey and fetch from process.env.API_KEY
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generic content generation with streaming
 */
export async function* streamGemini(contents: any[], systemInstruction: string) {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContentStream({
            model: AI_MODEL_TEXT,
            contents: contents,
            config: { systemInstruction }
        });

        for await (const chunk of response) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                yield c.text;
            }
        }
    } catch (e) {
        console.error("Gemini Stream Error", e);
        throw e;
    }
}

/**
 * Generic content generation (blocking)
 */
const callGemini = async (
    contents: any[],
    systemInstruction: string,
    responseMimeType?: string,
    responseSchema?: any
): Promise<string> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: AI_MODEL_TEXT,
            contents: contents,
            config: { 
                systemInstruction,
                responseMimeType,
                responseSchema
            }
        });
        // Access .text property directly as per guidelines
        return response.text || "";
    } catch (e) {
        console.error("Gemini Call Error", e);
        throw e;
    }
};

// ================= Business Functions =================

/**
 * AI Lab Idea Generation
 */
export const streamIdea = async (
  userText: string,
  history: ChatMessage[],
  mode: 'assist' | 'simulate' | 'delegate',
  onChunk: (chunk: string) => void
) => {
    const systemPrompt = `你是一个在 "AI 实践助手" 实验室的资深科创导师。
    当前模式: ${mode}。
    要求: 
    - 使用中文回答，语气要极客且专业。
    - assist: 协助规划 DIY 项目，提供结构、电路、代码的建议。
    - simulate: 侧重设计。如果涉及到 3D 结构，请在回复最后输出 '___VOXEL_BLUEPRINT___' + 一个符合 JSON 格式的方块数组 { "blocks": [{ "x":0, "y":0, "z":0, "type":"stone" }] }。
    - delegate: 科创代理模式，模拟研究过程。
    
    始终在最后以 ___SUGGESTIONS___ 开头，后接包含 3 个后续科创建议的 JSON 数组。`;

    const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: userText }] });

    const iterator = streamGemini(contents, systemPrompt);
    for await (const chunk of iterator) {
        onChunk(chunk);
    }
};

/**
 * Project-specific AI Assistant ("老师傅")
 */
export const chatWithProjectAssistant = async (
  project: Project,
  history: ChatMessage[],
  newMessage: string,
  phase: string
): Promise<string> => {
    const systemPrompt = `你是项目 "${project.title}" 的专属导师 (老师傅)，拥有 ${project.aiStats.specializationTitle} 背景。
    当前实践阶段: ${phase}。
    你的任务是辅助用户完成实物制作。
    要求: 
    - 使用中文。
    - 提供具体的硬件接线、软件算法或结构搭建建议。
    - 针对 "${project.title}" 的具体难点进行指导。
    最后务必以 ___SUGGESTIONS___ 后接 JSON 数组输出 3 个下一步动作建议。`;

    const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: newMessage }] });
    
    return await callGemini(contents, systemPrompt);
};

/**
 * Research Agent Mission Start
 */
export const startResearchMission = async (topic: string): Promise<ResearchLog> => {
    const systemPrompt = "请为这个科创课题创建一个初步的研究立项方案。使用中文，包含研究背景、技术路线、预期成果。";
    const prompt = `课题: ${topic}。`;
    
    const content = await callGemini([{ role: 'user', parts: [{ text: prompt }] }], systemPrompt);

    return {
        day: 1,
        timestamp: Date.now(),
        phase: 'Proposal',
        title: "Day 1: 立项与技术选型",
        content: content,
        tags: ["立项", "技术路线"]
    };
};

/**
 * Research Agent Daily Update
 */
export const generateDailyResearchUpdate = async (
    mission: ResearchMission,
    onChunk?: (chunk: string) => void
): Promise<ResearchLog> => {
    const nextDay = mission.currentDay + 1;
    const systemPrompt = `你是一个 AI 科创研究员。正在进行课题 "${mission.topic}" 的第 ${nextDay} 天工作。
    请根据之前的进度（${mission.progress}%）生成今日进度报告。
    内容应包含：实验现象、遇到问题、解决思路、明日计划。
    使用中文输出。`;
    
    const prompt = "生成今日详细科创研究日志。";
    let fullContent = "";
    
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    if (onChunk) {
        const iterator = streamGemini(contents, systemPrompt);
        for await (const chunk of iterator) { 
            fullContent += chunk; 
            onChunk(chunk); 
        }
    } else {
        fullContent = await callGemini(contents, systemPrompt);
    }

    return {
        day: nextDay,
        timestamp: Date.now(),
        phase: nextDay < 3 ? 'Literature' : nextDay < 6 ? 'Prototyping' : 'Simulation',
        title: `Day ${nextDay}: 关键技术突破`,
        content: fullContent,
        tags: ["进展", "实验"],
        progressDelta: Math.floor(Math.random() * 10) + 5
    };
};

/**
 * Generate 3D concept visualization using gemini-2.5-flash-image
 */
export const generateSimulationImage = async (prompt: string): Promise<string | null> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: AI_MODEL_IMAGE,
            contents: {
                parts: [{ text: `High-tech DIY engineering concept illustration of: ${prompt}. Cinematic lighting, 8k resolution, photorealistic, maker-style workshop background.` }]
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data; // base64
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation error", e);
        return null;
    }
};

// ================= Chess AI Functions =================

/**
 * Fixed missing ChessFeedback type for ChessPractice component
 */
export interface ChessFeedback {
  analysis: string;
  criticalMoveIndex: number;
}

/**
 * Fixed missing getChessCoachFeedback function for game analysis
 */
export const getChessCoachFeedback = async (mode: string, history: string[]): Promise<ChessFeedback> => {
    const ai = getAIClient();
    const systemInstruction = `你是一个专业的中国象棋大师。请分析以下对局记录并提供针对性的反馈。
    模式: ${mode} (分析胜利或失败)。
    对局历史: ${history.join(', ')}。

    要求:
    - 使用中文分析。
    - 识别出对局中最关键的一步（导致局势倾斜的转折点）。
    - 返回 JSON 格式。`;

    try {
        const response = await ai.models.generateContent({
            model: AI_MODEL_TEXT,
            contents: "请根据上述对局历史生成专业分析。",
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: {
                            type: Type.STRING,
                            description: 'Markdown 格式的深度对局分析。'
                        },
                        criticalMoveIndex: {
                            type: Type.NUMBER,
                            description: '导致局势反转的关键动作在历史记录数组中的索引 (0-based)。'
                        }
                    },
                    required: ["analysis", "criticalMoveIndex"]
                }
            }
        });
        
        const result = JSON.parse(response.text || "{}");
        return {
            analysis: result.analysis || "无法获取对局分析。",
            criticalMoveIndex: typeof result.criticalMoveIndex === 'number' ? result.criticalMoveIndex : -1
        };
    } catch (e) {
        console.error("Chess Coach Analysis Error", e);
        return { analysis: "分析引擎暂时不可用。", criticalMoveIndex: -1 };
    }
};

/**
 * Fixed missing getXiangqiMoveCommentary function for live move feedback
 */
export const getXiangqiMoveCommentary = async (fen: string, move: string): Promise<string> => {
    const ai = getAIClient();
    const systemInstruction = "你是一个精通中国象棋的老师傅，说话风格幽默犀利。";
    const prompt = `当前 FEN: ${fen}
    刚才这一步: ${move}
    请用 15 字以内中文简短点评。`;

    try {
        const response = await ai.models.generateContent({
            model: AI_MODEL_TEXT,
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text?.trim() || "走法不错。";
    } catch (e) {
        console.error("Xiangqi Commentary Error", e);
        return "好棋。";
    }
};
