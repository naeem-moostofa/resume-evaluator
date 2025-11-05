# Resume Evaluator
![React](https://img.shields.io/badge/React-18+-informational?logo=react&logoColor=white&color=61dafb)
![Supabase](https://img.shields.io/badge/Supabase-Backend%20%2F%20Auth-success?logo=supabase&logoColor=white&color=3ecf8e)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)
![Google Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-blue?logo=google&logoColor=white)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fairesume-evaluator.vercel.app)](https://airesume-evaluator.vercel.app)

AI Powered Resume Evaluator.

## Project Description

AI Resume Evaluatorweb app that helps you improve your resume and find your best resume for any job. It’s built with React on the frontend, uses **Supabase** for the backend (Postgres, Storage, and Auth), and is deployed on **Vercel**. Google Gemini is used to extract structured resume data, generate scores and feedback, and create embeddings for matching.

**Key features:**
- **Upload a resume to get a score and feedback** A score is given to each of the three categories: problem solving, carrer readiness, and readability; each of which are further broken down into sub scores. Specific feedback is also given for each of the three sections. All of this is done through one Gemini API call.   
<img src="https://github.com/user-attachments/assets/9a48149e-e001-40ce-8888-b5de700d4173" width="400" alt="image" />
 
- **Upload/paste a job description and find your best-matching resume(s)** When each resume is uploaded key sections are extracted and embedded using the Gemini API. Similarly, when a job description is uploaded the same key sections are extracted and embdedded. Then, resumes are ranked using a mean cosine similarity for each section. This allows quick comparison with resumes and works best when users have many resumes and are applying to many jobs.  
<img src="https://github.com/user-attachments/assets/c61acf00-870f-4f3a-b414-c15ac985e6f7" width="400" alt="image" />


Additional details:
- Supabase is used for authentical allowing users to login or sign up with an email and password. Row Level Security is enabled to ensure only sueres can see their data.
- Vercel serverless functions are used for LLM processing through the Gemini API 

---

## How to Use

Try it at: https://airesume-evaluator.vercel.app/


To use locally:

1. Clone the repository
2. Create a .env file with `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`. Your supabase project should have a table called Resumes and columns for: id, user_id, title, file_path, created_at, analysis_status, score, skills_vec, experience_vec, education vec. There should also be a storage bucked called resumepdfs.
