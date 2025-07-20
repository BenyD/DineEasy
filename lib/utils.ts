import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function generateQRCode(
  tableId: string,
  restaurantSlug: string
): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/qr/${restaurantSlug}/${tableId}`;
}

export function roundToFixed(value: number, decimals: number = 3): string {
  return Number(
    Math.round(Number(value + "e" + decimals)) + "e-" + decimals
  ).toFixed(decimals);
}

export function calculateCircularPosition(
  index: number,
  total: number,
  radius: number = 40
): { top: string; left: string } {
  const angle = ((index + 1) * 2 * Math.PI) / total;
  const top = 50 + Math.cos(angle) * radius;
  const left = 50 + Math.sin(angle) * radius;

  return {
    top: `${roundToFixed(top)}%`,
    left: `${roundToFixed(left)}%`,
  };
}

export function bytesToSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

export function generateEmailVerificationToken(): string {
  // Generate a random 32-byte token using Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export type OnboardingStep =
  | "auth"
  | "setup"
  | "select-plan"
  | "connect-stripe"
  | "complete";

export interface OnboardingStatus {
  step: OnboardingStep;
  isAuthenticated: boolean;
  emailVerified: boolean;
  hasRestaurant: boolean;
  subscriptionStatus: string | null;
  hasStripeAccount: boolean;
  stripeAccountEnabled: boolean;
}

/**
 * Determines the user's current onboarding step based on their progress
 * This helps users resume from where they left off if they close the tab
 */
export async function getOnboardingStatus(
  supabase: any
): Promise<OnboardingStatus> {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        step: "auth",
        isAuthenticated: false,
        emailVerified: false,
        hasRestaurant: false,
        subscriptionStatus: null,
        hasStripeAccount: false,
        stripeAccountEnabled: false,
      };
    }

    // Check if user's email is verified
    const { data: emailVerified, error: verificationError } =
      await supabase.rpc("is_email_verified", { p_user_id: user.id });

    // If email is not verified, redirect to verify-email page
    if (verificationError || !emailVerified) {
      return {
        step: "auth",
        isAuthenticated: true,
        emailVerified: false,
        hasRestaurant: false,
        subscriptionStatus: null,
        hasStripeAccount: false,
        stripeAccountEnabled: false,
      };
    }

    // Check if user has a restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        "id, subscription_status, stripe_account_id, stripe_account_enabled"
      )
      .eq("owner_id", user.id)
      .single();

    if (restaurantError || !restaurant) {
      return {
        step: "setup",
        isAuthenticated: true,
        emailVerified: true,
        hasRestaurant: false,
        subscriptionStatus: null,
        hasStripeAccount: false,
        stripeAccountEnabled: false,
      };
    }

    // Check subscription status
    if (
      !restaurant.subscription_status ||
      restaurant.subscription_status === "inactive" ||
      restaurant.subscription_status === "incomplete"
    ) {
      return {
        step: "select-plan",
        isAuthenticated: true,
        emailVerified: true,
        hasRestaurant: true,
        subscriptionStatus: restaurant.subscription_status,
        hasStripeAccount: !!restaurant.stripe_account_id,
        stripeAccountEnabled: restaurant.stripe_account_enabled || false,
      };
    }

    // Check Stripe Connect status
    if (!restaurant.stripe_account_id) {
      return {
        step: "connect-stripe",
        isAuthenticated: true,
        emailVerified: true,
        hasRestaurant: true,
        subscriptionStatus: restaurant.subscription_status,
        hasStripeAccount: false,
        stripeAccountEnabled: false,
      };
    }

    // Check if Stripe account is enabled
    if (!restaurant.stripe_account_enabled) {
      return {
        step: "connect-stripe",
        isAuthenticated: true,
        emailVerified: true,
        hasRestaurant: true,
        subscriptionStatus: restaurant.subscription_status,
        hasStripeAccount: true,
        stripeAccountEnabled: false,
      };
    }

    // All steps completed
    return {
      step: "complete",
      isAuthenticated: true,
      emailVerified: true,
      hasRestaurant: true,
      subscriptionStatus: restaurant.subscription_status,
      hasStripeAccount: true,
      stripeAccountEnabled: true,
    };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    // Default to auth step on error
    return {
      step: "auth",
      isAuthenticated: false,
      emailVerified: false,
      hasRestaurant: false,
      subscriptionStatus: null,
      hasStripeAccount: false,
      stripeAccountEnabled: false,
    };
  }
}

/**
 * Redirects user to the appropriate onboarding step based on their current status
 */
export function redirectToOnboardingStep(
  step: OnboardingStep,
  router: any,
  emailVerified?: boolean
) {
  switch (step) {
    case "auth":
      // If user is authenticated but email not verified, redirect to verify-email
      if (emailVerified === false) {
        router.push("/verify-email");
      } else {
        router.push("/login");
      }
      break;
    case "setup":
      router.push("/setup");
      break;
    case "select-plan":
      router.push("/select-plan");
      break;
    case "connect-stripe":
      router.push("/setup/connect");
      break;
    case "complete":
      router.push("/dashboard");
      break;
  }
}

/**
 * localStorage utility functions for onboarding flow persistence
 */

export function saveOnboardingProgress(formData: any, currentStep: number) {
  if (typeof window !== "undefined") {
    try {
      const dataToSave = {
        ...formData,
        logo: null, // Don't save File objects
        coverPhoto: null,
      };
      localStorage.setItem("setup-form-data", JSON.stringify(dataToSave));
      localStorage.setItem("setup-current-step", currentStep.toString());
    } catch (error) {
      console.error("Error saving onboarding progress:", error);
    }
  }
}

export function loadOnboardingProgress() {
  if (typeof window !== "undefined") {
    try {
      const savedData = localStorage.getItem("setup-form-data");
      const savedStep = localStorage.getItem("setup-current-step");

      if (savedData && savedStep) {
        return {
          formData: JSON.parse(savedData),
          currentStep: parseInt(savedStep),
          hasResumed: true,
        };
      }
    } catch (error) {
      console.error("Error loading onboarding progress:", error);
    }
  }

  return {
    formData: null,
    currentStep: 1,
    hasResumed: false,
  };
}

export function clearOnboardingProgress() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("setup-form-data");
      localStorage.removeItem("setup-current-step");
      localStorage.removeItem("additional-setup-form-data");
    } catch (error) {
      console.error("Error clearing onboarding progress:", error);
    }
  }
}

export function hasOnboardingProgress(): boolean {
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem("setup-form-data");
    const savedStep = localStorage.getItem("setup-current-step");
    return !!(savedData && savedStep && parseInt(savedStep) > 1);
  }
  return false;
}

/**
 * localStorage utility functions for add menu item modal persistence
 */

export function saveMenuItemFormProgress(
  formData: any,
  activeTab: string,
  isEditing: boolean = false
) {
  if (typeof window !== "undefined") {
    try {
      const dataToSave = {
        ...formData,
        image: null, // Don't save image URLs to localStorage
        imagePreview: null,
      };
      localStorage.setItem("menu-item-form-data", JSON.stringify(dataToSave));
      localStorage.setItem("menu-item-active-tab", activeTab);
      localStorage.setItem("menu-item-is-editing", isEditing.toString());
    } catch (error) {
      console.error("Error saving menu item form progress:", error);
    }
  }
}

export function loadMenuItemFormProgress() {
  if (typeof window !== "undefined") {
    try {
      const savedData = localStorage.getItem("menu-item-form-data");
      const savedTab = localStorage.getItem("menu-item-active-tab");
      const savedIsEditing = localStorage.getItem("menu-item-is-editing");

      if (savedData && savedTab) {
        return {
          formData: JSON.parse(savedData),
          activeTab: savedTab,
          isEditing: savedIsEditing === "true",
          hasResumed: true,
        };
      }
    } catch (error) {
      console.error("Error loading menu item form progress:", error);
    }
  }

  return {
    formData: null,
    activeTab: "basic",
    isEditing: false,
    hasResumed: false,
  };
}

export function clearMenuItemFormProgress() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("menu-item-form-data");
      localStorage.removeItem("menu-item-active-tab");
      localStorage.removeItem("menu-item-is-editing");
    } catch (error) {
      console.error("Error clearing menu item form progress:", error);
    }
  }
}

export function hasMenuItemFormProgress(): boolean {
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem("menu-item-form-data");
    const savedTab = localStorage.getItem("menu-item-active-tab");
    return !!(savedData && savedTab && savedTab !== "basic");
  }
  return false;
}

// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
