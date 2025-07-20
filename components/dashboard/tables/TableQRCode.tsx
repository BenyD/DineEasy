"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, QrCode, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  generateStyledTableQR,
  downloadQRCode,
  downloadQRCodeSVG,
  type TableQRData,
} from "@/lib/utils/qr-code";
import { useQRSettings } from "@/lib/store/qr-settings";

interface TableQRCodeProps {
  tableData: TableQRData;
  size?: "sm" | "md" | "lg" | "xl";
  showActions?: boolean;
  className?: string;
  onRegenerate?: () => void;
}

export function TableQRCode({
  tableData,
  size = "md",
  showActions = true,
  className = "",
  onRegenerate,
}: TableQRCodeProps) {
  const { getQRCodeOptions, settings } = useQRSettings();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { width: 120, height: 120, qrSize: 100 },
    md: { width: 180, height: 180, qrSize: 160 },
    lg: { width: 240, height: 240, qrSize: 220 },
    xl: { width: 300, height: 300, qrSize: 280 },
  };

  const config = sizeConfig[size];

  // Generate QR code on mount and when settings change
  useEffect(() => {
    generateQRCode();
  }, [tableData, settings]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const qrOptions = getQRCodeOptions();
      const qrDataUrl = await generateStyledTableQR(tableData, {
        ...qrOptions,
        width: config.qrSize,
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      const qrOptions = getQRCodeOptions();
      await downloadQRCode(
        JSON.stringify({
          tableId: tableData.tableId,
          tableNumber: tableData.tableNumber,
          restaurantId: tableData.restaurantId,
          url: tableData.qrUrl,
        }),
        `table-${tableData.tableNumber}-qr`,
        {
          ...qrOptions,
          width: settings.defaultExportSize,
        }
      );
      toast.success("QR code downloaded as PNG");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleDownloadSVG = async () => {
    try {
      const qrOptions = getQRCodeOptions();
      await downloadQRCodeSVG(
        JSON.stringify({
          tableId: tableData.tableId,
          tableNumber: tableData.tableNumber,
          restaurantId: tableData.restaurantId,
          url: tableData.qrUrl,
        }),
        `table-${tableData.tableNumber}-qr`,
        {
          ...qrOptions,
          width: settings.defaultExportSize,
        }
      );
      toast.success("QR code downloaded as SVG");
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(tableData.qrUrl);
      setCopied(true);
      toast.success("QR code URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleRegenerate = () => {
    generateQRCode();
    if (onRegenerate) {
      onRegenerate();
    }
    toast.success("QR code regenerated");
  };

  return (
    <div className={`relative ${className}`}>
      {/* QR Code Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white rounded-xl border-2 border-gray-200 overflow-hidden ${
          isVisible ? "shadow-md" : "shadow-sm"
        }`}
        style={{ width: config.width, height: config.height }}
      >
        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-100 flex items-center justify-center"
            >
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Image */}
        <AnimatePresence>
          {qrCodeDataUrl && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0.3 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center p-2"
            >
              <img
                src={qrCodeDataUrl}
                alt={`QR Code for Table ${tableData.tableNumber}`}
                className="w-full h-full object-contain"
                style={{ maxWidth: config.qrSize, maxHeight: config.qrSize }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-2"
        >
          {/* Download Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPNG}
              className="flex-1 text-xs"
              disabled={isLoading}
            >
              <Download className="w-3 h-3 mr-1" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSVG}
              className="flex-1 text-xs"
              disabled={isLoading}
            >
              <Download className="w-3 h-3 mr-1" />
              SVG
            </Button>
          </div>

          {/* Copy URL */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
            className="w-full text-xs"
            disabled={isLoading}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy URL
              </>
            )}
          </Button>

          {/* Regenerate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            className="w-full text-xs"
            disabled={isLoading}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        </motion.div>
      )}

      {/* URL Display */}
      {settings.showQRCodeInfo && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 break-all">{tableData.qrUrl}</p>
        </div>
      )}
    </div>
  );
}
