import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GrammarImage } from "@/types/grammar";
import { toast } from "sonner";
import { dexieService } from "@/lib/dexieDb";
import { useEffect } from "react";

const SYNC_KEY = 'arabicResources';
const CACHE_DURATION_MINUTES = 15;

/**
 * Fetch all Arabic resources with Dexie caching (mirrors useResourcesSimple).
 */
export const useArabicResourcesSimple = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const loadFromCache = async () => {
            try {
                const cached = await dexieService.getAllArabicResources();
                if (cached && cached.length > 0) {
                    queryClient.setQueryData(["arabic-resources-simple"], cached);
                }
            } catch (error) {
                console.error("Failed to load arabic resources from Dexie cache:", error);
            }
        };
        loadFromCache();
    }, [queryClient]);

    return useQuery({
        queryKey: ["arabic-resources-simple"],
        queryFn: async () => {
            try {
                const shouldSync = await dexieService.shouldSync(SYNC_KEY, CACHE_DURATION_MINUTES);

                if (!shouldSync) {
                    const cached = await dexieService.getAllArabicResources();
                    if (cached.length > 0) return cached;
                }

                console.log('[Firestore] Fetching arabic resources...');
                const q = query(collection(db, "arabicResources"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const resources = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as GrammarImage[];

                await dexieService.clearArabicResources();
                await dexieService.addArabicResources(resources);
                await dexieService.updateSyncMetadata(SYNC_KEY);

                return resources;
            } catch (error) {
                console.warn("Firestore fetch failed, falling back to Dexie cache", error);
                const cached = await dexieService.getAllArabicResources();
                if (cached.length === 0) {
                    console.error('No cached arabic resources available');
                    throw error;
                }
                return cached;
            }
        },
        staleTime: 1000 * 60 * CACHE_DURATION_MINUTES,
        gcTime: 1000 * 60 * 30,
    });
};

export const useArabicResourceMutations = () => {
    const queryClient = useQueryClient();

    const addResource = useMutation({
        mutationFn: async (newResource: any) => {
            const docRef = await addDoc(collection(db, "arabicResources"), newResource);
            return { id: docRef.id, ...newResource } as GrammarImage;
        },
        onSuccess: (newResource) => {
            dexieService.addArabicResource(newResource)
                .then(() => dexieService.updateSyncMetadata(SYNC_KEY))
                .catch(err => console.error('[Dexie] Failed to cache arabic resource:', err));
            queryClient.setQueryData(["arabic-resources-simple"], (oldData: GrammarImage[] | undefined) => {
                if (!oldData) return [newResource];
                return [newResource, ...oldData];
            });
            toast.success("Arabic post added successfully");
        },
        onError: (error: unknown) => {
            console.error("Error adding arabic resource:", error);
            toast.error("Failed to add Arabic post");
        },
    });

    const updateResource = useMutation({
        mutationFn: async ({ id, ...data }: Partial<GrammarImage> & { id: string }) => {
            await updateDoc(doc(db, "arabicResources", id), data);
            return { id, ...data };
        },
        onSuccess: async (updatedResource) => {
            const currentCache = queryClient.getQueryData<GrammarImage[]>(["arabic-resources-simple"]);
            const fullResource = currentCache?.find(r => r.id === updatedResource.id);
            if (fullResource) {
                const mergedResource = { ...fullResource, ...updatedResource } as GrammarImage;
                dexieService.addArabicResource(mergedResource)
                    .then(() => dexieService.updateSyncMetadata(SYNC_KEY))
                    .catch(err => console.error('[Dexie] Failed to cache arabic resource update:', err));
                queryClient.setQueryData(["arabic-resources-simple"], (oldData: GrammarImage[] | undefined) => {
                    if (!oldData) return oldData;
                    return oldData.map((item) =>
                        item.id === updatedResource.id ? mergedResource : item
                    );
                });
            }
            toast.success("Arabic post updated successfully");
        },
        onError: (error: unknown) => {
            console.error("Error updating arabic resource:", error);
            toast.error("Failed to update Arabic post");
        },
    });

    const deleteResource = useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "arabicResources", id));
            return id;
        },
        onSuccess: (deletedId) => {
            dexieService.deleteArabicResource(deletedId)
                .then(() => dexieService.updateSyncMetadata(SYNC_KEY))
                .catch(err => console.error('[Dexie] Failed to delete arabic resource:', err));
            queryClient.setQueryData(["arabic-resources-simple"], (oldData: GrammarImage[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter((item) => item.id !== deletedId);
            });
            toast.success("Arabic post deleted");
        },
        onError: (error: unknown) => {
            console.error("Error deleting arabic resource:", error);
            toast.error("Failed to delete Arabic post");
        },
    });

    return { addResource, updateResource, deleteResource };
};

export const ARABIC_ITEMS_PER_PAGE = 12;

export const useArabicResources = () => {
    return useQuery({
        queryKey: ["arabic-resources"],
        queryFn: async () => {
            const q = query(collection(db, "arabicResources"), orderBy("createdAt", "desc"), limit(50));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as GrammarImage[];
        },
        staleTime: 1000 * 60 * 5,
    });
};
