import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, FileText, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { bulkImportMenuItems } from "@/lib/actions/menu";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  available: boolean;
  popular: boolean;
  allergens: Array<{ id: string; name: string; icon: string }>;
  preparationTime: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuImportExportProps {
  menuItems: MenuItem[];
  categories: Category[];
  onRefresh: () => void;
}

export function MenuImportExport({
  menuItems,
  categories,
  onRefresh,
}: MenuImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create CSV content from menu items
      const headers = [
        "Name",
        "Description",
        "Price",
        "Category",
        "Available",
        "Popular",
        "Allergens",
        "Preparation Time (minutes)",
        "Image URL",
      ];

      const csvRows = [headers.join(",")];

      // Add each menu item as a row
      for (const item of menuItems) {
        const category = categories.find((c) => c.id === item.categoryId);
        const allergens = item.allergens?.map((a) => a.name).join(", ") || "";

        // Escape special characters in CSV
        const escapeCsvValue = (value: string) => {
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        const row = [
          escapeCsvValue(item.name),
          escapeCsvValue(item.description || ""),
          item.price.toString(),
          escapeCsvValue(category?.name || ""),
          item.available ? "TRUE" : "FALSE",
          item.popular ? "TRUE" : "FALSE",
          escapeCsvValue(allergens),
          item.preparationTime.toString(),
          escapeCsvValue(item.image || ""),
        ];

        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${menuItems.length} menu items successfully`);
      setPopoverOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export menu");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      try {
        const text = await file.text();
        const lines = text.split("\n");

        if (lines.length < 2) {
          throw new Error(
            "CSV file is empty or invalid. Please use the template format."
          );
        }

        if (lines.length > 1001) {
          throw new Error(
            "CSV file is too large. Maximum 1000 items allowed per import."
          );
        }

        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));
        const expectedHeaders = [
          "Name",
          "Description",
          "Price",
          "Category",
          "Available",
          "Popular",
          "Allergens",
          "Preparation Time (minutes)",
          "Image URL",
        ];

        // Validate headers
        if (!expectedHeaders.every((h) => headers.includes(h))) {
          throw new Error(
            "CSV file format is invalid. Please use the template."
          );
        }

        // Process the CSV data
        const importData = [];

        // Process each row (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            // Parse CSV row (handle quoted values with commas inside)
            const values = [];
            let current = "";
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ""));
                current = "";
              } else {
                current += char;
              }
            }
            values.push(current.trim().replace(/^"|"$/g, ""));

            const [
              name,
              description,
              price,
              categoryName,
              available,
              popular,
              allergens,
              preparationTime,
              imageUrl,
            ] = values;

            if (!name || !price || isNaN(parseFloat(price))) {
              console.warn(
                `Skipping row ${i + 1}: missing required fields or invalid price`
              );
              continue;
            }

            const parsedPrice = parseFloat(price);
            if (parsedPrice <= 0) {
              console.warn(
                `Skipping row ${i + 1}: price must be greater than 0`
              );
              continue;
            }

            importData.push({
              name: name.trim(),
              description: (description || "").trim(),
              price: parsedPrice,
              categoryName: (categoryName || "").trim(),
              available: available === "TRUE" || available === "true",
              popular: popular === "TRUE" || popular === "true",
              allergens: (allergens || "").trim(),
              preparationTime: Math.max(1, parseInt(preparationTime) || 15),
              imageUrl: (imageUrl || "").trim(),
            });
          } catch (rowError) {
            console.error(`Error processing row ${i + 1}:`, rowError);
          }
        }

        if (importData.length === 0) {
          throw new Error("No valid menu items found in the CSV file. Please check the format and try again.");
        }

        // Call the bulk import function
        const result = await bulkImportMenuItems(importData);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.data) {
          const { created, errors, total } = result.data;

          if (errors.length > 0) {
            toast.error(
              `Import completed with ${errors.length} errors. ${created}/${total} items created.`
            );
            console.error("Import errors:", errors);
          } else {
            toast.success(`Successfully imported ${created} menu items`);
          }
        } else {
          toast.success("Import completed successfully");
        }

        onRefresh();
      } catch (error) {
        console.error("Import error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to import menu"
        );
      } finally {
        setIsImporting(false);
        e.target.value = "";
        setPopoverOpen(false);
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "Name",
        "Description",
        "Price",
        "Category",
        "Available",
        "Popular",
        "Allergens",
        "Preparation Time (minutes)",
        "Image URL",
      ];

      // Add sample data rows
      const sampleRows = [
        [
          "Margherita Pizza",
          "Classic tomato sauce with mozzarella cheese",
          "18.50",
          "Pizza",
          "TRUE",
          "TRUE",
          "Dairy, Gluten",
          "20",
          "",
        ],
        [
          "Caesar Salad",
          "Fresh romaine lettuce with parmesan cheese",
          "12.00",
          "Salads",
          "TRUE",
          "FALSE",
          "Dairy, Nuts",
          "10",
          "",
        ],
        [
          "Chocolate Cake",
          "Rich chocolate cake with vanilla frosting",
          "8.50",
          "Desserts",
          "TRUE",
          "TRUE",
          "Dairy, Eggs, Gluten",
          "5",
          "",
        ],
      ];

      const csvContent = [
        headers.join(","),
        ...sampleRows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
      setPopoverOpen(false);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || menuItems.length === 0}
            className="w-full justify-start text-sm"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting
              ? "Exporting..."
              : menuItems.length === 0
              ? "Export Menu (No items)"
              : `Export Menu (${menuItems.length} items)`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full justify-start text-sm"
          >
            <Upload className="w-5 h-5 mr-2" />
            {isImporting ? "Processing..." : "Import Menu"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Separator className="my-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadTemplate}
            className="w-full justify-start text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
