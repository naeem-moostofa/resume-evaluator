# Resume Evaluator

## Project Description

AI Resume Evaluatorweb app that helps you improve your resume and find your best resume for any job. It’s built with React on the frontend, uses **Supabase** for the backend (Postgres, Storage, and Auth), and is deployed on **Vercel**. Google Gemini is used to extract structured resume data, generate scores and feedback, and create embeddings for matching.

**Key features:**
- **Upload a resume to get a score and feedback** (problem solving, carrer readiness, readability):  
<img src="https://github.com/user-attachments/assets/9a48149e-e001-40ce-8888-b5de700d4173" width="400" alt="image" />
 
- **Upload/paste a job description and find your best-matching resume(s)** via cosine similarity over stored embeddings.  
  _Screenshot placeholder:_  
  `![JobMatch UI](./docs/images/job-match.png)`

Additional details:
- Supabase Auth (email/password or social if enabled) and Row Level Security so users only see their own data.
- Supabase Storage for raw PDF uploads.
- Vercel serverless functions for LLM calls and file processing.
- Embedding vectors cached to minimize re-processing and speed up matching.

---

## How to Use

1. Open the hosted app: **[Add your Vercel link here]**
2. Sign up or sign in (Supabase Auth).
3. **Upload a resume (PDF)** and wait for analysis. View the overall score, category scores, and improvement suggestions.
4. **Paste or upload a job description** to rank your stored resumes by similarity and see quick rationales/missing skills.
5. Iterate on your resume offline, re-upload, and compare scores to track improvements.
