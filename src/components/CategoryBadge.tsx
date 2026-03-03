'use client'

import { CATEGORY_STYLES } from '@/lib/utils'

export function CategoryBadge({ category }: { category: string | null }) {
  const style = CATEGORY_STYLES[category ?? 'other'] ?? CATEGORY_STYLES.other
  return (
    <span className={`chip ${style.classes}`}>
      {style.label}
    </span>
  )
}
