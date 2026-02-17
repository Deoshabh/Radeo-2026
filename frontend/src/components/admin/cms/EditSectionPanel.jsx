import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { getTemplateByType } from '@/constants/section-registry';
import ImageUploader from './ImageUploader';
import toast from 'react-hot-toast';
import BlockTreeEditor from './BlockTreeEditor';
import { lintCssContent } from '@/utils/visualBuilder';

export default function EditSectionPanel({ section, hasActiveBanners = false, onSave, onCancel }) {
    const [formData, setFormData] = useState({});
    const [showAdvanced, setShowAdvanced] = useState(false);
    const template = getTemplateByType(section?.type);

    const advancedFieldNames = new Set([
        'customCss',
        'visibilityRules',
        'experiments',
        'blocks',
        'globalClassStyles',
    ]);

    useEffect(() => {
        if (section) {
            setFormData(section.data || {});
            setShowAdvanced(false);
        }
    }, [section]);

    if (!section || !template) return null;

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nextData = { ...formData };

        for (const field of template.fields) {
            if (field.type !== 'json') continue;

            const rawValue = nextData[field.name];
            if (rawValue == null || rawValue === '') {
                nextData[field.name] = field.defaultValue ?? null;
                continue;
            }

            if (typeof rawValue !== 'string') continue;

            try {
                nextData[field.name] = JSON.parse(rawValue);
            } catch {
                toast.error(`${field.label} must be valid JSON`);
                return;
            }
        }

        onSave(section.id, nextData);
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
                    {section.type === 'hero' && hasActiveBanners && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Active banners are currently overriding Hero section title/subtitle on the homepage. Update banners in CMS to change what appears in preview/live.
                        </div>
                    )}

                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced((prev) => !prev)}
                            className="w-full text-left text-sm font-medium text-gray-700"
                        >
                            {showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                            Advanced controls include custom CSS, rules, experiments, dynamic blocks, and global styles.
                        </p>
                    </div>

                    {template.fields.filter((field) => showAdvanced || !advancedFieldNames.has(field.name)).map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>

                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    value={formData[field.name] ?? ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}

                            {field.type === 'number' && (
                                <input
                                    type="number"
                                    value={formData[field.name] ?? 0}
                                    onChange={(e) => handleChange(field.name, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}

                            {field.type === 'textarea' && (
                                <textarea
                                    value={formData[field.name] ?? ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                />
                            )}

                            {field.type === 'code' && (
                                <>
                                    <textarea
                                        value={formData[field.name] ?? ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                        placeholder={field.placeholder || 'Enter CSS'}
                                    />
                                    {lintCssContent(formData[field.name] ?? '').map((warning) => (
                                        <p key={warning} className="text-[11px] text-amber-700 mt-1">⚠ {warning}</p>
                                    ))}
                                </>
                            )}

                            {field.type === 'json' && (
                                field.name === 'blocks' ? (
                                    <BlockTreeEditor
                                        value={formData[field.name]}
                                        onChange={(nextBlocks) => handleChange(field.name, nextBlocks)}
                                    />
                                ) : (
                                    <textarea
                                        value={typeof formData[field.name] === 'string'
                                            ? formData[field.name]
                                            : JSON.stringify(formData[field.name] ?? field.defaultValue ?? {}, null, 2)}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                                        placeholder={field.placeholder || '{\n  "key": "value"\n}'}
                                    />
                                )
                            )}

                            {field.type === 'toggle' && (
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData[field.name])}
                                        onChange={(e) => handleChange(field.name, e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{field.toggleLabel || 'Enabled'}</span>
                                </label>
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

                            {field.type === 'image' && (
                                <ImageUploader
                                    label={field.label}
                                    value={formData[field.name] || ''}
                                    onChange={(url) => handleChange(field.name, url)}
                                />
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
