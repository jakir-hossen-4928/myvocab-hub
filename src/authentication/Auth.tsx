import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, GraduationCap, Lock } from "lucide-react";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { usePlatform } from "@/hooks/usePlatform";

export default function Auth() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { isNative } = usePlatform();

    useEffect(() => {
        if (user) {
            navigate("/home");
        }
    }, [user, navigate]);

    // Sign-in in native WebViews uses the native Google sign-in plugin
    // because popup and redirect auth are not supported inside the
    // Capacitor WebView origin (https://localhost).
    useEffect(() => {
        if (!isNative) return;

        // Restore a native sign-in session ONLY if its ID token can be
        // exchanged for a valid Firebase JS SDK credential. This guarantees
        // the session is genuinely valid before any navigation happens.
        // Navigation to /home is driven by the `user` effect above, which
        // runs only after onAuthStateChanged reports a real user.
        let cancelled = false;
        FirebaseAuthentication.getCurrentUser()
            .then((user) => {
                if (!user) return null;
                return FirebaseAuthentication.getIdToken();
            })
            .then(({ token }) => {
                if (!cancelled && token) {
                    return signInWithCredential(auth, GoogleAuthProvider.credential(token));
                }
            })
            .catch((err) => {
                console.warn("[Auth] Native session restore failed (expired or invalid):", err);
            });
        return () => { cancelled = true; };
    }, [isNative]);

    const handleGoogleSignIn = async () => {
        try {
            if (isNative) {
                if (!Capacitor.isPluginAvailable("FirebaseAuthentication")) {
                    throw new Error("Google sign-in is not available on this platform.");
                }
                const result = await FirebaseAuthentication.signInWithGoogle();
                const idToken = result.credential?.idToken;
                if (!idToken) {
                    throw new Error("Google sign-in did not return an ID token.");
                }
                await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
                toast.success("Welcome back!");
                navigate("/home");
                return;
            }

            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success("Welcome back!");
            navigate("/home");
        } catch (error: { message?: string }) {
            console.error("Sign in error:", error.message || error);
            toast.error(error.message || "Failed to sign in.");
        }
    };

    const features = [
        {
            icon: GraduationCap,
            title: "Smart Vocabulary",
            description: "Learn words with AI-powered tools",
        },
        {
            icon: Sparkles,
            title: "Personalized Study",
            description: "Flashcards, quizzes and more",
        },
        {
            icon: BookOpen,
            title: "Any Language",
            description: "English, Arabic and beyond",
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-background">
            {loading && (
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground font-medium animate-pulse">Loading... Please wait a moment.</p>
                </div>
            )}

            {!loading && (
                <div className="relative z-10 w-full max-w-md">
                {/* Logo & Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white border border-border shadow-xl shadow-primary/10 mb-6 overflow-hidden p-0.5">
                        <img className="w-full h-full object-contain rounded-[1.35rem]" src="/play_store_512.png" alt="MyVocab Hub" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
                        MyVocab Hub
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Master any language with smart tools.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-8 pb-0">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold mb-1 text-slate-900">Welcome back</h2>
                                <p className="text-sm text-muted-foreground">Sign in to continue your journey</p>
                            </div>

                            <Button
                                onClick={handleGoogleSignIn}
                                size="lg"
                                className="w-full h-14 text-base font-semibold rounded-2xl bg-slate-900 text-white hover:bg-slate-800 border border-slate-200 shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-widest text-slate-400">
                                <Lock className="h-3 w-3" />
                                Secure and private by design
                            </div>
                        </div>

                        {/* Feature highlights */}
                        <div className="mt-8 px-8 pt-6 pb-8 bg-gradient-to-b from-primary/5 to-transparent border-t">
                            <div className="grid grid-cols-1 gap-4">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 + index * 0.12 }}
                                        className="flex items-start gap-3.5"
                                    >
                                        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
                                            <feature.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{feature.title}</h4>
                                            <p className="text-xs text-muted-foreground font-medium">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-10 text-center text-xs text-muted-foreground uppercase tracking-widest font-medium"
                >
                    &copy; {new Date().getFullYear()} MyVocab Hub
                </motion.p>
                </div>
            )}
        </div>
    );
}