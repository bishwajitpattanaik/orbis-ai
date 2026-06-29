"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const Page = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!isPending && data?.session && data?.user) {
      router.push(redirect || "/");
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

export default Page;