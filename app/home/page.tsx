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
import axios from 'axios';

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

const INGREDIENTS: Ingredient[] = [
  { id: "ing1", name: "Rice",   price: 40, available: true, category: "base" },
  { id: "ing2", name: "Tomato sachet", price: 20, available: true, category: "veg" },
  { id: "ing3", name: "Onion",  price: 15, available: true, category: "veg" },
  { id: "ing4", name: "Oil",    price: 10, available: true, category: "oil" },
  { id: "ing5", name: "Dal",    price: 35, available: true, category: "protein" },
  { id: "ing6", name: "Spices", price: 10, available: true, category: "spice" },
];


const ingredientMotorMap: Record<string, number> = {
  ing1: 0,
  ing2: 1,
  ing3: 2,
  ing4: 3,
  ing5: 4,
  ing6: 5
};

const FoodDispensingSystem: React.FC = () => {

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);


  const foods: Food[] = [
    {
      id: "1",
      name: "Tomato Rice",
      description: "Rice with tomato and spices",
      image: "🍅",
      ingredients: INGREDIENTS.filter(i =>
        ["ing1", "ing2", "ing4", "ing6"].includes(i.id)
      )
    },
    {
      id: "2",
      name: "Dal Rice",
      description: "Dal served with rice",
      image: "🍛",
      ingredients: INGREDIENTS.filter(i =>
        ["ing1", "ing5", "ing4", "ing6"].includes(i.id)
      )
    },
    {
      id: "3",
      name: "Veg Rice",
      description: "Rice with onion and tomato",
      image: "🥗",
      ingredients: INGREDIENTS.filter(i =>
        ["ing1", "ing2", "ing3", "ing4", "ing6"].includes(i.id)
      )
    },
    {
      id: "4",
      name: "Plain Dal",
      description: "Dal with spices",
      image: "🥣",
      ingredients: INGREDIENTS.filter(i =>
        ["ing5", "ing4", "ing6"].includes(i.id)
      )
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
      const ingredient = selectedFood.ingredients.find(ing => ing.id === id)!;
      return {
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.price
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
    setShowPayment(true);
  };

  const processRazorpayPayment = () => {
    startPayment();
    setShowPayment(false);
  };

  const groupIngredientsByCategory = (ingredients: Ingredient[]) => {
    return ingredients.reduce((groups, ingredient) => {
      const category = ingredient.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(ingredient);
      return groups;
    }, {} as Record<string, Ingredient[]>);
  };


  const triggerMotors = async () => {

    const motors = new Set<number>();

    cart.forEach(item => {
      item.selectedIngredients.forEach(ing => {
        const motor = ingredientMotorMap[ing.id];
        if (motor !== undefined) motors.add(motor);
      });
    });

    for (const motor of motors) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACKEND}/run?motor=${motor}`, {
  mode: "no-cors"
});
    }
  };

  const startPayment = async () => {

    const order = await api.post("create-order", {
      amount: getTotalCartValue()
    });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order?.data?.data?.amount,
      currency: order?.data?.data?.currency,
      name: "Laridae",
      description: "Tea order",
      order_id: order?.data?.data?.id,

      handler: async function (response: any) {

        const verify = await api.post("verify-payment", {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        if (verify?.data?.success) {

          await triggerMotors();

          alert("Order Placed Successfully");
          setCart([]);

        } else {
          alert("❌ Payment verification failed");
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
  };

  return (
    <div className="min-h-screen bg-white text-black">
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

                        <span className="ml-4 font-bold w-20 text-right">
                          ₹{item.totalPrice * item.quantity}
                        </span>
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
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setSelectedFood(null)}
              className="mb-6 text-black hover:text-gray-600 flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>

            <div className="grid lg:grid-cols-3 gap-8">

              <div className="lg:col-span-1">
                <div className="border-2 border-gray-300 rounded-lg p-6 text-center sticky top-8">

                  <div className="text-8xl mb-4">{selectedFood.image}</div>
                  <h2 className="text-3xl font-bold mb-3">{selectedFood.name}</h2>
                  <p className="text-gray-600 mb-6">{selectedFood.description}</p>

                  <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-600 mb-2">Total Price</div>
                    <div className="text-3xl font-bold">₹{calculateTotalPrice()}</div>
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

              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-6">Customize Your {selectedFood.name}</h3>

                {Object.entries(groupIngredientsByCategory(selectedFood.ingredients)).map(
                  ([category, ingredients]) => (
                    <div key={category} className="mb-8">

                      <h4 className="text-lg font-semibold mb-4 capitalize border-b pb-2">
                        {category}
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {ingredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className={`relative p-4 rounded-lg border-2 cursor-pointer ${
                              selectedIngredients.includes(ingredient.id)
                                ? 'border-black bg-gray-100'
                                : 'border-gray-300 hover:border-gray-500'
                            }`}
                            onClick={() => handleIngredientToggle(ingredient.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

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
