import "./AuthPage.css"
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "./supabaseClient";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogIn = async (e) => {
        e.preventDefault();

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
        } else {
            navigate("/dashboard");
        }
    }

    return (
        <div className="page">
            <div className="card">
                <h2 className="title">Log in</h2>
                <form onSubmit={handleLogIn} className="form">
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
                Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    </div>
    )
}

export default LoginPage;