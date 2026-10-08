import type { ReactNode } from "react";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-[88px] xl:pl-[256px]">
      <Sidebar />
      <main>{children}</main>
      <MobileNav />
    </div>
  );
}
