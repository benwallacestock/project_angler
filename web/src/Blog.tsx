import { Carousel } from '@/components/Carousel.tsx'
import deskImage from '@/assets/desk.jpeg'
import breadboardImage from '@/assets/breadboard.jpeg'
import glowImage from '@/assets/glow.gif'
import failedCircuitImage from '@/assets/failed_circuit.jpeg'
import printingImage from '@/assets/printing.jpeg'
import circuitsImage from '@/assets/circuits.jpeg'
import headbandImage from '@/assets/headband.jpeg'
import headband2Image from '@/assets/headband2.jpeg'
import benImage from '@/assets/ben.jpeg'
import aiImage from '@/assets/ai.jpeg'

export const Blog = () => {
  return (
    <div className="max-w-xl mx-auto py-8 px-4 select-text">
      <article className="mt-6 prose prose-blue">
        <h1 className="text-blue-900">Project Angler Blog</h1>
        <p>
          This project resulted in 2 wearable angler fish headbands with glowing
          orbs, which colours could be controlled from a web app. If you want to
          know more about how they were created... read on (or just enjoy the
          photos).
        </p>
        <div className="not-prose">
          <Carousel
            images={[
              {
                src: glowImage,
                caption: 'First prototype of getting the LED working',
              },
              { src: circuitsImage, caption: 'Final circuits' },
              {
                src: deskImage,
                caption: "Ben's desk having not even got that messy yet",
              },
              { src: breadboardImage, caption: 'Initial breadboard prototype' },
              { src: printingImage, caption: 'Prototype 3D printed parts' },
              {
                src: benImage,
                caption: 'Ben testing an almost complete headband',
              },
              {
                src: aiImage,
                caption: 'AI having just as much fun as us thinking up ideas',
              },
              {
                src: failedCircuitImage,
                caption: 'A failed attempt to build a circuit on perfboard',
              },
              {
                src: headbandImage,
                caption: 'Assembly of the headbands',
              },
              {
                src: headband2Image,
                caption: '#teamwork',
              },
            ]}
          />
        </div>
        <h2 className="text-blue-900">🌊 In The Beginning... 🌊</h2>
        <p>
          In a conversation about the summer party about a month ago, Ben told
          Roo that he did not like dressing up. Roo loves dressing up and was
          less than pleased by this. However, they ended up finding a good
          middle ground: a costume that would be easy and low-effort to wear,
          but could take the next month to create. And so, Project Angler was
          born.
        </p>
        <p>
          <i>
            Roo had little involvement following this until the last few days,
            but did the most important work of making the headbands and cables
            look pretty (which is what everyone cares about, right?) and being a
            rubber 🦆
          </i>
        </p>
        <h2 className="text-blue-900">🎣 Anglerfish R&amp;D 🎣</h2>
        <h3 className="text-cyan-600 ">🏗️ Construction 🏗️</h3>
        <p>
          We spent an evening after work visiting every shop we could think of
          that might sell headbands or hair clips to hold the Angler wiring
          above our heads. The thinking was that, with the right base, we could
          3D print an attachment to stick onto the headband or clips to hold the
          wires in place. We returned home after our (slightly too expensive, in
          hindsight) shopping spree, tried on the goods and realised none of
          them would work. Then we had a genius epiphany that if we were 3D
          printing something anyway, we might as well print the whole headband.
        </p>
        <p>
          The plan was simple: print a headband with a small attachment to hold
          some wires that would extend up to an LED shoved into a ping pong
          ball, as well as another attachment on the side of the headband to
          hold the battery and all the fancy electronics that Ben knows more
          about.
          <p>
            <i>
              (It turns out ping pong balls are really cheap to buy in bulk, so
              despite many being used for testing, we still have tonnes if
              anyone wants some.)
            </i>
          </p>
          We realised that the headbands would quickly become too bulky and
          heavy on our heads, so the final design was a headband with wires
          extending from both sides: one end going up to the ping pong ball, and
          the other down to a box housing all the electronic bits that Ben knows
          more about.
        </p>
        <h3 className="text-cyan-600">⚡ Electronics ⚡</h3>
        <p>
          The electronics was an area Ben already had a good idea about from his
          cocking about at uni. The basic idea was to use an ESP8266 chip
          (essentially a WiFi expansion board adapted to run Arduino code) to
          control a 4-pin RGB LED – one pin for red, green, blue and ground.
          This would all be powered by a small LiPo battery and packed into a
          case of some sort.
        </p>
        <p>
          Thirteen orders from eBay later – and a few mistakes ordering the
          wrong components – we had a working prototype. The board was connected
          to the LED using three PNP transistors to ensure enough current for
          maximum brightness. The battery was connected to the microcontroller
          via a 3.3V voltage regulator to provide a stable power supply, and the
          raw output was also connected to an ADC (analogue to digital
          converter) input so we could monitor battery levels.
        </p>
        <p>
          Once we had a prototype on a breadboard, it needed to be soldered onto
          perfboard to make a more compact circuit. It took a couple of attempts
          to get this right and, after one broken microcontroller, we had two
          fully soldered boards ready to be connected to the final headbands.
        </p>
        <h3 className="text-cyan-600">🧑‍💻 Software 🧑‍💻</h3>
        <p>
          The software was split into three different parts: the Arduino code
          running on the ESP8266, the web app that allows the user to control
          the LED, and communication between the two.
        </p>
        <h4 className="text-teal-600">Communication</h4>
        <p>
          Based on our experience with Kingsway, MQTT was the perfect choice for
          communication between the headbands and the web app because it is
          designed for IoT devices that may have spotty connections. We did not
          want anyone to have to log in for this silly project, so we needed a
          totally open MQTT broker, which is surprisingly difficult to find
          among cloud providers. Instead, we found the{' '}
          <a href="https://www.mqtt-dashboard.com/">Hive MQ Public Broker</a>{' '}
          which is a free and open broker designed for testing, and fit our
          needs perfectly.
        </p>
        <p>
          <i>
            (If anyone wants to play around with MQTT in a work or personal
            project, this is by far the fastest way to get a prototype up and
            running – just don’t use any sensitive data!)
          </i>
        </p>
        <h4 className="text-teal-600">Arduino</h4>
        <p>
          For the Arduino code, it is 100% vibe coded. We created it by
          providing Claude Sonnet with vague prompts describing what we wanted
          it to do. The development process mainly consisted of pasting the
          entire ~300 lines of code back into OpenWebUI and asking for changes,
          then repeating for most feature development. The basics, though, are:
          <ul>
            <li>
              On boot, use{' '}
              <a href="https://github.com/tzapu/WiFiManager">WiFiManager</a> to
              allow the user to connect the device to a WiFi network
            </li>
            <li>
              Use{' '}
              <a href="https://github.com/knolleary/pubsubclient">
                PubSubClient
              </a>{' '}
              and <a href="https://arduinojson.org/">ArduinoJson</a> to
              subscribe to the relevant MQTT topics
            </li>
            <li>
              On receipt of a lighting change message, change the LED colour or
              pattern configuration and return a status message notifying that
              the change has been made
            </li>
            <li>
              Periodically read the battery voltage from the ADC input, fetch
              the current time using{' '}
              <a href="https://github.com/arduino-libraries/NTPClient">
                NTPClient
              </a>{' '}
              and send a status message
            </li>
          </ul>
        </p>
        <p>
          With this basic set of features fleshed out by LLMs, we had a
          prototype in about an hour, and the final version with a few manual
          bug fixes within a few hours of development.
        </p>
        <h4 className="text-teal-600">Web App</h4>
        <p>
          The web app started much the same as the Arduino code – almost
          entirely vibe coded. However, this approach quickly fell apart as soon
          as we wanted to make manual changes, since everything generated was in
          a single file and quite unwieldy. We extracted elements into their own
          components, then architected it ourselves, using the LLM to fill in
          methods and generate components based on prior examples. Other than
          that, it is a fairly standard Vite React application, with the
          following interesting points:
          <ul>
            <li>
              The template from Vite uses{' '}
              <a href="https://tanstack.com/router/latest">TanStack Router</a> ,
              which, with our brief experience, seems very good.
            </li>
            <li>
              <a href="https://github.com/mqttjs">MQTT.js</a> remains a reliable
              library for MQTT, but it definitely benefits from being wrapped in
              sensible hooks or contexts to use nicely inside components.
            </li>
            <li>
              <a href="https://www.npmjs.com/package/@uiw/react-color">
                uiw/react-color
              </a>{' '}
              is a very good and configurable colour picker library for all your
              colour picking needs.
            </li>
            <li>
              While writing this blog (very meta) we used{' '}
              <a href="https://www.npmjs.com/package/vite-plugin-image-optimizer">
                Vite Image Optimizer
              </a>{' '}
              to compress the images a bit to help with load times
            </li>
          </ul>
        </p>
      </article>
      <a
        href="/"
        className="fixed top-4 right-4 z-50 bg-white/90 px-4 py-2 rounded shadow text-blue-600 hover:underline"
      >
        ← Back to controller
      </a>
      <a
        href="https://github.com/benwallacestock/project_angler"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 bg-white/90 px-3 py-2 rounded-full shadow hover:bg-gray-100 flex items-center gap-2 transition-all"
        aria-label="View code on GitHub"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="text-gray-800"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
      0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
      -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.2 1.87.85
      2.33.65.07-.52.28-.85.51-1.05-1.78-.2-3.64-.89-3.64-3.95
      0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21
      2.2.82A7.62 7.62 0 018 4.6c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82
      2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
      0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
      0 1.07-.01 1.93-.01 2.19
      0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
        <span className="sr-only">GitHub</span>
      </a>
    </div>
  )
}
