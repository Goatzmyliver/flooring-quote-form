"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Calculator } from "lucide-react"
import ProductSelector from "./product-selector"
import CarpetRollVisualizer from "./carpet-roll-visualizer"
import StairCalculator from "./stair-calculator"
import StepIndicator from "./step-indicator"
import CustomerDetailsForm from "./customer-details-form"
import QuoteSummary from "./quote-summary"

// Mock products - replace with your actual product data
const mockProducts = [
  {
    id: 1,
    name: "Luxury Wool Carpet",
    category: "carpet",
    price: 89.99,
    image: "/placeholder.svg?height=100&width=100",
    rollWidth: 3.66,
  },
  {
    id: 2,
    name: "Berber Loop Pile",
    category: "carpet",
    price: 69.99,
    image: "/placeholder.svg?height=100&width=100",
    rollWidth: 3.66,
  },
  {
    id: 3,
    name: "Stain-Resistant Nylon",
    category: "carpet",
    price: 59.99,
    image: "/placeholder.svg?height=100&width=100",
    rollWidth: 4.0,
  },
  {
    id: 4,
    name: "Premium Vinyl Planks",
    category: "vinyl",
    price: 49.99,
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 5,
    name: "Waterproof Laminate",
    category: "laminate",
    price: 39.99,
    image: "/placeholder.svg?height=100&width=100",
  },
]

// Add a function to calculate broadloom meters from square meters
const defaultRollWidth = 3.66 // Default carpet roll width
const calculateBroadloomMeters = (squareMeters, rollWidth = defaultRollWidth) => {
  // For rooms that fit within the roll width, broadloom meters = length + 0.2m cutting margin
  return squareMeters / rollWidth
}

