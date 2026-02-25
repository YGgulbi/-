import { GoogleGenAI } from "@google/genai";
import { Experience, AnalysisResult, UserProfile } from '../types';

// Initialize the client-side Gemini API
// Note: In a production app, this should be proxied through a backend to protect the key,
// or use the user's own key if it's a "bring your own key" app.
// For this environment, we use the injected process.env.GEMINI_API_KEY.

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeExperiences(experiences: Experience[]): Promise<AnalysisResult> {
  if (experiences.length === 0) {
    throw new Error("No experiences to analyze");
  }

  const prompt = `
    You are an expert career counselor and psychologist for Korean university students. Analyze the following list of personal experiences to help the user understand themselves better.
    
    The goal is to derive:
    1. What they like (Interests)
    2. What they are good at (Strengths)
    3. Their problem-solving style
    4. Their energy direction (e.g., Introverted/Extroverted, or what drains/energizes them)
    5. An actionable plan for the future based on these insights.
    6. Relationships between experiences: Identify which experiences are connected (e.g., one led to another, they share a similar skill, or they represent a growth trajectory).

    Here are the experiences:
    ${JSON.stringify(experiences.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category })), null, 2)}

    Please return the response in the following JSON format. **All values must be in Korean.**
    {
      "strengths": ["강점 1", "강점 2", ...],
      "interests": ["흥미 1", "흥미 2", ...],
      "problemSolvingStyle": "문제 해결 스타일 설명...",
      "energyDirection": "에너지 방향성 설명...",
      "actionPlan": ["액션 플랜 1", "액션 플랜 2", ...],
      "summary": "따뜻하고 격려하는 요약 문단 (존댓말 사용).",
      "relationships": [
        { "sourceId": "exp_id_1", "targetId": "exp_id_2", "reason": "연결 이유 (예: 성취 경험의 확장)" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean markdown formatting if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    return JSON.parse(cleanedText) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
}

export async function generateChecklist(action: string, context: Experience[]): Promise<string[]> {
  const prompt = `
    Based on the following action plan item and the user's past experiences, generate a practical 5-item checklist to help the user achieve this goal.
    
    Action Plan: ${action}
    
    User's Context (Past Experiences):
    ${JSON.stringify(context.map(e => e.title), null, 2)}
    
    Return the checklist as a JSON array of strings in Korean.
    Example: ["단계 1", "단계 2", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean markdown formatting if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    return JSON.parse(cleanedText) as string[];
  } catch (error) {
    console.error("Checklist generation failed:", error);
    return ["데이터를 불러오는 중 오류가 발생했습니다."];
  }
}

export async function suggestExperiences(profile: UserProfile): Promise<Experience[]> {
  const prompt = `
    You are a career mentor for a university student.
    Based on the user's profile, suggest 5-7 likely experiences they might have had.
    These should be specific, realistic, and relevant to their major and keywords.

    User Profile:
    - Name: ${profile.name}
    - Status: ${profile.status}
    - Major: ${profile.major || 'Not specified'}
    - Detail Major: ${profile.detailMajor || 'Not specified'}
    - Keywords: ${profile.keywords?.join(', ') || 'Not specified'}

    Return the response as a JSON array of experience objects.
    Each object should have:
    - title: A short, descriptive title (Korean)
    - description: A brief description of what they might have done (Korean)
    - category: One of ['대외활동', '공모전', '아르바이트', '교내활동', '성적', '기타']
    - emotion: One of ['즐거움', '당황', '두려움', '익숙함', '성취']

    Example JSON structure:
    [
      {
        "title": "전공 관련 학회 활동",
        "description": "전공 지식을 활용하여 학회에서 세미나를 진행하고 스터디에 참여함.",
        "category": "교내활동",
        "emotion": "즐거움"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const suggestions = JSON.parse(cleanedText);
    
    // Add IDs and default dates
    const currentYear = new Date().getFullYear();
    return suggestions.map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      startDate: `${currentYear}.01.01`,
      endDate: `${currentYear}.12.31`,
      satisfaction: 5,
      tags: ['AI제안'],
      attachments: []
    }));

  } catch (error) {
    console.error("Experience suggestion failed:", error);
    return [];
  }
}
