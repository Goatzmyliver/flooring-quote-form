"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomerDetailsFormProps {
  formData: {
    name: string
    email: string
    phone: string
    address: string
    postcode: string
    preferredContact: string
    projectTimeline: string
  }
  handleChange: (field: string, value: string) => void
}

export default function CustomerDetailsForm({ formData, handleChange }: CustomerDetailsFormProps) {
  return (
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
            <Select value={formData.projectTimeline} onValueChange={(value) => handleChange("projectTimeline", value)}>
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
  )
}

