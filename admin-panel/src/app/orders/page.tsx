import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>#12345</TableCell>
                <TableCell>John Doe</TableCell>
                <TableCell>Rose Bouquet</TableCell>
                <TableCell>$29.99</TableCell>
                <TableCell><Badge>Pending</Badge></TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>#12346</TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>Tulip Arrangement</TableCell>
                <TableCell>$39.99</TableCell>
                <TableCell><Badge variant="secondary">Shipped</Badge></TableCell>
                <TableCell>2024-01-14</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
