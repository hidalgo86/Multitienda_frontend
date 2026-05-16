"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearGuestCart, getGuestCart, syncCart } from "@/store/slices/cartSlice";
import { clearRemoteCart, listCartItems, upsertCartItem } from "@/services/cart";
import {
  clearStoredSession,
  getValidStoredAuthToken,
  isStoredAdminUser,
} from "@/services/users";
import type { AppDispatch, RootState } from "@/store";
import { findVariantBySelection, getProductStock } from "@/types/domain/products";
import { toast } from "sonner";
import { isSessionError, reportClientError } from "@/lib/errorUtils";

export default function CartSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItemsRef = React.useRef(cartItems);
  const previousTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  React.useEffect(() => {
    let mounted = true;
    let syncing = false;

    const syncCartState = async () => {
      if (syncing) return;
      syncing = true;

      try {
        if (isStoredAdminUser()) {
          previousTokenRef.current = null;
          if (mounted) {
            dispatch(syncCart([]));
          }
          return;
        }

        const token = getValidStoredAuthToken();
        const isLoginTransition = Boolean(token) && !previousTokenRef.current;

        if (!token) {
          previousTokenRef.current = null;
          if (mounted) {
            dispatch(syncCart(getGuestCart()));
          }
          return;
        }

        const localGuestCart = getGuestCart();
        const guestCartByKey = new Map(
          [
            ...localGuestCart,
            ...(isLoginTransition ? cartItemsRef.current : []),
          ].map((item) => [
            `${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`,
            item,
          ]),
        );
        const guestCart = Array.from(guestCartByKey.values());
        let remoteCart = await listCartItems({ token });
        remoteCart = Array.isArray(remoteCart) ? remoteCart : [];

        if (guestCart.length > 0) {
          const mergedEntries = new Map<string, { productId: string; variantName?: string; quantity: number }>();

          for (const item of remoteCart) {
            const key = `${item.id}::${item.selectedSize ?? ""}`;
            mergedEntries.set(key, {
              productId: item.id,
              variantName: item.selectedSize,
              quantity: item.quantity,
            });
          }

          for (const item of guestCart) {
            const key = `${item.id}::${item.selectedSize ?? ""}`;
            const current = mergedEntries.get(key);
            const requestedQuantity = (current?.quantity ?? 0) + item.quantity;
            const availableStock = item.selectedSize
              ? Math.max(
                  0,
                  Number(
                    findVariantBySelection(item.variants, item.selectedSize)
                      ?.stock ?? 0,
                  ),
                )
              : getProductStock(item);
            const quantity = Math.min(requestedQuantity, availableStock);

            if (quantity <= 0) {
              continue;
            }

            if (quantity < requestedQuantity) {
              toast.warning(
                `Ajustamos "${item.name}" al stock disponible (${availableStock}).`,
              );
            }

            mergedEntries.set(key, {
              productId: item.id,
              variantName: item.selectedSize,
              quantity,
            });
          }

          await clearRemoteCart({ token });

          for (const entry of mergedEntries.values()) {
            remoteCart = await upsertCartItem(
              {
                productId: entry.productId,
                quantity: entry.quantity,
                variantName: entry.variantName,
              },
              { token },
            );
            remoteCart = Array.isArray(remoteCart) ? remoteCart : [];
          }

          clearGuestCart();
        }

        if (mounted) {
          dispatch(syncCart(remoteCart));
        }
        previousTokenRef.current = token;
      } catch (error) {
        if (isSessionError(error)) {
          previousTokenRef.current = null;
          clearStoredSession();
        } else {
          reportClientError("Error syncing cart:", error);
        }

        if (mounted) {
          dispatch(syncCart(getGuestCart()));
        }
      } finally {
        syncing = false;
      }
    };

    void syncCartState();

    const handleSync = () => {
      void syncCartState();
    };

    window.addEventListener("auth:session-changed", handleSync);

    return () => {
      mounted = false;
      window.removeEventListener("auth:session-changed", handleSync);
    };
  }, [dispatch]);

  return <>{children}</>;
}
