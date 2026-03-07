import React from "react";
import Logo from "./Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  showLogo?: boolean;
}

export default function AuthLayout({
  children,
  title,
  showLogo = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-0 p-4 bg-background dark:bg-[#0a0a0a]">
      <div className="absolute inset-0 z-[-1] pointer-events-none bg-background dark:bg-[#0a0a0a] bg-gradient-to-br from-background to-secondary/20" />
      <div className="w-full max-w-md">
        <div className="min-h-[600px] bg-[#1a1a1a] rounded-2xl shadow-2xl relative flex flex-col">
          <div className="h-[140px] flex flex-col items-center justify-center pt-16">
            {showLogo ? (
              <Logo className="h-16 w-auto" containerClassName="mb-0" />
            ) : (
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-6 border border-border">
                <Logo className="h-12 w-auto" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-[#ff4d00] tracking-tight mt-2 mb-2">
              Paragonly
            </h1>
            <p className="text-gray-400 text-sm mt-2">{title}</p>
          </div>
          <div className="flex-grow flex flex-col justify-center px-8 pb-12">
            {children}
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center">
            {/* Navigation links will be injected here by child components */}
          </div>
        </div>
      </div>
    </div>
  );
}
