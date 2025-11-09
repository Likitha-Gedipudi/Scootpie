import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(process.env.DATABASE_URL);

const products = [
  // Men's Fashion - Tops
  {
    name: 'Classic Cotton Oxford Shirt',
    brand: 'J.Crew',
    price: '79.50',
    retailer: 'J.Crew',
    category: 'tops',
    subcategory: 'shirts',
    imageUrl: '/fashionphotos/Male/brian-wangenheim-OjQ-ORM6YoY-unsplash.jpg',
    productUrl: 'https://jcrew.com',
    description: 'Timeless oxford shirt in premium cotton',
    availableSizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['White', 'Blue', 'Pink']),
    trending: true,
  },
  {
    name: 'Merino Wool Crewneck Sweater',
    brand: 'Everlane',
    price: '98.00',
    retailer: 'Everlane',
    category: 'tops',
    subcategory: 'sweaters',
    imageUrl: '/fashionphotos/Male/gabriel-martin-_4CkudcTYZs-unsplash.jpg',
    productUrl: 'https://everlane.com',
    description: 'Soft merino wool sweater for everyday wear',
    availableSizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Navy', 'Charcoal', 'Burgundy']),
    isNew: true,
  },
  {
    name: 'Premium Cotton T-Shirt',
    brand: 'Uniqlo',
    price: '14.90',
    retailer: 'Uniqlo',
    category: 'tops',
    subcategory: 'tshirts',
    imageUrl: '/fashionphotos/Male/gabriel-martin-gwWvr3ab44c-unsplash.jpg',
    productUrl: 'https://uniqlo.com',
    description: 'Supima cotton tee with perfect fit',
    availableSizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['White', 'Black', 'Gray', 'Navy']),
    trending: true,
  },
  
  // Men's Fashion - Bottoms
  {
    name: 'Slim Fit Chinos',
    brand: 'Bonobos',
    price: '88.00',
    retailer: 'Bonobos',
    category: 'bottoms',
    subcategory: 'pants',
    imageUrl: '/fashionphotos/Male/leon-elldot-Zc7i-7Mdn34-unsplash.jpg',
    productUrl: 'https://bonobos.com',
    description: 'Versatile chinos with stretch comfort',
    availableSizes: JSON.stringify(['28', '30', '32', '34', '36', '38']),
    colors: JSON.stringify(['Khaki', 'Navy', 'Gray']),
    isEditorial: true,
  },
  {
    name: 'Raw Selvedge Denim Jeans',
    brand: 'Naked & Famous',
    price: '155.00',
    retailer: 'Naked & Famous',
    category: 'bottoms',
    subcategory: 'jeans',
    imageUrl: '/fashionphotos/Male/moreno-matkovic-yz9b-Jlnna4-unsplash.jpg',
    productUrl: 'https://nakedandfamousdenim.com',
    description: 'Premium Japanese selvedge denim',
    availableSizes: JSON.stringify(['28', '30', '32', '34', '36']),
    colors: JSON.stringify(['Indigo']),
    isNew: true,
  },
  
  // Men's Fashion - Outerwear
  {
    name: 'Wool Blend Overcoat',
    brand: 'Spier & Mackay',
    price: '395.00',
    retailer: 'Spier & Mackay',
    category: 'outerwear',
    subcategory: 'coats',
    imageUrl: '/fashionphotos/Male/onur-senay-bdZaSRGEvcU-unsplash.jpg',
    productUrl: 'https://spierandmackay.com',
    description: 'Classic overcoat in premium wool blend',
    availableSizes: JSON.stringify(['36', '38', '40', '42', '44']),
    colors: JSON.stringify(['Charcoal', 'Camel', 'Navy']),
    isEditorial: true,
  },
  {
    name: 'Lightweight Bomber Jacket',
    brand: 'Alpha Industries',
    price: '165.00',
    retailer: 'Alpha Industries',
    category: 'outerwear',
    subcategory: 'jackets',
    imageUrl: '/fashionphotos/Male/onur-senay-OHdk91MEHM0-unsplash.jpg',
    productUrl: 'https://alphaindustries.com',
    description: 'Iconic MA-1 bomber jacket',
    availableSizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Olive', 'Black', 'Navy']),
    trending: true,
  },
  {
    name: 'Denim Trucker Jacket',
    brand: "Levi's",
    price: '98.00',
    retailer: "Levi's",
    category: 'outerwear',
    subcategory: 'jackets',
    imageUrl: '/fashionphotos/Male/onur-senay-WgnJZvvZSLQ-unsplash.jpg',
    productUrl: 'https://levis.com',
    description: 'Classic trucker jacket in premium denim',
    availableSizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['Light Wash', 'Dark Wash']),
    trending: true,
  },
  
  // Men's Fashion - Footwear
  {
    name: 'White Leather Sneakers',
    brand: 'Common Projects',
    price: '425.00',
    retailer: 'Common Projects',
    category: 'footwear',
    subcategory: 'sneakers',
    imageUrl: '/fashionphotos/Male/siddharth-vyas-0SuiPDyxFcE-unsplash.jpg',
    productUrl: 'https://commonprojects.com',
    description: 'Minimalist Italian leather sneakers',
    availableSizes: JSON.stringify(['7', '8', '9', '10', '11', '12']),
    colors: JSON.stringify(['White']),
    isEditorial: true,
  },
  {
    name: 'Chelsea Boots',
    brand: 'Thursday Boot Co',
    price: '199.00',
    retailer: 'Thursday Boot Co',
    category: 'footwear',
    subcategory: 'boots',
    imageUrl: '/fashionphotos/Male/umar-kashif-GTHfD5XbkSw-unsplash.jpg',
    productUrl: 'https://thursdayboots.com',
    description: 'Handcrafted leather Chelsea boots',
    availableSizes: JSON.stringify(['7', '8', '9', '10', '11', '12']),
    colors: JSON.stringify(['Brown', 'Black']),
    isNew: true,
  },
  
  // Additional Variety
  {
    name: 'Cashmere Blend Scarf',
    brand: 'Club Monaco',
    price: '79.50',
    retailer: 'Club Monaco',
    category: 'accessories',
    subcategory: 'scarves',
    imageUrl: '/fashionphotos/Female/arthur-a-RTpse_evdBo-unsplash.jpg',
    productUrl: 'https://clubmonaco.com',
    description: 'Soft cashmere blend scarf',
    availableSizes: JSON.stringify(['One Size']),
    colors: JSON.stringify(['Gray', 'Navy', 'Burgundy']),
    trending: false,
  },
  {
    name: 'Slim Fit Blazer',
    brand: 'SuitSupply',
    price: '399.00',
    retailer: 'SuitSupply',
    category: 'outerwear',
    subcategory: 'blazers',
    imageUrl: '/fashionphotos/Female/behrouz-sasani-AljGNR-MQmc-unsplash.jpg',
    productUrl: 'https://suitsupply.com',
    description: 'Tailored wool blazer with modern fit',
    availableSizes: JSON.stringify(['36', '38', '40', '42', '44']),
    colors: JSON.stringify(['Navy', 'Charcoal']),
    isEditorial: true,
  },
  {
    name: 'Performance Polo Shirt',
    brand: 'Lululemon',
    price: '88.00',
    retailer: 'Lululemon',
    category: 'tops',
    subcategory: 'polos',
    imageUrl: '/fashionphotos/Female/behrouz-sasani-sNIjfHYSwHc-unsplash.jpg',
    productUrl: 'https://lululemon.com',
    description: 'Moisture-wicking technical polo',
    availableSizes: JSON.stringify(['S', 'M', 'L', 'XL']),
    colors: JSON.stringify(['White', 'Navy', 'Gray']),
    isNew: true,
  },
  {
    name: 'Leather Belt',
    brand: 'Allen Edmonds',
    price: '98.00',
    retailer: 'Allen Edmonds',
    category: 'accessories',
    subcategory: 'belts',
    imageUrl: '/fashionphotos/Female/brian-wangenheim-bVxp_fqwbw0-unsplash.jpg',
    productUrl: 'https://allenedmonds.com',
    description: 'Full-grain leather dress belt',
    availableSizes: JSON.stringify(['30', '32', '34', '36', '38', '40']),
    colors: JSON.stringify(['Brown', 'Black']),
    trending: false,
  },
  {
    name: 'Quilted Vest',
    brand: 'Patagonia',
    price: '149.00',
    retailer: 'Patagonia',
    category: 'outerwear',
    subcategory: 'vests',
    imageUrl: '/fashionphotos/Female/freddy-rezvanian-BY9i9My-cbk-unsplash.jpg',
    productUrl: 'https://patagonia.com',
    description: 'Lightweight down vest for layering',
    availableSizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    colors: JSON.stringify(['Navy', 'Black', 'Forest Green']),
    isNew: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if products already exist
    const existingProducts = await sql`SELECT COUNT(*) FROM products`;
    const count = parseInt(existingProducts[0].count);

    if (count > 0) {
      console.log(`⚠️  Database already has ${count} products. Skipping seed.`);
      console.log('To re-seed, delete existing products first.');
      return;
    }

    // Insert products
    console.log(`📦 Inserting ${products.length} products...`);
    
    for (const product of products) {
      await sql`
        INSERT INTO products (
          name, brand, price, currency, retailer, category, subcategory,
          image_url, product_url, description, available_sizes, colors,
          in_stock, trending, is_new, is_editorial
        ) VALUES (
          ${product.name},
          ${product.brand},
          ${product.price},
          'USD',
          ${product.retailer},
          ${product.category},
          ${product.subcategory},
          ${product.imageUrl},
          ${product.productUrl},
          ${product.description},
          ${product.availableSizes}::jsonb,
          ${product.colors}::jsonb,
          true,
          ${product.trending || false},
          ${product.isNew || false},
          ${product.isEditorial || false}
        )
      `;
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Inserted ${products.length} products`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
