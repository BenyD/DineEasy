import QRCode from "qrcode";
import { QR_CONFIG } from "@/lib/constants";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface TableQRData {
  tableId: string;
  tableNumber: string;
  restaurantId: string;
  restaurantName?: string;
  qrUrl: string;
}

// Default QR code options
const defaultOptions: QRCodeOptions = {
  width: 256,
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
  errorCorrectionLevel: "M",
};

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataURL(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const dataURL = await QRCode.toDataURL(data, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    });

    return dataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG
 */
export async function generateQRCodeSVG(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const svg = await QRCode.toString(data, {
      type: "svg",
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    });

    return svg;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error("Failed to generate QR code SVG");
  }
}

/**
 * Generate QR code URL for table
 */
export function generateTableQRUrl(
  tableId: string,
  restaurantId: string
): string {
  return `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${tableId}`;
}

/**
 * Generate QR code data for table
 */
export function generateTableQRData(
  tableId: string,
  tableNumber: string,
  restaurantId: string,
  restaurantName?: string
): TableQRData {
  const qrUrl = generateTableQRUrl(tableId, restaurantId);

  return {
    tableId,
    tableNumber,
    restaurantId,
    restaurantName,
    qrUrl,
  };
}

/**
 * Download QR code as image
 */
export async function downloadQRCode(
  data: string,
  filename: string,
  options: QRCodeOptions = {}
): Promise<void> {
  try {
    const dataURL = await generateQRCodeDataURL(data, options);

    // Create download link
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading QR code:", error);
    throw new Error("Failed to download QR code");
  }
}

/**
 * Download QR code as SVG
 */
export async function downloadQRCodeSVG(
  data: string,
  filename: string,
  options: QRCodeOptions = {}
): Promise<void> {
  try {
    const svg = await generateQRCodeSVG(data, options);

    // Create SVG blob
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading QR code SVG:", error);
    throw new Error("Failed to download QR code SVG");
  }
}

/**
 * Generate QR code with custom styling for table
 */
export async function generateStyledTableQR(
  tableData: TableQRData,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = JSON.stringify({
    tableId: tableData.tableId,
    tableNumber: tableData.tableNumber,
    restaurantId: tableData.restaurantId,
    url: tableData.qrUrl,
    timestamp: new Date().toISOString(),
  });

  return generateQRCodeDataURL(qrData, {
    width: 300,
    margin: 4,
    color: {
      dark: "#1F2937",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
    ...options,
  });
}

/**
 * Generate QR code with restaurant branding
 */
export async function generateBrandedQR(
  tableData: TableQRData,
  restaurantLogo?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  // For now, return a simple QR code
  // In a more advanced implementation, you could overlay the logo
  return generateStyledTableQR(tableData, options);
}

/**
 * Check if a QR code URL is using the correct environment
 */
export function isQRCodeEnvironmentCorrect(qrUrl: string): boolean {
  if (!qrUrl) return false;

  const currentBaseUrl = QR_CONFIG.BASE_URL;
  const urlBase = qrUrl.split("/qr/")[0];

  return urlBase === currentBaseUrl;
}

/**
 * Get the correct QR code URL for the current environment
 */
export function getCorrectQRCodeUrl(tableId: string): string {
  return `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${tableId}`;
}
