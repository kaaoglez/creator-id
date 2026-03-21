"use client";
import { useEffect, useRef, useState } from "react";

export default function InfiniteCarousel({
  slides,
  autoPlay = true,
  interval = 3000,
}: {
  slides: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState([...slides, ...slides]); // duplicamos
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex((prev) => prev - 1);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${index * 100}%)`;

    const handle = setTimeout(() => {
      setIsAnimating(false);

      // 🔥 reset invisible cuando pasamos la mitad
      if (index >= slides.length) {
        track.style.transition = "none";
        setIndex(0);
        track.style.transform = `translateX(0%)`;
      }

      if (index < 0) {
        track.style.transition = "none";
        setIndex(slides.length - 1);
        track.style.transform = `translateX(-${(slides.length - 1) * 100}%)`;
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [index, slides.length]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [index]);

  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div
        ref={trackRef}
        style={{
          display: "flex",
          width: `${items.length * 100}%`,
        }}
      >
        {items.map((slide, i) => (
          <div key={i} style={{ flex: "0 0 100%" }}>
            {slide}
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
        }}
      >
        ←
      </button>

      <button
        onClick={next}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
        }}
      >
        →
      </button>
    </div>
  );
}