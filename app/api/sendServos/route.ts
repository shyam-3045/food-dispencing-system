import { NextRequest, NextResponse } from "next/server";

// Map quantity to servo angle (example: 1 → 45°, 2 → 90°, 3 → 135°, 4+ → 180°)
const quantityToAngle = (quantity: number) => Math.min(45 * quantity, 180);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract quantity and ingredients
    const { quantity, selectedIngredients } = body;

    // Prepare servo angles (max 4 servos)
    const angles = [0, 0, 0, 0]; // default 0
    for (let i = 0; i < Math.min(4, selectedIngredients.length); i++) {
      angles[i] = quantityToAngle(quantity);
    }
   
    // ThingSpeak Write API Key
    const writeKey = "JQJB5PHEB1H1EKOG"; // replace with your ThingSpeak write key

    // Build ThingSpeak URL
    const url = `https://api.thingspeak.com/update?api_key=${writeKey}` +
                `&field1=${angles[0]}&field2=${angles[1]}&field3=${angles[2]}&field4=${angles[3]}`;

    // Send to ThingSpeak
    console.log("requesting ...")
    const res = await fetch(url);
    console.log("request sent",angles)
    const text = await res.text();

    return NextResponse.json({
      status: "ok",
      servoAngles: angles,
      response: text
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { status: "error", message: "Failed to send to ThingSpeak" },
      { status: 500 }
    );
  }
}
