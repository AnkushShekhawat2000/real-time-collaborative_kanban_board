import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
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

        const name = form.name.trim();

        if (name.length < 2 || name.length > 100) {
            setError("Name must be between 2 and 100 characters.");
            return;
        }

        if (form.password.length < 8 || form.password.length > 72) {
            setError("Password must be between 8 and 72 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await register(name, form.email.trim(), form.password);
            const token = result.token || result.data?.token;

            navigate(token ? "/dashboard" : "/login", { replace: true });
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-container">
            <section className="auth-card">
                <h1>Create Account</h1>
                <p>Join your collaborative workspace.</p>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="register-name">Full Name</label>
                    <input
                        id="register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        maxLength={100}
                        required
                    />

                    <label htmlFor="register-email">Email Address</label>
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />

                    <label htmlFor="register-password">Password</label>
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="8-72 characters"
                        minLength={8}
                        maxLength={72}
                        required
                    />

                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
                        minLength={8}
                        maxLength={72}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
