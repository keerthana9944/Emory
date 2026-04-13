import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Bot,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  LogOut,
  MessageSquare,
  History,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { getSession, logoutUser } from "../lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/chat";
const CODE_FENCE_REGEX = /```([\w-]*)\n([\s\S]*?)```/g;
const RECENT_CUTOFF_MS = 24 * 60 * 60 * 1000;

const CodeSnippet = ({ code, language, onCopy, snippetId, copiedSnippetId }) => {
  const isCopied = copiedSnippetId === snippetId;

  return (
    <div className="messageCodeShell">
      <div className="messageCodeHeader">
        <div className="messageCodeLabel">{language || "text"}</div>
        <button type="button" className="messageCodeCopyButton" onClick={() => onCopy(code, snippetId)}>
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        className="messageCodeBlock"
        language={language || "text"}
        style={oneDark}
        wrapLongLines
        customStyle={{
          margin: 0,
          borderRadius: "14px",
          padding: "14px 16px",
          background: "#081c27",
          border: "1px solid rgba(17, 76, 95, 0.28)",
          overflowX: "auto",
          fontSize: "13px",
          lineHeight: 1.65,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const looksLikeCode = (content) => {
  if (typeof content !== "string") return false;

  const trimmedContent = content.trim();
  if (!trimmedContent) return false;

  const codeSignals = [
    /\b(public|private|protected|class|function|const|let|var|return|import|export|def|if|else|for|while|try|catch|new)\b/,
    /[{}();]/,
    /\b(System\.out\.print|console\.log|printf|println)\b/,
  ];

  const hasManyLines = trimmedContent.split("\n").length > 1;
  const signalMatches = codeSignals.filter((pattern) => pattern.test(trimmedContent)).length;

  return hasManyLines || signalMatches >= 2 || (signalMatches >= 1 && trimmedContent.length > 80);
};

const renderContent = (content, role, onCopy, copiedSnippetId) => {
  if (typeof content !== "string") return null;

  const matches = [...content.matchAll(CODE_FENCE_REGEX)];

  if (matches.length === 0) {
    if (role === "assistant" && looksLikeCode(content)) {
      return (
        <CodeSnippet
          code={content}
          language="text"
          onCopy={onCopy}
          snippetId={`plain-${content.slice(0, 32)}`}
          copiedSnippetId={copiedSnippetId}
        />
      );
    }

    return <p className="messageText">{content}</p>;
  }

  const parts = [];
  let lastIndex = 0;

  content.replace(CODE_FENCE_REGEX, (fullMatch, language, code, offset) => {
    const before = content.slice(lastIndex, offset).trim();

    if (before) {
      parts.push(
        <p className="messageText" key={`text-${offset}`}>
          {before}
        </p>,
      );
    }

    parts.push(
      <CodeSnippet
        key={`code-${offset}`}
        code={code.trimEnd()}
        language={language || "text"}
        onCopy={onCopy}
        snippetId={`fence-${offset}`}
        copiedSnippetId={copiedSnippetId}
      />,
    );

    lastIndex = offset + fullMatch.length;
    return fullMatch;
  });

  const after = content.slice(lastIndex).trim();
  if (after) {
    parts.push(
      <p className="messageText" key={`after-${lastIndex}`}>
        {after}
      </p>,
    );
  }

  return <div className="messageBody">{parts}</div>;
};

function ChatPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);
  const [isFetchingConversation, setIsFetchingConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState("recent");
  const [copiedSnippetId, setCopiedSnippetId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCompact, setIsDesktopCompact] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(window.innerWidth > 900);
  const chatEndRef = useRef(null);
  const copyResetTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const historyListRef = useRef(null);

  const hasActiveConversation = messages.length > 0 || Boolean(conversationId);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [conversations]);

  const recentConversations = useMemo(() => {
    const now = Date.now();
    return sortedConversations.filter((conversation) => {
      const timestamp = new Date(conversation.updatedAt || conversation.createdAt || 0).getTime();
      return now - timestamp <= RECENT_CUTOFF_MS;
    });
  }, [sortedConversations]);

  const historyConversations = useMemo(() => {
    const now = Date.now();
    return sortedConversations.filter((conversation) => {
      const timestamp = new Date(conversation.updatedAt || conversation.createdAt || 0).getTime();
      return now - timestamp > RECENT_CUTOFF_MS;
    });
  }, [sortedConversations]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sourceConversations = sidebarSection === "recent" ? recentConversations : historyConversations;

    if (!query) {
      return sourceConversations;
    }

    return sourceConversations.filter((conversation) => {
      const list = Array.isArray(conversation.messages) ? conversation.messages : [];
      const searchText = list
        .map((message) => message.content)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [historyConversations, recentConversations, searchQuery, sidebarSection]);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    const syncSidebarState = () => {
      const wideViewport = window.innerWidth > 900;
      setIsDesktopViewport(wideViewport);
      setIsSidebarOpen(wideViewport);
    };

    syncSidebarState();
    window.addEventListener("resize", syncSidebarState);

    return () => window.removeEventListener("resize", syncSidebarState);
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      setIsFetchingConversations(true);
      try {
        const { data } = await axios.get(API_BASE_URL);
        setConversations(Array.isArray(data) ? data : []);
      } catch {
        setErrorText("Could not load conversation history. You can still start a new chat.");
      } finally {
        setIsFetchingConversations(false);
      }
    };

    loadConversations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      window.clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const handleCopyCode = async (code, snippetId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippetId(snippetId);
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedSnippetId("");
      }, 1500);
    } catch {
      setErrorText("Could not copy code to clipboard.");
    }
  };

  const refreshConversations = async () => {
    try {
      const { data } = await axios.get(API_BASE_URL);
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // non-blocking
    }
  };

  const openConversation = async (id) => {
    if (!id || isFetchingConversation || isLoading) return;

    setErrorText("");
    setIsFetchingConversation(true);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/${id}`);
      const loadedMessages = Array.isArray(data?.messages)
        ? data.messages.map((msg) => ({ role: msg.role, content: msg.content }))
        : [];

      setConversationId(data?._id || id);
      setMessages(loadedMessages);
      setIsSidebarOpen(false);
    } catch {
      setErrorText("Could not open that conversation. Please try another one.");
    } finally {
      setIsFetchingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim();
    setErrorText("");
    setMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
    setInput("");
    setIsLoading(true);

    try {
      const { data } = await axios.post(API_BASE_URL, {
        message: trimmedInput,
        conversationId,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: data?.reply || "I could not generate a response." }]);

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      refreshConversations();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please verify backend and try again." },
      ]);
      setErrorText("Message send failed. Confirm backend, database, and Ollama are running.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setInput("");
    setErrorText("");
    setConversationId(null);
    setIsSidebarOpen(false);
    setSidebarSection("recent");
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  const showHistory = () => {
    setSidebarSection("history");
    setIsSearchOpen(false);
    setSearchQuery("");
    historyListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const expandSidebarForAction = () => {
    if (isDesktopViewport) {
      setIsDesktopCompact(false);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const toggleSearch = () => {
    expandSidebarForAction();
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(focusSearch);
      } else {
        setSearchQuery("");
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    if (isDesktopViewport) {
      setIsDesktopCompact((prev) => !prev);
      return;
    }

    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/", { replace: true });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const formatTime = (isoDate) => {
    if (!isoDate) return "Just now";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const lastMessagePreview = (conversation) => {
    const list = Array.isArray(conversation.messages) ? conversation.messages : [];
    const last = list[list.length - 1];
    if (!last?.content) return "New conversation";
    return last.content.length > 60 ? `${last.content.slice(0, 60)}...` : last.content;
  };

  return (
    <div className="app">
      <main
        className={`layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"} ${
          isDesktopCompact ? "sidebar-compact" : ""
        }`}
      >
        <button
          type="button"
          className="sidebarToggle"
          onClick={toggleSidebar}
          aria-label={isDesktopViewport ? (isDesktopCompact ? "Expand sidebar" : "Collapse sidebar") : isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isDesktopViewport ? (isDesktopCompact ? <ChevronRight size={18} /> : <ChevronLeft size={18} />) : isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {isSidebarOpen && <button type="button" className="sidebarBackdrop" onClick={closeSidebar} aria-label="Close sidebar overlay" />}

        <aside className="sidebar">
          <div className="sidebarTop">
            <div className="brandWrap">
              <button
                className="sidebarChip"
                type="button"
                onClick={toggleSidebar}
                aria-label={isDesktopViewport ? (isDesktopCompact ? "Expand sidebar" : "Collapse sidebar") : isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                data-tooltip={isDesktopViewport ? (isDesktopCompact ? "Expand" : "Collapse") : isSidebarOpen ? "Close" : "Open"}
              >
                <div className="sidebarChipOrb">
                  <span />
                  <span />
                </div>
                <div className="sidebarChipPulse" />
              </button>
              <p className="brandMark">AI Assistant</p>
              <h1 className="brandName">Emory</h1>
            </div>

            <div className="sidebarToolbar">
              <button
                className="sidebarToolButton"
                onClick={() => {
                  toggleSearch();
                }}
                type="button"
                aria-label="Search previous chats"
                data-tooltip="Search"
              >
                <Search size={16} /> <span>Search</span>
              </button>
              <button
                className="sidebarToolButton"
                onClick={() => {
                  expandSidebarForAction();
                  showHistory();
                }}
                type="button"
                aria-label="Show chat history"
                data-tooltip="History"
              >
                <History size={16} /> <span>History</span>
              </button>
              <button
                className="sidebarToolButton primary"
                onClick={() => {
                  expandSidebarForAction();
                  startNewConversation();
                }}
                disabled={isLoading}
                type="button"
                aria-label="Start a new chat"
                data-tooltip="New chat"
              >
                <Plus size={16} /> <span>New chat</span>
              </button>
            </div>

            <div className={`sidebarSearch ${isSearchOpen ? "visible" : "hidden"}`}>
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search previous chats"
                aria-label="Search previous chats"
              />
            </div>

            <div className="historyHeader">
              <h2>{sidebarSection === "recent" ? "Recent Conversations" : "History"}</h2>
              <span className="historyCount">{filteredConversations.length}</span>
              {isFetchingConversations && <LoaderCircle className="spinIcon" size={16} />}
            </div>
          </div>

          <div className="historyList" aria-live="polite" ref={historyListRef}>
            {filteredConversations.length === 0 && !isFetchingConversations && (
              <p className="historyEmpty">
                {searchQuery.trim()
                  ? "No chats match your search."
                  : sidebarSection === "recent"
                    ? "No chats from the last 24 hours."
                    : "No older chat history found."}
              </p>
            )}

            {filteredConversations.map((conversation) => {
              const isSelected = conversation._id === conversationId;

              return (
                <button
                  key={conversation._id}
                  className={`historyItem ${isSelected ? "selected" : ""}`}
                  onClick={() => openConversation(conversation._id)}
                  disabled={isLoading || isFetchingConversation}
                >
                  <div className="historyItemTop">
                    <MessageSquare size={16} />
                    <span>{formatTime(conversation.updatedAt || conversation.createdAt)}</span>
                  </div>
                  <p>{lastMessagePreview(conversation)}</p>
                </button>
              );
            })}
          </div>

          <div className="robotDock" aria-label="Cute assistant robot decoration">
            <div className="robotGlow" aria-hidden="true" />
            <div className="robot">
              <div className="robotAntenna left" aria-hidden="true" />
              <div className="robotAntenna right" aria-hidden="true" />
              <div className="robotHead" aria-hidden="true">
                <div className="robotEyes">
                  <span />
                  <span />
                </div>
                <div className="robotMouth" />
              </div>
              <div className="robotBody" aria-hidden="true">
                <div className="robotArm left" />
                <div className="robotCore">
                  <Sparkles size={14} />
                </div>
                <div className="robotArm right" />
              </div>
              <div className="robotFeet" aria-hidden="true">
                <span />
                <span />
              </div>
            </div>
            <p className="robotCaption">Tiny helper, always ready.</p>
          </div>
        </aside>

        <section className="content">
          <header className="topBar">
            <div>
              <p className="topBarLabel">Personal AI Workspace</p>
              <h2>Hi, {session?.name || "there"}</h2>
            </div>
            <button className="logoutButton" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </header>

          <div className="chatArea">
            {!hasActiveConversation && (
              <section className="landingPanel">
                <div className="landingTitle">
                  <Sparkles size={18} />
                  <p>Chat Workspace</p>
                </div>
                <h3>Start a new conversation or continue from your history.</h3>
                <p>
                  This chat area stays behind login, while landing, login, and signup are now separate pages.
                </p>
              </section>
            )}

            <section className={`messagesPanel ${!hasActiveConversation ? "soft" : ""}`}>
              {messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`bubble ${msg.role}`}>
                  <div className="avatar">{msg.role === "user" ? <UserCircle2 size={16} /> : <Bot size={16} />}</div>
                  {renderContent(msg.content, msg.role, handleCopyCode, copiedSnippetId)}
                </div>
              ))}

              {isFetchingConversation && (
                <div className="inlineLoader">
                  <LoaderCircle className="spinIcon" size={18} />
                  Loading conversation...
                </div>
              )}

              {isLoading && (
                <div className="inlineLoader">
                  <LoaderCircle className="spinIcon" size={18} />
                  Emory is thinking...
                </div>
              )}

              {!isLoading && !isFetchingConversation && messages.length === 0 && (
                <p className="emptyMessage">Start by asking a question about anything.</p>
              )}

              <div ref={chatEndRef} />
            </section>

            {errorText && <p className="errorText">{errorText}</p>}

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <textarea
                className="composerInput"
                placeholder="Ask Emory anything..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={1}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading || isFetchingConversation}
              />
              <button type="submit" disabled={isLoading || isFetchingConversation || !input.trim()}>
                <SendHorizontal size={18} />
                Send
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ChatPage;
