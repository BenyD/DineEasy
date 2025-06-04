"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, QrCode, Download, RefreshCw, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Mock table data
const mockTables = [
  { id: "1", number: "1", capacity: 4, qrCode: "/placeholder.svg?height=120&width=120", status: "available" },
  { id: "2", number: "2", capacity: 2, qrCode: "/placeholder.svg?height=120&width=120", status: "occupied" },
  { id: "3", number: "3", capacity: 6, qrCode: "/placeholder.svg?height=120&width=120", status: "available" },
  { id: "4", number: "4", capacity: 4, qrCode: "/placeholder.svg?height=120&width=120", status: "reserved" },
  { id: "5", number: "5", capacity: 8, qrCode: "/placeholder.svg?height=120&width=120", status: "available" },
]

export default function TablesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<any>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const TableForm = ({ table, onClose }: { table?: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      number: table?.number || "",
      capacity: table?.capacity?.toString() || "",
    })

    useEffect(() => {
      if (table) {
        setFormData({
          number: table.number || "",
          capacity: table.capacity?.toString() || "",
        })
      }
    }, [table])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      // Create the new/updated table
      const tableData = {
        id: table?.id || Date.now().toString(),
        number: formData.number,
        capacity: Number.parseInt(formData.capacity),
        qrCode: `/placeholder.svg?height=120&width=120`,
        status: table?.status || "available",
      }

      if (table) {
        console.log("Updating table:", tableData)
        // Here you would update the table in your state/database
      } else {
        console.log("Adding new table:", tableData)
        // Here you would add the table to your state/database
      }

      // Show success message
      alert(table ? "Table updated successfully!" : "Table added successfully!")

      onClose()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Table Number</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="4"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {table ? "Update Table" : "Add Table"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables & QR Codes</h1>
          <p className="text-gray-500">Manage your restaurant tables and generate QR codes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download All QR
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <TableForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{mockTables.length}</div>
            <div className="text-sm text-gray-500">Total Tables</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockTables.filter((t) => t.status === "available").length}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {mockTables.filter((t) => t.status === "occupied").length}
            </div>
            <div className="text-sm text-gray-500">Occupied</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {mockTables.filter((t) => t.status === "reserved").length}
            </div>
            <div className="text-sm text-gray-500">Reserved</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockTables.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table {table.number}</CardTitle>
                  <Badge className={getStatusColor(table.status)}>{table.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">Capacity: {table.capacity} people</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                </div>

                {/* QR Code URL */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                    dineeasy.com/qr/table-{table.number}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => alert(`Downloading QR code for Table ${table.number}`)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => alert(`QR code regenerated for Table ${table.number}`)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Dialog open={editingTable?.id === table.id} onOpenChange={(open) => !open && setEditingTable(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingTable(table)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Table</DialogTitle>
                      </DialogHeader>
                      <TableForm table={editingTable} onClose={() => setEditingTable(null)} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete Table ${table.number}?`)) {
                        console.log(`Deleting table ${table.id}`)
                        alert(`Table ${table.number} deleted successfully!`)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
