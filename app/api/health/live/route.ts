import { NextRequest, NextResponse } from "next/server";

interface LivenessCheck {
  status: "alive" | "dead";
  timestamp: string;
  uptime: number;
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  process: {
    pid: number;
    version: string;
    platform: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Get memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

    // Check if memory usage is critically high (over 1GB heap used)
    const heapUsedGB = memUsage.heapUsed / 1024 / 1024 / 1024;
    const isMemoryCritical = heapUsedGB > 1;

    // Check if process has been running for too long (optional)
    const uptimeHours = process.uptime() / 3600;
    const isUptimeCritical = uptimeHours > 24 * 7; // 7 days

    const livenessCheck: LivenessCheck = {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
        rss: `${rssMB} MB`,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
      },
    };

    // Determine if process is dead
    if (isMemoryCritical || isUptimeCritical) {
      livenessCheck.status = "dead";
    }

    // Set appropriate HTTP status code
    const statusCode = livenessCheck.status === "alive" ? 200 : 503;

    const response = NextResponse.json(livenessCheck, { status: statusCode });

    // Add headers
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    // If we can't even respond to the liveness check, the process is definitely dead
    return NextResponse.json(
      {
        status: "dead",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
