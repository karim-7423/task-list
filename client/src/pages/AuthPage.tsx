import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentUser = queryClient.getQueryData(["auth", "me"]);

  const mutation = useMutation({
    mutationFn: mode === "login" ? api.login : api.register,
    onSuccess: async (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/");
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    }
  });

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate({ username, password });
  }

  return (
    <div className="auth-page">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="auth-card">
        <span className="eyebrow">Task Webapp</span>
        <h1>{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
        <p className="auth-copy">
          A polished personal task board for testing real task workflows end to end.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="demo"
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Working..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <p className="auth-footer">
          {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create one" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
