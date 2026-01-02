import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { EnhancedTable } from '../styledTable';
import { PolarAreaChart } from '../charts/polarAreaChart';
import { ReportingService } from '../../../services/reportingService';
import { ErrorBoundary } from 'react-error-boundary';

interface LeadSourceData {
  sourceName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
  avgDealValue: number;
}

export const LeadSourceReport: React.FC = () => {
  const [data, setData] = useState<LeadSourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reportingSvc = new ReportingService(ErrorBoundary);

  useEffect(() => {
    reportingSvc.getLeadSourceAnalysis()
      .then((result: LeadSourceData[]) => {
        setData(result);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Loading...</div>;

  const pieData = data.map(item => ({
    label: item.sourceName,
    value: item.totalLeads
  }));

  const totalLeads = data.reduce((sum, item) => sum + item.totalLeads, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Lead Source Analysis</Typography>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <PolarAreaChart 
                data={pieData} 
                title="Leads by Source" 
              />
            </CardContent>
          </Card>
        </div>
        
        <div style={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Typography>Total Leads: {totalLeads}</Typography>
              <Typography>Total Revenue: ${totalRevenue.toLocaleString()}</Typography>
              <Typography>Best Source: {data.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.sourceName}</Typography>
            </CardContent>
          </Card>
        </div>
        
        <div style={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Source Performance</Typography>
              <EnhancedTable 
                headers={['Source', 'Total Leads', 'Converted', 'Conversion Rate', 'Revenue', 'Avg Deal Value']}
                rows={data.map(source => [
                  source.sourceName,
                  source.totalLeads,
                  source.convertedLeads,
                  `${source.conversionRate}%`,
                  `$${source.revenue.toLocaleString()}`,
                  `$${source.avgDealValue.toLocaleString()}`
                ])}
                alignments={['left', 'right', 'right', 'right', 'right', 'right']}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
};