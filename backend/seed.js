import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import Region from "./models/region.model.js";
import User from "./models/user.model.js";
import chef from "./models/chef.model.js";
import Item from "./models/item.model.js";
import bcrypt from "bcryptjs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(source, folder) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.includes("your_cloudinary")) {
        return source;
    }
    try {
        const result = await cloudinary.uploader.upload(source, {
            folder: `swaava/${folder}`,
            transformation: [{ width: 600, height: 600, crop: "fill" }],
        });
        console.log(`  ☁️  Uploaded: ${result.public_id}`);
        return result.secure_url;
    } catch (err) {
        console.log(`  ⚠️  Upload failed, using source image: ${err.message}`);
        return source;
    }
}

// 12 Indian States
const REGIONS = [
    {
        name: "Punjab",
        description: "Heartland of golden fields, rich makhan, aromatic tandoor dishes, and robust warmth.",
        sourceImg: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop",
        famousDishes: ["Amritsari Kulcha", "Sarson da Saag", "Makki di Roti", "Punjabi Rajma", "Chole"],
        tags: [{ icon: "breakfast_dining", label: "Tandoori Classics" }, { icon: "local_dining", label: "Dairy-Rich Dishes" }]
    },
    {
        name: "Andhra Pradesh",
        description: "Known for bold fiery spices, tangy gongura, coastal seafood, and age-old culinary pride.",
        sourceImg: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop",
        famousDishes: ["Gongura Pachadi", "Pulihora", "Andhra Chicken", "Pesarattu", "Gutti Vankaya"],
        tags: [{ icon: "local_fire_department", label: "Fiery Spices" }, { icon: "set_meal", label: "Coastal Delicacies" }]
    },
    {
        name: "Telangana",
        description: "The royal Nizami legacy meets rustic Deccan hearth cooking with bold aromas.",
        sourceImg: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop",
        famousDishes: ["Hyderabadi Biryani", "Sarva Pindi", "Mirchi Ka Salan", "Haleem", "Double Ka Meetha"],
        tags: [{ icon: "local_fire_department", label: "Spicy Curries" }, { icon: "set_meal", label: "Biryani Capital" }]
    },
    {
        name: "Tamil Nadu",
        description: "Aromatic filter coffee, fragrant curry leaves, steaming tiffins, and legendary Chettinad masalas.",
        sourceImg: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&h=400&fit=crop",
        famousDishes: ["Pongal", "Idiyappam", "Chettinad Chicken", "Sambar", "Parotta"],
        tags: [{ icon: "local_cafe", label: "Filter Coffee" }, { icon: "set_meal", label: "Chettinad Delicacies" }]
    },
    {
        name: "Kerala",
        description: "God's Own Country blessed with coconut milk, Malabar spices, seafood, and soft appams.",
        sourceImg: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop",
        famousDishes: ["Appam", "Kerala Parotta", "Avial", "Puttu", "Malabar Biryani"],
        tags: [{ icon: "set_meal", label: "Seafood Specials" }, { icon: "eco", label: "Ayurvedic Touch" }]
    },
    {
        name: "Karnataka",
        description: "Sweet and spicy balances, fragrant filter roasts, soft neer dosas, and Karavali seafood.",
        sourceImg: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop",
        famousDishes: ["Bisi Bele Bath", "Mysore Masala Dosa", "Ragi Mudde", "Neer Dosa", "Mangalorean Fish Curry"],
        tags: [{ icon: "local_cafe", label: "Coffee Culture" }, { icon: "eco", label: "Millet Cuisine" }]
    },
    {
        name: "Maharashtra",
        description: "From spicy Kolhapuri rassas and iconic street bites to festive puran poli and coastal curries.",
        sourceImg: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop",
        famousDishes: ["Misal Pav", "Vada Pav", "Puran Poli", "Pav Bhaji", "Kolhapuri Chicken"],
        tags: [{ icon: "local_fire_department", label: "Goda Masala" }, { icon: "set_meal", label: "Konkan Seafood" }]
    },
    {
        name: "Gujarat",
        description: "A celebration of vegetarian mastery balancing sweetness, delicate crunch, and wholesome grains.",
        sourceImg: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop",
        famousDishes: ["Dhokla", "Thepla", "Undhiyu", "Khandvi", "Gujarati Kadhi"],
        tags: [{ icon: "eco", label: "Pure Vegetarian" }, { icon: "local_dining", label: "Thali Feasts" }]
    },
    {
        name: "Rajasthan",
        description: "Royal Rajputana kitchens and desert resourcefulness that gave birth to legendary slow-cooked feasts.",
        sourceImg: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop",
        famousDishes: ["Dal Baati Churma", "Gatte Ki Sabzi", "Ker Sangri", "Laal Maas", "Pyaaz Kachori"],
        tags: [{ icon: "local_fire_department", label: "Laal Maas" }, { icon: "history_edu", label: "Royal Recipes" }]
    },
    {
        name: "West Bengal",
        description: "Subtle panch phoron, prized mustard oil, freshwater fish delicacies, and heavenly sweets.",
        sourceImg: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop",
        famousDishes: ["Kosha Mangsho", "Mishti Doi", "Shorshe Ilish", "Luchi", "Cholar Dal"],
        tags: [{ icon: "set_meal", label: "Seafood Masterpieces" }, { icon: "icecream", label: "Sweet Delicacies" }]
    },
    {
        name: "Odisha",
        description: "Ancient Jagannath Mahaprasad roots, delicate mustard curries, soothing pakhala, and burnt chhena sweets.",
        sourceImg: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop",
        famousDishes: ["Dalma", "Pakhala Bhata", "Chhena Poda", "Macha Ghanta", "Dahi Pakhala"],
        tags: [{ icon: "temple_hindu", label: "Mahaprasad Heritage" }, { icon: "eco", label: "Soothing Fermented Meals" }]
    },
    {
        name: "Uttar Pradesh",
        description: "The zenith of Awadhi dum cooking, melt-in-mouth kebabs, and timeless sacred Varanasi ghat snacks.",
        sourceImg: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop",
        famousDishes: ["Lucknowi Biryani", "Galouti Kebab", "Kachori Sabzi", "Bedmi Puri", "Banarasi Tamatar Chaat"],
        tags: [{ icon: "restaurant", label: "Awadhi Dastarkhwan" }, { icon: "local_fire_department", label: "Banarasi Street Food" }]
    }
];

