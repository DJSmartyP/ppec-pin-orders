export const materials = [
  { id: "acrylic", label: "Acrylic" },
  { id: "wood", label: "Wood" }
];

export const designs = [
  {
    id: "ppec_logo",
    name: "PPEC Logo",
    image: "assets/images/products/ppec-logo.png",
    referenceImage: "assets/images/reference/ppec-logo-acrylic-reference.jpg",
    alt: "PPEC logo badge artwork with four seasonal quadrants",
    referenceAlt: "Finished PPEC logo acrylic badge reference photo",
    note: "Main Phantom Peak Explorers Club logo"
  },
  {
    id: "explorers_card",
    name: "Explorers Card",
    image: "assets/images/products/explorers-card.png",
    referenceImage: "assets/images/reference/explorers-card-acrylic-reference.jpg",
    alt: "Pink Phantom Peak Explorers Club card-style badge artwork",
    referenceAlt: "Finished Explorers Card acrylic badge reference photo",
    note: "Card-style PPEC design"
  },
  {
    id: "curiosity",
    name: "Curiosity",
    image: "assets/images/products/curiosity.png",
    referenceImage: "assets/images/reference/curiosity-acrylic-reference.jpg",
    alt: "Round Phantom Peak Explorers Club Curiosity badge artwork",
    referenceAlt: "Finished Curiosity acrylic badge reference photo",
    note: "Our original design before we found our final logo"
  },
  {
    id: "ppec_pride_logo",
    name: "PPEC Pride Logo",
    image: "assets/images/products/ppec-pride-logo.png",
    referenceImage: "assets/images/reference/ppec-pride-group-reference.jpg",
    alt: "Progress Pride version of the Phantom Peak Explorers Club logo",
    referenceAlt: "Finished PPEC Pride logo badge reference photo",
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
