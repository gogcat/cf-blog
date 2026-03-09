'use client'

import * as React from 'react'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return <>{open && children}</>
}

const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DialogContent = ({ 
  children, 
  onClose,
  className = ''
}: { 
  children: React.ReactNode
  onClose?: () => void
  className?: string
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!onClose) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="relative z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6 text-gray-900 dark:text-gray-100">
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>
}

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h3 className="text-lg font-semibold">{children}</h3>
}

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter }
