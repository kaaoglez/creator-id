'use client'

import NavBar from "@/components/NavBar";
import InstallPrompt from "@/components/InstallPrompt";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {children}
      </main>
      <InstallPrompt />
    </>
  );
}