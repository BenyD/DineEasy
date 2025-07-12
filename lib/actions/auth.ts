"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { generateEmailVerificationToken } from "@/lib/utils";

// Add rate limit check function
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const timeWindow = 5 * 60; // 5 minutes in seconds
  const maxAttempts = 3; // Max 3 attempts per 5 minutes

  const { data: attempts, error } = await supabase
    .from("email_verifications")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", new Date(Date.now() - timeWindow * 1000).toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error checking rate limit:", error);
    return false;
  }

  return (attempts?.length || 0) < maxAttempts;
}

export async function resendVerificationEmail(email: string) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    // Get user by email from auth.users table using admin client
    const {
      data: { users },
      error: userError,
    } = await adminSupabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      return { error: "Failed to process request" };
    }

    const user = users?.find((u) => u.email === email);

    if (!user) {
      console.error("User not found with email:", email);
      return { error: "User not found" };
    }

    // Check if user has already verified their email through our custom system
    const { data: verificationStatus, error: statusError } = await supabase.rpc(
      "is_email_verified",
      { p_user_id: user.id }
    );

    if (statusError) {
      console.error("Error checking verification status:", statusError);
      // Continue anyway, don't block resending
    } else if (verificationStatus === true) {
      // User has already verified their email, but allow resending for expired links
      console.log(
        "User has verified email, but allowing resend for expired links"
      );
    }

    // Ensure profile record exists
    await ensureProfileExists(
      adminSupabase,
      user.id,
      user.user_metadata?.full_name || "New User"
    );

    // Check rate limit
    const canResend = await checkRateLimit(supabase, user.id);
    if (!canResend) {
      return {
        error: "Too many attempts. Please wait 5 minutes before trying again.",
      };
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();

    // Store new verification record using admin client
    const { error: verificationError } = await adminSupabase
      .from("email_verifications")
      .insert({
        user_id: user.id,
        email: email,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
      });

    if (verificationError) {
      console.error("Error creating verification record:", verificationError);
      return { error: "Error creating verification token" };
    }

    // Send new verification email
    await sendVerificationEmail(email, verificationToken);

    return { success: true, message: "Verification email sent" };
  } catch (error) {
    console.error("Error in resendVerificationEmail:", error);
    return { error: "Failed to resend verification email" };
  }
}

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    console.log("Starting signup process...");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;

    // Verify required environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL is not set");
      return { error: "Server configuration error" };
    }

    // First create the user without email verification
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined, // Disable Supabase email verification
        },
      }
    );

    if (signUpError) {
      console.error("Supabase auth error:", signUpError);
      return { error: signUpError.message };
    }

    if (!signUpData.user) {
      console.error("No user data returned from signup");
      return { error: "No user returned" };
    }

    // Note: Supabase might automatically set email_confirmed_at during signup
    // We'll handle this in the verification process by checking our custom verification records
    // rather than relying on Supabase's email_confirmed_at field

    // Generate verification token
    const verificationToken = generateEmailVerificationToken();

    // Store verification data in database using admin client with service role privileges
    const { error: verificationError } = await adminSupabase
      .from("email_verifications")
      .insert({
        user_id: signUpData.user.id,
        email: email,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
      });

    if (verificationError) {
      console.error("Error storing verification data:", verificationError);
      // Clean up the created user if verification record creation fails
      try {
        await adminSupabase.auth.admin.deleteUser(signUpData.user.id);
      } catch (cleanupError) {
        console.error(
          "Error cleaning up user after verification failure:",
          cleanupError
        );
      }
      return { error: "Error creating verification token" };
    }

    // Send verification email using Resend
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't return error here as the user was created successfully
      // They can request a new verification email later
    }

    // Log successful signup
    console.log("Signup successful:", {
      id: signUpData.user.id,
      email: signUpData.user.email,
      verificationSent: true,
    });

    return {
      success: true,
      message: "Check your email to verify your account",
      user: signUpData.user,
    };
  } catch (error) {
    console.error("Unexpected error during signup:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred" };
  }
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(email: string) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    // Check if user exists by email
    const {
      data: { users },
      error: userError,
    } = await adminSupabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      // Don't expose whether the user exists or not for security
      return { success: true };
    }

    // Find user by email (case-insensitive)
    const user = users?.find(
      (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
    );

    console.log("Password reset request:", {
      email,
      userFound: !!user,
      userEmail: user?.email,
    });

    // Always return success even if email doesn't exist (security best practice)
    if (!user) {
      console.log("No user found with email:", email);
      return { success: true };
    }

    // Ensure profile record exists
    await ensureProfileExists(
      adminSupabase,
      user.id,
      user.user_metadata?.full_name || "New User"
    );

    // Generate a custom password reset token
    const resetToken = generateEmailVerificationToken(); // Reuse the same token generator

    // Store reset token in database using admin client
    const { error: tokenError } = await adminSupabase
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        email: email,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        created_at: new Date().toISOString(),
      });

    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      // Don't expose whether the user exists or not for security
      return { success: true };
    }

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log("Generated custom reset link:", resetLink);

    // Send password reset email using Resend
    try {
      await sendPasswordResetEmail(email, resetLink);
      console.log("Password reset email sent successfully for:", email);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Don't expose whether the user exists or not for security
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    // Always return success for security (don't reveal if user exists)
    return { success: true };
  }
}

