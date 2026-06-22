"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Map, Users, User, LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

function SidebarInner() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, user, logout } = useAuthStore();
    const showContributor = process.env.NEXT_PUBLIC_SHOW_CONTRIBUTOR === "true";

    const redirectParam = searchParams.get("redirect");
    const effectivePath = (pathname === "/login" || pathname === "/signup")
        ? (redirectParam || "/contributor")
        : pathname;

    const menu = [
        {
            name: "Find Routes",
            icon: Map,
            href: "/route-finder",
            ariaLabel: "Find auto routes, nearest auto stand, and shared auto services near you",
        },
        {
            name: "Contributor",
            icon: Users,
            href: "/contributor",
            ariaLabel: "Add new auto stands and routes to help the community",
        },
        {
            name: "Profile",
            icon: User,
            href: "/profile",
            ariaLabel: "Manage your profile and favorite routes",
        },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-white border-r flex-col" role="navigation" aria-label="Main navigation for auto route finder">
                <div className="p-6 border-b">
                    <h1 className="font-bold text-xl text-black">
                        Map My Auto 🛺
                    </h1>
                    <p className="text-xs text-gray-500 mt-2">Find nearest auto, shared auto routes, and auto stands in Kolkata</p>
                </div>

                <nav className="p-4 space-y-2" aria-label="Navigation menu">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const active = effectivePath === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.ariaLabel}
                                aria-label={item.ariaLabel}
                                className={`flex items-center gap-3 p-3 rounded-xl transition
                                ${active
                                        ? "bg-blue-500 text-white"
                                        : "text-black hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* {isAuthenticated && user && (
                    <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                                {user.username.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                                <p className="text-xs text-gray-500 truncate">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                router.push("/login");
                            }}
                            className="mt-1 w-full flex items-center justify-center gap-2 p-2 border border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                )} */}

                <div className="mt-auto p-4 border-t text-xs text-gray-500">
                    <p className="font-semibold mb-2">Popular Searches:</p>
                    <div className="space-y-1">
                        <p>• Auto near Dumdum Airport</p>
                        <p>• Shared Auto Howrah Station</p>
                        <p>• Route to Sector V</p>
                        <p>• Auto Stand Sealdah</p>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            {/* Mobile Floating Bottom Navigation */}
            <nav
                className="
    md:hidden
    fixed
    bottom-4
    left-1/2
    -translate-x-1/2
    z-[2000]
    w-[92%]
    max-w-sm
  "
                aria-label="Mobile navigation"
            >
                <div
                    className="
      bg-white/95
      backdrop-blur-md
      border
      border-gray-200
      rounded-2xl
      shadow-xl
      px-2
      py-2
    "
                >
                    <div className="grid grid-cols-3 gap-1">
                        {menu.map((item) => {
                            const Icon = item.icon;
                            const active = effectivePath === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.ariaLabel}
                                    aria-label={item.ariaLabel}
                                    aria-current={active ? "page" : undefined}
                                    className={`
              flex
              flex-col
              items-center
              justify-center
              py-3
              rounded-xl
              transition-all
              duration-200
              ${active
                                            ? "bg-black text-white"
                                            : "text-black hover:bg-gray-100"
                                        }
            `}
                                >
                                    <Icon
                                        size={20}
                                        strokeWidth={active ? 2.5 : 2}
                                        aria-hidden="true"
                                    />

                                    <span className="text-xs mt-1 font-medium">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
}

export default function Sidebar() {
    return (
        <Suspense fallback={
            <aside className="hidden md:flex w-72 bg-white border-r flex-col" />
        }>
            <SidebarInner />
        </Suspense>
    );
}