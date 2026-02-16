/**
 * SearchBar Component
 * Hierarchical database/table selection with search
 */

import React, { useState, useEffect } from 'react';
import { getDatabases, getTables } from '../api/client';
import type { DatabaseInfo, FilterOptions } from '../types/metadata';

export interface SearchBarProps {
  onSearch: (filters: FilterOptions) => void;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load databases on mount
  useEffect(() => {
    loadDatabases();
  }, []);

  // Load tables when database changes
  useEffect(() => {
    if (selectedDatabase) {
      loadTables(selectedDatabase);
    } else {
      setTables([]);
      setSelectedTable('');
    }
  }, [selectedDatabase]);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDatabases();
      setDatabases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load databases');
      console.error('Error loading databases:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (database: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getTables(database);
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const database = e.target.value;
    setSelectedDatabase(database);
    setSelectedTable('');
  };

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTable(e.target.value);
  };

  const handleSearch = () => {
    if (selectedDatabase) {
      onSearch({
        database: selectedDatabase,
        table: selectedTable || undefined,
      });
    }
  };

  const handleReset = () => {
    setSelectedDatabase('');
    setSelectedTable('');
    setTables([]);
  };

  return (
    <div className="search-bar">
      <div className="search-controls">
        <div className="search-field">
          <label htmlFor="database-select">Database</label>
          <select
            id="database-select"
            value={selectedDatabase}
            onChange={handleDatabaseChange}
            disabled={disabled || loading}
          >
            <option value="">Select a database...</option>
            {databases.map((db) => (
              <option key={db.database_name} value={db.database_name}>
                {db.database_name} ({db.table_count} tables)
              </option>
            ))}
          </select>
        </div>

        <div className="search-field">
          <label htmlFor="table-select">Table (Optional)</label>
          <select
            id="table-select"
            value={selectedTable}
            onChange={handleTableChange}
            disabled={disabled || loading || !selectedDatabase}
          >
            <option value="">All tables</option>
            {tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={disabled || loading || !selectedDatabase}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={disabled || loading}
        >
          Reset
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--color-error)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
