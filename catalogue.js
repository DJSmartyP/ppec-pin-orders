export const materials = [
  { id: "acrylic", label: "Acrylic" },
  { id: "wood", label: "Wood" }
];

export const designs = [
  {
    id: "ppec_logo",
    name: "PPEC Logo",
    image: "assets/images/optimised/ppec-logo-split-materials.webp",
    referenceImage: "assets/images/optimised/ppec-logo-art.webp",
    alt: "PPEC logo badge mock-up split between wood and acrylic finishes",
    referenceAlt: "PPEC logo badge artwork with four seasonal quadrants",
    note: "Main Phantom Peak Explorers Club logo"
  },
  {
    id: "explorers_card",
    name: "Explorers Card",
    image: "assets/images/optimised/explorers-card-split-materials.webp",
    referenceImage: "assets/images/optimised/explorers-card-art.webp",
    alt: "Explorers Card badge mock-up split between wood and acrylic finishes",
    referenceAlt: "Pink Phantom Peak Explorers Club card-style badge artwork",
    note: "Card-style PPEC design"
  },
  {
    id: "curiosity",
    name: "Curiosity",
    image: "assets/images/optimised/curiosity-split-materials.webp",
    referenceImage: "assets/images/optimised/curiosity-art.webp",
    alt: "Curiosity badge mock-up split between wood and acrylic finishes",
    referenceAlt: "Round Phantom Peak Explorers Club Curiosity badge artwork",
    note: "Our original design before we found our final logo"
  },
  {
    id: "ppec_pride_logo",
    name: "PPEC Pride Logo",
    image: "assets/images/optimised/ppec-pride-logo-split-materials.webp",
    referenceImage: "assets/images/optimised/ppec-pride-logo-art.webp",
    alt: "PPEC Pride Logo badge mock-up split between wood and acrylic finishes",
    referenceAlt: "Progress Pride version of the Phantom Peak Explorers Club logo",
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
