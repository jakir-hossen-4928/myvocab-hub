import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useArabicVocabularies, useArabicVocabularyMutations } from "@/hooks/useArabicVocabularies";
import { ArabicVocabulary } from "@/types/arabicVocabulary";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Wand2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    Layers,
    Bot,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SAUDI_CATEGORIES } from "@/data/saudiCategories";
import { enhanceArabicVocabulary } from "@/services/enhanceArabicVocabularyService";

interface EnhancementResult {
    id: string;
    arabic: string;
    status: "pending" | "processing" | "success" | "error";
    error?: string;
    enhanced?: Partial<ArabicVocabulary>;
}

type FilterType = "all" | "missing-transliteration" | "missing-bangla" | "missing-english" | "missing-example" | "missing-exampleBangla" | "missing-category";

export default function ArabicAiEnhancementStudio() {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const { data: vocabularies = [], isLoading } = useArabicVocabularies();
    const { updateVocabulary } = useArabicVocabularyMutations();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [selectedVocabs, setSelectedVocabs] = useState<Set<string>>(new Set());
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(["all"]));
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<EnhancementResult[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewVocab, setPreviewVocab] = useState<ArabicVocabulary | null>(null);
    const [enhancedData, setEnhancedData] = useState<Partial<ArabicVocabulary> | null>(null);

    const hasMissingFields = useCallback((vocab: ArabicVocabulary) => {
        const missing = [];
        if (!vocab.transliteration || vocab.transliteration.trim() === "") missing.push("transliteration");
        if (!vocab.bangla || vocab.bangla.trim().length < 2) missing.push("bangla");
        if (!vocab.english || vocab.english.trim() === "") missing.push("english");
        if (!vocab.example || vocab.example.trim() === "") missing.push("example");
        if (!vocab.exampleBangla || vocab.exampleBangla.trim() === "") missing.push("exampleBangla");
        if (!vocab.category || vocab.category.trim() === "") missing.push("category");
        return missing.length > 0;
    }, []);

    if (!user || !isAdmin) {
        navigate("/");
        return null;
    }

    const filterVocabularies = () => {
        let filtered = vocabularies;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(v =>
                v.arabic.toLowerCase().includes(query) ||
                v.bangla.toLowerCase().includes(query) ||
                (v.transliteration || "").toLowerCase().includes(query)
            );
        }

        if (filterCategory !== "all") {
            filtered = filtered.filter(v => v.category === filterCategory);
        }

        if (filterType === "missing-transliteration") filtered = filtered.filter(v => !v.transliteration || v.transliteration.trim() === "");
        else if (filterType === "missing-bangla") filtered = filtered.filter(v => !v.bangla || v.bangla.trim().length < 2);
        else if (filterType === "missing-english") filtered = filtered.filter(v => !v.english || v.english.trim() === "");
        else if (filterType === "missing-example") filtered = filtered.filter(v => !v.example || v.example.trim() === "");
        else if (filterType === "missing-exampleBangla") filtered = filtered.filter(v => !v.exampleBangla || v.exampleBangla.trim() === "");
        else if (filterType === "missing-category") filtered = filtered.filter(v => !v.category || v.category.trim() === "");
        else if (filterType === "all") filtered = filtered.filter(v => hasMissingFields(v));

        return filtered;
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedVocabs);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedVocabs(newSelection);
    };

    const selectAll = () => {
        const filtered = filterVocabularies();
        setSelectedVocabs(new Set(filtered.map(v => v.id)));
    };

    const clearSelection = () => setSelectedVocabs(new Set());

    const handleEnhanceSelected = async () => {
        if (selectedVocabs.size === 0) {
            toast.error("Please select vocabularies to enhance");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setResults([]);

        const selected = vocabularies.filter(v => selectedVocabs.has(v.id));
        const newResults: EnhancementResult[] = selected.map(v => ({
            id: v.id,
            arabic: v.arabic,
            status: "pending",
        }));
        setResults(newResults);

        for (let i = 0; i < selected.length; i++) {
            const vocab = selected[i];
            setResults(prev => prev.map(r => r.id === vocab.id ? { ...r, status: "processing" } : r));

            try {
                const fieldsToEnhance = selectedFields.has("all") ? undefined : Array.from(selectedFields);
                const enhanced = await enhanceArabicVocabulary(vocab, undefined, fieldsToEnhance);
                await updateVocabulary.mutateAsync({ id: vocab.id, data: enhanced });
                setResults(prev => prev.map(r => r.id === vocab.id ? { ...r, status: "success", enhanced } : r));
            } catch (error) {
                console.error(`Error enhancing ${vocab.arabic}:`, error);
                setResults(prev => prev.map(r => r.id === vocab.id ? { ...r, status: "error", error: error instanceof Error ? error.message : "Unknown error" } : r));
            }
            setProgress(((i + 1) / selected.length) * 100);
        }

        setIsProcessing(false);
        toast.success(`Enhanced ${selected.length} Arabic vocabularies!`);
    };

    const handlePreviewEnhancement = async (vocab: ArabicVocabulary) => {
        setPreviewVocab(vocab);
        setEnhancedData(null);
        setShowPreview(true);

        try {
            const fieldsToEnhance = selectedFields.has("all") ? undefined : Array.from(selectedFields);
            const enhanced = await enhanceArabicVocabulary(vocab, undefined, fieldsToEnhance);
            setEnhancedData(enhanced);
        } catch (error) {
            console.error("Error generating preview:", error);
            toast.error("Failed to generate preview");
            setShowPreview(false);
        }
    };

    const handleApplyPreview = async () => {
        if (!previewVocab || !enhancedData) return;
        try {
            await updateVocabulary.mutateAsync({ id: previewVocab.id, data: enhancedData });
            toast.success("Arabic vocabulary enhanced successfully!");
            setShowPreview(false);
        } catch (error) {
            console.error("Error applying enhancement:", error);
            toast.error("Failed to apply enhancement");
        }
    };

    const filteredVocabs = filterVocabularies();

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-background/80"
            >
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Bot className="h-6 w-6 text-emerald-600" />
                            Arabic AI Enhancement Studio
                        </h1>
                        <p className="text-xs font-medium text-muted-foreground">Automated Arabic Vocabulary Enrichment</p>
                    </div>
                </div>
                {isProcessing && (
                    <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-full border">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium">Processing... {Math.round(progress)}%</span>
                    </div>
                )}
            </motion.header>

            <div className="max-w-[1600px] mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

                    {/* LEFT COLUMN: Controls & Config (4 cols) */}
                    <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                        {/* 1. Filters */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-secondary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-primary" />
                                    Filter Vocabularies
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Search Term</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search arabic, bangla or transliteration..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 bg-background/50 border-input/50 focus:bg-background transition-all"
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Category</Label>
                                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {SAUDI_CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Missing Field</Label>
                                        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Any Incomplete</SelectItem>
                                                <SelectItem value="missing-transliteration">Transliteration</SelectItem>
                                                <SelectItem value="missing-bangla">Bangla Meaning</SelectItem>
                                                <SelectItem value="missing-english">English Meaning</SelectItem>
                                                <SelectItem value="missing-example">Example</SelectItem>
                                                <SelectItem value="missing-exampleBangla">Example Bangla</SelectItem>
                                                <SelectItem value="missing-category">Category</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        {/* 2. Enhancement Config */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-primary/5 ring-1 ring-primary/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    Configure Enhancement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">Select fields to regenerate using the AI model.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedFields.has("all") ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}>
                                        <input type="checkbox" checked={selectedFields.has("all")} onChange={(e) => e.target.checked ? setSelectedFields(new Set(["all"])) : setSelectedFields(new Set())} className="hidden" />
                                        <span className="text-xs font-bold">● All Fields</span>
                                    </label>
                                    {[
                                        { id: "transliteration", label: "Transliteration" },
                                        { id: "bangla", label: "Bangla Meaning" },
                                        { id: "english", label: "English Meaning" },
                                        { id: "example", label: "Example" },
                                        { id: "exampleBangla", label: "Example Bangla" },
                                        { id: "category", label: "Category" },
                                    ].map(field => (
                                        <label key={field.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${selectedFields.has(field.id) ? "bg-primary/10 border-primary/50 text-foreground" : "hover:bg-accent"}`}>
                                            <input type="checkbox" checked={selectedFields.has(field.id)} onChange={(e) => {
                                                const newFields = new Set(selectedFields);
                                                newFields.delete("all");
                                                if (e.target.checked) newFields.add(field.id);
                                                else newFields.delete(field.id);
                                                setSelectedFields(newFields);
                                            }} className="hidden" />
                                            <span className="text-xs font-medium">{field.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <Button
                                    onClick={handleEnhanceSelected}
                                    disabled={selectedVocabs.size === 0 || isProcessing}
                                    className="w-full font-bold shadow-md shadow-primary/20"
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Enhance {selectedVocabs.size > 0 ? `${selectedVocabs.size} Selected` : "Selected"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Process Monitor */}
                        <AnimatePresence>
                            {results.length > 0 && <Card className="border-0 shadow-inner bg-muted/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">Live Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 text-xs">
                                        {results.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded bg-background border">
                                                <span dir="rtl">{r.arabic}</span>
                                                {r.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                                {r.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                                {r.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: List (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col h-full bg-card/50 rounded-xl border overflow-hidden shadow-sm">
                        <div className="p-4 border-b flex items-center justify-between bg-card">
                            <div>
                                <h2 className="font-bold text-lg">Arabic Vocabulary List</h2>
                                <p className="text-xs text-muted-foreground">Showing {filteredVocabs.length} items requiring attention</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">Select All</Button>
                                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs">Clear</Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {filteredVocabs.map((vocab) => {
                                const missingCount = [
                                    !vocab.transliteration || vocab.transliteration.trim() === "",
                                    !vocab.bangla || vocab.bangla.trim().length < 2,
                                    !vocab.english || vocab.english.trim() === "",
                                    !vocab.example || vocab.example.trim() === "",
                                    !vocab.exampleBangla || vocab.exampleBangla.trim() === "",
                                    !vocab.category || vocab.category.trim() === ""
                                ].filter(Boolean).length;

                                return (
                                    <div key={vocab.id} className={`group relative p-4 rounded-xl border transition-all ${selectedVocabs.has(vocab.id) ? "bg-primary/5 border-primary/30" : "hover:border-primary/30 hover:shadow-md bg-card"}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVocabs.has(vocab.id)}
                                                    onChange={() => toggleSelection(vocab.id)}
                                                    className="w-5 h-5 rounded border-primary/50 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold" dir="rtl">{vocab.arabic}</h3>
                                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">{SAUDI_CATEGORIES.find(c => c.id === vocab.category)?.label || vocab.category}</Badge>
                                                    {missingCount > 0 && <Badge variant="destructive" className="text-[10px] h-5 rounded-full px-2">{missingCount} Issues</Badge>}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    {vocab.transliteration && <span className="font-mono text-emerald-600 mr-2">{vocab.transliteration}</span>}
                                                    {vocab.bangla}
                                                </p>
                                                {vocab.english && <p className="text-xs text-muted-foreground mb-3">{vocab.english}</p>}

                                                <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {(!vocab.transliteration || vocab.transliteration.trim() === "") && <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600 border-red-100">Transliteration</Badge>}
                                                    {(!vocab.bangla || vocab.bangla.trim().length < 2) && <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-600 border-orange-100">Bangla</Badge>}
                                                    {(!vocab.english || vocab.english.trim() === "") && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-600 border-purple-100">English</Badge>}
                                                    {(!vocab.example || vocab.example.trim() === "") && <Badge variant="secondary" className="text-[10px] bg-yellow-50 text-yellow-600 border-yellow-100">Example</Badge>}
                                                    {(!vocab.exampleBangla || vocab.exampleBangla.trim() === "") && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">Example Bangla</Badge>}
                                                    {(!vocab.category || vocab.category.trim() === "") && <Badge variant="secondary" className="text-[10px] bg-pink-50 text-pink-600 border-pink-100">Category</Badge>}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePreviewEnhancement(vocab)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredVocabs.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mb-3 text-green-500/50" />
                                    <p className="font-medium">All valid! No missing fields found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-card to-secondary/10">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Bot className="h-5 w-5 text-primary" />
                            Arabic AI Enhancement Preview
                        </DialogTitle>
                        <DialogDescription>
                            Review generated content for <span className="font-bold text-foreground" dir="rtl">{previewVocab?.arabic}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 bg-muted/5 space-y-4">
                        {!enhancedData ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground animate-pulse">Consulting AI Model...</p>
                            </div>
                        ) : Object.keys(enhancedData).length === 0 ? (
                            <div className="text-center py-20">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-lg font-bold">Perfect!</p>
                                <p className="text-muted-foreground">No missing fields detected for this item.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(enhancedData).map(([key, value]) => (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card rounded-xl border shadow-sm overflow-hidden"
                                    >
                                        <div className="bg-muted/30 px-4 py-2 border-b flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider font-bold">New Content</Badge>
                                            <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">{key}</span>
                                        </div>
                                        <div className="p-0">
                                            <textarea
                                                value={JSON.stringify(value, null, 2)}
                                                onChange={(e) => {
                                                    try {
                                                        const parsed = JSON.parse(e.target.value);
                                                        setEnhancedData(prev => prev ? { ...prev, [key]: parsed } : { [key]: parsed });
                                                    } catch { }
                                                }}
                                                className="w-full h-full min-h-[120px] p-4 bg-transparent font-mono text-sm resize-y focus:outline-none focus:bg-primary/5 transition-colors"
                                                spellCheck={false}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t bg-card">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
                        <Button
                            onClick={handleApplyPreview}
                            disabled={!enhancedData || Object.keys(enhancedData).length === 0 || updateVocabulary.isPending}
                            className="bg-green-600 hover:bg-green-700 font-bold shadow-lg shadow-green-600/20"
                        >
                            {updateVocabulary.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}