// Chef details and their authentic dishes
const CHEF_DATA = {
    "Punjab": [
        {
            name: "Chef Harpreet Kaur",
            city: "Amritsar",
            specialization: "Traditional Amritsari Kulcha & Tandoori Heritage",
            bio: "Preserving three generations of ancestral Amritsari recipes. My kitchen is warmed by real clay tandoors and churned white butter.",
            yearsOfExperience: "18 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 184 },
            dishes: [
                {
                    name: "Amritsari Kulcha",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 190,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "25-30 mins",
                    servingSize: "2 pieces with chana",
                    ingredients: ["Refined Flour", "Boiled Potatoes", "Pomegranate Seeds", "Ajwain", "Desi Butter"],
                    description: "Crisp multi-layered tandoor-baked flatbread stuffed with spiced potato and pomegranate seeds, topped with fresh makhan.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Sarson da Saag",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 280,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "40-45 mins",
                    servingSize: "2 persons",
                    ingredients: ["Fresh Mustard Leaves", "Bathua Greens", "Spinach", "Ginger", "Garlic", "Maize Flour", "White Butter"],
                    description: "Slow-simmered mustard greens with tender bathua, hand-churned with maize flour and finished with aromatic garlic tadka.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                },
                {
                    name: "Makki di Roti",
                    category: "Breads",
                    foodType: "veg",
                    vegetarian: true,
                    price: 90,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "15-20 mins",
                    servingSize: "2 pieces",
                    ingredients: ["Stone-ground Yellow Cornmeal", "Warm Water", "Carom Seeds", "Desi Ghee"],
                    description: "Hand-patted golden yellow cornmeal flatbreads griddled with pure desi ghee. The quintessential winter companion to Saag.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Manjit Singh",
            city: "Ludhiana",
            specialization: "Slow-Cooked Punjabi Heritage Curries",
            bio: "Cooking hearty homestyle Punjabi feasts inspired by the lush agricultural traditions of Ludhiana's grand family homes.",
            yearsOfExperience: "14 Years",
            profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 142 },
            dishes: [
                {
                    name: "Punjabi Rajma",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 230,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Chitra Kidney Beans", "Kashmiri Red Chilli", "Cumin", "Ginger", "Ripe Tomatoes", "Garam Masala"],
                    description: "Tender red kidney beans slow-simmered in a luscious onion-tomato gravy scented with roasted cumin and fresh ginger.",
                    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop"
                },
                {
                    name: "Chole",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 220,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "30-35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Kabuli Chana", "Black Tea Infusion", "Dried Pomegranate Seeds", "Amchur", "Punjabi Potli Masala"],
                    description: "Authentic dark and tangy chickpea curry cooked with black tea decoction, roasted anardana, and fragrant whole spices.",
                    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Andhra Pradesh": [
        {
            name: "Chef Lakshmi Devi",
            city: "Vijayawada",
            specialization: "Rayalaseema & Coastal Andhra Ruchulu",
            bio: "Passionate about bold Guntur chillies and authentic homemade pickles. Bringing the soul of Krishna delta home cooking to your table.",
            yearsOfExperience: "22 Years",
            profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 215 },
            dishes: [
                {
                    name: "Gongura Pachadi",
                    category: "Sides & Pickles",
                    foodType: "veg",
                    vegetarian: true,
                    price: 130,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "20 mins",
                    servingSize: "3-4 persons",
                    ingredients: ["Fresh Red Sorrel Leaves", "Guntur Red Chillies", "Garlic Cloves", "Sesame Oil", "Fenugreek Seeds"],
                    description: "The tangy, spicy crown jewel of Andhra cuisine. Fresh sour sorrel leaves pounded with fiery roasted Guntur chillies.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Pulihora",
                    category: "Rice Dishes",
                    foodType: "veg",
                    vegetarian: true,
                    price: 160,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Sona Masoori Rice", "Tamarind Pulp", "Roasted Peanuts", "Green Chillies", "Curry Leaves", "Mustard"],
                    description: "Traditional South Indian tamarind rice bursting with tangy tamarind paste, crunchy roasted peanuts, and tempered curry leaves.",
                    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=400&fit=crop"
                },
                {
                    name: "Andhra Chicken",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 340,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "40 mins",
                    servingSize: "2 persons",
                    ingredients: ["Country Chicken", "Guntur Chilli Powder", "Poppy Seeds", "Grated Coconut", "Shallots", "Curry Leaves"],
                    description: "Spicy and succulent country chicken curry cooked in an intensely aromatic gravy enriched with poppy seed paste and curry leaves.",
                    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Subba Rao",
            city: "Visakhapatnam",
            specialization: "Coastal Andhra Veg & Tiffin Specialties",
            bio: "Mastering coastal vegetable delicacies and nutritious Andhra breakfast traditions from the northern circars.",
            yearsOfExperience: "16 Years",
            profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 168 },
            dishes: [
                {
                    name: "Pesarattu",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "20 mins",
                    servingSize: "2 crepes with ginger chutney",
                    ingredients: ["Whole Green Gram Moong", "Ginger", "Green Chillies", "Cumin Seeds", "Onions"],
                    description: "Healthy and crispy crepe prepared from ground whole green moong dal, griddled with ginger, cumin, and fresh chopped onions.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Gutti Vankaya",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 240,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Baby Eggplants", "Roasted Peanuts", "Sesame Seeds", "Dry Coconut", "Tamarind", "Coriander Seeds"],
                    description: "Tender baby eggplants stuffed with a flavorful masala of roasted peanuts, sesame, and dry coconut, simmered to silky perfection.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Telangana": [
        {
            name: "Chef Begum Shahnaz",
            city: "Hyderabad",
            specialization: "Royal Nizami Dastarkhwan & Shahi Delicacies",
            bio: "Inherited secret royal spice blends from Old Hyderabad's culinary aristocracy. Handcrafting slow-cooked dum specialties with genuine saffron.",
            yearsOfExperience: "25 Years",
            profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 290 },
            dishes: [
                {
                    name: "Hyderabadi Biryani",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 390,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "50 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Aged Basmati Rice", "Tender Chicken", "Saffron Milk", "Crispy Barista Onions", "Mint", "Pure Ghee"],
                    description: "The world-famous royal dum biryani cooked in sealed handis with saffron, aged basmati, fried onions, and marinated chicken.",
                    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop"
                },
                {
                    name: "Mirchi Ka Salan",
                    category: "Sides & Pickles",
                    foodType: "veg",
                    vegetarian: true,
                    price: 180,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "2 persons",
                    ingredients: ["Large Green Chillies", "Peanuts", "Sesame Seeds", "Tamarind Pulp", "Coconut", "Cumin"],
                    description: "Pan-seared long mild green chillies bathed in a creamy, velvety peanut, sesame seed, and tamarind gravy. Essential with Biryani.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Double Ka Meetha",
                    category: "Desserts",
                    foodType: "veg",
                    vegetarian: true,
                    price: 170,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "2 persons",
                    ingredients: ["Milk Bread Croutons", "Reduced Milk Rabri", "Cardamom", "Saffron", "Pistachios", "Almonds"],
                    description: "Hyderabadi festive bread pudding soaked in saffron-infused syrup and layered with thickened cardamom rabri and silvered dry fruits.",
                    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Venkatesh Goud",
            city: "Warangal",
            specialization: "Rustic Telangana Village & Festival Cooking",
            bio: "Bringing authentic Deccan village recipes cooked on clay skillets and slow embers to modern diners.",
            yearsOfExperience: "12 Years",
            profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 135 },
            dishes: [
                {
                    name: "Sarva Pindi",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 140,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "2 savoury pancakes",
                    ingredients: ["Rice Flour", "Chana Dal", "Roasted Peanuts", "Sesame Seeds", "Curry Leaves", "Green Chillies"],
                    description: "Traditional savory pancake of Telangana pressed onto a deep copper pan, studded with crunchy lentils, peanuts, and green chillies.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Haleem",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 360,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "60 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Broken Wheat", "Slow Cooked Meat", "Lentils", "Desi Ghee", "Cardamom", "Caramelized Onions", "Cashews"],
                    description: "Rich, velvety stew of pounded meat, broken wheat, and mixed lentils slow-cooked for 8 hours in ghee and fragrant whole spices.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Tamil Nadu": [
        {
            name: "Chef Karpagam Ammal",
            city: "Chennai",
            specialization: "Authentic Tamil Brahmin & Morning Tiffin Classics",
            bio: "Cooking with pure ghee, stone-ground podis, and family heirloom recipes passed down through five generations in Mylapore.",
            yearsOfExperience: "28 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 240 },
            dishes: [
                {
                    name: "Pongal",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 160,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "25 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Raw Rice", "Yellow Moong Dal", "Black Peppercorns", "Cumin", "Fresh Ginger", "Curry Leaves", "Cashews", "Desi Ghee"],
                    description: "Creamy comfort dish of rice and yellow moong lentils tempered with cracked black pepper, cumin, ginger, and ghee-roasted cashews.",
                    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&h=400&fit=crop"
                },
                {
                    name: "Idiyappam",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 140,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "4 string hoppers with coconut milk",
                    ingredients: ["Steamed Rice Flour", "Warm Water", "Fresh Grated Coconut", "Coconut Milk", "Cardamom"],
                    description: "Delicate steamed rice noodles pressed into tender nests, served with freshly pressed cardamom-scented coconut milk.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Sambar",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "2 persons",
                    ingredients: ["Toor Dal", "Drumsticks", "Shallots", "Tamarind", "Hand-ground Sambar Powder", "Hing", "Curry Leaves"],
                    description: "Hearty lentil stew brimming with drumsticks and pearl shallots, infused with freshly ground Madras coriander-chilli sambar podi.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Meenakshi Sundaram",
            city: "Madurai",
            specialization: "Fiery Chettinad & Madurai Street Feasts",
            bio: "Championing the legendary spices of Karaikudi and Madurai. From freshly roasted kalpasi to flaky layered street parottas.",
            yearsOfExperience: "17 Years",
            profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 195 },
            dishes: [
                {
                    name: "Chettinad Chicken",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 340,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Tender Chicken", "Star Anise", "Black Stone Flower Kalpasi", "Roasted Coconut", "Fennel Seeds", "Curry Leaves"],
                    description: "Famous fiery curry from the Chettinad region, flavored with fresh roasted coconut, black stone flower, and freshly cracked pepper.",
                    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop"
                },
                {
                    name: "Parotta",
                    category: "Breads",
                    foodType: "veg",
                    vegetarian: true,
                    price: 110,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "2 flaky parottas with salna",
                    ingredients: ["Refined Flour", "Layered Ghee", "Salt", "Special Street Salna Gravy"],
                    description: "Iconic flaky, multi-layered golden flatbread beaten by hand for maximum crispiness, served with flavorful empty salna.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Kerala": [
        {
            name: "Chef Marykutty Joseph",
            city: "Kottayam",
            specialization: "Central Travancore Home Recipes & Appams",
            bio: "Cooking comforting Syrian Christian and Travancore home meals with fresh garden spices and freshly grated local coconuts.",
            yearsOfExperience: "24 Years",
            profileImage: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 210 },
            dishes: [
                {
                    name: "Appam",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 140,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "3 appams",
                    ingredients: ["Fermented Raw Rice Batter", "Coconut Milk", "Yeast", "Hint of Sugar"],
                    description: "Lacy, bowl-shaped fermented rice hoppers with a soft spongy center and crispy paper-thin edges, perfect with stew.",
                    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop"
                },
                {
                    name: "Avial",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 220,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "30 mins",
                    servingSize: "2-3 persons",
                    ingredients: ["Ash Gourd", "Carrots", "Raw Banana", "Drumsticks", "Ground Coconut Paste", "Curd", "Coconut Oil", "Curry Leaves"],
                    description: "Nutritious traditional Kerala medley of indigenous vegetables cooked in coarse coconut-cumin paste and finished with raw coconut oil.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                },
                {
                    name: "Puttu",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "25 mins",
                    servingSize: "1 cylinder with kadala curry",
                    ingredients: ["Coarse Rice Flour", "Fresh Grated Coconut", "Steamed in Bamboo/Steel Mould"],
                    description: "Steamed cylinders of coarsely ground rice flour layered alternately with sweet freshly grated coconut, served with spicy black chana.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Fathima Beevi",
            city: "Kozhikode",
            specialization: "Malabar Coastal & Moplah Classics",
            bio: "Preserving the legendary spice-route culinary heritage of Calicut beach and Malabar family kitchens.",
            yearsOfExperience: "19 Years",
            profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 275 },
            dishes: [
                {
                    name: "Kerala Parotta",
                    category: "Breads",
                    foodType: "veg",
                    vegetarian: true,
                    price: 120,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "2 flaky parottas",
                    ingredients: ["Refined Wheat Flour", "Coconut Oil", "Warm Water", "Flaky Lamination Technique"],
                    description: "Flaky, spiral layered soft Malabar parotta pan-roasted in golden coconut oil. The ultimate comfort flatbread of Kerala.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Malabar Biryani",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 370,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "45 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Khaima Jeerakasala Small Grain Rice", "Tender Chicken", "Fried Cashews", "Kismis", "Malabar Garam Masala", "Ghee"],
                    description: "Fragrant dum biryani made with tiny aromatic Jeerakasala rice, tender chicken masala, golden fried cashews, and sweet sultanas.",
                    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Karnataka": [
        {
            name: "Chef Shanthala Bhat",
            city: "Bengaluru",
            specialization: "South Karnataka & Mysore Palace Feasts",
            bio: "Rooted in authentic Brahmin culinary precision, aromatic freshly ground spice blends, and the rich culinary heritage of Old Mysuru.",
            yearsOfExperience: "21 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 198 },
            dishes: [
                {
                    name: "Bisi Bele Bath",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 200,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "30 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Rice", "Toor Dal", "Country Vegetables", "Kapok Buds Maratti Moggu", "Tamarind", "Khara Boondi", "Ghee"],
                    description: "Piping hot lentil and rice specialty simmered with garden vegetables, tamarind, and the signature Karnataka maratti moggu spice blend.",
                    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=400&fit=crop"
                },
                {
                    name: "Mysore Masala Dosa",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 170,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "20 mins",
                    servingSize: "1 large crispy dosa",
                    ingredients: ["Crispy Fermented Rice Batter", "Spicy Red Garlic Chutney", "Potato Onion Palya", "Pure Desi Butter"],
                    description: "Golden crispy red dosa smeared inside with zesty red garlic chutney, filled with seasoned potato palya and crowned with fresh butter.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Ragi Mudde",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "25 mins",
                    servingSize: "2 steamed ragi balls",
                    ingredients: ["Finger Millet Ragi Flour", "Water", "Desi Ghee", "Accompanied by Bassaru Gravy"],
                    description: "Wholesome steamed finger millet balls packed with rural nutrition, eaten by dipping into aromatic spicy lentil-greens broth.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Savithri Hegde",
            city: "Mangaluru",
            specialization: "Coastal Karavali & Bunt Delicacies",
            bio: "Specialist in the delicate rice crepes and seafood wonders of Mangalore's scenic coastal belt.",
            yearsOfExperience: "16 Years",
            profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 172 },
            dishes: [
                {
                    name: "Neer Dosa",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 160,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "4 feather-light dosas",
                    ingredients: ["Soaked White Rice", "Fresh Coconut", "Sea Salt", "Coconut Chutney"],
                    description: "Feather-light, lace-soft crepes made from watery rice batter, melted on your tongue with fresh coconut chutney and jaggery.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Mangalorean Fish Curry",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 390,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Fresh Seer Fish", "Byadgi Chillies", "Coconut Milk", "Kudampuli", "Fenugreek Seeds", "Curry Leaves"],
                    description: "Tangy coastal fish curry prepared with sweet coconut milk, deep red Byadgi chillies, and sun-dried Malabar tamarind.",
                    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Maharashtra": [
        {
            name: "Chef Sunita Deshmukh",
            city: "Pune",
            specialization: "Authentic Puneri & Deshastha Maharashtrian Cuisine",
            bio: "Cooking traditional Marathi meals spiced with authentic stone-pounded Goda masala and wholesome rustic lentils.",
            yearsOfExperience: "20 Years",
            profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 212 },
            dishes: [
                {
                    name: "Misal Pav",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 170,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "25 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Sprouted Moth Beans", "Fiery Kat Gravy", "Crunchy Farsan", "Onions", "Lemon", "Buttered Pav"],
                    description: "Sprouted moth beans cooked in fiery spicy red rassa, topped with crunchy farsan, coriander, and served with soft buttered pav.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Puran Poli",
                    category: "Desserts",
                    foodType: "veg",
                    vegetarian: true,
                    price: 180,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "30 mins",
                    servingSize: "2 large polis",
                    ingredients: ["Chana Dal", "Organic Jaggery", "Nutmeg", "Green Cardamom", "Thin Wheat Crust", "Desi Ghee"],
                    description: "Sweet festive flatbread filled with a soft mixture of boiled yellow chana dal and aromatic jaggery, spiked with nutmeg and served with ghee.",
                    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop"
                },
                {
                    name: "Pav Bhaji",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 190,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Mashed Potatoes", "Green Peas", "Bell Peppers", "Tomatoes", "Special Pav Bhaji Masala", "Amul Butter", "Pav"],
                    description: "World-famous mashed spiced vegetable medley slow-simmered on large tawa with heaps of butter, served with crisp toasted pav buns.",
                    image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Anusaya Shinde",
            city: "Kolhapur",
            specialization: "Kolhapuri Royal Curries & Mumbai Street Food",
            bio: "Master of fiery Lavangi chillies and the iconic quick snacks that fuel the spirit of Maharashtra.",
            yearsOfExperience: "15 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 188 },
            dishes: [
                {
                    name: "Vada Pav",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 95,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "15 mins",
                    servingSize: "2 pieces",
                    ingredients: ["Spiced Potato Dumpling", "Gram Flour Batter", "Garlic Peanut Chutney", "Green Chilli", "Fresh Pav"],
                    description: "Mumbai's soul food: golden deep-fried spiced potato fritter sandwiched in fluffy pav with punchy dry garlic peanut chutney.",
                    image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop"
                },
                {
                    name: "Kolhapuri Chicken",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 350,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "40 mins",
                    servingSize: "2 persons",
                    ingredients: ["Farm Chicken", "Kolhapuri Lavangi Chillies", "Dry Coconut", "Sesame", "Coriander", "Ginger Garlic"],
                    description: "Bold and fiery chicken curry made with authentic roasted Kolhapuri red masala paste, dry coconut, and intense indigenous spices.",
                    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Gujarat": [
        {
            name: "Chef Hansa Patel",
            city: "Ahmedabad",
            specialization: "Surati & Kathiyawadi Traditional Thalis",
            bio: "Curating wholesome vegetarian spreads where sweetness balances tangy warmth in perfect harmony.",
            yearsOfExperience: "23 Years",
            profileImage: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 205 },
            dishes: [
                {
                    name: "Dhokla",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 140,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "25 mins",
                    servingSize: "4-6 pieces with chutney",
                    ingredients: ["Fermented Gram Flour", "Turmeric", "Green Chillies", "Mustard Seeds", "Curry Leaves", "Grated Coconut"],
                    description: "Pillowy, feather-soft steamed fermented gram flour cakes tempered with crackling mustard seeds, curry leaves, and green chillies.",
                    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop"
                },
                {
                    name: "Thepla",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 130,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "20 mins",
                    servingSize: "4 flatbreads with chundo",
                    ingredients: ["Whole Wheat Flour", "Fresh Fenugreek Methi", "Fresh Curd", "Turmeric", "Ajwain", "Sesame"],
                    description: "Wholesome spiced flatbreads kneaded with fresh chopped methi leaves and yogurt, griddled lightly with oil.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Undhiyu",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 310,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "50 mins",
                    servingSize: "2-3 persons",
                    ingredients: ["Surti Papdi", "Purple Yam", "Sweet Potato", "Baby Brinjal", "Fenugreek Muthias", "Fresh Coconut Herb Masala"],
                    description: "Winter specialty casserole of country vegetables, tender beans, and crispy fenugreek dumplings slow-cooked in earthenware.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Kokila Ben",
            city: "Surat",
            specialization: "Gujarati Snacks & Homestyle Kadhi",
            bio: "Celebrated for the silky perfection of Khandvi rolls and comforting sweet-tangy Kadhi.",
            yearsOfExperience: "18 Years",
            profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 160 },
            dishes: [
                {
                    name: "Khandvi",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "30 mins",
                    servingSize: "6 delicate rolls",
                    ingredients: ["Gram Flour Besan", "Sour Buttermilk", "Turmeric", "Mustard Tempering", "Fresh Coconut"],
                    description: "Silky, paper-thin rolled gram flour ribbons cooked with spiced buttermilk and garnished with toasted sesame and fresh coriander.",
                    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop"
                },
                {
                    name: "Gujarati Kadhi",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 170,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "20 mins",
                    servingSize: "2 persons",
                    ingredients: ["Fresh Yogurt", "Gram Flour", "Jaggery", "Ginger", "Cinnamon", "Cloves", "Curry Leaves"],
                    description: "Subtly sweet and tangy yogurt soup cooked with aromatic spices, ginger, and jaggery, tempered with cloves and curry leaves.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Rajasthan": [
        {
            name: "Chef Gayatri Rathore",
            city: "Jaipur",
            specialization: "Marwari Royal Kitchen & Baati Craft",
            bio: "Carrying forward the rich culinary traditions of Rajput royalty, crafting ghee-drenched baatis and heritage curries.",
            yearsOfExperience: "22 Years",
            profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 230 },
            dishes: [
                {
                    name: "Dal Baati Churma",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 340,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "45 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Whole Wheat Baatis", "Panchmel Five Lentil Dal", "Sweet Jaggery Churma", "Generous Desi Ghee"],
                    description: "The royal trio of crisp baked wheat balls dipped in hot desi ghee, spicy five-lentil dal, and rich sweet crumbly churma.",
                    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop"
                },
                {
                    name: "Gatte Ki Sabzi",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 230,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Gram Flour Dumplings", "Spiced Curd Gravy", "Fennel Seeds", "Ajwain", "Kasuri Methi"],
                    description: "Tender steamed chickpea flour dumplings simmered in a tangy yogurt gravy flavored with fennel seeds and dried fenugreek.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                },
                {
                    name: "Pyaaz Kachori",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 120,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "2 large kachoris with chutney",
                    ingredients: ["Flaky Flour Crust", "Caramelized Onions", "Fennel Seeds", "Amchur", "Tamarind Chutney"],
                    description: "Golden flaky pastry stuffed with seasoned caramelized onions and aromatic spices, deep-fried to crisp perfection.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Kanta Devi",
            city: "Jodhpur",
            specialization: "Desert Foraged Heritage & Royal Non-Veg",
            bio: "Specializing in the arid culinary wonders of the Thar desert, from sun-dried wild berries to intense Mathania mutton.",
            yearsOfExperience: "16 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 178 },
            dishes: [
                {
                    name: "Ker Sangri",
                    category: "Sides & Pickles",
                    foodType: "veg",
                    vegetarian: true,
                    price: 270,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "30 mins",
                    servingSize: "2 persons",
                    ingredients: ["Desert Ker Berries", "Sangri Bean Pods", "Whole Red Chillies", "Amchur", "Mustard Oil"],
                    description: "Exquisite desert delicacy of wild caper berries and desert tree beans sautéed with dried red chillies and raw mango powder.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                },
                {
                    name: "Laal Maas",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 450,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "55 mins",
                    servingSize: "2 persons",
                    ingredients: ["Tender Mutton", "Mathania Red Chillies", "Garlic Paste", "Mustard Oil", "Cloves", "Cardamom"],
                    description: "Legendary royal mutton curry slow-cooked with vibrant, smoky Mathania chillies, roasted garlic, and whole spices.",
                    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "West Bengal": [
        {
            name: "Chef Arundhati Banerjee",
            city: "Kolkata",
            specialization: "Zamindari Kitchen & Traditional Bengali Feasts",
            bio: "Dedicated to reviving the rich flavors of traditional Bengali bhuri-bhoj, slow-cooked in pure mustard oil.",
            yearsOfExperience: "20 Years",
            profileImage: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 245 },
            dishes: [
                {
                    name: "Kosha Mangsho",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 430,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "55 mins",
                    servingSize: "2 persons",
                    ingredients: ["Mutton Chops", "Mustard Oil", "Caramelized Onions", "Yogurt", "Garam Masala", "Bhuna Technique"],
                    description: "Slow-roasted tender mutton pieces cooked in rich, velvety dark onion-yogurt gravy until thick and richly aromatic.",
                    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop"
                },
                {
                    name: "Luchi",
                    category: "Breads",
                    foodType: "veg",
                    vegetarian: true,
                    price: 120,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "20 mins",
                    servingSize: "4 puffed luchis",
                    ingredients: ["Fine Maida Flour", "Ghee Moin", "Deep Fried in Pure Oil"],
                    description: "Delicate, golden-white puffed deep-fried flatbreads that melt gently in your mouth, a staple of Bengali celebrations.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Cholar Dal",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 200,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "30 mins",
                    servingSize: "2 persons",
                    ingredients: ["Chana Dal Bengal Gram", "Fried Coconut Shavings", "Raisins", "Ginger", "Hing", "Ghee Tempering"],
                    description: "Aromatic Bengal gram lentil preparation with crunchy coconut slivers, sweet raisins, and a fragrant hing-ghee tadka.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Debolina Ghosh",
            city: "Howrah",
            specialization: "Bengali Coastal Seafood & Sweet Confections",
            bio: "Cooking freshwater fish specialties and authentic earthen-pot sweets with heritage techniques.",
            yearsOfExperience: "15 Years",
            profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 185 },
            dishes: [
                {
                    name: "Shorshe Ilish",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 490,
                    spiceLevel: 3,
                    spicyLevel: 3,
                    preparationTime: "35 mins",
                    servingSize: "2 persons",
                    ingredients: ["Fresh Hilsa Fish", "Yellow & Black Mustard Paste", "Green Chillies", "Raw Kachi Ghani Mustard Oil"],
                    description: "The pride of Bengal: prized Hilsa fish steak gently steamed in an emulsified sharp mustard seed and green chilli gravy.",
                    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop"
                },
                {
                    name: "Mishti Doi",
                    category: "Desserts",
                    foodType: "veg",
                    vegetarian: true,
                    price: 140,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "15 mins",
                    servingSize: "2 earthen pots",
                    ingredients: ["Full Cream Milk", "Caramelized Jaggery & Sugar", "Earthen Clay Pot Culture"],
                    description: "Iconic creamy fermented sweet yogurt set slowly in porous terracotta pots for that authentic earthy flavor.",
                    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Odisha": [
        {
            name: "Chef Jayanti Mohapatra",
            city: "Bhubaneswar",
            specialization: "Jagannath Temple Mahaprasad & Homestyle Odia",
            bio: "Dedicated to the sacred and tranquil traditions of Odia home and temple culinary history, using minimal spices to highlight natural vegetable flavors.",
            yearsOfExperience: "24 Years",
            profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 215 },
            dishes: [
                {
                    name: "Dalma",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 220,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "30 mins",
                    servingSize: "2-3 persons",
                    ingredients: ["Toor Dal", "Raw Papaya", "Pumpkin", "Raw Banana", "Roasted Cumin-Chilli Powder", "Desi Ghee Phutan"],
                    description: "Ancient wholesome temple stew of lentils and seasonal raw vegetables, finished with roasted cumin-dry chilli powder and desi ghee.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                },
                {
                    name: "Pakhala Bhata",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 170,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "15 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Fermented Cooked Rice", "Water", "Curd", "Tempered Roasted Cumin", "Curry Leaves", "Served with Badi Chura"],
                    description: "Soothing fermented water rice dish seasoned with roasted cumin and curd, served with crispy sun-dried lentil badi chura.",
                    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=400&fit=crop"
                },
                {
                    name: "Chhena Poda",
                    category: "Desserts",
                    foodType: "veg",
                    vegetarian: true,
                    price: 210,
                    spiceLevel: 0,
                    spicyLevel: 0,
                    preparationTime: "35 mins",
                    servingSize: "2-3 persons",
                    ingredients: ["Fresh Cow Milk Chhena", "Semolina", "Caramelized Sugar", "Cardamom", "Cashews", "Baked in Sal Leaves"],
                    description: "The pride of Odisha: baked fresh cottage cheese dessert with a rich caramelized outer crust, wrapped in aromatic sal leaves.",
                    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Binodini Rout",
            city: "Puri",
            specialization: "Coastal Odia Seafood & Refreshing Pakhala Delights",
            bio: "Cooking the freshest catch from Chilika lake and traditional coastal dishes perfected along Puri's holy shores.",
            yearsOfExperience: "17 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 165 },
            dishes: [
                {
                    name: "Macha Ghanta",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 330,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "40 mins",
                    servingSize: "2 persons",
                    ingredients: ["Fresh Rohu Fish Head", "Chana Dal", "Potatoes", "Panch Phoron", "Ginger Garlic", "Odia Masala"],
                    description: "Classic festive Odia curry made with fried fresh fish pieces, yellow chana dal, and seasonal vegetables cooked in panch phoron.",
                    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop"
                },
                {
                    name: "Dahi Pakhala",
                    category: "Main Course",
                    foodType: "veg",
                    vegetarian: true,
                    price: 160,
                    spiceLevel: 1,
                    spicyLevel: 1,
                    preparationTime: "15 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Cooked Rice", "Whipped Curd", "Crushed Ginger", "Green Chillies", "Curry Leaves", "Mustard Tempering"],
                    description: "Cooling fermented rice blended with thick churned yogurt, crushed fresh ginger, green chillies, and crackling curry leaves.",
                    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=400&fit=crop"
                }
            ]
        }
    ],

    "Uttar Pradesh": [
        {
            name: "Chef Noor Jahan Begum",
            city: "Lucknow",
            specialization: "Royal Awadhi Dastarkhwan & Dum Cooking",
            bio: "Heir to the Nawabi culinary traditions of Lucknow, master of dum pukht cooking and delicate melt-in-mouth kebabs.",
            yearsOfExperience: "26 Years",
            profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop",
            rating: { average: 4.9, count: 280 },
            dishes: [
                {
                    name: "Lucknowi Biryani",
                    category: "Main Course",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 380,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "50 mins",
                    servingSize: "1-2 persons",
                    ingredients: ["Aged Basmati Rice", "Tender Marinated Mutton", "Yakhni Broth", "Kewra Water", "Saffron Milk", "Ghee"],
                    description: "Sublime Awadhi pakki biryani cooked gently in rich bone-marrow yakhni broth, infused with saffron and subtle kewra essence.",
                    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop"
                },
                {
                    name: "Galouti Kebab",
                    category: "Snacks",
                    foodType: "non veg",
                    vegetarian: false,
                    price: 360,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "35 mins",
                    servingSize: "4 tender kebabs",
                    ingredients: ["Finely Minced Mutton", "Raw Papaya Tenderizer", "Potli Masala of Spices", "Pure Desi Ghee"],
                    description: "Legendary Awadhi melt-in-mouth kebabs crafted for the toothless Nawab, smoked with cloves and pan-seared in golden desi ghee.",
                    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop"
                }
            ]
        },
        {
            name: "Chef Shivani Tiwari",
            city: "Varanasi",
            specialization: "Purvanchal & Holy Banarasi Ghat Delights",
            bio: "Bringing the timeless, vibrant street foods and pure ghee breakfast savories of Varanasi's ancient galis to your home.",
            yearsOfExperience: "18 Years",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop",
            rating: { average: 4.8, count: 190 },
            dishes: [
                {
                    name: "Kachori Sabzi",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 150,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "4 kachoris with spicy potato curry",
                    ingredients: ["Crispy Flour Crust", "Spiced Urad Dal Piththi", "Hing Aloo Rassa", "Fenugreek Chutney"],
                    description: "Crispy fried puris stuffed with spiced urad dal paste, served with fiery potato curry spiked with hing and amchur.",
                    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&h=400&fit=crop"
                },
                {
                    name: "Bedmi Puri",
                    category: "Breakfast",
                    foodType: "veg",
                    vegetarian: true,
                    price: 160,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "25 mins",
                    servingSize: "3 bedmi puris with aloo",
                    ingredients: ["Whole Wheat & Lentil Flour", "Fennel Seeds", "Kalonji", "Mathura Style Aloo Sabzi"],
                    description: "Puffed artisan whole wheat flatbreads enriched with coarsely ground spiced lentils, paired with rustic spiced potato curry.",
                    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop"
                },
                {
                    name: "Banarasi Tamatar Chaat",
                    category: "Snacks",
                    foodType: "veg",
                    vegetarian: true,
                    price: 120,
                    spiceLevel: 2,
                    spicyLevel: 2,
                    preparationTime: "20 mins",
                    servingSize: "1 earthen kulhad",
                    ingredients: ["Stewed Tomatoes", "Mashed Potatoes", "Roasted Cumin", "Sugar Syrup Infusion", "Crunchy Namkeen", "Served in Clay Kulhad"],
                    description: "Varanasi's legendary street chaat: spiced stewed tomatoes and potatoes in tangy sugar-cumin syrup, topped with crunchy namkeen.",
                    image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop"
                }
            ]
        }
    ]
};

async function seed() {
    try {
        const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/swaava";
        console.log(`Connecting to database at ${mongoUrl}...`);
        await mongoose.connect(mongoUrl);
        console.log("Connected to MongoDB for Swaava seeding!\n");

        // 0. Clean up old seeded data
        console.log("🧹 Cleaning old seeded data...");
        const oldChefs = await chef.find({});
        for (const ch of oldChefs) {
            await Item.deleteMany({ shop: ch._id });
            await Item.deleteMany({ chef: ch._id });
        }
        await chef.deleteMany({});
        await Item.deleteMany({});
        await Region.deleteMany({});
        await User.deleteMany({ email: /@(?:maakhana|swaava)\.com$/ });
        console.log(`  Removed old chefs, items, regions, and seeded user accounts.\n`);

        // 1. Seed Regions (States)
        console.log("📍 Seeding 12 Regional States...");
        for (const r of REGIONS) {
            console.log(`  State: ${r.name}`);
            const cloudUrl = await uploadToCloudinary(r.sourceImg, "regions");
            const { sourceImg, ...regionData } = r;
            regionData.image = cloudUrl;
            await Region.findOneAndUpdate({ name: r.name }, regionData, { upsert: true, new: true });
        }
        console.log(`✅ ${REGIONS.length} States seeded successfully!\n`);

        // 2. Seed HomeChefs and Authentic Dishes
        const hashedPw = await bcrypt.hash("chef12345", 10);
        let totalChefs = 0;
        let totalDishes = 0;

        for (const [stateName, chefs] of Object.entries(CHEF_DATA)) {
            console.log(`\n============================`);
            console.log(`📍 State: ${stateName}`);
            console.log(`============================`);

            for (const c of chefs) {
                console.log(`👨‍🍳 HomeChef: ${c.name} (${c.city}, ${stateName})`);
                const email = `${c.name.toLowerCase().replace(/[^a-z]/g, "")}@swaava.com`;
                let user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({
                        fullName: c.name,
                        email,
                        password: hashedPw,
                        role: "HomeCook"
                    });
                }

                const chefCloudUrl = await uploadToCloudinary(c.profileImage, "chefs");
                const isPureVegCalculated = c.dishes.every(d => d.vegetarian || d.foodType === "veg");

                const newChef = await chef.create({
                    name: c.name,
                    city: c.city,
                    state: stateName,
                    address: `${c.city}, ${stateName}`,
                    bio: c.bio,
                    specialty: c.specialization,
                    specialization: c.specialization,
                    experience: c.yearsOfExperience,
                    yearsOfExperience: c.yearsOfExperience,
                    homechef: user._id,
                    rating: c.rating || { average: 4.8, count: 50 },
                    totalReviews: c.rating?.count || 50,
                    mealsServed: Math.floor(100 + Math.random() * 400),
                    image: chefCloudUrl,
                    profileImage: chefCloudUrl,
                    isVerified: true,
                    available: true,
                    isPureVeg: isPureVegCalculated,
                    items: []
                });

                for (const d of c.dishes) {
                    console.log(`    🍛 Dish: ${d.name} (${d.category}) - ₹${d.price}`);
                    const dishCloudUrl = await uploadToCloudinary(d.image, "dishes");

                    const item = await Item.create({
                        name: d.name,
                        description: d.description,
                        category: d.category,
                        foodType: d.foodType || (d.vegetarian ? "veg" : "non veg"),
                        vegetarian: d.vegetarian !== undefined ? d.vegetarian : (d.foodType === "veg"),
                        price: d.price,
                        spiceLevel: d.spiceLevel || d.spicyLevel || 1,
                        spicyLevel: d.spicyLevel || d.spiceLevel || 1,
                        preparationTime: d.preparationTime || "25-30 mins",
                        servingSize: d.servingSize || "1-2 persons",
                        ingredients: d.ingredients || [],
                        isAvailable: true,
                        available: true,
                        image: dishCloudUrl,
                        state: stateName,
                        shop: newChef._id,
                        chef: newChef._id,
                        rating: {
                            average: Number((4.3 + Math.random() * 0.6).toFixed(1)),
                            count: Math.floor(15 + Math.random() * 60)
                        },
                        reviewCount: Math.floor(15 + Math.random() * 60),
                        orderCount: Math.floor(30 + Math.random() * 150)
                    });

                    newChef.items.push(item._id);
                    totalDishes++;
                }

                await newChef.save();
                totalChefs++;
            }
        }

        console.log(`\n======================================================`);
        console.log(`🎉 SWAAVA SEEDING COMPLETED SUCCESSFULLY!`);
        console.log(`   📍 States Seeded:    ${REGIONS.length}`);
        console.log(`   👨‍🍳 HomeChefs Seeded: ${totalChefs}`);
        console.log(`   🍛 Dishes Seeded:    ${totalDishes}`);
        console.log(`======================================================\n`);

        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
}

seed();