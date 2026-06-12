import "./globals.css";
import type { Viewport, Metadata } from "next";

export const metadata: Metadata = {
    title: "Auto Route Finder Kolkata | Find Nearest Auto Stand & Shared Auto Routes",
    description: "Find auto routes in Kolkata with ease. Discover nearest auto stands, shared auto services, auto to airport routes, and the best auto route finder near you. Get real-time auto availability and fare information.",
    keywords: "auto route finder Kolkata, auto stand near me, shared auto near me, nearest auto route, auto to airport Kolkata, auto route Kolkata, Kolkata auto routes, Kolkata auto map, auto stand Kolkata, route planner Kolkata, local transport Kolkata",
    metadataBase: new URL("https://mapmyauto.com"),
    alternates: {
        canonical: "https://mapmyauto.com",
    },
    openGraph: {
        type: "website",
        locale: "en_IN",
        url: "https://mapmyauto.com",
        siteName: "Auto Route Finder Kolkata",
        title: "Auto Route Finder Kolkata | Find Nearest Auto & Shared Services",
        description: "Find the best auto routes, nearest auto stands, and shared auto services in Kolkata. Navigate easily with our route finder.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Auto Route Finder Kolkata",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Auto Route Finder Kolkata",
        description: "Find nearest auto stand, shared auto routes, and best transport options in Kolkata",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
        },
    },
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
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Auto Route Finder Kolkata",
        description: "Find auto routes, nearest auto stands, and shared auto services in Kolkata",
        url: "https://mapmyauto.com",
        applicationCategory: "UtilitiesApplication",
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: "0",
            description: "Free auto route finding and navigation service",
        },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: "https://mapmyauto.com/route-finder?search={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
        areaServed: {
            "@type": "City",
            name: "Kolkata",
            geo: {
                "@type": "GeoShape",
                latitude: "22.5726",
                longitude: "88.3639",
            },
        },
    };

    return (
        <html lang="en">
            <head>
                <meta name="msvalidate.01" content="D58CC15D52E6C09C5E17E74D0296B7FF" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
                />
            </head>
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