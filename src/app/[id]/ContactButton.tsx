"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  creatorId: string;
}

export default function ContactButton({ creatorId }: Props) {
  const [sent, setSent] = useState(false);

  async function handleContact() {
    try {
      await supabase.from("messages").insert([
        {
          creator_id: creatorId,
          message: "Alguien quiere contactarte desde Creator-ID",
          created_at: new Date().toISOString(),
        },
      ]);
      setSent(true);
    } catch (err) {
      console.log(err);
      alert("Error sending message");
    }
  }

  return sent ? (
    <p style={{ color: "green", fontWeight: "bold" }}>
      Your message was sent to the creator!
    </p>
  ) : (
    <button
      onClick={handleContact}
      style={{
        padding: "12px 25px",
        backgroundColor: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        transition: "background-color 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#3730a3")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
    >
      Contact Creator
    </button>
  );
}