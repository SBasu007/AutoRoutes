"use client";

import Sidebar from "../../components/sidebar/Sidebar";
import { UserCircle2 } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-lg w-full border border-gray-100">
                    <div className="relative inline-block mb-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto border-4 border-gray-100">
                            <UserCircle2 className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border-2 border-white">
                            Coming Soon
                        </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        User Profile
                    </h1>
                    
                    <p className="text-gray-500 mb-8 text-lg font-medium">
                        Your personalized dashboard and saved routes are currently under development. Stay tuned for updates!
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-gray-700 font-semibold mb-2">What to expect:</h2>
                        <ul className="text-sm text-gray-500 space-y-2 text-left list-disc pl-6">
                            <li>Save your favorite daily routes</li>
                            <li>Track your contributions & earnings</li>
                            <li>Personalized route recommendations</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}