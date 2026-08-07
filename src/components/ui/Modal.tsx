import type { ReactNode } from 'react'
import { IoClose } from 'react-icons/io5'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className={`relative flex max-h-[min(100dvh,100%)] w-full flex-col ${sizeClasses[size]} rounded-t-xl border border-border bg-surface-raised shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <h2 id="modal-title" className="min-w-0 text-base font-semibold text-slate-100 sm:text-lg">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar" className="shrink-0">
            <IoClose size={20} />
          </Button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
