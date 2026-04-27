import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, #12162A 0%, #08080F 70%)",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 9999,
            border: "6px solid rgba(0,191,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00BFFF",
            fontSize: 178,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            fontFamily: "Inter, Arial, sans-serif",
            boxShadow: "0 0 40px rgba(0,191,255,0.28)",
          }}
        >
          PK
        </div>
      </div>
    ),
    size,
  );
}

