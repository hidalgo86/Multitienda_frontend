"use client";

import React from "react";
import { useDispatch } from "react-redux";
import {
  clearGuestFavorites,
  getGuestFavorites,
  syncFavorites,
} from "@/store/slices/favoriteSlice";
import { addFavoriteProduct, listFavoriteProducts } from "@/services/favorites";
import {
  clearStoredSession,
  getValidStoredAuthToken,
  isStoredAdminUser,
} from "@/services/users";
import type { AppDispatch } from "@/store";
import { isSessionError, reportClientError } from "@/lib/errorUtils";

export default function FavoritesSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    let mounted = true;
    let syncing = false;

    const syncFavoritesState = async () => {
      if (syncing) return;
      syncing = true;

      try {
        if (isStoredAdminUser()) {
          if (mounted) {
            dispatch(syncFavorites([]));
          }
          return;
        }

        const token = getValidStoredAuthToken();

        if (!token) {
          if (mounted) {
            dispatch(syncFavorites(getGuestFavorites()));
          }
          return;
        }

        const guestFavorites = getGuestFavorites();
        let remoteFavorites = await listFavoriteProducts({ token });
        remoteFavorites = Array.isArray(remoteFavorites) ? remoteFavorites : [];
        const remoteIds = new Set(remoteFavorites.map((product) => product.id));
        const missingGuestFavorites = guestFavorites.filter(
          (product) => product.id && !remoteIds.has(product.id),
        );

        for (const product of missingGuestFavorites) {
          remoteFavorites = await addFavoriteProduct(product.id, { token });
          remoteFavorites = Array.isArray(remoteFavorites)
            ? remoteFavorites
            : [];
        }

        if (missingGuestFavorites.length > 0) {
          clearGuestFavorites();
        }

        if (mounted) {
          dispatch(syncFavorites(remoteFavorites));
        }
      } catch (error) {
        if (isSessionError(error)) {
          clearStoredSession();
        } else {
          reportClientError("Error syncing favorites:", error);
        }

        if (mounted) {
          dispatch(syncFavorites(getGuestFavorites()));
        }
      } finally {
        syncing = false;
      }
    };

    void syncFavoritesState();

    const handleSync = () => {
      void syncFavoritesState();
    };

    window.addEventListener("auth:session-changed", handleSync);

    return () => {
      mounted = false;
      window.removeEventListener("auth:session-changed", handleSync);
    };
  }, [dispatch]);

  return <>{children}</>;
}
