import "./Dashboard.css"
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import DashboardNav from "./DashboardNav";

const Dashboard = ({ session }) => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const maxFileSizeMB = 10; 

    const userId = session?.user?.id;
    // console.log(userId)

    useEffect(() => {

        if (!userId) {
            return;
        }

        const loadResumes = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("Resumes").select("id,title,file_path,created_at,analysis_status,score")
                .eq("user_id", userId).order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setResumes(data || []);
            }

            setLoading(false);
        }

        loadResumes();
    }, [userId]);

    return (
        <div className="dash-page">

            <DashboardNav session={session} error={error} setError={setError} maxFileSizeMB={maxFileSizeMB}
                 setResumes={setResumes}/>

            <main className="dash-main">
                <h1 className="dash-title">Your Resumes</h1>

                {error && <div className="error">{error}</div>}
                {loading && <div className="status">Loading...</div>}

                {!loading && !error && resumes.length === 0 && (
                    <div className="empty">
                        You have not uploaded any resumes yet.
                    </div>
                )}

                {!loading && !error && resumes.length > 0 && (
                    <ul className="resume-list">
                        {resumes.map((r) => (
                            <li key={r.id} className="resume-item">
                                <Link className="resume-link" to={`/dashboard/${r.id}`}>
                                    <span className="resume-name">{r.title || "Untitled resume"}</span>
                                    <span className="resume-date">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    )
} 

export default Dashboard;