import LoginForm from "@/components/LoginForm";
import VisualSection from "@/components/VisualSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TrueVail | Secure Login",
    description: "Secure terminal access for TrueVail agents.",
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full bg-brand-dark overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full shrink-0 lg:w-1/2 z-10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <LoginForm />
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:block lg:w-1/2 relative z-0">
                <VisualSection />
            </div>
        </div>
    );
}
