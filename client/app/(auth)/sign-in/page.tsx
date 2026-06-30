"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const SignInContent = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!isPending && data?.session && data?.user) {
      router.push(redirect || "/account");
    }
  }, [isPending, data, redirect, router]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (data?.session && data?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return <LoginForm redirectTo={redirect} />;
};

const Page = () => {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen"><Spinner /></div>}>
      <SignInContent />
    </Suspense>
  );
};

export default Page;