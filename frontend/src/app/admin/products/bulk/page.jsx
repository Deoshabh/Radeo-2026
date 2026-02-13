'use client';

import AdminLayout from '@/components/AdminLayout';
import BulkProductEditor from '@/components/admin/products/BulkProductEditor';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function BulkEditPage() {
    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
                <div className="mb-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products" className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <FiArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Bulk Product Editor</h1>
                            <p className="text-sm text-gray-500">Edit multiple products at once</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <BulkProductEditor />
                </div>
            </div>
        </AdminLayout>
    );
}
