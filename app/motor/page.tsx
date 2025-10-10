"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");

  const moveServo = async (servo: number, angle: number) => {
    try {
      const res = await fetch("/api/sendServos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servo1: servo === 1 ? angle : 90,
          servo2: servo === 2 ? angle : 90,
          servo3: servo === 3 ? angle : 90,
          servo4: servo === 4 ? angle : 90,
        }),
      });

      const data = await res.json();
      setStatus(`Servo ${servo} moved to ${angle}° | Entry ID: ${data.entryId}`);
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    }
  };

  const angles = [0, 45, 90, 135, 180];

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Servo Control</h1>
      {[1, 2, 3, 4].map((servo) => (
        <div key={servo} style={{ marginBottom: 10 }}>
          <h3>Servo {servo}</h3>
          {angles.map((angle) => (
            <button
              key={angle}
              onClick={() => moveServo(servo, angle)}
              style={{ marginRight: 5 }}
            >
              {angle}°
            </button>
          ))}
        </div>
      ))}
      <p>{status}</p>
    </div>
  );
}
