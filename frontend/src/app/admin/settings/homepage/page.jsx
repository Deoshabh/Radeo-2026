'use client';

import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, CollapsibleSection, SectionToggle, Field, TextInput, TextArea, SaveButton } from '@/components/admin/settings/SettingsUI';
import { FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function HomepageSettings() {
  const {
    authLoading, loading, saving,
    homePage, save,
    hpUpdate, hpArrayUpdate, hpArrayAdd, hpArrayRemove,
    handleUploadImage,
  } = useSettingsData();

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

  const UploadButton = ({ onUpload, toastId }) => (
    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
      <FiImage className="w-3.5 h-3.5" /> Upload
      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        try {
          toast.loading('Uploading...', { id: toastId });
          const url = await handleUploadImage(file);
          if (url) onUpload(url);
          toast.success('Uploaded!', { id: toastId });
        } catch { toast.error('Upload failed', { id: toastId }); }
      }} />
    </label>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Homepage Sections</h3>
            <p className="text-sm text-gray-500 mt-0.5">Control every section of your storefront landing page.</p>
          </div>
          <SaveButton onClick={() => save('homePage', homePage, 'Homepage')} saving={saving} />
        </div>
      </Card>

      {/* Hero Section */}
      <CollapsibleSection title="Hero Section" icon="🖼️" defaultOpen badge={homePage.hero?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Hero Section" enabled={homePage.hero?.enabled !== false} onChange={(v) => hpUpdate('hero', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Eyebrow Text"><TextInput value={homePage.hero?.eyebrow} onChange={(v) => hpUpdate('hero', 'eyebrow', v)} placeholder="Est. 2008 — Handcrafted in Agra" /></Field>
          <Field label="Hero Image URL" hint="Upload or paste URL">
            <div className="flex gap-2">
              <TextInput value={homePage.hero?.image} onChange={(v) => hpUpdate('hero', 'image', v)} placeholder="https://... or leave blank" />
              <UploadButton onUpload={(url) => hpUpdate('hero', 'image', url)} toastId="hero-upload" />
            </div>
          </Field>
          <Field label="Title Line 1"><TextInput value={homePage.hero?.titleLine1} onChange={(v) => hpUpdate('hero', 'titleLine1', v)} /></Field>
          <Field label="Title Line 2 (italic)"><TextInput value={homePage.hero?.titleLine2} onChange={(v) => hpUpdate('hero', 'titleLine2', v)} /></Field>
          <Field label="Title Line 3"><TextInput value={homePage.hero?.titleLine3} onChange={(v) => hpUpdate('hero', 'titleLine3', v)} /></Field>
          <Field label="Description"><TextArea value={homePage.hero?.description} onChange={(v) => hpUpdate('hero', 'description', v)} /></Field>
          <Field label="Primary Button Text"><TextInput value={homePage.hero?.primaryButtonText} onChange={(v) => hpUpdate('hero', 'primaryButtonText', v)} /></Field>
          <Field label="Primary Button Link"><TextInput value={homePage.hero?.primaryButtonLink} onChange={(v) => hpUpdate('hero', 'primaryButtonLink', v)} /></Field>
          <Field label="Secondary Button Text"><TextInput value={homePage.hero?.secondaryButtonText} onChange={(v) => hpUpdate('hero', 'secondaryButtonText', v)} /></Field>
          <Field label="Secondary Button Link"><TextInput value={homePage.hero?.secondaryButtonLink} onChange={(v) => hpUpdate('hero', 'secondaryButtonLink', v)} /></Field>
        </div>
        {/* Stats */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero Stats</span>
            <button onClick={() => hpArrayAdd('hero', 'stats', { label: 'Label', value: 0, suffix: '' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Stat</button>
          </div>
          {(homePage.hero?.stats || []).map((st, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <TextInput value={st.label} onChange={(v) => hpArrayUpdate('hero', 'stats', i, 'label', v)} placeholder="Label" />
              <input type="number" className="w-20 px-2 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200" value={st.value || 0} onChange={(e) => hpArrayUpdate('hero', 'stats', i, 'value', parseInt(e.target.value) || 0)} />
              <TextInput value={st.suffix} onChange={(v) => hpArrayUpdate('hero', 'stats', i, 'suffix', v)} placeholder="+" />
              <button onClick={() => hpArrayRemove('hero', 'stats', i)} className="text-red-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Marquee */}
      <CollapsibleSection title="Marquee Banner" icon="📜" badge={homePage.marquee?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Marquee" enabled={homePage.marquee?.enabled !== false} onChange={(v) => hpUpdate('marquee', 'enabled', v)} />
        <Field label="Scrolling Text" hint="Use ◆ as separators"><TextArea value={homePage.marquee?.text} onChange={(v) => hpUpdate('marquee', 'text', v)} /></Field>
      </CollapsibleSection>

      {/* Collection */}
      <CollapsibleSection title="Collection / Products" icon="👟" badge={homePage.collection?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Collection Section" enabled={homePage.collection?.enabled !== false} onChange={(v) => hpUpdate('collection', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Section Label"><TextInput value={homePage.collection?.label} onChange={(v) => hpUpdate('collection', 'label', v)} /></Field>
          <Field label="Section Title"><TextInput value={homePage.collection?.title} onChange={(v) => hpUpdate('collection', 'title', v)} /></Field>
          <Field label="Product Source">
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200" value={homePage.collection?.productSelection || 'latest'} onChange={(e) => hpUpdate('collection', 'productSelection', e.target.value)}>
              <option value="latest">Latest Products</option>
              <option value="top-rated">Top Rated</option>
              <option value="featured">Featured</option>
            </select>
          </Field>
          <Field label="Product Limit">
            <input type="number" min={1} max={12} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200" value={homePage.collection?.productLimit || 4} onChange={(e) => hpUpdate('collection', 'productLimit', parseInt(e.target.value) || 4)} />
          </Field>
        </div>
      </CollapsibleSection>

      {/* Craft */}
      <CollapsibleSection title="Craft / Process" icon="🔨" badge={homePage.craft?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Craft Section" enabled={homePage.craft?.enabled !== false} onChange={(v) => hpUpdate('craft', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Section Label"><TextInput value={homePage.craft?.label} onChange={(v) => hpUpdate('craft', 'label', v)} /></Field>
          <div />
          <Field label="Title Line 1"><TextInput value={homePage.craft?.titleLine1} onChange={(v) => hpUpdate('craft', 'titleLine1', v)} /></Field>
          <Field label="Title Line 2"><TextInput value={homePage.craft?.titleLine2} onChange={(v) => hpUpdate('craft', 'titleLine2', v)} /></Field>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Process Images (4 recommended)</span>
            <button onClick={() => hpArrayAdd('craft', 'images', { id: `craft-${Date.now()}`, url: '', alt: 'New image' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Image</button>
          </div>
          {(homePage.craft?.images || []).map((img, i) => (
            <div key={img.id || i} className="flex items-center gap-2 mb-2">
              <TextInput value={img.url} onChange={(v) => hpArrayUpdate('craft', 'images', i, 'url', v)} placeholder="Image URL" />
              <TextInput value={img.alt} onChange={(v) => hpArrayUpdate('craft', 'images', i, 'alt', v)} placeholder="Alt text" />
              <UploadButton onUpload={(url) => hpArrayUpdate('craft', 'images', i, 'url', url)} toastId={`craft-upload-${i}`} />
              <button onClick={() => hpArrayRemove('craft', 'images', i)} className="text-red-400 hover:text-red-600 shrink-0"><FiTrash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Features (4 recommended)</span>
            <button onClick={() => hpArrayAdd('craft', 'features', { num: `0${(homePage.craft?.features?.length || 0) + 1}`, name: 'Feature Name', desc: 'Description' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Feature</button>
          </div>
          {(homePage.craft?.features || []).map((f, i) => (
            <div key={i} className="grid grid-cols-[60px_1fr_2fr_auto] gap-2 mb-2 items-start">
              <TextInput value={f.num} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'num', v)} placeholder="01" />
              <TextInput value={f.name} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'name', v)} placeholder="Name" />
              <TextInput value={f.desc} onChange={(v) => hpArrayUpdate('craft', 'features', i, 'desc', v)} placeholder="Description" />
              <button onClick={() => hpArrayRemove('craft', 'features', i)} className="text-red-400 hover:text-red-600 mt-2"><FiTrash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Heritage */}
      <CollapsibleSection title="Heritage / Agra" icon="🏛️" badge={homePage.heritage?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Heritage Section" enabled={homePage.heritage?.enabled !== false} onChange={(v) => hpUpdate('heritage', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Section Label"><TextInput value={homePage.heritage?.label} onChange={(v) => hpUpdate('heritage', 'label', v)} /></Field>
          <Field label="Image URL" hint="Upload or paste URL">
            <div className="flex gap-2">
              <TextInput value={homePage.heritage?.image} onChange={(v) => hpUpdate('heritage', 'image', v)} placeholder="https://..." />
              <UploadButton onUpload={(url) => hpUpdate('heritage', 'image', url)} toastId="heritage-upload" />
            </div>
          </Field>
          <Field label="Title Line 1"><TextInput value={homePage.heritage?.titleLine1} onChange={(v) => hpUpdate('heritage', 'titleLine1', v)} /></Field>
          <Field label="Title Line 2 (italic)"><TextInput value={homePage.heritage?.titleLine2} onChange={(v) => hpUpdate('heritage', 'titleLine2', v)} /></Field>
          <div className="md:col-span-2">
            <Field label="Description"><TextArea value={homePage.heritage?.description} onChange={(v) => hpUpdate('heritage', 'description', v)} rows={4} /></Field>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Heritage Points</span>
            <button onClick={() => hpArrayAdd('heritage', 'points', { icon: '✨', title: 'New Point', desc: 'Description' })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Point</button>
          </div>
          {(homePage.heritage?.points || []).map((pt, i) => (
            <div key={i} className="grid grid-cols-[50px_1fr_2fr_auto] gap-2 mb-2 items-start">
              <TextInput value={pt.icon} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'icon', v)} placeholder="🏛️" />
              <TextInput value={pt.title} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'title', v)} placeholder="Title" />
              <TextInput value={pt.desc} onChange={(v) => hpArrayUpdate('heritage', 'points', i, 'desc', v)} placeholder="Description" />
              <button onClick={() => hpArrayRemove('heritage', 'points', i)} className="text-red-400 hover:text-red-600 mt-2"><FiTrash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Story */}
      <CollapsibleSection title="Our Story" icon="📖" badge={homePage.story?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Story Section" enabled={homePage.story?.enabled !== false} onChange={(v) => hpUpdate('story', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Section Label"><TextInput value={homePage.story?.label} onChange={(v) => hpUpdate('story', 'label', v)} /></Field>
          <Field label="Image URL" hint="Upload or paste URL">
            <div className="flex gap-2">
              <TextInput value={homePage.story?.image} onChange={(v) => hpUpdate('story', 'image', v)} placeholder="https://..." />
              <UploadButton onUpload={(url) => hpUpdate('story', 'image', url)} toastId="story-upload" />
            </div>
          </Field>
          <Field label="Title Line 1"><TextInput value={homePage.story?.titleLine1} onChange={(v) => hpUpdate('story', 'titleLine1', v)} /></Field>
          <Field label="Title Line 2"><TextInput value={homePage.story?.titleLine2} onChange={(v) => hpUpdate('story', 'titleLine2', v)} /></Field>
          <Field label="Quote"><TextArea value={homePage.story?.quote} onChange={(v) => hpUpdate('story', 'quote', v)} /></Field>
          <div>
            <Field label="CTA Button Text"><TextInput value={homePage.story?.ctaText} onChange={(v) => hpUpdate('story', 'ctaText', v)} /></Field>
            <div className="mt-3"><Field label="CTA Button Link"><TextInput value={homePage.story?.ctaLink} onChange={(v) => hpUpdate('story', 'ctaLink', v)} /></Field></div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paragraphs</span>
            <button onClick={() => hpUpdate('story', 'paragraphs', [...(homePage.story?.paragraphs || []), ''])} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Paragraph</button>
          </div>
          {(homePage.story?.paragraphs || []).map((p, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <TextArea value={p} onChange={(v) => { const arr = [...(homePage.story?.paragraphs || [])]; arr[i] = v; hpUpdate('story', 'paragraphs', arr); }} rows={2} />
              <button onClick={() => hpUpdate('story', 'paragraphs', (homePage.story?.paragraphs || []).filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 mt-2 shrink-0"><FiTrash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Testimonials */}
      <CollapsibleSection title="Testimonials" icon="⭐" badge={homePage.testimonials?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable Testimonials" enabled={homePage.testimonials?.enabled !== false} onChange={(v) => hpUpdate('testimonials', 'enabled', v)} />
        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testimonial Items</span>
            <button onClick={() => hpArrayAdd('testimonials', 'items', { id: `t-${Date.now()}`, text: 'Customer quote...', author: 'Name, City', rating: 5 })} className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"><FiPlus className="w-3 h-3" /> Add Testimonial</button>
          </div>
          {(homePage.testimonials?.items || []).map((t, i) => (
            <div key={t.id || i} className="border border-gray-100 rounded-lg p-4 mb-3 space-y-2 bg-gray-50/40">
              <TextArea value={t.text} onChange={(v) => hpArrayUpdate('testimonials', 'items', i, 'text', v)} placeholder="Customer testimonial text" />
              <div className="grid grid-cols-[1fr_80px_auto] gap-2 items-center">
                <TextInput value={t.author} onChange={(v) => hpArrayUpdate('testimonials', 'items', i, 'author', v)} placeholder="Author Name, City" />
                <input type="number" min={1} max={5} className="px-2 py-2 rounded-lg border border-gray-200 text-sm outline-none" value={t.rating || 5} onChange={(e) => hpArrayUpdate('testimonials', 'items', i, 'rating', parseInt(e.target.value) || 5)} />
                <button onClick={() => hpArrayRemove('testimonials', 'items', i)} className="text-red-400 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* CTA Banner */}
      <CollapsibleSection title="CTA Banner" icon="🎯" badge={homePage.ctaBanner?.enabled !== false ? 'ON' : 'OFF'}>
        <SectionToggle label="Enable CTA Banner" enabled={homePage.ctaBanner?.enabled !== false} onChange={(v) => hpUpdate('ctaBanner', 'enabled', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Title Line 1"><TextInput value={homePage.ctaBanner?.titleLine1} onChange={(v) => hpUpdate('ctaBanner', 'titleLine1', v)} /></Field>
          <Field label="Title Line 2 (italic)"><TextInput value={homePage.ctaBanner?.titleLine2} onChange={(v) => hpUpdate('ctaBanner', 'titleLine2', v)} /></Field>
          <div className="md:col-span-2">
            <Field label="Subtitle"><TextArea value={homePage.ctaBanner?.subtitle} onChange={(v) => hpUpdate('ctaBanner', 'subtitle', v)} rows={2} /></Field>
          </div>
          <Field label="Primary Button Text"><TextInput value={homePage.ctaBanner?.primaryButtonText} onChange={(v) => hpUpdate('ctaBanner', 'primaryButtonText', v)} /></Field>
          <Field label="Primary Button Link"><TextInput value={homePage.ctaBanner?.primaryButtonLink} onChange={(v) => hpUpdate('ctaBanner', 'primaryButtonLink', v)} /></Field>
          <Field label="Secondary Button Text"><TextInput value={homePage.ctaBanner?.secondaryButtonText} onChange={(v) => hpUpdate('ctaBanner', 'secondaryButtonText', v)} /></Field>
          <Field label="Secondary Button Link"><TextInput value={homePage.ctaBanner?.secondaryButtonLink} onChange={(v) => hpUpdate('ctaBanner', 'secondaryButtonLink', v)} /></Field>
        </div>
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <SaveButton onClick={() => save('homePage', homePage, 'Homepage')} saving={saving} label="Save All Homepage Changes" />
      </div>
    </div>
  );
}
