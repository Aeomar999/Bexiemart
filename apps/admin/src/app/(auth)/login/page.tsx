"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../../../lib/hooks/use-auth";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Successfully logged in");
          router.push("/");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to login");
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-[var(--color-card)] p-8 shadow-md border border-[var(--color-border)]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[var(--color-text)]">
            BexieMart Admin
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
            Sign in to access your dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isPending}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
