'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiCommand, FiShoppingBag, FiUsers, FiBox, FiSettings, FiHome, FiCreditCard, FiGrid } from 'react-icons/fi';

export default function AdminCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Toggle with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const commands = [
        {
            id: 'home',
            label: 'Go to Dashboard',
            icon: FiHome,
            action: () => router.push('/admin')
        },
        {
            id: 'products-list',
            label: 'Manage Products',
            icon: FiBox,
            action: () => router.push('/admin/products')
        },
        {
            id: 'products-bulk',
            label: 'Bulk Edit Products',
            icon: FiGrid,
            action: () => router.push('/admin/products/bulk')
        },
        {
            id: 'products-new',
            label: 'Add New Product',
            icon: FiPlus,
            action: () => router.push('/admin/products/new')
        },
        {
            id: 'orders',
            label: 'View Orders',
            icon: FiShoppingBag,
            action: () => router.push('/admin/orders')
        },
        {
            id: 'customers',
            label: 'View Customers',
            icon: FiUsers,
            action: () => router.push('/admin/users')
        },
        {
            id: 'settings',
            label: 'Site Settings',
            icon: FiSettings,
            action: () => router.push('/admin/cms')
        },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection on query change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleNavigation = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, filteredCommands, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Palette */}
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
                <div className="flex items-center px-4 border-b border-gray-100">
                    <FiSearch className="text-gray-400 w-5 h-5 mr-3" />
                    <input
                        type="text"
                        className="w-full py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                        placeholder="Type a command or search..."
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        <span className="font-mono">ESC</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No results found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCommands.map((cmd, index) => {
                                const Icon = cmd.icon;
                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={() => {
                                            cmd.action();
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-colors ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <Icon className={`w-4 h-4 ${index === selectedIndex ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <span className="flex-1 font-medium">{cmd.label}</span>
                                        {index === selectedIndex && (
                                            <FiCommand className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                    <span>Navigate with <span className="font-mono">↑↓</span></span>
                    <span>Select with <span className="font-mono">Enter</span></span>
                </div>
            </div>
        </div>
    );
}

// Icon helper for consistent import
function FiPlus(props) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