// Helper function to ensure profile record exists
async function ensureProfileExists(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
  fullName: string
) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Error checking profile:", checkError);
      return;
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { error: insertError } = await adminSupabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
      } else {
        console.log("Created missing profile for user:", userId);
      }
    }
  } catch (error) {
    console.error("Error ensuring profile exists:", error);
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const token = formData.get("token") as string;
    const email = formData.get("email") as string;

    console.log("Reset password attempt:", {
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
      hasToken: !!token,
      hasEmail: !!email,
      tokenLength: token?.length,
    });

    // Validate passwords
    if (!password || !confirmPassword) {
      return { error: "Both password fields are required" };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" };
    }

    if (password.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    if (!token) {
      return { error: "Invalid reset token" };
    }

    console.log("Verifying password reset token...");

    // Verify the password reset token using our custom function
    const { data: verificationData, error: verificationError } = await supabase
      .rpc("verify_password_reset_token", { p_token: token })
      .single();

    if (verificationError) {
      console.error("Token verification error:", verificationError);
      return { error: "Invalid or expired reset token" };
    }

    const verification = verificationData as any;

    if (!verification?.success) {
      console.error("Token verification failed:", verification);
      return {
        error: verification?.error || "Invalid or expired reset token",
        debug: verification?.debug,
      };
    }

    console.log("Token verified successfully, updating password...");

    // Use admin client to update the user's password
    const { error: updateError } =
      await adminSupabase.auth.admin.updateUserById(verification.user_id, {
        password: password,
      });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return { error: updateError.message };
    }

    console.log("Password updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return { error: "Failed to reset password" };
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function updateEmailAndResendVerification(
  currentEmail: string,
  newEmail: string
) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    // Get user by current email
    const {
      data: { users },
      error: userError,
    } = await adminSupabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      return { error: "Failed to process request" };
    }

    const user = users?.find((u) => u.email === currentEmail);

    if (!user) {
      console.error("User not found with email:", currentEmail);
      return { error: "User not found" };
    }

    // Check if new email is already in use
    const existingUser = users?.find((u) => u.email === newEmail);
    if (existingUser) {
      return { error: "Email address is already in use" };
    }

    // Check if user has already verified their email through our custom system
    const { data: verificationStatus, error: statusError } = await supabase.rpc(
      "is_email_verified",
      { p_user_id: user.id }
    );

    if (statusError) {
      console.error("Error checking verification status:", statusError);
      // Continue anyway, don't block email change
    } else if (verificationStatus === true) {
      // User has verified their email, but changing email requires new verification
      console.log(
        "User has verified email, but new email requires verification"
      );
    }

    // Check rate limit
    const canResend = await checkRateLimit(supabase, user.id);
    if (!canResend) {
      return {
        error: "Too many attempts. Please wait 5 minutes before trying again.",
      };
    }

    // Update user email in Supabase Auth
    const { error: updateError } =
      await adminSupabase.auth.admin.updateUserById(user.id, {
        email: newEmail,
      });

    if (updateError) {
      console.error("Error updating user email:", updateError);
      return { error: "Failed to update email address" };
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();

    // Store new verification record
    const { error: verificationError } = await adminSupabase
      .from("email_verifications")
      .insert({
        user_id: user.id,
        email: newEmail,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString(),
      });

    if (verificationError) {
      console.error("Error creating verification record:", verificationError);
      return { error: "Error creating verification token" };
    }

    // Send verification email to new address
    await sendVerificationEmail(newEmail, verificationToken);

    return {
      success: true,
      message: "Email updated and verification sent to new address",
    };
  } catch (error) {
    console.error("Error in updateEmailAndResendVerification:", error);
    return { error: "Failed to update email and resend verification" };
  }
}

export async function debugEmailVerification(email: string) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  try {
    // Check if email_verifications table exists and has data
    const { data: verifications, error: verificationsError } =
      await adminSupabase
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false });

    if (verificationsError) {
      console.error("Error checking verifications:", verificationsError);
      return { error: "Database error" };
    }

    // Check if user exists in auth.users table
    const {
      data: { users },
      error: userError,
    } = await adminSupabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      return { error: "Failed to check users" };
    }

    const user = users?.find((u) => u.email === email);

    if (!user) {
      console.error("User not found with email:", email);
      return { error: "User not found" };
    }

    // Get custom verification status
    const { data: verificationStatus, error: statusError } = await supabase.rpc(
      "get_user_verification_status",
      { p_user_id: user.id }
    );

    // Check if profile exists
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      },
      profile: profile || null,
      profileExists: !!profile,
      verifications: verifications || [],
      tableExists: true,
      customVerificationStatus: verificationStatus || null,
      customVerificationError: statusError || null,
    };
  } catch (error) {
    console.error("Debug error:", error);
    return { error: "Debug failed" };
  }
}
