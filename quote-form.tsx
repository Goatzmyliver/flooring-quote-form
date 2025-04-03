"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Plus, Trash2, StepBackIcon as Stairs, Download, Printer } from "lucide-react"
import ProductSelector from "./product-selector"
import CarpetRollVisualizer from "./carpet-roll-visualizer"
import { loadProductsFromStorage } from "./utils/csv-parser"

// Import the mock products as a fallback
import { mockProducts } from "./data/mock-products"

// Add this import at the top of the file
import PaymentButton from "./components/payment-button"

// Extra services options
const extraServices = [
  {
    id: "premium-underlay",
    label: "Premium Underlay",
    price: 180.0,
    description: "Upgrade to Dunlop Opal 11mm 120kg foam underlay for better comfort and durability",
    flooringTypes: ["carpet"],
  },
  {
    id: "standard-underlay",
    label: "Standard Underlay",
    price: 120.0,
    description: "Standard 8mm foam underlay for carpet installation",
    flooringTypes: ["carpet"],
  },
  {
    id: "floor-prep",
    label: "Floor Preparation",
    price: 250.0,
    description: "Preparing the floor surface for installation",
    flooringTypes: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
  {
    id: "furniture-move",
    label: "Furniture Moving",
    price: 150.0,
    description: "Moving furniture before and after installation",
    flooringTypes: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
  {
    id: "old-removal",
    label: "Old Flooring Removal",
    price: 200.0,
    description: "Removal and disposal of existing flooring",
    flooringTypes: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
  {
    id: "smoothedge",
    label: "New Smoothedge",
    price: 120.0,
    description: "Installation of new smoothedge or Naplock bars",
    flooringTypes: ["carpet"],
  },
  {
    id: "vinyl-adhesive",
    label: "Premium Vinyl Adhesive",
    price: 85.0,
    description: "High-quality adhesive for vinyl flooring installation",
    flooringTypes: ["vinyl"],
  },
  {
    id: "moisture-barrier",
    label: "Moisture Barrier",
    price: 110.0,
    description: "Protective barrier for laminate and hardwood floors",
    flooringTypes: ["laminate", "hardwood"],
  },
]

// Add a function to calculate broadloom meters from square meters
const defaultRollWidth = 3.66 // Default carpet roll width
const calculateBroadloomMeters = (squareMeters, rollWidth = defaultRollWidth) => {
  // For rooms that fit within the roll width, broadloom meters = length + 0.2m cutting margin
  return squareMeters / rollWidth
}

export default function QuoteForm() {
  // Add state for products
  const [products, setProducts] = useState<any[]>([])

  // Update the step state to include a new step for the calculator
  const [step, setStep] = useState(1)
  const [stepsCompleted, setStepsCompleted] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false })

  // Update formData to ensure we have all customer fields
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
    rooms: [{ name: "Living Room", length: "", width: "", carpetRequired: 0, area: 0, isStairs: false, stairs: 0 }],

    // Extra services
    extraServices: [],

    // Payment details
    paymentMethod: "direct-deposit",
    acceptTerms: false,
  })

  // Default roll width - will be determined by selected product
  const [carpetRollWidth] = useState(3.66)
  const [showRollVisualizer, setShowRollVisualizer] = useState(false)

  // Add a ref to access the visualizer component
  const visualizerRef = useRef(null)

  // Load products from localStorage on initial render
  useEffect(() => {
    const storedProducts = loadProductsFromStorage()
    if (storedProducts && storedProducts.length > 0) {
      setProducts(storedProducts)
    } else {
      setProducts(mockProducts)
    }
  }, [])

  const handleChange = (field: string, value: string | any) => {
    setFormData({ ...formData, [field]: value })
  }

  const addProduct = (product) => {
    setFormData({
      ...formData,
      selectedProducts: [
        ...formData.selectedProducts,
        {
          ...product,
          selectedColor: product.colors && product.colors.length > 0 ? product.colors[0] : null,
        },
      ],
    })
  }

  const removeProduct = (productId) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.filter((p) => p.id !== productId),
    })
  }

  const updateProductColor = (productId, color) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.map((p) => (p.id === productId ? { ...p, selectedColor: color } : p)),
    })
  }

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [
        ...formData.rooms,
        {
          name: `Room ${formData.rooms.length + 1}`,
          length: "",
          width: "",
          carpetRequired: 0,
          area: 0,
          isStairs: false,
          stairs: 0,
        },
      ],
    })
  }

  const removeRoom = (index) => {
    const updatedRooms = [...formData.rooms]
    updatedRooms.splice(index, 1)
    setFormData({ ...formData, rooms: updatedRooms })
  }

  // Update the updateRoom function to properly handle stairs
  const updateRoom = (index, field, value) => {
    const updatedRooms = [...formData.rooms]

    // For length and width inputs, limit to 1 decimal place
    if ((field === "length" || field === "width") && value !== "") {
      // Parse the value and round to 1 decimal place
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue)) {
        value = Math.round(numValue * 10) / 10
      }
    }

    updatedRooms[index] = { ...updatedRooms[index], [field]: value }

    // If toggling isStairs, set default stairs count
    if (field === "isStairs" && value === true && !updatedRooms[index].stairs) {
      updatedRooms[index].stairs = 12 // Default number of stairs
    }

    // Calculate carpet required if both length and width are provided
    if (
      (field === "length" || field === "width" || field === "stairs" || field === "isStairs") &&
      updatedRooms[index].width
    ) {
      const width = Number.parseFloat(updatedRooms[index].width)

      if (!isNaN(width)) {
        if (updatedRooms[index].isStairs && updatedRooms[index].stairs) {
          // Calculate for stairs
          const stairDepth = 0.5 // 500mm per stair
          const stairs = Number.parseInt(updatedRooms[index].stairs) || 0

          // Calculate total length based on number of stairs
          const totalLength = stairs * stairDepth

          // Calculate area
          const area = width * totalLength

          // Calculate broadloom meters for stairs - each stair is an individual piece
          // Calculate how many stair pieces can fit across the roll width
          const stairsPerRow = Math.floor(carpetRollWidth / width)

          // Calculate how many rows we need
          const rows = Math.ceil(stairs / stairsPerRow)

          // Total broadloom meters is rows × stair depth (no cutting margin for stairs)
          const broadloomMeters = rows * stairDepth

          // Store values
          updatedRooms[index].length = totalLength.toString()
          updatedRooms[index].area = Number.parseFloat(area.toFixed(2))
          updatedRooms[index].carpetRequired = Number.parseFloat(broadloomMeters.toFixed(2))
        } else if (updatedRooms[index].length) {
          // Calculate for regular room
          const length = Number.parseFloat(updatedRooms[index].length)

          if (!isNaN(length)) {
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
      }
    }

    setFormData({ ...formData, rooms: updatedRooms })
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

  // Calculate product cost
  const calculateProductCost = () => {
    if (formData.selectedProducts.length === 0) return 0

    const product = formData.selectedProducts[0]
    const area = Number.parseFloat(formData.area) || 0

    if (formData.flooringType === "carpet") {
      // For carpet, use broadloom meters
      const broadloomMeters = calculateTotalBroadloomMeters()
      return product.price * broadloomMeters
    } else {
      // For other flooring, use area
      return product.price * area
    }
  }

  // Calculate extras cost
  const calculateExtrasCost = () => {
    return formData.extraServices.reduce((total, serviceId) => {
      const service = extraServices.find((s) => s.id === serviceId)
      return total + (service ? service.price : 0)
    }, 0)
  }

  // Calculate total cost
  const calculateTotalCost = () => {
    return calculateProductCost() + calculateExtrasCost()
  }

  // Calculate GST
  const calculateGST = () => {
    return calculateTotalCost() * 0.15 // 15% GST
  }

  // Calculate deposit amount (50% for supply-install)
  const calculateDepositAmount = () => {
    if (formData.quoteType === "supply-only") {
      return calculateTotalCost() // Full amount for supply only
    } else {
      return calculateTotalCost() * 0.5 // 50% deposit for supply-install
    }
  }

  // Toggle extra service
  const toggleExtraService = (serviceId) => {
    if (formData.extraServices.includes(serviceId)) {
      setFormData({
        ...formData,
        extraServices: formData.extraServices.filter((id) => id !== serviceId),
      })
    } else {
      setFormData({
        ...formData,
        extraServices: [...formData.extraServices, serviceId],
      })
    }
  }

  // Add a function to check if a step is complete
  const isStepComplete = (stepNumber) => {
    if (stepNumber === 1) {
      // Validate required fields for step 1
      return formData.name && formData.email && formData.phone
    }
    if (stepNumber === 2) {
      // Validate required fields for step 2
      return formData.flooringType && formData.selectedProducts.length > 0
    }
    if (stepNumber === 3) {
      // Validate required fields for step 3 (calculator)
      return formData.rooms.length > 0 && formData.rooms.some((room) => room.area > 0)
    }
    if (stepNumber === 4) {
      // Validate required fields for step 4 (quote)
      return formData.acceptTerms
    }
    return stepsCompleted[stepNumber]
  }

  // Update the nextStep function to mark steps as completed
  const nextStep = () => {
    // Mark current step as completed
    setStepsCompleted({ ...stepsCompleted, [step]: true })
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

  // Update the handleStepClick function to allow navigation to any step for testing
  const handleStepClick = (stepId) => {
    // For testing purposes, allow clicking on any step
    setStep(stepId)
    window.scrollTo(0, 0)
  }

  // Update the addStairsToQuote function to properly mark the stair data
  const addStairsToQuote = (stairData) => {
    // Create a new room object for the stairs
    const newRoom = {
      name: stairData.name,
      length: stairData.length.toString(),
      width: stairData.width.toString(),
      area: stairData.area,
      carpetRequired: stairData.carpetRequired,
      isStairs: true, // Explicitly mark as stairs
      stairs: stairData.stairs,
    }

    // Add to rooms array
    setFormData({
      ...formData,
      rooms: [...formData.rooms, newRoom],
    })

    // Show a confirmation message or toast here if needed
  }

  // Function to print the quote
  const printQuote = () => {
    window.print()
  }

  // Function to download the quote as PDF
  const downloadQuote = () => {
    // This would be implemented with a PDF generation library
    alert("Download PDF functionality would be implemented here")
  }

  // Generate a quote number
  const generateQuoteNumber = () => {
    return `QT${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(7, "0")}`
  }

  // Generate a job number
  const generateJobNumber = () => {
    return `JB${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`
  }

  // Format the current date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-NZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  // Calculate expiry date (3 months from now)
  const calculateExpiryDate = () => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return formatDate(date)
  }

  // Handle products change from admin panel
  const handleProductsChange = (updatedProducts) => {
    setProducts(updatedProducts)
  }

  // Replace the existing step indicator with this new one
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Request A Quote</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Get A Comprehensive Quote In Just 5 Minutes</h2>
            <p className="text-gray-600">
              Our unique quote calculator gives you an accurate and honest quote for your floor in minutes – including
              preparation, fitting and supporting materials. No hidden costs, guaranteed hard to beat prices!
            </p>
          </div>

          {/* New Step Indicator */}
          <div className="mb-8">
            <div className="relative flex justify-between">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center relative z-10">
                  <button
                    onClick={() => handleStepClick(i)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all
                      ${
                        step === i
                          ? "border-black bg-white text-black font-bold"
                          : stepsCompleted[i]
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 bg-gray-50 text-gray-500"
                      }
                      cursor-pointer
                    `}
                  >
                    {stepsCompleted[i] ? <CheckCircle className="h-6 w-6" /> : <span className="font-medium">{i}</span>}
                  </button>
                  <span className={`mt-2 text-sm ${step === i ? "font-medium" : "text-gray-500"}`}>
                    {i === 1
                      ? "Your Details"
                      : i === 2
                        ? "Select Products"
                        : i === 3
                          ? "Room Calculator"
                          : i === 4
                            ? "Quote & Payment"
                            : "Confirm"}
                  </span>
                </div>
              ))}
              {/* Progress line */}
              <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-200 -z-0">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${(Math.max(0, Object.values(stepsCompleted).filter(Boolean).length - 1) / 4) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {/* Step 1: Customer Details */}
            {step === 1 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Your Details</h3>
                <p className="text-gray-600 mb-6">
                  Please provide your contact information so we can prepare your personalized quote.
                </p>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Your phone number"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredContact" className="font-medium">
                        Preferred Contact Method
                      </Label>
                      <Select
                        value={formData.preferredContact}
                        onValueChange={(value) => handleChange("preferredContact", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-medium">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Your address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="postcode" className="font-medium">
                        Postcode
                      </Label>
                      <Input
                        id="postcode"
                        type="text"
                        placeholder="Your postcode"
                        value={formData.postcode}
                        onChange={(e) => handleChange("postcode", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectTimeline" className="font-medium">
                        Project Timeline
                      </Label>
                      <Select
                        value={formData.projectTimeline}
                        onValueChange={(value) => handleChange("projectTimeline", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asap">As soon as possible</SelectItem>
                          <SelectItem value="1-3 months">1-3 months</SelectItem>
                          <SelectItem value="3-6 months">3-6 months</SelectItem>
                          <SelectItem value="6+ months">6+ months</SelectItem>
                          <SelectItem value="just-researching">Just researching</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  <p>* Required fields</p>
                </div>
              </div>
            )}

            {/* Step 2: Select Products */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Select Products</h3>

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
                    products={products.filter((p) => p.category === formData.flooringType)}
                    selectedProducts={formData.selectedProducts}
                    onAddProduct={addProduct}
                    onRemoveProduct={removeProduct}
                  />
                </div>

                {/* Selected Products with Color Selection */}
                {formData.selectedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Your Selected Products</h4>
                    <div className="space-y-3">
                      {formData.selectedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border rounded-md bg-gray-50"
                        >
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-md mr-4 overflow-hidden">
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
                            {product.colors && product.colors.length > 0 && (
                              <div>
                                <Select
                                  value={product.selectedColor || ""}
                                  onValueChange={(value) => updateProductColor(product.id, value)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {product.colors.map((color) => (
                                      <SelectItem key={color} value={color}>
                                        {color}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
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
                  </div>
                )}

                {formData.selectedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Additional Products & Services</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Select any additional products or services you may require:
                    </p>

                    <div className="space-y-3">
                      {extraServices
                        .filter((service) => service.flooringTypes.includes(formData.flooringType))
                        .map((service) => (
                          <div key={service.id} className="flex items-start space-x-2 p-3 border rounded-md">
                            <Checkbox
                              id={service.id}
                              checked={formData.extraServices.includes(service.id)}
                              onCheckedChange={() => toggleExtraService(service.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={service.id} className="font-medium cursor-pointer">
                                {service.label} - ${service.price.toFixed(2)}
                              </Label>
                              <p className="text-sm text-gray-600">{service.description}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Room Calculator (new dedicated step) */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Room Dimensions Calculator</h3>
                <p className="text-gray-600 mb-6">
                  Enter your room dimensions below to calculate how much flooring you'll need. For carpet, we'll
                  automatically add a 200mm cutting margin to each length.
                </p>

                <div className="border p-4 rounded-md bg-gray-50 mb-6">
                  {formData.rooms.map((room, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-md bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <Input
                            className="w-40 mr-2"
                            placeholder="Room name"
                            value={room.name}
                            onChange={(e) => updateRoom(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={room.isStairs ? "default" : "outline"}
                              className={`flex items-center gap-1 ${room.isStairs ? "bg-green-600 hover:bg-green-700" : ""}`}
                              onClick={() => updateRoom(index, "isStairs", true)}
                            >
                              <Stairs className="h-4 w-4" />
                              Staircase
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={!room.isStairs ? "default" : "outline"}
                              className={`flex items-center gap-1 ${!room.isStairs ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                              onClick={() => updateRoom(index, "isStairs", false)}
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                              </svg>
                              Room
                            </Button>
                          </div>
                          {formData.rooms.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeRoom(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {room.isStairs ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`stair-width-${index}`}>Stair Width (m)</Label>
                            <Input
                              id={`stair-width-${index}`}
                              type="number"
                              step="0.01"
                              placeholder="e.g. 1.0"
                              value={room.width}
                              onChange={(e) => updateRoom(index, "width", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`stair-count-${index}`}>Number of Stairs</Label>
                            value={room.width}
                            onChange={(e) => updateRoom(index, "width", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`stair-count-${index}`}>Number of Stairs</Label>
                            <Input
                              id={`stair-count-${index}`}
                              type="number"
                              placeholder="e.g. 12"
                              value={room.stairs}
                              onChange={(e) => updateRoom(index, "stairs", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Carpet Required</Label>
                            <div className="h-10 px-3 py-2 border rounded-md bg-gray-100 flex flex-col justify-center">
                              <span className="text-xs">{room.area ? `${room.area.toFixed(2)} m² area` : "-"}</span>
                              <span className="text-xs">
                                {room.carpetRequired ? `${room.carpetRequired.toFixed(2)} broadloom m` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <Label>Flooring Required</Label>
                            <div className="h-10 px-3 py-2 border rounded-md bg-gray-100 flex flex-col justify-center">
                              <span className="text-xs">{room.area ? `${room.area.toFixed(2)} m² area` : "-"}</span>
                              {formData.flooringType === "carpet" && (
                                <span className="text-xs">
                                  {room.carpetRequired ? `${room.carpetRequired.toFixed(2)} broadloom m` : "-"}
                                </span>
                              )}
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

                  <div className="mt-6 p-4 border rounded-md bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Area:</span>
                        <span className="font-bold">{calculateTotalArea().toFixed(2)} m²</span>
                      </div>
                      {formData.flooringType === "carpet" && (
                        <div className="flex justify-between">
                          <span className="font-medium">Broadloom Meters Required:</span>
                          <span className="font-bold">
                            {calculateTotalBroadloomMeters().toFixed(2)} broadloom meters
                            {!visualizerRef.current && <span className="text-xs text-gray-500 ml-1">(estimated)</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {formData.flooringType === "carpet" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Carpet Roll Layout</h4>
                      <Button variant="outline" size="sm" onClick={() => setShowRollVisualizer(!showRollVisualizer)}>
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
                )}
              </div>
            )}

            {/* Step 4: Quote & Payment */}
            {step === 4 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Quote & Payment</h3>

                {/* Quote Document */}
                <div className="border p-6 rounded-md bg-white mb-6 print:shadow-none">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-bold">Carpetland Ltd</h2>
                      <p className="text-sm text-gray-600">123 Flooring Avenue</p>
                      <p className="text-sm text-gray-600">Auckland, New Zealand</p>
                      <p className="text-sm text-gray-600">GST Number: 97 722 390</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-bold">Quote {generateQuoteNumber()}</h3>
                      <p className="text-sm text-gray-600">Job Number: {generateJobNumber()}</p>
                      <p className="text-sm text-gray-600">Date: {formatDate(new Date())}</p>
                      <p className="text-sm text-gray-600">Expiry Date: {calculateExpiryDate()}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="border-b pb-4">
                      <p>{formData.name}</p>
                      <p>{formData.address}</p>
                      {formData.postcode && <p>{formData.postcode}</p>}
                      <p>New Zealand</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="mb-4">Dear {formData.name.split(" ")[0]},</p>
                    <p className="mb-4">
                      Thank you for the opportunity to quote on {formData.flooringType} for your property
                      {formData.address ? ` located at ${formData.address}` : ""}.
                    </p>

                    <p className="mb-4">
                      The quote is as follows. To{" "}
                      {formData.quoteType === "supply-install" ? "supply and install" : "supply"}
                      {formData.selectedProducts.length > 0
                        ? ` ${formData.selectedProducts[0].name}, ${formData.selectedProducts[0].selectedColor || "selected color"}`
                        : " selected flooring"}
                      {formData.flooringType === "carpet" ? " on new Dunlop Opal 11mm 120kg foam underlay" : ""}
                      to the {formData.rooms.map((r) => r.name).join(", ")}
                      {formData.quoteType === "supply-install" ? " on new smoothedge." : "."}
                    </p>

                    {formData.quoteType === "supply-install" && (
                      <p className="font-medium mb-4">
                        TERMS: 50% Deposit on acceptance of quote and balance in full within 10 days of installation.
                      </p>
                    )}

                    {formData.quoteType === "supply-only" && (
                      <p className="font-medium mb-4">
                        TERMS: Full payment required at time of order. Product will need to be collected as one roll.
                      </p>
                    )}
                  </div>

                  <div className="mb-8">
                    <h4 className="font-medium mb-3">Quote Details</h4>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3">Description</th>
                            <th className="text-right p-3">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Product */}
                          <tr className="border-t">
                            <td className="p-3">
                              {formData.selectedProducts.length > 0
                                ? formData.selectedProducts[0].name
                                : "Selected flooring"}
                              {formData.selectedProducts.length > 0 && formData.selectedProducts[0].selectedColor
                                ? ` - ${formData.selectedProducts[0].selectedColor}`
                                : ""}
                              <br />
                              <span className="text-xs text-gray-600">
                                {formData.flooringType === "carpet"
                                  ? `${calculateTotalBroadloomMeters().toFixed(2)} broadloom meters`
                                  : `${formData.area} m²`}
                              </span>
                            </td>
                            <td className="p-3 text-right">${calculateProductCost().toFixed(2)}</td>
                          </tr>

                          {/* Extra Services */}
                          {formData.extraServices.map((serviceId) => {
                            const service = extraServices.find((s) => s.id === serviceId)
                            if (!service) return null
                            return (
                              <tr key={service.id} className="border-t">
                                <td className="p-3">
                                  {service.label}
                                  <br />
                                  <span className="text-xs text-gray-600">{service.description}</span>
                                </td>
                                <td className="p-3 text-right">${service.price.toFixed(2)}</td>
                              </tr>
                            )
                          })}

                          {/* Subtotal */}
                          <tr className="border-t bg-gray-50">
                            <td className="p-3 font-medium">Subtotal</td>
                            <td className="p-3 text-right font-medium">${calculateTotalCost().toFixed(2)}</td>
                          </tr>

                          {/* GST */}
                          <tr className="border-t bg-gray-50">
                            <td className="p-3">Includes GST</td>
                            <td className="p-3 text-right">${calculateGST().toFixed(2)}</td>
                          </tr>

                          {/* Total */}
                          <tr className="border-t bg-gray-50">
                            <td className="p-3 font-bold">Total NZD</td>
                            <td className="p-3 text-right font-bold">${calculateTotalCost().toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-sm mb-2">
                      Carpetland banks with ASB bank. Account number if making direct credit for deposit or paying
                      account in full is: 12-3027-0466250-00. Please specify your name and quote number with each
                      payment.
                    </p>
                    <p className="text-sm mb-4">Payment made by credit card will incur an additional charge of 2%</p>

                    <div className="border p-3 bg-gray-50 text-sm">
                      <p className="font-medium mb-2">UNLESS OTHERWISE SPECIFIED, THIS QUOTATION DOES NOT INCLUDE:-</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Floor Preparation</li>
                        <li>Moving of the furniture fittings or appliances</li>
                        <li>New smoothedge or Naplock bars</li>
                        <li>Uplifting of the existing floor coverings</li>
                        <li>Change of underlay</li>
                        <li>Customers care to disconnect all electrical appliances</li>
                        <li>Moving TV, Computer and Stereo equipment customers care</li>
                        <li>Extra charges for moving pianos & billiard tables etc</li>
                      </ol>
                      <p className="mt-2">Price increases ex manufacturers or supplies E.&O E</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-8">
                    <p className="mb-2">
                      {formData.quoteType === "supply-install"
                        ? "Payment in full within 10 days of installation"
                        : "Goods supply only must be paid for at time of order"}
                    </p>
                    <p className="mb-2">Goods remain the property of Carpetland Ltd until paid for in full</p>
                    <p>
                      By accepting this quotation you are also accepting that you have read and agreed to our privacy
                      policy. Our privacy policy can be found at: https://www.carpetland.co.nz/privacy-policy/
                    </p>
                  </div>
                </div>

                {/* Quote Actions */}
                <div className="flex justify-end gap-3 mb-8 print:hidden">
                  <Button variant="outline" size="sm" onClick={printQuote}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Quote
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadQuote}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                {/* Payment Method */}
                <div className="mb-8 print:hidden">
                  <h4 className="font-medium mb-3">Payment Method</h4>
                  <RadioGroup
                    defaultValue={formData.paymentMethod}
                    onValueChange={(value) => handleChange("paymentMethod", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <RadioGroupItem value="direct-deposit" id="direct-deposit" />
                      <div>
                        <Label htmlFor="direct-deposit" className="font-medium">
                          Direct Bank Deposit
                        </Label>
                        <p className="text-sm text-gray-600">Make payment to ASB bank: 12-3027-0466250-00</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <div>
                        <Label htmlFor="credit-card" className="font-medium">
                          Credit Card (2% surcharge)
                        </Label>
                        <p className="text-sm text-gray-600">Pay securely with Visa or Mastercard</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <RadioGroupItem value="in-store" id="in-store" />
                      <div>
                        <Label htmlFor="in-store" className="font-medium">
                          Pay In-Store
                        </Label>
                        <p className="text-sm text-gray-600">Visit our showroom to make payment</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-8 print:hidden">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept-terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleChange("acceptTerms", checked)}
                    />
                    <div>
                      <Label htmlFor="accept-terms" className="font-medium cursor-pointer">
                        I accept the terms and conditions
                      </Label>
                      <p className="text-sm text-gray-600">
                        By accepting this quote, you agree to our terms and conditions, including payment terms and
                        privacy policy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="border p-4 rounded-md bg-gray-50 mb-6 print:hidden">
                  <h4 className="font-medium mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateTotalCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Includes GST (15%):</span>
                      <span>${calculateGST().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>
                        {formData.quoteType === "supply-install" ? "Deposit Amount (50%):" : "Total Amount Due:"}
                      </span>
                      <span>${calculateDepositAmount().toFixed(2)}</span>
                    </div>
                    {formData.quoteType === "supply-install" && (
                      <p className="text-sm text-gray-600">
                        Balance of ${(calculateTotalCost() - calculateDepositAmount()).toFixed(2)} due within 10 days of
                        installation
                      </p>
                    )}
                  </div>
                  {/* Inside the step 4 section, add this code at the end of the "Payment Summary" div: */}
                  <div className="mt-4">
                    <PaymentButton
                      amount={calculateDepositAmount()}
                      quoteNumber={generateQuoteNumber()}
                      customerName={formData.name}
                      customerEmail={formData.email}
                      productName={
                        formData.selectedProducts.length > 0 ? formData.selectedProducts[0].name : "Flooring"
                      }
                      isDeposit={formData.quoteType === "supply-install"}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirm (previously step 4) */}
            {step === 5 && (
              <div>
                <h3 className="text-xl font-medium mb-6">Confirm Your Order</h3>

                <div className="mb-6">
                  <div className="border p-4 rounded-md bg-gray-50">
                    <h4 className="font-medium mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Quote Type:</span>{" "}
                        {formData.quoteType.replace("-", " & ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
                      </p>
                      <p>
                        <span className="font-medium">Flooring Type:</span>{" "}
                        {formData.flooringType.charAt(0).toUpperCase() + formData.flooringType.slice(1)}
                      </p>
                      <p>
                        <span className="font-medium">Area:</span> {formData.area} m²
                      </p>
                      {formData.flooringType === "carpet" && (
                        <p>
                          <span className="font-medium">Broadloom Meters:</span>{" "}
                          {calculateTotalBroadloomMeters().toFixed(2)} broadloom meters
                        </p>
                      )}

                      {formData.selectedProducts.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium">Selected Products:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {formData.selectedProducts.map((product) => (
                              <li key={product.id}>
                                {product.name} {product.selectedColor && `(${product.selectedColor})`}
                                (${(product.price * Number(formData.area)).toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {formData.extraServices.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium">Additional Services:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {formData.extraServices.map((serviceId) => {
                              const service = extraServices.find((s) => s.id === serviceId)
                              if (!service) return null
                              return (
                                <li key={service.id}>
                                  {service.label} (${service.price.toFixed(2)})
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${calculateTotalCost().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Method:</span>
                          <span>
                            {formData.paymentMethod === "direct-deposit"
                              ? "Direct Bank Deposit"
                              : formData.paymentMethod === "credit-card"
                                ? "Credit Card (2% surcharge)"
                                : "Pay In-Store"}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold mt-2">
                          <span>{formData.quoteType === "supply-install" ? "Deposit Amount:" : "Amount Due Now:"}</span>
                          <span>${calculateDepositAmount().toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Includes applicable taxes</p>
                      </div>
                    </div>
                  </div>
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
                    Thank you for your order! We'll process your request and contact you shortly to confirm details and
                    arrange payment.
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
              {step < 5 ? (
                <Button
                  onClick={nextStep}
                  className="ml-auto"
                  disabled={
                    (step === 1 && (!formData.name || !formData.email || !formData.phone)) ||
                    (step === 2 && (!formData.flooringType || formData.selectedProducts.length === 0)) ||
                    (step === 3 && (!formData.rooms.length || !formData.rooms.some((room) => room.area > 0))) ||
                    (step === 4 && !formData.acceptTerms)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button className="ml-auto">Submit Order</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

