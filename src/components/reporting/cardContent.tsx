import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { BarChart } from "./charts/barChart";
import { GirdElement } from "./gridElement";
import { ErrorBoundary } from "react-error-boundary";
import { ReportingService } from "../../services/reportingService";
import { DealConversionReport } from "./reports/dealConversionReport";
import { SalesPerformanceReport } from "./reports/salesPerformanceReport";
import { TreatmentAnalysisReport } from "./reports/treatmentAnalysisReport";
import { UserPerformanceReport } from "./reports/userPerformanceReport";
import { LeadSourceReport } from "./reports/leadSourceReport";
import { PipelineHealthReport } from "./reports/pipelineHealthReport";
import moment from "moment";

type params = {
  selectedTab: any;
  startDate: any;
  endDate: any;
  frequencey: any;
};
const CardContent = (props: params) => {
  const { selectedTab, startDate, endDate, frequencey, ...others } = props;
  const reportingSvc = new ReportingService(ErrorBoundary);
  const [isFilterChanged, setIsFiltersChanged] = useState(false);
  const [data, setData] = useState<Array<any>>([]);
  const [values, setValues] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateLabels = (
    startDate: Date,
    endDate: Date,
    frequency: string
  ): string[] => {
    const labels: string[] = [];
    const date = new Date(startDate);

    while (date <= endDate) {
      let label: string;
      if (frequency === "daily") {
        label = date.toISOString().split("T")[0];
        date.setDate(date.getDate() + 1);
      } else if (frequency === "weekly") {
        label = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        date.setDate(date.getDate() + 7);
      } else if (frequency === "monthly") {
        label = `${date.getFullYear()}-${date.getMonth() + 1}`;
        date.setMonth(date.getMonth() + 1);
      } else if (frequency === "yearly") {
        label = `${date.getFullYear()}`;
        date.setFullYear(date.getFullYear() + 1);
      } else {
        throw new Error("Unsupported frequency");
      }
      labels.push(label);
    }

    return labels;
  };

  const generateValues = (
    data: any[],
    startDate: Date,
    endDate: Date,
    frequency: string,
    labels: string[]
  ): number[] => {
    const counts: { [key: string]: number } = {};

    data.forEach((item) => {
      const itemDate = new Date(item.createdDate);
      if (itemDate >= startDate && itemDate <= endDate) {
        let key: string;
        if (frequency === "daily") {
          key = itemDate.toISOString().split("T")[0];
        } else if (frequency === "weekly") {
          key = `${itemDate.getFullYear()}-W${Math.ceil(
            itemDate.getDate() / 7
          )}`;
        } else if (frequency === "monthly") {
          key = `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}`;
        } else if (frequency === "yearly") {
          key = `${itemDate.getFullYear()}`;
        } else {
          throw new Error("Unsupported frequency");
        }
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return labels.map((label) => counts[label] || 0);
  };

  useEffect(() => {
    if (isLoading) return;
    setIsLoading(true);
    reportingSvc.getReports().then((res: Array<any>) => {
      setData(filterData(startDate, endDate, res));
      setIsLoading(false);
      setIsFiltersChanged(false);
    });
  }, [isFilterChanged]);

  useEffect(() => {
    if (frequencey && data.length > 0) {
      const labels = generateLabels(
        startDate,
        endDate,
        (frequencey as string).toLocaleLowerCase()
      );
      let values = generateValues(
        data,
        startDate,
        endDate,
        (frequencey as string).toLocaleLowerCase(),
        labels
      );
      setLabels(labels as any);
      setValues(values as any);
    }
  }, [data, frequencey, startDate, endDate]);

  function filterData(startDate: any, endDate: any, data: Array<any>) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return data.filter((item) => {
      const itemDate = new Date(item.createdDate);
      return itemDate >= start && itemDate <= end;
    });
  }

  useEffect(() => {
    setIsFiltersChanged(true);
  }, [selectedTab, startDate, endDate, frequencey]);

  const renderReportContent = () => {
    switch (selectedTab) {
      case "Deal Conversion":
        return <DealConversionReport />;
      case "Sales Performance":
        return <SalesPerformanceReport />;
      case "Treatment Analysis":
        return <TreatmentAnalysisReport />;
      case "User Performance":
        return <UserPerformanceReport />;
      case "Lead Source":
        return <LeadSourceReport />;
      case "Pipeline Health":
        return <PipelineHealthReport />;
      default:
        return (
          <GirdElement
            element={
              <Box>
                {data.length > 0 && values.length > 0 ? (
                  <div>
                    <BarChart values={values} labels={labels} displayLegend={true} selectedTab={selectedTab}/>
                  </div>
                ) : (
                  "There is no data to show in this time frame. Try changing the date range."
                )}
              </Box>
            }
            height={600}
            width={800}
          ></GirdElement>
        );
    }
  };

  return renderReportContent();
};

export default CardContent;
