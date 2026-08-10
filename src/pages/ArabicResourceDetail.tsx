import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GrammarImage } from "@/types/grammar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Share2, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import parse from "html-react-parser";
import { LexkitViewer } from "@/components/LexkitViewer";
import { useArabicResourcesSimple, useArabicResourceMutations } from "@/hooks/useArabicResources";
import { dexieService } from "@/lib/dexieDb";
import { shareText } from "@/services/nativeShareService";
import { getShareUrl } from "@/utils/siteUrl";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipe } from "@/hooks/useSwipe";
import { Helmet } from "react-helmet-async";
import { CachedImage } from "@/components/CachedImage";
import { useAuth } from "@/contexts/AuthContext";
import { confirmAction } from "@/utils/sweetAlert";

const SwipeHint = ({ onDismiss }: { onDismiss: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onAnimationComplete={() => setTimeout(onDismiss, 2500)}
        className="fixed bottom-8 left-0 right-0 pointer-events-none z-50 flex justify-center pb-4"
    >
        <div className="bg-black/60 text-white px-6 py-2 rounded-full flex items-center gap-3 backdrop-blur-md shadow-lg">
            <ArrowLeft className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-medium">Swipe to navigate</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>
    </motion.div>
);

export default function ArabicResourceDetail() {
    const { slug } = useParams();
    const id = slug ? decodeURIComponent(slug) : undefined;
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [resource, setResource] = useState<GrammarImage | null>(null);
    const [loading, setLoading] = useState(true);

    const { data: resources = [] } = useArabicResourcesSimple();
    const { deleteResource } = useArabicResourceMutations();
    const isMobile = useIsMobile();
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const [showSwipeHint, setShowSwipeHint] = useState(true);

    useEffect(() => {
        if (isMobile) {
            const timer = setTimeout(() => setShowSwipeHint(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    const handleSwipeLeft = () => {
        const currentIndex = resources.findIndex(r => r.id === id || r.slug === id);
        if (currentIndex !== -1 && currentIndex < resources.length - 1) {
            setSlideDirection('right');
            const nextResource = resources[currentIndex + 1];
            navigate(`/arabic-resources/${nextResource.slug || nextResource.id}`);
        }
    };

    const handleSwipeRight = () => {
        const currentIndex = resources.findIndex(r => r.id === id || r.slug === id);
        if (currentIndex > 0) {
            setSlideDirection('left');
            const prevResource = resources[currentIndex - 1];
            navigate(`/arabic-resources/${prevResource.slug || prevResource.id}`);
        }
    };

    const swipeHandlers = useSwipe({
        onSwipeLeft: handleSwipeLeft,
        onSwipeRight: handleSwipeRight,
    });

    const containerProps = isMobile ? swipeHandlers : {};

    useEffect(() => {
        const loadResource = async () => {
            if (!id) return;
            setLoading(true);

            // Try to find in cache first (by ID or Slug)
            const cachedResource = resources.find(r => r.id === id || r.slug === id);
            if (cachedResource) {
                setResource(cachedResource);
                setLoading(false);
                return;
            }

            try {
                // Fallback: try the Dexie cache directly (works offline)
                const cachedResource = await dexieService.getArabicResource(id);
                if (cachedResource) {
                    setResource(cachedResource);
                    setLoading(false);
                    return;
                }

                // First try to fetch as ID
                const docRef = doc(db, "arabicResources", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const resourceData = { id: docSnap.id, ...docSnap.data() } as GrammarImage;
                    setResource(resourceData);
                } else {
                    // Try to fetch by slug if ID lookup fails
                    const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
                    const q = query(
                        collection(db, "arabicResources"),
                        where("slug", "==", id),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const resDoc = querySnapshot.docs[0];
                        const resourceData = { id: resDoc.id, ...resDoc.data() } as GrammarImage;
                        setResource(resourceData);
                    } else {
                        toast.error("Resource not found");
                        navigate("/arabic-resources");
                    }
                }
            } catch (error) {
                console.error("Error loading resource:", error);
                toast.error("Failed to load resource details");
            } finally {
                setLoading(false);
            }
        };

        loadResource();
    }, [id, navigate, resources]);

    const handleShare = async () => {
        const result = await shareText(
            resource?.title || 'MyVocab Hub',
            `Check out this Arabic resource: ${resource?.title}`,
            getShareUrl(window.location.pathname)
        );
        if (result.copied) {
            toast.success("Link copied to clipboard");
        }
    };

    const handleDelete = async () => {
        if (!resource) return;
        const isConfirmed = await confirmAction(
            'Are you sure?',
            "Are you sure you want to delete this Arabic resource?",
            'Yes, delete it!'
        );
        if (isConfirmed) {
            try {
                await deleteResource.mutateAsync(resource.id);
                navigate("/arabic-resources");
            } catch (error) {
                console.error("Failed to delete:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background px-4 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-10 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="aspect-video w-full rounded-2xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!resource) return null;

    // Check if content looks like HTML (basic heuristic)
    const description = resource.description || "";
    const isHtml = description.trim().startsWith("<") && (description.includes("</") || description.includes("/>"));

    return (
        <div className="min-h-screen bg-background pb-20 overflow-x-hidden" {...containerProps}>
            {resource && (
                <Helmet>
                    <title>{resource.title} | MyVocab Hub Arabic Resources</title>
                    <meta name="description" content={resource.description?.substring(0, 160).replace(/[#*`]/g, '') || 'Arabic learning resource'} />
                    <meta property="og:title" content={resource.title} />
                    <meta property="og:description" content={resource.description?.substring(0, 160).replace(/[#*`]/g, '') || 'Arabic learning resource'} />
                    <meta property="og:image" content={resource.imageUrl || '/og_image.png'} />
                    <meta property="og:type" content="article" />
                    <meta name="twitter:card" content="summary_large_image" />
                </Helmet>
            )}
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/arabic-resources")} className="gap-2 font-medium">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Gallery
                    </Button>
                    <div className="flex gap-2 items-center">
                        {isAdmin && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/arabic-resources/edit/${resource.id}`)} className="rounded-full">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleDelete} className="rounded-full">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
)}
                        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
                <motion.div
                    key={id}
                    custom={slideDirection}
                    initial={{ x: slideDirection === 'right' ? 300 : -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: slideDirection === 'right' ? -300 : 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full"
                >
                    <article className="max-w-3xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
                        {/* Article Header */}
                        <motion.header
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 md:mb-12 text-center space-y-6 w-full"
                        >
                            <div className="space-y-4">
                                <span className="inline-block text-xs font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1 rounded-full">
                                    🇸🇦 Arabic Learning Guide
                                </span>
                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground balance-text">
                                    {resource.title}
                                </h1>

                                {resource.createdAt && (
                                    <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm font-medium">
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <time dateTime={String(resource.createdAt)}>
                                                {format(new Date(resource.createdAt), "MMMM d, yyyy")}
                                            </time>
                                        </div>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1 rounded-full hidden sm:inline">Arabic Guide</span>
                                    </div>
                                )}
                            </div>
                        </motion.header>

                        {/* Article Cover Image */}
                        {resource.imageUrl && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-10 md:mb-16 -mx-4 md:mx-0 w-full"
                            >
                                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border bg-muted flex items-center justify-center">
                                    <CachedImage
                                        src={resource.thumbnailUrl || resource.imageUrl}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
                                        loading="lazy"
                                    />
                                    <CachedImage
                                        src={resource.imageUrl}
                                        alt={resource.title}
                                        className="relative z-10 w-full h-full object-cover"
                                        width={1920}
                                        height={1080}
                                    />
                                </div>
                            </motion.div>
                        )}


                        {/* Article Content */}
                        {resource.description && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="resource-content-container w-full"
                            >
                                {isHtml ? (
                                    <div className="prose prose-blue dark:prose-invert max-w-none">
                                        {parse(resource.description)}
                                    </div>
                                ) : (
                                    <LexkitViewer markdown={resource.description} className="min-h-[200px]" />
                                )}
                            </motion.div>
                        )}

                        {/* Footer / Divider */}
                        <div className="mt-16 pt-8 border-t text-center text-muted-foreground w-full">
                            <p className="text-sm">Thanks for reading! Keep practicing to master Saudi Arabic.</p>
                        </div>
                    </article>
                </motion.div>
            </AnimatePresence>

            {isMobile && showSwipeHint && (
                <AnimatePresence>
                    <SwipeHint onDismiss={() => setShowSwipeHint(false)} />
                </AnimatePresence>
            )}
        </div>
    );
}