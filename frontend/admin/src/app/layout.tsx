"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BrandSelector from "@/components/BrandSelector";
import { useAuthStore } from "@/lib/auth";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const loadUser = useAuthStore((s) => s.loadUser);
  const user = useAuthStore((s) => s.user);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoginPage) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
              <div>
                <h1 className="text-lg font-semibold text-slate-800 capitalize">
                  {pathname === "/" ? "Dashboard" : pathname.split("/").filter(Boolean)[0]}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <BrandSelector />
                {user && (
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-700">{user.name}</p>
                      <p className="text-slate-400 text-xs">{user.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
