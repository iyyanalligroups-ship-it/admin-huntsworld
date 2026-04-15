// src/pages/admin/SocialMediaLinks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Share2,
  Loader2,
  Globe,
  Link2,
  RefreshCw,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import showToast from "@/toast/showToast";
import SocialMediaPlatforms from './SocialMediaPlatform';
import DeleteDialog from '@/model/DeleteModel';

// ── Icon mapper (returns real JSX icon components) ────────────────
const getPlatformIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('instagram')) return <Instagram size={24} />;
  if (lower.includes('facebook'))  return <Facebook size={24} />;
  if (lower.includes('twitter') || lower.includes('x')) return <Twitter size={24} />;
  if (lower.includes('youtube'))   return <Youtube size={24} />;
  if (lower.includes('linkedin'))  return <Linkedin size={24} />;
  return <Link2 size={24} />;
};

const SocialMediaLinks = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const [links, setLinks] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [isDelete, setIsDelete] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({ platform: '', url: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPlatforms = useCallback(async () => {
    setLoadingPlatforms(true);
    try {
      const res = await fetch(`${API_BASE}/social-media-platform`);
      const data = await res.json();
      if (data?.success) setPlatforms(data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load platforms", "error");
    } finally {
      setLoadingPlatforms(false);
    }
  }, [API_BASE]);

  const fetchLinks = useCallback(async () => {
    setLoadingLinks(true);
    try {
      const res = await fetch(`${API_BASE}/social-media`);
      const data = await res.json();
      if (data?.success) setLinks(data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load links", "error");
    } finally {
      setLoadingLinks(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchPlatforms();
    fetchLinks();
  }, [fetchPlatforms, fetchLinks, refreshTrigger]);

  const handlePlatformChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleManualRefresh = () => {
    fetchLinks();
    fetchPlatforms();
    showToast("Data refreshed", "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.platform || !form.url.trim()) {
      showToast("Platform and URL are required", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const url = isEditing ? `${API_BASE}/social-media/${currentId}` : `${API_BASE}/social-media`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: form.platform, url: form.url.trim() }),
      });
      if (!res.ok) throw new Error('Operation failed');
      showToast(isEditing ? 'Updated successfully' : 'Added successfully', 'success');
      setForm({ platform: '', url: '' });
      setIsEditing(false);
      setCurrentId(null);
      fetchLinks();
    } catch (err) {
      showToast(err.message || 'Error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (link) => {
    setIsEditing(true);
    setCurrentId(link._id);
    setForm({ platform: link.platform?._id || '', url: link.url });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-media/${isDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Deleted successfully', 'success');
      fetchLinks();
      setIsDialogOpen(false);
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Share2 className="text-blue-600" size={28} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Social Media Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage platforms and profile links</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={loadingLinks || loadingPlatforms}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loadingLinks || loadingPlatforms ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Platforms Management */}
      <SocialMediaPlatforms onPlatformChange={handlePlatformChange} />

      {/* Form Section */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-5">
            {isEditing ? 'Update Social Link' : 'Add New Social Link'}
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-5 sm:gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Platform Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Platform
                </label>
                {loadingPlatforms ? (
                  <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md text-gray-500 text-sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading platforms...
                  </div>
                ) : platforms.length === 0 ? (
                  <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                    No platforms yet. Add them above.
                  </div>
                ) : (
                  <Select
                    value={form.platform}
                    onValueChange={(v) => setForm({ ...form, platform: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-10 border-2 border-slate-300">
                      <SelectValue placeholder="e.g. Instagram" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Profile URL
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="e.g. https://instagram.com/yourusername"
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-60"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || loadingPlatforms || !form.platform}
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isEditing ? (
                  'Update Link'
                ) : (
                  'Add Link'
                )}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setForm({ platform: '', url: '' });
                  }}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Links Section */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold">Active Social Links</h2>

        {loadingLinks ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl text-gray-400 bg-gray-50">
            No social links added yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Card
                key={link._id}
                className="group hover:shadow-md transition-all duration-200 border-gray-200"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      {getPlatformIcon(link.platform?.name || '')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-base sm:text-lg">
                        {link.platform?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {link.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(link)}
                            >
                              <Edit2 size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => {
                                setIsDelete(link._id);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Social Link?"
        description="This action cannot be undone. The link will be removed permanently."
      />
    </div>
  );
};

export default SocialMediaLinks;
