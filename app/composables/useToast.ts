export interface ToastMessage {
  id: number
  title: string
  description?: string
}

export const useToast = () => {
  const messages = useState<ToastMessage[]>('toast-messages', () => [])

  const showToast = (message: Omit<ToastMessage, 'id'>) => {
    messages.value.push({ ...message, id: Date.now() })
  }

  const dismissToast = (id: number) => {
    messages.value = messages.value.filter(message => message.id !== id)
  }

  return { messages, showToast, dismissToast }
}
