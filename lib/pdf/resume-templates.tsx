import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type {
  ApplicantProfile, EducationEntry, ExperienceEntry, Skill, Certification, Language,
} from "@/types/database.types";

export interface ResumeData {
  account: { full_name: string | null; email: string };
  profile: ApplicantProfile;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: Skill[];
  certifications: Certification[];
  languages: Language[];
}

function formatRange(start: string | null, end: string | null, isCurrent?: boolean) {
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "");
  return `${fmt(start)} — ${isCurrent ? "Present" : fmt(end)}`;
}

// --- Template 1: "Classic" — single column, serif-leaning, traditional ATS-safe layout ---
const classicStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  name: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  contact: { fontSize: 9, color: "#555", marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6,
    borderBottom: "1pt solid #cccccc", paddingBottom: 3, textTransform: "uppercase", letterSpacing: 1,
  },
  entryTitle: { fontSize: 10.5, fontWeight: 700 },
  entrySubtitle: { fontSize: 10, color: "#444" },
  entryMeta: { fontSize: 9, color: "#777", marginBottom: 3 },
  entryBody: { fontSize: 9.5, color: "#333", marginTop: 2, lineHeight: 1.4 },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { fontSize: 9, backgroundColor: "#f0f0f5", borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, marginRight: 4, marginBottom: 4 },
});

export function ClassicResumeTemplate({ data }: { data: ResumeData }) {
  const { account, profile, education, experience, skills, certifications, languages } = data;
  const fullName = account.full_name ?? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <Text style={classicStyles.name}>{fullName || "Your Name"}</Text>
        <Text style={classicStyles.contact}>
          {[profile.phone, account.email, profile.district, profile.linkedin_url].filter(Boolean).join("  •  ")}
        </Text>

        {profile.ai_summary && (
          <View style={{ marginBottom: 10 }}>
            <Text style={classicStyles.entryBody}>{profile.ai_summary}</Text>
          </View>
        )}

        {experience.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Experience</Text>
            {experience.map((e) => (
              <View key={e.id} style={classicStyles.entry}>
                <Text style={classicStyles.entryTitle}>{e.position}</Text>
                <Text style={classicStyles.entrySubtitle}>{e.company}</Text>
                <Text style={classicStyles.entryMeta}>{formatRange(e.start_date, e.end_date, e.is_current)}</Text>
                {e.description && <Text style={classicStyles.entryBody}>{e.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Education</Text>
            {education.map((ed) => (
              <View key={ed.id} style={classicStyles.entry}>
                <Text style={classicStyles.entryTitle}>{ed.qualification}</Text>
                <Text style={classicStyles.entrySubtitle}>{ed.institution}{ed.field_of_study ? ` — ${ed.field_of_study}` : ""}</Text>
                <Text style={classicStyles.entryMeta}>{formatRange(ed.start_date, ed.end_date)}{ed.grade ? `  •  ${ed.grade}` : ""}</Text>
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Skills</Text>
            <View style={classicStyles.row}>
              {skills.map((s) => (
                <Text key={s.id} style={classicStyles.pill}>{s.name}</Text>
              ))}
            </View>
          </View>
        )}

        {languages.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Languages</Text>
            <Text style={classicStyles.entryBody}>
              {languages.map((l) => `${l.name} (${l.proficiency})`).join("  •  ")}
            </Text>
          </View>
        )}

        {certifications.length > 0 && (
          <View>
            <Text style={classicStyles.sectionTitle}>Certifications</Text>
            {certifications.map((c) => (
              <Text key={c.id} style={classicStyles.entryBody}>
                {c.name}{c.issuer ? ` — ${c.issuer}` : ""}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

// --- Template 2: "Modern" — sidebar layout, brand-colored accent ---
const modernStyles = StyleSheet.create({
  page: { flexDirection: "row", fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  sidebar: { width: "32%", backgroundColor: "#241b4d", color: "#ffffff", padding: 24 },
  main: { width: "68%", padding: 24 },
  name: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#ffffff" },
  sidebarLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#c9a8ff", marginTop: 14, marginBottom: 4 },
  sidebarText: { fontSize: 9, color: "#e5e0ff", marginBottom: 2, lineHeight: 1.4 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#5b21b6", marginTop: 12, marginBottom: 6 },
  entryTitle: { fontSize: 10.5, fontWeight: 700 },
  entrySubtitle: { fontSize: 10, color: "#444" },
  entryMeta: { fontSize: 9, color: "#777", marginBottom: 3 },
  entryBody: { fontSize: 9.5, color: "#333", marginTop: 2, lineHeight: 1.4 },
  entry: { marginBottom: 8 },
});

export function ModernResumeTemplate({ data }: { data: ResumeData }) {
  const { account, profile, education, experience, skills, certifications, languages } = data;
  const fullName = account.full_name ?? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.sidebar}>
          <Text style={modernStyles.name}>{fullName || "Your Name"}</Text>

          <Text style={modernStyles.sidebarLabel}>Contact</Text>
          <Text style={modernStyles.sidebarText}>{account.email}</Text>
          {profile.phone && <Text style={modernStyles.sidebarText}>{profile.phone}</Text>}
          {profile.district && <Text style={modernStyles.sidebarText}>{profile.district}</Text>}

          {skills.length > 0 && (
            <>
              <Text style={modernStyles.sidebarLabel}>Skills</Text>
              {skills.map((s) => (
                <Text key={s.id} style={modernStyles.sidebarText}>{s.name}</Text>
              ))}
            </>
          )}

          {languages.length > 0 && (
            <>
              <Text style={modernStyles.sidebarLabel}>Languages</Text>
              {languages.map((l) => (
                <Text key={l.id} style={modernStyles.sidebarText}>{l.name} — {l.proficiency}</Text>
              ))}
            </>
          )}
        </View>

        <View style={modernStyles.main}>
          {profile.ai_summary && (
            <View style={{ marginBottom: 10 }}>
              <Text style={modernStyles.sectionTitle}>Summary</Text>
              <Text style={modernStyles.entryBody}>{profile.ai_summary}</Text>
            </View>
          )}
          {experience.length > 0 && (
            <View>
              <Text style={modernStyles.sectionTitle}>Experience</Text>
              {experience.map((e) => (
                <View key={e.id} style={modernStyles.entry}>
                  <Text style={modernStyles.entryTitle}>{e.position}</Text>
                  <Text style={modernStyles.entrySubtitle}>{e.company}</Text>
                  <Text style={modernStyles.entryMeta}>{formatRange(e.start_date, e.end_date, e.is_current)}</Text>
                  {e.description && <Text style={modernStyles.entryBody}>{e.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {education.length > 0 && (
            <View>
              <Text style={modernStyles.sectionTitle}>Education</Text>
              {education.map((ed) => (
                <View key={ed.id} style={modernStyles.entry}>
                  <Text style={modernStyles.entryTitle}>{ed.qualification}</Text>
                  <Text style={modernStyles.entrySubtitle}>{ed.institution}</Text>
                  <Text style={modernStyles.entryMeta}>{formatRange(ed.start_date, ed.end_date)}</Text>
                </View>
              ))}
            </View>
          )}

          {certifications.length > 0 && (
            <View>
              <Text style={modernStyles.sectionTitle}>Certifications</Text>
              {certifications.map((c) => (
                <Text key={c.id} style={modernStyles.entryBody}>
                  {c.name}{c.issuer ? ` — ${c.issuer}` : ""}
                </Text>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
