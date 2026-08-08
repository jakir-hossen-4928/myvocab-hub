export interface ArabicVocabulary {
  id: string;
  arabic: string;
  transliteration: string;
  bangla: string;
  english?: string;
  example?: string;
  exampleBangla?: string;
  category: string;
  createdAt: string | number;
  updatedAt: string | number;
  userId: string;
}

export interface ArabicCategory {
  id: string;
  label: string;
  arabic: string;
  transliteration: string;
}

export interface ArabicResource {
  id?: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
  userId?: string;
}