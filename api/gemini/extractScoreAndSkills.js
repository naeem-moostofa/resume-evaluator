// pages/api/gemini/extractScoreAndSkills.js
export const runtime = "nodejs";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { GoogleGenAI } = await import("@google/genai"); 
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    if (!apiKey) {
        console.log("Missing api key")
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const {
        SYSTEM_INSTRUCTION_SCORE,
        RESPONSE_SCHEMA_SCORE,
        SYSTEM_INSTRUCTION_SKILLS,
        RESPONSE_SCHEMA_SKILLS,
        fileType,
        base64pdf
    } = req.body || {};

    if (!base64pdf) {
      return res.status(400).json({ error: "Missing base64pdf in request body" });
    }


    // Build a proper Blob from base64 (Node >= 18)
    const buffer = Buffer.from(base64pdf, "base64");
    const blob = new Blob([buffer], { type: fileType || "application/pdf" });

    // Upload file to Gemini
    const uploaded = await ai.files.upload({
      file: blob,
      mimeType: fileType || "application/pdf",
      displayName: "resume.pdf",
    });

    // Some SDK versions return { uri }, others nest it. Handle both.
    const fileUri = uploaded?.uri || uploaded?.file?.uri;
    if (!fileUri) {
        console.log("Could not upload PDF")
        return res.status(502).json({ error: "Failed to upload PDF to Gemini (no fileUri)" });
    }

    // Common parts array for both requests
    const resumeParts = [
        { fileData: { fileUri, mimeType: "application/pdf" } }
    ];

    // ---- Request 1: SCORE JSON
    const scoreResp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION_SCORE,
        contents: [
            {
            role: "user",
            parts: [
                ...resumeParts,
                { text: "From the attached PDF resume, output a SINGLE JSON object exactly matching the schema." }
            ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA_SCORE,
            temperature: 0.2,
            topK: 32
        }
    });

    // Some SDKs expose .text, others require response.text()
    // console.log(scoreResp);
    const scoreRespText = scoreResp.text;
    const cleanedScoreText = scoreRespText.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim();
    // console.log(cleanedScoreText);
    
    if (!cleanedScoreText) {
      return res.status(502).json({ error: "Empty score response from Gemini" });
    }

    let score_data;
    try {
      score_data = JSON.parse(cleanedScoreText);
    } catch {
      return res.status(502).json({ error: "Score JSON parse failed", raw: cleanedScoreText });
    }

    // console.log(SYSTEM_INSTRUCTION_SKILLS);

    // ---- Request 2: SKILLS JSON
    const skillsResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION_SKILLS,
      contents: [
        {
          role: "user",
          parts: [
            ...resumeParts,
            { text: "From the attached PDF resume, output a single JSON object which contains the key information in the resume" }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA_SKILLS,
        temperature: 0.2,
        topK: 32
      }
    });

    const skillsText = skillsResp.text;
    const cleanedSkillsText = skillsText.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim();


    // console.log(cleanedSkillsText);

    if (!cleanedSkillsText) {
      return res.status(502).json({ error: "Empty skills response from Gemini" });
    }

    let skills_data;
    try {
      skills_data = JSON.parse(cleanedSkillsText);
    } catch {
      return res.status(502).json({ error: "Skills JSON parse failed", raw: cleanedSkillsText });
    }

    return res.status(200).json({ score: score_data, skills: skills_data });
  } catch (err) {
    // Surface a bit more context in development logs
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "Gemini call failed" });
  }
}
