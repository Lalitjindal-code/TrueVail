"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    getAdditionalUserInfo,
    User
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: (preventCreate?: boolean) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                // Optional: refresh token or store it if needed, 
                // but usually we just call getToken() when making requests.
                // const token = await currentUser.getIdToken();
                // console.log("User Token:", token); 
            }
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async (preventCreate = false) => {
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Check if user is new but tried to login instead of signup
            if (preventCreate) {
                const details = getAdditionalUserInfo(result);
                if (details?.isNewUser) {
                    await result.user.delete();
                    await signOut(auth);
                    throw new Error("Account does not exist. Please sign up first.");
                }
            }

            // Verify token immediately to ensure connection is valid
            const token = await result.user.getIdToken();
            console.log("Google Login Success. Token retrieved.");
        } catch (error: any) {
            console.error("Google Login Error:", error.message);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signupWithEmail = async (email: string, pass: string, name: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // Generate random avatar based on name using DiceBear
        const photoURL = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: photoURL
        });
        // Force refresh user to get updated profile
        setUser({ ...userCredential.user, displayName: name, photoURL: photoURL });
    };

    const logout = async () => {
        await signOut(auth);
    };

    const getToken = async () => {
        if (!user) return null;
        return await user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
