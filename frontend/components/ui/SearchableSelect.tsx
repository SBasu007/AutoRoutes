import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, X } from 'lucide-react';

interface Option {
    id: number;
    name: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: number | null;
    onChange: (id: number | null) => void;
    placeholder?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Search...' }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync selected value to the search term when dropdown is closed
    useEffect(() => {
        if (!isOpen) {
            const selectedOpt = options.find(opt => opt.id === value);
            setSearchTerm(selectedOpt ? selectedOpt.name : '');
        }
    }, [value, isOpen, options]);

    // Filter options when debounced search term changes
    useEffect(() => {
        if (debouncedSearchTerm) {
            const lowercased = debouncedSearchTerm.toLowerCase();
            setFilteredOptions(options.filter(opt => opt.name.toLowerCase().includes(lowercased)));
        } else {
            setFilteredOptions(options);
        }
    }, [debouncedSearchTerm, options]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                </div>
                <input
                    type="text"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : (options.find(opt => opt.id === value)?.name || '')}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearchTerm('');
                    }}
                />
                {value && !isOpen && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                            setSearchTerm('');
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        <X size={18} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-black hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                onClick={() => {
                                    onChange(opt.id);
                                    setSearchTerm(opt.name);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.name}
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">No stands found</div>
                    )}
                </div>
            )}
        </div>
    );
}
