import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    updateDoc,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArabicVocabulary } from "@/types/arabicVocabulary";
import { toast } from "sonner";
import { dexieService } from "@/lib/dexieDb";
import { useState, useEffect } from "react";

const SYNC_KEY = 'arabicVocabularies';
const CACHE_DURATION_MINUTES = 10;

export const useArabicVocabularies = (searchQuery?: string) => {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const loadFromCache = async () => {
            try {
                const cached = await dexieService.getAllArabicVocabularies();
                if (cached && cached.length > 0) {
                    queryClient.setQueryData(["arabic-vocabularies"], cached);
                }
            } catch (error) {
                console.error("[Dexie] Failed to load arabic vocabularies from cache:", error);
            }
        };
        loadFromCache();
    }, [queryClient]);

    const queryResult = useQuery({
        queryKey: ["arabic-vocabularies"],
        queryFn: async () => {
            try {
                // 1. Try to get data from Dexie first (Fast!)
                const cached = await dexieService.getAllArabicVocabularies();
                const shouldSync = await dexieService.shouldSync(SYNC_KEY, CACHE_DURATION_MINUTES);

                const fetchAndSync = async () => {
                    console.log('[Firestore] Fetching arabic vocabularies...');
                    const q = query(collection(db, "arabicVocabulary"), orderBy("createdAt", "desc"));
                    const snapshot = await getDocs(q);
                    const vocabularies = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as ArabicVocabulary[];

                    await dexieService.clearArabicVocabularies();
                    await dexieService.addArabicVocabularies(vocabularies);
                    await dexieService.updateSyncMetadata(SYNC_KEY);
                    queryClient.setQueryData(["arabic-vocabularies"], vocabularies);
                    return vocabularies;
                };

                // 2. If we have cached data, return it IMMEDIATELY
                if (cached && cached.length > 0) {
                    if (shouldSync) {
                        setTimeout(() => {
                            fetchAndSync().catch((err) => console.error("Background arabic sync failed:", err));
                        }, 1000);
                    }
                    return cached;
                }

                // 3. No local data? Must wait for Firestore
                return await fetchAndSync();
            } catch (error) {
                console.warn("Error in arabic queryFn:", error);
                const cached = await dexieService.getAllArabicVocabularies();
                if (cached.length > 0) return cached;
                throw error;
            }
        },
        staleTime: 1000 * 60 * CACHE_DURATION_MINUTES,
        gcTime: 1000 * 60 * 60 * 24,
        refetchInterval: 1000 * 60 * CACHE_DURATION_MINUTES,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // Filter on the client side so search never blocks on Firestore
    let data = queryResult.data;
    if (searchQuery?.trim() && data) {
        const q = searchQuery.trim().toLowerCase();
        data = data.filter((v) =>
            v.arabic.toLowerCase().includes(q) ||
            v.transliteration.toLowerCase().includes(q) ||
            v.bangla.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q)
        );
    }

    const refresh = async () => {
        setIsRefreshing(true);
        try {
            const q = query(collection(db, "arabicVocabulary"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const vocabularies = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ArabicVocabulary[];

            await dexieService.clearArabicVocabularies();
            await dexieService.addArabicVocabularies(vocabularies);
            await dexieService.updateSyncMetadata(SYNC_KEY);
            queryClient.setQueryData(["arabic-vocabularies"], vocabularies);
            return vocabularies;
        } catch (error) {
            console.error("Error refreshing arabic vocabularies:", error);
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    };

    return {
        ...queryResult,
        data,
        refresh,
        isRefetching: queryResult.isRefetching || isRefreshing,
    };
};

export const useArabicVocabularyMutations = () => {
    const queryClient = useQueryClient();

    const addVocabulary = useMutation({
        mutationFn: async (newVocab: Omit<ArabicVocabulary, "id">) => {
            const now = new Date().toISOString();
            const dataWithTimestamps = { ...newVocab, createdAt: now, updatedAt: now };
            const docRef = await addDoc(collection(db, "arabicVocabulary"), dataWithTimestamps);
            return { id: docRef.id, ...dataWithTimestamps } as ArabicVocabulary;
        },
        onSuccess: async (newVocab) => {
            await dexieService.addArabicVocabulary(newVocab);
            await dexieService.updateSyncMetadata(SYNC_KEY);
            queryClient.setQueryData(["arabic-vocabularies"], (oldData: ArabicVocabulary[] | undefined) => {
                if (!oldData) return [newVocab];
                return [newVocab, ...oldData];
            });
            toast.success("Arabic word added successfully");
        },
        onError: (error: unknown) => {
            console.error("Error adding arabic vocabulary:", error);
            toast.error("Failed to add Arabic word");
        },
    });

    const updateVocabulary = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ArabicVocabulary> }) => {
            const updateData = { ...data, updatedAt: new Date().toISOString() };
            await updateDoc(doc(db, "arabicVocabulary", id), updateData);
            return { id, ...updateData };
        },
        onSuccess: async (updatedVocab) => {
            const currentCache = queryClient.getQueryData<ArabicVocabulary[]>(["arabic-vocabularies"]);
            const fullVocab = currentCache?.find(v => v.id === updatedVocab.id);
            if (fullVocab) {
                const mergedVocab = { ...fullVocab, ...updatedVocab } as ArabicVocabulary;
                await dexieService.addArabicVocabulary(mergedVocab);
                await dexieService.updateSyncMetadata(SYNC_KEY);
                queryClient.setQueryData(["arabic-vocabularies"], (oldData: ArabicVocabulary[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map((item) =>
                        item.id === updatedVocab.id ? mergedVocab : item
                    );
                });
            }
        },
        onError: (error: unknown) => {
            console.error("Error updating arabic vocabulary:", error);
            toast.error("Failed to update Arabic word");
        },
    });

    const deleteVocabulary = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "arabicVocabulary", id));
            return id;
        },
        onSuccess: async (deletedId) => {
            await dexieService.deleteArabicVocabulary(deletedId);
            await dexieService.updateSyncMetadata(SYNC_KEY);
            queryClient.setQueryData(["arabic-vocabularies"], (oldData: ArabicVocabulary[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((item) => item.id !== deletedId);
            });
        },
        onError: (error: unknown) => {
            console.error("Error deleting arabic vocabulary:", error);
            toast.error("Failed to delete Arabic word");
        },
    });

    return { addVocabulary, updateVocabulary, deleteVocabulary };
};
