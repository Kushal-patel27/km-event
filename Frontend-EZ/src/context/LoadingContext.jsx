import React, { createContext, useContext, useState } from 'react'
import Loading from '../components/common/Loading'

const LoadingContext = createContext()

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingVariant, setLoadingVariant] = useState('card')
  const [loadingCount, setLoadingCount] = useState(6)
  const [loadingColumns, setLoadingColumns] = useState(3)

  const showLoading = (options = {}) => {
    setLoadingVariant(options.variant || 'card')
    setLoadingCount(options.count || 6)
    setLoadingColumns(options.columns || 3)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Loading variant={loadingVariant} count={loadingCount} columns={loadingColumns} />
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  )
}
