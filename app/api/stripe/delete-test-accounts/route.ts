import { NextRequest, NextResponse } from "next/server";
import { deleteMultipleStripeAccounts } from "@/lib/actions/stripe-connect";

// Test account IDs from your Stripe accounts list
const testAccountIds = [
  'acct_1RqnB9B7rnuNCill',
  'acct_1RqnAuB7rnfv6jLl'
];

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting deletion of test Stripe Connect accounts...');
    
    const results = await deleteMultipleStripeAccounts(testAccountIds);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`API: Deletion completed - ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: testAccountIds.length,
        successful: successCount,
        failed: failureCount
      }
    });
    
  } catch (error) {
    console.error('API: Error deleting test accounts:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to delete test accounts",
    accountIds: testAccountIds
  });
} 