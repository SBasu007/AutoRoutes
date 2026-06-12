import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "User Profile | Auto Route Finder Kolkata",
    description: "Manage your profile, view your favorite routes, and track your auto journey history on Kolkata's auto route finder.",
    keywords: "user profile, favorite routes, auto journey history, Kolkata transport",
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
