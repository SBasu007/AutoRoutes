"use client";

import Link from "next/link";
import { Map, Users, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();
    const showContributor = process.env.NEXT_PUBLIC_SHOW_CONTRIBUTOR === "true";

    const menu = [
        {
            name: "Find",
            icon: Map,
            href: "/route-finder",
        },
        ...(showContributor ? [{
            name: "Contributor",
            icon: Users,
            href: "/contributor",
        }] : []),
        {
            name: "Profile",
            icon: User,
            href: "/profile",
        },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-white border-r flex-col">
                <div className="p-6 border-b">
                    <h1 className="font-bold text-xl text-black">
                        🛺 Auto Route Finder
                    </h1>
                </div>

                <nav className="p-4 space-y-2">
                    {menu.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-xl transition
                                ${pathname === item.href
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
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
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