"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  MoreHorizontal,
  ImagePlus,
  Tag,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  FileText,
  Settings2,
  Image,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import {
  useMenuSettings,
  type MenuCategory,
  type Allergen,
} from "@/lib/store/menu-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { bytesToSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock menu data
const mockMenuItems = [
  {
    id: "1",
    name: "Margherita Pizza",
    description: "Fresh mozzarella, tomato sauce, and basil",
    price: 22.0,
    category: "mains",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 15,
    allergens: ["gluten", "dairy"],
    popular: true,
  },
  {
    id: "2",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, caesar dressing",
    price: 16.5,
    category: "starters",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 8,
    allergens: ["gluten", "dairy", "eggs"],
    popular: false,
  },
  {
    id: "3",
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee and mascarpone",
    price: 9.5,
    category: "desserts",
    image: "/placeholder.svg?height=100&width=100",
    available: false,
    preparationTime: 5,
    allergens: ["gluten", "dairy", "eggs"],
    popular: true,
  },
  {
    id: "4",
    name: "House Wine Red",
    description: "Local Merlot, glass",
    price: 8.5,
    category: "drinks",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 2,
    allergens: ["sulfites"],
    popular: false,
  },
  {
    id: "5",
    name: "Spaghetti Carbonara",
    description: "Pancetta, egg, parmesan, black pepper",
    price: 19.5,
    category: "mains",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 12,
    allergens: ["gluten", "dairy", "eggs"],
    popular: true,
  },
  {
    id: "6",
    name: "Bruschetta",
    description: "Toasted bread with tomatoes, garlic, and basil",
    price: 12.0,
    category: "starters",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 7,
    allergens: ["gluten"],
    popular: false,
  },
  {
    id: "7",
    name: "Chocolate Fondant",
    description:
      "Warm chocolate cake with molten center, served with vanilla ice cream",
    price: 11.0,
    category: "desserts",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 15,
    allergens: ["gluten", "dairy", "eggs"],
    popular: true,
  },
  {
    id: "8",
    name: "Sparkling Water",
    description: "500ml bottle",
    price: 4.5,
    category: "drinks",
    image: "/placeholder.svg?height=100&width=100",
    available: true,
    preparationTime: 1,
    allergens: [],
    popular: false,
  },
];

const categories = [
  { id: "all", name: "All Items", count: mockMenuItems.length },
  {
    id: "starters",
    name: "Starters",
    count: mockMenuItems.filter((item) => item.category === "starters").length,
  },
  {
    id: "mains",
    name: "Mains",
    count: mockMenuItems.filter((item) => item.category === "mains").length,
  },
  {
    id: "desserts",
    name: "Desserts",
    count: mockMenuItems.filter((item) => item.category === "desserts").length,
  },
  {
    id: "drinks",
    name: "Drinks",
    count: mockMenuItems.filter((item) => item.category === "drinks").length,
  },
];

