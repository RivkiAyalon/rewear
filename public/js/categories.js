const CATEGORIES = {
  women: {
    label: 'Women',
    categories: {
      clothing: { label: 'Clothing', types: {
        dresses: 'Dresses', skirts: 'Skirts', tops: 'Tops & Shirts',
        pants: 'Pants', knitwear: 'Knitwear', jackets: 'Coats & Jackets',
        sets: 'Sets', swimwear: 'Swimwear', sportswear: 'Sportswear', other: 'Other' }},
      shoes: { label: 'Shoes', types: {
        heels: 'Heels', flats: 'Flats', sneakers: 'Sneakers',
        boots: 'Boots', sandals: 'Sandals' }},
      accessories: { label: 'Accessories', types: {
        bags: 'Bags', jewelry: 'Jewelry', belts: 'Belts',
        hair: 'Hair Accessories', glasses: 'Glasses' }}
    }
  },
  men: {
    label: 'Men',
    categories: {
      clothing: { label: 'Clothing', types: {
        shirts: 'Shirts & T-Shirts', pants: 'Pants', suits: 'Suits & Blazers',
        knitwear: 'Knitwear', jackets: 'Jackets & Coats',
        swimwear: 'Swimwear', other: 'Other' }},
      shoes: { label: 'Shoes', types: {
        sneakers: 'Sneakers', formal: 'Formal Shoes',
        boots: 'Boots', sandals: 'Sandals' }},
      accessories: { label: 'Accessories', types: {
        belts: 'Belts', hats: 'Hats', bags: 'Bags', glasses: 'Glasses' }}
    }
  },
  kids: {
    label: 'Kids',
    categories: {
      clothing: { label: 'Clothing', types: {
        girls: 'Girls', boys: 'Boys', baby: 'Baby', costumes: 'Costumes' }},
      shoes: { label: 'Shoes', types: {
        girlsShoes: 'Girls Shoes', boysShoes: 'Boys Shoes' }},
      accessories: { label: 'Accessories', types: {
        bags: 'Bags', hats: 'Hats', other: 'Other' }}
    }
  }
};

const SIZES = {
  clothing:     ['XS/34','S/36','M/38','L/40','XL/42','XXL/44','One Size'],
  shoes:        ['36','37','38','39','40','41','42','43','44','45'],
  accessories:  ['One Size'],
  kidsClothing: ['2Y','4Y','6Y','8Y','10Y','12Y','14Y'],
  kidsShoes:    ['24','26','28','30','32','34','36','38']
};

const CONDITIONS = {
  'new-tags':  'New with tags',
  'new':       'New',
  'excellent': 'Excellent',
  'very-good': 'Very good',
  'good':      'Good'
};

// Allows this file to be used both in the browser and in seed.js
if (typeof module !== 'undefined') {
  module.exports = { CATEGORIES, SIZES, CONDITIONS };
}