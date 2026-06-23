// src/pages/register.tsx
//
// This page maps to the URL /register (Pages Router: filename = route).
//
// FLOW:
//   1. User fills the form
//   2. We call registerUser() from lib/api.ts
//   3. On success, the backend returns a User object (no token —
//      look at backend/api/auth.py: /register doesn't log you in)
//   4. So we immediately call loginUser() to get a token
//   5. Save the token via useAuth().login() and redirect to dashboard

import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { loginUser, registerUser } from "@/lib/api";
import { ApiRequestError } from "@/lib/api";

export default function RegisterPage() {
  // ── Form field state ───────────────────────────────────────
  // Each input is "controlled" — its value lives in React state,
  // not in the DOM. This is the standard React form pattern.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [learningLevel, setLearningLevel] = useState("beginner");

  // ── UI state ───────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the browser's default full-page-reload form submit
    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: create the account
      await registerUser({ name, email, password, learning_level: learningLevel });

      // Step 2: register doesn't return a token, so log in right after
      // to get one. This keeps the backend's /register endpoint simple
      // (just creates the row) while giving the user a seamless experience.
      const tokenResponse = await loginUser({ email, password });

      // Step 3: persist token + user, update auth state
      login(tokenResponse.access_token, tokenResponse.user);

      // Step 4: send them to the dashboard
      router.push("/dashboard");
    } catch (err) {
      // ApiRequestError carries the backend's exact error message
      // (e.g. "Email already registered")
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start learning smarter today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Yusuf Adekunle"
          />
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="At least 8 characters"
          />
        </div>

        {/* Learning level select */}
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-1">
            Your current level
          </label>
          <select
            id="level"
            value={learningLevel}
            onChange={(e) => setLearningLevel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Error message — only rendered if error is not null */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
