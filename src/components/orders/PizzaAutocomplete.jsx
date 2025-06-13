import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const PizzaAutocomplete = ({
  value,
  onChange,
  products,
  selectedSize,
  placeholder = "Digite para buscar..."
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (text) {
      const filtered = products.filter(p =>
        p.nome.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (productName) => {
    setInputValue(productName);
    setSuggestions([]);
    setIsFocused(false);
    if (onChange) {
      onChange(productName);
    }
  };
  
  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        className="bg-background/70"
      />
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((p) => (
              <li
                key={p.id}
                onClick={() => handleSelectSuggestion(p.nome)}
                className="px-3 py-2 cursor-pointer hover:bg-muted"
              >
                <div className="flex justify-between items-center w-full">
                  <span>{p.nome}</span>
                  {selectedSize && p.tamanhos_precos && (
                    <span className="text-sm text-green-600 font-medium ml-2">
                      {(() => {
                        const sizePrice = p.tamanhos_precos.find(tp => tp.id_tamanho === selectedSize);
                        return sizePrice ? formatCurrency(sizePrice.preco) : '';
                      })()}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PizzaAutocomplete; 