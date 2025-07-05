"use client"

import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastProps {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "info"
  onRemove: (id: string) => void
}

export function Toast({ id, title, description, type, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, 3000)

    return () => clearTimeout(timer)
  }, [id, onRemove])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }

  const Icon = icons[type]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]} shadow-lg`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-sm">{title}</h4>
        {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(id)}
        className="text-current hover:bg-black/10 p-1 h-auto"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { toasts: any[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
