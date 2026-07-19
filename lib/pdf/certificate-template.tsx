import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface CertificateData {
  recipientName: string;
  title: string;
  issuedAt: string;
  certificateId: string;
}

const PURPLE = "#5B21B6";
const GOLD = "#B8860B";
const INK = "#1F2937";
const MUTED = "#6B7280";

// Deliberately avoids calc() for the frame sizing — react-pdf's Yoga
// layout engine handled it inconsistently in testing (produced a stray,
// nearly-blank second page). flex: 1 to fill available space within the
// page's own padding is the more robust, well-supported pattern.
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Times-Roman",
    backgroundColor: "#FFFFFF",
  },
  outerFrame: {
    flex: 1,
    border: "2pt solid " + PURPLE,
    padding: 10,
  },
  innerFrame: {
    flex: 1,
    border: "0.75pt solid " + GOLD,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  brandRow: { display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 6 },
  brandMark: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: PURPLE,
    display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  brandMarkText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Helvetica-Bold" },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", color: PURPLE, letterSpacing: 3 },
  rule: { width: 90, height: 1.5, backgroundColor: GOLD, marginTop: 16, marginBottom: 16 },
  heading: { fontSize: 13, fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 4, color: MUTED },
  presentedTo: { fontSize: 10, fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 2, color: MUTED, marginTop: 20 },
  recipient: {
    fontSize: 32, fontFamily: "Times-Bold", color: INK, marginTop: 10, marginBottom: 16, textAlign: "center",
  },
  body: { fontSize: 12, fontFamily: "Times-Roman", color: MUTED, textAlign: "center", lineHeight: 1.5 },
  title: {
    fontSize: 20, fontFamily: "Times-Bold", marginTop: 10, marginBottom: 6, textAlign: "center", color: PURPLE,
  },
  footerRow: {
    display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    width: "100%", marginTop: 40,
  },
  footerBlock: { alignItems: "center", width: 160 },
  footerLine: { width: 140, borderBottom: "0.75pt solid " + MUTED, marginBottom: 4 },
  footerLabel: { fontSize: 8, fontFamily: "Helvetica", textTransform: "uppercase", letterSpacing: 1.5, color: MUTED, textAlign: "center" },
  footerValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK, textAlign: "center", marginBottom: 3 },
  certIdRow: { marginTop: 18 },
  certId: { fontSize: 7, fontFamily: "Helvetica", color: MUTED },
});

export function CertificateTemplate({ data }: { data: CertificateData }) {
  const issuedDate = new Date(data.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>J</Text></View>
              <Text style={styles.brand}>JOBMO</Text>
            </View>

            <View style={styles.rule} />

            <Text style={styles.heading}>Certificate of Completion</Text>
            <Text style={styles.presentedTo}>This certificate is proudly presented to</Text>
            <Text style={styles.recipient}>{data.recipientName}</Text>
            <Text style={styles.body}>for successfully completing</Text>
            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.footerRow}>
              <View style={styles.footerBlock}>
                <Text style={styles.footerValue}>{issuedDate}</Text>
                <View style={styles.footerLine} />
                <Text style={styles.footerLabel}>Date Issued</Text>
              </View>
              <View style={styles.footerBlock}>
                <Text style={[styles.footerValue, { fontFamily: "Times-Italic", fontSize: 13 }]}>JobMo</Text>
                <View style={styles.footerLine} />
                <Text style={styles.footerLabel}>Learning Center</Text>
              </View>
            </View>

            <View style={styles.certIdRow}>
              <Text style={styles.certId}>Certificate ID: {data.certificateId}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
