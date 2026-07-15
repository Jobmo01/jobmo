import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ReportPdfData {
  title: string;
  subtitle: string;
  generatedAt: string;
  rows: Record<string, string | number>[];
}

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", fontSize: 8 },
  header: { marginBottom: 14 },
  title: { fontSize: 16, fontWeight: 700, color: "#5B21B6" },
  subtitle: { fontSize: 9, color: "#666", marginTop: 3 },
  meta: { fontSize: 8, color: "#999", marginTop: 2 },
  table: { display: "flex", flexDirection: "column", width: "100%" },
  headerRow: { flexDirection: "row", backgroundColor: "#5B21B6", paddingVertical: 5 },
  headerCell: { flex: 1, fontSize: 7.5, fontWeight: 700, color: "#fff", paddingHorizontal: 4 },
  row: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5pt solid #E5E5E5" },
  rowAlt: { backgroundColor: "#FAFAFC" },
  cell: { flex: 1, fontSize: 7.5, color: "#333", paddingHorizontal: 4 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, fontSize: 7, color: "#aaa", textAlign: "center" },
});

export function ReportPdfTemplate({ data }: { data: ReportPdfData }) {
  const columns = data.rows.length > 0 ? Object.keys(data.rows[0] ?? {}) : [];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.title}>JobMo — {data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>
          <Text style={styles.meta}>Generated {data.generatedAt} • {data.rows.length} record{data.rows.length === 1 ? "" : "s"}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow} fixed>
            {columns.map((col) => (
              <Text key={col} style={styles.headerCell}>{col}</Text>
            ))}
          </View>

          {data.rows.map((row, i) => (
            <View key={i} style={i % 2 === 1 ? { ...styles.row, ...styles.rowAlt } : styles.row} wrap={false}>
              {columns.map((col) => (
                <Text key={col} style={styles.cell}>{String(row[col] ?? "—")}</Text>
              ))}
            </View>
          ))}

          {data.rows.length === 0 && (
            <View style={styles.row}>
              <Text style={styles.cell}>No records match the selected filters.</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
