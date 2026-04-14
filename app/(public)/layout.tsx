import PublicSidebar from "@/components/layout/PublicSidebar";
import PublicTopBar from "@/components/layout/PublicTopBar";
import PublicFooter from "@/components/layout/PublicFooter";
import ShaderBackground from "@/components/ui/ShaderBackground";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ ["--player-bottom" as string]: "0px" }}>
      <ShaderBackground />
      <PublicSidebar />
      <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col ml-0 sm:ml-[calc(16px+56px+24px)]">
        <PublicTopBar />
        <main className="min-w-0 flex-1 pb-[var(--player-offset,0px)]">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
