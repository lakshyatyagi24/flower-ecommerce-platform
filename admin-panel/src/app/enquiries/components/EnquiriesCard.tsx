import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminEnquiry } from "@/lib/api";
import { fmtDate, fmtDateTime, statusVariant } from "../format";

type EnquiriesCardProps = {
  enquiries: AdminEnquiry[];
  loading: boolean;
  onView: (enquiry: AdminEnquiry) => void;
};

const COLUMNS = ["ID", "Customer", "Phone", "Product / Source", "Event date", "Quantity", "Status", "Received"];

function EnquiryRow({ enquiry: e, onView }: { enquiry: AdminEnquiry; onView: (enquiry: AdminEnquiry) => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">#{e.id}</TableCell>
      <TableCell>{e.customerName}</TableCell>
      <TableCell className="font-mono text-xs">{e.customerPhone}</TableCell>
      <TableCell>
        <div className="text-sm">{e.productName || "—"}</div>
        <div className="text-xs text-muted-foreground">{e.source}</div>
      </TableCell>
      <TableCell>{fmtDate(e.eventDate)}</TableCell>
      <TableCell>{e.quantity ?? "—"}</TableCell>
      <TableCell>
        <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm" onClick={() => onView(e)}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}

function EnquiriesBody({ enquiries, loading, onView }: EnquiriesCardProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (enquiries.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No enquiries match this filter yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enquiries.map((e) => (
            <EnquiryRow key={e.id} enquiry={e} onView={onView} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EnquiriesCard(props: EnquiriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.loading ? "Loading…" : `${props.enquiries.length} enquiries`}</CardTitle>
      </CardHeader>
      <CardContent>
        <EnquiriesBody {...props} />
      </CardContent>
    </Card>
  );
}
