"use client";
import { api } from "@/lib/config/axios";
import { useState } from "react";

export default function MotorControl() {
  const [status, setStatus] = useState("OFF");

  const toggleMotor = async (state: "on" | "off") => {
    const res = await api.get(`http://<ESP32_IP>/motor/${state}`);
    console.log(res)
    if (res?.data) {
      setStatus(state.toUpperCase());
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl">Motor Status: {status}</h1>
      <button
        className="bg-green-500 text-white p-2 m-2 rounded"
        onClick={() => toggleMotor("on")}
      >
        Turn ON
      </button>
      <button
        className="bg-red-500 text-white p-2 m-2 rounded"
        onClick={() => toggleMotor("off")}
      >
        Turn OFF
      </button>
    </div>
  );
}
