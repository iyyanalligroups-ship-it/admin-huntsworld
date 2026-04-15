import { useState, useEffect, useContext } from 'react';
import {
  useGetAllNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} from '@/redux/api/NewsApi';
import { useGetUserByIdQuery } from '@/redux/api/SubAdminAccessRequestApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
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
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Trash2, Edit, Plus, FileEdit, CalendarClock, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import DeleteDialog from '@/model/DeleteModel';
import showToast from '@/toast/showToast';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const NewsAdmin = () => {
  const { user } = useContext(AuthContext);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSidebarOpen } = useSidebar();

  const user_id = user?.user._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(user_id, { skip: !user_id });

  // Check permissions for the current page
  const currentPagePath = "others/news";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);

  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  const { data: news = [], isLoading, isFetching, error } = useGetAllNewsQuery();
  const [createNews, { isLoading: creating, isError: createError, isSuccess: createSuccess }] = useCreateNewsMutation();
  const [updateNews, { isLoading: updating, isError: updateError, isSuccess: updateSuccess }] = useUpdateNewsMutation();
  const [deleteNews, { isLoading: deleting, isError: deleteError, isSuccess: deleteSuccess }] = useDeleteNewsMutation();

  // Show toast for permission errors
  useEffect(() => {
    if (isUserError) {
      console.error("Error fetching user permissions:", userError);
      showToast("Failed to load user permissions", "error");
    }
  }, [isUserError, userError]);

  // Show toast for success messages
  useEffect(() => {
    if (createSuccess) {
      showToast("News created successfully", "success");
      setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'upcoming' });
      setEditingNews(null);
      setIsOpen(false);
    }
    if (updateSuccess) {
      showToast("News updated successfully", "success");
      setFormData({ title: '', description: '', startDate: '', endDate: '', status: 'upcoming' });
      setEditingNews(null);
      setIsOpen(false);
    }
    if (deleteSuccess) {
      showToast("News deleted successfully", "success");
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
    }
  }, [createSuccess, updateSuccess, deleteSuccess]);

  // Handle window resize to toggle mobile view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter news based on search query
  const filteredNews = news.filter((newsItem) => {
    const title = newsItem.title?.toLowerCase() || '';
    const description = newsItem.description?.toLowerCase() || '';
    return (
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase())
    );
  });

  // Sort news in descending order by startDate
  const sortedNews = [...filteredNews].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
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
      } else {
        await createNews(formData).unwrap();
      }
    } catch (err) {
      showToast(`Error: ${err.message || 'Operation failed'}`, 'error');
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
    } catch (err) {
      showToast(`Error: ${err.message || 'Delete failed'}`, 'error');
    }
  };

  const errorMessage = createError?.data?.message || updateError?.data?.message ||
    deleteError?.data?.message || (error ? error.message || 'Failed to fetch news' : null);

  if (error) {
    return (
      <div className="container mx-auto lg:p-4 text-red-500">
        Error fetching news: {error.message}{" "}
        <button onClick={() => window.location.reload()} className="underline text-[#0c1f4d]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <div className="container mx-auto lg:p-4">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h1 className="text-md border-1 border-[#0c1f4d] text-[#153171] bg-gray-100 p-2 rounded-r-2xl font-bold">
            News Management
          </h1>
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
          <div className="flex gap-4 ml-auto">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex items-center bg-[#0c1f4d] hover:bg-[#0a1d49f7] text-white"

                >
                  <Plus className="mr-2 h-4 w-4" /> Add News
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNews ? 'Edit News' : 'Add News'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter news title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter news description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        min={formData.startDate}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={creating || updating}>
                    {(creating || updating) && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>}
                    {editingNews ? 'Update' : 'Create'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center bg-[#0c1f4d] hover:bg-[#0a1d49f7] text-white"
            >
              Refresh
            </Button>
            <Input
              type="text"
              placeholder="Search by title or description..."
              className="w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {errorMessage && (
          <Alert className="mb-4 bg-red-500 text-white" variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!isMobile ? (
          <div className="w-full overflow-x-auto border border-gray-200">
            <Table className="min-w-[800px] w-full divide-y">
              <TableHeader className="bg-[#0c1f4d]">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap hover:bg-transparent">
                    S.No
                  </TableHead>
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
                {isLoading || isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0c1f4d]"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedNews.length > 0 ? (
                  paginatedNews.map((newsItem, index) => (
                    <TableRow key={newsItem._id} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {newsItem.title}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {newsItem.description}
                      </TableCell>
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
                            disabled={!canEdit}
                            title={!canEdit ? "You do not have permission to edit news" : "Edit news"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(newsItem._id)}
                            className="h-8 w-8 text-red-600 hover:text-red-800"
                            disabled={!canDelete}
                            title={!canDelete ? "You do not have permission to delete news" : "Delete news"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No news found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading || isFetching ? (
              <div className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : paginatedNews.length > 0 ? (
              paginatedNews.map((newsItem, index) => (
                <Card key={newsItem._id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{newsItem.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>S.No:</strong> {(page - 1) * itemsPerPage + index + 1}
                    </p>
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
                        disabled={!canEdit}
                        title={!canEdit ? "You do not have permission to edit news" : "Edit news"}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(newsItem._id)}
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        disabled={!canDelete}
                        title={!canDelete ? "You do not have permission to delete news" : "Delete news"}
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

        {totalPages > 1 && (
          <Pagination className="mt-4 flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className={page === 1 || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>
              {isMobile ? (
                <PaginationItem>
                  <PaginationLink isActive>{page}</PaginationLink>
                </PaginationItem>
              ) : (
                [...Array(totalPages).keys()].map((i) => {
                  const pageNumber = i + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setPage(pageNumber)}
                          isActive={page === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (pageNumber === page - 2 && page > 3) ||
                    (pageNumber === page + 2 && page < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className={page === totalPages || isFetching ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <DeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete News"
          description="Are you sure you want to delete this news item? This action cannot be undone."
          isLoading={deleting}
        />
      </div>
    </div>
  );
};

export default NewsAdmin;
