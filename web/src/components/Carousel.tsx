import React, { useRef, useState } from 'react'
import type { MouseEvent, TouchEvent } from 'react'

interface CarouselImage {
  src: string
  caption: string
}

interface CarouselProps {
  images: Array<CarouselImage> // [{ src, caption }...]
  aspectRatio?: string // e.g. 'aspect-[3/2]' or 'aspect-video'
}

export const Carousel: React.FC<CarouselProps> = ({
  images,
  aspectRatio = 'aspect-[3/2]',
}) => {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const SWIPE_THRESHOLD = 40

  const handleTouchStart = (e: TouchEvent | MouseEvent) => {
    touchStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX
    touchDeltaX.current = 0
  }

  const handleTouchMove = (e: TouchEvent | MouseEvent) => {
    if (touchStartX.current !== null) {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      touchDeltaX.current = x - touchStartX.current
    }
  }

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > SWIPE_THRESHOLD) {
      if (touchDeltaX.current < 0) {
        setIndex((index + 1) % images.length)
      } else if (touchDeltaX.current > 0) {
        setIndex((index - 1 + images.length) % images.length)
      }
    }
    touchStartX.current = null
    touchDeltaX.current = 0
  }

  if (!images.length) return null

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className={`relative w-full max-w-md ${aspectRatio} bg-gray-200 rounded-lg overflow-hidden touch-pan-x`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Mouse events for desktop swipe
        onMouseDown={handleTouchStart}
        onMouseMove={(e) => {
          if (touchStartX.current !== null) handleTouchMove(e)
        }}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        tabIndex={0}
        role="group"
        aria-label="Image carousel"
        style={{ userSelect: 'none' }}
      >
        <img
          src={images[index].src}
          alt={images[index].caption || ''}
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          draggable={false}
        />
        <button
          onClick={() => setIndex((index - 1 + images.length) % images.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 hover:bg-white"
          aria-label="Previous"
          type="button"
        >
          ‹
        </button>
        <button
          onClick={() => setIndex((index + 1) % images.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 hover:bg-white"
          aria-label="Next"
          type="button"
        >
          ›
        </button>
      </div>
      {/* Caption */}
      <div className="mt-2 text-sm text-gray-800 text-center w-full max-w-md">
        {images[index].caption}
      </div>
      <div className="flex gap-2 mt-3">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colours duration-200 ${i === index ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-label={`Go to slide ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
