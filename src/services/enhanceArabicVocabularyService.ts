export const enhanceArabicVocabulary = async (vocab: any, apiKey?: string, specificFields?: string[]) => {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const keyToUse = apiKey || localStorage.getItem("openai_api_key") || OPENAI_API_KEY;

    if (!keyToUse) {
        throw new Error("OpenAI API key is required");
    }

    // Determine what fields need enhancement
    let needsEnhancement: string[] = [];

    // Check each Arabic field that can be auto-generated
    if (!vocab.transliteration || vocab.transliteration.trim() === "") {
        needsEnhancement.push("transliteration");
    }
    if (!vocab.bangla || vocab.bangla.trim() === "" || vocab.bangla.trim().length < 2) {
        needsEnhancement.push("bangla");
    }
    if (!vocab.english || vocab.english.trim() === "") {
        needsEnhancement.push("english");
    }
    if (!vocab.example || vocab.example.trim() === "") {
        needsEnhancement.push("example");
    }
    if (!vocab.exampleBangla || vocab.exampleBangla.trim() === "") {
        needsEnhancement.push("exampleBangla");
    }
    if (!vocab.category || vocab.category.trim() === "") {
        needsEnhancement.push("category");
    }

    // If specific fields are requested, filter to only those that are missing
    if (specificFields && specificFields.length > 0 && !specificFields.includes("all")) {
        needsEnhancement = needsEnhancement.filter(field => specificFields.includes(field));
    }

    // If nothing needs enhancement, return empty object
    if (needsEnhancement.length === 0) {
        return {};
    }

    // Use development proxy if in dev mode
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? "/api/openai" : "https://api.openai.com/v1";

    // Build optimized prompt with specific rules for missing fields only
    let rules = "";
    if (needsEnhancement.includes("transliteration")) {
        rules += `
- transliteration: Pronunciation written in BANGLA letters ONLY, so a Bengali speaker can read it aloud (e.g. "আস-সালামু আলাইকুম"). NEVER use Arabic or English letters here.`;
    }
    if (needsEnhancement.includes("bangla")) {
        rules += `
- bangla: Short, simple, native Bangladeshi Bangla meaning (comma for 2 meanings). NO slash (/). Example: "ফাঁদ কোথায়" not "স্থান".`;
    }
    if (needsEnhancement.includes("english")) {
        rules += `
- english: Concise natural English translation.`;
    }
    if (needsEnhancement.includes("example")) {
        rules += `
- example: One short, practical, grammatically-correct Arabic (Saudi dialect) example sentence using the word naturally in daily life.`;
    }
    if (needsEnhancement.includes("exampleBangla")) {
        rules += `
- exampleBangla: Native Bangladeshi Bangla translation of the example sentence.`;
    }
    if (needsEnhancement.includes("category")) {
        rules += `
- category: One of these ids: greetings, phrases, time, places, family, food, numbers, colors, questions, work, daily, general.`;
    }

    const prompt = `Role: You are a Saudi Arabic (اللهجة السعودية) teacher helping a Bangladeshi learner.
Task: Generate JSON for missing fields of the Arabic word: "${vocab.arabic}" (${vocab.transliteration || "unknown transliteration"}).
Context: ${vocab.bangla || ""} / ${vocab.english || ""}
Missing Fields: ${needsEnhancement.join(", ")}

RULES:
${rules}

Return ONLY valid JSON. No markdown.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${keyToUse}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that outputs only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": { "type": "json_object" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices[0].message.content;

    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("Could not parse AI response as valid JSON");
    }
    jsonText = jsonMatch[0];

    const parsed = JSON.parse(jsonText);

    // Only return the fields that were requested
    const filteredEnhancements: any = {};
    needsEnhancement.forEach(field => {
        if (parsed[field] !== undefined) {
            filteredEnhancements[field] = parsed[field];
        }
    });

    return filteredEnhancements;
};