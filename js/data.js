export const HERO_LOCATIONS = [
  {
    id: "jericoacoara",
    label: "Jericoacoara, Brazil",
    bg: "assets/hero-bg-jericoacoara.jpg",
    href: "#destinations",
  },
  {
    id: "roca",
    label: "Roca, Costa Rica",
    bg: "assets/hero-bg-roca.png",
    href: "#destinations",
  },
  {
    id: "cabarete",
    label: "Cabarete, Dominican Republic",
    bg: "assets/hero-bg-cabarete.png",
    href: "#destinations",
  },
  {
    id: "dubai",
    label: "Dubai, UAE",
    bg: "assets/hero-bg-dubai.jpg",
    href: "#destinations",
  },
  {
    id: "cape-town",
    label: "Cape Town, South Africa",
    bg: "assets/hero-bg-cape-town.jpg",
    href: "#destinations",
  },
];

export const LOCATION_GROUPS = {
  tropical: [
    { name: "Jericoacoara", country: "Brazil", image: "assets/ecosystem-bg-1.jpg" },
    { name: "Flora", country: "Costa Rica", image: "assets/ecosystem-bg-2.jpg" },
    { name: "Prea", country: "Brazil", image: "assets/hero-bg-jericoacoara.jpg" },
    { name: "Roca", country: "Costa Rica", image: "assets/hero-bg-roca.png" },
    { name: "Cabarete", country: "Dominican Republic", image: "assets/opening-kite.jpg" },
  ],
  urban: [
    { name: "Dubai", country: "UAE", image: "assets/experience-dining.jpg" },
    { name: "Barcelona", country: "Spain", image: "assets/experience-wellness.jpg" },
    { name: "Cape Town", country: "South Africa", image: "assets/hero-bg-cape-town.jpg" },
  ],
  alpine: [],
};

export const OPENING_SLIDES = [
  {
    label: "Kite surfing",
    layers: [
      "assets/opening-slide-1a.jpg",
      "assets/opening-slide-1b.jpg",
      "assets/opening-slide-1c.jpg",
    ],
    image: "assets/opening-slide-1c.jpg",
    mediaWidth: 696,
    mediaLeft: "calc(50% - 348px + 143px)",
    stacked: true,
  },
  {
    label: "Tropics exploration",
    image: "assets/opening-slide-2.jpg",
    mediaWidth: 394,
    mediaLeft: "calc(50% - 197px - 8px)",
  },
  {
    label: "Wellness",
    image: "assets/opening-slide-3.jpg",
    mediaWidth: 408,
    mediaLeft: "calc(50% - 204px - 1px)",
  },
];
