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
        <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">
          🌊 In The Beginning... 🌊
        </h1>
        <p>
          In a conversation about the summer party about a month ago, Ben told
          Roo that he didn't like dressing up. Roo loves dressing up and was
          less than pleased by this. They ended up finding a good middle-ground:
          a costume that was easy and low-effort to wear, but could take the
          next month to create. And so, Project Angler was born.
        </p>
        <p className="mt-3">
          <i>
            Roo had little involvement following this until the last few days,
            but did the most important work of making the headbands and cables
            look pretty (which is what you all care about right?) and being a
            rubber 🦆
          </i>
        </p>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-blue-900">
          🎣 Anglerfish R&D 🎣
        </h1>
        <div className="mt-2 ml-4">
          <h2 className="text-xl font-bold text-cyan-600 ">
            🏗️ Construction 🏗️
          </h2>
          <p>
            We spent an evening after work going into every shop we thought
            might sell headbands or hair clips that could hold the Angler wiring
            above our heads. The thinking was that with the right base, we could
            3D print an attachment to stick onto the headband or clips and hold
            the wires. We came home after our (slightly too expensive in
            hindsight) shopping spree, tried on the goods and realised none of
            them would work, then had a genius epiphany that if we were 3D
            printing something anyway we might as well print the whole headband.
          </p>
          <p className="mt-3">
            The plan was simple, print a headband with a small attachment to
            hold some wires that would go all the way up to an LED shoved into a
            ping pong ball, as well as another attachment on the side of the
            headband to hold the battery and all the fancy electronic-y things
            that Ben knows more about.
            <i>
              (It turns out ping pong balls are really cheap to buy in bulk, so
              despite many being used in testing we still have tonnes if anyone
              requires ping pong balls.)
            </i>
            We realised that the headbands would quickly get too bulky and heavy
            on our heads so the new and final design was a headband with wires
            going out of both sides, one end going towards the ping pong ball
            and the other down to a box housing all the electronic-y bits that
            Ben knows more about.
          </p>

          <h2 className="text-xl font-bold text-cyan-600">⚡ Electronics ⚡</h2>
          <p>
            The electronics was something that Ben already had a pretty good
            idea about from all his cocking about at uni. The basic idea was to
            use an ESP 8266 chip (basically a wifi expansion board that's been
            adapted to run Arduino code) to control a 4 pin RGB LED, one for
            red, green, blue and ground. That would all then be powered by a
            small LiPo battery and all shoved into a case of some sort.
          </p>
          <p>
            13 orders from eBay later and a couple of mistakes ordering the
            wrong types of components and we had a working prototype. The board
            was connected to the LED using 3 PNP transistors to make sure they
            got enough current and could shine their brightest. The battery was
            connected to the microcontroller via a 3.3v voltage regulator to
            provide a constant power supply, as well as the raw output being
            connected to an ADC (analogue to digital converter) input so we
            could monitor the battery levels.
          </p>
          <p>
            Once we had a prototype on a breadboard, it needed soldering onto
            protoboard to make a more compact circuit. It took a couple of
            attempts to get this right and 1 broken microcontroller later we had
            2 fully soldered board ready to connect to the final headbands.
          </p>
          <h2 className="text-xl font-bold text-cyan-600">🧑‍💻 Software 🧑‍💻</h2>
          <p></p>
        </div>
      </article>
      <a href="/" className="mt-8 text-blue-600 hover:underline inline-block">
        ← Back to controller
      </a>
    </div>
  )
}
