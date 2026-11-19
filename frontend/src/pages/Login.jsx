import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth.js";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(form.email, form.password);
            navigate("/dashboard", { replace: true });
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-container">
            <section className="auth-card">
                <h1>Welcome Back</h1>
                <p>Login to your Kanban workspace</p>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="admin@example.com"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p>
                    Don&apos;t have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>
            </section>
        </main>
    );
};

export default Login;
