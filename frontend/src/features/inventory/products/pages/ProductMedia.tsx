import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  useGetProductImagesQuery,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
  useSetThumbnailMutation,
  useReorderImagesMutation, // Add this mutation
} from '../productApi';
import toast from 'react-hot-toast';

interface FileWithPreview extends File {
  preview: string;
}

interface DraggedImage {
  id: string;
  index: number;
}

const ProductMediaManager = () => {
  const { id: productId } = useParams<{ id: string }>();
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<DraggedImage | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: imagesData, isLoading, refetch } = useGetProductImagesQuery(productId!);
  const images = imagesData || [];
  const [uploadImages, { isLoading: uploading }] = useUploadProductImagesMutation();
  const [deleteImage] = useDeleteProductImageMutation();
  const [setThumbnail] = useSetThumbnailMutation();
  const [reorderImages, { isLoading: reordering }] = useReorderImagesMutation();

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) {
        setUploadError(`${file.name} is not an image file`);
        return false;
      }
      if (!isValidSize) {
        setUploadError(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    // Create preview URLs
    const filesWithPreview = validFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    ) as FileWithPreview[];

    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
    setUploadError(null);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file from selection
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Upload all selected files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    // Simulate progress (you'd need actual progress from your API)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        selectedFiles.forEach(file => {
          newProgress[file.name] = Math.min((newProgress[file.name] || 0) + 10, 90);
        });
        return newProgress;
      });
    }, 200);

    try {
      await uploadImages({ productId: productId!, formData }).unwrap();
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      setSelectedFiles([]);
      setUploadProgress({});
      refetch();
      toast.success('Images uploaded successfully');
    } catch (err: any) {
      setUploadError('Upload failed. Please try again.');
      toast.error(err?.data?.message || 'Upload failed');
    } finally {
      clearInterval(progressInterval);
      setUploadProgress({});
    }
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteImage({ productId: productId!, imageId }).unwrap();
      toast.success('Image deleted successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete image');
    }
  };

  // Set as thumbnail
  const handleSetThumbnail = async (imageId: string) => {
    try {
      await setThumbnail({ productId: productId!, imageId }).unwrap();
      toast.success('Thumbnail set successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to set thumbnail');
    }
  };

  // Drag and drop reordering handlers
  const handleDragStart = (image: any, index: number) => (e: React.DragEvent) => {
    setDraggedImage({ id: image.id, index });
    e.dataTransfer.effectAllowed = 'move';
    // Add a class to the dragged element
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedImage(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedImage || draggedImage.index === dropIndex) {
      setDraggedImage(null);
      setDragOverIndex(null);
      return;
    }

    // Create new ordered array
    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedImage.index, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    // Extract ordered IDs
    const orderedIds = newImages.map(img => img.id);

    try {
      await reorderImages({ productId: productId!, orderedIds }).unwrap();
      toast.success('Images reordered successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reorder images');
      refetch();
    } finally {
      setDraggedImage(null);
      setDragOverIndex(null);
    }
  };

  // Drag and drop for upload area
  const handleUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    
    const filesWithPreview = validFiles.map(file => 
      Object.assign(file, { preview: URL.createObjectURL(file) })
    ) as FileWithPreview[];

    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Media Manager</h1>
        <p className="text-gray-500 mt-1">Upload and manage product images (Max 5MB per image)</p>
        <p className="text-sm text-blue-600 mt-2">
          💡 Tip: Drag and drop images to reorder them
        </p>
      </div>

      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onDragOver={handleUploadDragOver}
        onDrop={handleUploadDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-3">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600">
            Drag & drop images here, or click to select
          </p>
          <p className="text-sm text-gray-400">
            Supported formats: JPEG, PNG, GIF, WEBP (Max 5MB)
          </p>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Selected Files ({selectedFiles.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  {uploadProgress[file.name] && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
              </div>
            ))}
          </div>
          
          {/* Upload Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {uploadError}
        </div>
      )}

      {/* Existing Images Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Product Images ({images.length})
          {reordering && (
            <span className="ml-2 text-sm text-blue-500">(Reordering...)</span>
          )}
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image: any, index: number) => (
              <div
                key={image.id}
                draggable
                onDragStart={handleDragStart(image, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group cursor-move transition-all duration-200 ${
                  dragOverIndex === index ? 'scale-105 ring-2 ring-blue-500 ring-offset-2' : ''
                } ${draggedImage?.id === image.id ? 'opacity-50' : ''}`}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.altText || 'Product image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Drag indicator */}
                  <div className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isThumbnail && (
                      <button
                        onClick={() => handleSetThumbnail(image.id)}
                        className="p-2 bg-white rounded-full hover:bg-blue-500 hover:text-white transition-colors"
                        title="Set as thumbnail"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Position indicator */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </div>

                  {/* Thumbnail badge */}
                  {image.isThumbnail && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Thumbnail
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {image.altText || 'Product image'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMediaManager;