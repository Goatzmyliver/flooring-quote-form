"use client"

import { CheckCircle } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  steps: { id: number; label: string; completed: boolean }[]
  onStepClick: (stepId: number) => void
}

// Update the StepIndicator component to allow clicking on any step for testing
export default function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="relative flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center relative z-10">
            <button
              onClick={() => onStepClick(step.id)}
              className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all
                ${
                  currentStep === step.id
                    ? "border-black bg-white text-black font-bold"
                    : step.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                }
                cursor-pointer
              `}
            >
              {step.completed ? <CheckCircle className="h-6 w-6" /> : <span className="font-medium">{step.id}</span>}
            </button>
            <span className={`mt-2 text-sm ${currentStep === step.id ? "font-medium" : "text-gray-500"}`}>
              {step.label}
            </span>
          </div>
        ))}
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-200 -z-0">
          <div
            className="h-full bg-green-500 transition-all"
            style={{
              width: `${(Math.max(0, steps.filter((s) => s.completed).length - 1) / (steps.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}

