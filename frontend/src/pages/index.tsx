import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until we know the real auth state

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Brief loading state while the redirect decision is being made
  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <p className="text-text-faint">Loading...</p>
    </div>
  );
}
