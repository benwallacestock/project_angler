import { useState } from "react";
import { ShadeSlider, Wheel } from "@uiw/react-color";
import chroma from "chroma-js";

interface Colours {
  Ben: string;
  Roo: string;
}
type Person = keyof Colours;

const initialColours: Colours = {
  Ben: "#ff0000",
  Roo: "#0000ff",
};

const people: Array<Person> = ["Ben", "Roo"];

// Type guards for @uiw/react-color's change events
type ColorResult = {
  hex: string;
  hsva: { h: number; s: number; v: number; a: number };
  rgba: { r: number; g: number; b: number; a: number };
  // ...other fields, but these are enough for us
};

function isColorResult(obj: any): obj is ColorResult {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.hex === "string" &&
    obj.hsva &&
    typeof obj.hsva.h === "number"
  );
}

// Helper for brightness percent (0-100, safe for invalid values)
function getBrightnessPercent(hex: string): number {
  try {
    const [_, __, v] = chroma(hex).hsv();
    return Math.round((isNaN(v) ? 0 : v) * 100);
  } catch {
    return 0;
  }
}

export default function App() {
  const [selected, setSelected] = useState<Set<Person>>(new Set(["Ben"]));
  const [colours, setColours] = useState<Colours>(initialColours);

  // Picker colour (first selected, or Ben by default)
  let pickerColour: string = colours[people[0]];
  if (selected.size === 1) pickerColour = colours[[...selected][0]];
  if (selected.size === 2) pickerColour = colours[people[0]];
  const pickerDisabled = selected.size < 1;

  // Selection handling
  const togglePerson = (person: Person) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(person)) next.delete(person);
      else next.add(person);
      return next;
    });
  };

  function hexToHsva(hex: string): { h: number; s: number; v: number; a: number } {
    const [h, s, v] = chroma(hex).hsv();
    return {
      h: isNaN(h) ? 0 : h,
      s: Math.max(0, Math.min(s, 1)),
      v: Math.max(0, Math.min(v, 1)),
      a: 1
    };
  }

  // Colour wheel handler
  const handleWheelChange = (color: unknown) => {
    if (pickerDisabled || !isColorResult(color)) return;
    setColours((prev) => {
      const updated: Colours = { ...prev };
      selected.forEach((person) => {
        updated[person] = color.hex;
      });
      return updated;
    });
  };

  // ShadeSlider handler
  const handleShadeChange = (color: unknown) => {
    if (pickerDisabled || !isColorResult(color)) return;
    setColours((prev) => {
      const updated: Colours = { ...prev };
      selected.forEach((person) => {
        updated[person] = color.hex;
      });
      return updated;
    });
  };

  const brightnessPercent: number = getBrightnessPercent(pickerColour);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-neutral-100 to-blue-100">
      <header className="pt-6 pb-3 px-2 text-center bg-white bg-opacity-70 backdrop-blur-md shadow-md">
        <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">
          Colour Picker Demo
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          Tap a person below to edit their colour
        </p>
        <div className="flex justify-center gap-4 w-full mb-2">
          {people.map((person) => (
            <PersonSwatch
              key={person}
              name={person}
              colour={colours[person]}
              selected={selected.has(person)}
              onClick={() => togglePerson(person)}
            />
          ))}
        </div>
      </header>
      <main className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="w-full flex flex-col items-center max-w-xs mt-2">
          <Wheel
            color={pickerColour}
            onChange={handleWheelChange}
            width={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
            height={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
            pointer={{
              style: {
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 2px 8px #0003"
              }
            }}
            style={{
              filter: pickerDisabled ? "grayscale(1) brightness(1.2)" : "none",
              opacity: pickerDisabled ? 0.5 : 1,
              pointerEvents: pickerDisabled ? "none" : "auto",
              touchAction: "none"
            }}
          />
          {/* ShadeSlider for brightness/value */}
          <div className="w-full mt-6 px-2">
            <label className="block text-xs font-semibold mb-1 text-slate-600" htmlFor="brightness-slider">
              Brightness
            </label>
            <div className="flex items-center gap-4">
              <ShadeSlider
                style={{ flex: "1 1 0%" }}
                id="brightness-slider"
                color={pickerColour}
                hsva={hexToHsva(pickerColour)}
                onChange={handleShadeChange}
                disabled={pickerDisabled}
              />
              <span className="w-10 text-right text-xs text-slate-500 select-none">
                {brightnessPercent}%
              </span>
            </div>
          </div>
          <div className="text-slate-500 text-sm text-center h-6 mt-8 mb-2">
            {selected.size === 0 && "Select someone above to edit their colour"}
            {selected.size === 1 && `Editing: ${[...selected][0]}`}
            {selected.size === 2 && "Editing: Ben & Roo"}
          </div>
        </div>
      </main>
      <footer className="py-2 text-xs text-gray-400 text-center select-none">
        &copy; {new Date().getFullYear()} Colour Picker
      </footer>
    </div>
  );
}

// PersonSwatch: Typed and unchanged
interface PersonSwatchProps {
  name: Person;
  colour: string;
  selected: boolean;
  onClick: () => void;
}
function PersonSwatch({ name, colour, selected, onClick }: PersonSwatchProps) {
  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-end
        cursor-pointer transition-all 
        rounded-xl bg-white bg-opacity-60 shadow-sm
        duration-100 
        active:scale-90 
        focus:outline-none
        w-20 py-2
      `}
      aria-pressed={selected}
      style={{
        transform: selected ? "scale(1.09)" : "scale(1)",
        boxShadow: selected
          ? `0 2px 12px 0 ${colour}55`
          : "0 2px 6px #0001",
        border: selected ? `2.5px solid ${colour}` : "2.5px solid #ddd"
      }}
    >
      <div
        className="w-10 h-10 rounded-lg border border-gray-300 mb-1 transition-all"
        style={{
          background: colour,
          borderColor: selected ? colour : "#ccc"
        }}
      />
      <span
        className={`font-medium text-[15px] tracking-tight
          ${selected ? "text-blue-900" : "text-gray-800"}
          transition-all`}
        style={{
          fontWeight: selected ? "bold" : "normal",
          borderBottom: selected ? `3px solid ${colour}` : "3px solid transparent",
          lineHeight: "1.2",
          paddingBottom: 2
        }}
      >
        {name}
      </span>
      <span className="text-xs text-gray-400 mt-0.5 select-all">
        {colour}
      </span>
    </button>
  );
}