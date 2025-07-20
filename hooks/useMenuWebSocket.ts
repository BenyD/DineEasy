import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useMenuSettings } from "@/lib/store/menu-settings";
import {
  getMenuWebSocket,
  disconnectMenuWebSocket,
} from "@/lib/websocket/menu";

interface UseMenuWebSocketOptions {
  isAddDialogOpen?: boolean;
  editingItem?: any;
  isSubmitting?: boolean;
  isAddingCategoryOrAllergen?: boolean;
}

export function useMenuWebSocket({
  isAddDialogOpen = false,
  editingItem = null,
  isSubmitting = false,
  isAddingCategoryOrAllergen = false,
}: UseMenuWebSocketOptions = {}) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { menuItems, categories, allergens } = useMenuSettings();

  // Subscribe to WebSocket updates
  const subscribeToUpdates = useCallback(() => {
    const webSocket = getMenuWebSocket();

    // Subscribe to all menu updates
    const unsubscribe = webSocket.subscribeToAll((payload: any) => {
      const { eventType, newRecord, oldRecord, table } = payload;

      // Only process updates if we have data
      if (!newRecord && !oldRecord) return;

      // Prevent WebSocket updates when user is actively working on forms
      // This prevents form resets during image upload and form submission
      // BUT allow category and allergen updates even when dialog is open
      if (editingItem || isSubmitting) {
        // Skip all WebSocket updates when editing or submitting to prevent form interference
        return;
      }

      // Skip all WebSocket updates when adding categories/allergens to prevent form resets
      if (isAddingCategoryOrAllergen) {
        console.log(
          "WebSocket: Skipping updates during category/allergen addition"
        );
        return;
      }

      // For add dialog, allow category and allergen updates but skip menu item updates
      if (isAddDialogOpen && table === "menu_items") {
        // Skip menu item updates when add dialog is open to prevent form interference
        return;
      }

      // Get current store state
      const currentState = useMenuSettings.getState();

      if (table === "menu_items") {
        handleMenuItemUpdate(eventType, newRecord, oldRecord, currentState);
      } else if (table === "menu_categories") {
        handleCategoryUpdate(eventType, newRecord, oldRecord, currentState);
      } else if (table === "allergens") {
        handleAllergenUpdate(eventType, newRecord, oldRecord, currentState);
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Update presence
    webSocket.updatePresence({
      user_id: "current_user",
      page: "menu",
    });

    return unsubscribe;
  }, [editingItem, isSubmitting, isAddDialogOpen, isAddingCategoryOrAllergen]);

  // Handle menu item updates
  const handleMenuItemUpdate = useCallback(
    (eventType: string, newRecord: any, oldRecord: any, currentState: any) => {
      if (eventType === "INSERT" && newRecord) {
        // New menu item added - only add if not already present
        const exists = currentState.menuItems.some(
          (item: any) => item.id === newRecord.id
        );
        if (!exists) {
          useMenuSettings.setState((state) => ({
            menuItems: [...state.menuItems, newRecord],
          }));
          toast.success(`Menu item "${newRecord.name}" added`);
        }
      } else if (eventType === "UPDATE" && newRecord) {
        // Menu item updated - only update if the record actually changed
        const existingItem = currentState.menuItems.find(
          (item: any) => item.id === newRecord.id
        );
        if (
          existingItem &&
          JSON.stringify(existingItem) !== JSON.stringify(newRecord)
        ) {
          // Show toast for important changes
          if (existingItem.available !== newRecord.available) {
            toast.success(
              `Menu item "${newRecord.name}" ${newRecord.available ? "made available" : "made unavailable"}`
            );
          } else if (existingItem.price !== newRecord.price) {
            toast.success(`Menu item "${newRecord.name}" price updated`);
          } else {
            toast.success(`Menu item "${newRecord.name}" updated`);
          }
          useMenuSettings.setState((state) => ({
            menuItems: state.menuItems.map((item: any) =>
              item.id === newRecord.id ? newRecord : item
            ),
          }));
        }
      } else if (eventType === "DELETE" && oldRecord) {
        // Menu item deleted - only remove if it exists
        const exists = currentState.menuItems.some(
          (item: any) => item.id === oldRecord.id
        );
        if (exists) {
          useMenuSettings.setState((state) => ({
            menuItems: state.menuItems.filter(
              (item: any) => item.id !== oldRecord.id
            ),
          }));
          toast.success(`Menu item "${oldRecord.name}" deleted`);
        }
      }
    },
    []
  );

  // Handle category updates
  const handleCategoryUpdate = useCallback(
    (eventType: string, newRecord: any, oldRecord: any, currentState: any) => {
      if (eventType === "INSERT" && newRecord) {
        // New category added
        const exists = currentState.categories.some(
          (cat: any) => cat.id === newRecord.id
        );
        if (!exists) {
          useMenuSettings.setState((state) => ({
            categories: [...state.categories, newRecord],
          }));
          // Only show toast if add dialog is not open (to prevent duplicate toasts)
          if (!isAddDialogOpen) {
            toast.success(`Category "${newRecord.name}" added`);
          }
          console.log("WebSocket: Category added in real-time:", newRecord);
          console.log(
            "Updated categories state:",
            useMenuSettings.getState().categories
          );

          // Force a re-render of the form to show the new category
          setTimeout(() => {
            console.log("Forcing form re-render after category addition");
          }, 100);
        }
      } else if (eventType === "UPDATE" && newRecord) {
        // Category updated
        const existingCategory = currentState.categories.find(
          (cat: any) => cat.id === newRecord.id
        );
        if (
          existingCategory &&
          JSON.stringify(existingCategory) !== JSON.stringify(newRecord)
        ) {
          useMenuSettings.setState((state) => ({
            categories: state.categories.map((cat: any) =>
              cat.id === newRecord.id ? newRecord : cat
            ),
          }));
          toast.success(`Category "${newRecord.name}" updated`);
          console.log("WebSocket: Category updated in real-time:", newRecord);
        }
      } else if (eventType === "DELETE" && oldRecord) {
        // Category deleted
        const exists = currentState.categories.some(
          (cat: any) => cat.id === oldRecord.id
        );
        if (exists) {
          useMenuSettings.setState((state) => ({
            categories: state.categories.filter(
              (cat: any) => cat.id !== oldRecord.id
            ),
          }));
          toast.success(`Category "${oldRecord.name}" deleted`);
          console.log("WebSocket: Category deleted in real-time:", oldRecord);
        }
      }
    },
    [isAddDialogOpen]
  );

  // Handle allergen updates
  const handleAllergenUpdate = useCallback(
    (eventType: string, newRecord: any, oldRecord: any, currentState: any) => {
      if (eventType === "INSERT" && newRecord) {
        // New allergen added
        const exists = currentState.allergens.some(
          (allergen: any) => allergen.id === newRecord.id
        );
        if (!exists) {
          useMenuSettings.setState((state) => ({
            allergens: [...state.allergens, newRecord],
          }));
          // Only show toast if add dialog is not open (to prevent duplicate toasts)
          if (!isAddDialogOpen) {
            toast.success(`Allergen "${newRecord.name}" added`);
          }
          console.log("WebSocket: Allergen added in real-time:", newRecord);
          console.log(
            "Updated allergens state:",
            useMenuSettings.getState().allergens
          );

          // Force a re-render of the form to show the new allergen
          setTimeout(() => {
            console.log("Forcing form re-render after allergen addition");
          }, 100);
        }
      } else if (eventType === "UPDATE" && newRecord) {
        // Allergen updated
        const existingAllergen = currentState.allergens.find(
          (allergen: any) => allergen.id === newRecord.id
        );
        if (
          existingAllergen &&
          JSON.stringify(existingAllergen) !== JSON.stringify(newRecord)
        ) {
          useMenuSettings.setState((state) => ({
            allergens: state.allergens.map((allergen: any) =>
              allergen.id === newRecord.id ? newRecord : allergen
            ),
          }));
          toast.success(`Allergen "${newRecord.name}" updated`);
          console.log("WebSocket: Allergen updated in real-time:", newRecord);
        }
      } else if (eventType === "DELETE" && oldRecord) {
        // Allergen deleted
        const exists = currentState.allergens.some(
          (allergen: any) => allergen.id === oldRecord.id
        );
        if (exists) {
          useMenuSettings.setState((state) => ({
            allergens: state.allergens.filter(
              (allergen: any) => allergen.id !== oldRecord.id
            ),
          }));
          toast.success(`Allergen "${oldRecord.name}" deleted`);
          console.log("WebSocket: Allergen deleted in real-time:", oldRecord);
        }
      }
    },
    [isAddDialogOpen]
  );

  // Initialize WebSocket subscription
  useEffect(() => {
    const unsubscribe = subscribeToUpdates();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscribeToUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Return cleanup function for manual disconnection if needed
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    disconnectMenuWebSocket();
  }, []);

  return {
    disconnect,
    isConnected: !!unsubscribeRef.current,
  };
}
