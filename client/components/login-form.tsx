"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { authClient } from "@/lib/auth-client";

interface LoginFormProps {
  redirectTo?: string | null;
}

export const LoginForm = ({ redirectTo }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackURL = redirectTo ? `${appUrl}${redirectTo}` : `${appUrl}/account`;

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image src={"/login.png"} alt="Login" height={150} width={150} />
        <h1 className="text-6xl font-extrabold text-indigo-400">
          Welcome Back! to Orbis CLI
        </h1>
        <p className="text-base font-medium text-zinc-400">
          Login to your account for allowing device flow
        </p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant={"outline"}
                className="w-full h-full"
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true);
                  authClient.signIn.social({
                    provider: "github",
                    callbackURL,
                    errorCallbackURL: "/sign-in",
                  });
                }}
              >
                <Image src={"/github.svg"} alt="Github" height={16} width={16} className="size-4 dark:invert" />
                Continue With GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};