import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Trophy,
    ChevronLeft,
    TrendingUp,
    BarChart3,
    Target,
    Compass,
    LineChart,
} from 'lucide-react';
import { useGetTopCategoriesForAdminQuery } from '@/redux/api/CategoryApi';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import noImage from "@/assets/images/no-image.jpg";

const TopCategoryList = () => {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const { isSidebarOpen } = useSidebar();

    const { data, isLoading, isFetching } = useGetTopCategoriesForAdminQuery({
        page,
        limit: 10,
    });

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > (data?.pagination?.totalPages || 1)) return;
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryNavigate = (name) => {
        if (!name) return;
        const slug = name
            .toLowerCase()
            .replace(/ & /g, '-')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        navigate(`/all-categories/${slug}`);
    };

    // Safe access with fallbacks
    const pagination = data?.pagination || {};
    const hasNext = pagination.hasNextPage ?? false;
    const hasPrev = pagination.hasPrevPage ?? false;
    const totalPages = pagination.totalPages ?? 1;
    const currentPage = pagination.currentPage ?? 1;
    const totalItems = pagination.totalItems ?? 0;
    const showingCount = data?.data?.length ?? 0;

    const isEmpty = !isLoading && showingCount === 0;

    return (
        <div
            className={`p-4 md:p-6 bg-slate-50/50 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-16'
                }`}
        >
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start max-w-[1600px] mx-auto">
                {/* LEFT PANEL – Insights */}
                <div className="xl:col-span-1">
                    <div className="space-y-2 mb-6">
                        <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">
                            Market Intelligence
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                            Real-time view of high-velocity categories
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Card className="border-l-4 border-l-emerald-600 shadow-sm bg-white">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 size={16} className="text-emerald-600" />
                                    Trend Scoring
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
                                Weighted composite:
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Page Views 40%</li>
                                    <li>Conversion Rate 40%</li>
                                    <li>Search Volume 20%</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Target size={16} className="text-blue-600" />
                                    Budget Guidance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
                                Allocate ~60% of monthly marketing budget to top 5 categories
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-600 shadow-sm bg-white">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Compass size={16} className="text-purple-600" />
                                    Next Step
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">
                                Click any card → see sub-category performance breakdown
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* RIGHT PANEL – Main Content */}
                <div className="xl:col-span-3">
                    {isLoading ? (
                        <div className="min-h-[60vh] flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0c1f4d] rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Loading trending categories...</p>
                        </div>
                    ) : isEmpty ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                            <TrendingUp className="mx-auto h-14 w-14 text-slate-300 mb-5" />
                            <h3 className="text-2xl font-bold text-slate-700 mb-3">
                                No trending categories yet
                            </h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Categories will appear here once users start generating trending activity.
                            </p>
                        </div>
                    ) : (
                        <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                            {/* Header */}
                            <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                                        <LineChart size={14} /> Performance Matrix
                                    </div>
                                    <h1 className="text-3xl font-black text-[#0c1f4d] tracking-tight">
                                        Top Performing Categories
                                    </h1>
                                </div>

                                <div className="bg-[#0c1f4d] px-6 py-3 rounded-xl shadow-md text-sm font-bold text-white flex items-center gap-4 whitespace-nowrap">
                                    <span>Page {currentPage}</span>
                                    <span className="w-px h-4 bg-white/30"></span>
                                    <span>High → Low</span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {data?.data?.map((category, index) => (
                                    <div
                                        key={category.categoryId}
                                        onClick={() => handleCategoryNavigate(category.categoryName)}
                                        className="group relative flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                                            <img
                                                src={category.image}
                                                alt={category.categoryName}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.target.src = noImage;
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                                <TrendingUp size={14} />
                                                {category.categoryPoints.toLocaleString()} pts
                                            </div>
                                            <h3 className="text-lg font-extrabold text-[#0c1f4d] group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                                                {category.categoryName}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                <Trophy size={12} />
                                                Rank #{((page - 1) * 10) + index + 1}
                                            </p>
                                        </div>

                                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0c1f4d] group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-sm text-slate-600 font-medium order-2 sm:order-1">
                                    Showing <strong className="text-[#0c1f4d]">{showingCount}</strong> of{' '}
                                    <strong className="text-[#0c1f4d]">{totalItems}</strong> trending categories
                                </p>

                                <div className="flex items-center gap-3 order-1 sm:order-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isFetching || !hasPrev}
                                        onClick={() => handlePageChange(page - 1)}
                                        className="h-10 px-5 rounded-xl border-slate-200 font-semibold flex items-center gap-2 hover:bg-[#0c1f4d] hover:text-white disabled:opacity-40 transition-all"
                                    >
                                        <ChevronLeft size={16} /> Prev
                                    </Button>

                                    {/* Simple page numbers – visible on md+ */}
                                    <div className="hidden md:flex items-center gap-1">
                                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                            const pageNum = currentPage - 3 + i;
                                            if (pageNum < 1 || pageNum > totalPages) return null;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all ${pageNum === currentPage
                                                        ? 'bg-[#0c1f4d] text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        size="sm"
                                        disabled={isFetching || !hasNext}
                                        onClick={() => handlePageChange(page + 1)}
                                        className="h-10 px-5 rounded-xl bg-[#0c1f4d] text-white font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-40 transition-all"
                                    >
                                        Next <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopCategoryList;
