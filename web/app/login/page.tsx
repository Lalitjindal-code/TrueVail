import LoginForm from "@/components/auth/LoginForm";
import VisualSection from "@/components/landing/VisualSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Truvail | Secure Login",
    description: "Secure terminal access for Truvail agents.",
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full bg-brand-dark overflow-hidden min-w-[1280px]">
            {/* Left Side - Form */}
            <div className="w-1/2 z-10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <LoginForm />
            </div>

            {/* Right Side - Visual */}
            <div className="block w-1/2 relative z-0">
                <VisualSection />
            </div>
        </div>
    );
}
