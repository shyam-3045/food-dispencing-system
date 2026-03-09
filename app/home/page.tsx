"use client";
import React, { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import {
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  ChefHat,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/config/axios";
import axios from "axios";

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
  { id: "ing1", name: "Mutton", price: 40, available: true, category: "protein" },
  { id: "ing2", name: "Coriander Powder", price: 20, available: true, category: "spice" },
  { id: "ing3", name: "Garam Masala", price: 15, available: true, category: "spice" },
  { id: "ing4", name: "Turmeric", price: 10, available: true, category: "spice" },
  { id: "ing5", name: "Biryani Masala", price: 35, available: true, category: "spice" },
  { id: "ing6", name: "Red Chilli Powder", price: 10, available: true, category: "spice" },
];

const ingredientMotorMap: Record<string, number> = {
  ing1: 0,
  ing2: 1,
  ing3: 2,
  ing4: 3,
  ing5: 4,
  ing6: 5,
};

const MAX_SELECTION = 2;

const FoodDispensingSystem: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const foods: Food[] = [
    {
      id: "1",
      name: "Mutton Curry",
      description: "Mutton cooked with coriander, turmeric and chilli",
      image: "🍖",
      ingredients: INGREDIENTS.filter((i) =>
        ["ing1", "ing2", "ing4", "ing6", "ing3"].includes(i.id),
      ),
    },
    {
      id: "2",
      name: "Mutton Biryani Masala",
      description: "Mutton cooked with biryani masala spices",
      image: "🍛",
      ingredients: INGREDIENTS.filter((i) =>
        ["ing1", "ing5", "ing4", "ing6"].includes(i.id),
      ),
    },
    {
      id: "3",
      name: "Spicy Mutton Masala",
      description: "Mutton with garam masala and chilli spices",
      image: "🥘",
      ingredients: INGREDIENTS.filter((i) =>
        ["ing1", "ing3", "ing6", "ing2"].includes(i.id),
      ),
    },
  ];

  /* ONLY LOGIC CHANGE HERE */
  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredientId)) {
        return prev.filter((id) => id !== ingredientId);
      }

      if (prev.length >= MAX_SELECTION) {
        return prev; // block third selection
      }

      return [...prev, ingredientId];
    });
  };

  const calculateTotalPrice = () => {
    if (!selectedFood) return 0;
    return selectedIngredients.reduce((sum, id) => {
      const ingredient = selectedFood.ingredients.find((ing) => ing.id === id);
      return sum + (ingredient?.price || 0);
    }, 0);
  };

  const addToCart = () => {
    if (!selectedFood || selectedIngredients.length === 0) return;

    const selectedIngredientsData = selectedIngredients.map((id) => {
      const ingredient = selectedFood.ingredients.find((ing) => ing.id === id)!;
      return {
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.price,
      };
    });

    const cartItem: CartItem = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      selectedIngredients: selectedIngredientsData,
      quantity: 1,
      totalPrice: calculateTotalPrice(),
    };

    setCart((prev) => [...prev, cartItem]);
    setSelectedFood(null);
    setSelectedIngredients([]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const getTotalCartValue = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
  };

  const handlePayment = async () => {
    setShowPayment(true);
  };

  const processRazorpayPayment = async () => {
    startPayment();
    setShowPayment(false);
  };

  const groupIngredientsByCategory = (ingredients: Ingredient[]) => {
    return ingredients.reduce(
      (groups, ingredient) => {
        const category = ingredient.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(ingredient);
        return groups;
      },
      {} as Record<string, Ingredient[]>,
    );
  };

  const triggerMotors = async () => {
    const motorCounts: Record<string, number> = {};

    cart.forEach((item) => {
      item.selectedIngredients.forEach((ing) => {
        const motor = ingredientMotorMap[ing.id];
        if (motor === undefined) return;

        const key = String(motor);
        motorCounts[key] = (motorCounts[key] || 0) + item.quantity;
      });
    });

    const payload = { motors: motorCounts };

    await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACKEND}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  };

  const startPayment = async () => {
    const order = await api.post("create-order", {
      amount: getTotalCartValue(),
    });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order?.data?.data?.amount,
      currency: order?.data?.data?.currency,
      name: "Laridae",
      description: "Food order",
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
          alert("Payment verification failed");
        }
      },

      prefill: {
        name: "Shyam",
        email: "shyam@example.com",
        contact: "9876543210",
      },
      theme: { color: "#3399cc" },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return <div>/* UI code remains exactly the same as your original */</div>;
};

export default FoodDispensingSystem;