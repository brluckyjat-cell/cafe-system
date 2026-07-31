
// Chai Ceremony Cafe - Firebase Config & Hybrid Storage Helper

const firebaseConfig = {
  apiKey: "AIzaSyB_YourActualApiKeyHere_ChaiCeremony",
  authDomain: "chai-ceremony-cafe.firebaseapp.com",
  databaseURL: "https://chai-ceremony-cafe-default-rtdb.firebaseio.com",
  projectId: "chai-ceremony-cafe",
  storageBucket: "chai-ceremony-cafe.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();

// Default Seed Data
const DEFAULT_MENU_ITEMS = [
  {
    id: "prod_1",
    title: "Kulhad Masala Chai",
    category: "Chai",
    price: 30,
    description: "Brewed with fresh ginger, cardamom, cinnamon, and whole spices served in traditional clay kulhad.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_2",
    title: "Saffron Royal Elaichi Chai",
    category: "Chai",
    price: 50,
    description: "Infused with premium Kashmiri saffron strands and ground green cardamom.",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_3",
    title: "Jodhpuri Cold Coffee",
    category: "Coffee",
    price: 90,
    description: "Thick, creamy iced coffee topped with dark chocolate shavings and vanilla scoop.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_4",
    title: "Royal Paneer Tikka Pizza",
    category: "Pizza",
    price: 240,
    description: "Hand-tossed crust with spicy cottage cheese cubes, bell peppers, onions, and melted mozzarella.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_5",
    title: "Jaipur Spicy Aloo Patty",
    category: "Patties",
    price: 40,
    description: "Flaky golden puff pastry stuffed with crushed spiced potatoes and coriander.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_6",
    title: "Maharaja Veg Loaded Burger",
    category: "Burger",
    price: 110,
    description: "Double crispy herb patty with cheese slice, jalapeños, mint chutney, and fresh tomatoes.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_7",
    title: "Rose Falooda Kulfi",
    category: "Dessert",
    price: 120,
    description: "Rich Rabri with sweet vermicelli, basil seeds, rose syrup, and slow-churned pista kulfi.",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  },
  {
    id: "prod_8",
    title: "Fresh Lime Soda",
    category: "Cold Drinks",
    price: 60,
    description: "Sparkling soda with squeezed fresh key lime, black salt, and mint leaves.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    isVeg: true,
    inStock: true
  }
];

const DEFAULT_CATEGORIES = ["All", "Chai", "Coffee", "Pizza", "Burger", "Patties", "Cold Drinks", "Dessert", "Cigarette"];

const DEFAULT_SETTINGS = {
  cafeName: "Chai Ceremony Cafe",
  tagline: "Sip • Relax • Connect",
  address: "Near Hawa Mahal Road, Jaipur, Rajasthan",
  contactPhone: "+91 98765 43210",
  openingTime: "08:00",
  closingTime: "22:00",
  packagingCharge: 10,
  logoUrl: "https://cdn-icons-png.flaticon.com/512/924/924514.png"
};
