import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, Globe, GraduationCap, Headphones, Heart,
  User, Languages, Printer, Sparkles, LayoutDashboard,
  Users, Plus, Upload, Shield, FolderPlus, ArrowUpRight, Grid3x3, Home
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

interface ControlItem {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  accent?: string;
}

interface ControlSection {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  headerClass: string;
  adminOnly?: boolean;
  items: ControlItem[];
}

const sections: ControlSection[] = [
  {
    id: "english",
    label: "English",
    subtitle: "Words, learning tools & resources",
    icon: BookOpen,
    headerClass: "from-blue-500 to-sky-600",
    items: [
      { title: "Vocabulary", description: "Browse all English words with Bangla meanings", path: "/vocabularies", icon: BookOpen, accent: "text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400" },
      { title: "Dictionary", description: "Search the online English dictionary", path: "/dictionary", icon: Globe, accent: "text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400" },
      { title: "Resources", description: "Grammar guides and visual learning content", path: "/resources", icon: GraduationCap, accent: "text-orange-600 bg-orange-100 dark:bg-orange-500/15 dark:text-orange-400" },
      { title: "IELTS Listening", description: "Practice listening exercises", path: "/ielts-listing", icon: Headphones, accent: "text-cyan-600 bg-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-400" },
      { title: "Print", description: "Print vocabulary lists for offline study", path: "/print-vocabularies", icon: Printer, accent: "text-slate-600 bg-slate-100 dark:bg-slate-500/15 dark:text-slate-400" },
      { title: "Favorites", description: "Words you've saved", path: "/favorites", icon: Heart, accent: "text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-400" },
      { title: "Create Vocabulary", description: "Add a new word (AI-assisted)", path: "/vocabularies/add", icon: Plus, adminOnly: true, accent: "text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400" },
      { title: "Bulk Upload", description: "Upload many words at once", path: "/vocabularies/bulk-add", icon: Upload, adminOnly: true, accent: "text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400" },
      { title: "AI Enhancement Studio", description: "Polish and enhance vocabulary entries", path: "/admin/ai-enhancement-studio", icon: Sparkles, adminOnly: true, accent: "text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-400" },
      { title: "Resources Manager", description: "Manage learning resources", path: "/admin/resources", icon: FolderPlus, adminOnly: true, accent: "text-orange-600 bg-orange-100 dark:bg-orange-500/15 dark:text-orange-400" },
      { title: "Duplicate Manager", description: "Find and merge duplicate entries", path: "/admin/duplicates", icon: Shield, adminOnly: true, accent: "text-red-600 bg-red-100 dark:bg-red-500/15 dark:text-red-400" },
      { title: "IELTS Listening Builder", description: "Create listening exercises", path: "/admin/ielts-listening-builder", icon: Headphones, adminOnly: true, accent: "text-cyan-600 bg-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-400" },
    ],
  },
  {
    id: "arabic",
    label: "Arabic (Saudi Dialect)",
    subtitle: "Learn Saudi Arabic the easy way",
    icon: Languages,
    headerClass: "from-emerald-500 to-teal-600",
    items: [
      { title: "Vocabulary", description: "Learn Saudi Arabic words with transliteration", path: "/arabic-vocabularies", icon: Languages, accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400" },
      { title: "Resources", description: "Practical guides & articles", path: "/arabic-resources", icon: GraduationCap, accent: "text-teal-600 bg-teal-100 dark:bg-teal-500/15 dark:text-teal-400" },
      { title: "Arabic Resources Admin", description: "Manage Arabic learning posts", path: "/admin/arabic-resources", icon: FolderPlus, adminOnly: true, accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400" },
      { title: "Add Arabic Word", description: "Add a new Arabic (Saudi) word", path: "/admin/arabic-vocabularies/add", icon: Plus, adminOnly: true, accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400" },
      { title: "Arabic Bulk Upload", description: "Upload many Arabic words at once", path: "/vocabularies/bulk-add?lang=arabic", icon: Upload, adminOnly: true, accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400" },
      { title: "Arabic AI Enhancement Studio", description: "Polish and enhance Arabic vocabulary entries", path: "/admin/arabic-ai-enhancement-studio", icon: Sparkles, adminOnly: true, accent: "text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-400" },
    ],
  },
  {
    id: "learning",
    label: "Learning",
    subtitle: "Practice smarter, every day",
    icon: Sparkles,
    headerClass: "from-fuchsia-500 to-purple-600",
    items: [
      { title: "Study", description: "Flashcards, quizzes and daily progress", path: "/study", icon: Sparkles, badge: "NEW", accent: "text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-500/15 dark:text-fuchsia-400" },
    ],
  },
  {
    id: "account",
    label: "Account",
    subtitle: "Manage your profile",
    icon: User,
    headerClass: "from-slate-500 to-slate-700",
    items: [
      { title: "Profile", description: "Manage your account and stats", path: "/profile", icon: User, accent: "text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-400" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    subtitle: "Tools to manage content & users",
    icon: LayoutDashboard,
    headerClass: "from-amber-500 to-orange-600",
    adminOnly: true,
    items: [
      { title: "Analytics", description: "View app analytics dashboard", path: "/admin/analytics", icon: LayoutDashboard, accent: "text-slate-600 bg-slate-100 dark:bg-slate-500/15 dark:text-slate-400" },
      { title: "Manage Users", description: "Approve and manage users", path: "/admin/users", icon: Users, accent: "text-slate-600 bg-slate-100 dark:bg-slate-500/15 dark:text-slate-400" },
    ],
  },
];

const openExternal = (path: string) => {
  window.open(path, "_blank", "noopener,noreferrer");
};

export default function ControlCenter() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Control Center | MyVocab Hub</title>
      </Helmet>

      <div className="bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-white px-4 pt-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-sm">
              <Grid3x3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Control Center</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-base font-medium">
            Everything in one place — organized by language. Each card opens in a new tab so you never lose your place.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 space-y-10">
        {visibleSections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.06, duration: 0.4 }}
          >
            <Card className="border-border/60 shadow-sm rounded-3xl overflow-hidden">
              <div className={`bg-gradient-to-r ${section.headerClass} px-5 py-4 flex items-center gap-3`}>
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold tracking-tight truncate">{section.label}</h2>
                    {section.adminOnly && (
                      <Badge className="bg-white/20 text-white border-white/30 text-[10px]">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/75 text-xs truncate">{section.subtitle}</p>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.items.filter((item) => !item.adminOnly || isAdmin).map((item, itemIndex) => (
                    <motion.button
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIndex * 0.08 + itemIndex * 0.04 }}
                      onClick={() => openExternal(item.path)}
                      className="text-left group w-full"
                    >
                      <Card className="p-4 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 rounded-2xl border-border/60 hover:border-primary/30 cursor-pointer bg-card">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${item.accent}`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              {item.adminOnly && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100 text-[9px] px-1.5">
                                  Admin
                                </Badge>
                              )}
                              {item.badge && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100 text-[9px] px-1.5">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </Card>
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        <div className="pt-2 pb-8 text-center">
          <button
            onClick={() => navigate("/home")}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}