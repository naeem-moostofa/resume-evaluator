export default async function handler(req, res) {
    try {
        const { GoogleGenAI } = await import("@google/genai"); 
        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });

        const { prompt, RESPONSE_SCHEMA_SKILLS } = req.body;

        if (req.method !== "POST") {
            return res.status(405).json({ error : "Method not allowed" });
        }

        const response  = await ai.models.generateContent({
            model : "gemini-2.5-flash",
            systemInstruction: "Extract three fields and return STRICT JSON with keys: 'skills_text', 'past_experience_text', 'education_text'",
            
            contents : [
            {
                role: "user",
                parts : [{text : prompt}]
            }
            ],
            
            generationConfig: {
            responseSchema : RESPONSE_SCHEMA_SKILLS,
            responseMimeType : "application/json",
            temperature: 0.2,
            topK: 32
            }
        });

        const cleanedText = response.text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim();

        const responseJSON = JSON.parse(cleanedText);

        return res.status(200).json(responseJSON);
    } catch (e) {
        return res.status(500).json({ error : "Error" });
    }
}