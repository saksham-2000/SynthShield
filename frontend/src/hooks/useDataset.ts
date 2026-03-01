import { useCallback } from 'react'
import { parseCSV } from '@/lib/csv'
import { useAppStore } from '@/store/appStore'

export function useDataset() {
  const setDataset = useAppStore((s) => s.setDataset)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a CSV file (.csv)')
      }
      const dataset = await parseCSV(file)
      if (dataset.rowCount === 0) {
        throw new Error('The CSV file appears to be empty')
      }
      setDataset(dataset)
    },
    [setDataset],
  )

  return { handleFile }
}
