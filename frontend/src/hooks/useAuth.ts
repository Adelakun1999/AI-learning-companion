// src/hooks/useAuth.ts
//
// WHY THIS FILE EXISTS:
//   Many components need to know: "is the user logged in?" and
//   "who is the current user?". Instead of repeating localStorage
//   reads everywhere, this hook centralises that logic and gives
//   components a clean, reactive interface.
//
// NOTE: Unlike App Router, Pages Router does NOT need a "use client"
// directive. Every file in src/pages/ and every component it imports
// runs as a normal React component — hooks just work.

import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // next/router, not next/navigation, in Pages Router
import { clearToken, getToken, getUser, saveToken, saveUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export function useAuth() {
  // We start as "loading" because on first render we don't yet know
  // if there's a token in localStorage (this runs after hydration).
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // useEffect runs AFTER the component mounts in the browser.
  // This is the correct place to read localStorage — it guarantees
  // we're running on the client, not during server rendering.
  useEffect(() => {
    const token = getToken();
    const cachedUser = getUser<User>();

    if (token && cachedUser) {
      setUser(cachedUser);
    }
    setIsLoading(false);
  }, []);

  /**
   * Call this after a successful login or register API call.
   * Persists the token + user, and updates local state immediately
   * so the UI reflects the logged-in state without a page refresh.
   */
  function login(token: string, userData: User) {
    saveToken(token);
    saveUser(userData);
    setUser(userData);
  }

  /**
   * Clears everything and redirects to the login page.
   */
  function logout() {
    clearToken();
    setUser(null);
    router.push("/login");
  }

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };
}
