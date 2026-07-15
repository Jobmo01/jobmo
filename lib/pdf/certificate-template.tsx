import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface CertificateData {
  recipientName: string;
  title: string;
  issuedAt: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: "Helvetica",
    backgroundColor: "#FAFAFC",
    color: "#1a1a2e",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  border: {
    border: "3pt solid #5B21B6",
    padding: 48,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 14, fontWeight: 700, color: "#5B21B6", letterSpacing: 2, marginBottom: 24 },
  heading: { fontSize: 12, textTransform: "uppercase", letterSpacing: 3, color: "#777" },
  recipient: { fontSize: 30, fontWeight: 700, marginTop: 16, marginBottom: 16, textAlign: "center" },
  body: { fontSize: 12, color: "#444", textAlign: "center", lineHeight: 1.5 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 8, marginBottom: 8, textAlign: "center", color: "#5B21B6" },
  date: { fontSize: 10, color: "#888", marginTop: 32 },
});

export function CertificateTemplate({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.brand}>JOBMO</Text>
          <Text style={styles.heading}>Certificate of Completion</Text>
          <Text style={styles.recipient}>{data.recipientName}</Text>
          <Text style={styles.body}>has successfully completed</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.date}>
            Issued {new Date(data.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
