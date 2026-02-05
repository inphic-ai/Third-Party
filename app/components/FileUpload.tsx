import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
}

export default function FileUpload({ onFilesUploaded, existingFiles = [], maxFiles = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(existingFiles);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // 檢查檔案數量限制
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`最多只能上傳 ${maxFiles} 個檔案`);
      return;
    }
    
    // 檢查檔案類型和大小
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isImage && !isVideo) {
        setError(`檔案 ${file.name} 不是有效的圖片或影片格式`);
        return false;
      }
      
      if (!isValidSize) {
        setError(`檔案 ${file.name} 超過 50MB 大小限制`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`上傳 ${file.name} 失敗`);
        }
        
        const data = await response.json();
        return data.url;
      });
      
      const urls = await Promise.all(uploadPromises);
      const newUploadedFiles = [...uploadedFiles, ...urls];
      setUploadedFiles(newUploadedFiles);
      onFilesUploaded(newUploadedFiles);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : '上傳失敗，請稍後再試');
    } finally {
      setUploading(false);
      // 清空 input
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploadedFiles);
    onFilesUploaded(newUploadedFiles);
  };

  const getFileType = (url: string): 'image' | 'video' => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) {
      return 'video';
    }
    return 'image';
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading || uploadedFiles.length >= maxFiles}
            className="hidden"
          />
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              {uploading ? '上傳中...' : '點擊上傳截圖/影片'}
            </p>
            <p className="text-xs text-gray-500">
              支援 JPG, PNG, MP4 格式，單檔最大 50MB
            </p>
            <p className="text-xs text-gray-500 mt-1">
              已上傳 {uploadedFiles.length}/{maxFiles} 個檔案
            </p>
          </div>
        </label>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 已上傳檔案列表 */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {uploadedFiles.map((url, index) => {
            const fileType = getFileType(url);
            return (
              <div key={index} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {fileType === 'image' ? (
                    <img
                      src={url}
                      alt={`上傳檔案 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  查看
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
