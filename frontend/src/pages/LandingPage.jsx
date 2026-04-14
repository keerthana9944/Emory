import { Link } from "react-router-dom";
import { ArrowRight, Shield, Sparkles, MessagesSquare, Code2, Download } from "lucide-react";

function LandingPage() {
  return (
    <div className="pageShell landingShell">
      <section className="landingHero cardSurface">
        <div className="heroBadge">
          <Sparkles size={16} />
          <span>Local AI Workspace</span>
        </div>

        <h1>Emory helps you chat, build, and study in one place.</h1>
        <p>
          A clean landing page for your project with separate login and signup flows, plus a protected chat
          workspace for your saved conversations.
        </p>

        <div className="heroActions">
          <Link className="primaryButton" to="/signup">
            Create account <ArrowRight size={16} />
          </Link>
          <Link className="secondaryButton" to="/login">
            Login
          </Link>
          <a className="secondaryButton setupButton" href="/setup-local.ps1" download>
            <Download size={16} /> Try it locally (Windows)
          </a>
          <a className="secondaryButton setupButton" href="/setup-local.sh" download>
            <Download size={16} /> Try it locally (macOS/Linux)
          </a>
        </div>

        <div className="heroStats">
          <article>
            <MessagesSquare size={18} />
            <strong>Chat memory</strong>
            <span>Saved conversations and resume support</span>
          </article>
          <article>
            <Code2 size={18} />
            <strong>Code-friendly</strong>
            <span>Pretty code rendering with copy support</span>
          </article>
          <article>
            <Shield size={18} />
            <strong>Private login</strong>
            <span>Separate login and signup screens</span>
          </article>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
