export const materials = [
  { id: "acrylic", label: "Acrylic" },
  { id: "wood", label: "Wood" }
];

export const designs = [
  {
    id: "ppec_logo",
    name: "PPEC Logo",
    image: "assets/images/optimised/ppec-logo-split-materials.webp",
    alt: "PPEC logo badge mock-up split between wood and acrylic finishes",
    note: "Main Phantom Peak Explorers Club logo"
  },
  {
    id: "explorers_card",
    name: "Explorers Card",
    image: "assets/images/optimised/explorers-card-split-materials.webp",
    alt: "Explorers Card badge mock-up split between wood and acrylic finishes",
    note: "Card-style PPEC design"
  },
  {
    id: "curiosity",
    name: "Curiosity",
    image: "assets/images/optimised/curiosity-split-materials.webp",
    alt: "Curiosity badge mock-up split between wood and acrylic finishes",
    note: "Our original design before we found our final logo"
  },
  {
    id: "ppec_pride_logo",
    name: "PPEC Pride Logo",
    image: "assets/images/optimised/ppec-pride-logo-split-materials.webp",
    alt: "PPEC Pride Logo badge mock-up split between wood and acrylic finishes",
    note: "Progress Pride version of the main logo"
  }
];

export const variants = designs.flatMap((design) =>
  materials.map((material) => ({
    key: `${design.id}_${material.id}`,
    designId: design.id,
    designName: design.name,
    materialId: material.id,
    materialName: material.label
  }))
);
