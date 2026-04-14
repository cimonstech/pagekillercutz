import PublicSidebar from "@/components/layout/PublicSidebar";
import PublicTopBar from "@/components/layout/PublicTopBar";
import PublicFooter from "@/components/layout/PublicFooter";
import MobileLayout from "@/components/layout/MobileLayout";
import CartDrawer from "@/components/merch/CartDrawer";
import ShaderBackground from "@/components/ui/ShaderBackground";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#08080F" }}>
      <ShaderBackground />
      <CartDrawer />

      <div className="desktop-only">
        <PublicSidebar />
        <div className="relative z-10 ml-0 flex min-h-screen min-w-0 flex-1 flex-col sm:ml-[calc(16px+56px+24px)]">
          <PublicTopBar />
          <main className="min-w-0 flex-1 pb-[var(--player-offset,0px)]">{children}</main>
          <PublicFooter />
        </div>
      </div>

      <div className="mobile-only relative z-10">
        <MobileLayout>
          {children}
        </MobileLayout>
      </div>
    </div>
  );
}
