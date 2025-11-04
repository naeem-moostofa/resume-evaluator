import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./JobMatchPage.css";
import { useNavigate } from "react-router-dom";

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


const isNum = (n) => {
    return typeof n === "number";
}

const dot = (a = [], b = []) => {
    let s = 0;
    const L = Math.min(a.length, b.length);

    for (let i = 0; i < L; i++) {
    const x = a[i], y = b[i];
    if (isNum(x) && isNum(y)) s += x * y;
  }
  return s;
}

const norm = (a = []) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    if (isNum(x)) s += x * x;
  }
  return Math.sqrt(s);
}

const cosine = (a = [], b = []) => {
    const d = dot(a, b);
    const na = norm(a), nb = norm(b);
    if (na === 0 || nb === 0) return 0;
    return d / (na * nb);
}

const means = (nums = []) => {
  if (!nums.length) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

const extractSections = async (jdText) => {

  const prompt = `
      Extract three fields from the Job Description below and return STRICT JSON with keys:
      "skills_text" (list or bullets as plain text),
      "past_experience_text" (short paragraph),
      "education_text" (short paragraph or list).

      Do not return an array object for each field just return a block of text for each field.

      JOB DESCRIPTION:
      ${jdText}
      `.trim();


  const body = {
    prompt: prompt,
    RESPONSE_SCHEMA_SKILLS: RESPONSE_SCHEMA_SKILLS
  } 

  const res = await fetch("/api/gemini/extractSkills", {
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify(body)
  })

  const resultJSON = await res.json();
  return resultJSON;
}

const signedPdfUrl = async (file_path) => {
  if (!file_path) return null;
  const key = String(file_path).replace(/^\/+/, "");
  const { data, error } = await supabase.storage
    .from("resumepdfs")
    .createSignedUrl(key, 60 * 60);
  if (error) throw error;
  return data?.signedUrl || null;
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

const JobMatch = ({session}) => {
  const navigate = useNavigate();
  const userId = session.user.id;

  const [jd, setJd] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const [extracted, setExtracted] = useState(null);
  const [scored, setScored] = useState([]);
  const [best, setBest] = useState(null); 
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setExtracted(null);
    setScored([]);
    setBest(null);

    try {
      setRunning(true);

      const sections = await extractSections(jd);
      setExtracted(sections);

      const embeddedSkills = await embedSkills(sections);

      const { data : rows, error: readError } = await supabase.from("Resumes")
        .select("id,title,file_path,user_id,skills_vec,experience_vec,education_vec")
        .eq("user_id", userId);
      
      if (readError) throw readError; 

      if (!rows?.length) {
        setError("No resumes found for user");
        setRunning(false);
        return;
      }

      const scoredRows = rows.map((r) => {
        const similarities = [];

        const experience_vec = JSON.parse(r.experience_vec);
        const skills_vec = JSON.parse(r.skills_vec);
        const education_vec = JSON.parse(r.education_vec);

        if (Array.isArray(experience_vec) && experience_vec.length) {
          similarities.push(cosine(embeddedSkills[1], experience_vec));
        }

        console.log()
        console.log(typeof(skills_vec));
        console.log()

        if (Array.isArray(skills_vec) && skills_vec.length) {
          console.log()
          console.log(embeddedSkills[0]);
          console.log(skills_vec);
          console.log()
          similarities.push(cosine(embeddedSkills[0], skills_vec));
        } else {
          console.log("Not array")
        }

        if (Array.isArray(education_vec) && education_vec.length) {
          similarities.push(cosine(embeddedSkills[2], education_vec));
        }

        const score = similarities.length ? means(similarities) : 0; 

        return {...r, _score: score};
      });

      scoredRows.sort((a, b) => b._score - a._score);
      setScored(scoredRows);

      const top = scoredRows[0];
      const url = await signedPdfUrl(top.file_path);
      setBest({...top, _pdfUrl: url});

      setRunning(false);
    } catch (e) {
      setError(e.message || "Failed to process job description")
      setRunning(false);
    }
  }


    
   return (
    <div className="jm-page">
      <header className="jm-header">
        <h1 className="jm-title">Match a Job to Your Best Resume</h1>
        <div className="jm-actions">
          <button className="jm-link" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </header>
    <main className="jm-container">

      <form className="jm-form" onSubmit={onSubmit}>
        <label className="jm-label" htmlFor="jd">
          Paste Job Description
        </label>
        <textarea
          id="jd"
          className="jm-textarea"
          rows={12}
          placeholder="Paste the job description here…"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        
        <button className="jm-submit" disabled={running}>
          {running ? "Matching…" : "Find Best Resume"}
        </button>
      </form>

      {error && <div className="jm-error">{error}</div>}

      {extracted && (
        <section className="jm-extracted">
          <h2>Extracted Focus Areas</h2>
          <div className="jm-extracted-grid">
            <article className="jm-card">
              <h3>Skills</h3>
              <pre className="jm-pre">{extracted.skills_text || "—"}</pre>
            </article>
            <article className="jm-card">
              <h3>Previous Experience</h3>
              <pre className="jm-pre">{extracted.past_experience_text || "—"}</pre>
            </article>
            <article className="jm-card">
              <h3>Education</h3>
              <pre className="jm-pre">{extracted.education_text || "—"}</pre>
            </article>
          </div>
        </section>
      )}

      {!!scored.length && (
        <section className="jm-scores">
          <h2>All Matches (Mean Cosine Similarity)</h2>
          <div className="jm-table-wrap">
            <table className="jm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Score</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {scored.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title || "Resume"}</td>
                    <td>{r._score.toFixed(3)}</td>
                    <td>
                      <button
                        className="jm-row-btn"
                        onClick={async () => {
                          try {
                            const url = await signedPdfUrl(r.file_path);
                            setBest({ ...r, _pdfUrl: url });
                          } catch (e) {
                            setError(e?.message || "Failed to open resume.");
                          }
                        }}
                      >
                        Preview
                      </button>
                      <button
                        className="jm-row-btn jm-alt"
                        onClick={() => navigate(`/dashboard/${r.id}`)}
                      >
                        Open Full View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {best && (
        <section className="jm-best">
          <div className="jm-best-head">
            <h2>
              Best Match: <span className="jm-best-name">{best.title || "Resume"}</span>
            </h2>
            <div className="jm-best-cta">
              <button className="jm-row-btn jm-alt" onClick={() => navigate(`/dashboard/${best.id}`)}>
                Open in ViewResume
              </button>
              {best._pdfUrl && (
                <a className="jm-row-btn" href={best._pdfUrl} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
              )}
            </div>
          </div>
          <div className="jm-viewer">
            {best._pdfUrl ? (
              <iframe className="jm-pdf" src={best._pdfUrl} title="Best Resume PDF" />
            ) : (
              <div className="jm-viewer-fallback">No preview available.</div>
            )}
          </div>
        </section>
      )}
    </main>
      
    </div>
  );
}

export default JobMatch;