export default function QuoteForm() {
  const [step, setStep] = useState(1)
  const [steps, setSteps] = useState([
    { id: 1, label: "Your Details", completed: false },
    { id: 2, label: "Project Info", completed: false },
    { id: 3, label: "Product Details", completed: false },
    { id: 4, label: "Confirm", completed: false },
  ])

  const [formData, setFormData] = useState({
    // Customer details (Step 1)
    name: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    preferredContact: "email",
    projectTimeline: "1-3 months",

    // Quote details (existing fields)
    quoteType: "supply-only",
    flooringType: "carpet",
    area: "",
    color: "",
    additionalInfo: "",
    selectedProducts: [],
    rooms: [{ name: "Living Room", length: "", width: "", carpetRequired: 0, area: 0 }],
  })

  const [showCalculator, setShowCalculator] = useState(false)
  const [showStairCalculator, setShowStairCalculator] = useState(false)
  // Default roll width - will be determined by selected product
  const [carpetRollWidth] = useState(3.66)
  const [showRollVisualizer, setShowRollVisualizer] = useState(false)

  // Add a ref to access the visualizer component
  const visualizerRef = useRef(null)

  const handleChange = (field: string, value: string | any) => {
    setFormData({ ...formData, [field]: value })
  }

  // Check if a step is complete
  const isStepComplete = (stepNumber) => {
    if (stepNumber === 1) {
      // Validate required fields for step 1
      return formData.name && formData.email && formData.phone
    }
    if (stepNumber === 2) {
      // Validate required fields for step 2
      return formData.flooringType && formData.area
    }
    if (stepNumber === 3) {
      // Validate required fields for step 3
      return true // No strict requirements for step 3
    }
    return false
  }

  // Handle step click
  const handleStepClick = (stepId) => {
    // For testing purposes, allow clicking on any step
    setStep(stepId)
    window.scrollTo(0, 0)
  }

  const addProduct = (product) => {
    setFormData({
      ...formData,
      selectedProducts: [...formData.selectedProducts, { ...product, quantity: 1 }],
    })
  }

  const removeProduct = (productId) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.filter((p) => p.id !== productId),
    })
  }

  const updateProductQuantity = (productId, quantity) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.map((p) => (p.id === productId ? { ...p, quantity } : p)),
    })
  }

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [
        ...formData.rooms,
        { name: `Room ${formData.rooms.length + 1}`, length: "", width: "", carpetRequired: 0, area: 0 },
      ],
    })
  }

  const removeRoom = (index) => {
    const updatedRooms = [...formData.rooms]
    updatedRooms.splice(index, 1)
    setFormData({ ...formData, rooms: updatedRooms })
  }

  const updateRoom = (index, field, value) => {
    const updatedRooms = [...formData.rooms]
    updatedRooms[index] = { ...updatedRooms[index], [field]: value }

    // Calculate carpet required if both length and width are provided
    if ((field === "length" || field === "width") && updatedRooms[index].length && updatedRooms[index].width) {
      const length = Number.parseFloat(updatedRooms[index].length)
      const width = Number.parseFloat(updatedRooms[index].width)

      if (!isNaN(length) && !isNaN(width)) {
        // Calculate the room area in square meters
        const roomArea = length * width

        // Calculate how many strips are needed
        const stripsNeeded = Math.ceil(width / carpetRollWidth)

        // Calculate broadloom meters needed (with 200mm cutting margin)
        const broadloomMeters = stripsNeeded * (length + 0.2)

        // Store both values
        updatedRooms[index].area = Number.parseFloat(roomArea.toFixed(2))
        updatedRooms[index].carpetRequired = Number.parseFloat(broadloomMeters.toFixed(2))
        updatedRooms[index].stripsNeeded = stripsNeeded
      }
    }

    setFormData({ ...formData, rooms: updatedRooms })
  }

  const addStairsToQuote = (stairData) => {
    // Create a new room object for the stairs
    const newRoom = {
      name: stairData.name,
      length: stairData.length.toString(),
      width: stairData.width.toString(),
      area: stairData.area,
      carpetRequired: stairData.carpetRequired,
      isStairs: true,
      stairs: stairData.stairs,
    }

    // Add to rooms array
    setFormData({
      ...formData,
      rooms: [...formData.rooms, newRoom],
    })

    // Show a confirmation message or toast here if needed
  }

  const calculateTotalArea = () => {
    return formData.rooms.reduce((total, room) => total + (room.area || 0), 0)
  }

  const calculateTotalBroadloomMeters = () => {
    // Always use the visualizer's calculation when available
    if (visualizerRef.current) {
      return visualizerRef.current.getTotalBroadloomMeters()
    }

    // Fallback calculation only if visualizer ref is not available
    return formData.rooms.reduce((total, room) => total + (room.carpetRequired || 0), 0)
  }

  const nextStep = () => {
    // Mark current step as completed
    const updatedSteps = [...steps]
    updatedSteps[step - 1].completed = true
    setSteps(updatedSteps)

    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  // Update area field when carpet calculation changes
  useEffect(() => {
    if (formData.flooringType === "carpet") {
      const totalArea = calculateTotalArea()
      if (totalArea > 0) {
        handleChange("area", totalArea.toString())
      }
    }
  }, [formData.rooms])

  // Get the roll width from the selected product, or use default
  const getSelectedProductRollWidth = () => {
    if (formData.selectedProducts.length > 0) {
      const product = formData.selectedProducts[0]
      return product.rollWidth || defaultRollWidth
    }
    return defaultRollWidth
  }

  useEffect(() => {
    // Force the visualizer to recalculate whenever rooms change
    if (visualizerRef.current) {
      // Small timeout to ensure the visualizer has updated its internal state
      setTimeout(() => {
        // Update the area field with the total area
        const totalArea = calculateTotalArea()
        if (totalArea > 0) {
          handleChange("area", totalArea.toString())
        }

        // Force a re-render to update the broadloom meters display
        setFormData((prev) => ({ ...prev }))
      }, 50)
    }
  }, [formData.rooms])

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold text-center mb-12">Request A Quote</h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Get A Comprehensive Quote In Just 5 Minutes</h2>
            <p className="text-gray-600">
              Our unique quote calculator gives you an accurate and honest quote for your floor in minutes – including
              preparation, fitting and supporting materials. No hidden costs, guaranteed hard to beat prices!
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} steps={steps} onStepClick={handleStepClick} />

          <div className="mb-8">
            {/* Step 1: Customer Details */}
            {step === 1 && <CustomerDetailsForm formData={formData} handleChange={handleChange} />}

            {/* Step 2: Project Info (previously step 1) */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Project Info</h3>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">What type of quote is this?</h4>
                  <RadioGroup
                    defaultValue={formData.quoteType}
                    onValueChange={(value) => handleChange("quoteType", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="supply-only" id="supply-only" />
                      <Label htmlFor="supply-only">Supply Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="supply-install" id="supply-install" />
                      <Label htmlFor="supply-install">Supply & Install</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">What type of flooring are you interested in?</h4>
                  <Select value={formData.flooringType} onValueChange={(value) => handleChange("flooringType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flooring type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carpet">Carpet</SelectItem>
                      <SelectItem value="vinyl">Vinyl</SelectItem>
                      <SelectItem value="laminate">Laminate</SelectItem>
                      <SelectItem value="hardwood">Hardwood</SelectItem>
                      <SelectItem value="tile">Tile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Select Products</h4>
                  <ProductSelector
                    products={mockProducts.filter((p) => p.category === formData.flooringType)}
                    selectedProducts={formData.selectedProducts}
                    onAddProduct={addProduct}
                    onRemoveProduct={removeProduct}
                    onUpdateQuantity={updateProductQuantity}
                  />
                </div>

                {formData.flooringType === "carpet" ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Room Dimensions Calculator</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStairCalculator(!showStairCalculator)}
                        >
                          <span className="mr-2">🪜</span>
                          {showStairCalculator ? "Hide Stairs" : "Quick Stairs"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCalculator(!showCalculator)}>
                          <Calculator className="h-4 w-4 mr-2" />
                          {showCalculator ? "Hide Calculator" : "Show Calculator"}
                        </Button>
                      </div>
                    </div>

                    {showCalculator && (
                      <>
                        <div className="border p-4 rounded-md bg-gray-50 mb-4">
                          <p className="text-sm text-gray-600 mb-4">
                            Enter your room dimensions below to calculate how much carpet you'll need. We'll
                            automatically add a 200mm cutting margin to each length.
                          </p>

                          {formData.rooms.map((room, index) => (
                            <div key={index} className="mb-4 p-3 border rounded-md bg-white">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <Input
                                    className="w-40 mr-2"
                                    placeholder="Room name"
                                    value={room.name}
                                    onChange={(e) => updateRoom(index, "name", e.target.value)}
                                  />
                                  {room.isStairs && (
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Stairs</span>
                                  )}
                                </div>
                                {formData.rooms.length > 1 && (
                                  <Button variant="ghost" size="sm" onClick={() => removeRoom(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              {room.isStairs ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <Label>Stair Width (m)</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-gray-100">{room.width}</div>
                                  </div>
                                  <div>
                                    <Label>Number of Stairs</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-gray-100">{room.stairs}</div>
                                  </div>
                                  <div>
                                    <Label>Carpet Required</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-gray-100 flex flex-col justify-center">
                                      <span className="text-xs">{room.area || "-"} m² area</span>
                                      <span className="text-xs">
                                        {room.carpetRequired ? `${room.carpetRequired.toFixed(2)} broadloom m` : "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <Label htmlFor={`room-${index}-length`}>Length (m)</Label>
                                    <Input
                                      id={`room-${index}-length`}
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g. 5.2"
                                      value={room.length}
                                      onChange={(e) => updateRoom(index, "length", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`room-${index}-width`}>Width (m)</Label>
                                    <Input
                                      id={`room-${index}-width`}
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g. 4.3"
                                      value={room.width}
                                      onChange={(e) => updateRoom(index, "width", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>Carpet Required</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-gray-100 flex flex-col justify-center">
                                      <span className="text-xs">{room.area || "-"} m² area</span>
                                      <span className="text-xs">
                                        {room.carpetRequired ? `${room.carpetRequired.toFixed(2)} broadloom m` : "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          <Button variant="outline" size="sm" onClick={addRoom} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Room
                          </Button>

                          <div className="mt-4 p-3 border rounded-md bg-white">
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between">
                                <span className="font-medium">Total Area:</span>
                                <span className="font-bold">{calculateTotalArea().toFixed(2)} m²</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Broadloom Meters Required:</span>
                                <span className="font-bold">
                                  {calculateTotalBroadloomMeters().toFixed(2)} broadloom meters
                                  {!visualizerRef.current && (
                                    <span className="text-xs text-gray-500 ml-1">(estimated)</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-6 mb-3">
                            <h4 className="font-medium">Carpet Roll Layout</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRollVisualizer(!showRollVisualizer)}
                            >
                              {showRollVisualizer ? "Hide Layout" : "Show Layout"}
                            </Button>
                          </div>

                          <div className={showRollVisualizer ? "block" : "hidden"}>
                            <CarpetRollVisualizer
                              ref={visualizerRef}
                              rooms={formData.rooms}
                              rollWidth={getSelectedProductRollWidth()}
                              onUpdateRoom={updateRoom}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {showStairCalculator && (
                      <StairCalculator rollWidth={getSelectedProductRollWidth()} onAddToQuote={addStairsToQuote} />
                    )}

                    {!showCalculator && !showStairCalculator && (
                      <div>
                        <h4 className="font-medium mb-3">Approximate area (in square meters)</h4>
                        <Input
                          type="text"
                          placeholder="e.g. 25"
                          value={formData.area}
                          onChange={(e) => handleChange("area", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Approximate area (in square meters)</h4>
                    <Input
                      type="text"
                      placeholder="e.g. 25"
                      value={formData.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Product Details (previously step 2) */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Product Details</h3>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Preferred color/finish</h4>
                  <Input
                    type="text"
                    placeholder="e.g. Light Oak, Grey"
                    value={formData.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Products</h4>
                  {formData.selectedProducts.length > 0 ? (
                    <div className="space-y-3">
                      {formData.selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 overflow-hidden">
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">
                                ${(product.price * (product.rollWidth || defaultRollWidth)).toFixed(2)} per broadloom
                                meter
                                <span className="text-xs block">(${product.price.toFixed(2)} per m²)</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Select
                              value={product.quantity.toString()}
                              onValueChange={(value) => updateProductQuantity(product.id, Number.parseInt(value))}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue placeholder="Qty" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No products selected. Go back to step 2 to select products.</p>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Additional information</h4>
                  <Textarea
                    placeholder="Any specific requirements or questions?"
                    className="min-h-[100px]"
                    value={formData.additionalInfo}
                    onChange={(e) => handleChange("additionalInfo", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Confirm (previously step 3) */}
            {step === 4 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Confirm Your Quote</h3>

                <div className="mb-6">
                  <QuoteSummary
                    quoteType={formData.quoteType}
                    flooringType={formData.flooringType}
                    area={formData.area}
                    color={formData.color}
                    estimatedPrice={
                      formData.selectedProducts.length > 0
                        ? formData.selectedProducts.reduce(
                            (total, product) => total + product.price * product.quantity * Number(formData.area),
                            0,
                          )
                        : undefined
                    }
                  />
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Your Contact Information</h4>
                  <div className="border p-4 rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Name:</p>
                        <p>{formData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email:</p>
                        <p>{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone:</p>
                        <p>{formData.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Preferred Contact:</p>
                        <p>{formData.preferredContact.charAt(0).toUpperCase() + formData.preferredContact.slice(1)}</p>
                      </div>
                    </div>
                    {formData.address && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">Address:</p>
                        <p>{formData.address}</p>
                        {formData.postcode && <p>{formData.postcode}</p>}
                      </div>
                    )}
                    <div className="mt-4">
                      <p className="text-sm font-medium">Project Timeline:</p>
                      <p>{formData.projectTimeline}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    By submitting this form, you agree to our terms and conditions. We'll get back to you with a
                    comprehensive quote within 24 hours.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  onClick={nextStep}
                  className="ml-auto"
                  disabled={
                    (step === 1 && (!formData.name || !formData.email || !formData.phone)) ||
                    (step === 2 && (!formData.flooringType || !formData.area))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button className="ml-auto">Submit Quote Request</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

