// src/pages/admin/SocialMediaPlatforms.jsx
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Info,
    ArrowDownUp,
    ListOrdered,
    Globe,
    Link,
    Instagram,
    Facebook,
    Twitter,
    Youtube,
    Linkedin,
    Github,
    Twitch,
    Disc as DiscordIcon,
    Rss,
    Share2,
    AtSign,
    Music,
    ChevronDown,
    X,
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import showToast from "@/toast/showToast";
import DeleteDialog from '@/model/DeleteModel';

// Popular lucide-react icon suggestions
const ICON_SUGGESTIONS = [
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'twitter', label: 'Twitter / X', icon: Twitter },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'github', label: 'GitHub', icon: Github },
    { value: 'twitch', label: 'Twitch', icon: Twitch },
    { value: 'discord', label: 'Discord', icon: DiscordIcon },
    { value: 'tiktok', label: 'TikTok', icon: Music },
    { value: 'rss', label: 'RSS Feed', icon: Rss },
    { value: 'share-2', label: 'Share', icon: Share2 },
    { value: 'link', label: 'Link (default)', icon: Link },
    { value: 'globe', label: 'Globe / Website', icon: Globe },
    { value: 'at-sign', label: '@ Mention', icon: AtSign },
];

const getIconComponent = (iconName) => {
    if (!iconName) return Globe;
    const lower = iconName.toLowerCase().trim();

    const match = ICON_SUGGESTIONS.find(item => item.value === lower);
    if (match) return match.icon;

    if (lower.includes('insta')) return Instagram;
    if (lower.includes('face')) return Facebook;
    if (lower.includes('twit') || lower.includes('x')) return Twitter;
    if (lower.includes('tube') || lower.includes('you')) return Youtube;
    if (lower.includes('link')) return Linkedin;

    return Globe;
};

