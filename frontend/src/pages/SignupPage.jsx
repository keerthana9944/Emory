import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { getSession, registerUser } from "../lib/auth";

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errorText, setErrorText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorText("");

    if (form.password !== form.confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    try {
      registerUser(form);
      navigate("/chat", { replace: true });
    } catch (error) {
      setErrorText(error.message || "Signup failed.");
    }
  };

  if (getSession()) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="pageShell authShell">
      <div className="authCard cardSurface">
        <Link className="backLink" to="/">
          <ArrowLeft size={16} /> Back to landing
        </Link>

        <div className="authHeader">
          <p className="eyebrow">Create your account</p>
          <h1>Sign up for Emory</h1>
          <p>Make a local account to store your session and open the chat workspace.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Your name"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <div className="passwordField">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Confirm password
            <div className="passwordField">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder="Repeat your password"
                required
              />
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {errorText && <p className="authError">{errorText}</p>}

          <button className="primaryButton authSubmit" type="submit">
            <UserPlus size={16} /> Create account
          </button>
        </form>

        <p className="authSwitch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
