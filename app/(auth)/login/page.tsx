import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to CUMS portal - Government College of Engineering Kalahandi",
};

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if(session) {
        // If user is admin, redirect to admin dashboard
        if (session.user.role === "ADMIN") {
            return redirect("/admin");
        } else if (session.user.role === "TEACHER") {
            return redirect("/teacher");
        } else if (session.user.role === "STUDENT") {
            return redirect("/student");
        }


        // Otherwise, redirect to user dashboard
        return redirect("/dashboard");
    }
    return (
        <LoginForm />
    )
}