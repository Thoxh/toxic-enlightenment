export type Drink = {
  name: string
  price: number
  ingredients: { name: string; amount: string; unit: string }[]
}

export type DrinkCategory = {
  name: string
  drinks: Drink[]
}

export const drinkCategories: DrinkCategory[] = [
  {
    name: "Alkoholfrei",
    drinks: [
      {
        name: "Wasser (still)",
        price: 250,
        ingredients: [{ name: "Wasser (still)", amount: "0,4", unit: "Liter" }],
      },
      {
        name: "Wasser (spritzig)",
        price: 250,
        ingredients: [{ name: "Wasser (spritzig)", amount: "0,4", unit: "Liter" }],
      },
      {
        name: "Coca Cola",
        price: 350,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Coca Cola", amount: "0,4", unit: "Liter" },
        ],
      },
      {
        name: "Coca Cola Zero",
        price: 350,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Coca Cola Zero", amount: "0,4", unit: "Liter" },
        ],
      },
      {
        name: "Sprite",
        price: 350,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Sprite", amount: "0,4", unit: "Liter" },
        ],
      },
      {
        name: "Red Bull",
        price: 400,
        ingredients: [{ name: "Red Bull", amount: "1", unit: "Dose" }],
      },
    ],
  },
  {
    name: "Bier",
    drinks: [
      {
        name: "Berliner Kindl",
        price: 450,
        ingredients: [{ name: "Berliner Kindl", amount: "1", unit: "Flasche" }],
      },
      {
        name: "Corona",
        price: 400,
        ingredients: [
          { name: "Corona", amount: "1", unit: "Flasche" },
          { name: "Limette", amount: "1", unit: "Stück" },
        ],
      },
    ],
  },
  {
    name: "Cocktails",
    drinks: [
      {
        name: "Toxic",
        price: 700,
        ingredients: [
          { name: "Limetten", amount: "2", unit: "Stück" },
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Blue Curacao", amount: "2", unit: "cl" },
          { name: "Maracuja", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Cuba Libre",
        price: 850,
        ingredients: [
          { name: "Limetten", amount: "2", unit: "Stück" },
          { name: "Rohrzucker", amount: "1", unit: "Teelöffel" },
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Havanna Club", amount: "4", unit: "cl" },
          { name: "Coca Cola", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Mojito",
        price: 850,
        ingredients: [
          { name: "Limetten", amount: "2", unit: "Stück" },
          { name: "Rohrzucker", amount: "1", unit: "Teelöffel" },
          { name: "Minzblätter", amount: "2", unit: "Stück" },
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Havanna Club", amount: "4", unit: "cl" },
          { name: "Wasser (spritzig)", amount: "Rest", unit: "" },
        ],
      },
    ],
  },
  {
    name: "Long Drinks",
    drinks: [
      {
        name: "Vodka Red Bull",
        price: 800,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Red Bull", amount: "1", unit: "Dose" },
        ],
      },
      {
        name: "Vodka Sprite",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Sprite", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Vodka Cola",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Coca Cola", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Vodka Lemon",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Bitter Lemon", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Vodka Soda",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Vodka", amount: "4", unit: "cl" },
          { name: "Wasser (spritzig)", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Havanna Cola",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Havanna Club", amount: "4", unit: "cl" },
          { name: "Coca Cola", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Jim Beam Cola",
        price: 750,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Jim Beam", amount: "4", unit: "cl" },
          { name: "Coca Cola", amount: "Rest", unit: "" },
        ],
      },
      {
        name: "Wildberry Lillet",
        price: 800,
        ingredients: [
          { name: "Eiswürfel", amount: "1/2", unit: "Becher" },
          { name: "Lillet", amount: "4", unit: "cl" },
          { name: "Wildberry Mix", amount: "2-3", unit: "Stück" },
          { name: "Schweppes Wildberry", amount: "Rest", unit: "" },
        ],
      },
    ],
  },
  {
    name: "Shots",
    drinks: [
      {
        name: "Vodka",
        price: 250,
        ingredients: [{ name: "Vodka", amount: "4", unit: "cl" }],
      },
      {
        name: "Berliner Luft",
        price: 250,
        ingredients: [{ name: "Berliner Luft", amount: "4", unit: "cl" }],
      },
      {
        name: "Tequila",
        price: 250,
        ingredients: [{ name: "Tequila", amount: "4", unit: "cl" }],
      },
      {
        name: "Fruity Love",
        price: 200,
        ingredients: [{ name: "Fruity Love (Berentzener)", amount: "4", unit: "cl" }],
      },
      {
        name: "Tropical Flirt",
        price: 200,
        ingredients: [{ name: "Tropical Flirt (Berentzener)", amount: "4", unit: "cl" }],
      },
      {
        name: "Berry Kiss",
        price: 200,
        ingredients: [{ name: "Berry Kiss (Berentzener)", amount: "4", unit: "cl" }],
      },
    ],
  },
]
