import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { getSession, loginUser } from "../lib/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorText, setErrorText] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorText("");

    try {
      loginUser(form);
      navigate("/chat", { replace: true });
    } catch (error) {
      setErrorText(error.message || "Login failed.");
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
          <p className="eyebrow">Welcome back</p>
          <h1>Login to Emory</h1>
          <p>Enter your account details to continue to the chat workspace.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
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
                placeholder="Your password"
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

          {errorText && <p className="authError">{errorText}</p>}

          <button className="primaryButton authSubmit" type="submit">
            <LogIn size={16} /> Login
          </button>
        </form>

        <p className="authSwitch">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
