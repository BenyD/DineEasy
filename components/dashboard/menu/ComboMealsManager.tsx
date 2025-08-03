"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Percent,
  Coffee,
  Utensils,
  IceCream,
  ChefHat,
  X,
  Check,
  AlertTriangle,
  Wifi,
  WifiOff,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { type ComboMeal, type MenuItem } from "@/types";
import { cn } from "@/lib/utils";

interface ComboMealsManagerProps {
  restaurantId: string;
  menuItems: MenuItem[];
  currencySymbol: string;
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
}

interface ComboMealItem {
  id?: string;
  menuItemId: string;
  itemType: "main" | "side" | "drink" | "dessert";
  isRequired: boolean;
  isCustomizable: boolean;
  sortOrder: number;
  menuItem?: MenuItem;
}

interface ComboMealOption {
  id?: string;
  menuItemId: string;
  optionType: "substitution" | "addition";
  isDefault: boolean;
  sortOrder: number;
  menuItem?: MenuItem;
}

interface NewComboMeal {
  name: string;
  description: string;
  basePrice: number;
  discountPercentage: number;
  isAvailable: boolean;
  items: ComboMealItem[];
}

export function ComboMealsManager({
  restaurantId,
  menuItems,
  currencySymbol,
  showAddDialog,
  setShowAddDialog,
}: ComboMealsManagerProps) {
  const [comboMeals, setComboMeals] = useState<ComboMeal[]>([]);
  const [editingCombo, setEditingCombo] = useState<ComboMeal | null>(null);
  const [newCombo, setNewCombo] = useState<NewComboMeal>({
    name: "",
    description: "",
    basePrice: 0,
    discountPercentage: 0,
    isAvailable: true,
    items: [],
  });
  const [selectedItems, setSelectedItems] = useState<ComboMealItem[]>([]);
  const [showInlineItemSelector, setShowInlineItemSelector] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");

  // Load combo meals
  useEffect(() => {
    loadComboMeals();
  }, [restaurantId]);

  const loadComboMeals = async () => {
    try {
      const response = await fetch(
        `/api/combo-meals?restaurantId=${restaurantId}`
      );
      const data = await response.json();

      if (response.ok) {
        setComboMeals(data.comboMeals || []);
      } else {
        throw new Error(data.error || "Failed to load combo meals");
      }
    } catch (error) {
      console.error("Error loading combo meals:", error);
      toast.error("Failed to load combo meals");
    }
  };

  const handleAddCombo = async () => {
    try {
      if (!newCombo.name.trim()) {
        toast.error("Combo name is required");
        return;
      }

      if (newCombo.basePrice <= 0) {
        toast.error("Base price must be greater than 0");
        return;
      }

      const response = await fetch("/api/combo-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCombo,
          restaurantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create combo meal");
      }

      toast.success("Combo meal created successfully");
      setShowAddDialog(false);
      resetNewCombo();
      loadComboMeals();
    } catch (error) {
      console.error("Error creating combo meal:", error);
      toast.error("Failed to create combo meal");
    }
  };

  const handleUpdateCombo = async () => {
    if (!editingCombo) return;

    try {
      const response = await fetch(`/api/combo-meals/${editingCombo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCombo,
          restaurantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update combo meal");
      }

      toast.success("Combo meal updated successfully");
      setEditingCombo(null);
      setShowAddDialog(false);
      resetNewCombo();
      loadComboMeals();
    } catch (error) {
      console.error("Error updating combo meal:", error);
      toast.error("Failed to update combo meal");
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    try {
      const response = await fetch(`/api/combo-meals/${comboId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete combo meal");
      }

      toast.success("Combo meal deleted successfully");
      loadComboMeals();
    } catch (error) {
      console.error("Error deleting combo meal:", error);
      toast.error("Failed to delete combo meal");
    }
  };

  const resetNewCombo = () => {
    setNewCombo({
      name: "",
      description: "",
      basePrice: 0,
      discountPercentage: 0,
      isAvailable: true,
      items: [],
    });
    setSelectedItems([]);
    setShowInlineItemSelector(false);
    setItemSearchTerm("");
  };

  const handleEditCombo = (combo: ComboMeal) => {
    setEditingCombo(combo);
    setNewCombo({
      name: combo.name,
      description: combo.description || "",
      basePrice: combo.basePrice,
      discountPercentage: combo.discountPercentage || 0,
      isAvailable: combo.isAvailable,
      items: combo.items || [],
    });
    setSelectedItems(combo.items || []);
    setShowAddDialog(true);
  };

  const handleRemoveItem = (index: number) => {
    setNewCombo((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    toast.success("Item removed from combo");
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case "main":
        return <ChefHat className="w-4 h-4" />;
      case "side":
        return <Utensils className="w-4 h-4" />;
      case "drink":
        return <Coffee className="w-4 h-4" />;
      case "dessert":
        return <IceCream className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "main":
        return "bg-orange-100 text-orange-800";
      case "side":
        return "bg-green-100 text-green-800";
      case "drink":
        return "bg-blue-100 text-blue-800";
      case "dessert":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateDiscountedPrice = (
    basePrice: number,
    discountPercentage: number
  ) => {
    return basePrice * (1 - discountPercentage / 100);
  };

  return (
    <div className="space-y-6">
      {comboMeals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Combo Meals
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first combo meal to offer customers great value deals
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Combo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comboMeals.map((combo) => (
            <Card key={combo.id} className="overflow-hidden">
              {combo.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={combo.imageUrl}
                    alt={combo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{combo.name}</CardTitle>
                    {combo.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {combo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCombo(combo)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCombo(combo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {currencySymbol}
                      {combo.discountPercentage > 0
                        ? calculateDiscountedPrice(
                            combo.basePrice,
                            combo.discountPercentage
                          ).toFixed(2)
                        : combo.basePrice.toFixed(2)}
                    </span>
                    {combo.discountPercentage > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {currencySymbol}
                        {combo.basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {combo.discountPercentage > 0 && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Percent className="w-3 h-3" />
                      {combo.discountPercentage}% OFF
                    </Badge>
                  )}
                </div>

                {combo.items && combo.items.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="space-y-1">
                      {combo.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Badge className={getItemTypeColor(item.itemType)}>
                            {getItemTypeIcon(item.itemType)}
                            {item.itemType}
                          </Badge>
                          <span className="text-gray-700">
                            {item.menuItem?.name || "Unknown Item"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge
                    variant={combo.isAvailable ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {combo.isAvailable ? (
                      <>
                        <Check className="w-3 h-3" />
                        Available
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Unavailable
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? "Edit Combo Meal" : "Add New Combo Meal"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Combo Name *
                </Label>
                <Input
                  id="name"
                  value={newCombo.name}
                  onChange={(e) =>
                    setNewCombo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Classic Burger Combo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="basePrice"
                  className="text-sm font-medium text-gray-700"
                >
                  Base Price *
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={newCombo.basePrice}
                  onChange={(e) =>
                    setNewCombo((prev) => ({
                      ...prev,
                      basePrice: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={newCombo.description}
                onChange={(e) =>
                  setNewCombo((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what's included in this combo..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="discount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Discount Percentage
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">How Discount Works</p>
                          <p className="text-sm">
                            This percentage is deducted from the base price to
                            create the final combo price.
                          </p>
                          <ul className="text-xs space-y-1">
                            <li>• 0% = No discount (full base price)</li>
                            <li>• 10% = 10% off the base price</li>
                            <li>
                              • Example: Base price {currencySymbol}15 with 20%
                              discount = Customer pays {currencySymbol}12
                            </li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={newCombo.discountPercentage}
                  onChange={(e) =>
                    setNewCombo((prev) => ({
                      ...prev,
                      discountPercentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={newCombo.isAvailable}
                  onCheckedChange={(checked) =>
                    setNewCombo((prev) => ({ ...prev, isAvailable: checked }))
                  }
                  className="data-[state=checked]:bg-green-600"
                />
                <Label
                  htmlFor="isAvailable"
                  className="text-sm font-medium text-gray-700"
                >
                  Available for Order
                </Label>
              </div>
            </div>

            {/* Price Preview */}
            {newCombo.discountPercentage > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Original Price:</span>
                  <span className="text-sm text-gray-500 line-through">
                    {currencySymbol}
                    {newCombo.basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    Discounted Price:
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {currencySymbol}
                    {calculateDiscountedPrice(
                      newCombo.basePrice,
                      newCombo.discountPercentage
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">You Save:</span>
                  <span className="text-sm font-medium text-green-600">
                    {currencySymbol}
                    {(
                      (newCombo.basePrice * newCombo.discountPercentage) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Combo Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Combo Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowInlineItemSelector(!showInlineItemSelector)
                  }
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  {showInlineItemSelector ? (
                    <ChevronUp className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {showInlineItemSelector ? "Hide Item Selector" : "Add Items"}
                </Button>
              </div>

              {newCombo.items.length === 0 && !showInlineItemSelector ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No items added yet</p>
                  <p className="text-xs text-gray-400">
                    Click &quot;Add Items&quot; to get started
                  </p>
                </div>
              ) : (
                newCombo.items.length > 0 && (
                  <div className="space-y-2">
                    {newCombo.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={getItemTypeColor(item.itemType)}>
                            {getItemTypeIcon(item.itemType)}
                            {item.itemType}
                          </Badge>
                          <span className="font-medium">
                            {item.menuItem?.name || "Unknown Item"}
                          </span>
                          {item.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Inline Item Selector */}
            {showInlineItemSelector && (
              <div className="space-y-4 border-t pt-6 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Select Menu Items
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search items..."
                        value={itemSearchTerm}
                        onChange={(e) => setItemSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    {selectedItems.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setNewCombo((prev) => ({
                            ...prev,
                            items: [...prev.items, ...selectedItems],
                          }));
                          setSelectedItems([]);
                          setShowInlineItemSelector(false);
                          toast.success(
                            `Added ${selectedItems.length} item(s) to combo`
                          );
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add Selected ({selectedItems.length})
                      </Button>
                    )}
                  </div>
                </div>

                {menuItems.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Menu Items Available
                    </h3>
                    <p className="text-gray-600">
                      Create some menu items first before adding them to combo
                      meals.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {menuItems
                      .filter(
                        (item) =>
                          item.name
                            .toLowerCase()
                            .includes(itemSearchTerm.toLowerCase()) ||
                          item.description
                            ?.toLowerCase()
                            .includes(itemSearchTerm.toLowerCase())
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group",
                            selectedItems.some(
                              (selected) => selected.menuItemId === item.id
                            )
                              ? "border-green-500 bg-green-50 shadow-sm"
                              : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
                          )}
                          onClick={() => {
                            const isSelected = selectedItems.some(
                              (selected) => selected.menuItemId === item.id
                            );
                            if (isSelected) {
                              setSelectedItems((prev) =>
                                prev.filter(
                                  (selected) => selected.menuItemId !== item.id
                                )
                              );
                            } else {
                              setSelectedItems((prev) => [
                                ...prev,
                                {
                                  menuItemId: item.id,
                                  itemType: "main",
                                  isRequired: true,
                                  isCustomizable: false,
                                  sortOrder: prev.length,
                                  menuItem: item,
                                },
                              ]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Selection indicator */}
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200">
                              {selectedItems.some(
                                (selected) => selected.menuItemId === item.id
                              ) ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-in zoom-in-50 duration-200" />
                              ) : (
                                <div className="w-3 h-3 bg-transparent rounded-full" />
                              )}
                            </div>

                            {/* Item info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {item.name}
                                </h4>
                                {item.popular && (
                                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                    ⭐ Popular
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-medium bg-white border-green-200 text-green-700"
                                >
                                  {currencySymbol}
                                  {item.price}
                                </Badge>

                                {item.preparationTime > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-50 border-orange-200 text-orange-700"
                                  >
                                    ⏱ {item.preparationTime}m
                                  </Badge>
                                )}

                                {item.hasAdvancedOptions && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    ⚙️ Customizable
                                  </Badge>
                                )}

                                {item.tags && item.tags.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                                  >
                                    {item.tags[0].charAt(0).toUpperCase() +
                                      item.tags[0].slice(1).toLowerCase()}
                                    {item.tags.length > 1 &&
                                      ` +${item.tags.length - 1}`}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Check icon for selected items */}
                          {selectedItems.some(
                            (selected) => selected.menuItemId === item.id
                          ) && (
                            <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full ml-3 animate-in zoom-in-50 duration-200">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingCombo(null);
                resetNewCombo();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingCombo ? handleUpdateCombo : handleAddCombo}
              disabled={!newCombo.name.trim() || newCombo.basePrice <= 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {editingCombo ? "Update Combo" : "Create Combo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
