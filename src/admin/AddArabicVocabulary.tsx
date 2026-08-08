import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Wand2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { generateArabicVocabulary } from "@/services/arabicAiService";
import { useArabicVocabularyMutations } from "@/hooks/useArabicVocabularies";
import { SAUDI_CATEGORIES } from "@/data/saudiCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { speakText } from "@/services/ttsService";

export default function AddArabicVocabulary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { addVocabulary, updateVocabulary } = useArabicVocabularyMutations();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    arabic: "",
    transliteration: "",
    bangla: "",
    english: "",
    example: "",
    exampleBangla: "",
    category: "general",
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }

    if (id) {
      fetchArabicWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, id, navigate]);

  const fetchArabicWord = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const docRef = doc(db, "arabicVocabulary", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as typeof formData;
        setFormData({
          arabic: data.arabic || "",
          transliteration: data.transliteration || "",
          bangla: data.bangla || "",
          english: data.english || "",
          example: data.example || "",
          exampleBangla: data.exampleBangla || "",
          category: data.category || "general",
        });
      } else {
        toast.error("Arabic word not found");
        navigate("/arabic-vocabularies");
      }
    } catch (error) {
      console.error("Error fetching arabic word:", error);
      toast.error("Failed to load Arabic word");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    const seedWord = formData.arabic || formData.transliteration || formData.bangla;
    if (!seedWord.trim()) {
      toast.error("Please enter the Arabic word, transliteration, or Bangla meaning first");
      return;
    }

    try {
      setGenerating(true);
      const details = await generateArabicVocabulary(seedWord);
      setFormData((prev) => ({
        ...prev,
        ...details,
      }));
      toast.success("Arabic word details generated (AI)");
    } catch (error) {
      console.error("Error generating arabic word details:", error);
      toast.error("Failed to generate details. Check your OpenAI API key.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.arabic || !formData.transliteration || !formData.bangla) {
      toast.error("Please fill in Arabic word, transliteration, and Bangla meaning");
      return;
    }

    try {
      setLoading(true);
      const data = {
        arabic: formData.arabic,
        transliteration: formData.transliteration,
        bangla: formData.bangla,
        english: formData.english,
        example: formData.example,
        exampleBangla: formData.exampleBangla,
        category: formData.category,
        userId: user!.uid,
      };

      if (id) {
        await updateVocabulary.mutateAsync({ id, data });
        toast.success("Arabic word updated successfully");
      } else {
        const now = new Date().toISOString();
        await addVocabulary.mutateAsync({
          ...data,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Arabic word added successfully");
      }
      navigate("/arabic-vocabularies");
    } catch (error) {
      console.error("Error saving arabic word:", error);
      toast.error("Failed to save Arabic word");
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white px-4 pt-8 pb-12"
      >
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold mb-1">
            {id ? "Edit Arabic Word" : "Add Arabic Word"}
          </h1>
          <p className="text-white/80 text-sm">
            {id ? "Update existing Arabic word" : "Add a new Arabic (Saudi) word to the collection"}
          </p>
        </div>
      </motion.header>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="p-4 md:p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Arabic Word */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="arabic" className="text-base md:text-sm font-medium">
                    Arabic Word <span className="text-muted-foreground">(Saudi dialect)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                    onClick={() => speakText(formData.arabic)}
                    disabled={!formData.arabic}
                    title="Listen"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="arabic"
                  dir="rtl"
                  value={formData.arabic}
                  onChange={(e) => setFormData({ ...formData, arabic: e.target.value })}
                  placeholder="e.g. اليوم"
                  required
                  className="h-12 md:h-10 text-base md:text-sm"
                  style={{ direction: "rtl", textAlign: "right" }}
                />
              </div>

              {/* Transliteration */}
              <div className="space-y-2">
                <Label htmlFor="transliteration" className="text-base md:text-sm font-medium">
                  Transliteration (Bangla letters)
                </Label>
                <Input
                  id="transliteration"
                  value={formData.transliteration}
                  onChange={(e) => setFormData({ ...formData, transliteration: e.target.value })}
                  placeholder="e.g. আস-সালামু আলাইকুম"
                  required
                  className="h-12 md:h-10 text-base md:text-sm"
                />
              </div>

              {/* Bangla Meaning */}
              <div className="space-y-2">
                <Label htmlFor="bangla" className="text-base md:text-sm font-medium">
                  Bangla Meaning
                </Label>
                <Input
                  id="bangla"
                  value={formData.bangla}
                  onChange={(e) => setFormData({ ...formData, bangla: e.target.value })}
                  placeholder="e.g. আজ"
                  required
                  className="h-12 md:h-10 text-base md:text-sm"
                />
              </div>

              {/* English Meaning */}
              <div className="space-y-2">
                <Label htmlFor="english" className="text-base md:text-sm font-medium">
                  English Meaning <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="english"
                  value={formData.english}
                  onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                  placeholder="e.g. today"
                  className="h-12 md:h-10 text-base md:text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base md:text-sm font-medium">
                  Category <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className="h-12 md:h-10 text-base md:text-sm">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAUDI_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label} — {cat.transliteration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pick the group this word belongs to. It is used for filtering.
                </p>
              </div>

              {/* Example Sentence */}
              <div className="space-y-2">
                <Label htmlFor="example" className="text-base md:text-sm font-medium">
                  Example Sentence (Arabic)
                </Label>
                <Textarea
                  id="example"
                  dir="rtl"
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  placeholder="Write a short Arabic example sentence"
                  className="min-h-[80px] text-base md:text-sm"
                  style={{ direction: "rtl", textAlign: "right" }}
                />
              </div>

              {/* Example Bangla */}
              <div className="space-y-2">
                <Label htmlFor="exampleBangla" className="text-base md:text-sm font-medium">
                  Bangla Translation of Example
                </Label>
                <Textarea
                  id="exampleBangla"
                  value={formData.exampleBangla}
                  onChange={(e) => setFormData({ ...formData, exampleBangla: e.target.value })}
                  placeholder="Write the Bangla translation"
                  className="min-h-[80px] text-base md:text-sm"
                />
              </div>

              {/* AI Generate Button */}
              <div className="space-y-2 md:space-y-0 md:flex md:items-end md:gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={generating || (!formData.arabic && !formData.transliteration && !formData.bangla)}
                  className="w-full md:w-auto h-12 md:h-10 text-base md:text-sm"
                >
                  {generating ? (
                    <Loader2 className="h-5 w-5 md:h-4 md:w-4 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                  )}
                  AI Auto-fill Details
                </Button>
                <p className="text-xs text-muted-foreground mt-2 md:hidden">
                  AI will fill transliteration, translations, example, and category
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col md:flex-row justify-end gap-3 md:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/arabic-vocabularies")}
                  className="w-full md:w-auto h-12 md:h-10 text-base md:text-sm order-2 md:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto h-12 md:h-10 text-base md:text-sm order-1 md:order-2"
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-spin" />}
                  {id ? "Update Word" : "Add Word"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}