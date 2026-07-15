import * as XLSX from "xlsx";

/** Builds an .xlsx workbook buffer from an array of flat row objects —
 *  keys become column headers, one sheet, auto-sized columns. */
export function generateExcelReport(sheetName: string, rows: Record<string, string | number>[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns roughly based on content length — xlsx has no
  // built-in autofit, so this approximates it from the data itself.
  if (rows.length > 0) {
    const columns = Object.keys(rows[0] ?? {});
    worksheet["!cols"] = columns.map((col) => {
      const maxLen = Math.max(
        col.length,
        ...rows.map((r) => String(r[col] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)); // Excel sheet name limit
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
