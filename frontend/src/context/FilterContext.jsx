import React, { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [dateFilter, setDateFilter] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [region, setRegion] = useState('All');
  const [category, setCategory] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getFilterParams = useCallback(() => {
    const params = { date_filter: dateFilter };
    if (dateFilter === 'custom') {
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
    }
    if (region && region !== 'All') {
      params.region = region;
    }
    if (category && category !== 'All') {
      params.category = category;
    }
    return params;
  }, [dateFilter, startDate, endDate, region, category]);

  const value = {
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    region,
    setRegion,
    category,
    setCategory,
    refreshKey,
    triggerRefresh,
    toasts,
    addToast,
    removeToast,
    getFilterParams,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
