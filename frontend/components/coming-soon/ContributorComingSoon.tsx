"use client";

import Sidebar from "../../components/sidebar/Sidebar";
import { Users, Phone, Banknote, MapPin } from "lucide-react";

export default function ContributorPage() {
    return (
        <div className="h-screen flex bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-lg w-full border border-gray-100">
                    <div className="relative inline-block mb-8">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100">
                            <Users className="w-10 h-10 text-blue-600" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border-2 border-white">
                            Coming Soon
                        </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Join as a Contributor
                    </h1>
                    
                    <p className="text-gray-600 mb-8 text-lg">
                        Help us map auto routes in Kolkata and earn rewards for every successful contribution!
                    </p>

                    <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Banknote className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-blue-900">Earn ₹100 per Task</h2>
                        </div>
                        <p className="text-sm text-blue-700 font-medium">
                            Our contributor program is launching very soon. Be the first to join and start earning!
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            For Fast Joining & Enquiries
                        </p>
                        <a 
                            href="tel:+919831209756"
                            className="inline-flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                            <Phone className="w-5 h-5 text-gray-300" />
                            Call +91 9831209756
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}