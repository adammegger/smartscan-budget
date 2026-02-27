import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-[400px] h-[580px] bg-[#1a1a1a] rounded-2xl shadow-2xl relative flex flex-col">
        <div className="h-[140px] flex flex-col items-center justify-center pt-8">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4">
            <img src="/logo-1.svg" alt="Paragonly" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-[#ff4d00] tracking-tight">
            Paragonly
          </h1>
          <p className="text-gray-400 text-sm mt-2">{title}</p>
        </div>
        <div className="flex-grow flex flex-col justify-center px-8">
          {children}
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center">
          {/* Navigation links will be injected here by child components */}
        </div>
      </div>
    </div>
  );
}
