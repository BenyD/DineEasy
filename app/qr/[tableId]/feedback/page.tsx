"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Star, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function FeedbackPage({
  params,
  searchParams,
}: {
  params: { tableId: string }
  searchParams: { order?: string }
}) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const orderNumber = searchParams.order || "000"

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-3xl">🙏</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-8">Your feedback helps us improve our service and food quality.</p>

          <Link href={`/qr/${params.tableId}`}>
            <Button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              Back to Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href={`/qr/${params.tableId}/confirmation?order=${orderNumber}`}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Rate Your Experience</h1>
            <p className="text-sm text-gray-500">Order #{orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        {/* Rating Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">How was your experience?</h2>
          <p className="text-gray-600 mb-6">Your feedback helps us serve you better</p>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2"
              >
                <Star
                  className={`w-10 h-10 transition-colors duration-200 ${
                    star <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Rating Labels */}
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-green-700 mb-6"
            >
              {rating === 1 && "Poor 😞"}
              {rating === 2 && "Fair 😐"}
              {rating === 3 && "Good 🙂"}
              {rating === 4 && "Very Good 😊"}
              {rating === 5 && "Excellent! 🤩"}
            </motion.p>
          )}
        </motion.div>

        {/* Comment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">Tell us more (optional)</label>
          <Textarea
            placeholder="What did you like? What could we improve?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            size="lg"
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-14 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </motion.div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Link href={`/qr/${params.tableId}`}>
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
              Skip for now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
