import { useState, useRef, useEffect } from 'react';

/**
 * Multi-Select Dropdown with Search
 * Allows selecting multiple items with search functionality
 */
export default function MultiSelectDropdown({
  options = [],           // Array of { id, label, sublabel?, icon?, color? }
  selected = [],          // Array of selected IDs
  onChange,               // Callback with array of selected IDs
  placeholder = "Personen auswählen...",
  searchPlaceholder = "Suchen...",
  emptyMessage = "Keine Personen gefunden",
  maxDisplay = 3,         // Max items to show before "+X more"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = options.filter(opt => {
    const searchLower = search.toLowerCase();
    return (
      opt.label?.toLowerCase().includes(searchLower) ||
      opt.sublabel?.toLowerCase().includes(searchLower)
    );
  });

  // Toggle selection
  const toggleOption = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  // Remove a selected item
  const removeSelected = (id, e) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== id));
  };

  // Get selected option objects
  const selectedOptions = options.filter(opt => selected.includes(opt.id));

  // Select all filtered
  const selectAll = () => {
    const allIds = filteredOptions.map(opt => opt.id);
    const newSelected = [...new Set([...selected, ...allIds])];
    onChange(newSelected);
  };

  // Clear all
  const clearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected Items Display / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: 42,
          padding: '8px 12px',
          border: `2px solid ${isOpen ? '#2E86C1' : '#E8EDF2'}`,
          borderRadius: 10,
          background: '#FAFBFC',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          transition: 'all 0.2s',
        }}
      >
        {selectedOptions.length === 0 ? (
          <span style={{ color: '#95A5A6', fontSize: 13 }}>{placeholder}</span>
        ) : (
          <>
            {selectedOptions.slice(0, maxDisplay).map(opt => (
              <span
                key={opt.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#EBF5FB',
                  color: '#2E86C1',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {opt.label}
                <span
                  onClick={(e) => removeSelected(opt.id, e)}
                  style={{
                    cursor: 'pointer',
                    marginLeft: 2,
                    fontSize: 14,
                    lineHeight: 1,
                    opacity: 0.7,
                  }}
                >
                  ×
                </span>
              </span>
            ))}
            {selectedOptions.length > maxDisplay && (
              <span style={{ fontSize: 12, color: '#7F8C8D', fontWeight: 600 }}>
                +{selectedOptions.length - maxDisplay} weitere
              </span>
            )}
          </>
        )}
        <span style={{ marginLeft: 'auto', color: '#95A5A6', fontSize: 12 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '2px solid #E8EDF2',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1000,
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Input */}
          <div style={{ padding: 10, borderBottom: '1px solid #E8EDF2' }}>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8EDF2',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2E86C1'}
              onBlur={(e) => e.target.style.borderColor = '#E8EDF2'}
            />
          </div>

          {/* Quick Actions */}
          <div style={{ 
            padding: '8px 10px', 
            borderBottom: '1px solid #E8EDF2',
            display: 'flex',
            gap: 8,
          }}>
            <button
              onClick={selectAll}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #E8EDF2',
                borderRadius: 6,
                background: '#FAFBFC',
                fontSize: 11,
                fontWeight: 600,
                color: '#2E86C1',
                cursor: 'pointer',
              }}
            >
              ✓ Alle auswählen
            </button>
            <button
              onClick={clearAll}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #E8EDF2',
                borderRadius: 6,
                background: '#FAFBFC',
                fontSize: 11,
                fontWeight: 600,
                color: '#E74C3C',
                cursor: 'pointer',
              }}
            >
              ✕ Auswahl löschen
            </button>
          </div>

          {/* Options List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ 
                padding: 20, 
                textAlign: 'center', 
                color: '#95A5A6',
                fontSize: 13,
              }}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: isSelected ? '#EBF5FB' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#F7F9FC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: `2px solid ${isSelected ? '#2E86C1' : '#D5D8DC'}`,
                        background: isSelected ? '#2E86C1' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && (
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>
                      )}
                    </div>

                    {/* Avatar / Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: opt.color 
                          ? `linear-gradient(135deg, ${opt.color}, ${opt.color}CC)` 
                          : 'linear-gradient(135deg, #1B3A5C, #2E86C1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: opt.icon ? 16 : 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {opt.icon || opt.label?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Name & Email */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: '#1B3A5C',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {opt.label}
                      </div>
                      {opt.sublabel && (
                        <div style={{ 
                          fontSize: 11, 
                          color: '#7F8C8D',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          <div style={{ 
            padding: '8px 14px', 
            borderTop: '1px solid #E8EDF2',
            fontSize: 11,
            color: '#7F8C8D',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{selected.length} ausgewählt</span>
            <span>{filteredOptions.length} von {options.length} angezeigt</span>
          </div>
        </div>
      )}
    </div>
  );
}