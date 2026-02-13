import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMove, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

export default function SortableSection({ id, section, onDelete, onEdit, onToggle }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white border rounded-lg shadow-sm transition-all group ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                }`}
        >
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-move text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    >
                        <FiMove />
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-gray-700 truncate">
                            {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                        </span>
                        <span className="text-xs text-gray-400 truncate">ID: {section.id.slice(0, 8)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onToggle(section.id)}
                        title={section.enabled ? "Hide" : "Show"}
                        className={`p-1.5 rounded transition-colors ${section.enabled ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                        {section.enabled ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    </button>
                    <button
                        onClick={() => onEdit(section)}
                        title="Edit"
                        className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    >
                        <FiEdit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(section.id)}
                        title="Delete"
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                    >
                        <FiTrash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
