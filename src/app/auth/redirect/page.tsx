import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AuthRedirectPage() {
    const session = await auth()
    const role = session?.user?.role

    if (!session?.user) {
        redirect("/login")
    }

    switch (role) {
        case "SUPER_ADMIN":
            redirect("/super-admin")
        case "MIDDLE_ADMIN":
            redirect("/middle-admin")
        case "LOW_ADMIN":
            redirect("/low-admin")
        case "COURIER":
            redirect("/courier")
        default:
            redirect("/middle-admin")
    }
}

