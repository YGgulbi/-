import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseExperiencesFromFile(file: File): Promise<any[]> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const model = "gemini-2.5-flash";
    
    const prompt = `
      당신은 대학생의 커리어와 인생 설계를 돕는 전문 컨설턴트입니다. 
      제공된 파일(이미지, PDF, 또는 텍스트)은 사용자의 포트폴리오, 이력서, 또는 활동 기록입니다.
      이 파일에서 사용자의 '인생지도(Life Map)'를 구성할 수 있는 모든 유의미한 경험들을 추출하세요.

      각 경험에 대해 다음 정보를 추출해야 합니다:
      - title: 경험의 핵심 제목 (예: 'OO 기업 인턴', 'XX 공모전 대상')
      - startDate: 시작일 (YYYY.MM.DD 형식). 연도만 알면 YYYY.01.01로, 모르면 추측하세요.
      - endDate: 종료일 (YYYY.MM.DD 형식). 단기 활동이면 시작일과 동일하게.
      - description: 무엇을 했는지, 어떤 역할을 맡았는지, 어떤 성과를 냈는지에 대한 요약.
      - category: ['대외활동', '공모전', '아르바이트', '교내활동', '성적'] 중 하나를 선택하거나 적절한 카테고리 제안.
      
      결과는 반드시 JSON ARRAY 형식으로만 반환하세요. 다른 설명이나 마크다운 기호(\`\`\`json 등)는 포함하지 마세요.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
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

    const result = JSON.parse(cleanedText);
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error("Error parsing file with AI:", error);
    throw error;
  }
}

// Keep the old function for backward compatibility if needed, or just redirect
export async function parseExperienceFromFile(file: File): Promise<any> {
    const results = await parseExperiencesFromFile(file);
    return results[0] || {};
}
