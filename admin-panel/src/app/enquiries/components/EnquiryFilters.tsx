import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabel, STATUSES } from "../format";

export function EnquiryFilters({ value, onChange }: { value: string; onChange: (status: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button variant={value === "" ? "default" : "outline"} size="sm" onClick={() => onChange("")}>
            All
          </Button>
          {STATUSES.map((s) => (
            <Button key={s} variant={value === s ? "default" : "outline"} size="sm" onClick={() => onChange(s)}>
              {statusLabel(s)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
