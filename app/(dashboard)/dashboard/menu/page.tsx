"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    description: "Warm chocolate cake with molten center, served with vanilla ice cream",
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
]

const categories = [
  { id: "all", name: "All Items", count: mockMenuItems.length },
  { id: "starters", name: "Starters", count: mockMenuItems.filter((item) => item.category === "starters").length },
  { id: "mains", name: "Mains", count: mockMenuItems.filter((item) => item.category === "mains").length },
  { id: "desserts", name: "Desserts", count: mockMenuItems.filter((item) => item.category === "desserts").length },
  { id: "drinks", name: "Drinks", count: mockMenuItems.filter((item) => item.category === "drinks").length },
]

const allergenOptions = [
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "nuts", label: "Nuts" },
  { value: "soy", label: "Soy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "sulfites", label: "Sulfites" },
]

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [showUnavailable, setShowUnavailable] = useState(true)

  const filteredItems = mockMenuItems
    .filter((item) => {
      // Filter by category
      const matchesCategory = activeCategory === "all" || item.category === activeCategory

      // Filter by search term
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by availability
      const matchesAvailability = showUnavailable ? true : item.available

      return matchesCategory && matchesSearch && matchesAvailability
    })
    .sort((a, b) => {
      // Sort by availability first, then by name
      if (a.available !== b.available) {
        return a.available ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

  const MenuItemForm = ({ item, onClose }: { item?: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      price: "",
      category: "starters",
      preparationTime: "",
      available: true,
      allergens: [] as string[],
      popular: false,
      image: "/placeholder.svg?height=100&width=100",
    })

    // Reset form when dialog opens/closes or when item changes
    useEffect(() => {
      if (item) {
        setFormData({
          name: item.name || "",
          description: item.description || "",
          price: item.price?.toString() || "",
          category: item.category || "starters",
          preparationTime: item.preparationTime?.toString() || "",
          available: item.available ?? true,
          allergens: item.allergens || [],
          popular: item.popular || false,
          image: item.image || "/placeholder.svg?height=100&width=100",
        })
      } else {
        // Reset form for new item
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "starters",
          preparationTime: "",
          available: true,
          allergens: [],
          popular: false,
          image: "/placeholder.svg?height=100&width=100",
        })
      }
    }, [item])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      // Create the new/updated item
      const itemData = {
        id: item?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price) || 0,
        category: formData.category,
        preparationTime: Number.parseInt(formData.preparationTime) || 0,
        available: formData.available,
        allergens: formData.allergens,
        popular: formData.popular,
        image: formData.image,
      }

      if (item) {
        console.log("Updating menu item:", itemData)
        // Here you would update the item in your state/database
      } else {
        console.log("Adding new menu item:", itemData)
        // Here you would add the item to your state/database
      }

      // Show success message
      alert(item ? "Menu item updated successfully!" : "Menu item added successfully!")

      onClose()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - Basic info */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the item..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (CHF)*</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="price"
                    type="number"
                    step="0.50"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category*</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starters">Starters</SelectItem>
                    <SelectItem value="mains">Mains</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="prepTime"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    placeholder="15"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allergens</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>{formData.allergens.length ? `${formData.allergens.length} selected` : "None"}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Allergens</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allergenOptions.map((allergen) => (
                      <DropdownMenuItem
                        key={allergen.value}
                        className="flex items-center gap-2"
                        onSelect={(e) => {
                          e.preventDefault()
                          setFormData({
                            ...formData,
                            allergens: formData.allergens.includes(allergen.value)
                              ? formData.allergens.filter((a) => a !== allergen.value)
                              : [...formData.allergens, allergen.value],
                          })
                        }}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                          {formData.allergens.includes(allergen.value) ? "✓" : ""}
                        </div>
                        <span>{allergen.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                />
                <Label htmlFor="available">Available for ordering</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                />
                <Label htmlFor="popular">Mark as popular item</Label>
              </div>
            </div>
          </div>

          {/* Right column - Image */}
          <div className="md:w-1/3 space-y-4">
            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="border rounded-md p-2 flex flex-col items-center justify-center">
                <div className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden mb-3">
                  <img
                    src={formData.image || "/placeholder.svg"}
                    alt="Menu item preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button type="button" variant="outline" className="w-full">
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              <p className="text-xs text-gray-500">Recommended: 500x500px, JPG or PNG</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {item ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500">Manage your restaurant's menu items and categories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
              </DialogHeader>
              <MenuItemForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Tag className="w-4 h-4 mr-2" />
                Manage Categories
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ImagePlus className="w-4 h-4 mr-2" />
                Bulk Upload
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                Preview Menu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alert for unavailable items */}
      {mockMenuItems.some((item) => !item.available) && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Unavailable Items</AlertTitle>
          <AlertDescription className="text-amber-700">
            Some menu items are marked as unavailable and won't be shown to customers.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="show-unavailable" checked={showUnavailable} onCheckedChange={setShowUnavailable} />
                      <Label htmlFor="show-unavailable">Show unavailable items</Label>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSearchTerm("")}>Clear Filters</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-none px-3 ${viewMode === "list" ? "bg-gray-200 hover:bg-gray-200" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
                <Separator orientation="vertical" className="h-full" />
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-none px-3 ${viewMode === "grid" ? "bg-gray-200 hover:bg-gray-200" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs sm:text-sm">
              {category.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* Menu Items Grid or List */}
          {viewMode === "list" ? (
            <div className="grid gap-4">
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`transition-all hover:shadow-md ${!item.available ? "opacity-60" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                  {item.popular && (
                                    <Badge className="bg-orange-100 text-orange-800 text-xs">Popular</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                  <span className="text-xs text-gray-400">{item.preparationTime} min</span>
                                  {item.allergens.length > 0 && (
                                    <span className="text-xs text-amber-600">{item.allergens.join(", ")}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-lg text-gray-900">CHF {item.price.toFixed(2)}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  {item.available ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className={`text-xs ${item.available ? "text-green-600" : "text-gray-400"}`}>
                                    {item.available ? "Available" : "Unavailable"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Dialog
                              open={editingItem?.id === item.id}
                              onOpenChange={(open) => !open && setEditingItem(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Menu Item</DialogTitle>
                                </DialogHeader>
                                <MenuItemForm item={editingItem} onClose={() => setEditingItem(null)} />
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={deleteConfirmItem?.id === item.id}
                              onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setDeleteConfirmItem(item)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Menu Item</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                  <p>
                                    Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be
                                    undone.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteConfirmItem(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      console.log(`Deleting item ${item.id}`)
                                      alert(`Menu item "${item.name}" deleted successfully!`)
                                      setDeleteConfirmItem(null)
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`h-full flex flex-col ${!item.available ? "opacity-60" : ""}`}>
                      <div className="relative w-full aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.popular && (
                          <Badge className="absolute top-2 left-2 bg-orange-100 text-orange-800 text-xs">Popular</Badge>
                        )}
                        <div className="absolute top-2 right-2">
                          {item.available ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span className="text-xs text-gray-400">{item.preparationTime} min</span>
                          </div>
                          {item.allergens.length > 0 && (
                            <p className="text-xs text-amber-600 mb-2">{item.allergens.join(", ")}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="font-bold text-lg text-gray-900">CHF {item.price.toFixed(2)}</div>
                          <div className="flex gap-1">
                            <Dialog
                              open={editingItem?.id === item.id}
                              onOpenChange={(open) => !open && setEditingItem(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Menu Item</DialogTitle>
                                </DialogHeader>
                                <MenuItemForm item={editingItem} onClose={() => setEditingItem(null)} />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteConfirmItem(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No menu items found</div>
              <p className="text-sm text-gray-500">
                {activeCategory === "all" ? "No items match your search" : `No ${activeCategory} items found`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
