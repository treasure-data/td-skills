/**
 * Main App Component
 * Semantic Layer Metadata Management
 */

import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import DataGrid from './components/DataGrid';
import Notification from './components/Notification';
import { getFieldMetadata, updateFieldMetadata } from './api/client';
import type { FieldMetadata, FilterOptions, UpdateRequest } from './types/metadata';
import './styles/base.css';
import './styles/app.css';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

function App() {
  const [fieldMetadata, setFieldMetadata] = useState<FieldMetadata[]>([]);
  const [originalData, setOriginalData] = useState<FieldMetadata[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleSearch = async (filters: FilterOptions) => {
    try {
      setIsLoading(true);
      setIsEditMode(false);
      setCurrentFilters(filters);
      const data = await getFieldMetadata(filters);
      setFieldMetadata(data);
      setOriginalData(JSON.parse(JSON.stringify(data))); // Deep clone
    } catch (err) {
      showNotification(
        'error',
        'Search Failed',
        err instanceof Error ? err.message : 'Failed to load field metadata'
      );
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode - revert changes
      setFieldMetadata(JSON.parse(JSON.stringify(originalData)));
    }
    setIsEditMode(!isEditMode);
  };

  const handleDataUpdate = (updatedData: FieldMetadata[]) => {
    setFieldMetadata(updatedData);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Find changed records
      const updates: UpdateRequest[] = [];
      fieldMetadata.forEach((row, index) => {
        const original = originalData[index];
        if (JSON.stringify(row) !== JSON.stringify(original)) {
          // Create update request with only changed fields
          const changes: Partial<FieldMetadata> = {};
          (Object.keys(row) as Array<keyof FieldMetadata>).forEach((key) => {
            if (key !== 'time' && key !== 'database_name' && key !== 'table_name' && key !== 'field_name') {
              if (JSON.stringify(row[key]) !== JSON.stringify(original[key])) {
                changes[key] = row[key];
              }
            }
          });

          if (Object.keys(changes).length > 0) {
            updates.push({
              database_name: row.database_name,
              table_name: row.table_name,
              field_name: row.field_name,
              updates: changes,
            });
          }
        }
      });

      if (updates.length === 0) {
        showNotification('success', 'No Changes', 'No changes detected to save.');
        return;
      }

      // Send updates to backend
      const result = await updateFieldMetadata(updates);

      if (result.failed > 0) {
        showNotification(
          'error',
          'Partial Update',
          `Updated ${result.updated} records, but ${result.failed} failed. Please check the logs.`
        );
      } else {
        showNotification(
          'success',
          'Update Successful',
          `Successfully updated ${result.updated} ${result.updated === 1 ? 'record' : 'records'}.`
        );

        // Refresh data
        if (currentFilters.database) {
          await handleSearch(currentFilters);
        }
        setIsEditMode(false);
      }
    } catch (err) {
      showNotification(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update field metadata'
      );
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">Metadata Management</h1>
        <div className="header-actions">
          {fieldMetadata.length > 0 && (
            <>
              <button
                className="btn btn-secondary"
                onClick={toggleEditMode}
                disabled={isSaving || isLoading}
              >
                {isEditMode ? 'Cancel Edit' : 'Edit'}
              </button>
              {isEditMode && (
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} disabled={isEditMode} />

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading metadata...</div>
            </div>
          ) : (
            <div className="data-grid">
              {fieldMetadata.length > 0 && (
                <div className="data-grid-header">
                  <div>
                    <div className="data-grid-title">
                      {currentFilters.table
                        ? `${currentFilters.database}.${currentFilters.table}`
                        : currentFilters.database || 'All Databases'}
                    </div>
                    <div className="data-grid-subtitle">
                      {fieldMetadata.length} {fieldMetadata.length === 1 ? 'field' : 'fields'}
                      {isEditMode && ' (Edit Mode)'}
                    </div>
                  </div>
                </div>
              )}
              <DataGrid
                data={fieldMetadata}
                isEditMode={isEditMode}
                onUpdate={handleDataUpdate}
              />
            </div>
          )}
        </div>
      </main>

      {/* Notification */}
      {notification.show && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
    </div>
  );
}

export default App;
