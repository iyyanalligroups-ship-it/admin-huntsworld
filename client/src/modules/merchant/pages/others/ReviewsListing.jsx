import React, { useState, useEffect, useContext } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/modules/landing/context/AuthContext';

function ReviewsListing() {
  const { user, logout } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const effectiveUser = user?.user;
    if (!effectiveUser) {
      setError('Please log in to view your products.');
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_URL}/products/fetch-all-products-for-seller/${effectiveUser._id}`,
          { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
        );
        const fetchedProducts = Array.isArray(response.data) ? response.data : [];
        setProducts(fetchedProducts);
        if (fetchedProducts.length === 0) {
          setError('No products found for this seller.');
        }
      } catch (error) {
        let errorMessage = error.response?.data?.message || error.message;
        if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          logout();
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user, logout, API_URL]);

  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'all') {
      const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `${API_URL}/reviews/fetch-all-reviews-by-product/${selectedProduct}`,
            { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
          );
          const fetchedReviews = Array.isArray(response.data) ? response.data : [];
          setReviews(fetchedReviews);
          if (fetchedReviews.length === 0) {
            setError('No reviews found for this product.');
          }
        } catch (error) {
          let errorMessage = error.response?.data?.message || error.message;
          if (error.response?.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
            logout();
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [selectedProduct, logout, API_URL]);

  const handleSelectChange = (value) => {
    setSelectedProduct(value);
  };

  if (!user?.user) {
    return (
      <Alert className="mt-4" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Logged In</AlertTitle>
        <AlertDescription>Please log in to view your products.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
        Product Reviews
      </h1>

      {/* Product Selector */}
      <div className="mb-6">
        <Select onValueChange={handleSelectChange} value={selectedProduct} disabled={loading}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select the products in the below list</SelectItem>
            {products.length > 0 ? (
              products.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.product_name || 'Unnamed Product'}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No products available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reviews List */}
      {!loading && !error && reviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Card key={review._id} className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-lg">{review.userId?.name || 'Anonymous'}</CardTitle>
                <CardDescription>Rating: ⭐ {review.rating} / 5</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{review.comments}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && selectedProduct && reviews.length === 0 && (
        <div className="flex items-center justify-center text-gray-500 mt-6">
          <Info className="w-5 h-5 mr-2" />
          No reviews available for this product.
        </div>
      )}
    </div>
  );
}

export default ReviewsListing;