const SocialMediaPlatforms = ({ onPlatformChange }) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        iconName: '',
        order: 999,
        isActive: true,
    });
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDelete, setIsDelete] = useState(null);

    const fetchPlatforms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/social-media-platform/admin`);
            const data = await res.json();
            if (data?.success) setPlatforms(data.data || []);
        } catch {
            showToast("Failed to load platforms", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return showToast("Platform name is required", "error");

        setSubmitting(true);
        try {
            const url = editingId
                ? `${API_BASE}/social-media-platform/${editingId}`
                : `${API_BASE}/social-media-platform`;

            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...form,
                iconName: (form.iconName || 'link').trim().toLowerCase(),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Save failed');
            }

            showToast(editingId ? 'Platform updated' : 'Platform created', 'success');
            resetForm();
            fetchPlatforms();
            if (onPlatformChange) onPlatformChange();
        } catch (err) {
            showToast(err.message || 'Something went wrong', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({ name: '', iconName: '', order: 999, isActive: true });
    };

    const startEdit = (p) => {
        setEditingId(p._id);
        setForm({
            name: p.name,
            iconName: p.iconName || 'link',
            order: p.order || 999,
            isActive: p.isActive !== false,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteDialog = (id) => {
        setIsDelete(id);
        setIsDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`${API_BASE}/social-media-platform/${isDelete}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Delete failed');
            }
            showToast('Platform deleted', 'success');
            fetchPlatforms();
            setIsDialogOpen(false);
            if (onPlatformChange) onPlatformChange();
        } catch (err) {
            showToast(err.message || 'Delete failed', 'error');
        }
    };

    const SelectedIcon = getIconComponent(form.iconName);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* SOP / Guidelines - Responsive grid */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Info className="text-indigo-700 mt-1 shrink-0" size={28} />
                    <div className="space-y-4 flex-1 w-full">
                        <h2 className="text-xl sm:text-2xl font-bold text-indigo-900">
                            Manage Social Platforms – Quick SOP
                        </h2>

                        <p className="text-indigo-800 text-sm sm:text-base">
                            This section controls which platforms appear when adding social media links.
                            Each platform defines its name, icon, display order, and visibility.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white/70 p-4 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Plus className="text-green-600" size={18} />
                                    <span className="font-medium text-sm sm:text-base">Add Platform</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    Create new social networks (Threads, Snapchat, Behance, etc.).
                                </p>
                            </div>

                            <div className="bg-white/70 p-4 rounded-lg border border-indigo-100 relative overflow-hidden">
                                <div className="absolute -right-8 -top-8 text-indigo-100 opacity-20 text-7xl sm:text-9xl font-black">
                                    1→2→3
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownUp className="text-indigo-600" size={18} />
                                    <span className="font-medium text-sm sm:text-base">Display Order</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    Lower number = appears earlier in dropdown & footer.<br />
                                    <strong>999</strong> = default (new items go to bottom).
                                </p>
                            </div>

                            <div className="bg-white/70 p-4 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trash2 className="text-red-600" size={18} />
                                    <span className="font-medium text-sm sm:text-base">Delete Platform</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    Only delete if no links use this platform.<br />
                                    Deleting breaks existing links referencing it.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-indigo-200 text-xs sm:text-sm text-indigo-800">
                            <strong>Icon tip:</strong> Use lowercase names matching lucide-react.<br />
                            Type or select — preview appears instantly.
                        </div>
                    </div>
                </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold">Manage Social Platforms</h1>

            {/* Form - Stacks on mobile */}
            <div className="bg-white border rounded-xl p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-semibold mb-5">
                    {editingId ? 'Edit Platform' : 'Add New Platform'}
                </h2>

                <form onSubmit={handleSave} className="grid gap-5 sm:gap-6">
                    {/* Platform Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Platform Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Instagram"
                            required
                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        />
                    </div>

                    {/* Icon Field - Responsive */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Icon (lucide-react)
                        </label>
                        <div className="relative">
                            {/* Preview Icon */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                {form.iconName ? (
                                    <SelectedIcon size={20} className="text-gray-700" />
                                ) : (
                                    <Globe size={20} className="text-gray-400" />
                                )}
                            </div>

                            {/* Input */}
                            <input
                                value={form.iconName}
                                onChange={(e) => setForm({ ...form, iconName: e.target.value.toLowerCase() })}
                                placeholder="e.g. instagram"
                                className="w-full pl-10 pr-12 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base"
                                autoComplete="off"
                                spellCheck={false}
                            />

                            {/* Dropdown Trigger */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                <Select
                                    value={form.iconName}
                                    onValueChange={(val) => setForm({ ...form, iconName: val })}
                                >
                                    <SelectTrigger className="border-2 border-slate-300 shadow-none bg-transparent hover:bg-gray-100 focus:ring-0 p-1.5 h-9 w-9 flex items-center justify-center rounded-md">
                                        <ChevronDown size={16} className="text-gray-500" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72">
                                        {ICON_SUGGESTIONS.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                <div className="flex items-center gap-2 py-1">
                                                    <item.icon size={16} className="text-gray-700" />
                                                    <span className="text-sm">{item.label}</span>
                                                    <span className="text-xs text-gray-500 ml-auto font-mono">({item.value})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1.5">
                            Type exact lowercase name or pick from suggestions
                        </p>
                    </div>

                    {/* Order */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Display Order
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={form.order}
                            onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 999 })}
                            className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                            Lower = appears earlier (999 = default → last)
                        </p>
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={form.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active / Visible in dropdown
                        </label>
                    </div>

                    {/* Action Buttons - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 sm:flex-none min-w-[140px] h-11 text-base"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? 'Update Platform' : 'Create Platform'}
                        </Button>

                        {editingId && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                className="flex-1 sm:flex-none h-11 text-base"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table / List - Scrollable on mobile */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            ) : platforms.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border rounded-xl bg-gray-50">
                    No platforms created yet.
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    Icon
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {platforms.map((p) => {
                                const IconComp = getIconComponent(p.iconName);
                                return (
                                    <tr key={p._id} className="hover:bg-gray-50">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-sm sm:text-base">
                                            {p.name}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <IconComp size={20} className="text-gray-700" />
                                                <span className="text-xs sm:text-sm font-mono text-gray-600">{p.iconName || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center text-sm sm:text-base text-gray-700">
                                            {p.order}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                                            {p.isActive ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1 sm:space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 sm:h-9 sm:w-9"
                                                onClick={() => startEdit(p)}
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700"
                                                onClick={() => deleteDialog(p._id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <DeleteDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Platform?"
                description="This will permanently remove the platform. Any linked social profiles will break."
            />
        </div>
    );
};

export default SocialMediaPlatforms;
