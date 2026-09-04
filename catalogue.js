export const materials = [
  { id: "acrylic", label: "Acrylic" },
  { id: "wood", label: "Wood" }
];

export const designs = [
  {
    id: "ppec_logo",
    name: "PPEC Logo",
    image: "assets/images/mockups/ppec-logo-split-materials.png",
    referenceImage: "assets/images/products/ppec-logo.png",
    alt: "PPEC logo badge mock-up split between wood and acrylic finishes",
    referenceAlt: "PPEC logo badge artwork with four seasonal quadrants",
    note: "Main Phantom Peak Explorers Club logo"
  },
  {
    id: "explorers_card",
    name: "Explorers Card",
    image: "assets/images/mockups/explorers-card-split-materials.png",
    referenceImage: "assets/images/products/explorers-card.png",
    alt: "Explorers Card badge mock-up split between wood and acrylic finishes",
    referenceAlt: "Pink Phantom Peak Explorers Club card-style badge artwork",
    note: "Card-style PPEC design"
  },
  {
    id: "curiosity",
    name: "Curiosity",
    image: "assets/images/mockups/curiosity-split-materials.png",
    referenceImage: "assets/images/products/curiosity.png",
    alt: "Curiosity badge mock-up split between wood and acrylic finishes",
    referenceAlt: "Round Phantom Peak Explorers Club Curiosity badge artwork",
    note: "Our original design before we found our final logo"
  },
  {
    id: "ppec_pride_logo",
    name: "PPEC Pride Logo",
    image: "assets/images/mockups/ppec-pride-logo-split-materials.png",
    referenceImage: "assets/images/products/ppec-pride-logo.png",
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
