import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Auto Routes & Stands | Contributor Panel - Kolkata Auto Finder",
    description: "Contribute to Kolkata's auto route database. Add new auto stands, create routes, and help other commuters find the best transportation options.",
    keywords: "add auto stand Kolkata, auto route contributor, Kolkata transport, auto stand addition",
};

export default function ContributorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
