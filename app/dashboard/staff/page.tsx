"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  Download,
  Settings,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock staff data
const mockStaff = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@bellavista.com",
    phone: "+41 79 123 4567",
    role: "manager",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-01-15",
    lastLogin: "2024-01-15 14:30",
    permissions: ["orders", "menu", "staff", "analytics", "settings"],
    shift: "morning",
    hourlyRate: 28.5,
  },
  {
    id: "2",
    name: "Marco Rossi",
    email: "marco.rossi@bellavista.com",
    phone: "+41 79 234 5678",
    role: "chef",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-03-20",
    lastLogin: "2024-01-15 12:15",
    permissions: ["kitchen", "menu"],
    shift: "evening",
    hourlyRate: 26.0,
  },
  {
    id: "3",
    name: "Emma Weber",
    email: "emma.weber@bellavista.com",
    phone: "+41 79 345 6789",
    role: "server",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-06-10",
    lastLogin: "2024-01-15 16:45",
    permissions: ["orders", "tables"],
    shift: "morning",
    hourlyRate: 22.0,
  },
  {
    id: "4",
    name: "Luca Müller",
    email: "luca.mueller@bellavista.com",
    phone: "+41 79 456 7890",
    role: "server",
    status: "inactive",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-08-05",
    lastLogin: "2024-01-10 18:20",
    permissions: ["orders", "tables"],
    shift: "evening",
    hourlyRate: 22.0,
  },
  {
    id: "5",
    name: "Anna Schmidt",
    email: "anna.schmidt@bellavista.com",
    phone: "+41 79 567 8901",
    role: "cashier",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-09-12",
    lastLogin: "2024-01-15 11:30",
    permissions: ["orders", "payments"],
    shift: "morning",
    hourlyRate: 24.0,
  },
]

const roles = [
  { value: "owner", label: "Owner", icon: Crown, color: "text-purple-600" },
  { value: "manager", label: "Manager", icon: ShieldCheck, color: "text-blue-600" },
  { value: "chef", label: "Chef", icon: Shield, color: "text-orange-600" },
  { value: "server", label: "Server", icon: Shield, color: "text-green-600" },
  { value: "cashier", label: "Cashier", icon: Shield, color: "text-gray-600" },
]

const permissions = [
  { value: "orders", label: "Orders Management" },
  { value: "menu", label: "Menu Management" },
  { value: "tables", label: "Tables & QR" },
  { value: "kitchen", label: "Kitchen Display" },
  { value: "staff", label: "Staff Management" },
  { value: "analytics", label: "Analytics" },
  { value: "payments", label: "Payments" },
  { value: "settings", label: "Settings" },
]

