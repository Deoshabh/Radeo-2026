'use client';

import { useState } from 'react';
import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, SaveButton } from '@/components/admin/settings/SettingsUI';
import toast from 'react-hot-toast';

export default function PoliciesSettings() {
  const { authLoading, loading, saving, advancedSettings, saveAdvanced } = useSettingsData();
  const [selectedPolicy, setSelectedPolicy] = useState('shippingPolicy');

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Policies & Pages</h3>
          <p className="text-sm text-gray-500">Edit structured JSON content for site pages.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
            <option value="shippingPolicy">Shipping Policy</option>
            <option value="returnsPolicy">Returns Policy</option>
            <option value="aboutPage">About Page</option>
            <option value="faqPage">FAQ Page</option>
            <option value="footerContent">Footer Content</option>
          </select>
          <SaveButton onClick={() => {
            try {
              const val = JSON.parse(document.getElementById('policy-editor').value);
              saveAdvanced(selectedPolicy, val);
            } catch { toast.error('Invalid JSON'); }
          }} saving={saving} label="Save" />
        </div>
      </div>
      <textarea
        id="policy-editor"
        className="w-full h-[500px] font-mono text-xs p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-colors outline-none"
        defaultValue={JSON.stringify(advancedSettings[selectedPolicy] || {}, null, 2)}
        key={selectedPolicy}
        spellCheck={false}
      />
      <p className="text-xs text-gray-400 mt-2">Be careful editing JSON — ensure valid structure with correct quotes and commas.</p>
    </Card>
  );
}
