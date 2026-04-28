"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/client/dashboard");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", color: "white", fontFamily: "Space Grotesk" }}>
        <div style={{ fontSize: "16px", marginBottom: "8px" }}>Taking you to your dashboard...</div>
        <div style={{ fontSize: "13px", color: "#5A6080" }}>You can sign your agreement there.</div>
      </div>
    </div>
  );
}
