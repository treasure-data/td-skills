/**
 * DataGrid Component
 * Displays and edits field metadata
 */

import React, { useState } from 'react';
import type { FieldMetadata } from '../types/metadata';

export interface DataGridProps {
  data: FieldMetadata[];
  isEditMode: boolean;
  onUpdate: (updatedData: FieldMetadata[]) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, isEditMode, onUpdate }) => {
  const [localData, setLocalData] = useState<FieldMetadata[]>(data);

  // Update local data when prop changes
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleFieldChange = (index: number, field: keyof FieldMetadata, value: any) => {
    const updated = [...localData];
    updated[index] = { ...updated[index], [field]: value };
    setLocalData(updated);
    onUpdate(updated);
  };

  const handleTagsChange = (index: number, tags: string[]) => {
    handleFieldChange(index, 'tags', tags);
  };

  const addTag = (index: number, tag: string) => {
    const current = localData[index].tags || [];
    if (tag.trim() && !current.includes(tag.trim())) {
      handleTagsChange(index, [...current, tag.trim()]);
    }
  };

  const removeTag = (index: number, tagToRemove: string) => {
    const current = localData[index].tags || [];
    handleTagsChange(index, current.filter(tag => tag !== tagToRemove));
  };

  if (localData.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-text">No metadata found</div>
        <div className="empty-state-subtext">
          Select a database and optionally a table to view field metadata
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-container" style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Database</th>
            <th>Table</th>
            <th>Field Name</th>
            <th>Data Type</th>
            <th>Description</th>
            <th>Business Definition</th>
            <th>Tags</th>
            <th>Is PII</th>
            <th>PII Category</th>
            <th>Sensitivity</th>
            <th>Owner</th>
            <th>Steward</th>
            <th>Quality Score</th>
          </tr>
        </thead>
        <tbody>
          {localData.map((row, index) => (
            <tr key={`${row.database_name}-${row.table_name}-${row.field_name}`} className={isEditMode ? 'editing' : ''}>
              {/* Non-editable fields */}
              <td>
                <div className="cell-readonly">{row.database_name}</div>
              </td>
              <td>
                <div className="cell-readonly">{row.table_name}</div>
              </td>
              <td>
                <div className="cell-readonly">{row.field_name}</div>
              </td>

              {/* Editable fields */}
              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <input
                      type="text"
                      value={row.data_type || ''}
                      onChange={(e) => handleFieldChange(index, 'data_type', e.target.value)}
                    />
                  </div>
                ) : (
                  row.data_type || '-'
                )}
              </td>

              <td style={{ minWidth: '200px' }}>
                {isEditMode ? (
                  <div className="cell-editable">
                    <textarea
                      value={row.description || ''}
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                      placeholder="Enter description..."
                    />
                  </div>
                ) : (
                  row.description || '-'
                )}
              </td>

              <td style={{ minWidth: '200px' }}>
                {isEditMode ? (
                  <div className="cell-editable">
                    <textarea
                      value={row.business_definition || ''}
                      onChange={(e) => handleFieldChange(index, 'business_definition', e.target.value)}
                      placeholder="Enter business definition..."
                    />
                  </div>
                ) : (
                  row.business_definition || '-'
                )}
              </td>

              <td style={{ minWidth: '200px' }}>
                {isEditMode ? (
                  <TagsInput
                    tags={row.tags || []}
                    onAddTag={(tag) => addTag(index, tag)}
                    onRemoveTag={(tag) => removeTag(index, tag)}
                  />
                ) : (
                  <div className="tags-container">
                    {(row.tags || []).length > 0 ? (
                      (row.tags || []).map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag">
                          {tag}
                        </span>
                      ))
                    ) : (
                      '-'
                    )}
                  </div>
                )}
              </td>

              <td className="checkbox-cell">
                {isEditMode ? (
                  <input
                    type="checkbox"
                    checked={row.is_pii || false}
                    onChange={(e) => handleFieldChange(index, 'is_pii', e.target.checked)}
                  />
                ) : (
                  row.is_pii ? '✓' : '-'
                )}
              </td>

              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <input
                      type="text"
                      value={row.pii_category || ''}
                      onChange={(e) => handleFieldChange(index, 'pii_category', e.target.value)}
                      placeholder="e.g., email, phone"
                    />
                  </div>
                ) : (
                  row.pii_category || '-'
                )}
              </td>

              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <select
                      value={row.sensitivity_level || ''}
                      onChange={(e) => handleFieldChange(index, 'sensitivity_level', e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="public">Public</option>
                      <option value="internal">Internal</option>
                      <option value="confidential">Confidential</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>
                ) : (
                  row.sensitivity_level || '-'
                )}
              </td>

              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <input
                      type="text"
                      value={row.owner || ''}
                      onChange={(e) => handleFieldChange(index, 'owner', e.target.value)}
                      placeholder="Owner name/email"
                    />
                  </div>
                ) : (
                  row.owner || '-'
                )}
              </td>

              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <input
                      type="text"
                      value={row.steward || ''}
                      onChange={(e) => handleFieldChange(index, 'steward', e.target.value)}
                      placeholder="Steward name/email"
                    />
                  </div>
                ) : (
                  row.steward || '-'
                )}
              </td>

              <td>
                {isEditMode ? (
                  <div className="cell-editable">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.quality_score || ''}
                      onChange={(e) => handleFieldChange(index, 'quality_score', parseInt(e.target.value) || undefined)}
                      placeholder="0-100"
                    />
                  </div>
                ) : (
                  row.quality_score !== undefined ? row.quality_score : '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Tags Input Component
interface TagsInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ tags, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        onAddTag(inputValue);
        setInputValue('');
      }
    }
  };

  return (
    <div className="tag-input-container">
      {tags.map((tag, index) => (
        <span key={index} className="tag tag-removable" onClick={() => onRemoveTag(tag)}>
          {tag}
          <span className="tag-remove">×</span>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
      />
    </div>
  );
};

export default DataGrid;
