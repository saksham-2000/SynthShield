import Papa from 'papaparse'
import { ParsedDataset } from './types'

function isNumericColumn(rows: Record<string, string>[], column: string): boolean {
  const sample = rows
    .slice(0, 50)
    .map((r) => r[column])
    .filter((v) => v !== '' && v != null)
  if (sample.length === 0) return false
  return sample.every((v) => !isNaN(parseFloat(v)) && isFinite(Number(v)))
}

export async function parseCSV(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = (result.meta.fields ?? []) as string[]
        const rows = result.data as Record<string, string>[]
        const numericColumns = headers.filter((h) => isNumericColumn(rows, h))
        const categoricalColumns = headers.filter((h) => !numericColumns.includes(h))

        resolve({
          headers,
          rows,
          numericColumns,
          categoricalColumns,
          rowCount: rows.length,
          colCount: headers.length,
          fileName: file.name,
        })
      },
      error: (error) => reject(new Error(error.message)),
    })
  })
}

export function downloadCSV(rows: Record<string, string>[], filename: string): void {
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
