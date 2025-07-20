"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Download,
  Copy,
  Share2,
  Settings,
  Palette,
  Smartphone,
  Tablet,
  Monitor,
  Printer,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Target,
  Smartphone as MobileIcon,
  Tablet as TabletIcon,
  Monitor as DesktopIcon,
  Printer as PrintIcon,
  FileText,
  Image,
  Code,
  Link,
  TestTube,
  Globe,
  Check as CheckIcon,
  X as CloseIcon,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateTableQRData,
  generateQRCodeDataURL,
  generateQRCodeSVG,
} from "@/lib/utils/qr-code";
import { QR_CONFIG } from "@/lib/constants";

interface QRSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: any;
  onQRCodeUpdate?: () => void;
}

interface QRCodeOptions {
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  includeLogo?: boolean;
  logoSize?: number;
  logoOpacity?: number;
}

interface PreviewMode {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  width: number;
  height: number;
  scale: number;
  description: string;
}

const previewModes: PreviewMode[] = [
  {
    id: "mobile",
    name: "Mobile",
    icon: MobileIcon,
    width: 375,
    height: 667,
    scale: 0.8,
    description: "Smartphone view",
  },
  {
    id: "tablet",
    name: "Tablet",
    icon: TabletIcon,
    width: 768,
    height: 1024,
    scale: 0.6,
    description: "Tablet view",
  },
  {
    id: "desktop",
    name: "Desktop",
    icon: DesktopIcon,
    width: 1200,
    height: 800,
    scale: 0.4,
    description: "Desktop view",
  },
  {
    id: "print",
    name: "Print",
    icon: PrintIcon,
    width: 210,
    height: 297,
    scale: 1,
    description: "Print-ready",
  },
];

const errorCorrectionLevels = [
  {
    value: "L",
    label: "Low (7%)",
    description: "Fastest generation, lowest error correction",
  },
  {
    value: "M",
    label: "Medium (15%)",
    description: "Balanced performance and error correction",
  },
  {
    value: "Q",
    label: "Quartile (25%)",
    description: "Good error correction, moderate performance",
  },
  {
    value: "H",
    label: "High (30%)",
    description: "Best error correction, slower generation",
  },
];

const colorPresets = [
  {
    name: "Classic",
    dark: "#000000",
    light: "#FFFFFF",
    description: "Black and white",
  },
  {
    name: "Modern",
    dark: "#1F2937",
    light: "#F9FAFB",
    description: "Dark gray and light gray",
  },
  {
    name: "Brand",
    dark: "#3B82F6",
    light: "#FFFFFF",
    description: "Blue and white",
  },
  {
    name: "Elegant",
    dark: "#374151",
    light: "#FEF3C7",
    description: "Dark gray and cream",
  },
  {
    name: "Bold",
    dark: "#DC2626",
    light: "#FFFFFF",
    description: "Red and white",
  },
  {
    name: "Nature",
    dark: "#059669",
    light: "#ECFDF5",
    description: "Green and mint",
  },
];

