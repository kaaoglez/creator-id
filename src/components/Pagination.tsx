'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isMobile?: boolean
}

export default function Pagination({ currentPage, totalPages, onPageChange, isMobile = false }: PaginationProps) {
  const { t } = useLanguage()
  
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | string)[] => {
    const delta = isMobile ? 1 : 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []
    let l: number | undefined

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }

  // Textos traducidos
  const previousText = t.pagination?.previous || 'Anterior'
  const nextText = t.pagination?.next || 'Siguiente'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
      marginTop: '30px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: isMobile ? '6px 10px' : '8px 12px',
          background: currentPage === 1 ? '#f0f0f0' : 'white',
          color: currentPage === 1 ? '#999' : '#4f46e5',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}
      >
        ← {previousText}
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' ? onPageChange(page) : null}
          disabled={page === '...'}
          style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            background: currentPage === page ? '#4f46e5' : 'white',
            color: currentPage === page ? 'white' : '#333',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            cursor: page === '...' ? 'default' : 'pointer',
            fontSize: isMobile ? '0.8rem' : '0.9rem'
          }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: isMobile ? '6px 10px' : '8px 12px',
          background: currentPage === totalPages ? '#f0f0f0' : 'white',
          color: currentPage === totalPages ? '#999' : '#4f46e5',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}
      >
        {nextText} →
      </button>
    </div>
  )
}