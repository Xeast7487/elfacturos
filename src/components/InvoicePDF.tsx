import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    paddingTop: 48, paddingBottom: 60, paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  brand: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: '#4f46e5' },
  fromBlock: { marginTop: 6 },
  fromText: { fontSize: 9, color: '#64748b', lineHeight: 1.5 },
  invoiceMeta: { textAlign: 'right' },
  invoiceNumber: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#1e293b', marginBottom: 4 },
  metaLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 9, color: '#475569', marginTop: 1, marginBottom: 6 },
  statusBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '3 8', borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' },
  divider: { borderBottom: '1px solid #e2e8f0', marginVertical: 20 },
  billTo: { marginBottom: 24 },
  sectionLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  clientName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1e293b' },
  clientDetail: { fontSize: 9, color: '#475569', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 1 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottom: '1px solid #f1f5f9' },
  col_desc: { flex: 1 },
  col_qty:  { width: 50, textAlign: 'center' },
  col_price: { width: 80, textAlign: 'right' },
  col_total: { width: 80, textAlign: 'right' },
  cellText: { fontSize: 9, color: '#334155' },
  totalsBlock: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#64748b', width: 100, textAlign: 'right' },
  totalValue: { fontSize: 9, color: '#1e293b', width: 80, textAlign: 'right' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1.5px solid #e2e8f0' },
  grandTotalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1e293b', width: 100, textAlign: 'right' },
  grandTotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#4f46e5', width: 80, textAlign: 'right' },
  notes: { marginTop: 32 },
  notesText: { fontSize: 9, color: '#64748b', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
})

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  sent:  { bg: '#fef3c7', color: '#b45309' },
  paid:  { bg: '#dcfce7', color: '#16a34a' },
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'BROUILLON',
  sent:  'ENVOYÉE',
  paid:  'PAYÉE',
}

export interface InvoiceData {
  invoice_number: string
  status: string
  issued_date: string
  due_date: string | null
  notes: string | null
  tax_rate: number
  paid_at: string | null
  client: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
  } | null
  items: { description: string; quantity: number; unit_price: number }[]
}

export function InvoicePDF({ invoice }: { invoice: InvoiceData }) {
  const subtotal = invoice.items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0)
  const taxAmt   = subtotal * (invoice.tax_rate ?? 0) / 100
  const total    = subtotal + taxAmt
  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft

  return (
    <Document title={invoice.invoice_number} author="Alexandre Monier">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>elfacturos</Text>
            <View style={styles.fromBlock}>
              <Text style={styles.fromText}>Alexandre Monier</Text>
              <Text style={styles.fromText}>a.monier@agence361.com</Text>
            </View>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.metaLabel}>Date d'émission</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issued_date)}</Text>
            {invoice.due_date && (
              <>
                <Text style={styles.metaLabel}>Échéance</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.due_date)}</Text>
              </>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={{ color: statusColors.color, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                {STATUS_LABELS[invoice.status] ?? invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill to */}
        {invoice.client && (
          <View style={styles.billTo}>
            <Text style={styles.sectionLabel}>Facturer à</Text>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {invoice.client.email  && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
            {invoice.client.phone  && <Text style={styles.clientDetail}>{invoice.client.phone}</Text>}
            {invoice.client.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
            {(invoice.client.city || invoice.client.postal_code) && (
              <Text style={styles.clientDetail}>
                {[invoice.client.city, invoice.client.postal_code, invoice.client.country].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col_desc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col_qty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.col_price]}>Prix unit.</Text>
          <Text style={[styles.tableHeaderText, styles.col_total]}>Total</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.col_desc]}>{item.description}</Text>
            <Text style={[styles.cellText, styles.col_qty]}>{item.quantity}</Text>
            <Text style={[styles.cellText, styles.col_price]}>{fmt(item.unit_price)}</Text>
            <Text style={[styles.cellText, styles.col_total]}>{fmt(item.quantity * item.unit_price)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxe ({invoice.tax_rate}%)</Text>
              <Text style={styles.totalValue}>{fmt(taxAmt)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          {invoice.invoice_number} · Alexandre Monier · a.monier@agence361.com
        </Text>
      </Page>
    </Document>
  )
}
