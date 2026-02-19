'use client';

import { useState } from 'react';
import { useSettingsData } from '@/hooks/useSettingsData';
import { Card, Field, SaveButton } from '@/components/admin/settings/SettingsUI';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';

export default function ThemeSettings() {
  const { authLoading, loading, saving, advancedSettings, setAdvancedSettings, saveAdvanced } = useSettingsData();
  const [expandedSections, setExpandedSections] = useState({ brand: true, text: true, bg: true, navbar: false, footer: false, buttons: false, status: false });

  const toggle = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

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

  const t = advancedSettings.theme || {};
  const set = (colorKey, value) => setAdvancedSettings(prev => ({ ...prev, theme: { ...prev.theme, [colorKey]: value } }));
  const v = (colorKey, def) => t[colorKey] || def;

  const ColorField = ({ colorKey, label, def, hint }) => (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" className="h-10 w-10 border border-gray-200 rounded-lg cursor-pointer flex-shrink-0"
          value={v(colorKey, def)} onChange={(e) => set(colorKey, e.target.value)} />
        <input type="text" className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
          value={v(colorKey, def)} onChange={(e) => set(colorKey, e.target.value)} />
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </Field>
  );

  const Section = ({ id, title, count, children }) => (
    <div className="mb-6">
      <button onClick={() => toggle(id)} className="flex items-center justify-between w-full group mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h4>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{count} colors</span>
        </div>
        {expandedSections[id] ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expandedSections[id] && <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{children}</div>}
    </div>
  );

  /* ── Color values for preview ── */
  const primaryColor = v('primaryColor', '#3B2F2F');
  const secondaryColor = v('secondaryColor', '#E5D3B3');
  const accentColor = v('accentColor', '#c9a96e');
  const accentHover = v('accentHoverColor', '#a07840');
  const textColor = v('textColor', '#1c1917');
  const bodyTextColor = v('bodyTextColor', '#8a7460');
  const mutedTextColor = v('mutedTextColor', '#5c3d1e');
  const bgColor = v('backgroundColor', '#fafaf9');
  const subtleBg = v('subtleBgColor', '#f2ede4');
  const borderColor = v('borderColor', '#e8e0d0');
  const cardBg = v('cardBgColor', '#ffffff');
  const navbarBg = v('navbarBgColor', '#ffffff');
  const navbarText = v('navbarTextColor', '#1c1917');
  const footerBg = v('footerBgColor', '#1A1714');
  const footerText = v('footerTextColor', '#F0EBE1');
  const footerAccent = v('footerAccentColor', '#B8973A');
  const footerMuted = v('footerMutedColor', '#6B6560');
  const footerBorder = v('footerBorderColor', '#3A3530');
  const btnPrimaryBg = v('buttonPrimaryBg', '#1A1714');
  const btnPrimaryText = v('buttonPrimaryText', '#F0EBE1');
  const btnPrimaryHover = v('buttonPrimaryHover', '#B8973A');
  const successColor = v('successColor', '#16a34a');
  const errorColor = v('errorColor', '#dc2626');
  const warningColor = v('warningColor', '#d97706');
  const infoColor = v('infoColor', '#2563eb');

  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Theme Colors</h3>
      <p className="text-sm text-gray-500 mb-6">Control every color across your storefront. Changes apply site-wide instantly.</p>

      {/* ── Core Brand Colors ── */}
      <Section id="brand" title="Brand Colors" count={4}>
        <ColorField colorKey="primaryColor" label="Primary" def="#3B2F2F" hint="Logo, brand elements, primary buttons" />
        <ColorField colorKey="secondaryColor" label="Secondary" def="#E5D3B3" hint="Scales for borders, card tints" />
        <ColorField colorKey="accentColor" label="Accent / Gold" def="#c9a96e" hint="CTAs, links, highlights, badges" />
        <ColorField colorKey="accentHoverColor" label="Accent Hover" def="#a07840" hint="Hover state for accent elements" />
      </Section>

      {/* ── Text Colors ── */}
      <Section id="text" title="Text Colors" count={3}>
        <ColorField colorKey="textColor" label="Headings" def="#1c1917" hint="Page titles, card headings" />
        <ColorField colorKey="bodyTextColor" label="Body Text" def="#8a7460" hint="Paragraphs, descriptions" />
        <ColorField colorKey="mutedTextColor" label="Muted Text" def="#5c3d1e" hint="Captions, timestamps, labels" />
      </Section>

      {/* ── Backgrounds & Borders ── */}
      <Section id="bg" title="Backgrounds & Borders" count={4}>
        <ColorField colorKey="backgroundColor" label="Page Background" def="#fafaf9" hint="Main page background" />
        <ColorField colorKey="subtleBgColor" label="Subtle Background" def="#f2ede4" hint="Alternate sections, hover states" />
        <ColorField colorKey="cardBgColor" label="Card Background" def="#ffffff" hint="Product cards, content cards" />
        <ColorField colorKey="borderColor" label="Border / Divider" def="#e8e0d0" hint="Section dividers, input borders" />
      </Section>

      {/* ── Navbar Colors ── */}
      <Section id="navbar" title="Navbar Colors" count={2}>
        <ColorField colorKey="navbarBgColor" label="Navbar Background" def="#ffffff" hint="Top navigation bar background" />
        <ColorField colorKey="navbarTextColor" label="Navbar Text" def="#1c1917" hint="Nav links, icons, logo text" />
      </Section>

      {/* ── Footer Colors ── */}
      <Section id="footer" title="Footer Colors" count={5}>
        <ColorField colorKey="footerBgColor" label="Footer Background" def="#1A1714" hint="Footer section background" />
        <ColorField colorKey="footerTextColor" label="Footer Text" def="#F0EBE1" hint="Main footer text, brand name" />
        <ColorField colorKey="footerAccentColor" label="Footer Accent" def="#B8973A" hint="Footer gold links, hover states" />
        <ColorField colorKey="footerMutedColor" label="Footer Muted" def="#6B6560" hint="Secondary footer text, descriptions" />
        <ColorField colorKey="footerBorderColor" label="Footer Border" def="#3A3530" hint="Footer dividers, separators" />
      </Section>

      {/* ── Button Colors ── */}
      <Section id="buttons" title="Button Colors" count={3}>
        <ColorField colorKey="buttonPrimaryBg" label="Button Background" def="#1A1714" hint="Add-to-cart, primary CTA buttons" />
        <ColorField colorKey="buttonPrimaryText" label="Button Text" def="#F0EBE1" hint="Text inside primary buttons" />
        <ColorField colorKey="buttonPrimaryHover" label="Button Hover" def="#B8973A" hint="Hover state for primary buttons" />
      </Section>

      {/* ── Status / Semantic Colors ── */}
      <Section id="status" title="Status Colors" count={4}>
        <ColorField colorKey="successColor" label="Success" def="#16a34a" hint="Order confirmed, in-stock badges" />
        <ColorField colorKey="errorColor" label="Error / Danger" def="#dc2626" hint="Out of stock, errors, delete actions" />
        <ColorField colorKey="warningColor" label="Warning" def="#d97706" hint="Low stock, pending orders" />
        <ColorField colorKey="infoColor" label="Info" def="#2563eb" hint="Shipping info, processing status" />
      </Section>

      {/* ── Color Usage Guide ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <FiInfo className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1">Where each color is used</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-blue-700">
              <span><strong>Primary</strong> — Logo area, primary buttons, dark accents</span>
              <span><strong>Secondary</strong> — Used to generate border/card color scales</span>
              <span><strong>Accent / Gold</strong> — Price tags, CTA links, sale badges, highlights</span>
              <span><strong>Headings</strong> — All h1-h6, card titles, product names</span>
              <span><strong>Body Text</strong> — Product descriptions, paragraphs</span>
              <span><strong>Muted Text</strong> — Captions, &ldquo;free shipping&rdquo; labels, timestamps</span>
              <span><strong>Page Background</strong> — Behind all content on every page</span>
              <span><strong>Card Background</strong> — Product cards, dropdown menus</span>
              <span><strong>Navbar</strong> — Top navigation bar (background + text)</span>
              <span><strong>Footer</strong> — Bottom section (bg, text, accent, borders)</span>
              <span><strong>Button Colors</strong> — &ldquo;Add to Cart&rdquo;, &ldquo;Buy Now&rdquo; CTA buttons</span>
              <span><strong>Status Colors</strong> — Order status badges, stock indicators</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ LIVE PREVIEW ══════ */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 pt-5 pb-2 bg-gray-50 border-b border-gray-100">Live Preview</p>

        {/* Navbar Preview */}
        <div style={{ backgroundColor: navbarBg, borderBottom: `1px solid ${borderColor}` }} className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-wider" style={{ color: navbarText }}>RADEO</span>
            <span className="text-xs" style={{ color: navbarText, opacity: 0.7 }}>Home</span>
            <span className="text-xs" style={{ color: navbarText, opacity: 0.7 }}>Products</span>
            <span className="text-xs font-medium" style={{ color: accentColor }}>Sale</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: navbarText, opacity: 0.6 }}>🔍</span>
            <span className="text-xs" style={{ color: navbarText, opacity: 0.6 }}>👤</span>
            <span className="text-xs" style={{ color: navbarText, opacity: 0.6 }}>🛒</span>
          </div>
        </div>

        {/* Page Content Preview */}
        <div style={{ backgroundColor: bgColor, padding: '1.5rem' }}>
          <h4 className="text-lg font-bold mb-1" style={{ color: textColor }}>Heading Text</h4>
          <p className="text-sm mb-2" style={{ color: bodyTextColor }}>Body text appears in this color. Showcasing how your content will look.</p>
          <p className="text-xs mb-4" style={{ color: mutedTextColor }}>Muted text for secondary information.</p>

          {/* Product Card Preview */}
          <div className="flex gap-4 mb-4">
            <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', width: '180px' }}>
              <div style={{ backgroundColor: subtleBg, borderRadius: '6px', height: '80px', marginBottom: '8px' }} />
              <p className="text-xs font-semibold mb-0.5" style={{ color: textColor }}>Classic Oxford</p>
              <p className="text-[10px] mb-1" style={{ color: mutedTextColor }}>Premium leather</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: accentColor }}>₹4,999</span>
                <span className="text-[10px] line-through" style={{ color: mutedTextColor }}>₹6,999</span>
              </div>
              <button className="w-full mt-2 text-[10px] py-1.5 rounded font-medium" style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}>Add to Cart</button>
            </div>
            <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '12px', width: '180px' }}>
              <div style={{ backgroundColor: subtleBg, borderRadius: '6px', height: '80px', marginBottom: '8px', position: 'relative' }}>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: errorColor, color: '#fff' }}>SALE</span>
              </div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: textColor }}>Sport Runner</p>
              <p className="text-[10px] mb-1" style={{ color: mutedTextColor }}>Lightweight mesh</p>
              <span className="text-xs font-bold" style={{ color: accentColor }}>₹3,499</span>
              <button className="w-full mt-2 text-[10px] py-1.5 rounded font-medium" style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}>Add to Cart</button>
            </div>
          </div>

          {/* Buttons Preview */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: primaryColor, color: '#fff' }}>Primary</span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: accentColor, color: '#fff' }}>Accent</span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}>CTA Button</span>
            <span className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor, backgroundColor: subtleBg, color: textColor }}>Subtle</span>
          </div>

          {/* Status Badges Preview */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: successColor + '18', color: successColor }}>● Delivered</span>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: infoColor + '18', color: infoColor }}>● Processing</span>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: warningColor + '18', color: warningColor }}>● Low Stock</span>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: errorColor + '18', color: errorColor }}>● Out of Stock</span>
          </div>
        </div>

        {/* Footer Preview */}
        <div style={{ backgroundColor: footerBg, padding: '1rem 1.5rem' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold tracking-wider" style={{ color: footerText }}>RADEO</span>
              <p className="text-[10px] mt-0.5" style={{ color: footerMuted }}>Premium footwear since 2024</p>
            </div>
            <div className="flex gap-4">
              <span className="text-[10px]" style={{ color: footerMuted }}>About</span>
              <span className="text-[10px]" style={{ color: footerMuted }}>Contact</span>
              <span className="text-[10px] font-medium" style={{ color: footerAccent }}>Shop</span>
            </div>
          </div>
          <div style={{ height: '1px', backgroundColor: footerBorder, margin: '0.5rem 0' }} />
          <p className="text-[9px]" style={{ color: footerMuted }}>© 2026 Radeo. All rights reserved.</p>
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end">
        <SaveButton onClick={() => saveAdvanced('theme', advancedSettings.theme || {})} saving={saving} />
      </div>
    </Card>
  );
}
