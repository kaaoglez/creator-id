// src/components/CategorySelector.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CategorySelector({ value, onChange }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    setCategories(data || [])
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        Categoría *
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '1rem'
        }}
      >
        <option value="">Selecciona una categoría</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
    </div>
  )
}