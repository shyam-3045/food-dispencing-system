'use client'
import React, { useState } from 'react';
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}
import { ShoppingCart, Plus, Minus, CreditCard, ChefHat, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/config/axios';

interface Ingredient {
  id: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
}

interface Food {
  id: string;
  name: string;
  description: string;
  image: string;
  ingredients: Ingredient[];
}

interface CartItem {
  foodId: string;
  foodName: string;
  selectedIngredients: { id: string; name: string; price: number }[];
  quantity: number;
  totalPrice: number;
}

const FoodDispensingSystem: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  // Sample food data with no base prices
  const foods: Food[] = [
  {
    id: '1',
    name: 'Tomato Rice',
    description: 'Rice cooked with tomato puree and spices',
    image: '🍚',
    ingredients: [
      { id: 'rice', name: 'Rice', price: 40, available: true, category: 'base' },
      { id: 'tomato_puree', name: 'Tomato Puree', price: 20, available: true, category: 'sauce' },
      { id: 'onion_powder', name: 'Onion Powder', price: 15, available: true, category: 'spice' },
      { id: 'ginger_garlic', name: 'Ginger-Garlic Paste', price: 20, available: true, category: 'spice' },
      { id: 'chili_powder', name: 'Chili Powder', price: 10, available: true, category: 'spice' },
      { id: 'garam_masala', name: 'Garam Masala', price: 15, available: true, category: 'spice' },
      { id: 'salt', name: 'Salt', price: 5, available: true, category: 'spice' },
      { id: 'oil', name: 'Cooking Oil', price: 15, available: true, category: 'oil' }
    ]
  },
  {
    id: '2',
    name: 'Dal Tadka',
    description: 'Lentils cooked with spices and oil',
    image: '🥘',
    ingredients: [
      { id: 'toor_dal', name: 'Toor Dal', price: 50, available: true, category: 'protein' },
      { id: 'turmeric', name: 'Turmeric Powder', price: 10, available: true, category: 'spice' },
      { id: 'chili_powder', name: 'Chili Powder', price: 10, available: true, category: 'spice' },
      { id: 'salt', name: 'Salt', price: 5, available: true, category: 'spice' },
      { id: 'oil', name: 'Cooking Oil', price: 15, available: true, category: 'oil' },
      { id: 'onion_powder', name: 'Onion Powder', price: 15, available: true, category: 'spice' },
      { id: 'tomato_puree', name: 'Tomato Puree', price: 20, available: true, category: 'sauce' }
    ]
  },
  {
    id: '3',
    name: 'Chapati with Curry',
    description: 'Whole wheat chapati served with spicy curry',
    image: '🥙',
    ingredients: [
      // Chapati
      { id: 'wheat_flour', name: 'Wheat Flour', price: 30, available: true, category: 'base' },
      { id: 'salt', name: 'Salt', price: 5, available: true, category: 'spice' },
      { id: 'oil', name: 'Cooking Oil', price: 15, available: true, category: 'oil' },

      // Curry
      { id: 'tomato_puree', name: 'Tomato Puree', price: 20, available: true, category: 'sauce' },
      { id: 'onion_powder', name: 'Onion Powder', price: 15, available: true, category: 'spice' },
      { id: 'garam_masala', name: 'Garam Masala', price: 15, available: true, category: 'spice' },
      { id: 'ginger_garlic', name: 'Ginger-Garlic Paste', price: 20, available: true, category: 'spice' },
      { id: 'chili_powder', name: 'Chili Powder', price: 10, available: true, category: 'spice' }
    ]
  },
  {
    id: '4',
    name: 'Sweet Pongal',
    description: 'South Indian sweet dish with rice, sugar, and ghee',
    image: '🍯',
    ingredients: [
      { id: 'rice', name: 'Rice', price: 40, available: true, category: 'base' },
      { id: 'sugar', name: 'Sugar', price: 20, available: true, category: 'sweetener' },
      { id: 'oil_ghee', name: 'Ghee / Cooking Oil', price: 25, available: true, category: 'oil' },
      { id: 'garam_masala', name: 'Cardamom (using Garam Masala)', price: 15, available: true, category: 'spice' },
      { id: 'salt', name: 'Salt', price: 5, available: true, category: 'spice' }
    ]
  }
];


  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const calculateTotalPrice = () => {
    if (!selectedFood) return 0;
    return selectedIngredients.reduce((sum, id) => {
      const ingredient = selectedFood.ingredients.find(ing => ing.id === id);
      return sum + (ingredient?.price || 0);
    }, 0);
  };

  const addToCart = () => {
    if (!selectedFood || selectedIngredients.length === 0) return;
    
    const selectedIngredientsData = selectedIngredients.map(id => {
      const ingredient = selectedFood.ingredients.find(ing => ing.id === id);
      return {
        id: ingredient!.id,
        name: ingredient!.name,
        price: ingredient!.price
      };
    });
    
    const cartItem: CartItem = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      selectedIngredients: selectedIngredientsData,
      quantity: 1,
      totalPrice: calculateTotalPrice()
    };

    setCart(prev => [...prev, cartItem]);
    setSelectedFood(null);
    setSelectedIngredients([]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotalCartValue = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
  };

  const handlePayment = async () => {
    const orderData = {
      items: cart,
      total: getTotalCartValue(),
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending to backend:', orderData);
    setShowPayment(true);
  };

  const processRazorpayPayment = () => {
    startPayment()
    setCart([]);
    setShowPayment(false);
    
  };

  const groupIngredientsByCategory = (ingredients: Ingredient[]) => {
    return ingredients.reduce((groups, ingredient) => {
      const category = ingredient.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(ingredient);
      return groups;
    }, {} as Record<string, Ingredient[]>);
  };

  const startPayment=async()=>
  {
    
      
    const order= await api.post("create-order",{
      amount:getTotalCartValue()
    })
    console.log(order)
    // 2. Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // public key
      amount: order?.data?.data?.amount,
      currency: order?.data?.data?.currency,
      name: "Laridae",
      description: "Tea order",
      order_id: order?.data?.data?.id,
      handler: async function (response: any,order_id:string) {
        // 3. Verify payment on backend
        
        const verify= await api.post("/verify-payment",{
          razorpay_order_id: response.razorpay_order_id,
                       razorpay_payment_id: response.razorpay_payment_id,
                       razorpay_signature: response.razorpay_signature,
        })
        console.log(verify)
        if (verify?.data?.success) {
          alert("Order Placed Successfullt")
         
        } else {
          alert("❌ Payment verification failed")
        }
      },
      prefill: {
        name: "Shyam",
        email: "shyam@example.com",
        contact: "9876543210",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="bg-black text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Food Dispensing System</h1>
            </div>
            
            {cart.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                </div>
                <span className="font-semibold">₹{getTotalCartValue()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!selectedFood ? (
          // Food Selection Screen
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Select Your Food</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose a food item and customize it with your preferred ingredients
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="cursor-pointer border-2 border-gray-300 hover:border-black rounded-lg p-6 text-center"
                  onClick={() => setSelectedFood(food)}
                >
                  <div className="text-6xl mb-4">{food.image}</div>
                  <h3 className="text-xl font-bold mb-2">{food.name}</h3>
                  <p className="text-gray-600 text-sm">{food.description}</p>
                </div>
              ))}
            </div>

            {/* Cart Section */}
            {cart.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-4">Your Cart</h3>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white rounded border">
                      <div className="flex-1">
                        <h4 className="font-bold">{item.foodName}</h4>
                        <p className="text-sm text-gray-600">
                          {item.selectedIngredients.map(ing => ing.name).join(', ')}
                        </p>
                        <p className="font-semibold">₹{item.totalPrice} each</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="ml-4 font-bold w-20 text-right">₹{item.totalPrice * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t-2">
                  <span className="text-2xl font-bold">Total: ₹{getTotalCartValue()}</span>
                  <button
                    onClick={handlePayment}
                    className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 flex items-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Payment</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Ingredient Selection Screen
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setSelectedFood(null)}
              className="mb-6 text-black hover:text-gray-600 flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Food Preview */}
              <div className="lg:col-span-1">
                <div className="border-2 border-gray-300 rounded-lg p-6 text-center sticky top-8">
                  <div className="text-8xl mb-4">{selectedFood.image}</div>
                  <h2 className="text-3xl font-bold mb-3">{selectedFood.name}</h2>
                  <p className="text-gray-600 mb-6">{selectedFood.description}</p>
                  
                  <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-600 mb-2">Total Price</div>
                    <div className="text-3xl font-bold">₹{calculateTotalPrice()}</div>
                    {selectedIngredients.length > 0 && (
                      <div className="text-sm text-gray-500 mt-2">
                        {selectedIngredients.length} ingredient(s) selected
                      </div>
                    )}
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={selectedIngredients.length === 0}
                    className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed px-6 py-3 rounded font-bold flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>

              {/* Ingredients Selection */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-6">Customize Your {selectedFood.name}</h3>

                {Object.entries(groupIngredientsByCategory(selectedFood.ingredients)).map(([category, ingredients]) => (
                  <div key={category} className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 capitalize border-b pb-2">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {ingredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer ${
                            ingredient.available
                              ? selectedIngredients.includes(ingredient.id)
                                ? 'border-black bg-gray-100'
                                : 'border-gray-300 hover:border-gray-500'
                              : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          }`}
                          onClick={() => ingredient.available && handleIngredientToggle(ingredient.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold">{ingredient.name}</h5>
                              <p className="text-sm text-gray-600">₹{ingredient.price}</p>
                            </div>
                            
                            <div className={`w-5 h-5 rounded-full border-2 ${
                              selectedIngredients.includes(ingredient.id)
                                ? 'bg-black border-black'
                                : 'border-gray-400'
                            }`}>
                              {selectedIngredients.includes(ingredient.id) && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                          </div>
                          
                          {!ingredient.available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                              <span className="text-sm font-semibold text-gray-500">Out of Stock</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
         <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border-2 border-gray-300 p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-center">Complete Your Order</h3>
            
            <div className="space-y-3 mb-6">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-semibold">{item.foodName}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} | ₹{item.totalPrice} each
                    </div>
                  </div>
                  <div className="text-lg font-bold">₹{item.totalPrice * item.quantity}</div>
                </div>
              ))}
            </div>
            
            <div className="border-t-2 pt-4 mb-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span>₹{getTotalCartValue()}</span>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black px-4 py-3 rounded font-bold"
              >
                Cancel
              </button>
              <button
                onClick={processRazorpayPayment}
                className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-3 rounded font-bold flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pay with Razorpay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDispensingSystem;