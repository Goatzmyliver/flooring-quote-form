"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Plus, Trash2, HelpCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ProductSelector from "./product-selector"
import CarpetRollVisualizer from "./carpet-roll-visualizer"
import QuoteSummary from "./quote-summary"

// Import the mock products as a fallback
import { mockProducts } from "./data/mock-products"
import type { AdditionalService } from "./lib/supabase"

// Add a function to calculate broadloom meters from square meters
const defaultRollWidth = 3.66 // Default carpet roll width
const calculateBroadloomMeters = (squareMeters, rollWidth = defaultRollWidth) => {
  // For rooms that fit within the roll width, broadloom meters = length + 0.2m cutting margin
  return squareMeters / rollWidth
}

// Fallback additional services in case the API fails
const fallbackExtraServices = [
  {
    id: 1,
    label: "Premium Underlay",
    price: 180.0,
    description: "Upgrade to Dunlop Opal 11mm 120kg foam underlay for better comfort and durability",
    flooring_types: ["carpet"],
  },
  {
    id: 2,
    label: "Standard Underlay",
    price: 120.0,
    description: "Standard 8mm foam underlay for carpet installation",
    flooring_types: ["carpet"],
  },
  {
    id: 3,
    label: "Floor Preparation",
    price: 250.0,
    description: "Preparing the floor surface for installation",
    flooring_types: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
  {
    id: 4,
    label: "Furniture Moving",
    price: 150.0,
    description: "Moving furniture before and after installation",
    flooring_types: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
  {
    id: 5,
    label: "Old Flooring Removal",
    price: 200.0,
    description: "Removal and disposal of existing flooring",
    flooring_types: ["carpet", "vinyl", "laminate", "hardwood", "tile"],
  },
]

export default function QuoteForm() {
  // Add state for products and additional services
  const [products, setProducts] = useState<any[]>([])
  const [extraServices, setExtraServices] = useState<AdditionalService[]>([])

  // Update the step state to include a new step for the calculator
  const [step, setStep] = useState(1)
  const [stepsCompleted, setStepsCompleted] = useState({ 1: false, 2: false, 3: false, 4: false })
  const [progress, setProgress] = useState(0)

  // Add these state variables inside the QuoteForm component, after the other useState declarations
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const quoteRef = useRef<HTMLDivElement>(null)

  // Add state for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    calculator: false,
    visualizer: false,
    additionalServices: false,
  })

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

  // Add a ref to access the visualizer component
  const visualizerRef = useRef<CarpetRollVisualizer>(null)

  // Load products and additional services from Supabase on initial render
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch("/api/products")
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products")
        }
        const productsData = await productsResponse.json()
        setProducts(productsData.length > 0 ? productsData : mockProducts)

        // Fetch additional services
        const servicesResponse = await fetch("/api/additional-services")
        if (!servicesResponse.ok) {
          throw new Error("Failed to fetch additional services")
        }
        const servicesData = await servicesResponse.json()
        setExtraServices(servicesData.length > 0 ? servicesData : fallbackExtraServices)
      } catch (err) {
        console.error("Error loading data:", err)
        // Fall back to mock data
        setProducts(mockProducts)
        setExtraServices(fallbackExtraServices)
      }
    }

    fetchData()
  }, [])

  // Filter extra services based on the selected flooring type
  const getFilteredExtraServices = () => {
    return extraServices.filter((service) => service.flooring_types.includes(formData.flooringType))
  }

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

  // Add this helper function after the calculateTotalBroadloomMeters function:

  const getTotalStairCount = () => {
    return formData.rooms.reduce((total, room) => {
      if (room.isStairs && room.stairs) {
        return total + Number(room.stairs)
      }
      return total
    }, 0)
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

  // Then update the calculateStairInstallationCost function to use this helper:

  // Calculate stair installation cost ($30 per step)
  const calculateStairInstallationCost = () => {
    // Only apply for supply-install quotes
    if (formData.quoteType !== "supply-install") return 0

    // $30 per step
    return getTotalStairCount() * 30
  }

  // Calculate total cost
  const calculateTotalCost = () => {
    return calculateProductCost() + calculateExtrasCost() + calculateStairInstallationCost()
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

  // Update progress bar based on step completion
  useEffect(() => {
    const completedSteps = Object.values(stepsCompleted).filter(Boolean).length
    const totalSteps = Object.keys(stepsCompleted).length
    setProgress((completedSteps / totalSteps) * 100)
  }, [stepsCompleted])

  // Update the handleStepClick function to allow navigation to any step for testing
  const handleStepClick = (stepId) => {
    // For testing purposes, allow clicking on any step
    setStep(stepId)
    window.scrollTo(0, 0)
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

  // Add a function to submit the quote to Supabase
  const submitQuote = async () => {
    try {
      // Calculate total cost
      const totalCost = calculateTotalCost()

      // Calculate deposit amount
      const depositAmount = calculateDepositAmount()

      // Generate quote number and job number
      const quoteNumber = generateQuoteNumber()
      const jobNumber = generateJobNumber()

      // Prepare quote data
      const quoteData = {
        quote_number: quoteNumber,
        job_number: jobNumber,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: formData.address,
        customer_postcode: formData.postcode,
        preferred_contact: formData.preferredContact,
        project_timeline: formData.projectTimeline,
        quote_type: formData.quoteType,
        flooring_type: formData.flooringType,
        area: formData.area,
        color: formData.color,
        additional_info: formData.additionalInfo,
        selected_products: formData.selectedProducts,
        rooms: formData.rooms,
        extra_services: formData.extraServices,
        payment_method: formData.paymentMethod,
        total_cost: totalCost,
        deposit_amount: depositAmount,
        status: "pending",
      }

      // Submit quote to API
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit quote")
      }

      // Show success message
      showNotification("Thank you for your order! We'll process your request and contact you shortly.", "success")

      // Reset form or redirect to confirmation page
      // For now, we'll just reset the form
      setFormData({
        // Reset all form fields to initial state
        name: "",
        email: "",
        phone: "",
        address: "",
        postcode: "",
        preferredContact: "email",
        projectTimeline: "1-3 months",
        quoteType: "supply-only",
        flooringType: "carpet",
        area: "",
        color: "",
        additionalInfo: "",
        selectedProducts: [],
        rooms: [{ name: "Living Room", length: "", width: "", carpetRequired: 0, area: 0, isStairs: false, stairs: 0 }],
        extraServices: [],
        paymentMethod: "direct-deposit",
        acceptTerms: false,
      })
      setStep(1)
      setStepsCompleted({ 1: false, 2: false, 3: false, 4: false })
    } catch (error) {
      console.error("Error submitting quote:", error)
      showNotification("There was an error submitting your quote. Please try again.", "error")
    }
  }

  // Add this function inside the QuoteForm component, before the return statement
  const getQuoteHtml = () => {
    if (!quoteRef.current) return ""
    return quoteRef.current.innerHTML
  }

  // Add this function to handle showing notifications
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type })
  }

  // Add this function to handle closing notifications
  const closeNotification = () => {
    setNotification(null)
  }

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Request A Quote</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="w-full max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Start</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Step Indicator - Simplified */}
          <div className="mb-8">
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  onClick={() => handleStepClick(i)}
                  className={`flex flex-col items-center transition-all ${step === i ? "scale-110" : "opacity-70"}`}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all
                      ${
                        step === i
                          ? "bg-green-600 text-white"
                          : stepsCompleted[i]
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }
                    `}
                  >
                    {stepsCompleted[i] ? <CheckCircle className="h-5 w-5" /> : i}
                  </div>
                  <span className={`mt-2 text-xs ${step === i ? "font-medium" : ""}`}>
                    {i === 1 ? "Your Details" : i === 2 ? "Products" : i === 3 ? "Measurements" : "Review"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            {/* Step 1: Customer Details */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-medium mb-4">Your Details</h2>
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

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="address">
                      <AccordionTrigger className="text-sm font-medium">
                        Add Address Details (Optional)
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
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
                                onChange={(value) => handleChange("projectTimeline", value)}
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="text-sm text-gray-500">
                    <p>* Required fields</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Products - Simplified */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-medium mb-4">Select Your Flooring</h2>
                <p className="text-gray-600 mb-6">
                  Choose the type of flooring you're interested in and select from our quality products.
                </p>

                <div className="mb-6">
                  <Label htmlFor="quoteType" className="font-medium mb-2 block">
                    What type of quote do you need?
                  </Label>
                  <RadioGroup
                    value={formData.quoteType}
                    onValueChange={(value) => handleChange("quoteType", value)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.quoteType === "supply-only" ? "border-green-500 bg-green-50" : "hover:border-gray-300"
                      }`}
                      onClick={() => handleChange("quoteType", "supply-only")}
                    >
                      <div className="flex items-center mb-2">
                        <RadioGroupItem value="supply-only" id="supply-only" className="mr-2" />
                        <Label htmlFor="supply-only" className="font-medium cursor-pointer">
                          Supply Only
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">Just the flooring materials, without installation</p>
                    </div>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.quoteType === "supply-install"
                          ? "border-green-500 bg-green-50"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => handleChange("quoteType", "supply-install")}
                    >
                      <div className="flex items-center mb-2">
                        <RadioGroupItem value="supply-install" id="supply-install" className="mr-2" />
                        <Label htmlFor="supply-install" className="font-medium cursor-pointer">
                          Supply & Install
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">Complete service including professional installation</p>
                    </div>
                  </RadioGroup>
                </div>

                <div className="mb-6">
                  <Label htmlFor="flooringType" className="font-medium mb-2 block">
                    What type of flooring are you interested in?
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["carpet", "vinyl", "laminate", "hardwood", "tile"].map((type) => (
                      <div
                        key={type}
                        className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                          formData.flooringType === type ? "border-green-500 bg-green-50" : "hover:border-gray-300"
                        }`}
                        onClick={() => handleChange("flooringType", type)}
                      >
                        <div className="font-medium capitalize">{type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">Select a Product</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Choose a product that matches your needs. You can select one product at a time.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <ProductSelector
                    products={products.filter((p) => p.category === formData.flooringType)}
                    selectedProducts={formData.selectedProducts}
                    onAddProduct={addProduct}
                    onRemoveProduct={removeProduct}
                  />
                </div>

                {/* Selected Products with Color Selection - Simplified */}
                {formData.selectedProducts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Your Selected Product</h3>
                    {formData.selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-md bg-green-50 border-green-200"
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
                            <p className="text-sm text-gray-600">
                              ${product.price.toFixed(2)} per m²
                              {product.rollWidth && (
                                <span className="text-xs block">
                                  ${(product.price * product.rollWidth).toFixed(2)} per broadloom meter
                                </span>
                              )}
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
                          <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)} className="ml-2">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Services - Collapsed by default */}
                {formData.selectedProducts.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="services">
                      <AccordionTrigger className="font-medium">Additional Products & Services</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Select any additional products or services you may require:
                        </p>

                        <div className="space-y-3">
                          {getFilteredExtraServices().map((service) => (
                            <div key={service.id} className="flex items-start space-x-2 p-3 border rounded-md">
                              <Checkbox
                                id={`service-${service.id}`}
                                checked={formData.extraServices.includes(service.id)}
                                onCheckedChange={() => toggleExtraService(service.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={`service-${service.id}`} className="font-medium cursor-pointer">
                                  {service.label} - ${service.price.toFixed(2)}
                                </Label>
                                <p className="text-sm text-gray-600">{service.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            )}

            {/* Step 3: Room Measurements - Simplified */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-medium mb-4">Room Measurements</h2>
                <p className="text-gray-600 mb-6">
                  Enter your room dimensions to calculate how much flooring you'll need.
                  {formData.flooringType === "carpet" &&
                    " For carpet, we'll add a 200mm cutting margin to each length."}
                </p>

                <div className="mb-6">
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
                          {formData.flooringType === "carpet" && (
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`room-type-${index}`} className="text-sm font-medium mr-2">
                                Room Type:
                              </Label>
                              <div className="flex border rounded-md overflow-hidden">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={!room.isStairs ? "default" : "outline"}
                                  className={`rounded-none ${!room.isStairs ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                                  onClick={() => updateRoom(index, "isStairs", false)}
                                >
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                  Regular Room
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={room.isStairs ? "default" : "outline"}
                                  className={`rounded-none ${room.isStairs ? "bg-green-600 hover:bg-green-700" : ""}`}
                                  onClick={() => updateRoom(index, "isStairs", true)}
                                >
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M3 21V3H21V7H7V11H17V15H7V21H3Z" fill="currentColor" />
                                  </svg>
                                  Staircase
                                </Button>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <HelpCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      Select "Regular Room" for standard rectangular spaces. Choose "Staircase" for stairs, which require special carpet calculations.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          {formData.rooms.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeRoom(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {room.isStairs ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input
                                id={`stair-count-${index}`}
                                type="number"
                                placeholder="e.g. 12"
                                value={room.stairs}
                                onChange={(e) => updateRoom(index, "stairs", e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </div>
                        )}

                        {/* Show calculated area if we have valid dimensions */}
                        {room.area > 0 && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-md text-sm">
                            <div className="flex justify-between">
                              <span>Area:</span>
                              <span className="font-medium">{room.area.toFixed(2)} m²</span>
                            </div>
                            {formData.flooringType === "carpet" && room.carpetRequired > 0 && (
                              <div className="flex justify-between">
                                <span>Carpet Required:</span>
                                <span className="font-medium">{room.carpetRequired.toFixed(2)} broadloom m</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <Button variant="outline" size="sm" onClick={addRoom} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Room
                          </Button>

                    {/* Summary of all rooms */}
                    {formData.rooms.some((room) => room.area > 0) && (
                      <div className="mt-6 p-4 border rounded-md bg-green-50 border-green-200">
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
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Carpet Roll Visualizer - In accordion */}
                  {formData.flooringType === "carpet" && formData.rooms.some((room) => room.area > 0) && (
                    <Accordion type="single" collapsible className="w-full mt-6">
                      <AccordionItem value="visualizer">
                        <AccordionTrigger className="font-medium">
                          Carpet Roll Layout Visualizer
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  This visualizer shows how your carpet will be cut from the roll for optimal material
                                  usage.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 border rounded-md bg-gray-50">
                            <p className="text-sm text-gray-600 mb-4">
                              See how your carpet will be cut from a {getSelectedProductRollWidth()}m wide roll for
                              optimal material usage.
                            </p>
                            <CarpetRollVisualizer
                              ref={visualizerRef}
                              rooms={formData.rooms}
                              rollWidth={getSelectedProductRollWidth()}
                              onUpdateRoom={updateRoom}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              )
}

{
  /* Step 4: Review Quote - Simplified */
}
{step === 4 && (
                <div>
                  <h2 className="text-xl font-medium mb-4">Review Your Quote</h2>
                  <p className="text-gray-600 mb-6">Please review your quote details below and confirm your order.</p>

                  {/* Quote Summary */}
                  <div className="mb-6">
                    <QuoteSummary
                      quoteType={formData.quoteType}
                      flooringType={formData.flooringType}
                      area={formData.area}
                      color={formData.selectedProducts[0]?.selectedColor || ""}
                      estimatedPrice={calculateTotalCost()}
                    />
                  </div>

                  {/* Quote Details - Collapsible */}
                  <Accordion type="single" collapsible className="w-full mb-6">
                    <AccordionItem value="details">
                      <AccordionTrigger className="font-medium">View Detailed Quote</AccordionTrigger>
                      <AccordionContent>
                        {/* Quote Document */}
                        <div className="border p-6 rounded-md bg-white print:shadow-none" ref={quoteRef}>
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <h2 className="text-2xl font-bold">Carpetland Ltd</h2>
                              <p className="text-sm text-gray-600">123 Flooring Avenue</p>
                              <p className="text-sm text-gray-600">Auckland, New Zealand</p>
                              <p className="text-sm text-gray-600">GST Number: 97 722 390</p>
                            </div>
                            <div className="text-right">
                              <h3 className="text-xl font-bold">Quote {generateQuoteNumber()}</h3>
                              <p className="text-sm text-gray-600">Date: {formatDate(new Date())}</p>
                              <p className="text-sm text-gray-600">Expiry Date: {calculateExpiryDate()}</p>
                            </div>
                          </div>

                          <div className="mb-8">
                            <h4 className="font-medium mb-2">Customer Details</h4>
                            <div className="border-b pb-4">
                              <p>{formData.name}</p>
                              <p>{formData.email}</p>
                              <p>{formData.phone}</p>
                              {formData.address && <p>{formData.address}</p>}
                              {formData.postcode && <p>{formData.postcode}</p>}
                            </div>
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
                                          <span className="text-xs text-gray-600">{service.description}</

