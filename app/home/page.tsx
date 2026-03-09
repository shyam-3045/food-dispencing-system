"use client";
import React, { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { ShoppingCart, Plus, Minus, CreditCard, ChefHat, ArrowLeft, X } from "lucide-react";
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
  tag: string;
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
  ing1: 0, ing2: 1, ing3: 2, ing4: 3, ing5: 4, ing6: 5,
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  .fds * { box-sizing: border-box; margin: 0; padding: 0; }

  .fds {
    --cream: #FAF7F2;
    --warm-white: #FFFDF9;
    --charcoal: #1C1C1A;
    --amber: #C8813A;
    --amber-light: #E8A45A;
    --sage: #6B7C5E;
    --border: #E8E2D9;
    --muted: #8A8278;
    min-height: 100vh;
    background: var(--cream);
    font-family: 'DM Sans', sans-serif;
    color: var(--charcoal);
  }

  /* ── HEADER ── */
  .fds-header {
    background: var(--charcoal);
    padding: 0 40px;
    height: 66px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .fds-logo { display: flex; align-items: center; gap: 10px; }
  .fds-logo-icon {
    width: 30px; height: 30px;
    background: var(--amber);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }
  .fds-logo-text {
    font-family: 'Playfair Display', serif;
    font-size: 17px; font-weight: 600; color: #fff; letter-spacing: 0.2px;
  }
  .fds-cart-pill {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 100px; padding: 7px 16px 7px 10px;
  }
  .fds-cart-badge {
    background: var(--amber); color: #fff;
    font-size: 11px; font-weight: 700;
    width: 20px; height: 20px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .fds-cart-lbl { color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 500; }
  .fds-cart-amt { color: #fff; font-size: 14px; font-weight: 600; }

  /* ── LAYOUT ── */
  .fds-main { max-width: 1080px; margin: 0 auto; padding: 52px 24px 80px; }

  /* ── MENU PAGE ── */
  .fds-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--amber); margin-bottom: 10px;
  }
  .fds-h1 {
    font-family: 'Playfair Display', serif;
    font-size: 40px; font-weight: 700; line-height: 1.15;
    color: var(--charcoal); margin-bottom: 10px;
  }
  .fds-subtitle { font-size: 15px; color: var(--muted); margin-bottom: 44px; }

  .fds-food-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px; margin-bottom: 48px;
  }
  .fds-food-card {
    background: var(--warm-white);
    border: 1px solid var(--border);
    border-radius: 18px; padding: 28px 22px;
    cursor: pointer; transition: all 0.22s ease;
    position: relative; overflow: hidden;
  }
  .fds-food-card:hover {
    border-color: var(--amber);
    box-shadow: 0 10px 40px rgba(28,28,26,0.11);
    transform: translateY(-3px);
  }
  .fds-food-emoji { font-size: 44px; display: block; margin-bottom: 14px; }
  .fds-food-tag {
    display: inline-block; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--amber); background: rgba(200,129,58,0.1);
    border-radius: 4px; padding: 3px 8px; margin-bottom: 10px;
  }
  .fds-food-name {
    font-family: 'Playfair Display', serif;
    font-size: 19px; font-weight: 600; margin-bottom: 7px;
  }
  .fds-food-desc { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 18px; }
  .fds-food-cta {
    font-size: 12px; font-weight: 600; color: var(--charcoal);
    opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; gap: 4px;
  }
  .fds-food-card:hover .fds-food-cta { opacity: 1; }

  /* ── CART BLOCK ── */
  .fds-cart-block {
    background: var(--warm-white); border: 1px solid var(--border); border-radius: 20px; overflow: hidden;
  }
  .fds-cart-block-hdr {
    padding: 20px 26px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .fds-cart-block-title { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 600; }
  .fds-cart-block-count { font-size: 13px; color: var(--muted); }
  .fds-cart-rows { padding: 8px 26px; }
  .fds-cart-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 0; border-bottom: 1px solid var(--border);
  }
  .fds-cart-row:last-child { border-bottom: none; }
  .fds-cart-row-name { font-size: 15px; font-weight: 500; margin-bottom: 3px; }
  .fds-cart-row-ings { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .fds-cart-row-unit { font-size: 12px; color: var(--amber); font-weight: 500; }
  .fds-qty-wrap { display: flex; align-items: center; gap: 10px; }
  .fds-qty-btn {
    width: 30px; height: 30px; border: 1px solid var(--border);
    background: #fff; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; transition: all 0.15s; color: var(--charcoal);
  }
  .fds-qty-btn:hover { background: var(--charcoal); border-color: var(--charcoal); color: #fff; }
  .fds-qty-num { font-size: 14px; font-weight: 600; width: 22px; text-align: center; }
  .fds-row-total { font-size: 15px; font-weight: 600; min-width: 68px; text-align: right; }
  .fds-cart-block-ftr {
    padding: 20px 26px; border-top: 1px solid var(--border); background: var(--cream);
    display: flex; align-items: center; justify-content: space-between;
  }
  .fds-total-lbl { font-size: 12px; color: var(--muted); margin-bottom: 3px; letter-spacing: 0.3px; }
  .fds-total-amt { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; }

  /* ── BUTTONS ── */
  .fds-btn-dark {
    background: var(--charcoal); color: #fff; border: none;
    border-radius: 10px; padding: 12px 22px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: all 0.18s; letter-spacing: 0.15px;
  }
  .fds-btn-dark:hover { background: #2c2c2a; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(28,28,26,0.2); }
  .fds-btn-dark:disabled { background: #C5C0B8; cursor: not-allowed; transform: none; box-shadow: none; }

  .fds-btn-amber {
    background: var(--amber); color: #fff; border: none;
    border-radius: 10px; padding: 12px 22px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.18s;
  }
  .fds-btn-amber:hover { background: var(--amber-light); transform: translateY(-1px); }

  .fds-btn-ghost {
    background: transparent; color: var(--charcoal);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 9px 16px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.18s;
  }
  .fds-btn-ghost:hover { border-color: var(--charcoal); background: var(--charcoal); color: #fff; }

  /* ── CUSTOMIZE PAGE ── */
  .fds-cust-layout {
    display: grid; grid-template-columns: 280px 1fr; gap: 32px; align-items: start;
  }
  .fds-sidebar {
    background: var(--warm-white); border: 1px solid var(--border);
    border-radius: 20px; padding: 26px; position: sticky; top: 82px;
  }
  .fds-sb-emoji { font-size: 52px; display: block; margin-bottom: 14px; }
  .fds-sb-title { font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 700; margin-bottom: 6px; }
  .fds-sb-desc { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 20px; }
  .fds-price-box {
    background: var(--cream); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;
  }
  .fds-price-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .fds-price-val { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; }
  .fds-hint { font-size: 12px; color: var(--muted); text-align: center; margin-bottom: 14px; line-height: 1.55; }

  /* ── INGREDIENT CARDS ── */
  .fds-cat-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border);
  }
  .fds-ing-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 11px; margin-bottom: 28px;
  }
  .fds-ing-card {
    background: var(--warm-white); border: 1.5px solid var(--border);
    border-radius: 14px; padding: 15px; cursor: pointer;
    transition: all 0.18s; user-select: none;
  }
  .fds-ing-card:hover { border-color: rgba(200,129,58,0.5); box-shadow: 0 2px 14px rgba(200,129,58,0.09); }
  .fds-ing-card.sel { border-color: var(--amber); background: #FDF6EE; box-shadow: 0 0 0 3px rgba(200,129,58,0.09); }
  .fds-ing-card.max { border-color: var(--charcoal); background: #F4EFE8; }
  .fds-ing-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
  .fds-ing-name { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .fds-ing-bubble {
    min-width: 24px; height: 24px; border-radius: 50%;
    border: 1.5px solid var(--border); background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--muted);
    transition: all 0.18s; flex-shrink: 0;
  }
  .fds-ing-card.sel .fds-ing-bubble { background: var(--amber); border-color: var(--amber); color: #fff; }
  .fds-ing-card.max .fds-ing-bubble { background: var(--charcoal); border-color: var(--charcoal); color: #fff; }
  .fds-ing-price { font-size: 12px; color: var(--muted); }
  .fds-ing-status { font-size: 11px; font-weight: 500; margin-top: 5px; color: var(--amber); }
  .fds-ing-card.max .fds-ing-status { color: var(--sage); }

  /* ── MODAL ── */
  .fds-overlay {
    position: fixed; inset: 0; background: rgba(28,28,26,0.55);
    backdrop-filter: blur(5px); display: flex; align-items: center;
    justify-content: center; z-index: 200; padding: 20px;
  }
  .fds-modal {
    background: var(--warm-white); border-radius: 22px; padding: 34px;
    max-width: 420px; width: 100%;
    box-shadow: 0 24px 80px rgba(28,28,26,0.22);
  }
  .fds-modal-hdr {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  }
  .fds-modal-title { font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 700; }
  .fds-modal-close {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid var(--border); background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--muted); transition: all 0.15s;
  }
  .fds-modal-close:hover { border-color: var(--charcoal); color: var(--charcoal); }
  .fds-modal-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 0; border-bottom: 1px solid var(--border);
  }
  .fds-modal-row:last-child { border-bottom: none; }
  .fds-modal-row-name { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
  .fds-modal-row-sub { font-size: 12px; color: var(--muted); }
  .fds-modal-row-price { font-size: 15px; font-weight: 600; }
  .fds-modal-divider { height: 1px; background: var(--border); margin: 14px 0; }
  .fds-modal-total {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  }
  .fds-modal-total-lbl { font-size: 13px; color: var(--muted); }
  .fds-modal-total-amt { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; }
  .fds-modal-actions { display: flex; gap: 10px; }
  .fds-btn-outline {
    flex: 1; background: var(--cream); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; color: var(--charcoal); transition: border-color 0.15s;
  }
  .fds-btn-outline:hover { border-color: var(--charcoal); }

  @media (max-width: 768px) {
    .fds-food-grid { grid-template-columns: 1fr; }
    .fds-cust-layout { grid-template-columns: 1fr; }
    .fds-sidebar { position: static; }
    .fds-main { padding: 28px 16px 60px; }
    .fds-header { padding: 0 18px; }
    .fds-h1 { font-size: 28px; }
  }
`;

const FoodDispensingSystem: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const foods: Food[] = [
    {
      id: "1", name: "Mutton Curry", tag: "Classic",
      description: "Slow-cooked with coriander, turmeric and a touch of chilli",
      image: "🍖",
      ingredients: INGREDIENTS.filter((i) => ["ing1", "ing2", "ing4", "ing6", "ing3"].includes(i.id)),
    },
    {
      id: "2", name: "Mutton Biryani", tag: "Bestseller",
      description: "Fragrant biryani masala with hand-picked whole spices",
      image: "🍛",
      ingredients: INGREDIENTS.filter((i) => ["ing1", "ing5", "ing4", "ing6"].includes(i.id)),
    },
    {
      id: "3", name: "Spicy Masala", tag: "Spicy",
      description: "Bold garam masala and chilli for the heat seekers",
      image: "🥘",
      ingredients: INGREDIENTS.filter((i) => ["ing1", "ing3", "ing6", "ing2"].includes(i.id)),
    },
  ];

  const handleIngredientToggle = (ingredientId: string, ingredientName: string) => {
    setSelectedIngredients((prev) => {
      const currentQty = prev[ingredientId] || 0;
      if (currentQty >= 2) {
        alert(`Maximum 2 packets of "${ingredientName}" already selected.`);
        return prev;
      }
      return { ...prev, [ingredientId]: currentQty + 1 };
    });
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
    const selectedIngredientsData = Object.entries(selectedIngredients).flatMap(([id, qty]) => {
      const ingredient = selectedFood.ingredients.find((ing) => ing.id === id)!;
      return Array.from({ length: qty }, () => ({ id: ingredient.id, name: ingredient.name, price: ingredient.price }));
    });
    setCart((prev) => [...prev, {
      foodId: selectedFood.id, foodName: selectedFood.name,
      selectedIngredients: selectedIngredientsData, quantity: 1, totalPrice: calculateTotalPrice(),
    }]);
    setSelectedFood(null);
    setSelectedIngredients({});
  };

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) { removeFromCart(index); return; }
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
  };

  const getTotalCartValue = () => cart.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);

  const groupIngredientsByCategory = (ingredients: Ingredient[]) =>
    ingredients.reduce((groups, ingredient) => {
      if (!groups[ingredient.category]) groups[ingredient.category] = [];
      groups[ingredient.category].push(ingredient);
      return groups;
    }, {} as Record<string, Ingredient[]>);

  const getIngredientSummary = (ings: { name: string }[]) => {
    const counts: Record<string, number> = {};
    ings.forEach((i) => { counts[i.name] = (counts[i.name] || 0) + 1; });
    return Object.entries(counts).map(([name, qty]) => qty > 1 ? `${name} ×${qty}` : name).join(", ");
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
    const order = await api.post("create-order", { amount: getTotalCartValue() });
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
          alert("Order placed successfully");
          setCart([]);
        } else {
          alert("Payment verification failed");
        }
      },
      prefill: { name: "Shyam", email: "shyam@example.com", contact: "9876543210" },
      theme: { color: "#C8813A" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handlePayment = async () => setShowPayment(true);
  const processRazorpayPayment = async () => { startPayment(); setShowPayment(false); };

  return (
    <>
      <style>{styles}</style>
      <div className="fds">

        {/* HEADER */}
        <header className="fds-header">
          <div className="fds-logo">
            <div className="fds-logo-icon">
              <ChefHat size={16} color="white" />
            </div>
            <span className="fds-logo-text">Smart Food Dispensing System</span>
          </div>
          {cart.length > 0 && (
            <div className="fds-cart-pill">
              <div className="fds-cart-badge">{cart.length}</div>
              <span className="fds-cart-lbl">Cart</span>
              <span className="fds-cart-amt">₹{getTotalCartValue()}</span>
            </div>
          )}
        </header>

        <main className="fds-main">
          {!selectedFood ? (
            <>
              {/* MENU */}
              <p className="fds-eyebrow">Today's Menu</p>
              <h2 className="fds-h1">What are you<br />craving today?</h2>
              <p className="fds-subtitle">Pick a dish and build your own spice blend.</p>

              <div className="fds-food-grid">
                {foods.map((food) => (
                  <div key={food.id} className="fds-food-card" onClick={() => setSelectedFood(food)}>
                    <span className="fds-food-emoji">{food.image}</span>
                    <span className="fds-food-tag">{food.tag}</span>
                    <h3 className="fds-food-name">{food.name}</h3>
                    <p className="fds-food-desc">{food.description}</p>
                    <div className="fds-food-cta">Customize →</div>
                  </div>
                ))}
              </div>

              {/* CART */}
              {cart.length > 0 && (
                <div className="fds-cart-block">
                  <div className="fds-cart-block-hdr">
                    <span className="fds-cart-block-title">Your Order</span>
                    <span className="fds-cart-block-count">{cart.length} item{cart.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="fds-cart-rows">
                    {cart.map((item, index) => (
                      <div key={index} className="fds-cart-row">
                        <div style={{ flex: 1 }}>
                          <div className="fds-cart-row-name">{item.foodName}</div>
                          <div className="fds-cart-row-ings">{getIngredientSummary(item.selectedIngredients)}</div>
                          <div className="fds-cart-row-unit">₹{item.totalPrice} per serving</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div className="fds-qty-wrap">
                            <button className="fds-qty-btn" onClick={() => updateQuantity(index, item.quantity - 1)}><Minus size={12} /></button>
                            <span className="fds-qty-num">{item.quantity}</span>
                            <button className="fds-qty-btn" onClick={() => updateQuantity(index, item.quantity + 1)}><Plus size={12} /></button>
                          </div>
                          <span className="fds-row-total">₹{item.totalPrice * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="fds-cart-block-ftr">
                    <div>
                      <div className="fds-total-lbl">Total amount</div>
                      <div className="fds-total-amt">₹{getTotalCartValue()}</div>
                    </div>
                    <button className="fds-btn-amber" onClick={handlePayment}>
                      <CreditCard size={15} />
                      Proceed to Pay
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* CUSTOMIZE */
            <div>
              <button className="fds-btn-ghost" style={{ marginBottom: 28 }} onClick={() => { setSelectedFood(null); setSelectedIngredients({}); }}>
                <ArrowLeft size={14} /> Back to menu
              </button>

              <div className="fds-cust-layout">
                {/* SIDEBAR */}
                <div className="fds-sidebar">
                  <span className="fds-sb-emoji">{selectedFood.image}</span>
                  <h2 className="fds-sb-title">{selectedFood.name}</h2>
                  <p className="fds-sb-desc">{selectedFood.description}</p>
                  <div className="fds-price-box">
                    <div className="fds-price-lbl">Your total</div>
                    <div className="fds-price-val">₹{calculateTotalPrice()}</div>
                  </div>
                  <p className="fds-hint">Tap once → 1 packet · Tap again → 2 packets<br />Max 2 packets per ingredient</p>
                  <button
                    className="fds-btn-dark"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={addToCart}
                    disabled={Object.keys(selectedIngredients).length === 0}
                  >
                    <Plus size={15} /> Add to Order
                  </button>
                </div>

                {/* INGREDIENTS */}
                <div>
                  <p className="fds-eyebrow" style={{ marginBottom: 6 }}>Customize</p>
                  <h3 className="fds-h1" style={{ fontSize: 28, marginBottom: 6 }}>Pick your spice packets</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>Select up to 2 packets of each ingredient.</p>

                  {Object.entries(groupIngredientsByCategory(selectedFood.ingredients)).map(([category, ingredients]) => (
                    <div key={category}>
                      <div className="fds-cat-lbl">{category}</div>
                      <div className="fds-ing-grid">
                        {ingredients.map((ingredient) => {
                          const qty = selectedIngredients[ingredient.id] || 0;
                          const isSelected = qty > 0;
                          const isMaxed = qty >= 2;
                          return (
                            <div
                              key={ingredient.id}
                              className={`fds-ing-card${isMaxed ? " max" : isSelected ? " sel" : ""}`}
                              onClick={() => handleIngredientToggle(ingredient.id, ingredient.name)}
                            >
                              <div className="fds-ing-top">
                                <div className="fds-ing-name">{ingredient.name}</div>
                                <div className="fds-ing-bubble">{qty > 0 ? qty : ""}</div>
                              </div>
                              <div className="fds-ing-price">₹{ingredient.price} / packet</div>
                              {isSelected && (
                                <div className="fds-ing-status">
                                  {isMaxed ? "✓ Max selected" : "Tap for 2nd packet"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

        {/* PAYMENT MODAL */}
        {showPayment && (
          <div className="fds-overlay">
            <div className="fds-modal">
              <div className="fds-modal-hdr">
                <h3 className="fds-modal-title">Confirm Order</h3>
                <button className="fds-modal-close" onClick={() => setShowPayment(false)}><X size={14} /></button>
              </div>
              {cart.map((item, index) => (
                <div key={index} className="fds-modal-row">
                  <div>
                    <div className="fds-modal-row-name">{item.foodName}</div>
                    <div className="fds-modal-row-sub">{getIngredientSummary(item.selectedIngredients)} · qty {item.quantity}</div>
                  </div>
                  <div className="fds-modal-row-price">₹{item.totalPrice * item.quantity}</div>
                </div>
              ))}
              <div className="fds-modal-divider" />
              <div className="fds-modal-total">
                <span className="fds-modal-total-lbl">Total payable</span>
                <span className="fds-modal-total-amt">₹{getTotalCartValue()}</span>
              </div>
              <div className="fds-modal-actions">
                <button className="fds-btn-outline" onClick={() => setShowPayment(false)}>Cancel</button>
                <button className="fds-btn-amber" style={{ flex: 2, justifyContent: "center" }} onClick={processRazorpayPayment}>
                  <CreditCard size={15} /> Pay with Razorpay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FoodDispensingSystem;