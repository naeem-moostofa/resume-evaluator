export default async function handler(req, res) {
    try {
        const { GoogleGenAI } = await import("@google/genai"); 
        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });

        const skillsJSON = req.body.skillsJson;

        // console.log(skillsJSON);

        if (req.method !== "POST") {
            return res.status(405).json({error : "Method not allowed"});
        }

        const contents = [skillsJSON.skills_text, skillsJSON.past_experience_text, skillsJSON.education_text];

        const ai_embed = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents,
            taskType: "SEMANTIC_SIMILARITY",
            outputDimensionality: 768
        })

        const [ skills_vec, experience_vec, education_vec ] = (ai_embed.embeddings).map((e) => e.values);

        const result = [
            Array.from(skills_vec),
            Array.from(experience_vec),
            Array.from(education_vec)
        ];

        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json("Error in Embedding");
    }
}