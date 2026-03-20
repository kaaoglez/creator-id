'use client'

import { useEffect, useRef, useState } from "react";

type Props = {
  slides: any[];
  autoPlay?: boolean;
  interval?: number;
  isMobile?: boolean;
};

export default function InfiniteCarousel({
  slides,
  autoPlay = true,
  interval = 4000,
  isMobile = false,
}: Props) {
  const [index, setIndex] = useState(1);
  const [transition, setTransition] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  // swipe
  const startX = useRef(0);
  const endX = useRef(0);

  const extendedSlides = [
    slides[slides.length - 1],
    ...slides,
    slides[0],
  ];

  const next = () => setIndex((prev) => prev + 1);
  const prev = () => setIndex((prev) => prev - 1);

  // mover carrusel
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    slider.style.transition = transition
      ? "transform 0.5s ease-in-out"
      : "none";

    slider.style.transform = `translateX(-${index * 100}%)`;
  }, [index, transition]);

  // loop infinito
  useEffect(() => {
    if (index === extendedSlides.length - 1) {
      setTimeout(() => {
        setTransition(false);
        setIndex(1);
      }, 500);
    }

    if (index === 0) {
      setTimeout(() => {
        setTransition(false);
        setIndex(extendedSlides.length - 2);
      }, 500);
    }
  }, [index, extendedSlides.length]);

  // reactivar transición
  useEffect(() => {
    if (!transition) {
      requestAnimationFrame(() => setTransition(true));
    }
  }, [transition]);

  // autoplay
  useEffect(() => {
    if (!autoPlay || isHovered) return;

    const timer = setInterval(() => {
      next();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered]);

  // swipe móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    endX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = startX.current - endX.current;

    if (diff > 50) next();
    if (diff < -50) prev();
  };

  return (
    <div
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={sliderRef}
        style={{
          display: "flex",
          width: `${extendedSlides.length * 100}%`,
        }}
      >
        {extendedSlides.map((slide, i) => (
          <div
            key={i}
            style={{
              flex: "0 0 100%",
              boxSizing: "border-box",
              padding: isMobile ? "10px" : "20px",
            }}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* botones */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: isMobile ? "32px" : "40px",
              height: isMobile ? "32px" : "40px",
              background: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: isMobile ? "1rem" : "1.2rem",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ←
          </button>

          <button
            onClick={next}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: isMobile ? "32px" : "40px",
              height: isMobile ? "32px" : "40px",
              background: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: isMobile ? "1rem" : "1.2rem",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            →
          </button>
        </>
      )}

      {/* dots */}
      {slides.length > 1 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          {slides.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i + 1)}
              style={{
                margin: "0 5px",
                cursor: "pointer",
                color: index - 1 === i ? "#4f46e5" : "#ccc",
                fontSize: isMobile ? "12px" : "18px",
                transition: "color 0.3s"
              }}
            >
              ●
            </span>
          ))}
        </div>
      )}
    </div>
  );
}