const allergenOptions = [
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "nuts", label: "Nuts" },
  { value: "soy", label: "Soy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "sulfites", label: "Sulfites" },
];

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparationTime: number;
  available: boolean;
  allergens: string[];
  popular: boolean;
  image: string;
}

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  viewMode?: "grid" | "list";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showUnavailable, setShowUnavailable] = useState(true);
  const { currency } = useRestaurantSettings();
  const {
    categories: menuCategories,
    allergens: menuAllergens,
    addCategory,
    addAllergen,
  } = useMenuSettings();

  const filteredItems = mockMenuItems
    .filter((item) => {
      // Filter by category
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;

      // Filter by search term
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by availability
      const matchesAvailability = showUnavailable ? true : item.available;

      return matchesCategory && matchesSearch && matchesAvailability;
    })
    .sort((a, b) => {
      // Sort by availability first, then by name
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const MenuItemForm = ({
    item,
    onClose,
  }: {
    item?: any;
    onClose: () => void;
  }) => {
    const { currency } = useRestaurantSettings();
    const { categories, allergens, addCategory, addAllergen } =
      useMenuSettings();
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingAllergen, setIsAddingAllergen] = useState(false);
    const [newCategory, setNewCategory] = useState({
      name: "",
      description: "",
    });
    const [newAllergen, setNewAllergen] = useState({ name: "" });
    const [activeTab, setActiveTab] = useState("basic");

    const [formData, setFormData] = useState({
      name: "",
      description: "",
      price: "",
      category: categories[0]?.id || "",
      preparationTime: "",
      available: true,
      allergens: [] as string[],
      popular: false,
      image: "",
    });

    useEffect(() => {
      if (item) {
        setFormData({
          name: item.name || "",
          description: item.description || "",
          price: item.price?.toString() || "",
          category: item.category || categories[0]?.id || "",
          preparationTime: item.preparationTime?.toString() || "",
          available: item.available ?? true,
          allergens: item.allergens || [],
          popular: item.popular || false,
          image: item.image || "",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          category: categories[0]?.id || "",
          preparationTime: "",
          available: true,
          allergens: [],
          popular: false,
          image: "",
        });
      }
    }, [item, categories]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File size exceeds 5MB limit");
          return;
        }
        toast.success("Image uploaded successfully");
        // Image handling will be implemented later
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } =
      useDropzone({
        onDrop,
        accept: ACCEPTED_IMAGE_TYPES,
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE,
      });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Form submitted:", formData);

      // Show success message
      toast.success(
        item
          ? "Menu item updated successfully!"
          : "Menu item added successfully!"
      );

      onClose();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic" className="text-sm">
              <FileText className="w-4 h-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="details" className="text-sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="image" className="text-sm">
              <Image className="w-4 h-4 mr-2" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name*
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Margherita Pizza"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your dish..."
                  className="h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price ({currency.value})*
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="price"
                      type="number"
                      step="0.50"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="preparationTime"
                    className="text-sm font-medium"
                  >
                    Preparation Time (min)*
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="preparationTime"
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preparationTime: e.target.value,
                        })
                      }
                      placeholder="15"
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category*</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(true)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {isAddingCategory ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Category description (optional)"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newCategory.name) {
                            addCategory(newCategory);
                            setNewCategory({ name: "", description: "" });
                          }
                          setIsAddingCategory(false);
                        }}
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingCategory(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Allergens</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingAllergen(true)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </div>
                {isAddingAllergen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      placeholder="Allergen name"
                      value={newAllergen.name}
                      onChange={(e) =>
                        setNewAllergen({ ...newAllergen, name: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newAllergen.name) {
                            addAllergen(newAllergen);
                            setNewAllergen({ name: "" });
                          }
                          setIsAddingAllergen(false);
                        }}
                        className="flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingAllergen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <ScrollArea className="h-32 rounded-md border">
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {allergens.map((allergen) => (
                        <div
                          key={allergen.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`allergen-${allergen.id}`}
                            checked={formData.allergens.includes(allergen.id)}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                allergens: checked
                                  ? [...formData.allergens, allergen.id]
                                  : formData.allergens.filter(
                                      (id) => id !== allergen.id
                                    ),
                              });
                            }}
                          />
                          <Label
                            htmlFor={`allergen-${allergen.id}`}
                            className="text-sm font-normal"
                          >
                            {allergen.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Available</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle if this item is currently available
                    </p>
                  </div>
                  <Switch
                    checked={formData.available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, available: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Popular</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark this item as popular to highlight it
                    </p>
                  </div>
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, popular: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Item Image</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a high-quality image of your dish
                  </p>
                </div>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                  "hover:bg-accent/50 hover:border-accent-foreground/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  {
                    "border-green-500 bg-green-50":
                      isDragActive && !isDragReject,
                    "border-red-500 bg-red-50": isDragReject,
                    "border-gray-200": !isDragActive && !isDragReject,
                  }
                )}
              >
                <input {...getInputProps()} />

                <div className="p-8 space-y-4">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-full bg-green-50">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">
                        {isDragActive ? (
                          isDragReject ? (
                            <span className="text-red-600">
                              Invalid file type or size
                            </span>
                          ) : (
                            <span className="text-green-600">
                              Drop your image here
                            </span>
                          )
                        ) : (
                          <>
                            Drag and drop your image, or{" "}
                            <span className="text-green-600">browse</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: {bytesToSize(MAX_FILE_SIZE)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-4 px-6 mt-4 bg-accent/50 rounded-md">
                    <div className="text-center">
                      <p className="text-sm font-medium">File Types</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Dimensions</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min: 500x500px
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Aspect Ratio</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        1:1 (Square)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Tips for better food images:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use natural lighting when possible</li>
                  <li>Ensure the food is in focus</li>
                  <li>
                    Include any special garnishes or presentation elements
                  </li>
                  <li>Shoot from slightly above for best results</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            {item ? "Update" : "Add"} Item
          </Button>
        </div>
      </form>
    );
  };

  const MenuItemCard = ({
    item,
    onEdit,
    onDelete,
    viewMode = "grid",
  }: MenuItemCardProps) => {
    const { currency } = useRestaurantSettings();
    const { categories, allergens } = useMenuSettings();

    const category = categories.find((c) => c.id === item.category);
    const itemAllergens = allergens.filter((a) =>
      item.allergens.includes(a.id)
    );

    if (viewMode === "grid") {
      return (
        <Card
          className={cn(
            "group overflow-hidden transition-all duration-300 hover:shadow-lg border-0",
            !item.available && "opacity-75"
          )}
        >
          <div className="relative aspect-[4/3]">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {item.popular && (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                  Popular
                </Badge>
              )}
              <Badge
                variant={item.available ? "default" : "secondary"}
                className={cn(
                  item.available &&
                    "bg-green-500 hover:bg-green-600 text-white border-none",
                  !item.available &&
                    "bg-gray-500 hover:bg-gray-600 text-white border-none"
                )}
              >
                {item.available ? "Available" : "Unavailable"}
              </Badge>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(item)}
                className="bg-white hover:bg-gray-100 h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDelete(item)}
                className="bg-white hover:bg-gray-100 h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="font-bold text-lg text-green-600 whitespace-nowrap">
                    {currency.symbol}
                    {item.price.toFixed(2)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-gray-50/50">
                    {category?.name || item.category}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.preparationTime} min</span>
                  </div>
                </div>

                {itemAllergens.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {itemAllergens.map((allergen) => (
                      <Badge
                        key={allergen.id}
                        variant="outline"
                        className="bg-amber-50/50 text-amber-700 border-amber-200/70 text-[11px] px-1.5 py-0"
                      >
                        {allergen.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        className={cn(
          "group transition-all duration-300 hover:shadow-lg border border-gray-200/80",
          !item.available && "opacity-75"
        )}
      >
        <CardContent className="p-4">
          <div className="flex gap-5">
            <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex gap-1.5">
                      {item.popular && (
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">
                          Popular
                        </Badge>
                      )}
                      <Badge
                        variant={item.available ? "default" : "secondary"}
                        className={cn(
                          item.available &&
                            "bg-green-500 hover:bg-green-600 text-white border-none",
                          !item.available &&
                            "bg-gray-500 hover:bg-gray-600 text-white border-none"
                        )}
                      >
                        {item.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2.5">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline" className="bg-gray-50/50">
                        {category?.name || item.category}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.preparationTime} min</span>
                      </div>
                    </div>

                    {itemAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {itemAllergens.map((allergen) => (
                          <Badge
                            key={allergen.id}
                            variant="outline"
                            className="bg-amber-50/50 text-amber-700 border-amber-200/70 text-[11px] px-1.5 py-0"
                          >
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-6">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="font-bold text-2xl text-green-600">
                    {currency.symbol}
                    {item.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's menu items and categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your menu with details and pricing
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alert for unavailable items */}
      {mockMenuItems.some((item) => !item.available) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unavailable Items</AlertTitle>
          <AlertDescription>
            Some menu items are marked as unavailable and won't be shown to
            customers.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search through menu items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative col-span-full lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode & Reset */}
            <div className="flex gap-2">
              <Select
                value={viewMode}
                onValueChange={(value: "grid" | "list") => setViewMode(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="View Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="grid">Grid View</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("all");
                  setShowUnavailable(true);
                }}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showUnavailable ? "default" : "outline"}
              onClick={() => setShowUnavailable(!showUnavailable)}
              className={`flex-1 md:flex-none ${
                showUnavailable ? "bg-green-600 hover:bg-green-700" : ""
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Show Unavailable
            </Button>
            {categories.slice(1).map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-1 md:flex-none ${
                  activeCategory === category.id
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }`}
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        }
      >
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MenuItemCard
                item={item}
                onEdit={(editedItem: MenuItem) => setEditingItem(editedItem)}
                onDelete={(deletedItem: MenuItem) =>
                  setDeleteConfirmItem(deletedItem)
                }
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Search className="w-12 h-12 text-gray-400" />
                <h3 className="font-semibold text-lg">No menu items found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search or filters"
                    : `No ${
                        activeCategory === "all" ? "" : activeCategory
                      } items available`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this menu item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <MenuItemForm
              item={editingItem}
              onClose={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteConfirmItem && (
            <>
              <div className="py-4">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{deleteConfirmItem.name}</strong>?
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    console.log(`Deleting item ${deleteConfirmItem.id}`);
                    toast.success(
                      `Menu item "${deleteConfirmItem.name}" deleted successfully!`
                    );
                    setDeleteConfirmItem(null);
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
