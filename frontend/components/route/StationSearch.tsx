"use client";

import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";

import { Station } from "@/types/station";
import { searchLocation } from "@/services/nominatim.service";

interface Props {
    placeholder: string;
    type: "source" | "destination";
    onSelect: (station: Station) => void;
}

export default function StationSearch({
    placeholder,
    type,
    onSelect,
}: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Station[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 3) {
                setResults([]);
                return;
            }

            try {
                setLoading(true);

                const data = await searchLocation(query);

                setResults(data.slice(0, 6));
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative">
                <Search
                    size={16}
                    className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-black/50
            pointer-events-none
          "
                />

                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="
            w-full
            h-11
            pl-10
            pr-4
            rounded-xl
            border
            border-gray-200
            bg-white
            text-black
            text-sm
            font-medium
            placeholder:text-black/40
            outline-none
            focus:border-black
            focus:ring-2
            focus:ring-black/5
            transition-all
          "
                />
            </div>

            {/* Dropdown */}
            {(results.length > 0 || loading) && (
                <div
                    className="
            absolute
            top-full
            mt-2
            w-full
            bg-white
            rounded-2xl
            border
            border-gray-200
            shadow-xl
            overflow-hidden
            z-[2000]
          "
                >
                    {loading && (
                        <div className="px-4 py-3 text-sm text-black">
                            Searching...
                        </div>
                    )}

                    {!loading &&
                        results.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setQuery(item.name);
                                    setResults([]);
                                    onSelect(item);
                                }}
                                className="
                  w-full
                  flex
                  items-start
                  gap-3
                  px-4
                  py-3
                  text-left
                  hover:bg-gray-50
                  transition
                "
                            >
                                <MapPin
                                    size={16}
                                    className="
                    mt-0.5
                    shrink-0
                    text-black/70
                  "
                                />

                                <span
                                    className="
                    text-sm
                    text-black
                    line-clamp-2
                  "
                                >
                                    {item.name}
                                </span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}