'use client';

// Redirect /admin/settings to /admin/settings/homepage
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/admin/settings/homepage');
}
