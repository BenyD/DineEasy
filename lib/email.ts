"use server";

import { Resend } from "resend";
import { getBaseUrl } from "./env";
import { getCurrencySymbol } from "./utils/currency";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    console.log("Attempting to send verification email to:", email);
    console.log("Using verification link:", verificationLink);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Verify your DineEasy account",
      html: `
        <h2>Welcome to DineEasy!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verificationLink}" style="
            padding: 12px 24px;
            background-color: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 16px 0;
          ">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error; // Re-throw to handle in the calling function
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Reset your DineEasy password",
      html: `
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p>
          <a href="${resetLink}" style="
            padding: 12px 24px;
            background-color: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 16px 0;
          ">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const sendInvoiceReceipt = async (
  email: string,
  invoiceData: {
    invoiceId: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    subscriptionPlan?: string;
    billingPeriod?: string;
    isTrialUpgrade?: boolean;
    trialEndDate?: string;
  }
) => {
  try {
    const formattedAmount = (invoiceData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(invoiceData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    // Helper function to title case interval
    const titleCaseInterval = (interval: string) => {
      return interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    };

    // Format the plan name for display
    const formattedPlan = invoiceData.subscriptionPlan
      ? titleCasePlan(invoiceData.subscriptionPlan)
      : "Unknown Plan";

    // Format the description with proper title casing
    let formattedDescription = invoiceData.description;
    if (
      invoiceData.subscriptionPlan &&
      invoiceData.description.includes(invoiceData.subscriptionPlan)
    ) {
      // Extract interval from description if present
      const intervalMatch = invoiceData.description.match(/- (\w+)$/);
      const interval = intervalMatch ? intervalMatch[1] : "";

      if (interval) {
        formattedDescription = `DineEasy ${formattedPlan} Plan - ${titleCaseInterval(interval)}`;
      } else {
        formattedDescription = `DineEasy ${formattedPlan} Plan`;
      }
    }

    // Format billing period with proper date formatting
    let formattedBillingPeriod = invoiceData.billingPeriod;
    if (
      invoiceData.billingPeriod &&
      invoiceData.billingPeriod !== "Invalid Date - Invalid Date"
    ) {
      try {
        const [startDate, endDate] = invoiceData.billingPeriod.split(" - ");
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          formattedBillingPeriod = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        } else {
          formattedBillingPeriod = "Billing period not available";
        }
      } catch (error) {
        formattedBillingPeriod = "Billing period not available";
      }
    } else {
      formattedBillingPeriod = "Billing period not available";
    }

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `Invoice Receipt - ${formattedDescription}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Invoice Receipt</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Payment Confirmation</h2>
            <p style="margin: 5px 0; color: #666;">Thank you for your payment!</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Invoice Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Invoice ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${invoiceData.invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.date}</td>
              </tr>
              ${
                invoiceData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.subscriptionPlan
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan}</td>
              </tr>
              `
                  : ""
              }
              ${
                formattedBillingPeriod !== "Billing period not available"
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Billing Period:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedBillingPeriod}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.isTrialUpgrade && invoiceData.trialEndDate
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Trial Ends:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.trialEndDate}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Description:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedDescription}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #333;">Total Amount:</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; text-align: right; color: #22c55e;">${currencySymbol}${formattedAmount}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Payment Status</h4>
            <p style="margin: 5px 0; color: #22c55e; font-weight: bold;">✓ Payment Successful</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Your payment has been processed successfully.</p>
            ${
              invoiceData.isTrialUpgrade
                ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Your trial period continues until ${invoiceData.trialEndDate}.</p>`
                : ""
            }
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for choosing DineEasy!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Invoice receipt email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending invoice receipt email:", error);
    throw error;
  }
};

export const sendSubscriptionCancellationEmail = async (
  email: string,
  cancellationData: {
    subscriptionId: string;
    plan: string;
    interval: string;
    cancelDate: string;
    endDate: string;
    customerName?: string;
    restaurantName?: string;
    reason?: string;
  }
) => {
  try {
    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    // Helper function to title case interval
    const titleCaseInterval = (interval: string) => {
      return interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    };

    const formattedPlan = titleCasePlan(cancellationData.plan);
    const formattedInterval = titleCaseInterval(cancellationData.interval);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Subscription Cancelled - DineEasy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Subscription Cancellation</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin: 0 0 15px 0;">Subscription Cancelled</h2>
            <p style="margin: 5px 0; color: #856404;">Your subscription has been successfully cancelled.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Cancellation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Subscription ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${cancellationData.subscriptionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan} Plan - ${formattedInterval}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Cancelled On:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.cancelDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Access Until:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.endDate}</td>
              </tr>
              ${
                cancellationData.reason
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.reason}</td>
              </tr>
              `
                  : ""
              }
              ${
                cancellationData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>You'll continue to have access to all features until ${cancellationData.endDate}</li>
              <li>No further charges will be made to your account</li>
              <li>You can reactivate your subscription anytime from your dashboard</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">We're sorry to see you go!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions or would like to reactivate, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Subscription cancellation email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending subscription cancellation email:", error);
    throw error;
  }
};

