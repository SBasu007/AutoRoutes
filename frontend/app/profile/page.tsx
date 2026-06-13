"use client";

import ProfileComingSoon from "../../components/coming-soon/ProfileComingSoon";
import ProfileContent from "./ProfileContent";

export default function ProfilePage() {
    const showContributor = process.env.NEXT_PUBLIC_SHOW_CONTRIBUTOR === "true";

    if (!showContributor) {
        return <ProfileComingSoon />;
    }

    return <ProfileContent />;
}
