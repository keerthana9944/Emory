const USERS_KEY = "emory-users";
const SESSION_KEY = "emory-session";

const readJson = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getUsers = () => readJson(USERS_KEY, []);

export const getSession = () => readJson(SESSION_KEY, null);

export const registerUser = ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  writeJson(USERS_KEY, [...users, user]);
  writeJson(SESSION_KEY, {
    id: user.id,
    name: user.name,
    email: user.email,
    loggedInAt: new Date().toISOString(),
  });

  return user;
};

export const loginUser = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find((entry) => entry.email === normalizedEmail && entry.password === password);

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  writeJson(SESSION_KEY, {
    id: user.id,
    name: user.name,
    email: user.email,
    loggedInAt: new Date().toISOString(),
  });

  return user;
};

export const logoutUser = () => {
  window.localStorage.removeItem(SESSION_KEY);
};
