"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Loader2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [emailPending, startEmailTransition] = useTransition();

  const [email, setEmail] = useState("");

  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification email sent!");
            router.push(`/verify-request?email=${email}`);
          },
          onError: () => {
            toast.error("Error sending verification email");
          },
        },
      });
    });
  }

  return (
    <Card className="max-w-xl w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-lg sm:text-xl font-semibold mb-2">
          Welcome to CUMS GCEK Bhawanipatna
        </CardTitle>
        <CardDescription className="text-sm">
          Login to your account to complete the full registration.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm"> Email address</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
              className="text-sm"
            />
          </div>

          <Button
            onClick={signInWithEmail}
            disabled={emailPending}
            className="cursor-pointer w-full"
          >
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Sending...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span className="text-sm sm:text-base">Continue With Email</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}