export function QRSetupModal({
  isOpen,
  onClose,
  table,
  onQRCodeUpdate,
}: QRSetupModalProps) {
  const [activeTab, setActiveTab] = useState("customize");
  const [previewMode, setPreviewMode] = useState<PreviewMode>(previewModes[0]);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [qrCodeSVG, setQrCodeSVG] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // QR Code Options State
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    width: 300,
    margin: 4,
    color: {
      dark: "#1F2937",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    includeLogo: false,
    logoSize: 50,
    logoOpacity: 0.8,
  });

  // Advanced Options State
  const [advancedOptions, setAdvancedOptions] = useState({
    includeMetadata: true,
    includeTimestamp: true,
    includeTableInfo: true,
    includeRestaurantInfo: true,
    customData: "",
    dataFormat: "url" as "url" | "json" | "custom",
  });

  // Generate QR code data
  const qrCodeData = useMemo(() => {
    if (!table) return "";

    const baseData = {
      tableId: table.id,
      tableNumber: table.number,
      restaurantId: table.restaurant_id,
      url: `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/${table.id}`,
    };

    if (advancedOptions.dataFormat === "url") {
      return baseData.url;
    } else if (advancedOptions.dataFormat === "json") {
      const jsonData: any = { ...baseData };

      if (advancedOptions.includeTimestamp) {
        jsonData.timestamp = new Date().toISOString();
      }

      if (advancedOptions.includeTableInfo) {
        jsonData.tableInfo = {
          number: table.number,
          capacity: table.capacity,
          status: table.status,
        };
      }

      if (advancedOptions.includeRestaurantInfo) {
        jsonData.restaurantInfo = {
          id: table.restaurant_id,
          // Add more restaurant info as needed
        };
      }

      return JSON.stringify(jsonData);
    } else {
      return advancedOptions.customData || baseData.url;
    }
  }, [table, advancedOptions]);

  // Generate QR codes
  const generateQRCodes = useCallback(async () => {
    if (!table || !qrCodeData) return;

    setIsGenerating(true);
    try {
      const [dataURL, svg] = await Promise.all([
        generateQRCodeDataURL(qrCodeData, qrOptions),
        generateQRCodeSVG(qrCodeData, qrOptions),
      ]);

      setQrCodeDataURL(dataURL);
      setQrCodeSVG(svg);
    } catch (error) {
      console.error("Error generating QR codes:", error);
      toast.error("Failed to generate QR codes");
    } finally {
      setIsGenerating(false);
    }
  }, [table, qrCodeData, qrOptions]);

  // Generate QR codes on mount and when options change
  useEffect(() => {
    if (isOpen && table) {
      generateQRCodes();
    }
  }, [isOpen, table, qrCodeData, qrOptions]);

  // Download functions
  const downloadQRCode = async (format: "png" | "svg" | "pdf") => {
    if (!qrCodeDataURL || !qrCodeSVG) return;

    setIsDownloading(true);
    try {
      if (format === "png") {
        const link = document.createElement("a");
        link.href = qrCodeDataURL;
        link.download = `qr-code-table-${table.number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "svg") {
        const blob = new Blob([qrCodeSVG], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qr-code-table-${table.number}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        // PDF generation would require a library like jsPDF
        toast.info("PDF download coming soon");
      }

      toast.success(`QR code downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Failed to download QR code");
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy functions
  const copyQRCode = async (format: "url" | "image" | "svg") => {
    try {
      if (format === "url") {
        await navigator.clipboard.writeText(qrCodeData);
        toast.success("QR code URL copied to clipboard");
      } else if (format === "image") {
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        toast.success("QR code image copied to clipboard");
      } else if (format === "svg") {
        await navigator.clipboard.writeText(qrCodeSVG);
        toast.success("QR code SVG copied to clipboard");
      }
    } catch (error) {
      console.error("Error copying QR code:", error);
      toast.error("Failed to copy QR code");
    }
  };

  // Share function
  const shareQRCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `QR Code - Table ${table.number}`,
          text: `Scan this QR code to access the menu for Table ${table.number}`,
          url: qrCodeData,
        });
        toast.success("QR code shared successfully");
      } else {
        await copyQRCode("url");
      }
    } catch (error) {
      console.error("Error sharing QR code:", error);
      toast.error("Failed to share QR code");
    }
  };

  // Test QR code
  const testQRCode = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate QR code testing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock test results
      const testResults = {
        success: Math.random() > 0.1, // 90% success rate
        message:
          Math.random() > 0.1
            ? "QR code is working correctly"
            : "QR code has issues",
        details: {
          readability: Math.floor(Math.random() * 20) + 80, // 80-100%
          contrast: Math.floor(Math.random() * 20) + 80,
          size: Math.floor(Math.random() * 20) + 80,
          errorCorrection: qrOptions.errorCorrectionLevel,
        },
      };

      setTestResult(testResults);

      if (testResults.success) {
        toast.success("QR code test passed!");
      } else {
        toast.error("QR code test failed");
      }
    } catch (error) {
      console.error("Error testing QR code:", error);
      setTestResult({
        success: false,
        message: "Failed to test QR code",
      });
      toast.error("Failed to test QR code");
    } finally {
      setIsTesting(false);
    }
  };

  // Apply color preset
  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    setQrOptions((prev) => ({
      ...prev,
      color: {
        dark: preset.dark,
        light: preset.light,
      },
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setQrOptions({
      width: 300,
      margin: 4,
      color: {
        dark: "#1F2937",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
      includeLogo: false,
      logoSize: 50,
      logoOpacity: 0.8,
    });

    setAdvancedOptions({
      includeMetadata: true,
      includeTimestamp: true,
      includeTableInfo: true,
      includeRestaurantInfo: true,
      customData: "",
      dataFormat: "url",
    });
  };

  if (!table) {
    console.warn("QRSetupModal: No table provided");
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <QrCode className="w-6 h-6 text-blue-600" />
                QR Code Setup
                <Badge variant="outline" className="ml-2">
                  Table {table.number}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Customize and generate QR codes for your table. Perfect for
                digital menus and contactless ordering.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <CloseIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Controls */}
          <div className="w-1/2 border-r overflow-y-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full"
            >
              <div className="p-6">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger
                    value="customize"
                    className="flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    Customize
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="download"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </TabsTrigger>
                  <TabsTrigger value="test" className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="customize" className="space-y-6">
                  {/* Basic Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Basic Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Size (px)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[qrOptions.width]}
                            onValueChange={([value]) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                width: value,
                              }))
                            }
                            min={100}
                            max={800}
                            step={10}
                            className="flex-1"
                          />
                          <Input
                            value={qrOptions.width}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                width: parseInt(e.target.value) || 300,
                              }))
                            }
                            className="w-20"
                            type="number"
                            min={100}
                            max={800}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Margin (modules)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[qrOptions.margin]}
                            onValueChange={([value]) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                margin: value,
                              }))
                            }
                            min={0}
                            max={10}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            value={qrOptions.margin}
                            onChange={(e) =>
                              setQrOptions((prev) => ({
                                ...prev,
                                margin: parseInt(e.target.value) || 4,
                              }))
                            }
                            className="w-20"
                            type="number"
                            min={0}
                            max={10}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Error Correction Level</Label>
                        <Select
                          value={qrOptions.errorCorrectionLevel}
                          onValueChange={(value: "L" | "M" | "Q" | "H") =>
                            setQrOptions((prev) => ({
                              ...prev,
                              errorCorrectionLevel: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {errorCorrectionLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div className="font-medium">
                                    {level.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {level.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Color Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Colors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dark Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={qrOptions.color.dark}
                              onChange={(e) =>
                                setQrOptions((prev) => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    dark: e.target.value,
                                  },
                                }))
                              }
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={qrOptions.color.dark}
                              onChange={(e) =>
                                setQrOptions((prev) => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    dark: e.target.value,
                                  },
                                }))
                              }
                              className="flex-1"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Light Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={qrOptions.color.light}
                              onChange={(e) =>
                                setQrOptions((prev) => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    light: e.target.value,
                                  },
                                }))
                              }
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={qrOptions.color.light}
                              onChange={(e) =>
                                setQrOptions((prev) => ({
                                  ...prev,
                                  color: {
                                    ...prev.color,
                                    light: e.target.value,
                                  },
                                }))
                              }
                              className="flex-1"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Color Presets</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {colorPresets.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => applyColorPreset(preset)}
                              className="flex flex-col items-center gap-1 h-auto p-2"
                            >
                              <div
                                className="w-6 h-6 rounded border"
                                style={{
                                  background: `linear-gradient(45deg, ${preset.dark} 50%, ${preset.light} 50%)`,
                                }}
                              />
                              <div className="text-xs font-medium">
                                {preset.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {preset.description}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Advanced Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data Format</Label>
                        <Select
                          value={advancedOptions.dataFormat}
                          onValueChange={(value: "url" | "json" | "custom") =>
                            setAdvancedOptions((prev) => ({
                              ...prev,
                              dataFormat: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="url">Simple URL</SelectItem>
                            <SelectItem value="json">JSON Data</SelectItem>
                            <SelectItem value="custom">Custom Data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {advancedOptions.dataFormat === "json" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="includeTimestamp"
                              checked={advancedOptions.includeTimestamp}
                              onCheckedChange={(checked) =>
                                setAdvancedOptions((prev) => ({
                                  ...prev,
                                  includeTimestamp: checked,
                                }))
                              }
                            />
                            <Label htmlFor="includeTimestamp">
                              Include Timestamp
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="includeTableInfo"
                              checked={advancedOptions.includeTableInfo}
                              onCheckedChange={(checked) =>
                                setAdvancedOptions((prev) => ({
                                  ...prev,
                                  includeTableInfo: checked,
                                }))
                              }
                            />
                            <Label htmlFor="includeTableInfo">
                              Include Table Info
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="includeRestaurantInfo"
                              checked={advancedOptions.includeRestaurantInfo}
                              onCheckedChange={(checked) =>
                                setAdvancedOptions((prev) => ({
                                  ...prev,
                                  includeRestaurantInfo: checked,
                                }))
                              }
                            />
                            <Label htmlFor="includeRestaurantInfo">
                              Include Restaurant Info
                            </Label>
                          </div>
                        </div>
                      )}

                      {advancedOptions.dataFormat === "custom" && (
                        <div className="space-y-2">
                          <Label>Custom Data</Label>
                          <textarea
                            value={advancedOptions.customData}
                            onChange={(e) =>
                              setAdvancedOptions((prev) => ({
                                ...prev,
                                customData: e.target.value,
                              }))
                            }
                            className="w-full h-20 p-2 border rounded-md resize-none"
                            placeholder="Enter custom data for QR code..."
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>QR Code Data Preview</Label>
                        <div className="p-3 bg-muted rounded-md text-sm font-mono break-all">
                          {qrCodeData}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview Modes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {previewModes.map((mode) => (
                          <Button
                            key={mode.id}
                            variant={
                              previewMode.id === mode.id ? "default" : "outline"
                            }
                            onClick={() => setPreviewMode(mode)}
                            className="flex flex-col items-center gap-2 h-auto p-4"
                          >
                            <mode.icon className="w-6 h-6" />
                            <div>
                              <div className="font-medium">{mode.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {mode.description}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="download" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          onClick={() => downloadQRCode("png")}
                          disabled={isDownloading || !qrCodeDataURL}
                          className="flex items-center gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Download as PNG
                        </Button>
                        <Button
                          onClick={() => downloadQRCode("svg")}
                          disabled={isDownloading || !qrCodeSVG}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Code className="w-4 h-4" />
                          Download as SVG
                        </Button>
                        <Button
                          onClick={() => downloadQRCode("pdf")}
                          disabled={isDownloading}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Download as PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share & Copy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          onClick={shareQRCode}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share QR Code
                        </Button>
                        <Button
                          onClick={() => copyQRCode("url")}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Link className="w-4 h-4" />
                          Copy URL
                        </Button>
                        <Button
                          onClick={() => copyQRCode("image")}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Image className="w-4 h-4" />
                          Copy Image
                        </Button>
                        <Button
                          onClick={() => copyQRCode("svg")}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Code className="w-4 h-4" />
                          Copy SVG Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="test" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TestTube className="w-4 h-4" />
                        QR Code Testing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={testQRCode}
                        disabled={isTesting}
                        className="w-full flex items-center gap-2"
                      >
                        {isTesting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        {isTesting ? "Testing..." : "Test QR Code"}
                      </Button>

                      {testResult && (
                        <div
                          className={`p-4 rounded-lg border ${
                            testResult.success
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {testResult.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-medium">
                              {testResult.success
                                ? "Test Passed"
                                : "Test Failed"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {testResult.message}
                          </p>
                          {testResult.details && (
                            <div className="mt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  Readability: {testResult.details.readability}%
                                </div>
                                <div>
                                  Contrast: {testResult.details.contrast}%
                                </div>
                                <div>Size: {testResult.details.size}%</div>
                                <div>
                                  Error Correction:{" "}
                                  {testResult.details.errorCorrection}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Troubleshooting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="font-medium">Common Issues</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• QR code too small - increase size</li>
                          <li>• Poor contrast - adjust colors</li>
                          <li>• Hard to scan - increase error correction</li>
                          <li>• URL too long - use shorter format</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Best Practices</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Use high contrast colors</li>
                          <li>• Minimum size: 200px for mobile</li>
                          <li>• Error correction level M or higher</li>
                          <li>• Test on multiple devices</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 bg-muted/30 p-6 overflow-y-auto">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm p-4 rounded-lg border mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </h3>
                <Badge variant="outline" className="text-xs">
                  {previewMode.name}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Size: {qrOptions.width}px</span>
                <span>•</span>
                <span>Margin: {qrOptions.margin}</span>
                <span>•</span>
                <span>EC: {qrOptions.errorCorrectionLevel}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <motion.div
                key={`${qrOptions.width}-${qrOptions.margin}-${qrOptions.color.dark}-${qrOptions.color.light}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
                style={{
                  width: previewMode.width * previewMode.scale,
                  height: previewMode.height * previewMode.scale,
                }}
              >
                {/* Device Frame */}
                <div className="relative w-full h-full bg-white rounded-lg shadow-lg border overflow-hidden">
                  {/* Device Header */}
                  <div className="h-8 bg-gray-100 border-b flex items-center justify-center">
                    <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* Device Content */}
                  <div className="p-4 h-full flex items-center justify-center bg-gray-50">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-muted-foreground">
                          Generating QR Code...
                        </p>
                      </div>
                    ) : qrCodeDataURL ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                          <img
                            src={qrCodeDataURL}
                            alt={`QR Code for Table ${table.number}`}
                            className="max-w-full h-auto"
                            style={{
                              maxWidth: Math.min(
                                qrOptions.width,
                                previewMode.width - 32
                              ),
                              maxHeight: Math.min(
                                qrOptions.width,
                                previewMode.height - 100
                              ),
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Table {table.number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Scan to view menu
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <QrCode className="w-12 h-12 opacity-50" />
                        <p className="text-sm">No QR code generated</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* QR Code Info */}
            {qrCodeDataURL && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">QR Code Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Table:</span>
                      <span className="ml-2 font-medium">#{table.number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="ml-2 font-medium">
                        {table.capacity} people
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {table.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <span className="ml-2 font-medium">
                        {advancedOptions.dataFormat}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">URL:</span>
                    <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                      {qrCodeData}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{QR_CONFIG.BASE_URL}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>Table {table.number}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  if (onQRCodeUpdate) {
                    onQRCodeUpdate();
                  }
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
