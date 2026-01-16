import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return redirect("/login");
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Check if user exists in database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            admin: true,
            teacher: true,
            student: true,
        },
    });

    if (!user) {
        return redirect("/not-user");
    }

    // Check if this email exists in any role table
    const [adminByEmail, teacherByEmail, studentByEmail] = await Promise.all([
        prisma.admin.findFirst({
            where: {
                user: { email: userEmail }
            }
        }),
        prisma.teacher.findFirst({
            where: {
                user: { email: userEmail }
            }
        }),
        prisma.student.findFirst({
            where: {
                user: { email: userEmail }
            }
        })
    ]);

    // Determine if user has valid role entry
    let hasValidRole = false;
    let redirectPath = "/not-user";

    if (user.admin || adminByEmail) {
        hasValidRole = true;
        redirectPath = "/admin";
    } else if (user.teacher || teacherByEmail) {
        hasValidRole = true;
        redirectPath = "/teacher";
    } else if (user.student || studentByEmail) {
        hasValidRole = true;
        redirectPath = "/students";
    }

    // If user doesn't have proper role entry, delete session and user data
    if (!hasValidRole) {
        // Delete all sessions for this user
        await prisma.session.deleteMany({
            where: { userId: userId },
        });

        // Delete all accounts for this user
        await prisma.account.deleteMany({
            where: { userId: userId },
        });

        // Delete the user account
        await prisma.user.delete({
            where: { id: userId },
        });

        return redirect("/not-user");
    }

    return redirect(redirectPath);
}