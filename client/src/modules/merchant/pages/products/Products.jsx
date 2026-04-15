import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ProductImageZoom from './ProductImageZoom';
import MerchantProductForm from './MerchantProductForm';
import MerchantProductList from './MerchantProductList';
import MerchantProductListing from './MerchantProductList';
import ProductListing from './ProductListing';




const Products = () => {
     const { isSidebarOpen } = useSidebar();
  return (
    <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
          ? 'ml-1 sm:ml-64'
          : 'ml-1 sm:ml-16'
        }`}
    >
       <ProductListing /> 
    </div>
  )
}

export default Products
