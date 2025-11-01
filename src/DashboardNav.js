import { useState } from "react";
import { Link } from "react-router-dom";  
import { supabase } from "./supabaseClient";

const DashboardNav = ({ session, error, setError, maxFileSizeMB, setResumes}) => {

    const [uploading, setUploading] = useState(null);

    const RESPONSE_SCHEMA_SCORE = {
    type: "object",
    additionalProperties: false,
    required: ["problem_solving", "readability_obj", "career_ready_obj"],
    properties: {
        problem_solving: {
        type: "object",
        additionalProperties: false,
        required: ["obj"],
        properties: {
            obj: {
            type: "object",
            additionalProperties: false,
            required: ["quantified_bullet_points", "star_elements", "acomplishments"],
            properties: {
                quantified_bullet_points: { type: "number", minimum: 0, maximum: 10 },
                star_elements:             { type: "number", minimum: 0, maximum: 10 },
                acomplishments:            { type: "number", minimum: 0, maximum: 10 }
            }
            }
        }
        },
        readability_obj: {
        type: "object",
        additionalProperties: false,
        required: ["obj"],
        properties: {
            obj: {
            type: "object",
            additionalProperties: false,
            required: ["sectioning", "action_verbs", "conciseness_and_cinsistency", "ATS_friendly"],
            properties: {
                sectioning:                  { type: "number", minimum: 0, maximum: 10 },
                action_verbs:                { type: "number", minimum: 0, maximum: 10 },
                conciseness_and_cinsistency: { type: "number", minimum: 0, maximum: 10 },
                ATS_friendly:                { type: "number", minimum: 0, maximum: 10 }
            }
            }
        }
        },
        career_ready_obj: {
        type: "object",
        additionalProperties: false,
        required: ["obj"],
        properties: {
            obj: {
            type: "object",
            additionalProperties: false,
            required: ["teamwork_and_leadership", "communication", "professionalisum_and_initaitive"],
            properties: {
                teamwork_and_leadership:        { type: "number", minimum: 0, maximum: 10 },
                communication:                  { type: "number", minimum: 0, maximum: 10 },
                professionalisum_and_initaitive:{ type: "number", minimum: 0, maximum: 10 }
            }
            }
        }
        }
    }
    };

    const RESPONSE_SCHEMA_SKILLS = {
        type: "object",
        additionalProperties: false,
        properties: {
            skills_text: { type: "string" },
            past_experience_text: { type: "string" },
            education_text: { type: "string" }
        },
        required: ["skills_text", "past_experience_text", "education_text"]
    };

    const defaultScore = {
        "problem_solving": {
            "obj": {
            "star_elements": 0,
            "acomplishments": 0,
            "quantified_bullet_points": 0
            }
        },
        "readability_obj": {
            "obj": {
            "sectioning": 0,
            "ATS_friendly": 0,
            "action_verbs": 0,
            "conciseness_and_cinsistency": 0
            }
        },
        "career_ready_obj": {
            "obj": {
            "communication": 0,
            "teamwork_and_leadership": 0,
            "professionalisum_and_initaitive": 0
            }
        }
        };

    const SYSTEM_INSTRUCTION_SKILLS = 
        `You are extracting three verbatim text sections from a resume.

        Rules:
        - Output ONLY valid JSON with exactly these three string fields:
        {
            "skills_text": "...",
            "past_experience_text": "...",
            "education_text": "..."
        }
        - Under each field, paste the corresponding text from the resume EXACTLY as written (verbatim, original order, original punctuation).
        - Do NOT add, infer, summarize, reorder, or rename fields.
        - If a section is absent in the resume, return an empty string for that field.
        - Return ONLY the JSON. No extra text. `

    const SYSTEM_INSTRUCTION_SCORE = `
        You are a strict resume grader. Return ONLY valid JSON using EXACTLY the keys and nesting shown below.
        Do not add fields, notes, comments, or explanations. No markdown. No trailing commas.

        SCORING RULES (APPLY TO ALL FIELDS)
        - Output a number from 0 to 10 for every field. Decimals allowed (one decimal place).
        - Anchor scale:
        0–2  = absent/vague/harmful
        3–5  = present but inconsistent or generic
        6–7  = clear and mostly consistent
        8–9  = strong, repeated, and specific
        10   = exemplary and repeated across sections
        - Evidence must come from the resume text provided. Do NOT infer unstated achievements or skills.

        FIELD DEFINITIONS (WHAT TO LOOK FOR)

        problem_solving.obj
        - quantified_bullet_points: Fraction of bullets that include numeric outcomes (%, $, counts, time, rates), scaled to 0–10.
        Examples of numeric signals: “increased by 20%”, “reduced 3 ms latency”, “cut cost $15k/year”, “served 120 users”.
        - star_elements: Coverage of STAR elements across bullets. Count bullets with at least TWO of {Situation, Task, Action} AND at least one explicit Result. Convert coverage ratio to 0–10.
        - acomplishments: Degree to which bullets emphasize outcomes and impact vs. duties. Reward specificity, metrics, scope, constraints, and problem framing.

        readability_obj.obj
        - sectioning: Presence and clarity of standard sections (e.g., Experience, Education, Projects/Skills). Logical order, clear headings, and scan-friendly layout (single column text is fine).
        - action_verbs: Fraction of bullets that start with a strong action verb (e.g., Built, Led, Designed, Reduced, Shipped). Penalize “Responsible for/Assisted with” beginnings. Convert ratio to 0–10.
        - conciseness_and_cinsistency: One-sentence bullets where reasonable; parallel structure; consistent tense and punctuation; minimal fluff.
        - ATS_friendly: Plain, parseable text (no crucial text inside images/tables), standard headings, simple symbols, consistent formatting that common ATS can parse.

        career_ready_obj.obj
        - teamwork_and_leadership: Concrete evidence of collaboration, cross-functional work, mentorship, stakeholder management, ownership of deliverables.
        - communication: Evidence of presenting, documenting, simplifying complex ideas, or communicating results to specific audiences.
        - professionalisum_and_initaitive: Reliability, follow-through, bias for action, self-directed projects, taking ownership beyond assigned tasks.

        OUTPUT FORMAT (STRICT):
        Return ONLY a JSON object with EXACTLY these keys and structure. Use numbers 0–10 (one decimal allowed). No trailing commas.

        {
        "problem_solving": {
            "obj": {
            "quantified_bullet_points": <number 0-10>,
            "star_elements": <number 0-10>,
            "acomplishments": <number 0-10>
            }
        },
        "readability_obj": {
            "obj": {
            "sectioning": <number 0-10>,
            "action_verbs": <number 0-10>,
            "conciseness_and_cinsistency": <number 0-10>,
            "ATS_friendly": <number 0-10>
            }
        },
        "career_ready_obj": {
            "obj": {
            "teamwork_and_leadership": <number 0-10>,
            "communication": <number 0-10>,
            "professionalisum_and_initaitive": <number 0-10>
            }
        }
        }
        `.trim();

    

    const clean = (s) => {
    return s.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/-+/g,"-")
        .replace(/^-+|-+$/g,"");
    }

    const fileToBase64 = async (file) => {
    
        const buf = await file.arrayBuffer();
        let bin = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin); // returns base64 string WITHOUT "data:...;base64," prefix
    }

    const embedSkills = async (skillsJson) => {

        const body = {
            skillsJson
        }

        const res = await fetch("/api/gemini/embedSkills", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(body)
        }) 

        const resultArray = await res.json(); 

        console.log(resultArray);

        return resultArray;
    }

    const onFileChosen = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        const base64pdf = await fileToBase64(file);

        if (!file) {
            return
        }

        if (!(file instanceof Blob)) {
            setError("Selected item isn’t a real file. Please pick a PDF.");
            return;
        }

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"); 

        if (!isPdf) {
            setError("Please upload a PDF file.");
            return;
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
            setError(`File to large. Max size is ${maxFileSizeMB} MB.`);
            return;
        }

        setError(null);
        setUploading(true); 

        try {
            // create unique path for each file
            const unique  = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,6); 
            const path = `${session.user.id}/${unique}-${clean(file.name)}`;

            const { error : uploadError } = await supabase.storage.from("resumepdfs")
                .upload(path, file, { 
                    contentType : file.type || "application/pdf"
                });

            if (uploadError) {
                throw uploadError;
            }

            const row = {
                user_id : session.user.id,
                title : file.name,
                file_path : path,
                analysis_status : "pending",
                score : defaultScore
            };

            const { data : inserted, error : insertError } = await supabase.from("Resumes")
                .insert([row])
                .select("id,title,file_path,created_at,analysis_status,score")
                .single();

            if (insertError) {
                throw insertError;
            }


            const body = {
                SYSTEM_INSTRUCTION_SCORE: SYSTEM_INSTRUCTION_SCORE,
                RESPONSE_SCHEMA_SCORE: RESPONSE_SCHEMA_SCORE,
                SYSTEM_INSTRUCTION_SKILLS: SYSTEM_INSTRUCTION_SKILLS,
                RESPONSE_SCHEMA_SKILLS: RESPONSE_SCHEMA_SKILLS,
                fileType: file.type || "application/pdf",
                base64pdf
            };

            const res = await fetch("/api/gemini/extractScoreAndSkills", {
                method: "POST",
                headers: {"Content-Type" : "application/json"},
                body: JSON.stringify(body)
            });

            const res_JSON = await res.json();

            const scoreJSON = res_JSON.score;
            const skillsJSON = res_JSON.skills; 

            console.log(scoreJSON);
            console.log(skillsJSON);

            if (!res.ok) {
                throw new Error("API Error");
            }

            const embeddedSkills = await embedSkills(skillsJSON);
     
            const { data : updated, error : updateError } = await supabase.from("Resumes")
                .update({
                    analysis_status : "complete",
                    score : scoreJSON,
                    skills_vec : embeddedSkills[0],
                    experience_vec : embeddedSkills[1],
                    education_vec : embeddedSkills[2] 
                })
                .eq("id", inserted.id)
                .select("id,title,file_path,created_at,analysis_status,score")
                .single();
            
            if (updateError) {
                throw updateError;
            }

            setResumes((prev) => [updated, ...prev]);


        } catch (err) {
            setError(err.message || "Upload Failed.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <header className="nav">
            <div className="brand">
                <span className="text">AI Resume Evaluator</span>
            </div>

            <div className="actions">
                <Link className="button-ghost" to="/match">
                    Match a Job to a Resume
                </Link>

                <input 
                    id="resume-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="visually-hidden"
                    onChange={onFileChosen}
                    disabled={uploading}
                />

                <label className="button-primary" htmlFor="resume-input">
                    {uploading ? "Uploading..." : "Upload Resume"}
                </label>
            </div>
        </header>
    )


}

export default DashboardNav; 