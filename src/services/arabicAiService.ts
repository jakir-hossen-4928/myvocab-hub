const getOpenAIKey = (): string => {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const keyToUse = localStorage.getItem("openai_api_key") || OPENAI_API_KEY;
    if (!keyToUse) {
        throw new Error("OpenAI API key is required");
    }
    return keyToUse;
};

const callOpenAI = async (prompt: string) => {
    const keyToUse = getOpenAIKey();
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? "/api/openai" : "https://api.openai.com/v1";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${keyToUse}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that outputs only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Could not parse AI response as valid JSON");
    }
    return JSON.parse(jsonMatch[0]);
};

export interface GeneratedArabicVocabulary {
    arabic: string;
    transliteration: string;
    bangla: string;
    english: string;
    example: string;
    exampleBangla: string;
}

/**
 * Generate Arabic (Saudi dialect) vocabulary details via OpenAI.
 * Transliteration is written in Bangla letters for easy pronunciation.
 */
export const generateArabicVocabulary = async (inputWord: string): Promise<GeneratedArabicVocabulary> => {
    const prompt = `You are a Saudi Arabic (اللهجة السعودية) teacher for a Bangladeshi learner relocating to Saudi Arabia.

Generate vocabulary details for the Arabic word/phrase: "${inputWord}"

Return ONLY valid JSON with this exact structure:
{
  "arabic": "<the word in Arabic script>",
  "transliteration": "<pronunciation written in Bangla letters, e.g. দেখুন...>",
  "bangla": "<Bangla meaning/translation>",
  "english": "<English translation>",
  "example": "<natural Arabic example sentence using the word>",
  "exampleBangla": "<Bangla translation of the example>"
}

RULES:
- arabic: Use correct Arabic script (Saudi dialect where applicable).
- transliteration: Write the Arabic pronunciation using Bangla letters so a Bengali speaker can read it aloud. NO Arabic or English letters.
- bangla: Natural, native Bangladeshi Bangla.
- Keep example sentence simple and practical for daily life in Saudi Arabia.
Return ONLY valid JSON. No markdown.`;

    return callOpenAI(prompt);
};

export interface GeneratedArabicResource {
    title: string;
    slug: string;
    description: string;
}

/**
 * Generate an Arabic learning blog post draft with AI.
 * Title is written in Bangla, description is rich content about Saudi Arabic learning.
 */
export const generateArabicResource = async (topic: string): Promise<GeneratedArabicResource> => {
    const prompt = `
You are a Saudi Arabic teacher creating a study resource for a Bengali speaker preparing to relocate to Saudi Arabia.

Topic: "${topic}"

Write an educational blog post. Return ONLY valid JSON:
{
  "title": "<Catchy title (English is fine, clear and simple)>",
  "slug": "<slugified english title>",
  "description": "<Full article in Markdown, Bengali + Arabic transliteration. Include headings, bullet points, practical phrases with Arabic script, Bangla transliteration, and Bangla translation. Minimum 200 words.>"
}

RULES:
- Use markdown formatting (## headings, - bullets, **bold**).
- Practical, everyday Saudi Arabic focus.
Return ONLY valid JSON. No markdown.`;

    return callOpenAI(prompt);
};