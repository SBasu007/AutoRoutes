import "./globals.css";
import type { Viewport } from "next";

export const metadata = {
    title: "Auto Route Finder",
    description: "OpenStreetMap Route Finder",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className="
          antialiased
          overflow-hidden
        "
            >
                {children}
            </body>
        </html>
    );
}