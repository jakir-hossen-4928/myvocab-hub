import { useNavigate, useLocation } from "react-router-dom";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

type LanguageKey = "english" | "arabic";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
  active?: LanguageKey;
}

const isOnArabicPage = (pathname: string) =>
  pathname.startsWith("/arabic-vocabularies") ||
  pathname.startsWith("/arabic-resources");

export const LanguageSwitcher = ({ className, compact = false, active }: LanguageSwitcherProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedActive: LanguageKey = active || (isOnArabicPage(location.pathname) ? "arabic" : "english");

  const handleSelect = (key: LanguageKey) => {
    if (key === "english") {
      navigate(location.pathname.startsWith("/vocabularies") ? location.pathname : "/vocabularies");
    } else {
      navigate("/arabic-vocabularies");
    }
  };

  const itemLabel = (key: LanguageKey) => (compact && key === "arabic" ? "ع" : key === "english" ? "English" : "العربية");

  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted/70 p-1 rounded-full border border-border/60", className)}>
      <span className="text-muted-foreground/60 flex items-center pl-1.5 pr-1">
        <Languages className="h-3.5 w-3.5" />
      </span>
      {(["english", "arabic"] as LanguageKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSelect(key)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all",
            resolvedActive === key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {itemLabel(key)}
        </button>
      ))}
    </div>
  );
};