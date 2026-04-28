"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SignaturePadProps {
  onSignature: (dataUrl: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSignature,
  onClear,
  width = 400,
  height = 160,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#0a0a1e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [width, height]);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || !lastPos.current) return;

      const pos = getPos(e, canvas);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPos.current = pos;
      setHasSignature(true);
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      setIsDrawing(false);
      lastPos.current = null;

      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        onSignature(canvas.toDataURL("image/png"));
      }
    },
    [isDrawing, hasSignature, onSignature],
  );

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "#eeeef2",
          position: "relative",
          touchAction: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "Inter",
                fontSize: "13px",
                color: "rgba(0,0,0,0.25)",
              }}
            >
              Draw your signature here
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleClear}
        type="button"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: "6px",
          padding: "4px 10px",
          color: "rgba(0,0,0,0.50)",
          fontFamily: "Inter",
          fontSize: "11px",
          cursor: "pointer",
        }}
      >
        Clear
      </button>
    </div>
  );
}
