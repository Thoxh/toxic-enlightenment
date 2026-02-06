import * as React from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface TicketEmailProps {
  customerName?: string | null
  ticketCode: string
  quantity: number
  posterUrl: string
}

export function TicketEmail({
  customerName,
  ticketCode,
  quantity,
  posterUrl,
}: TicketEmailProps) {
  const displayName = customerName?.trim() || "there"
  const ticketText = quantity === 1 ? "Ticket" : "Tickets"

  return (
    <Html>
      <Head />
      <Preview>
        Dein {ticketText} für TOXIC ENLIGHTENMENT am 14. März 2026
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Event Poster */}
          <Section style={styles.posterSection}>
            <Img
              src={posterUrl}
              alt="TOXIC ENLIGHTENMENT - Kirchmöser Pumpenhaus"
              width="100%"
              style={styles.poster}
            />
          </Section>

          {/* Main Content */}
          <Section style={styles.contentSection}>
            <Heading as="h1" style={styles.heading}>
              Hey {displayName}!
            </Heading>

            <Text style={styles.paragraph}>
              Dein {ticketText} für <strong>TOXIC ENLIGHTENMENT</strong> ist bereit!
            </Text>

            {/* Ticket Info Box */}
            <Section style={styles.ticketBox}>
              <Text style={styles.ticketLabel}>TICKET CODE</Text>
              <Text style={styles.ticketCode}>{ticketCode}</Text>
              <Hr style={styles.ticketDivider} />
              <Text style={styles.ticketDetail}>
                <span style={styles.ticketDetailLabel}>Anzahl Gäste:</span> {quantity}
              </Text>
            </Section>

            {/* Event Details */}
            <Section style={styles.eventDetails}>
              <Text style={styles.eventTitle}>PUMPENHAUS KIRCHMÖSER</Text>
              <Text style={styles.eventInfo}>
                Bahntechnikerring 13<br />
                14774 Brandenburg an der Havel
              </Text>
              <Text style={styles.eventDate}>
                14. März 2026 • 21:00 Uhr
              </Text>
            </Section>

            <Text style={styles.paragraph}>
              Dein Ticket findest du als PDF im Anhang. Zeige den QR-Code am Einlass vor – entweder digital auf deinem Handy oder ausgedruckt.
            </Text>

            {/* Important Notes */}
            <Section style={styles.notesBox}>
              <Text style={styles.notesTitle}>Wichtige Hinweise:</Text>
              <Text style={styles.noteItem}>• Einlass ab 18 Jahren – Ausweis nicht vergessen!</Text>
              <Text style={styles.noteItem}>• Ticket gilt für einmaligen Eintritt</Text>
              <Text style={styles.noteItem}>• Kein Wiedereinlass</Text>
            </Section>

            <Text style={styles.closingText}>
              Wir freuen uns auf eine unvergessliche Nacht!
            </Text>
          </Section>

          {/* Footer - styled like the Humaify example */}
          <Section style={styles.footer}>
            <Text style={styles.footerIgnore}>
              Wenn du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.
            </Text>

            <br />

            <Text style={styles.footerCompany}>
              Sound Kiosk Events<br />
              Emanuel Vierow<br />
              Reiherweg 1<br />
              99089 Erfurt
            </Text>

            <Text style={styles.footerLinks}>
              <Link href="https://soundkioskevents.de" style={styles.footerLink}>Website</Link>
              <span style={styles.verticalLine}> | </span>
              <Link href="https://soundkioskevents.de/kontakt" style={styles.footerLink}>Kontakt</Link>
              <span style={styles.verticalLine}> | </span>
              <Link href="https://soundkioskevents.de/datenschutz" style={styles.footerLink}>Datenschutz</Link>
              <span style={styles.verticalLine}> | </span>
              <Link href="https://soundkioskevents.de/agb" style={styles.footerLink}>AGBs</Link>
            </Text>

            <Text style={styles.footerLegal}>
              E-Mail: info@soundkiosk.one<br />
              <br />
              USt-IdNr.: DE364566218<br />
              <br />
              © {new Date().getFullYear()} Sound Kiosk Events. Alle Rechte vorbehalten.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  posterSection: {
    width: "100%",
    padding: 0,
    margin: 0,
  },
  poster: {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 0,
  },
  contentSection: {
    padding: "32px 28px",
    lineHeight: 1.6,
  },
  heading: {
    color: "#111827",
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 16px 0",
    lineHeight: 1.3,
  },
  paragraph: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 1.6,
    margin: "0 0 20px 0",
  },
  ticketBox: {
    backgroundColor: "#f9fafb",
    border: "2px solid #22c55e",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 24,
    textAlign: "center" as const,
  },
  ticketLabel: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    margin: "0 0 8px 0",
    textTransform: "uppercase" as const,
  },
  ticketCode: {
    color: "#111827",
    fontSize: 26,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: 2,
    margin: "0 0 12px 0",
  },
  ticketDivider: {
    borderColor: "#e5e7eb",
    borderWidth: 1,
    margin: "12px 0",
  },
  ticketDetail: {
    color: "#374151",
    fontSize: 14,
    margin: 0,
  },
  ticketDetailLabel: {
    color: "#6b7280",
  },
  eventDetails: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 20,
  },
  eventTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 6px 0",
  },
  eventInfo: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
    margin: "0 0 12px 0",
  },
  eventDate: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
  },
  notesBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: "14px 18px",
    marginBottom: 20,
  },
  notesTitle: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: 600,
    margin: "0 0 10px 0",
  },
  noteItem: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 1.6,
    margin: "0 0 4px 0",
  },
  closingText: {
    color: "#374151",
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
    textAlign: "center" as const,
  },
  footer: {
    padding: "24px 28px 28px 28px",
    textAlign: "center" as const,
  },
  footerIgnore: {
    margin: 0,
    fontSize: 12,
    color: "#9ca3af",
  },
  footerCompany: {
    margin: 0,
    fontSize: 12,
    lineHeight: "15px",
    color: "#6b7280",
    textAlign: "center" as const,
  },
  footerLinks: {
    textAlign: "center" as const,
    paddingBottom: 8,
    paddingTop: 12,
  },
  footerLink: {
    color: "#9ca3af",
    fontSize: 12,
    textDecoration: "none",
  },
  verticalLine: {
    color: "#d1d5db",
  },
  footerLegal: {
    margin: 0,
    fontSize: 12,
    textAlign: "center" as const,
    lineHeight: "15px",
    color: "#6b7280",
  },
}

export default TicketEmail
