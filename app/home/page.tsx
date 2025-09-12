'use client'
import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, ChefHat, ArrowLeft } from 'lucide-react';

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
      name: 'Burger',
      description: 'Customizable burger with your choice of ingredients',
      image: '🍔',
      ingredients: [
        { id: 'beef', name: 'Beef Patty', price: 150, available: true, category: 'protein' },
        { id: 'chicken', name: 'Chicken Patty', price: 120, available: true, category: 'protein' },
        { id: 'cheese', name: 'Cheese Slice', price: 30, available: true, category: 'dairy' },
        { id: 'lettuce', name: 'Lettuce', price: 10, available: true, category: 'vegetables' },
        { id: 'tomato', name: 'Tomato', price: 15, available: true, category: 'vegetables' },
        { id: 'onion', name: 'Onions', price: 10, available: false, category: 'vegetables' },
        { id: 'bacon', name: 'Bacon', price: 40, available: true, category: 'protein' },
        { id: 'bun', name: 'Burger Bun', price: 25, available: true, category: 'base' }
      ]
    },
    {
      id: '2',
      name: 'Pizza',
      description: 'Build your own pizza with fresh ingredients',
      image: '🍕',
      ingredients: [
        { id: 'dough', name: 'Pizza Dough', price: 50, available: true, category: 'base' },
        { id: 'sauce', name: 'Tomato Sauce', price: 25, available: true, category: 'sauce' },
        { id: 'mozzarella', name: 'Mozzarella Cheese', price: 60, available: true, category: 'dairy' },
        { id: 'pepperoni', name: 'Pepperoni', price: 70, available: true, category: 'protein' },
        { id: 'mushrooms', name: 'Mushrooms', price: 20, available: true, category: 'vegetables' },
        { id: 'basil', name: 'Fresh Basil', price: 15, available: true, category: 'herbs' },
        { id: 'olives', name: 'Olives', price: 30, available: true, category: 'vegetables' }
      ]
    },
    {
      id: '3',
      name: 'Salad',
      description: 'Fresh salad with your preferred ingredients',
      image: '🥗',
      ingredients: [
        { id: 'lettuce_base', name: 'Lettuce Base', price: 30, available: true, category: 'base' },
        { id: 'spinach', name: 'Spinach', price: 25, available: true, category: 'vegetables' },
        { id: 'tomato_cherry', name: 'Cherry Tomatoes', price: 20, available: true, category: 'vegetables' },
        { id: 'cucumber', name: 'Cucumber', price: 15, available: true, category: 'vegetables' },
        { id: 'chicken_grilled', name: 'Grilled Chicken', price: 80, available: true, category: 'protein' },
        { id: 'feta', name: 'Feta Cheese', price: 45, available: true, category: 'dairy' },
        { id: 'dressing', name: 'Dressing', price: 20, available: true, category: 'sauce' }
      ]
    },
    {
      id: '4',
      name: 'Sandwich',
      description: 'Custom sandwich with quality ingredients',
      image: '🥪',
      ingredients: [
        { id: 'bread', name: 'Bread Slices', price: 20, available: true, category: 'base' },
        { id: 'turkey', name: 'Turkey Slices', price: 60, available: true, category: 'protein' },
        { id: 'ham', name: 'Ham', price: 55, available: true, category: 'protein' },
        { id: 'swiss', name: 'Swiss Cheese', price: 35, available: true, category: 'dairy' },
        { id: 'lettuce_leaf', name: 'Lettuce Leaves', price: 10, available: true, category: 'vegetables' },
        { id: 'mayo', name: 'Mayonnaise', price: 15, available: true, category: 'sauce' }
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
    const options = {
      key: 'your_razorpay_key',
      amount: getTotalCartValue() * 100,
      currency: 'INR',
      name: 'Food Dispensing System',
      description: 'Food Order Payment',
      handler: () => {
        // console.log('Payment successful:', response);
        setCart([]);
        setShowPayment(false);
        alert('Payment successful! Your order is being prepared.');
      }
    };
    
    // console.log('Payment processed with options:', options);
    setCart([]);
    setShowPayment(false);
    alert('Payment successful! Your order is being prepared.');
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