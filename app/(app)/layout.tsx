import AppSidebar from "@/components/layout/AppSidebar";
import CartDrawer from "@/components/merch/CartDrawer";

/**
 * Client portal shell: floating glass rail + main canvas.
 * Bottom player is global (`GlobalPlayerMount`) and only renders when a track is playing.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#08080F] font-body text-on-surface antialiased">
      <AppSidebar />
      <CartDrawer />
      <main
        className="min-h-screen min-w-0 pb-[var(--player-offset,0px)]"
        style={{
          marginLeft: 104,
          padding: 32,
        }}
      >
        {children}
      </main>
    </div>
  );
}
