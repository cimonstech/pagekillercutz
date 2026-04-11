/**
 * ShaderBackground — layered radial-gradient orbs with slow CSS animation.
 * Mimics a GPU gradient shader: multiple focal lights (cyan, gold, rose)
 * at different depths, with a fine noise grain for texture.
 *
 * Server component — no JS, pure CSS animation via globals.css keyframes.
 */
export default function ShaderBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Orb A: large cyan, top-right — primary light source ── */}
      <div
        className="shader-orb-a absolute"
        style={{
          top: "-20%",
          right: "-8%",
          width: "min(800px, 65vw)",
          height: "min(700px, 60vh)",
          background:
            "radial-gradient(ellipse at 60% 40%, rgba(0,191,255,0.20) 0%, rgba(0,191,255,0.07) 35%, transparent 68%)",
        }}
      />

      {/* ── Orb B: gold, bottom-left — warm counter-light ── */}
      <div
        className="shader-orb-b absolute"
        style={{
          bottom: "-8%",
          left: "-12%",
          width: "min(700px, 55vw)",
          height: "min(600px, 55vh)",
          background:
            "radial-gradient(ellipse at 40% 60%, rgba(245,166,35,0.13) 0%, rgba(245,166,35,0.04) 38%, transparent 68%)",
        }}
      />

      {/* ── Orb C: cyan, mid-left — secondary fill ── */}
      <div
        className="shader-orb-c absolute"
        style={{
          top: "40%",
          left: "2%",
          width: "min(500px, 38vw)",
          height: "min(420px, 38vh)",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,191,255,0.09) 0%, transparent 65%)",
        }}
      />

      {/* ── Orb D: rose, mid-right — subtle warmth accent ── */}
      <div
        className="shader-orb-d absolute"
        style={{
          top: "25%",
          right: "12%",
          width: "min(420px, 32vw)",
          height: "min(360px, 32vh)",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,147,153,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Orb E: wide diffuse cyan — atmospheric base ── */}
      <div
        className="shader-orb-e absolute"
        style={{
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(900px, 80vw)",
          height: "min(500px, 45vh)",
          background:
            "radial-gradient(ellipse at 50% 80%, rgba(0,191,255,0.06) 0%, transparent 60%)",
        }}
      />

      {/* ── Orb F: gold mid-top — bridge between A and B ── */}
      <div
        className="shader-orb-f absolute"
        style={{
          top: "15%",
          left: "30%",
          width: "min(380px, 28vw)",
          height: "min(320px, 28vh)",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(245,166,35,0.06) 0%, transparent 65%)",
        }}
      />

      {/* ── Noise grain — breaks up banding, gives shader texture ── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
}
