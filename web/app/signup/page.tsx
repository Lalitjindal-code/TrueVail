import SignupForm from "@/components/auth/SignupForm";
import VisualSection from "@/components/landing/VisualSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Truvail | Create Account",
    description: "Join Truvail's network of secure agents.",
};

export default function SignupPage() {
    return (
        <div className="flex min-h-screen w-full bg-brand-dark overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full shrink-0 lg:w-1/2 z-10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <SignupForm />
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:block lg:w-1/2 relative z-0">
                <VisualSection />
            </div>
        </div>
    );
}
