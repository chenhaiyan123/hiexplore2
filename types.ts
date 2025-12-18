
export enum ViewState {
  FEED = 'FEED',
  DETAIL = 'DETAIL',
  IDEA_LAB = 'IDEA_LAB',
  USER_PROFILE = 'USER_PROFILE',
  DISCOVER = 'DISCOVER',
  CHESS_PRACTICE = 'CHESS_PRACTICE'
}

export interface Step {
  id: number;
  title: string;
  description: string;
  image?: string;
}

export interface AIStats {
  studentsHelped: number;
  specializationTitle: string; // e.g. "Senior Mechatronics Engineer"
  capabilities: { name: string; level: number }[]; // e.g. [{name: "Arduino", level: 10}]
  collectedWisdom: string[]; // Common pitfalls learned from other users
}

export interface Material {
  id: string;
  name: string;
  price: string;
  purchaseUrl: string;
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  videoUrl: string; 
  likes: number;
  steps: Step[];
  aiPersona: string;
  aiStats: AIStats;
  materials?: Material[]; // Optional bill of materials
  comments?: Comment[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSimulated?: boolean;
  suggestions?: string[]; // New: Store clickable follow-up questions
  imageUrl?: string; // New: Base64 string for generated images
  voxelData?: { blocks: { x: number; y: number; z: number; type: string; }[] }; // New: 3D Voxel Blueprint
}

// User Profile for Recommendation Engine
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[]; // e.g. ['IoT', 'Coding', 'Robotics']
  avatar?: string;
  bio?: string;
  stats?: {
    following: number; // This will now be dynamically calculated
    followers: number;
    likesReceived: number;
  };
}

// --- NEW: AI Research Agent Structures ---

export type ResearchPhase = 'Proposal' | 'Literature' | 'Prototyping' | 'Simulation' | 'Refinement' | 'Completed';

export interface ResearchLog {
  day: number;
  timestamp: number;
  phase: ResearchPhase;
  title: string; // e.g. "Day 3: Simulation Failure"
  content: string; // The detailed report
  tags: string[]; // e.g. ["Bug", "Breakthrough", "Pivot"]
  codeSnippet?: string; // Optional code produced that day
  imagePrompt?: string; // For visualizing the day's result
  diagramCode?: string; // NEW: Mermaid.js diagram definition
  progressDelta?: number; // Added progress delta
  video?: { url: string; type: 'local' | 'link'; title: string }; // NEW: Video attachment
}

export interface ResearchMission {
  id: string;
  topic: string; // The user's prompt
  status: 'Active' | 'Paused' | 'Completed';
  currentDay: number;
  progress: number; // 0-100
  logs: ResearchLog[];
  lastUpdated: number;
  mentorFeedback?: string;
  longTermMemory?: string[]; // New: Long-term memory storage
}