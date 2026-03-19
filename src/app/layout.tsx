import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Providers } from "./providers";
import ClientLayout from "./ClientLayout";
import Footer from "@/components/Footer"; // 👈 IMPORTAMOS EL FOOTER

export const metadata: Metadata = {
  title: "Creator ID Platform",
  description: "Identidad digital única para creadores",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body style={{ 
  margin: 0, 
  fontFamily: "sans-serif",
  backgroundColor: "#f5f5f5",
  flexDirection: "column",
  minHeight: "100vh"
}}>
  <LanguageProvider>
    <AuthProvider>
      <Providers>
        <ClientLayout>
          {/* El contenido principal con su propio ancho */}
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 20px 40px 20px",
            width: "100%",
            flex: 1
          }}>
            {children}
          </div>
          {/* Footer FUERA del contenedor centrado */}
          <Footer />
        </ClientLayout>
      </Providers>
    </AuthProvider>
  </LanguageProvider>
</body>
    </html>
  );
}