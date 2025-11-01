export default async function handler(req, res) {
    try {

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

        const { SYSTEM_INSTRUCTION_SCORE, RESPONSE_SCHEMA_SCORE, SYSTEM_INSTRUCTION_SKILLS,
                RESPONSE_SCHEMA_SKILLS, fileType, base64pdf } = req.body;

        const buffer = Buffer.from(base64pdf, "base64");
        const blob = new Blob([buffer], { type : fileType });

        if (req.method !== "POST") {
            return res.status(405).json({error : "Method not allowed"})
        }

        const uploaded = await ai.files.upload({
            file: blob,                                   // MUST be a real File/Blob
            mimeType: fileType || "application/pdf",
            displayName: "resume.pdf",
        });

        const fileUri = uploaded?.uri; 

        if (!fileUri) {
            return res.status(405).json({error : "Failed to upload PDF to Gemini"});
        }
    
        const response_score = await ai.models.generateContent({
            model : "gemini-2.5-flash",
            systemInstruction : SYSTEM_INSTRUCTION_SCORE,
            contents : [
                {
                    role : "user",
                    parts : [
                        { fileData : { fileUri, mimeType : "application/pdf" } },
                        { text: "From the attached PDF resume, output a SINGLE JSON object exactly matching the schema." }

                    ]
                }
            ],
            config : {
                responseMimeType : "application/json",
                responseSchema : RESPONSE_SCHEMA_SCORE,
                temperature: 0.2,
                topK: 32
            }
        });

        const response_skills = await ai.models.generateContent({
            model : "gemini-2.5-flash",
            systemInstruction : SYSTEM_INSTRUCTION_SKILLS,
            contents : [
                {
                    role : "user",
                    parts : [
                        { fileData : { fileUri, mimeType : "application/pdf" } },
                        { text: "From the attached PDF resume, output a single JSON object which contains the key information in the resume" }

                    ]
                }
            ],
            config : {
                responseMimeType : "application/json",
                responseSchema : RESPONSE_SCHEMA_SKILLS,
                temperature: 0.2,
                topK: 32
            }
        });

        const score_data = JSON.parse(response_score.text);
        const skills_data = JSON.parse(response_skills.text);

        const result = {
            "score" : score_data,
            "skills" : skills_data
        }

        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ error: "Gemini call failed" })
    }

}
