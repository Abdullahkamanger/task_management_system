'use client';

import { useState } from "react";
import { registerUser } from "@/lib/actions";
import { toast } from "sonner";
import Link from "next/link";

import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await registerUser(formData);
      
      if (res?.error) {
        toast.error(res.error);
        setLoading(false);
        return;
      }

      toast.success("Account created! Logging you in...");
      
      const email = formData.get("email");
      const password = formData.get("password");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Auto-login failed. Please log in manually.");
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1d1d1d] px-6">
      <div className="w-full max-w-md bg-[#101204] p-8 rounded-2xl border border-white/5 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm mb-8">Start organizing your tasks like a pro.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
            <input 
              name="name" 
              type="text" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Abdullah..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Join Workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
