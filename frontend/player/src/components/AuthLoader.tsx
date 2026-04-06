"use client";

import { useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function AuthLoader({ children }: { children: ReactNode }) {
  const loadUser = useAuth((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}