const shifts = [
  { value: "morning", label: "Morning (6:00 - 14:00)" },
  { value: "afternoon", label: "Afternoon (14:00 - 22:00)" },
  { value: "evening", label: "Evening (18:00 - 02:00)" },
  { value: "night", label: "Night (22:00 - 06:00)" },
  { value: "flexible", label: "Flexible" },
]

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<any>(null)
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredStaff = mockStaff
    .filter((staff) => {
      // Filter by search term
      const matchesSearch =
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by role
      const matchesRole = filterRole === "all" || staff.role === filterRole

      // Filter by status
      const matchesStatus = filterStatus === "all" || staff.status === filterStatus

      // Filter by tab
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && staff.status === "active") ||
        (activeTab === "inactive" && staff.status === "inactive")

      return matchesSearch && matchesRole && matchesStatus && matchesTab
    })
    .sort((a, b) => {
      // Sort by status first (active first), then by name
      if (a.status !== b.status) {
        return a.status === "active" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

  const getRoleIcon = (role: string) => {
    const roleData = roles.find((r) => r.value === role)
    return roleData ? roleData.icon : Shield
  }

  const getRoleColor = (role: string) => {
    const roleData = roles.find((r) => r.value === role)
    return roleData ? roleData.color : "text-gray-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const StaffForm = ({ staff, onClose }: { staff?: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: staff?.name || "",
      email: staff?.email || "",
      phone: staff?.phone || "",
      role: staff?.role || "server",
      status: staff?.status || "active",
      permissions: staff?.permissions || [],
      shift: staff?.shift || "morning",
      hourlyRate: staff?.hourlyRate?.toString() || "",
    })

    useEffect(() => {
      if (staff) {
        setFormData({
          name: staff.name || "",
          email: staff.email || "",
          phone: staff.phone || "",
          role: staff.role || "server",
          status: staff.status || "active",
          permissions: staff.permissions || [],
          shift: staff.shift || "morning",
          hourlyRate: staff.hourlyRate?.toString() || "",
        })
      }
    }, [staff])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      console.log("Staff form submitted:", formData)

      // Show success message
      alert("Staff member added successfully!")

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "server",
        status: "active",
        permissions: [],
        shift: "morning",
        hourlyRate: "",
      })
      onClose()
    }

    const togglePermission = (permission: string) => {
      setFormData({
        ...formData,
        permissions: formData.permissions.includes(permission)
          ? formData.permissions.filter((p) => p !== permission)
          : [...formData.permissions, permission],
      })
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Personal info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+41 79 123 4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role*</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className={`w-4 h-4 ${role.color}`} />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift">Shift</Label>
                <Select value={formData.shift} onValueChange={(value) => setFormData({ ...formData, shift: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (CHF)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.50"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="25.00"
                />
              </div>
            </div>
          </div>

          {/* Right column - Permissions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.value} className="flex items-center space-x-2">
                    <Switch
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={() => togglePermission(permission.value)}
                    />
                    <Label htmlFor={permission.value} className="text-sm">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">Select the areas this staff member can access</p>
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
            {staff ? "Update Staff Member" : "Add Staff Member"}
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">Manage your restaurant team and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <StaffForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{mockStaff.length}</div>
            <div className="text-sm text-gray-500">Total Staff</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockStaff.filter((s) => s.status === "active").length}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockStaff.filter((s) => s.role === "manager").length}
            </div>
            <div className="text-sm text-gray-500">Managers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {mockStaff.filter((s) => s.role === "server").length}
            </div>
            <div className="text-sm text-gray-500">Servers</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Staff
            <Badge variant="secondary" className="ml-2">
              {mockStaff.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {mockStaff.filter((s) => s.status === "active").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive
            <Badge variant="secondary" className="ml-2">
              {mockStaff.filter((s) => s.status === "inactive").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Staff Grid */}
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredStaff.map((staff, index) => {
                const RoleIcon = getRoleIcon(staff.role)
                return (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className={`transition-all hover:shadow-md ${staff.status === "inactive" ? "opacity-60" : ""}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {staff.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                                  <Badge className={getStatusColor(staff.status)}>{staff.status}</Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <RoleIcon className={`w-4 h-4 ${getRoleColor(staff.role)}`} />
                                  <span className="text-sm text-gray-600 capitalize">{staff.role}</span>
                                  <Separator orientation="vertical" className="h-4" />
                                  <span className="text-sm text-gray-500">{staff.shift}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {staff.email}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {staff.phone}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Joined {new Date(staff.joinDate).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Last login {staff.lastLogin}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-lg text-gray-900">CHF {staff.hourlyRate}/hr</div>
                                <div className="text-sm text-gray-500">{staff.permissions.length} permissions</div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <Dialog
                              open={editingStaff?.id === staff.id}
                              onOpenChange={(open) => !open && setEditingStaff(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingStaff(staff)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Staff Member</DialogTitle>
                                </DialogHeader>
                                <StaffForm staff={editingStaff} onClose={() => setEditingStaff(null)} />
                              </DialogContent>
                            </Dialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteConfirmStaff(staff)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No staff members found</div>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmStaff !== null} onOpenChange={(open) => !open && setDeleteConfirmStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Warning</AlertTitle>
              <AlertDescription className="text-red-700">
                Are you sure you want to remove <strong>{deleteConfirmStaff?.name}</strong> from your staff? This will
                revoke all their access permissions.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmStaff(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                console.log(`Removing staff member ${deleteConfirmStaff?.id}`)
                setDeleteConfirmStaff(null)
              }}
            >
              Remove Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
