import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./ViewResume.css"

const ViewResume = ({ session }) => {
    const { id } = useParams(); 
    const userId = session?.user?.id; 

    const [row, setRow] = useState(null);
    const [resume, setResume] = useState(null); 
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (!userId || !id) {
            return;
        }

        const run = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error } = await supabase.from("Resumes")
                    .select("id,title,file_path,created_at,analysis_status,score,user_id")
                    .eq("id",id).single();

                if (error) {
                    throw error;
                }

                if (!data || data.user_id !== userId) {
                    throw new Error("Record Not Found.");
                }

                setRow(data);

                if (data.file_path) {
                    const { data : resume_url, error : storage_error } = await supabase.storage
                        .from("resumepdfs").createSignedUrl(data.file_path, 60 * 60);

                    if (storage_error) {
                        throw storage_error;
                    }

                    setPdfUrl(resume_url?.signedUrl || null); 
                } else {
                    setPdfUrl(null);
                }

            } catch (e) {
                setError(e.message || "Failed to Load Resume"); 
            } finally {
                setLoading(false);
            }

           
        }

        run(); 
    }, [userId, id]); 

    function round_one(n) {
        return Math.round(n * 10) / 10;
    } 

    function buildSubsAndAvg(obj = {}) {
        const subs = [];
        let sum = 0;
        let count = 0;
        for (const k in obj) {
        const val = obj[k];
        if (typeof val === "number") {
            subs.push({ key: k, label: k.replace(/_/g, " "), value: val });
            sum += val;
            count += 1;
        }
        }
        const avg = count ? round_one(sum / count) : null;
        return { subs, avg };
    }

    function formatCategories(score = {}) {
        
        const problem_solving_obj = score.problem_solving?.obj || {};
        const career_ready_obj    = score.career_ready_obj?.obj || {};
        const readability_obj     = score.readability_obj?.obj || {};

        const ps = buildSubsAndAvg(problem_solving_obj);
        const cr = buildSubsAndAvg(career_ready_obj);
        const rd = buildSubsAndAvg(readability_obj);

        return [
        { key: "problem_solving", label: "Problem Solving", avg: ps.avg, subs: ps.subs },
        { key: "career_ready",    label: "Career Ready",    avg: cr.avg, subs: cr.subs },
        { key: "readability",     label: "Readability",     avg: rd.avg, subs: rd.subs },
        ];
    }

    const categories = formatCategories(row?.score);

    const deleteResume = async () => {
        if (!row) {
            return;
        }

        try {
            setDeleting(true);

            const key = String(row.file_path || "").replace(/^\/+/, "");

            if (key) {
                const { error : remErr } = await supabase.storage.from("resumepdfs")
                    .remove([key]);

                if (remErr) {
                    throw remErr;
                }

                const { error : delErr } = await supabase.from("Resumes").delete()
                    .eq("id", row.id);
                
                if (delErr) {
                    throw delErr;
                }
            }

            navigate("/dashboard");
            
        } catch (e) {
            setError(e.message);
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="vr-status">Loading...</div>
        )
    }

    if (error) {
        return (
            <div className="vr-error">{error}</div>
        )
    }

    if (!row) {
        return (
            <div className="vr-error">Not Found</div>
        )
    }

    return (
        <div className="vr-page">
            <header className="vr-header">
                <h1 className="vr-title">{row.title || "Resume"}</h1>
                <button className="vr-del-btn" onClick={() => deleteResume()}>
                    Delete Resume
                </button>

                <button className="vr-done-btn" onClick={() => navigate("/dashboard")}>
                    Done
                </button>

                
            </header>

            <main className="vr-main">
                <div className="vr-viewer-wrap">
                    { pdfUrl ? (
                        <iframe className="vr-pdf" src={pdfUrl} title="Resume PDF" />
                    ) : (
                        <div className="vr-viewer-fallback">
                            No preview available.
                        </div>
                        
                    ) } 
                </div>

                <section className="vr-scores">
                    {categories.map((c) => (
                        <article key={c.key} className="vr-score-card">
                        <div className="vr-score-head">
                            <h3 className="vr-score-label">{c.label}</h3>
                            {typeof c.avg === "number" ? (
                            <div className="vr-score-avg">{c.avg}</div>
                            ) : (
                            <div className="vr-score-avg vr-score-na">–</div>
                            )}
                        </div>

                        {!!c.subs?.length && (
                            <div className="vr-subscore-row">
                            {c.subs.map((s) => (
                                <div key={s.key} className="vr-subscore">
                                <span className="vr-subscore-name">{s.label}</span>
                                <span className="vr-subscore-val">{s.value}</span>
                                </div>
                            ))}
                            </div>
                        )}
                        </article>
                    ))}
                </section>
            </main>
        </div>
    )
}

export default ViewResume;