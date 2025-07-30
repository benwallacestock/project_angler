import { Carousel } from '@/components/Carousel.tsx'
import deskImage from '@/assets/desk.jpeg'
import breadboardImage from '@/assets/breadboard.jpeg'
import failedCircuitImage from '@/assets/failed_circuit.jpeg'
import printingImage from '@/assets/printing.jpeg'
import circuitsImage from '@/assets/circuits.jpeg'
import headbandImage from '@/assets/headband.jpeg'

export const Blog = () => {
  return (
    <div className="max-w-xl mx-auto py-8 px-4 select-text">
      <h2 className="text-xl font-bold mb-4 text-blue-900">
        Project Angler: Development Log
      </h2>
      <Carousel
        images={[
          deskImage,
          breadboardImage,
          failedCircuitImage,
          printingImage,
          circuitsImage,
          headbandImage,
        ]}
      />
      <article className="mt-6 prose prose-blue">
        <p>QQ</p>
        <p>QQ</p>
        <p>QQ</p>
      </article>
      <a href="/" className="mt-8 text-blue-600 hover:underline inline-block">
        ← Back to controller
      </a>
    </div>
  )
}
