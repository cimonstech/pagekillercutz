import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080F",
          borderRadius: 40,
          color: "#00BFFF",
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "Inter, Arial, sans-serif",
          border: "2px solid rgba(0,191,255,0.5)",
        }}
      >
        PK
      </div>
    ),
    size,
  );
}

