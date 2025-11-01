import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    try {
        const skillsJSON = req.body.skillsJson;
        // console.log(skillsJSON);

        if (req.method !== "POST") {
            return res.status(405).json({error : "Method not allowed"});
        }

        const contents = [skillsJSON.skills_text, skillsJSON.past_experience_text, skillsJSON.education_text];

        console.log("Contents:");
        console.log(contents);

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