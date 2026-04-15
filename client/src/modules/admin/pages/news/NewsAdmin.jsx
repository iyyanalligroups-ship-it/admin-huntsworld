import { useState, useEffect } from 'react';
import {
  useGetAllNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} from '@/redux/api/NewsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Trash2, Edit, Plus, FileEdit, CalendarClock, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import DeleteDialog from '@/model/DeleteModel';
import showToast from '@/toast/showToast';
import { useSidebar } from '../../hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NewsAdmin = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
  });
  const { isSidebarOpen } = useSidebar();
  const { data: news = [], isLoading } = useGetAllNewsQuery();
  const [createNews] = useCreateNewsMutation();
  const [updateNews] = useUpdateNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to toggle mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sort news in descending order by startDate
  const sortedNews = [...news].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const totalPages = Math.ceil(sortedNews.length / itemsPerPage);
  const paginatedNews = sortedNews.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showToast('End Date must be greater than or equal to Start Date', 'error');
      return;
    }

    try {
      if (editingNews) {
        await updateNews({ id: editingNews._id, ...formData }).unwrap();
        showToast('News updated successfully', 'success');
      } else {
        await createNews(formData).unwrap();
        showToast('News created successfully', 'success');
      }
      setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'upcoming' });
      setEditingNews(null);
      setIsOpen(false);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      description: newsItem.description,
      startDate: newsItem.startDate.split('T')[0],
      endDate: newsItem.endDate.split('T')[0],
      status: newsItem.status,
    });
    setIsOpen(true);
  };

  const handleDeleteClick = (id) => {
    setNewsToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteNews(newsToDelete).unwrap();
      showToast('News deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className={`lg:p-6 transition-all duration-300 ${isSidebarOpen ? 'sm:ml-64' : 'sm:ml-16'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">News Management</h1>

        {/* SOP / News Management Guidelines */}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0c1f4d] cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> Add News
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="mb-2" htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Summer Sale 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="border-2 border-slate-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="mb-2" htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. 50% off on all electronics..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  className="w-full break-all whitespace-pre-wrap overflow-x-auto border-2 border-slate-300"
                />

              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="mb-2" htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="border-2 border-slate-300"
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="mb-2" htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={formData.startDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="border-2 border-slate-300"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2" htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="border-2 border-slate-300">
                    <SelectValue placeholder="e.g. Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">{editingNews ? 'Update' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Megaphone className="text-amber-600 mt-1 shrink-0" size={24} />
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-amber-900">
              Homepage News & Announcements SOP
            </h2>
            <p className="text-sm text-amber-800">
              Manage the scrolling news ticker or announcement cards shown on the Home Page. Use this to highlight sales, updates, or holidays.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {/* Instruction 1: Date Logic */}
              <div className="bg-white/60 p-3 rounded border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm">Schedule & Visibility</span>
                </div>
                <p className="text-xs text-gray-600">
                  News is <strong>only visible</strong> between the Start and End Date.
                  <br />
                  <span className="text-yellow-600 font-medium">In-Progress:</span> Live now.
                  <br />
                  <span className="text-blue-600 font-medium">Upcoming:</span> Scheduled for later.
                </p>
              </div>

              {/* Instruction 2: Editing */}
              <div className="bg-white/60 p-3 rounded border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <FileEdit className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-gray-900 text-sm">Update Content</span>
                </div>
                <p className="text-xs text-gray-600">
                  Click <strong>Edit</strong> to fix typos or extend the "End Date" if you want to keep an announcement running longer.
                </p>
              </div>

              {/* Instruction 3: Cleanup */}
              <div className="bg-white/60 p-3 rounded border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-gray-900 text-sm">Remove Old News</span>
                </div>
                <p className="text-xs text-gray-600">
                  Expired news hides automatically, but use <strong>Delete</strong> to permanently remove clutter from this admin list.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!isMobile ? (
        // Desktop/Tablet View - Table Layout
        <div className="w-full overflow-x-auto border border-gray-200">
          <Table className="min-w-[800px] w-full divide-y">
            <TableHeader className="bg-[#0c1f4d]">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                  Title
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap min-w-[200px] hover:bg-transparent">
                  Description
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                  Start Date
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                  End Date
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-200">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0c1f4d]"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedNews.length > 0 ? (
                paginatedNews.map((newsItem) => (
                  <TableRow key={newsItem._id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{newsItem.title}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{newsItem.description}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(newsItem.startDate), 'PPP')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(newsItem.endDate), 'PPP')}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${newsItem.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : newsItem.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                          }`}
                      >
                        {newsItem.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(newsItem)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(newsItem._id)}
                          className="h-8 w-8 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No news found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Mobile View - Card Layout
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0c1f4d]"></div>
            </div>
          ) : paginatedNews.length > 0 ? (
            paginatedNews.map((newsItem) => (
              <Card key={newsItem._id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong> {newsItem.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Start Date:</strong> {format(new Date(newsItem.startDate), 'PPP')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>End Date:</strong> {format(new Date(newsItem.endDate), 'PPP')}
                  </p>
                  <div className="text-sm">
                    <strong>Status:</strong>{' '}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${newsItem.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : newsItem.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {newsItem.status}
                    </span>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(newsItem)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(newsItem._id)}
                      className="cursor-pointer text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No news found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4 flex justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>
            {isMobile ? (
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
            ) : (
              Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index + 1}>
                  <PaginationLink
                    onClick={() => handlePageChange(index + 1)}
                    isActive={page === index + 1}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete News"
        description="Are you sure you want to delete this news item? This action cannot be undone."
      />
    </div>
  );
};

export default NewsAdmin;
