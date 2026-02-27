import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl my-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4">
            <img src="/logo-1.svg" alt="Paragonly" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-[#ff4d00] tracking-tight">
            Paragonly
          </h1>
          <p className="text-gray-400 text-sm mt-2">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
