
// Chai Ceremony Cafe - Realtime Cloud Firebase Configuration

const firebaseConfig = {
  apiKey: "AIzaSyBbxtIQ8OkNC9f4rDAG42mo-r3AllDr2YI",
  authDomain: "my-cafe-app-fb7ba.firebaseapp.com",
  databaseURL: "https://my-cafe-app-fb7ba-default-rtdb.firebaseio.com",
  projectId: "my-cafe-app-fb7ba",
  storageBucket: "my-cafe-app-fb7ba.firebasestorage.app",
  messagingSenderId: "227548526389",
  appId: "1:227548526389:web:e20f674879277ddf12fe7c",
  measurementId: "G-SP32DJ8042"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();

// Categories extracted directly from Menu Card
const DEFAULT_CATEGORIES = [
  "All", 
  "Tea Special", 
  "Hot Coffee", 
  "Patties", 
  "Burgers", 
  "Pizza", 
  "Sandwiches", 
  "French Fries", 
  "Cold Drinks & Shakes"
];

// Complete Item List matching Menu Image
const DEFAULT_MENU_ITEMS = [
  // --- TEA SPECIAL (चाय) ---
  {
    id: "prod_1",
    title: "Ginger Tea (अदरक) - Small",
    category: "Tea Special",
    price: 15,
    description: "Fresh ginger brewed tea served in small cup.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_2",
    title: "Ginger Tea (अदरक) - Kulhad",
    category: "Tea Special",
    price: 30,
    description: "Fresh ginger brewed tea served in traditional clay kulhad.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_3",
    title: "Ginger Tea (अदरक) - Large",
    category: "Tea Special",
    price: 35,
    description: "Fresh ginger brewed tea in large serving.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_4",
    title: "Amruttulya Tea - Small",
    category: "Tea Special",
    price: 15,
    description: "Authentic spices infused Maharashtrian style tea.",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_5",
    title: "Amruttulya Tea - Kulhad",
    category: "Tea Special",
    price: 30,
    description: "Authentic Amruttulya tea served in clay kulhad.",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_6",
    title: "Amruttulya Tea - Large",
    category: "Tea Special",
    price: 35,
    description: "Authentic Amruttulya tea in large cup.",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_7",
    title: "Black Tea - Kulhad",
    category: "Tea Special",
    price: 35,
    description: "Strong aromatic herbal black tea in clay kulhad.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- HOT COFFEE (कॉफी) ---
  {
    id: "prod_8",
    title: "Classic Hot Coffee",
    category: "Hot Coffee",
    price: 40,
    description: "Rich frothy classic milk hot coffee.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_9",
    title: "Black Coffee",
    category: "Hot Coffee",
    price: 45,
    description: "Bold dark roasted espresso black coffee.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- PATTIES CORNER (पेटीज) ---
  {
    id: "prod_10",
    title: "Normal Veg Patties",
    category: "Patties",
    price: 25,
    description: "Crispy golden puff pastry with spiced potato stuffing.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_11",
    title: "Masala Veg Patties",
    category: "Patties",
    price: 35,
    description: "Crispy veg patties topped with tangy spicy sauces.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_12",
    title: "Tandoori Veg Patties (Spicy)",
    category: "Patties",
    price: 40,
    description: "Loaded with smoky tandoori sauce and herbs.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_13",
    title: "Normal Paneer Patties",
    category: "Patties",
    price: 30,
    description: "Flaky puff pastry stuffed with spiced cottage cheese.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_14",
    title: "Masala Paneer Patties",
    category: "Patties",
    price: 40,
    description: "Paneer patties loaded with extra masala spread.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_15",
    title: "Tandoori Paneer Patties",
    category: "Patties",
    price: 45,
    description: "Tandoori spiced grilled paneer stuffed puff.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- BURGERS (बर्गर) ---
  {
    id: "prod_16",
    title: "Crunchy Veg Burger",
    category: "Burgers",
    price: 40,
    description: "Crispy herb patty with mayo, onion & lettuce.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_17",
    title: "Cheesy Grilled Burger",
    category: "Burgers",
    price: 50,
    description: "Grilled burger loaded with liquid melted cheese.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_18",
    title: "Mafia Burger (Chef's Special)",
    category: "Burgers",
    price: 80,
    description: "Double patty loaded monster burger with extra cheese & sauces.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- PIZZA SPECIAL (पिज्जा) ---
  {
    id: "prod_19",
    title: "Classic Cheese Pizza",
    category: "Pizza",
    price: 70,
    description: "Freshly baked pizza loaded with mozzarella cheese.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_20",
    title: "Capsicum Pizza",
    category: "Pizza",
    price: 99,
    description: "Topped with crunchy bell peppers & cheese.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_21",
    title: "Onion Pizza",
    category: "Pizza",
    price: 99,
    description: "Topped with sweet crisp onions & melted mozzarella.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_22",
    title: "Capsicum & Paneer Pizza",
    category: "Pizza",
    price: 130,
    description: "Juicy paneer cubes & crunchy capsicum combination.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_23",
    title: "Supreme Tandoori Pizza (Chef's Special)",
    category: "Pizza",
    price: 169,
    description: "Fully loaded supreme pizza with tandoori sauce & veggies.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- SANDWICHES (सैंडविच) ---
  {
    id: "prod_24",
    title: "Veg Mayo Sandwich",
    category: "Sandwiches",
    price: 60,
    description: "Fresh bread stuffed with crunchy veg & creamy mayo.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_25",
    title: "Cheesy Masala Grilled Sandwich",
    category: "Sandwiches",
    price: 99,
    description: "Toasted grilled sandwich with spiced masala & cheese.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_26",
    title: "Royal Club Paneer Sandwich",
    category: "Sandwiches",
    price: 149,
    description: "Multi-layer triple decker grilled paneer club sandwich.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- FRENCH FRIES (फ्रेंच फ्राइज) ---
  {
    id: "prod_27",
    title: "Classic Salted Fries - Small",
    category: "French Fries",
    price: 70,
    description: "Golden crispy salted potato fries (Small).",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_28",
    title: "Classic Salted Fries - Large",
    category: "French Fries",
    price: 90,
    description: "Golden crispy salted potato fries (Large).",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_29",
    title: "Peri-Peri Spicy Fries",
    category: "French Fries",
    price: 110,
    description: "Fries tossed in spicy tangy peri-peri seasoning.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_30",
    title: "Cheese Loaded Fries",
    category: "French Fries",
    price: 130,
    description: "Crispy fries smothered in hot liquid cheese sauce.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },

  // --- COLD DRINKS & SHAKES ---
  {
    id: "prod_31",
    title: "Cold Coffee - Small",
    category: "Cold Drinks & Shakes",
    price: 35,
    description: "Thick chilled blended cold coffee.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_32",
    title: "Cold Coffee - Medium",
    category: "Cold Drinks & Shakes",
    price: 70,
    description: "Creamy cold coffee topped with chocolate drizzle.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_33",
    title: "Cold Coffee - Large (Special)",
    category: "Cold Drinks & Shakes",
    price: 100,
    description: "Special large cold coffee loaded with vanilla scoop.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_34",
    title: "Banana Shake",
    category: "Cold Drinks & Shakes",
    price: 70,
    description: "Fresh banana blended rich thick shake.",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_35",
    title: "KitKat Crunch Shake",
    category: "Cold Drinks & Shakes",
    price: 80,
    description: "Thick chocolate shake blended with KitKat wafer chunks.",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_36",
    title: "Chocolate Oreo Shake",
    category: "Cold Drinks & Shakes",
    price: 90,
    description: "Delicious Oreo cookie cream blended chocolate shake.",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  }
];

const DEFAULT_SETTINGS = {
  cafeName: "THE CAFE",
  tagline: "Fresh Brews & Delicious Bites",
  address: "Near Hawa Mahal Road, Jaipur, Rajasthan",
  contactPhone: "+91 98765 43210",
  openingTime: "08:00",
  closingTime: "22:00",
  packagingCharge: 10,
  logoUrl: "https://cdn-icons-png.flaticon.com/512/924/924514.png"
};
