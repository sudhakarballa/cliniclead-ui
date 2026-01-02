import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { AreaChart } from '../charts/areaChart';
import { ReportingService } from '../../../services/reportingService';
import { ErrorBoundary } from 'react-error-boundary';

interface ConversionData {
  stageName: string;
  stageOrder: number;
  dealCount: number;
  totalValue: number;
  conversionRate: number;
  avgTimeInStage: number;
}

export const DealConversionReport: React.FC = () => {
  const [data, setData] = useState<ConversionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reportingSvc = new ReportingService(ErrorBoundary);

  useEffect(() => {
    reportingSvc.getDealConversionFunnel()
      .then((result: ConversionData[]) => {
        setData(result);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Loading...</div>;

  const totalDeals = data[0]?.dealCount || 0;
  const wonDeals = data[data.length - 1]?.dealCount || 0;
  const overallConversion = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Deal Conversion Funnel</Typography>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '2 1 calc(66% - 12px)', minWidth: '400px' }}>
          <Card>
            <CardContent>
              <AreaChart 
                data={data.map(item => ({ label: item.stageName, value: item.dealCount }))}
                title="Deal Conversion Funnel"
                yAxisLabel="Deal Count"
              />
            </CardContent>
          </Card>
        </div>
        
        <div style={{ flex: '1 1 calc(33% - 12px)', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Typography>Total Deals: {totalDeals}</Typography>
              <Typography>Won Deals: {wonDeals}</Typography>
              <Typography>Overall Conversion: {overallConversion}%</Typography>
            </CardContent>
          </Card>
          
          <Box mt={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Stage Details</Typography>
                {data.map((stage, index) => (
                  <Box key={index} mb={1}>
                    <Typography variant="subtitle2">{stage.stageName}</Typography>
                    <Typography variant="body2">
                      {stage.dealCount} deals • {stage.conversionRate}% conversion
                    </Typography>
                    <Typography variant="body2">
                      Avg. time: {stage.avgTimeInStage} days
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        </div>
      </div>
    </Box>
  );
};