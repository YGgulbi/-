export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface Experience {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description: string;
  category: string; // Changed to string to allow custom input
  satisfaction: number; // 1-10
  emotion: string; // Changed to string to allow custom input
  tags: string[];
  attachments: Attachment[];
  // Deprecated fields kept for migration if needed, but not used in UI
  energyLevel?: number;
  deletedAt?: string; // ISO Date string if deleted
}

export interface UserProfile {
  name: string;
  birthYear: string;
  status: string;
  major?: string;
  detailMajor?: string;
  keywords?: string[];
}

export interface ExperienceRelationship {
  sourceId: string;
  targetId: string;
  reason: string;
}

export interface AnalysisResult {
  strengths: string[];
  interests: string[];
  problemSolvingStyle: string;
  energyDirection: string;
  actionPlan: string[];
  summary: string;
  relationships: ExperienceRelationship[];
}
