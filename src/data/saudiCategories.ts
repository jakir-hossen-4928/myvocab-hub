import { ArabicCategory } from '@/types/arabicVocabulary';

export const SAUDI_CATEGORIES: ArabicCategory[] = [
  { id: "greetings", label: "সালাম ও সম্ভাষণ", transliteration: "তাহিয়া", arabic: "التحيات" },
  { id: "phrases", label: "সাধারণ বাক্য", transliteration: "جمل", arabic: "جمل وعبارات" },
  { id: "time", label: "সময়", transliteration: "الوقت", arabic: "الوقت" },
  { id: "places", label: "জায়গা", transliteration: "الأماكن", arabic: "الأماكن" },
  { id: "family", label: "পরিবার", transliteration: "العائلة", arabic: "العائلة" },
  { id: "food", label: "খাবার ও পানীয়", transliteration: "الطعام", arabic: "الطعام والشراب" },
  { id: "numbers", label: "সংখ্যা", transliteration: "الأرقام", arabic: "الأرقام" },
  { id: "colors", label: "রং", transliteration: "الألوان", arabic: "الألوان" },
  { id: "questions", label: "প্রশ্ন", transliteration: "الأسئلة", arabic: "الأسئلة" },
  { id: "work", label: "কাজ ও জীবিকা", transliteration: "العمل", arabic: "العمل" },
  { id: "daily", label: "দৈনন্দিন জীবন", transliteration: "يومي", arabic: "الحياة اليومية" },
  { id: "general", label: "সাধারণ", transliteration: "عام", arabic: "عام" },
];

export const getCategoryById = (id: string): ArabicCategory =>
  SAUDI_CATEGORIES.find((c) => c.id === id) || SAUDI_CATEGORIES[SAUDI_CATEGORIES.length - 1];