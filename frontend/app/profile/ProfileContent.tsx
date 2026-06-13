"use client";

import Sidebar from "../../components/sidebar/Sidebar";

export default function ProfileContent() {
    return (
        <div className="h-screen flex">

            <Sidebar />

            <div className="flex-1 flex items-center justify-center bg-gray-100 pb-20 md:pb-0">

                <div className="bg-white p-10 rounded-2xl border">

                    <h1 className="text-2xl font-bold mb-2">
                        Profile
                    </h1>

                    <p className="text-gray-500">
                        Coming Soon...
                    </p>

                </div>

            </div>

        </div>
    );
}