export const HERO_LOCATIONS = [
  {
    id: "jericoacoara",
    label: "Jericoacoara, Brazil",
    bg: "assets/hero-bg-jericoacoara-suite.png?v=20260602-1724",
    href: "#destinations",
  },
  {
    id: "roca",
    label: "Roca, Costa Rica",
    bg: "assets/hero-bg-roca.png?v=20260602-1243",
    href: "#destinations",
  },
  {
    id: "cabarete",
    label: "Cabarete, Dominican Republic",
    bg: "assets/hero-bg-cabarete.png?v=20260602-1410",
    href: "#destinations",
  },
  {
    id: "barcelona",
    label: "Barcelona, Spain",
    bg: "assets/hero-bg-barcelona-urban.png?v=20260602-1733",
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
    {
      name: "Jericoacoara",
      country: "Brazil",
      image: "assets/ecosystem-bg-jeri-lobby.png?v=20260602-1724",
    },
    { name: "Flora", country: "Costa Rica", image: "assets/ecosystem-bg-2.jpg" },
    {
      name: "Prea",
      country: "Brazil",
      image: "assets/ecosystem-bg-prea-tropical.png?v=20260602-1800",
    },
    {
      name: "Roca",
      country: "Costa Rica",
      image: "assets/ecosystem-bg-roca-tropical.png?v=20260602-1741",
    },
    {
      name: "Cabarete",
      country: "Dominican Republic",
      image: "assets/ecosystem-bg-cabarete-tropical.png?v=20260602-1756",
    },
  ],
  urban: [
    {
      name: "Dubai",
      country: "UAE",
      image: "assets/ecosystem-bg-dubai-urban.png?v=20260602-1738",
    },
    {
      name: "Barcelona",
      country: "Spain",
      image: "assets/ecosystem-bg-barcelona-urban.png?v=20260602-1758",
    },
    {
      name: "Cape Town",
      country: "South Africa",
      image: "assets/ecosystem-bg-capetown-urban.png?v=20260602-1736",
    },
  ],
  alpine: [],
};

export const OPENING_SLIDES = [
  {
    label: "Kite surfing",
    video: "assets/kitesurf.mp4?v=20260604-1346",
    layers: [
      "assets/opening-slide-1a.jpg",
      "assets/opening-slide-1b.jpg",
      "assets/opening-slide-1c.png?v=20260602-1430",
    ],
    image: "assets/opening-slide-1c.png?v=20260602-1430",
    mediaWidth: 696,
    mediaLeft: "calc(50% - 348px + 143px)",
    stacked: true,
  },
  {
    label: "Tropics exploration",
    video: "assets/tropics.mp4?v=20260604-1410",
    image: "assets/opening-slide-2.png?v=20260602-1430",
    mediaWidth: 394,
    mediaLeft: "calc(50% - 197px - 8px)",
  },
  {
    label: "Wellness",
    video: "assets/wellness.mp4?v=20260602-1446",
    image: "assets/opening-slide-3.png?v=20260602-1430",
    mediaWidth: 408,
    mediaLeft: "calc(50% - 204px - 1px)",
  },
];
