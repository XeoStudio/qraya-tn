'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WhatsAppButtonProps {
  message?: string
}

export default function WhatsAppButton({ 
  message = 'مرحباً، أريد الاستفسار عن خدمات مساعد دراسة تونسي' 
}: WhatsAppButtonProps) {
  const phoneNumber = '21624239724'
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

  return (
    <TooltipProvider>
      <Tooltip>
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <TooltipTrigger asChild>
            <div className="relative">
              <MessageCircle className="w-7 h-7 text-white" />
              
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </span>
            </div>
          </TooltipTrigger>
        </motion.a>
        
        <TooltipContent side="left" className="bg-white dark:bg-gray-800 shadow-lg">
          <p className="text-gray-900 dark:text-white">تواصل معنا عبر واتساب</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
