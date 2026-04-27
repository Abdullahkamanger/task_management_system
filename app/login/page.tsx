'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid credentials");
      setLoading(false);
    } else {
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1d1d1d] px-6">
      <div className="w-full max-w-md bg-[#101204] p-8 rounded-2xl border border-white/5 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
        <p className="text-gray-400 text-sm mb-8">Access your workspace and tasks.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
            <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
            <input name="password" type="password" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-1 text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-4 disabled:opacity-50">
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
