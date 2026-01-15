"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {  Suspense, useState, useTransition } from "react";
import { toast } from "sonner";

export default function VerifyRequestRoute(){
    return (
        <Suspense>
            <VerifyRequest />
        </Suspense>
    )
}

function VerifyRequest() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [emailPending, startTransition] = useTransition();
    const params = useSearchParams();
    const email = params.get('email') || '';
    const isOtpCompleted = otp.length === 6;

    function verifyOtp() {
        startTransition(async () => {
            await authClient.signIn.emailOtp({
                email: email,
                otp: otp,
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Email verified successfully!");
                        router.push("/auth/callback");
                    },
                    onError: () => {
                        toast.error("Invalid OTP. Please try again.");
                    }
                }
            })
        });
    }

    return (
        <Card className="max-w-2xl w-full mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">
                    Please check your email to verify your account.
                </CardTitle>
                <CardDescription>
                    We have sent a verification code to your email address. Please check your inbox and enter the code below input box to verify your account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className=" flex flex-col items-center space-y-2">
                    <InputOTP maxLength={6} className="gap-2" value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        -
                        <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to your email</p>
                </div>
                <Button onClick={verifyOtp} disabled={emailPending || !isOtpCompleted} className="w-full cursor-pointer">
                    {emailPending ? (
                        <>
                            <Loader2 className="size-4 animate-spin"/>
                            <span>Verifying...</span>
                        </>
                        ) : (
                            <span>Verify Email</span>
                        )}
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full text-center text-sm cursor-pointer" 
                    disabled={emailPending} 
                    onClick={() => {
                        startTransition(async () => {
                            await authClient.emailOtp.sendVerificationOtp({
                                email: email,
                                type: "sign-in",
                                fetchOptions: {
                                    onSuccess: () => {
                                        toast.success("Verification code has been resent to your email.");
                                    },
                                    onError: (ctx) => {
                                        toast.error(ctx.error.message || "Failed to resend code. Please try again.");
                                    }
                                }
                            });
                        });
                    }}
                >
                    {emailPending ? (
                        <>
                            <Loader2 className="size-4 animate-spin"/>
                            <span>Resending...</span>
                        </>
                    ) : (
                        <span>Resend Code</span>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
} 