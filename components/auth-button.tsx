"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"

export function AuthButton() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <Button variant="ghost" size="sm" disabled>
                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
            </Button>
        )
    }

    if (session?.user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="h-7 w-7 rounded-full ring-2 ring-blue-500/30"
                        />
                    )}
                    <span className="text-sm text-muted-foreground hidden md:inline">
                        {session.user.name}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Button
            onClick={() => signIn("google")}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
        >
            <LogIn className="h-4 w-4 mr-2" />
            Sign in with Google
        </Button>
    )
}
