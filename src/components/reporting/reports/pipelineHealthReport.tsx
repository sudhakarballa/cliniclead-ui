import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { RadarChart } from '../charts/radarChart';
import { ReportingService } from '../../../services/reportingService';
import { ErrorBoundary } from 'react-error-boundary';

interface PipelineHealthData {
  totalDeals: number;
  activeDeals: number;
  stalledDeals: number;
  overdueTasks: number;
  avgDealAge: number;
  stageDistribution: Array<{
    stageName: string;
    dealCount: number;
    percentage: number;
  }>;
}

export const PipelineHealthReport: React.FC = () => {
  const [data, setData] = useState<PipelineHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reportingSvc = new ReportingService(ErrorBoundary);

  useEffect(() => {
    reportingSvc.getPipelineHealth()
      .then((result: PipelineHealthData) => {
        setData(result);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  const pieData = data.stageDistribution.map(stage => ({
    label: stage.stageName,
    value: stage.dealCount
  }));

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Pipeline Health</Typography>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '2 1 calc(66% - 12px)', minWidth: '400px' }}>
          <Card>
            <CardContent>
              <RadarChart 
                data={pieData} 
                title="Deal Distribution by Stage" 
              />
            </CardContent>
          </Card>
        </div>
        
        <div style={{ flex: '1 1 calc(33% - 12px)', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Health Metrics</Typography>
              <Box mb={2}>
                <Typography variant="h4" color="primary">{data.totalDeals}</Typography>
                <Typography variant="body2">Total Deals</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="h4" color="primary">{data.activeDeals}</Typography>
                <Typography variant="body2">Active Deals</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="h4" color="secondary">{data.stalledDeals}</Typography>
                <Typography variant="body2">Stalled Deals</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="h4" color="error">{data.overdueTasks}</Typography>
                <Typography variant="body2">Overdue Tasks</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="h4" color="primary">{data.avgDealAge}</Typography>
                <Typography variant="body2">Avg Deal Age (days)</Typography>
              </Box>
            </CardContent>
          </Card>
        </div>
        
        <div style={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Stage Distribution</Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {data.stageDistribution.map((stage, index) => (
                  <div key={index} style={{ flex: '1 1 calc(16.66% - 14px)', minWidth: '150px' }}>
                    <Box textAlign="center" p={2} border={1} borderColor="grey.300" borderRadius={1}>
                      <Typography variant="h5" color="primary">{stage.dealCount}</Typography>
                      <Typography variant="body2">{stage.stageName}</Typography>
                      <Typography variant="caption">{stage.percentage}%</Typography>
                    </Box>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
};