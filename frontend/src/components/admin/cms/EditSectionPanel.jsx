import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { getTemplateByType } from '@/constants/section-registry';

export default function EditSectionPanel({ section, onSave, onCancel }) {
    const [formData, setFormData] = useState({});
    const template = getTemplateByType(section?.type);

    useEffect(() => {
        if (section) {
            setFormData(section.data || {});
        }
    }, [section]);

    if (!section || !template) return null;

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(section.id, formData);
    };

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col h-full animate-slide-in-right">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Edit {template.label}</h3>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <FiX size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <form id="edit-section-form" onSubmit={handleSubmit} className="space-y-4">
                    {template.fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>

                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}

                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    value={formData[field.name] || 0}
                                    onChange={(e) => handleChange(field.name, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}

                            {field.type === 'textarea' && (
                                <textarea
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                />
                            )}

                            {field.type === 'select' && (
                                <select
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}

                            {field.help && (
                                <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                            )}
                        </div>
                    ))}
                </form>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                    type="submit"
                    form="edit-section-form"
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                    <FiCheck /> Save Changes
                </button>
            </div>
        </div>
    );
}
