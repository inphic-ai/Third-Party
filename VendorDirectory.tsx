
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_VENDORS, CATEGORY_GROUPS, TAIWAN_REGIONS, CHINA_REGIONS, MOCK_USERS } from './constants';
import { Region, EntityType, Vendor, VendorCategory, ServiceType } from './types';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Star, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  LayoutList, 
  FolderOpen, 
  Plus, 
  AlertTriangle, 
  RefreshCw, 
  Filter, 
  ArrowUpDown, 
  Crown, 
  Ban, 
  Sparkles, 
  Bot, 
  X, 
  Heart, 
  CalendarCheck, 
  User, 
  Building2, 
  Phone, 
  Info, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  Layers, 
  AlertCircle, 
  GripVertical,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'card' | 'list' | 'group';
type SortOption = 'default' | 'rating_desc' | 'txn_count' | 'last_active';

export const VendorDirectory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const queryParam = searchParams.get('q'); // Get search query from URL

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>(Region.TAIWAN);
  const [selectedServiceArea, setSelectedServiceArea] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>(''); 
  
  // New Filters
  const [minRating, setMinRating] = useState<number>(0);
  const [showBlacklisted, setShowBlacklisted] = useState<boolean>(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [specialFilter, setSpecialFilter] = useState<string>('');

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  
  // Drag and drop state for favorites
  const [customFavoritesOrder, setCustomFavoritesOrder] = useState<string[]>([]);
  const [draggedVendorId, setDraggedVendorId] = useState<string | null>(null);

  // Permission Check
  const canAddVendors = MOCK_USERS[0].permissions.canAddVendors;
  
  // Handle URL Params on Mount
  useEffect(() => {
    if (filterParam === 'missed') {
      setSpecialFilter('missed');
    } else if (filterParam === 'contacting') {
      setSpecialFilter('contacting');
    } else {
      setSpecialFilter('');
    }
    if (queryParam) setSearchTerm(queryParam);
  }, [filterParam, queryParam]);

  const clearSpecialFilter = () => {
    setSpecialFilter('');
    setSearchTerm('');
    setSelectedCategory('');
    setSearchParams({});
  };

  const handleToggleFavorite = (vendorId: string) => {
    // In a real app, this would dispatch an API call
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    if(vendor) {
        vendor.isFavorite = !vendor.isFavorite;
        // Force re-render trick for mock
        setSearchTerm(prev => prev + " ");
        setTimeout(() => setSearchTerm(prev => prev.trim()), 0);
    }
  };

  const filteredVendors = useMemo(() => {
    let result = MOCK_VENDORS.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            vendor.categories.some(c => c.includes(searchTerm)) ||
                            vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.taxId?.includes(searchTerm) ||
                            vendor.tags.some(t => t.includes(searchTerm)); 
      
      const matchesCategory = selectedCategory ? vendor.categories.includes(selectedCategory as any) : true;
      const matchesRegion = selectedRegion ? vendor.region === selectedRegion : true;
      const matchesEntityType = selectedEntityType ? vendor.entityType === selectedEntityType : true;
      
      const matchesServiceArea = selectedServiceArea 
        ? (selectedServiceArea === '全部' ? true : vendor.serviceArea.includes(selectedServiceArea) || vendor.serviceArea.includes('全部'))
        : true;
      
      const matchesRating = vendor.rating >= minRating;
      const blacklistCheck = showBlacklisted ? vendor.isBlacklisted : !vendor.isBlacklisted;
      const matchesFavorite = showFavoritesOnly ? vendor.isFavorite : true;

      // Special Filters
      let matchesSpecial = true;
      if (specialFilter === 'missed') matchesSpecial = (vendor.missedContactLogCount || 0) > 0;
      else if (specialFilter === 'contacting') matchesSpecial = vendor.contactLogs.length > 0;

      return matchesSearch && matchesCategory && matchesRegion && matchesServiceArea && matchesRating && blacklistCheck && matchesSpecial && matchesFavorite && matchesEntityType;
    });

    // Custom Sorting for Favorites
    if (showFavoritesOnly && customFavoritesOrder.length > 0) {
      return result.sort((a, b) => {
        const indexA = customFavoritesOrder.indexOf(a.id);
        const indexB = customFavoritesOrder.indexOf(b.id);
        // If both are in custom order, sort by index
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only A is in order, A comes first
        if (indexA !== -1) return -1;
        // If only B is in order, B comes first
        if (indexB !== -1) return 1;
        // Default fallback
        return 0;
      });
    }

    // Standard Sorting
    return result.sort((a, b) => {
      if (sortBy === 'rating_desc') return b.rating - a.rating;
      if (sortBy === 'txn_count') return b.transactions.length - a.transactions.length;
      if (sortBy === 'last_active') {
        const lastA = a.transactions.length > 0 ? new Date(a.transactions[0].date).getTime() : 0;
        const lastB = b.transactions.length > 0 ? new Date(b.transactions[0].date).getTime() : 0;
        return lastB - lastA;
      }
      return 0; // Default order
    });

  }, [searchTerm, selectedCategory, selectedRegion, selectedServiceArea, minRating, showBlacklisted, sortBy, specialFilter, showFavoritesOnly, selectedEntityType, customFavoritesOrder]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedVendorId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedVendorId || draggedVendorId === targetId) return;

    // Initialize custom order if empty using current filtered list
    let currentOrder = customFavoritesOrder.length > 0 
      ? [...customFavoritesOrder] 
      : filteredVendors.map(v => v.id);
    
    // Ensure all visible vendors are in the order list if specific ones were missing
    filteredVendors.forEach(v => {
       if(!currentOrder.includes(v.id)) currentOrder.push(v.id);
    });

    const fromIndex = currentOrder.indexOf(draggedVendorId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    // Move item
    const [movedItem] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, movedItem);

    setCustomFavoritesOrder(currentOrder);
    setDraggedVendorId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <div className="flex items-center gap-2">
             <h1 className="text-2xl font-bold text-gray-800">廠商名錄</h1>
             <button 
                onClick={() => setShowLegendModal(true)}
                className="text-gray-400 hover:text-brand-600 transition" 
                title="系統說明"
             >
                <HelpCircle size={20} />
             </button>
           </div>
           <p className="text-gray-500 text-sm mt-1">
             管理 {MOCK_VENDORS.length} 家合作夥伴 • 搜尋與協作
           </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           {/* View Mode Switcher */}
           <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
              <button onClick={() => setViewMode('grid