import Button from './Button'
import './ConfirmDialog.css'

interface Props {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, confirmLabel = 'OK', cancelLabel, variant = 'danger', onConfirm, onCancel }: Props) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel || 'Cancel'}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
