"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TimeSlot {
  id: string
  slotId: string
  startTime: string
  endTime: string
  label: string
  isBreak: boolean
  order: number
  isActive: boolean
}

export default function TimeSlotSettingsPage() {
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null)

  const [formData, setFormData] = React.useState({
    slotId: "",
    startTime: "",
    endTime: "",
    label: "",
    isBreak: false,
    order: 0,
  })

  const fetchTimeSlots = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/time-slots")
      if (!response.ok) throw new Error("Failed to fetch time slots")
      const data = await response.json()
      setTimeSlots(data)
    } catch (error) {
      toast.error("Failed to load time slots")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTimeSlots()
  }, [fetchTimeSlots])

  const handleAdd = () => {
    setSelectedSlot(null)
    setFormData({
      slotId: "",
      startTime: "",
      endTime: "",
      label: "",
      isBreak: false,
      order: timeSlots.length + 1,
    })
    setDialogOpen(true)
  }

  const handleEdit = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setFormData({
      slotId: slot.slotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      isBreak: slot.isBreak,
      order: slot.order,
    })
    setDialogOpen(true)
  }

  const handleDelete = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = selectedSlot
        ? `/api/time-slots/${selectedSlot.id}`
        : "/api/time-slots"
      const method = selectedSlot ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save time slot")
      }

      toast.success(
        selectedSlot
          ? "Time slot updated successfully"
          : "Time slot created successfully"
      )
      fetchTimeSlots()
      setDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save time slot")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSlot) return

    try {
      const response = await fetch(`/api/time-slots/${selectedSlot.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete time slot")

      toast.success("Time slot deleted successfully")
      fetchTimeSlots()
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete time slot")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Slot Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure time slots for class schedules
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Time Slots</CardTitle>
          <CardDescription>
            Manage the time slots used throughout the scheduling system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Slot ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : timeSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No time slots configured
                  </TableCell>
                </TableRow>
              ) : (
                timeSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>{slot.order}</TableCell>
                    <TableCell className="font-mono">{slot.slotId}</TableCell>
                    <TableCell>
                      {slot.startTime} - {slot.endTime}
                    </TableCell>
                    <TableCell>{slot.label}</TableCell>
                    <TableCell>
                      {slot.isBreak ? (
                        <Badge variant="secondary">Break</Badge>
                      ) : (
                        <Badge variant="outline">Class</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {slot.isActive ? (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(slot)}
                          aria-label="Edit time slot"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slot)}
                          aria-label="Delete time slot"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlot ? "Edit Time Slot" : "Add New Time Slot"}
            </DialogTitle>
            <DialogDescription>
              Configure the time slot details for the schedule
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="slotId">Slot ID *</Label>
                <Input
                  id="slotId"
                  value={formData.slotId}
                  onChange={(e) =>
                    setFormData({ ...formData, slotId: e.target.value })
                  }
                  placeholder="e.g., 1, 2, break"
                  required
                  disabled={!!selectedSlot}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="e.g., 09:00 - 10:00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order">Order *</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10)
                    setFormData({ ...formData, order: isNaN(value) ? 1 : value })
                  }}
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isBreak"
                  checked={formData.isBreak}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBreak: checked as boolean })
                  }
                />
                <Label htmlFor="isBreak" className="cursor-pointer">
                  This is a break time
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {selectedSlot ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the time slot as inactive. Existing schedules using this
              time slot will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
