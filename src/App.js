import './App.css';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './LoginPage'
import SignUpPage from './SignUpPage';
import LandingPage from './LandingPage';
import Footer from './Footer';
import Dashboard from './Dashboard';
import ViewResume from './ViewResume';
import JobMatch from './JobMatch';

function App() {
  const [session, setSession] = useState(null); 
  

  useEffect(() => {
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  
    return () => {
      subscription?.unsubscribe()
    }

  }, [])

  return (
    <BrowserRouter>
    <div className='app-shell'>
      <div className='app-content'>
        <Routes>

          <Route 
            path="/"
            element={
              <LandingPage />
            }
          />

          <Route
            path="/signup"
            element={
              session ? <Navigate to="/dashboard" replace /> : <SignUpPage />
            }
          />

          <Route 
            path="/login"
            element={
              session ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />

          <Route 
            path="/dashboard"
            element={
              session ? <Dashboard session={session}/> : <Navigate to="/" replace/>
            }
          />

          <Route 
            path="/dashboard/:id"
            element={
              session ? <ViewResume session={session}/> : <Navigate to="/" replace/>
            }
          />

          <Route 
            path="/match"
            element={
              session ? <JobMatch session={session}/> : <Navigate to="/" replace/>
            }
          />
        </Routes>

        
      </div>
      
      <Footer />
    </div>
      
    </BrowserRouter>
  );
}

export default App;
