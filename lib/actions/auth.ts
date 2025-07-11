"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendVerificationEmail } from "@/lib/email";
import { generateEmailVerificationToken } from "@/lib/utils";

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

    // Generate verification token
    const verificationToken = generateEmailVerificationToken();

    // Store the verification token in the user's metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        verification_token: verificationToken,
        verification_token_expires_at: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(), // 24 hours
      },
    });

    if (updateError) {
      console.error("Error storing verification token:", updateError);
      return { error: "Error creating verification token" };
    }

    // Send verification email using Resend
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return { error: "Error sending verification email" };
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
      session: signUpData.session,
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

export async function resetPassword(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
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
