import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Command,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
  placeholder: string;
  value: string;
  validation?: (
    value: string,
    values?: Record<string, string>
  ) => string | null; // Returns error message or null
  required?: boolean;
  icon?: React.ElementType;
  condition?: (values: Record<string, string>) => boolean; // Conditional step visibility
}

interface MultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: Step[];
  onComplete: (values: Record<string, string>) => void;
  className?: string;
}

const MultiStepDialog = ({
  open,
  onOpenChange,
  title,
  steps,
  onComplete,
  className,
}: MultiStepDialogProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Initialize values from steps
  useEffect(() => {
    if (open) {
      const initialValues: Record<string, string> = {};
      steps.forEach((step) => {
        initialValues[step.id] = step.value || "";
      });
      setValues(initialValues);
      setErrors({});
      setCurrentStepIndex(0);
    }
  }, [open, steps]);

  // Focus input when dialog opens or step changes
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, currentStepIndex]);

  const validateCurrentStep = useCallback(() => {
    if (!currentStep) return true;

    const value = values[currentStep.id] || "";
    let error: string | null = null;

    // Check required validation
    if (currentStep.required && !value.trim()) {
      error = "This field is required";
    }

    // Check custom validation with access to all values
    if (!error && currentStep.validation) {
      error = currentStep.validation(value, values);
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [currentStep.id]: error }));
      return false;
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[currentStep.id];
        return newErrors;
      });
      return true;
    }
  }, [currentStep, values]);

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      // Complete the dialog
      onComplete(values);
      onOpenChange(false);
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleInputChange = (value: string) => {
    setValues((prev) => ({
      ...prev,
      [currentStep.id]: value,
    }));

    // Clear error when user starts typing
    if (errors[currentStep.id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[currentStep.id];
        return newErrors;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    } else if (
      e.key === "ArrowLeft" &&
      (e.ctrlKey || e.metaKey) &&
      !isFirstStep
    ) {
      e.preventDefault();
      handlePrevious();
    } else if (
      e.key === "ArrowRight" &&
      (e.ctrlKey || e.metaKey) &&
      !isLastStep
    ) {
      e.preventDefault();
      if (validateCurrentStep()) {
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on previous steps or current step
    if (stepIndex <= currentStepIndex) {
      setCurrentStepIndex(stepIndex);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div
          className={cn(
            "w-[500px] max-w-[90vw] bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-center w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-lg">
              <Command className="w-4 h-4 text-white dark:text-neutral-900" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors relative",
                      index < currentStepIndex &&
                        "bg-green-500 text-white cursor-pointer hover:bg-green-600",
                      index === currentStepIndex &&
                        "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900",
                      index > currentStepIndex &&
                        "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400",
                      errors[step.id] &&
                        index === currentStepIndex &&
                        "bg-red-500 text-white"
                    )}
                    disabled={index > currentStepIndex}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-3 h-3" />
                    ) : errors[step.id] && index === currentStepIndex ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : step.icon ? (
                      <step.icon className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-px transition-colors",
                        index < currentStepIndex
                          ? "bg-green-500"
                          : "bg-neutral-200 dark:bg-neutral-700"
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {currentStep?.title}
              </h3>
              {currentStep?.description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {currentStep.description}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={values[currentStep?.id] || ""}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentStep?.placeholder}
                className={cn(
                  "w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border rounded-md",
                  "text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500",
                  "focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400",
                  errors[currentStep?.id]
                    ? "border-red-500 dark:border-red-400"
                    : "border-neutral-200 dark:border-neutral-700"
                )}
              />
              {errors[currentStep?.id] && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {errors[currentStep.id]}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                isFirstStep
                  ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>

            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                Enter
              </kbd>{" "}
              to {isLastStep ? "create" : "continue"}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {isLastStep ? "Create" : "Next"}
              {!isLastStep && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MultiStepDialog;
