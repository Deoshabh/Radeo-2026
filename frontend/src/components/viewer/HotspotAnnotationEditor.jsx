import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

export default function HotspotAnnotationEditor({
  hotspots = [],
  currentFrame = 0,
  editable = false,
  onAddHotspot,
  onRemoveHotspot,
}) {
  const visibleHotspots = hotspots.filter((item) => item.frame === currentFrame);

  if (!editable && visibleHotspots.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0"
      onClick={(event) => {
        if (!editable || !onAddHotspot) return;
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        onAddHotspot({ x, y, frame: currentFrame, label: `Hotspot ${hotspots.length + 1}` });
      }}
    >
      {visibleHotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
        >
          <div className="w-4 h-4 rounded-full bg-brand-brown border-2 border-white shadow" />
          <div className="mt-1 text-[10px] text-white bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
            {hotspot.label}
          </div>
          {editable && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveHotspot?.(hotspot.id);
              }}
              className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-0.5 shadow"
            >
              <FiTrash2 size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
