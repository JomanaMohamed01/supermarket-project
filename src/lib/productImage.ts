function normalizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const imagesByName: Record<string, string> = {
  "beef sausages": "/images/meat/beef-sausages-2.jpg",
  "beef steak": "/images/meat/beef-steak.jpg",
  "lamb chops": "/images/meat/lamb-chops.jpg",
  "minced beef": "/images/meat/minced-beef.jpg",
  "chicken breast": "/images/chicken/chicken-breast.jpg",
  "chicken thighs": "/images/chicken/chicken-thighs.jpg",
  "chicken wings": "/images/chicken/chicken-wings-2.jpg",
  "whole chicken": "/images/chicken/whole-chicken.jpg",
  "cod fillet": "/images/fish/cod-fillet.jpg",
  "salmon fillet": "/images/fish/salmon-fillet.jpg",
  shrimp: "/images/fish/shrimp.jpg",
  "tuna steak": "/images/fish/tuna-steak.jpg",
  "canned beans": "/images/canned-food/beans.jpg",
  "canned corn": "/images/canned-food/corn.jpg",
  "canned tuna": "/images/canned-food/tuna.jpg",
  "tomato paste": "/images/canned-food/tomato-paste.jpg",
  "cat wet food": "/images/pet-foods/cat-wet-food.jpg",
  "dog treats": "/images/pet-foods/dog-treats.jpg",
  "dry cat food": "/images/pet-foods/cat-dry-food.jpg",
  "dry dog food": "/images/pet-foods/dog-dry-food.jpg",
  cucumbers: "/images/vegetables/cucumbers.jpg",
  lettuce: "/images/vegetables/lettuce.jpg",
  onions: "/images/vegetables/onion.jpg",
  potatoes: "/images/vegetables/potato.jpg",
  tomatoes: "/images/vegetables/tomato.jpg",
  apples: "/images/fruits/apple.jpg",
  bananas: "/images/fruits/banana.jpg",
  grapes: "/images/fruits/grapes.jpg",
  oranges: "/images/fruits/oranges.jpg",
  strawberries: "/images/fruits/strawberry.jpg",
  "black beans": "/images/legumes/black-beans.jpg",
  chickpeas: "/images/legumes/chickpeas.jpg",
  lentils: "/images/legumes/lentils.jpg",
  "white beans": "/images/legumes/white-beans.jpg",
  fusilli: "/images/pastas/fusilli.jpg",
  macaroni: "/images/pastas/macaroni.jpg",
  penne: "/images/pastas/penne.jpg",
  spaghetti: "/images/pastas/spaghetti.jpg",
  butter: "/images/dairy/butter.jpg",
  "cheddar cheese": "/images/dairy/cheddar.jpg",
  "eggs 12": "/images/dairy/eggs.jpg",
  "milk 1l": "/images/dairy/milk.jpg",
  yogurt: "/images/dairy/yogurt.jpg",
};

export function productImageSrc(name: string, imageUrl?: string | null) {
  const stored = imageUrl?.trim();
  if (stored) return stored;
  return imagesByName[normalizeName(name)] ?? null;
}
