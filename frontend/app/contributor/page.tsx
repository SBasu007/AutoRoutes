"use client";

import ContributorComingSoon from "../../components/coming-soon/ContributorComingSoon";
import ContributorContent from "./ContributorContent";

export default function ContributorPage() {
    const showContributor = process.env.NEXT_PUBLIC_SHOW_CONTRIBUTOR === "true";

    if (!showContributor) {
        return <ContributorComingSoon />;
    }

    return <ContributorContent />;
}
