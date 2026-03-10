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
  X,
  AlertTriangle,
  RefreshCw,
  PackageX,
} from "lucide-react";
import { api } from "@/lib/config/axios";

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
  {
    id: "ing1",
    name: "Mutton",
    price: 40,
    available: true,
    category: "protein",
  },
  {
    id: "ing2",
    name: "Coriander Powder",
    price: 20,
    available: true,
    category: "spice",
  },
  {
    id: "ing3",
    name: "Garam Masala",
    price: 15,
    available: true,
    category: "spice",
  },
  {
    id: "ing4",
    name: "Turmeric",
    price: 10,
    available: true,
    category: "spice",
  },
  {
    id: "ing5",
    name: "Biryani Masala",
    price: 35,
    available: true,
    category: "spice",
  },
  {
    id: "ing6",
    name: "Red Chilli Powder",
    price: 10,
    available: true,
    category: "spice",
  },
];

const ingredientMotorMap: Record<string, number> = {
  ing1: 0,
  ing2: 1,
  ing3: 2,
  ing4: 3,
  ing5: 4,
  ing6: 5,
};

const FoodDispensingSystem: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<
    Record<string, number>
  >({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(INGREDIENTS.map((i) => [i.id, 2])),
  );

  const [refillTarget, setRefillTarget] = useState<Ingredient | null>(null);

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

  const handleIngredientToggle = (ingredient: Ingredient) => {
    const currentQty = selectedIngredients[ingredient.id] || 0;
    const availableStock = stock[ingredient.id] ?? 2;
    if (availableStock <= 0) return;
    if (currentQty >= 2) {
      alert(`You can only select up to 2 packets of "${ingredient.name}"`);
      return;
    }
    setSelectedIngredients((prev) => ({
      ...prev,
      [ingredient.id]: currentQty + 1,
    }));
    setStock((prev) => ({
      ...prev,
      [ingredient.id]: (prev[ingredient.id] ?? 2) - 1,
    }));
  };

  const handleRefill = (ingredient: Ingredient) => setRefillTarget(ingredient);

  const confirmRefill = () => {
    if (!refillTarget) return;
    setStock((prev) => ({ ...prev, [refillTarget.id]: 2 }));
    setSelectedIngredients((prev) => {
      const next = { ...prev };
      delete next[refillTarget.id];
      return next;
    });
    setRefillTarget(null);
  };

  const calculateTotalPrice = () => {
    if (!selectedFood) return 0;
    return Object.entries(selectedIngredients).reduce((sum, [id, qty]) => {
      const ingredient = selectedFood.ingredients.find((ing) => ing.id === id);
      return sum + (ingredient?.price || 0) * qty;
    }, 0);
  };

  const addToCart = () => {
    if (!selectedFood || Object.keys(selectedIngredients).length === 0) return;
    const selectedIngredientsData = Object.entries(selectedIngredients).flatMap(
      ([id, qty]) => {
        const ingredient = selectedFood.ingredients.find(
          (ing) => ing.id === id,
        )!;
        return Array.from({ length: qty }, () => ({
          id: ingredient.id,
          name: ingredient.name,
          price: ingredient.price,
        }));
      },
    );
    const cartItem: CartItem = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      selectedIngredients: selectedIngredientsData,
      quantity: 1,
      totalPrice: calculateTotalPrice(),
    };
    setCart((prev) => [...prev, cartItem]);
    setSelectedFood(null);
    setSelectedIngredients({});
  };

  const removeFromCart = (index: number) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

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

  const getTotalCartValue = () =>
    cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

  const handlePayment = async () => setShowPayment(true);

  const processRazorpayPayment = async () => {
    startPayment();
    setShowPayment(false);
  };

  const groupIngredientsByCategory = (ingredients: Ingredient[]) =>
    ingredients.reduce(
      (groups, ingredient) => {
        const category = ingredient.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(ingredient);
        return groups;
      },
      {} as Record<string, Ingredient[]>,
    );

  const getIngredientSummary = (ings: { name: string }[]) => {
    const counts: Record<string, number> = {};
    ings.forEach((i) => {
      counts[i.name] = (counts[i.name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, qty]) => (qty > 1 ? `${name} ×${qty}` : name))
      .join(", ");
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL_BACKEND}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motors: motorCounts }),
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
      theme: { color: "#000000" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── HEADER ── */}
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg font-bold tracking-tight">
              Food Dispensing System
            </span>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              </div>
              <span className="text-sm font-semibold">
                ₹{getTotalCartValue()}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ══════════════ MENU PAGE ══════════════ */}
        {!selectedFood ? (
          <>
            <div className="mb-6 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                Select Your Food
              </h2>
              <p className="text-gray-500 text-sm">
                Choose a dish and customize your spice blend.
              </p>
            </div>

            {/* Food cards — 1 col mobile, 2 col sm, 3 col md */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className="text-left border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-black hover:shadow-md transition-all duration-200 group bg-white active:scale-[0.98]"
                >
                  <span className="text-4xl sm:text-5xl block mb-3 sm:mb-4">
                    {food.image}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold mb-1 group-hover:underline underline-offset-2">
                    {food.name}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {food.description}
                  </p>
                  <div className="mt-3 sm:mt-4 text-xs font-semibold text-gray-400 group-hover:text-black transition-colors">
                    Customize →
                  </div>
                </button>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                  <h3 className="font-bold text-base sm:text-lg">Your Cart</h3>
                  <span className="text-sm text-gray-400">
                    {cart.length} item{cart.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {item.foodName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {getIngredientSummary(item.selectedIngredients)}
                        </p>
                        <p className="text-xs font-medium text-gray-600 mt-0.5">
                          ₹{item.totalPrice} / serving
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            updateQuantity(index, item.quantity - 1)
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 sm:w-6 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(index, item.quantity + 1)
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-colors active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm w-14 sm:w-16 text-right flex-shrink-0">
                        ₹{item.totalPrice * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Total amount</p>
                    <p className="text-2xl font-bold">₹{getTotalCartValue()}</p>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="w-full sm:w-auto bg-black text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-[0.98]"
                  >
                    <CreditCard className="w-4 h-4" />
                    Proceed to Pay
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ══════════════ CUSTOMIZE PAGE ══════════════ */
          <div className="pb-36 sm:pb-0">
            <button
              onClick={() => {
                setSelectedFood(null);
                setSelectedIngredients({});
              }}
              className="flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2.5 rounded-xl mb-6 sm:mb-8 hover:bg-black hover:text-white hover:border-black transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
              {/* ── SIDEBAR — hidden on mobile (shown as sticky bottom bar) ── */}
              <div className="hidden lg:block border border-gray-200 rounded-2xl p-6 sticky top-20 self-start">
                <span className="text-6xl block mb-4">
                  {selectedFood.image}
                </span>
                <h2 className="text-xl font-bold mb-1">{selectedFood.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  {selectedFood.description}
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">
                    Your Total
                  </p>
                  <p className="text-3xl font-bold">₹{calculateTotalPrice()}</p>
                </div>

                <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
                  Tap once for 1 packet · Tap again for 2nd packet
                  <br />
                  Max 2 packets per ingredient
                </p>

                <button
                  onClick={addToCart}
                  disabled={Object.keys(selectedIngredients).length === 0}
                  className="w-full bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>

              {/* ── INGREDIENTS ── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Step 2
                </p>
                <h3 className="text-xl sm:text-2xl font-bold mb-1">
                  Pick your spice packets
                </h3>
                <p className="text-sm text-gray-400 mb-6 sm:mb-8">
                  Select up to 2 packets per ingredient.
                </p>

                {Object.entries(
                  groupIngredientsByCategory(selectedFood.ingredients),
                ).map(([category, ingredients]) => (
                  <div key={category} className="mb-6 sm:mb-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2 mb-3 sm:mb-4">
                      {category}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ingredients.map((ingredient) => {
                        const qty = selectedIngredients[ingredient.id] || 0;
                        const availableStock = stock[ingredient.id] ?? 2;
                        const isOutOfStock = availableStock <= 0;
                        const isMaxed = qty >= 2;
                        const isSelected = qty > 0;

                        return (
                          <div
                            key={ingredient.id}
                            className={`border rounded-2xl p-4 transition-all duration-200 ${
                              isOutOfStock
                                ? "border-gray-200 bg-gray-50 opacity-80"
                                : isMaxed
                                  ? "border-black bg-black text-white"
                                  : isSelected
                                    ? "border-black bg-white"
                                    : "border-gray-200 bg-white hover:border-gray-400"
                            }`}
                          >
                            {isOutOfStock ? (
                              <div>
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-semibold text-sm text-gray-400">
                                      {ingredient.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      ₹{ingredient.price} / packet
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex-shrink-0">
                                    <PackageX className="w-3 h-3 text-red-500" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide hidden xs:inline">
                                      Out of Stock
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRefill(ingredient)}
                                  className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-colors active:scale-[0.98]"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Refill Stock
                                </button>
                              </div>
                            ) : (
                              <button
                                className="w-full text-left"
                                onClick={() =>
                                  handleIngredientToggle(ingredient)
                                }
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p
                                      className={`font-semibold text-sm ${isMaxed ? "text-white" : "text-black"}`}
                                    >
                                      {ingredient.name}
                                    </p>
                                    <p
                                      className={`text-xs mt-0.5 ${isMaxed ? "text-gray-300" : "text-gray-400"}`}
                                    >
                                      ₹{ingredient.price} / packet
                                    </p>
                                  </div>
                                  <div
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                                      isMaxed
                                        ? "border-white bg-white text-black"
                                        : isSelected
                                          ? "border-black bg-black text-white"
                                          : "border-gray-300 bg-white text-gray-400"
                                    }`}
                                  >
                                    {qty > 0 ? qty : ""}
                                  </div>
                                </div>
                                <div className="mt-2.5">
                                  {isMaxed ? (
                                    <p className="text-[11px] font-semibold text-gray-300">
                                      ✓ 2 packets · max reached
                                    </p>
                                  ) : isSelected ? (
                                    <p className="text-[11px] font-semibold text-gray-500">
                                      Tap again for 2nd packet
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-gray-400">
                                      {availableStock} packet
                                      {availableStock !== 1 ? "s" : ""}{" "}
                                      available
                                    </p>
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── MOBILE STICKY BOTTOM BAR (only on mobile/tablet) ── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
              <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-xl font-bold">₹{calculateTotalPrice()}</p>
                </div>
                <button
                  onClick={addToCart}
                  disabled={Object.keys(selectedIngredients).length === 0}
                  className="flex-1 max-w-xs bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* ══════════════ PAYMENT MODAL ══════════════ */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-xl font-bold">Confirm Order</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 mb-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold">{item.foodName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {getIngredientSummary(item.selectedIngredients)} · qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0">
                    ₹{item.totalPrice * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-5 sm:mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">Total payable</p>
              <p className="text-2xl font-bold">₹{getTotalCartValue()}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processRazorpayPayment}
                className="flex-[2] bg-black text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                Pay with Razorpay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REFILL MODAL ══════════════ */}
      {refillTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-xl font-bold">Refill Stock</h3>
              <button
                onClick={() => setRefillTarget(null)}
                className="w-8 h-8 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-5 sm:mb-6 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p className="font-bold text-base mb-1">{refillTarget.name}</p>
              <p className="text-sm text-gray-500">
                This ingredient is out of stock.
                <br />
                Refilling will restore{" "}
                <span className="font-semibold text-black">2 packets</span>.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Current stock</span>
              <span className="text-sm font-bold text-red-500">0 packets</span>
            </div>
            <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between mb-5 sm:mb-6">
              <span className="text-sm text-gray-500">After refill</span>
              <span className="text-sm font-bold text-black">2 packets</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRefillTarget(null)}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefill}
                className="flex-[2] bg-black text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Confirm Refill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodDispensingSystem;
