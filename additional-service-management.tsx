"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Save, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { AdditionalService } from "./lib/supabase"

interface AdditionalServiceManagementProps {
  onServicesChange: (services: AdditionalService[]) => void
  initialServices?: AdditionalService[]
}

export default function AdditionalServiceManagement({
  onServicesChange,
  initialServices = [],
}: AdditionalServiceManagementProps) {
  const [services, setServices] = useState<AdditionalService[]>([])
  const [filteredServices, setFilteredServices] = useState<AdditionalService[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<AdditionalService | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Available flooring types
  const flooringTypes = ["carpet", "vinyl", "laminate", "hardwood", "tile"]

  // Load services from Supabase on initial render
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/additional-services")

        if (!response.ok) {
          throw new Error("Failed to fetch additional services")
        }

        const data = await response.json()
        setServices(data)
      } catch (err) {
        console.error("Error loading additional services:", err)
        setError("Failed to load additional services. Please try again.")
        // Fall back to initial services if provided
        if (initialServices.length > 0) {
          setServices(initialServices)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [initialServices])

  // Update filtered services when services, search term, or category filter changes
  useEffect(() => {
    let filtered = [...services]

    if (searchTerm) {
      filtered = filtered.filter((service) => service.label.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (categoryFilter) {
      filtered = filtered.filter((service) => service.flooring_types.includes(categoryFilter))
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, categoryFilter])

  // Notify parent component when services change
  useEffect(() => {
    onServicesChange(services)
  }, [services, onServicesChange])

  const handleAddService = () => {
    const newService = {
      id: 0, // Will be assigned by the database
      label: "New Service",
      price: 0,
      description: "Service description",
      flooring_types: ["carpet"], // Default to carpet
    }

    setEditingService(newService)
  }

  const handleEditService = (service: AdditionalService) => {
    setEditingService({ ...service })
  }

  const handleDeleteService = async (serviceId: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        setError(null)

        const response = await fetch(`/api/additional-services/${serviceId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete service")
        }

        // Update local state
        const updatedServices = services.filter((s) => s.id !== serviceId)
        setServices(updatedServices)
      } catch (err) {
        console.error("Error deleting service:", err)
        setError("Failed to delete service. Please try again.")
      }
    }
  }

  const handleSaveService = async () => {
    if (!editingService) return

    try {
      setError(null)

      const isNewService = !editingService.id || editingService.id === 0

      const response = await fetch(
        isNewService ? "/api/additional-services" : `/api/additional-services/${editingService.id}`,
        {
          method: isNewService ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingService),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to ${isNewService ? "create" : "update"} service`)
      }

      const savedService = await response.json()

      // Update local state
      let updatedServices
      if (isNewService) {
        updatedServices = [...services, savedService]
      } else {
        updatedServices = services.map((s) => (s.id === savedService.id ? savedService : s))
      }

      setServices(updatedServices)
      setEditingService(null)
    } catch (err) {
      console.error("Error saving service:", err)
      setError("Failed to save service. Please try again.")
    }
  }

  const handleCancelEdit = () => {
    setEditingService(null)
  }

  const handleEditField = (field: string, value: any) => {
    if (!editingService) return

    setEditingService({
      ...editingService,
      [field]: value,
    })
  }

  const handleToggleFlooringType = (flooringType: string) => {
    if (!editingService) return

    const flooringTypes = [...editingService.flooring_types]
    const index = flooringTypes.indexOf(flooringType)

    if (index === -1) {
      flooringTypes.push(flooringType)
    } else {
      flooringTypes.splice(index, 1)
    }

    setEditingService({
      ...editingService,
      flooring_types: flooringTypes,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <Input placeholder="Search services..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Button>
          {flooringTypes.map((category) => (
            <Button
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
        <Button onClick={handleAddService} size="sm" className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-8 border rounded-md">
          <p>Loading additional services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <h3 className="text-lg font-medium mb-2">No Additional Services Found</h3>
          <p className="text-gray-600 mb-4">You haven't added any additional services yet.</p>
          <Button onClick={handleAddService}>Add Service</Button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p>No services match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{service.label}</CardTitle>
                  </div>
                  <Badge>${service.price.toFixed(2)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Applies to:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.flooring_types.map((type: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {editingService && (
        <div className="border p-6 rounded-md bg-gray-50 mt-6">
          <h3 className="text-xl font-medium mb-4">
            {services.some((s) => s.id === editingService.id) ? "Edit Service" : "Add New Service"}
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="service-label">Service Name</Label>
              <Input
                id="service-label"
                value={editingService.label}
                onChange={(e) => handleEditField("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="service-price">Price</Label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                value={editingService.price}
                onChange={(e) => handleEditField("price", Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={editingService.description}
                onChange={(e) => handleEditField("description", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="mb-2 block">Applies to Flooring Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {flooringTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`flooring-${type}`}
                      checked={editingService.flooring_types.includes(type)}
                      onCheckedChange={() => handleToggleFlooringType(type)}
                    />
                    <Label htmlFor={`flooring-${type}`} className="cursor-pointer">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveService}>
                <Save className="h-4 w-4 mr-2" />
                Save Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  )
}

