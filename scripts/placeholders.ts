// SVG placeholders used by the seed script. Each is ~300 bytes; replace with
// real campus photos once you have them.

type Placeholder = {
  key: string;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  lat: number;
  lng: number;
  svg: string;
};

function makeSvg(difficulty: string, bg: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <text x="400" y="310" text-anchor="middle" font-family="sans-serif" font-size="42" fill="#fff" font-weight="bold">${difficulty}</text>
  <text x="400" y="350" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#fff" opacity="0.75">placeholder</text>
</svg>`;
}

export const PLACEHOLDERS: Placeholder[] = [
  {
    key: "seed/easy-1.svg",
    difficulty: "easy",
    title: "Belk Tower",
    lat: 35.3075,
    lng: -80.7348,
    svg: makeSvg("Easy", "#005035"),
  },
  {
    key: "seed/easy-2.svg",
    difficulty: "easy",
    title: "Student Union",
    lat: 35.308,
    lng: -80.733,
    svg: makeSvg("Easy", "#005035"),
  },
  {
    key: "seed/medium-1.svg",
    difficulty: "medium",
    title: "Atkins Library quad",
    lat: 35.3068,
    lng: -80.7322,
    svg: makeSvg("Medium", "#A49665"),
  },
  {
    key: "seed/medium-2.svg",
    difficulty: "medium",
    title: "Botanical Gardens path",
    lat: 35.3093,
    lng: -80.7281,
    svg: makeSvg("Medium", "#A49665"),
  },
  {
    key: "seed/hard-1.svg",
    difficulty: "hard",
    title: "South Village walkway",
    lat: 35.3045,
    lng: -80.7295,
    svg: makeSvg("Hard", "#005035"),
  },
  {
    key: "seed/hard-2.svg",
    difficulty: "hard",
    title: "Greek Village",
    lat: 35.305,
    lng: -80.7385,
    svg: makeSvg("Hard", "#005035"),
  },
];

// Repeat each difficulty to ensure at least 5 rounds-worth of locations.
export const SEED_LOCATIONS: Placeholder[] = (() => {
  const out: Placeholder[] = [];
  for (const p of PLACEHOLDERS) {
    out.push(p);
    // extra dupes per difficulty so a 5-round game can run
    for (let i = 2; i <= 3; i++) {
      out.push({
        ...p,
        key: p.key.replace(".svg", `-${i}.svg`),
        title: `${p.title} ${i}`,
        lat: p.lat + (Math.random() - 0.5) * 0.003,
        lng: p.lng + (Math.random() - 0.5) * 0.003,
      });
    }
  }
  return out;
})();
