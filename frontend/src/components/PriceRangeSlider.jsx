'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/utils/helpers';

export default function PriceRangeSlider({ min, max, value, onChange }) {
  const [minValue, setMinValue] = useState(value?.min || min);
  const [maxValue, setMaxValue] = useState(value?.max || max);

  useEffect(() => {
    if (value) {
      setMinValue(value.min || min);
      setMaxValue(value.max || max);
    }
  }, [value, min, max]);

  const handleMinChange = (e) => {
    const newMin = Math.min(Number(e.target.value), maxValue - 1000);
    setMinValue(newMin);
  };

  const handleMaxChange = (e) => {
    const newMax = Math.max(Number(e.target.value), minValue + 1000);
    setMaxValue(newMax);
  };

  const handleMinBlur = () => {
    onChange({ min: minValue, max: maxValue });
  };

  const handleMaxBlur = () => {
    onChange({ min: minValue, max: maxValue });
  };

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--color-text-primary)' }}>
        <span>{formatPrice(minValue)}</span>
        <span>{formatPrice(maxValue)}</span>
      </div>

      <div className="relative h-[2px]">
        {/* Background track */}
        <div className="absolute w-full h-full" style={{ backgroundColor: 'var(--color-border)' }} />
        {/* Active track */}
        <div
          className="absolute h-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
            backgroundColor: 'var(--color-accent)',
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={minValue}
          onChange={handleMinChange}
          onMouseUp={handleMinBlur}
          onTouchEnd={handleMinBlur}
          className="absolute w-full h-[2px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm"
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={maxValue}
          onChange={handleMaxChange}
          onMouseUp={handleMaxBlur}
          onTouchEnd={handleMaxBlur}
          className="absolute w-full h-[2px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm"
        />
      </div>

      <div className="flex items-center gap-3 text-xs">
        <input
          type="number"
          value={minValue}
          onChange={handleMinChange}
          onBlur={handleMinBlur}
          min={min}
          max={maxValue - 1000}
          className="w-24 px-0 py-1.5 bg-transparent font-mono text-xs focus:outline-none"
          style={{
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <span className="text-[0.625rem] tracking-wider uppercase" style={{ color: 'var(--color-text-secondary)' }}>to</span>
        <input
          type="number"
          value={maxValue}
          onChange={handleMaxChange}
          onBlur={handleMaxBlur}
          min={minValue + 1000}
          max={max}
          className="w-24 px-0 py-1.5 bg-transparent font-mono text-xs focus:outline-none"
          style={{
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  );
}
