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

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: (data: any) => {
          if (data?.requiresTwoFactor) {
            setRequiresTwoFactor(true);
            toast.info("Two-factor verification required");
          } else {
            toast.success("Successfully logged in");
            router.push("/");
          }
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "Failed to login");
        },
      }
    );
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/session/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid verification code");
      }
      toast.success("Successfully logged in");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify 2FA code");
    } finally {
      setIsVerifying(false);
    }
  };

  if (requiresTwoFactor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-[var(--color-card)] p-8 shadow-md border border-[var(--color-border)]">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[var(--color-text)]">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
              Enter the 6-digit verification code from your authenticator app.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleVerifyTotp}>
            <div>
              <label htmlFor="totp-code" className="sr-only">
                6-Digit Code
              </label>
              <Input
                id="totp-code"
                name="totpCode"
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="text-center tracking-widest text-lg font-mono"
              />
            </div>
            <div className="space-y-3">
              <Button type="submit" className="w-full" isLoading={isVerifying}>
                Verify Code
              </Button>
              <button
                type="button"
                onClick={() => setRequiresTwoFactor(false)}
                className="w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
