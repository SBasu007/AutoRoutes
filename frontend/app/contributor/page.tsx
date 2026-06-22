"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import ContributorComingSoon from "../../components/coming-soon/ContributorComingSoon";
import ContributorContent from "./ContributorContent";

export default function ContributorPage() {
    const showContributor = process.env.NEXT_PUBLIC_SHOW_CONTRIBUTOR === "true";
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!showContributor) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/contributor");
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, router, showContributor]);

    if (!showContributor) {
        return <ContributorComingSoon />;
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-semibold">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return <ContributorContent />;
}
