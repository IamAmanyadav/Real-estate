"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await signIn.password({
        emailAddress: email,
        password: password,
      });

      if (result.status === "complete") {
        await signIn.finalize();

        router.push("/dashboard");
        return;
      }

      if (result.status === "needs_client_trust") {
        const emailFactor = result.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (!emailFactor) {
          setError(
            "No email verification method is available for this account."
          );
          return;
        }

        await result.mfa.sendEmailCode();

        setNeedsVerification(true);
        return;
      }

      setError(`Authentication requires: ${result.status}`);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.errors?.[0]?.message ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await signIn.mfa.verifyEmailCode({
        code,
      });

      if (result.status === "complete") {
        await result.finalize();

        router.push("/dashboard");
        return;
      }

      setError(`Verification requires: ${result.status}`);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.errors?.[0]?.message ||
          "Invalid verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setLoading(true);
      setError("");

      await signIn.mfa.sendEmailCode();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.errors?.[0]?.message ||
          "Unable to send another verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {!needsVerification ? (
          <>
            <h1 className="mb-2 text-3xl font-bold">
              Welcome Back
            </h1>

            <p className="mb-6 text-gray-500">
              Sign in to Luxe Real Estates
            </p>

            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

            </form>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-3xl font-bold">
              Verify Your Account
            </h1>

            <p className="mb-6 text-gray-500">
              We sent a verification code to your email because you're
              signing in from a new device.
            </p>

            <form onSubmit={handleVerification} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Verification Code
                </label>

                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  required
                  autoComplete="one-time-code"
                  className="w-full rounded-lg border px-4 py-3 text-center text-xl tracking-widest outline-none focus:ring-2"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

            </form>

            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="mt-4 w-full text-sm font-medium underline"
            >
              Resend verification code
            </button>

            <button
              type="button"
              onClick={() => {
                setNeedsVerification(false);
                setCode("");
                setError("");
                signIn.reset();
              }}
              className="mt-3 w-full text-sm text-gray-500"
            >
              Start over
            </button>
          </>
        )}

      </div>
    </div>
  );
}
