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
  Globe,
  Check as CheckIcon,
  X as CloseIcon,
  Save,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateTableQRData,
  generateQRCodeDataURL,
  generateQRCodeSVG,
} from "@/lib/utils/qr-code";
import { QR_CONFIG } from "@/lib/constants";
import {
  useQRSettings,
  colorPresets,
  type ColorPreset,
} from "@/lib/store/qr-settings";

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

// Sample table data for preview
const sampleTableData = {
  tableId: "sample-table-id",
  tableNumber: "1",
  restaurantId: "sample-restaurant-id",
  restaurantName: "Sample Restaurant",
  qrUrl: `${QR_CONFIG.BASE_URL}${QR_CONFIG.PATH_PREFIX}/sample-table-id`,
};

export function UnifiedQRSettingsModal() {
  const {
    settings,
    isSettingsModalOpen,
    updateSettings,
    resetToDefaults,
    closeSettingsModal,
    getQRCodeOptions,
    applyColorPreset,
    loadSettings,
    isLoading,
  } = useQRSettings();

  const [previewQrCode, setPreviewQrCode] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [selectedPreviewMode, setSelectedPreviewMode] = useState(
    previewModes.find((mode) => mode.id === settings.defaultPreviewMode) ||
      previewModes[0]
  );
  const [copied, setCopied] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isSettingsModalOpen) {
      loadSettings();
    }
  }, [isSettingsModalOpen, loadSettings]);

  // Generate preview QR code when settings change
  useEffect(() => {
    if (isSettingsModalOpen) {
      generatePreviewQRCode();
    }
  }, [isSettingsModalOpen, settings]);

  const generatePreviewQRCode = useCallback(async () => {
    if (!isSettingsModalOpen) return;

    setIsGeneratingPreview(true);
    try {
      const qrData = JSON.stringify({
        tableId: sampleTableData.tableId,
        tableNumber: sampleTableData.tableNumber,
        restaurantId: sampleTableData.restaurantId,
        url: sampleTableData.qrUrl,
      });

      const qrCodeDataUrl = await generateQRCodeDataURL(
        qrData,
        getQRCodeOptions()
      );
      setPreviewQrCode(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating preview QR code:", error);
      toast.error("Failed to generate preview QR code");
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [isSettingsModalOpen, settings, getQRCodeOptions]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings);
      toast.success("QR code settings saved successfully");
      closeSettingsModal();
    } catch (error) {
      toast.error("Failed to save QR code settings");
    }
  };

  const handleResetSettings = async () => {
    try {
      await resetToDefaults();
      toast.success("QR code settings reset to defaults");
    } catch (error) {
      toast.error("Failed to reset QR code settings");
    }
  };

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={closeSettingsModal}>
      <DialogContent className="max-w-4xl w-full h-[700px] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            QR Code Settings
          </DialogTitle>
          <DialogDescription>
            Configure how your QR codes look and behave across all tables
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[580px] overflow-hidden">
          {/* Settings Panel */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Basic Settings */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <QrCode className="w-4 h-4" />
                      Basic Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure the fundamental QR code properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Width */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>QR Code Size</span>
                        <span className="text-xs text-muted-foreground">
                          {settings.width}px
                        </span>
                      </Label>
                      <Slider
                        value={[settings.width]}
                        onValueChange={([value]) =>
                          updateSettings({ width: value })
                        }
                        min={128}
                        max={512}
                        step={32}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 256px for most use cases
                      </p>
                    </div>

                    {/* Margin */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Margin</span>
                        <span className="text-xs text-muted-foreground">
                          {settings.margin}px
                        </span>
                      </Label>
                      <Slider
                        value={[settings.margin]}
                        onValueChange={([value]) =>
                          updateSettings({ margin: value })
                        }
                        min={0}
                        max={8}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        White space around the QR code
                      </p>
                    </div>

                    {/* Error Correction Level */}
                    <div className="space-y-2">
                      <Label className="text-sm">Error Correction Level</Label>
                      <Select
                        value={settings.errorCorrectionLevel}
                        onValueChange={(value: "L" | "M" | "Q" | "H") =>
                          updateSettings({ errorCorrectionLevel: value })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {errorCorrectionLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {level.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {level.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Higher levels provide better error correction but larger
                        QR codes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Settings */}
              <TabsContent value="appearance" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="w-4 h-4" />
                      Color Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Customize the colors of your QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Color Presets */}
                    <div className="space-y-3">
                      <Label className="text-sm">Color Presets</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {colorPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            onClick={() => applyColorPreset(preset)}
                            className={cn(
                              "justify-start h-auto p-2",
                              settings.colorDark === preset.dark &&
                                settings.colorLight === preset.light &&
                                "border-green-500 bg-green-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded border"
                                style={{
                                  background: `linear-gradient(45deg, ${preset.dark} 50%, ${preset.light} 50%)`,
                                }}
                              />
                              <div className="text-left">
                                <div className="font-medium text-xs">
                                  {preset.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {preset.description}
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Dark Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.colorDark}
                            onChange={(e) =>
                              updateSettings({ colorDark: e.target.value })
                            }
                            className="w-10 h-8 p-1"
                          />
                          <Input
                            value={settings.colorDark}
                            onChange={(e) =>
                              updateSettings({ colorDark: e.target.value })
                            }
                            placeholder="#000000"
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Light Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.colorLight}
                            onChange={(e) =>
                              updateSettings({ colorLight: e.target.value })
                            }
                            className="w-10 h-8 p-1"
                          />
                          <Input
                            value={settings.colorLight}
                            onChange={(e) =>
                              updateSettings({ colorLight: e.target.value })
                            }
                            placeholder="#FFFFFF"
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Logo Settings */}
              <TabsContent value="logo" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ImageIcon className="w-4 h-4" />
                      Logo Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure logo overlay for QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Include Logo */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Include Logo</Label>
                        <p className="text-xs text-muted-foreground">
                          Add restaurant logo overlay to QR codes
                        </p>
                      </div>
                      <Switch
                        checked={settings.includeLogo}
                        onCheckedChange={(checked) =>
                          updateSettings({ includeLogo: checked })
                        }
                      />
                    </div>

                    {/* Logo Size */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Logo Size</span>
                        <span className="text-xs text-muted-foreground">
                          {settings.logoSize}%
                        </span>
                      </Label>
                      <Slider
                        value={[settings.logoSize]}
                        onValueChange={([value]) =>
                          updateSettings({ logoSize: value })
                        }
                        min={10}
                        max={80}
                        step={5}
                        className="w-full"
                        disabled={!settings.includeLogo}
                      />
                      <p className="text-xs text-muted-foreground">
                        Size of logo relative to QR code
                      </p>
                    </div>

                    {/* Logo Opacity */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Logo Opacity</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(settings.logoOpacity * 100)}%
                        </span>
                      </Label>
                      <Slider
                        value={[settings.logoOpacity]}
                        onValueChange={([value]) =>
                          updateSettings({ logoOpacity: value })
                        }
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="w-full"
                        disabled={!settings.includeLogo}
                      />
                      <p className="text-xs text-muted-foreground">
                        Transparency level of logo overlay
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Export Settings */}
              <TabsContent value="export" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Export Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure default export options for QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Default Export Format */}
                    <div className="space-y-2">
                      <Label className="text-sm">Default Export Format</Label>
                      <Select
                        value={settings.defaultExportFormat}
                        onValueChange={(value: "png" | "svg" | "pdf") =>
                          updateSettings({ defaultExportFormat: value })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG (Raster)</SelectItem>
                          <SelectItem value="svg">SVG (Vector)</SelectItem>
                          <SelectItem value="pdf">PDF (Document)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Default Export Size */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm">
                        <span>Default Export Size</span>
                        <span className="text-xs text-muted-foreground">
                          {settings.defaultExportSize}px
                        </span>
                      </Label>
                      <Slider
                        value={[settings.defaultExportSize]}
                        onValueChange={([value]) =>
                          updateSettings({ defaultExportSize: value })
                        }
                        min={256}
                        max={1024}
                        step={128}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Size for downloaded QR codes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Settings */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="w-4 h-4" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure advanced QR code features and behaviors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Auto Regenerate */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">
                          Auto Regenerate on Change
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically regenerate QR codes when settings change
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoRegenerateOnChange}
                        onCheckedChange={(checked) =>
                          updateSettings({ autoRegenerateOnChange: checked })
                        }
                      />
                    </div>

                    {/* Show QR Code Info */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">
                          Show QR Code Information
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Display additional information with QR codes
                        </p>
                      </div>
                      <Switch
                        checked={settings.showQRCodeInfo}
                        onCheckedChange={(checked) =>
                          updateSettings({ showQRCodeInfo: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-72 border-l border-gray-200 px-4 py-4">
            <div className="sticky top-0">
              <div className="space-y-3">
                {/* Preview Header */}
                <div>
                  <h3 className="font-semibold text-base mb-1">Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    See how your QR code will look with current settings
                  </p>
                </div>

                {/* Preview Mode Selector */}
                <div className="space-y-2">
                  <Label className="text-sm">Preview Mode</Label>
                  <Select
                    value={selectedPreviewMode.id}
                    onValueChange={(value) => {
                      const mode = previewModes.find((m) => m.id === value);
                      if (mode) {
                        setSelectedPreviewMode(mode);
                        updateSettings({ defaultPreviewMode: value as any });
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {previewModes.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          <div className="flex items-center gap-2">
                            <mode.icon className="w-3 h-3" />
                            {mode.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* QR Code Preview */}
                <Card className="p-3">
                  <div className="flex items-center justify-center">
                    {isGeneratingPreview ? (
                      <div className="w-24 h-24 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                      </div>
                    ) : previewQrCode ? (
                      <img
                        src={previewQrCode}
                        alt="QR Code Preview"
                        className="max-w-full h-auto"
                        style={{
                          maxWidth:
                            selectedPreviewMode.width *
                            selectedPreviewMode.scale,
                          maxHeight:
                            selectedPreviewMode.height *
                            selectedPreviewMode.scale,
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Sample URL */}
                <div className="text-xs text-muted-foreground break-all">
                  {sampleTableData.qrUrl}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Reset to Defaults
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={closeSettingsModal}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
