import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Auto Route Finder | Find Nearest Auto Stand & Routes in Kolkata",
    description: "Find the best auto routes near you in Kolkata. Search for nearest auto stands, shared auto services, auto to airport routes, and real-time auto availability.",
    keywords: "auto route finder near me, auto stand near me, shared auto near me, nearest auto route, auto to airport, auto available near me, Kolkata auto map, auto route Kolkata",
};

export default function RouteFinderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
