import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const CashClosingActions = () => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center"><Download className="mr-2"/> Extras</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-muted-foreground">Funcionalidades como exportação para CSV/Excel e um dashboard com KPIs (Ticket Médio, etc.) serão implementadas futuramente.</p>
        <Button variant="outline" disabled>Exportar para CSV (Em breve)</Button>
        <Button variant="outline" disabled className="ml-2">Exportar para Excel (Em breve)</Button>
      </CardContent>
    </Card>
  );
};

export default CashClosingActions;