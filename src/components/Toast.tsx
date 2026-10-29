import { useEffect } from 'react'

interface Props {
  message: string
  onUndo: () => void
  onExpire: () => void
}

export default function Toast({ message, onUndo, onExpire }: Props) {
  useEffect(() => {
    const t = setTimeout(onExpire, 6000)
    return () => clearTimeout(t)
  }, [onExpire])

  return (
    <div className="toast" role="status">
      {message}
      <button onClick={onUndo}>Undo</button>
    </div>
  )
}
