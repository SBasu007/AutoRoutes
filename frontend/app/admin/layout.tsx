import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Portal | MapMyAuto",
    description: "Restricted admin portal for MapMyAuto. Review and approve contributor submissions.",
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