export const sendRefundNotificationEmail = async (
  email: string,
  refundData: {
    refundId: string;
    amount: number;
    currency: string;
    reason: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    subscriptionPlan?: string;
    isFullRefund: boolean;
  }
) => {
  try {
    const formattedAmount = (refundData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(refundData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = refundData.subscriptionPlan
      ? titleCasePlan(refundData.subscriptionPlan)
      : "Unknown Plan";

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `Refund Processed - ${refundData.isFullRefund ? "Full" : "Partial"} Refund`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Refund Notification</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">Refund Processed</h2>
            <p style="margin: 5px 0; color: #155724;">Your refund has been successfully processed.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Refund Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Refund ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${refundData.refundId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Refund Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${refundData.isFullRefund ? "Full Refund" : "Partial Refund"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Refunded:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #28a745;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Currency:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.reason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.date}</td>
              </tr>
              ${
                refundData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                refundData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
              ${
                refundData.subscriptionPlan
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Subscription Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>The refund will be processed to your original payment method</li>
              <li>It may take 5-10 business days to appear on your statement</li>
              ${refundData.isFullRefund ? "<li>Your subscription has been cancelled</li>" : "<li>Your subscription remains active</li>"}
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for your understanding!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions about this refund, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Refund notification email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending refund notification email:", error);
    throw error;
  }
};

export const sendPaymentFailedEmail = async (
  email: string,
  paymentData: {
    invoiceId: string;
    amount: number;
    currency: string;
    subscriptionPlan: string;
    interval: string;
    dueDate: string;
    customerName?: string;
    restaurantName?: string;
    retryDate?: string;
  }
) => {
  try {
    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(paymentData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = titleCasePlan(paymentData.subscriptionPlan);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Payment Failed - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Payment Notification</p>
          </div>
          
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
            <h2 style="color: #721c24; margin: 0 0 15px 0;">Payment Failed</h2>
            <p style="margin: 5px 0; color: #721c24;">We were unable to process your subscription payment.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Payment Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Invoice ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${paymentData.invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Due:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #dc3545;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan} Plan - ${paymentData.interval}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Due Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.dueDate}</td>
              </tr>
              ${
                paymentData.retryDate
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Next Retry:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.retryDate}</td>
              </tr>
              `
                  : ""
              }
              ${
                paymentData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                paymentData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">What you need to do:</h4>
            <ul style="margin: 5px 0; color: #856404; font-size: 14px; padding-left: 20px;">
              <li>Update your payment method in your billing settings</li>
              <li>Ensure your card has sufficient funds</li>
              <li>Check that your card hasn't expired</li>
              <li>Contact your bank if there are any restrictions</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens if payment continues to fail?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>Your subscription will be suspended after multiple failed attempts</li>
              <li>You'll lose access to premium features</li>
              <li>Your restaurant data will be preserved</li>
              <li>You can reactivate anytime by updating your payment method</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Need help? Contact our support team!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              We're here to help you resolve any payment issues quickly.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Payment failed email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    throw error;
  }
};

export const sendSubscriptionWelcomeEmail = async (
  email: string,
  subscriptionData: {
    subscriptionId: string;
    plan: string;
    interval: string;
    trialEndDate: string;
    customerName?: string;
    restaurantName?: string;
    features: string[];
  }
) => {
  try {
    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = titleCasePlan(subscriptionData.plan);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `Welcome to DineEasy ${formattedPlan} Plan!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Welcome to Your New Subscription!</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">Welcome to DineEasy!</h2>
            <p style="margin: 5px 0; color: #155724;">Your ${formattedPlan} Plan subscription is now active.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Subscription Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Subscription ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${subscriptionData.subscriptionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan} Plan - ${subscriptionData.interval}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Trial Ends:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${subscriptionData.trialEndDate}</td>
              </tr>
              ${
                subscriptionData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${subscriptionData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                subscriptionData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${subscriptionData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Your ${formattedPlan} Plan Features:</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              ${subscriptionData.features.map((feature) => `<li>${feature}</li>`).join("")}
            </ul>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
            <h4 style="color: #004085; margin: 0 0 10px 0;">Getting Started</h4>
            <ul style="margin: 5px 0; color: #004085; font-size: 14px; padding-left: 20px;">
              <li>Complete your restaurant setup in the dashboard</li>
              <li>Set up your menu and pricing</li>
              <li>Configure your payment settings</li>
              <li>Start accepting orders from customers</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Ready to get started?</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              Log in to your dashboard to begin setting up your restaurant.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Subscription welcome email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending subscription welcome email:", error);
    throw error;
  }
};

export const sendPaymentDisputeEmail = async (
  email: string,
  disputeData: {
    disputeId: string;
    amount: number;
    currency: string;
    reason: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    orderId?: string;
  }
) => {
  try {
    const formattedAmount = (disputeData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(disputeData.currency);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Payment Dispute Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Payment Dispute Notification</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin: 0 0 15px 0;">Payment Dispute Received</h2>
            <p style="margin: 5px 0; color: #856404;">A customer has disputed a payment for your restaurant.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Dispute Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Dispute ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${disputeData.disputeId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Disputed:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #ffc107;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.reason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.date}</td>
              </tr>
              ${
                disputeData.orderId
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Order ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.orderId}</td>
              </tr>
              `
                  : ""
              }
              ${
                disputeData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                disputeData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>We'll review the dispute and gather evidence</li>
              <li>You may be asked to provide additional documentation</li>
              <li>The dispute will be resolved within 30-60 days</li>
              <li>You'll be notified of the final decision</li>
            </ul>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
            <h4 style="color: #004085; margin: 0 0 10px 0;">How to respond:</h4>
            <ul style="margin: 5px 0; color: #004085; font-size: 14px; padding-left: 20px;">
              <li>Review the order details and customer communication</li>
              <li>Gather any relevant documentation (receipts, delivery confirmations)</li>
              <li>Contact our support team if you need assistance</li>
              <li>Respond promptly to any requests for information</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Need help with this dispute?</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              Contact our support team for assistance with dispute resolution.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Payment dispute email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending payment dispute email:", error);
    throw error;
  }
};
