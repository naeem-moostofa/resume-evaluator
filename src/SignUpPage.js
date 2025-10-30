import "./AuthPage.css"
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "./supabaseClient";

const SignUpPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.signUp({ email, password })

        if (error) {
            setError(error.message);
        } else {
            navigate('/dashboard');
        }
    }

    return (
        <div className="page">
            <div className="card">
                <h2 className="title">Create Account</h2>
                <form onSubmit={handleSignUp} className="form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    /><br />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    /><br />
                    <button type="submit" className="button">Sign Up</button>
                </form>
            {error && <p className="error">{error}</p>}
            <p className="meta">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    </div>
    )
}

export default SignUpPage;