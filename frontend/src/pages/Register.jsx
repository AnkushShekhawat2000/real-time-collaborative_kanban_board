import { Link } from "react-router-dom";

const Register = () => (
    <main className="auth-container">
        <section className="auth-card">
            <h1>Create Account</h1>
            <p>
                Registration form will be implemented in the next
                authentication step.
            </p>
            <Link to="/login">Back to Login</Link>
        </section>
    </main>
);

export default Register;
