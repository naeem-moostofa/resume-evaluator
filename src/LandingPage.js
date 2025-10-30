import { Link } from 'react-router-dom';
import "./LandingPage.css"

const LandingPage = () => {
    return (
        <div className="page">
            
            <header className="nav">
                <div className="brand">

                <span className="brand-text">AI Resume Evaluator</span>
                </div>

                <nav className="nav-links">
                <Link className="link" to="/login">Log in</Link>
                <Link className="btn btn-primary" to="/signup">Sign up</Link>
                </nav>
            </header>
          
            <main className="main">
                <section className="intro">
                <div className="intro-copy">
                    <h1 className="intro-title">Instant, AI-powered resume insights</h1>
                    <p className="intro-subtitle">
                    Upload a resume to get a clear score instantly. Paste a job description and get the best resume that fits it.
                    </p>

                </div>

                <div className="intro-art">
                    <img
                    className="intro-img"
                    src="/images/dashboard.png"
                    alt="Product preview placeholder"
                    loading="eager"
                    decoding="async"
                    />
                    <div className="intro-glow" />
                </div>
                </section>

                <section className="section">
                <div className="section-header">
                    <h2>What it does</h2>
                </div>

                <div className="grid grid-two">
                    <article className="card fade-in">
                    <h3 className="card-title">Upload a resume → get a score</h3>
                    <p className="card-body" style={{ marginBottom: 16}}>
                        See strengths and gaps instantly, so you know exactly what to improve
                    </p>
                    <img
                        className="card-img"
                        src="/images/resume-score.png"
                        alt="Resume scoring placeholder"
                        loading="lazy"
                        decoding="async"
                    />
                    
                    
                    </article>

                    <article className="card fade-in" style={{ animationDelay: "120ms" }}>
                    <h3 className="card-title">Job Description → best-fit resume</h3>
                    <p className="card-body" style={{ marginBottom: 16}}>
                        Paste a Job Description and instantly find the resume that fits it best
                    </p>
                    <p></p>
                    <img
                        className="card-img"
                        src="/images/job-match.png"
                        alt="Job description matching placeholder"
                        loading="lazy"
                        decoding="async"
                    />
                    
                    </article>
                </div>
                </section>
            </main>
        </div>
  );
}

export default LandingPage;