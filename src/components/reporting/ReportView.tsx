import {
  faChartBar,
  faChartLine,
  faChevronDown,
  faChevronUp,
  faCopy,
  faDownload,
  faEllipsisV,
  faFilter,
  faFolder,
  faPlus,
  faRedo,
  faSave,
  faSearch,
  faTable,
  faTachometerAlt,
  faTimes,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState } from "react";
import { Badge, Button, Dropdown, Form } from "react-bootstrap";
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { DeleteDialog } from '../../common/deleteDialog';
import { AddEditDialog } from '../../common/addEditDialog';

import { ReportDefinition, CreateReportRequest } from '../../models/reportModels';
import { ReportService } from '../../services/reportService';
import { DashboardFolderService } from '../../services/dashboardFolderService';
import { ReportDashboardService } from '../../services/reportDashboardService';
import { DealService } from '../../services/dealService';
import { StageService } from '../../services/stageService';
import Util from '../../others/util';
import Constants from '../../others/constants';
import LocalStorageUtil from '../../others/LocalStorageUtil';
import { Utility } from '../../models/utility';

interface ReportViewProps {
  entity: string;
  reportType: string;
  reportDefinition?: ReportDefinition;
  allDealsData?: any[];
  onBack: () => void;
  onSave?: (reportData: any) => void;
  onDelete?: (reportId: number) => void;
  onDashboardUpdate?: (updatedDashboards: any[]) => void;
  existingReports?: any[];
}

interface FilterCondition {
  id: string;
  entity: string;
  field: string;
  operator: string;
  value: string;
  displayText: string;
}

const ReportView: React.FC<ReportViewProps> = ({ entity, reportType, reportDefinition, allDealsData = [], onBack, onSave, onDelete, onDashboardUpdate, existingReports = [] }) => {
  // Extract entity from report name if in edit mode
  const getEntityFromName = (name: string) => {
    const firstWord = name.split(' ')[0];
    return ['Deal', 'Contact', 'Activity'].includes(firstWord) ? firstWord : entity;
  };
  
  const getNameWithoutEntity = (name: string) => {
    const firstWord = name.split(' ')[0];
    return ['Deal', 'Contact', 'Activity'].includes(firstWord) ? name.substring(firstWord.length + 1) : name;
  };
  
  const detectedEntity = reportDefinition?.name ? getEntityFromName(reportDefinition.name) : entity;
  const nameWithoutEntity = reportDefinition?.name ? getNameWithoutEntity(reportDefinition.name) : `${reportType} Report`;
  
  const { control, handleSubmit: handleFormSubmit, formState: { errors }, setValue: setFormValue, trigger, clearErrors } = useForm({
    mode: 'onChange',
    defaultValues: {
      reportName: nameWithoutEntity,
      field: '',
      operator: '',
      value: ''
    }
  });
  
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([]);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [filterErrors, setFilterErrors] = useState<{[key: string]: {field?: string, operator?: string, value?: string}}>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [newCondition, setNewCondition] = useState({
    entity: 'Deal',
    field: '',
    operator: '',
    value: ''
  });
  const [chartType, setChartType] = useState<"column" | "bar" | "pie" | "scorecard" | "table">("column");
  const [viewBy, setViewBy] = useState("Deal created on");
  const [frequency, setFrequency] = useState(reportDefinition?.frequency || "Daily");
  const [segmentBy, setSegmentBy] = useState("Status");
  const [activeTab, setActiveTab] = useState("deals");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [tableExpanded, setTableExpanded] = useState(true);
  const [dealsCurrentPage, setDealsCurrentPage] = useState(1);
  const [dealsPageSize, setDealsPageSize] = useState(25);
  const [hoveredBar, setHoveredBar] = useState<{index: number, x: number, y: number, data: any} | null>(null);
  const [savedFilters, setSavedFilters] = useState<FilterCondition[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddToDashboard, setShowAddToDashboard] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [existingDashboards, setExistingDashboards] = useState<any[]>([]);
  const [reportSaved, setReportSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportName, setReportName] = useState(nameWithoutEntity);
  const [originalReportName, setOriginalReportName] = useState(nameWithoutEntity);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCreateDashboard, setShowCreateDashboard] = useState(false);
  const [dashboardName, setDashboardName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dashboardFolders, setDashboardFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [dashboardNameError, setDashboardNameError] = useState('');
  const [folderNameError, setFolderNameError] = useState('');
  const [previewReportId, setPreviewReportId] = useState<number | null>(null);
  const [reportCreated, setReportCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportDetailsData, setReportDetailsData] = useState<any[]>([]);
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );

  // Fetch report details from API
  const fetchReportDetails = async (reportId: number) => {
    setIsLoadingReportData(true);
    try {
      const reportService = new ReportService(null);
      const response = await reportService.getReportDetails(reportId);
      if (response?.success && response?.stages) {
        setReportDetailsData(response.stages);
      } else {
        console.warn('No stages data found in response:', response);
        setReportDetailsData([]);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      setReportDetailsData([]);
    } finally {
      setIsLoadingReportData(false);
    }
  };

  // Auto-save preview report
  const savePreviewReport = async (conditions: FilterCondition[]) => {
    if (!reportName.trim() || conditions.length === 0) return null;
    
    try {
      const reportRequest = new CreateReportRequest();
      reportRequest.createdDate = new Date();
      reportRequest.createdBy = 0;
      reportRequest.modifiedBy = 0;
      reportRequest.modifiedDate = new Date();
      reportRequest.updatedBy = 0;
      reportRequest.updatedDate = new Date();
      reportRequest.userId = 0;
      reportRequest.id = previewReportId || 0;
      reportRequest.name = reportName.trim();
      reportRequest.chartType = chartType;
      reportRequest.frequency = frequency;
      reportRequest.isPreview = true;
      reportRequest.isActive = true;
      reportRequest.isPublic = true;
      reportRequest.reportConditions = conditions.map(filter => ({
        id: 0,
        reportDefinitionId: previewReportId || 0,
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        extraValue: ''
      }));
      
      const reportService = new ReportService(null);
      
      if (previewReportId && reportCreated) {
        // Use PUT for existing report
        const updated = await reportService.updateReport(previewReportId, reportRequest);
        return previewReportId;
      } else {
        // Use POST for new report
        const savedReport = await reportService.saveReport(reportRequest);
        if (savedReport?.id || savedReport?.result?.id) {
          const reportId = savedReport.id || savedReport.result.id;
          setPreviewReportId(reportId);
          setReportCreated(true);
          return reportId;
        }
      }
    } catch (error) {
      console.error('Error saving preview report:', error);
    }
    return null;
  };

  // Check if newCondition is complete - removed auto-save
  React.useEffect(() => {
    // Just for validation, no auto-save
  }, [newCondition.field, newCondition.operator, newCondition.value, reportName, appliedFilters]);

  // Load existing dashboards and folders
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFolders(true);
        const folderService = new DashboardFolderService(null);
        const dashboardService = new ReportDashboardService(null);
        
        const [folders, dashboards] = await Promise.all([
          folderService.getAllFolders(),
          dashboardService.getAllDashboards()
        ]);
        
        setDashboardFolders(folders || []);
        setExistingDashboards(dashboards || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setDashboardFolders([]);
        setExistingDashboards([]);
      } finally {
        setLoadingFolders(false);
      }
    };
    
    loadData();
    // Set reportSaved to true if reportDefinition exists (edit mode)
    if (reportDefinition) {
      setReportSaved(true);
      setReportCreated(true);
      setPreviewReportId(reportDefinition.id);
      setOriginalReportName(reportDefinition.name);
      // Load existing conditions for editing
      const existingConditions = (reportDefinition.reportConditions || []).map((condition: any) => ({
        id: (condition.id || Date.now()).toString(),
        entity: 'Deal',
        field: condition.field || '',
        operator: condition.operator || '',
        value: (condition.value || '').toString(),
        displayText: `${condition.field || ''} ${condition.operator || ''} ${condition.value || ''}`
      }));
      setAppliedFilters(existingConditions);
      setSavedFilters(existingConditions);
      
      // Fetch report details from API
      fetchReportDetails(reportDefinition.id);
    }
  }, [reportDefinition]);

  // Ensure localStorage persistence on component unmount
  React.useEffect(() => {
    return () => {
      // Component cleanup - ensure any pending saves are preserved
      const currentReports = localStorage.getItem('createdReports');
      if (currentReports) {
        console.log('ReportView unmounting - createdReports still in localStorage:', JSON.parse(currentReports).length, 'reports');
      }
    };
  }, []);

  // Track changes in filters, report name, and frequency
  React.useEffect(() => {
    if (reportSaved) {
      const originalFilters = savedFilters;
      const currentFilters = appliedFilters;
      const filtersChanged = JSON.stringify(originalFilters) !== JSON.stringify(currentFilters);
      const currentFullName = `${detectedEntity} ${reportName.trim()}`;
      const nameChanged = currentFullName !== originalReportName;
      const frequencyChanged = frequency !== (reportDefinition?.frequency || "Daily");
      const hasNewConditionRow = showAddCondition; // Just showing the add condition row is a change
      setHasChanges(filtersChanged || nameChanged || frequencyChanged || hasNewConditionRow);
    }
  }, [appliedFilters, savedFilters, reportSaved, reportName, originalReportName, frequency, detectedEntity, reportDefinition, showAddCondition]);

  const validateFilters = async () => {
    const isNameValid = await trigger('reportName');
    
    // Validate all applied filters are complete
    const errors: {[key: string]: {field?: string, operator?: string, value?: string}} = {};
    appliedFilters.forEach(filter => {
      const filterErrors: {field?: string, operator?: string, value?: string} = {};
      if (!filter.field) filterErrors.field = 'Field is required';
      if (!filter.operator) filterErrors.operator = 'Operator is required';
      if (!filter.value) filterErrors.value = 'Value is required';
      
      if (Object.keys(filterErrors).length > 0) {
        errors[filter.id] = filterErrors;
      }
    });
    
    setFilterErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setShowValidationSummary(true);
      return false;
    }
    
    // If no applied filters OR if add condition row is visible, validate the new condition fields
    if (appliedFilters.length === 0 || showAddCondition) {
      setShowAddCondition(true);
      const results = await trigger(['field', 'operator', 'value']);
      if (!results) {
        setShowValidationSummary(true);
      }
      return isNameValid && results;
    }
    
    setShowValidationSummary(false);
    return isNameValid;
  };

  const validateReportName = () => {
    return trigger('reportName');
  };

  const validateConditions = async () => {
    if (appliedFilters.length === 0) {
      setShowAddCondition(true);
      const isValid = await trigger('field') && await trigger('operator') && await trigger('value');
      return isValid;
    }
    return true;
  };

  const getFilteredData = () => {
    // Use API data only
    let filteredData = reportDetailsData.length > 0 ? reportDetailsData : [];
    console.log('Filtering data with appliedFilters:', appliedFilters);
    console.log('Current newCondition:', newCondition);
    console.log('Original data count:', filteredData.length);
    console.log('Using API data:', reportDetailsData.length > 0);
    
    // If using API data and no filters applied, return all API data
    if (reportDetailsData.length > 0 && appliedFilters.length === 0 && !newCondition.field) {
      return filteredData;
    }
    
    // Include current newCondition if it's complete for preview
    const filtersToApply = [...appliedFilters];
    if (newCondition.field && newCondition.operator && newCondition.value) {
      filtersToApply.push({
        id: 'temp',
        entity: newCondition.entity,
        field: newCondition.field,
        operator: newCondition.operator,
        value: newCondition.value,
        displayText: `${newCondition.field} ${newCondition.operator} ${newCondition.value}`
      });
    }
    
    filtersToApply.forEach(filter => {
      // Skip filters with empty values
      if (!filter.value || !filter.field || !filter.operator) {
        console.log('Skipping incomplete filter:', filter);
        return;
      }
      
      console.log('Applying filter:', filter);
      const beforeCount = filteredData.length;
      switch (filter.field) {
        case 'Status':
          filteredData = filteredData.filter(deal => {
            let dealStatus = 'Open';
            if (deal.statusID !== undefined) {
              switch (deal.statusID) {
                case 1: dealStatus = 'Open'; break;
                case 2: dealStatus = 'Won'; break;
                case 3: dealStatus = 'Lost'; break;
                default: dealStatus = 'Open';
              }
            } else if (deal.status) {
              dealStatus = deal.status;
            }
            return filter.operator === '=' ? dealStatus === filter.value : dealStatus !== filter.value;
          });
          break;
        case 'Pipeline':
          filteredData = filteredData.filter(deal => {
            const pipelineName = deal.pipelineName || deal.pipeline || '';
            return filter.operator === '=' ? pipelineName === filter.value : pipelineName !== filter.value;
          });
          break;
        case 'Owner':
          filteredData = filteredData.filter(deal => {
            const ownerId = String(deal.assigntoId || deal.AssigntoId || '');
            return filter.operator === '=' ? ownerId === filter.value : ownerId !== filter.value;
          });
          break;
        case 'Deal value':
          const value = parseFloat(filter.value);
          if (!isNaN(value)) {
            filteredData = filteredData.filter(deal => {
              const dealValue = parseFloat(deal.value) || 0;
              switch (filter.operator) {
                case '>': return dealValue > value;
                case '<': return dealValue < value;
                case '=': return dealValue === value;
                case '!=': return dealValue !== value;
                default: return true;
              }
            });
          }
          break;
        case 'Deal created on':
          if (filter.value) {
            filteredData = filteredData.filter(deal => {
              const dateStr = deal.createdDate || deal.addTime || '';
              const dealDate = dateStr.split('T')[0]; // Get date part only
              switch (filter.operator) {
                case '>': return dealDate > filter.value;
                case '<': return dealDate < filter.value;
                case '=': return dealDate === filter.value;
                case '!=': return dealDate !== filter.value;
                default: return true;
              }
            });
          }
          break;
        case 'Stage':
          filteredData = filteredData.filter(deal => {
            const stageName = deal.stageName || '';
            return filter.operator === '=' ? stageName === filter.value : stageName !== filter.value;
          });
          break;
        case 'Treatment':
          filteredData = filteredData.filter(deal => {
            const treatmentName = deal.treatmentName || '';
            return filter.operator === '=' ? treatmentName === filter.value : treatmentName !== filter.value;
          });
          break;
        case 'Clinic':
          filteredData = filteredData.filter(deal => {
            const clinicName = deal.clinicName || '';
            return filter.operator === '=' ? clinicName === filter.value : clinicName !== filter.value;
          });
          break;
        case 'Source':
          filteredData = filteredData.filter(deal => {
            const sourceName = deal.sourceName || '';
            return filter.operator === '=' ? sourceName === filter.value : sourceName !== filter.value;
          });
          break;
        case 'Pipeline Type':
          filteredData = filteredData.filter(deal => {
            const pipelineTypeName = deal.pipelineTypeName || '';
            return filter.operator === '=' ? pipelineTypeName === filter.value : pipelineTypeName !== filter.value;
          });
          break;
        case 'Expected Close Date':
          if (filter.value) {
            filteredData = filteredData.filter(deal => {
              const dateStr = deal.expectedCloseDate || '';
              const dealDate = dateStr.split('T')[0];
              switch (filter.operator) {
                case '>': return dealDate > filter.value;
                case '<': return dealDate < filter.value;
                case '=': return dealDate === filter.value;
                case '!=': return dealDate !== filter.value;
                default: return true;
              }
            });
          }
          break;
        case 'Probability':
          const probValue = parseFloat(filter.value);
          if (!isNaN(probValue)) {
            filteredData = filteredData.filter(deal => {
              const dealProb = parseFloat(deal.probability) || 0;
              switch (filter.operator) {
                case '>': return dealProb > probValue;
                case '<': return dealProb < probValue;
                case '=': return dealProb === probValue;
                case '!=': return dealProb !== probValue;
                default: return true;
              }
            });
          }
          break;
        case 'Won Time':
          if (filter.value) {
            filteredData = filteredData.filter(deal => {
              const dateStr = deal.wontime || '';
              const dealDate = dateStr.split('T')[0];
              switch (filter.operator) {
                case '>': return dealDate > filter.value;
                case '<': return dealDate < filter.value;
                case '=': return dealDate === filter.value;
                case '!=': return dealDate !== filter.value;
                default: return true;
              }
            });
          }
          break;
      }
      
      const afterCount = filteredData.length;
      console.log(`Filter ${filter.field} ${filter.operator} ${filter.value}: ${beforeCount} -> ${afterCount} deals`);
    });
    
    console.log('Final filtered data count:', filteredData.length);
    return filteredData;
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters = appliedFilters.filter(f => f.id !== filterId);
    setAppliedFilters(updatedFilters);
    
    // If removing the last filter, clear the draft condition too
    if (updatedFilters.length === 0) {
      setNewCondition({ entity: 'Deal', field: '', operator: '', value: '' });
    }
  };

  const handleAddConditionClick = () => {
    if (newCondition.field && newCondition.operator && newCondition.value) {
      const condition: FilterCondition = {
        id: Date.now().toString(),
        entity: newCondition.entity,
        field: newCondition.field,
        operator: newCondition.operator,
        value: newCondition.value,
        displayText: `${newCondition.field} ${newCondition.operator} ${newCondition.value}`
      };
      const updatedFilters = [...appliedFilters, condition];
      setAppliedFilters(updatedFilters);
      
      // Clear the newCondition and form values
      setNewCondition({ entity: 'Deal', field: '', operator: '', value: '' });
      setFormValue('field', '');
      setFormValue('operator', '');
      setFormValue('value', '');
    } else {
      setShowAddCondition(true);
    }
  };

  const fieldOptions = [
    { value: "1", label: "Title" },
    { value: "2", label: "Creator" },
    { value: "AssigntoId", label: "Owner", isNumberType: true },
    { value: "4", label: "Value", isNumberType: true },
    { value: "6", label: "Probability", isNumberType: true },
    { value: "7", label: "Organization" },
    { value: "8", label: "Pipeline" },
    { value: "stageid", label: "Stage", isNumberType: true },
    { value: "11", label: "Label" },
    { value: "statusid", label: "Status", isNumberType: true },
    { value: "13", label: "Deal created", isDateType: true },
    { value: "14", label: "Update time", isDateType: true },
    { value: "15", label: "Last stage change", isDateType: true },
    { value: "16", label: "Next activity date", isDateType: true },
    { value: "17", label: "Last activity date", isDateType: true },
    { value: "18", label: "Won time", isDateType: true },
    { value: "19", label: "Last email received", isDateType: true },
    { value: "20", label: "Last email sent", isDateType: true },
    { value: "21", label: "Lost time", isDateType: true },
    { value: "22", label: "Deal closed on", isDateType: true },
    { value: "23", label: "Lost reason" },
    { value: "24", label: "Visible to" }
  ];

  const contactFieldOptions = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "owner", label: "Owner" },
    { value: "created", label: "Created Date", isDateType: true },
    { value: "updated", label: "Updated Date", isDateType: true }
  ];

  const activityFieldOptions = [
    { value: "type", label: "Activity Type" },
    { value: "subject", label: "Subject" },
    { value: "dueDate", label: "Due Date", isDateType: true },
    { value: "done", label: "Done" },
    { value: "owner", label: "Owner" },
    { value: "created", label: "Created Date", isDateType: true }
  ];

  const getFieldOptions = () => {
    switch(entity) {
      case 'Contact':
        return contactFieldOptions;
      case 'Activity':
        return activityFieldOptions;
      default:
        return fieldOptions;
    }
  };

  const getValueOptions = (field: string) => {
    const fieldOption = fieldOptions.find(f => f.value === field);
    
    // Return status options for status field
    if (field === 'statusid') {
      return dealStatusList;
    }
    
    // Return date values for date fields
    if (fieldOption?.isDateType) {
      return dateValues;
    }
    
    // For other fields, get unique values from data
    // Use reportDetailsData if available (for existing reports), otherwise use allDealsData (for new reports)
    const dataSource = reportDetailsData.length > 0 ? reportDetailsData : allDealsData;
    
    console.log('getValueOptions - field:', field, 'dataSource length:', dataSource.length, 'allDealsData length:', allDealsData.length);
    
    // For Owner field (AssigntoId), use assigntoId as value but show ownerName as label
    if (field === 'AssigntoId') {
      const ownerIds = new Set<string>();
      dataSource.forEach((deal: any) => {
        const ownerId = deal.assigntoId || deal.AssigntoId;
        if (ownerId) ownerIds.add(String(ownerId));
      });
      return utility?.users
        .filter((u) => u.isActive && ownerIds.has(String(u.id)))
        .map(({ name, id }) => ({
          value: String(id),
          label: name,
        })) ?? [];
    }
    
    const uniqueValues = new Set<string>();
    
    dataSource.forEach((deal: any) => {
      switch (field) {
        case '8': // Pipeline
          if (deal.pipelineName) uniqueValues.add(deal.pipelineName);
          else if (deal.pipeline) uniqueValues.add(deal.pipeline);
          break;
        case 'stageid': // Stage
          if (deal.stageName) uniqueValues.add(deal.stageName);
          break;
        case '7': // Organization
          if (deal.name) uniqueValues.add(deal.name);
          break;
        case '1': // Title
          if (deal.title) uniqueValues.add(deal.title);
          break;
      }
    });
    
    const result = Array.from(uniqueValues).sort().map(value => ({ value, label: value }));
    console.log('getValueOptions - result:', result.length, 'options');
    return result;
  };

  const operatorsForNumberType = [
    { label: "Greater than", value: ">" },
    { label: "Less than", value: "<" },
    { label: "Greater than or equal to", value: ">=" },
    { label: "Less than or equal to", value: "<=" },
  ];

  const operatorOptions = [
    { label: "Is empty", value: "IS NULL" },
    { label: "Is not empty", value: "IS NOT NULL" },
    { label: "Equals", value: "=" },
    { label: "Does not equal", value: "!=" },
  ];

  const dateValues = [
    { label: "Last Quarter", value: "lastQuarter" },
    { label: "Next Quarter", value: "nextQuarter" },
    { label: "This Quarter", value: "thisQuarter" },
    { label: "Last Month", value: "lastMonth" },
    { label: "Next Month", value: "nextMonth" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Week", value: "lastWeek" },
    { label: "Next Week", value: "nextWeek" },
    { label: "This Week", value: "thisWeek" },
    { label: "Last Year", value: "lastYear" },
    { label: "Next Year", value: "nextYear" },
    { label: "This Year", value: "thisYear" },
    { label: "6 Months Ago", value: "6MonthsAgo" },
    { label: "5 Months Ago", value: "5MonthsAgo" },
    { label: "4 Months Ago", value: "4MonthsAgo" },
    { label: "3 Months Ago", value: "3MonthsAgo" },
  ];

  const dealStatusList = [
    { value: "1", label: "Open" },
    { value: "2", label: "Won" },
    { value: "3", label: "Lost" },
    { value: "4", label: "Closed" },
    { value: "5", label: "Deleted" },
  ];

  const getOperatorOptions = (field: string) => {
    const fieldOption = fieldOptions.find(f => f.value === field);
    if (fieldOption?.isNumberType) {
      return operatorOptions.concat(operatorsForNumberType);
    }
    return operatorOptions;
  };

  const getReportData = () => {
    const deals = getFilteredData();
    console.log('API deals data:', deals);
    
    if (!deals.length) return [];
    
    // Dynamic chart data based on frequency
    const chartData: Record<string, {won: number, lost: number, open: number, total: number, value: number}> = {};
    
    deals.forEach(deal => {
      let timeKey = '';
      const date = new Date(deal.createdDate || deal.addTime || new Date());
      
      // Generate time key based on frequency
      switch (frequency) {
        case 'Daily':
          timeKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'Yearly':
          timeKey = date.getFullYear().toString(); // YYYY
          break;
        default: // Monthly
          timeKey = date.toISOString().substring(0, 7); // YYYY-MM
      }
      
      if (!chartData[timeKey]) {
        chartData[timeKey] = {won: 0, lost: 0, open: 0, total: 0, value: 0};
      }
      
      // Count by status: 1=Open, 2=Won, 3=Lost
      const status = deal.statusID === 2 ? 'won' : deal.statusID === 3 ? 'lost' : 'open';
      chartData[timeKey][status]++;
      chartData[timeKey].total++;
      chartData[timeKey].value += parseFloat(deal.value) || 0;
    });
    
    // Convert to array and sort
    const result = Object.entries(chartData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        month: period,
        won: data.won,
        lost: data.lost,
        open: data.open,
        total: data.total,
        totalValue: data.value
      }));
    
    console.log('Dynamic chart data:', result);
    return result;
  };

  const generateMonthlyPerformanceDataFromDeals = (deals: any[]) => {
    console.log('generateMonthlyPerformanceDataFromDeals - input deals:', deals.length, deals);
    const monthlyData: Record<string, Record<string, number>> = {};
    deals.forEach(deal => {
      // Handle both API and mock data date formats
      const dateStr = deal.createdDate || deal.addTime || new Date().toISOString();
      const month = dateStr.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { won: 0, lost: 0, open: 0, total: 0, value: 0 };
      }
      
      // Handle API data status logic: statusID 1=Open, 2=Won, 3=Lost
      let status = 'open';
      if (deal.statusID !== undefined) {
        switch (deal.statusID) {
          case 1: status = 'open'; break;
          case 2: status = 'won'; break;
          case 3: status = 'lost'; break;
          default: status = 'open';
        }
      } else if (deal.status) {
        status = deal.status.toLowerCase();
      }
      
      console.log('Processing deal:', deal.dealID, 'statusID:', deal.statusID, 'mapped status:', status, 'month:', month);
      
      if (['won', 'lost', 'open'].includes(status)) {
        monthlyData[month][status] = (monthlyData[month][status] || 0) + 1;
        monthlyData[month].total += 1;
        monthlyData[month].value += parseFloat(deal.value) || 0;
      }
    });
    
    console.log('Monthly data before processing:', monthlyData);
    
    const result = Object.entries(monthlyData)
      .filter(([_, data]) => data.total > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        won: data.won || 0,
        lost: data.lost || 0,
        open: data.open || 0,
        total: data.total,
        totalValue: data.value
      }));
    
    console.log('generateMonthlyPerformanceDataFromDeals - final result:', result);
    
    // If no data, create sample data for current month
    if (result.length === 0 && deals.length > 0) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      return [{
        month: currentMonth,
        won: 0,
        lost: 0,
        open: deals.length,
        total: deals.length,
        totalValue: deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0)
      }];
    }
    
    return result;
  };

  const generateDailyPerformanceDataFromDeals = (deals: any[]) => {
    const dailyData: Record<string, Record<string, number>> = {};
    deals.forEach(deal => {
      const dealDate = new Date(deal.addTime);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - dealDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff <= 30) {
        const day = deal.addTime;
        if (!dailyData[day]) {
          dailyData[day] = { won: 0, lost: 0, open: 0, total: 0, value: 0 };
        }
        const statusKey = deal.status.toLowerCase();
        if (['won', 'lost', 'open'].includes(statusKey)) {
          dailyData[day][statusKey] = (dailyData[day][statusKey] || 0) + 1;
          dailyData[day].total += 1;
          dailyData[day].value += deal.value;
        }
      }
    });
    
    return Object.entries(dailyData)
      .filter(([_, data]) => data.total > 0)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-20)
      .map(([day, data]) => ({
        month: day,
        won: data.won || 0,
        lost: data.lost || 0,
        open: data.open || 0,
        total: data.total,
        totalValue: data.value
      }));
  };

  const generateYearlyPerformanceDataFromDeals = (deals: any[]) => {
    const yearlyData: Record<string, Record<string, number>> = {};
    deals.forEach(deal => {
      const year = deal.addTime.substring(0, 4);
      if (!yearlyData[year]) {
        yearlyData[year] = { won: 0, lost: 0, open: 0, total: 0, value: 0 };
      }
      const statusKey = deal.status.toLowerCase();
      if (['won', 'lost', 'open'].includes(statusKey)) {
        yearlyData[year][statusKey] = (yearlyData[year][statusKey] || 0) + 1;
        yearlyData[year].total += 1;
        yearlyData[year].value += deal.value;
      }
    });
    
    return Object.entries(yearlyData)
      .filter(([_, data]) => data.total > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({
        month: year,
        won: data.won || 0,
        lost: data.lost || 0,
        open: data.open || 0,
        total: data.total,
        totalValue: data.value
      }));
  };

  const generateConversionDataFromDeals = (deals: any[]) => {
    console.log('Generating conversion data from deals:', deals.length);
    const monthlyConversion: Record<string, { total: number; won: number }> = {};
    
    deals.forEach(deal => {
      const month = deal.addTime.substring(0, 7);
      if (!monthlyConversion[month]) {
        monthlyConversion[month] = { total: 0, won: 0 };
      }
      monthlyConversion[month].total += 1;
      if (deal.status === 'Won') {
        monthlyConversion[month].won += 1;
      }
    });
    
    console.log('Monthly conversion data:', monthlyConversion);
    
    const result = Object.entries(monthlyConversion)
      .filter(([_, data]) => data.total > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month,
        conversionRate: data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : '0',
        totalDeals: data.total,
        wonDeals: data.won
      }));
    
    console.log('Final conversion result:', result);
    return result;
  };

  const generateDurationDataFromDeals = (deals: any[]) => {
    const closedDeals = deals.filter(deal => deal.duration && (deal.status === 'Won' || deal.status === 'Lost'));
    const durationRanges: Record<string, number> = {
      '0-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0
    };
    
    closedDeals.forEach(deal => {
      if (deal.duration <= 30) durationRanges['0-30 days']++;
      else if (deal.duration <= 60) durationRanges['31-60 days']++;
      else if (deal.duration <= 90) durationRanges['61-90 days']++;
      else durationRanges['90+ days']++;
    });
    
    return Object.entries(durationRanges).map(([range, count]) => ({
      range,
      count,
      percentage: closedDeals.length > 0 ? ((count / closedDeals.length) * 100).toFixed(1) : '0'
    }));
  };

  const generateProgressDataFromDeals = (deals: any[]) => {
    const openDeals = deals.filter(deal => deal.status === 'Open');
    const stageData: Record<string, number> = {};
    
    // Initialize with common stages to ensure we always have data
    const commonStages = ['Lead In', 'Contact Made', 'Needs Analysis', 'Proposal', 'Negotiation'];
    commonStages.forEach(stage => {
      stageData[stage] = 0;
    });
    
    openDeals.forEach(deal => {
      stageData[deal.stage] = (stageData[deal.stage] || 0) + 1;
    });
    
    const totalCount = Object.values(stageData).reduce((a, b) => a + b, 0);
    return Object.entries(stageData)
      .filter(([_, count]) => count > 0 || totalCount === 0)
      .map(([stage, count]) => ({
        stage,
        count,
        percentage: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0'
      }));
  };

  const generateProductsDataFromDeals = (deals: any[]) => {
    const productData: Record<string, { count: number; totalValue: number; wonDeals: number }> = {};
    
    deals.forEach(deal => {
      if (deal.products && Array.isArray(deal.products)) {
        deal.products.forEach((product: string) => {
          if (!productData[product]) {
            productData[product] = { count: 0, totalValue: 0, wonDeals: 0 };
          }
          productData[product].count += 1;
          productData[product].totalValue += deal.value;
          if (deal.status === 'Won') {
            productData[product].wonDeals += 1;
          }
        });
      }
    });
    
    const result = Object.entries(productData)
      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
      .map(([product, data]) => ({
        product,
        totalDeals: data.count,
        wonDeals: data.wonDeals,
        totalValue: data.totalValue,
        avgValue: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
        winRate: data.count > 0 ? ((data.wonDeals / data.count) * 100).toFixed(1) : '0'
      }));
    
    return result.length > 0 ? result : [{
      product: 'No Products',
      totalDeals: 0,
      wonDeals: 0,
      totalValue: 0,
      avgValue: 0,
      winRate: '0'
    }];
  };

  const renderChart = () => {
    const data = getReportData();
    const displayName = reportName || `${reportType} Report`;
    
    if (chartType === 'table') {
      return renderDataGrid(data, displayName);
    }
    
    if (chartType === 'scorecard') {
      return renderScoreCard(data, displayName);
    }
    
    return (
      <div className="chart-container">
        <div className="bg-white border rounded p-4" style={{ minHeight: '400px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">{displayName} - {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</h6>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '12px', height: '12px', backgroundColor: '#28a745' }}></div>
                  <small>Won</small>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '12px', height: '12px', backgroundColor: '#f4a261' }}></div>
                  <small>Lost</small>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="rounded" style={{ width: '12px', height: '12px', backgroundColor: '#ADD8E6' }}></div>
                  <small>Open</small>
                </div>
              </div>
              <small className="text-muted">Frequency: {frequency}</small>
            </div>
          </div>
          {renderChartVisualization(data, displayName)}
        </div>
      </div>
    );
  };

  const renderChartVisualization = (data: any[], reportName: string) => {
    if (!data.length) return <div className="text-center text-muted py-5">No data available</div>;
    
    if (chartType === 'column' || chartType === 'bar') {
      return renderBarColumnChart(data, reportName);
    }
    
    if (chartType === 'pie') {
      return renderPieChart(data, reportName);
    }
    
    return <div className="text-center text-muted py-5">Chart visualization coming soon</div>;
  };

  const renderBarColumnChart = (data: any[], displayName: string) => {
    const isHorizontal = chartType === 'bar';
    const showScrollbar = data.length > (isHorizontal ? 6 : 12);
    const displayedData = showScrollbar ? data : data.slice(0, isHorizontal ? 6 : 12);
    const maxValue = Math.max(...data.map(item => item.totalValue || 0), 1);
    const chartWidth = showScrollbar && !isHorizontal ? Math.max(800, data.length * 80) : '100%';
    
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '400px', 
        padding: '20px',
        overflowX: showScrollbar && !isHorizontal ? 'auto' : 'hidden'
      }}>
        <div style={{ 
          width: chartWidth,
          height: '100%',
          position: 'relative'
        }}>
        {/* Y-axis for column chart with horizontal grid lines */}
        {!isHorizontal && (
          <>
            <div style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '20px', 
              height: '320px', 
              display: 'flex', 
              flexDirection: 'column-reverse', 
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#666'
            }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ textAlign: 'right', paddingRight: '5px' }}>
                  {Math.round((maxValue / 5) * i / 1000)}K
                </div>
              ))}
            </div>
            {/* Horizontal grid lines for Y-axis */}
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: '40px',
                right: '20px',
                top: `${20 + (320 - (320 / 5) * i)}px`,
                height: '1px',
                backgroundColor: '#e0e0e0',
                zIndex: 1
              }} />
            ))}
          </>
        )}
        
        {/* Chart area */}
        <div className="chart-bars" style={{ 
          height: '320px', 
          display: 'flex', 
          flexDirection: isHorizontal ? 'column' : 'row',
          alignItems: isHorizontal ? 'flex-start' : 'flex-end', 
          gap: isHorizontal ? '6px' : '12px', 
          marginLeft: isHorizontal ? '0' : '40px',
          marginBottom: isHorizontal ? '0' : '30px',
          width: isHorizontal ? '100%' : 'calc(100% - 40px)',
          overflow: 'hidden'
        }}>
        {displayedData.map((item, index) => {
          const value = item.totalValue || 0;
          const label = item.month || 'N/A';
          const displayValue = value > 1000 ? `£${(value/1000).toFixed(0)}K` : `£${value}`;
          
          const barSize = (value / maxValue) * (isHorizontal ? 70 : 280); // Percentage for horizontal, pixels for vertical
          
          // Determine bar color based on dominant status in this time period
          let barColor = '#ADD8E6'; // Default to Open (light blue)
          if (item.won > item.lost && item.won > item.open) {
            barColor = '#28a745'; // Won (green)
          } else if (item.lost > item.won && item.lost > item.open) {
            barColor = '#f4a261'; // Lost (orange)
          }
          
          return (
            <div key={index} className={`d-flex ${isHorizontal ? 'flex-row align-items-center' : 'flex-column align-items-center'}`} style={{ 
              flex: isHorizontal ? 'none' : '1 1 0px', 
              minWidth: isHorizontal ? '100%' : `${Math.max(50, Math.min(100, 800 / displayedData.length))}px`,
              maxWidth: isHorizontal ? '100%' : '100px',
              marginBottom: isHorizontal ? '8px' : '0',
              width: isHorizontal ? '100%' : 'auto'
            }}>
              {isHorizontal && (
                <div className="text-start me-3" style={{ minWidth: '100px' }}>
                  <small className="text-muted fw-bold" style={{ fontSize: '11px' }}>
                    {label.length > 15 ? label.substring(0, 15) + '...' : label}
                  </small>
                </div>
              )}
              
              <div className="text-center mb-2">
                <small className="fw-bold" style={{ color: barColor }}>{displayValue}</small>
              </div>
              
              <div 
                className="rounded d-flex position-relative" 
                style={{
                  width: isHorizontal ? `${barSize}%` : '60px',
                  height: isHorizontal ? '35px' : `${barSize}px`,
                  minHeight: isHorizontal ? '35px' : '30px',
                  minWidth: isHorizontal ? '5%' : '60px',
                  maxWidth: isHorizontal ? '85%' : '60px',
                  cursor: 'pointer',
                  flexDirection: isHorizontal ? 'row' : 'column',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredBar({
                    index,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    data: { label, item, displayValue, value }
                  });
                }}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {reportType === 'Performance' && item.total > 0 && (
                  <>
                    <div style={{
                      backgroundColor: '#28a745',
                      flex: item.won / item.total,
                      minWidth: isHorizontal ? '3px' : '100%',
                      minHeight: isHorizontal ? '100%' : '3px',
                      transition: 'all 0.3s ease'
                    }}></div>
                    <div style={{
                      backgroundColor: '#f4a261',
                      flex: item.lost / item.total,
                      minWidth: isHorizontal ? '3px' : '100%',
                      minHeight: isHorizontal ? '100%' : '3px',
                      transition: 'all 0.3s ease'
                    }}></div>
                    <div style={{
                      backgroundColor: '#ADD8E6',
                      flex: item.open / item.total,
                      minWidth: isHorizontal ? '3px' : '100%',
                      minHeight: isHorizontal ? '100%' : '3px',
                      transition: 'all 0.3s ease'
                    }}></div>
                  </>
                ) || (
                  <div style={{
                    backgroundColor: barColor,
                    width: '100%',
                    height: '100%',
                    transition: 'all 0.3s ease'
                  }}></div>
                )}
              </div>
              

            </div>
          );
        })}
        </div>
        
        {/* X-axis for column chart with grid lines */}
        {!isHorizontal && (
          <>
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '40px', 
              right: '20px', 
              height: '20px', 
              display: 'flex', 
              justifyContent: 'space-evenly',
              alignItems: 'center',
              fontSize: '11px',
              color: '#666',
              borderTop: '1px solid #ddd'
            }}>
              {displayedData.map((item, index) => {
                const label = item.month || 'N/A';
                return (
                  <div key={index} style={{ textAlign: 'center', fontSize: '10px' }}>
                    {label.length > 8 ? label.substring(0, 8) + '...' : label}
                  </div>
                );
              })}
            </div>

          </>
        )}
        
        {/* X-axis for bar chart with vertical grid lines */}
        {isHorizontal && (
          <>
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '20px', 
              right: '20px', 
              height: '20px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#666',
              borderTop: '1px solid #ddd'
            }}>
              <span>0</span>
              <span>{Math.round(maxValue / 1000)}K</span>
            </div>
            {/* Vertical grid lines for X-axis */}
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${20 + (80 / 5) * i}%`,
                top: '20px',
                bottom: '30px',
                width: '1px',
                backgroundColor: '#e0e0e0',
                zIndex: 1
              }} />
            ))}
          </>
        )}
        </div>
      </div>
    );
  };

  const renderPieChart = (data: any[], displayName: string) => {
    const colors = ['#28a745', '#f4a261', '#ADD8E6']; // Won, Lost, Open
    
    return (
      <div className="row">
        <div className="col-md-6 d-flex justify-content-center align-items-center">
          <div className="position-relative" style={{ width: '200px', height: '200px' }}>
            <div 
              className="rounded-circle border border-5 d-flex align-items-center justify-content-center"
              style={{ 
                width: '200px', 
                height: '200px', 
                background: `conic-gradient(${data.map((item, index) => {
                  const percentage = parseFloat(item.percentage || '0');
                  return `${colors[index % colors.length]} ${index * (100/data.length)}% ${(index + 1) * (100/data.length)}%`;
                }).join(', ')})`,
                borderColor: '#dee2e6'
              }}
            >
              <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                <div className="text-center">
                  <div className="fw-bold">{data.length}</div>
                  <small className="text-muted">Items</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="legend">
            {data.map((item, index) => {
              let label, value;
              switch (reportType) {
                case 'Performance':
                  label = item.month;
                  value = `$${(item.totalValue/1000).toFixed(0)}K`;
                  break;
                case 'Conversion':
                  label = item.month;
                  value = `${item.conversionRate}%`;
                  break;
                case 'Duration':
                  label = item.range;
                  value = `${item.count} (${item.percentage}%)`;
                  break;
                case 'Progress':
                  label = item.stage;
                  value = `${item.count} (${item.percentage}%)`;
                  break;
                case 'Products':
                  label = item.product;
                  value = `$${(item.totalValue/1000).toFixed(0)}K`;
                  break;
                default:
                  label = item.month || item.range || item.stage || item.product || 'N/A';
                  value = item.totalValue ? `$${(item.totalValue/1000).toFixed(0)}K` : (item.count || '0');
              }
              
              return (
                <div key={index} className="d-flex align-items-center mb-2">
                  <div 
                    className="rounded me-2" 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: colors[index % colors.length] 
                    }}
                  ></div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="small">{label}</span>
                      <span className="small fw-bold">{value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderChartData = (data: any[], reportName: string) => {
    if (!data.length) return <p className="text-muted">No data available</p>;
    
    switch (reportName) {
      case 'Deal Performance Report':
        return (
          <div className="row">
            {data.slice(-6).map((item, index) => (
              <div key={index} className="col-md-4 mb-2">
                <div className="card border-0 bg-white">
                  <div className="card-body p-2 text-center">
                    <small className="text-muted">{item.month}</small>
                    <div className="d-flex justify-content-around mt-1">
                      <span className="badge text-white" style={{ backgroundColor: '#28a745' }}>
                        <span className="me-1">✓</span>{item.won} Won
                      </span>
                      <span className="badge text-white" style={{ backgroundColor: '#f4a261' }}>
                        <span className="me-1">✗</span>{item.lost} Lost
                      </span>
                      <span className="badge text-dark" style={{ backgroundColor: '#ADD8E6' }}>
                        <span className="me-1">○</span>{item.open} Open
                      </span>
                    </div>
                    <small className="text-primary">${(item.totalValue/1000).toFixed(0)}K</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'Deal Conversion Analysis':
        return (
          <div className="row">
            {data.slice(-6).map((item, index) => (
              <div key={index} className="col-md-4 mb-2">
                <div className="card border-0 bg-white">
                  <div className="card-body p-2 text-center">
                    <small className="text-muted">{item.month}</small>
                    <h6 className="text-success mb-1">{item.conversionRate}%</h6>
                    <small className="text-muted">{item.wonDeals}/{item.totalDeals}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'Deal Duration Tracking':
        return (
          <div className="row">
            {data.map((item, index) => (
              <div key={index} className="col-md-6 mb-2">
                <div className="card border-0 bg-white">
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">{item.range}</small>
                      <span className="badge bg-primary">{item.count}</span>
                    </div>
                    <small className="text-success">{item.percentage}%</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'Deal Progress Overview':
        return (
          <div className="row">
            {data.map((item, index) => (
              <div key={index} className="col-md-6 mb-2">
                <div className="card border-0 bg-white">
                  <div className="card-body p-2">
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">{item.stage}</small>
                      <span className="badge bg-info">{item.count}</span>
                    </div>
                    <small className="text-primary">{item.percentage}%</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'Deal Products Analysis':
        return (
          <div className="row">
            {data.map((item, index) => (
              <div key={index} className="col-md-6 mb-2">
                <div className="card border-0 bg-white">
                  <div className="card-body p-2">
                    <small className="text-muted fw-bold">{item.product}</small>
                    <div className="d-flex justify-content-between mt-1">
                      <small>Deals: {item.totalDeals}</small>
                      <small className="text-success">Win: {item.winRate}%</small>
                    </div>
                    <small className="text-primary">${(item.avgValue/1000).toFixed(0)}K avg</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="text-muted">No data visualization available</p>;
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const renderScoreCard = (data: any[], reportName: string) => {
    const getScoreCardMetrics = () => {
      switch (reportName) {
        case 'Deal Performance Report':
          const totalDeals = data.reduce((sum, item) => sum + item.total, 0);
          const totalValue = data.reduce((sum, item) => sum + item.totalValue, 0);
          const wonDeals = data.reduce((sum, item) => sum + item.won, 0);
          return [
            { title: 'Total Deals', value: totalDeals, color: 'primary', icon: 'bi-graph-up' },
            { title: 'Total Value', value: `$${totalValue.toLocaleString()}`, color: 'success', icon: 'bi-currency-dollar' },
            { title: 'Won Deals', value: wonDeals, color: 'info', icon: 'bi-trophy' },
            { title: 'Win Rate', value: `${((wonDeals/totalDeals)*100).toFixed(1)}%`, color: 'warning', icon: 'bi-percent' }
          ];
        case 'Deal Conversion Analysis':
          const avgConversion = data.reduce((sum, item) => sum + parseFloat(item.conversionRate), 0) / data.length;
          const totalClosedDeals = data.reduce((sum, item) => sum + item.totalDeals, 0);
          return [
            { title: 'Avg Conversion', value: `${avgConversion.toFixed(1)}%`, color: 'success', icon: 'bi-arrow-up-circle' },
            { title: 'Total Closed', value: totalClosedDeals, color: 'primary', icon: 'bi-check-circle' }
          ];
        case 'Deal Duration Tracking':
          const fastDeals = data.find(item => item.range === '0-30 days')?.count || 0;
          return [
            { title: 'Fast Deals (0-30d)', value: fastDeals, color: 'success', icon: 'bi-lightning' },
            { title: 'Total Analyzed', value: data.reduce((sum, item) => sum + item.count, 0), color: 'info', icon: 'bi-clock' }
          ];
        case 'Deal Progress Overview':
          return data.map(item => ({
            title: item.stage,
            value: item.count,
            color: 'primary',
            icon: 'bi-kanban'
          }));
        case 'Deal Products Analysis':
          const topProduct = data.sort((a, b) => b.totalValue - a.totalValue)[0];
          return [
            { title: 'Top Product', value: topProduct?.product || 'N/A', color: 'success', icon: 'bi-star' },
            { title: 'Top Value', value: `$${topProduct?.totalValue.toLocaleString() || 0}`, color: 'warning', icon: 'bi-gem' }
          ];
        default:
          return [];
      }
    };

    const metrics = getScoreCardMetrics();
    return (
      <div className="row g-3">
        {metrics.map((metric, index) => (
          <div key={index} className="col-md-3">
            <div className={`card border-${metric.color} h-100`}>
              <div className="card-body text-center">
                <i className={`bi ${metric.icon} fs-1 text-${metric.color} mb-2`}></i>
                <h6 className="card-title text-muted">{metric.title}</h6>
                <h4 className={`text-${metric.color} mb-0`}>{metric.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDataGrid = (data: any[], reportName: string) => {
    if (!data.length) return <p className="text-muted">No data available</p>;
    
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);
    
    const getTableHeaders = () => {
      switch (reportName) {
        case 'Deal Performance Report':
          return ['Month', 'Won', 'Lost', 'Open', 'Qualified', 'Proposal', 'Negotiation', 'Total Value'];
        case 'Deal Conversion Analysis':
          return ['Month', 'Total Deals', 'Won Deals', 'Conversion Rate'];
        case 'Deal Duration Tracking':
          return ['Duration Range', 'Count', 'Percentage'];
        case 'Deal Progress Overview':
          return ['Stage', 'Count', 'Percentage'];
        case 'Deal Products Analysis':
          return ['Product', 'Total Deals', 'Won Deals', 'Win Rate', 'Avg Value', 'Total Value'];
        default:
          return ['Data'];
      }
    };
    
    const getTableRows = () => {
      switch (reportName) {
        case 'Deal Performance Report':
          return paginatedData.map((item, index) => (
            <tr key={index}>
              <td>{item.month}</td>
              <td><span className="badge text-white" style={{ backgroundColor: '#28a745' }}><span className="me-1">✓</span>{item.won}</span></td>
              <td><span className="badge text-white" style={{ backgroundColor: '#f4a261' }}><span className="me-1">✗</span>{item.lost}</span></td>
              <td><span className="badge text-dark" style={{ backgroundColor: '#ADD8E6' }}><span className="me-1">○</span>{item.open}</span></td>
              <td><span className="badge bg-info">{item.qualified}</span></td>
              <td><span className="badge bg-secondary">{item.proposal}</span></td>
              <td><span className="badge bg-primary">{item.negotiation}</span></td>
              <td className="text-success fw-bold">${item.totalValue.toLocaleString()}</td>
            </tr>
          ));
        case 'Deal Conversion Analysis':
          return paginatedData.map((item, index) => (
            <tr key={index}>
              <td>{item.month}</td>
              <td>{item.totalDeals}</td>
              <td className="text-success">{item.wonDeals}</td>
              <td><span className="badge bg-success">{item.conversionRate}%</span></td>
            </tr>
          ));
        case 'Deal Duration Tracking':
          return paginatedData.map((item, index) => (
            <tr key={index}>
              <td>{item.range}</td>
              <td><span className="badge bg-primary">{item.count}</span></td>
              <td>{item.percentage}%</td>
            </tr>
          ));
        case 'Deal Progress Overview':
          return paginatedData.map((item, index) => (
            <tr key={index}>
              <td>{item.stage}</td>
              <td><span className="badge bg-info">{item.count}</span></td>
              <td>{item.percentage}%</td>
            </tr>
          ));
        case 'Deal Products Analysis':
          return paginatedData.map((item, index) => (
            <tr key={index}>
              <td className="fw-bold">{item.product}</td>
              <td>{item.totalDeals}</td>
              <td className="text-success">{item.wonDeals}</td>
              <td><span className="badge bg-success">{item.winRate}%</span></td>
              <td className="text-primary">${item.avgValue.toLocaleString()}</td>
              <td className="text-success fw-bold">${item.totalValue.toLocaleString()}</td>
            </tr>
          ));
        default:
          return <tr><td>No data</td></tr>;
      }
    };
    
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Show</span>
            <Form.Select 
              size="sm" 
              style={{ width: '80px' }} 
              value={pageSize} 
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
            <span className="text-muted">entries</span>
          </div>
          <div className="text-muted">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                {getTableHeaders().map((header, index) => (
                  <th key={index} scope="col">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getTableRows()}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <nav>
              <ul className="pagination pagination-sm">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="report-view" style={{ padding: "20px", position: 'relative' }}>
      {/* Loading Overlay */}
      {isLoadingReportData && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          flexDirection: 'column'
        }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 text-primary fw-bold">Loading report data...</div>
        </div>
      )}
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ 
        minHeight: '48px',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1,
        paddingTop: '20px',
        paddingBottom: '10px',
        marginTop: '-20px',
        borderBottom: '1px solid #e4cb9a'
      }}>
        <div className="d-flex align-items-center">
          <h4 className="mb-0" style={{ 
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '24px'
          }}>
            {reportName || `${reportType} Report`}
          </h4>
        </div>
        <div className="d-flex gap-2">
          {!reportSaved || hasChanges ? (
            <>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  if (hasChanges) {
                    // Reset to original filters and name
                    setAppliedFilters(savedFilters);
                    setReportName(originalReportName);
                    setHasChanges(false);
                  } else {
                    setShowCancelModal(true);
                  }
                }}
                title={hasChanges ? "Discard unsaved changes" : "Cancel and go back"}
              >
                {hasChanges ? 'Discard Changes' : 'Cancel'}
              </Button>
              {!reportSaved && (
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  disabled={isSaving}
                  onClick={async () => {
                    // Validate all fields
                    const isValid = await validateFilters();
                    
                    if (!isValid) {
                      setFiltersExpanded(true);
                      return;
                    }
                    
                    setIsSaving(true);
                    try {
                      // Include newCondition if it's complete
                      let conditionsToPreview = [...appliedFilters];
                      if (newCondition.field && newCondition.operator && newCondition.value) {
                        conditionsToPreview.push({
                          id: Date.now().toString(),
                          entity: newCondition.entity,
                          field: newCondition.field,
                          operator: newCondition.operator,
                          value: newCondition.value,
                          displayText: `${newCondition.field} ${newCondition.operator} ${newCondition.value}`
                        });
                      }
                      
                      // Save preview report
                      const savedReportId = await savePreviewReport(conditionsToPreview);
                      
                      // Fetch report details if preview report was created
                      if (savedReportId) {
                        await fetchReportDetails(savedReportId);
                        toast.success('Preview updated!');
                      } else {
                        toast.warning('Failed to create preview report. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error previewing report:', error);
                      toast.error('Failed to preview report');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  title="Preview report with current filters"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#0d6efd',
                    color: '#0d6efd'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d6efd';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0d6efd';
                  }}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSearch} className="me-1" />
                      Preview
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="primary" 
                size="sm"
                disabled={isSaving}
                onClick={async () => {
                  // Validate all fields
                  const isValid = await validateFilters();
                  
                  if (!isValid) {
                    setFiltersExpanded(true);
                    return;
                  }
                  
                  setIsSaving(true);
                  
                  // Include newCondition if it's complete
                  let conditionsToSave = [...appliedFilters];
                  if (newCondition.field && newCondition.operator && newCondition.value) {
                    conditionsToSave.push({
                      id: Date.now().toString(),
                      entity: newCondition.entity,
                      field: newCondition.field,
                      operator: newCondition.operator,
                      value: newCondition.value,
                      displayText: `${newCondition.field} ${newCondition.operator} ${newCondition.value}`
                    });
                  }
                  
                  const fullReportName = `${detectedEntity} ${reportName.trim()}`;
                  
                  // Check for duplicate report name (only for new reports or if name changed)
                  if (!reportDefinition?.id || fullReportName !== reportDefinition.name) {
                    const isDuplicate = existingReports.some(report => 
                      report.name.toLowerCase() === fullReportName.toLowerCase() && 
                      report.id !== (reportDefinition?.id || previewReportId)
                    );
                    
                    if (isDuplicate) {
                      toast.error(`A report with the name "${fullReportName}" already exists. Please choose a different name.`);
                      setIsSaving(false);
                      return;
                    }
                  }
                  
                  const reportRequest = new CreateReportRequest();
                  reportRequest.createdDate = new Date();
                  reportRequest.createdBy = 0;
                  reportRequest.modifiedBy = 0;
                  reportRequest.modifiedDate = new Date();
                  reportRequest.updatedBy = 0;
                  reportRequest.updatedDate = new Date();
                  reportRequest.userId = 0;
                  reportRequest.id = reportDefinition?.id || previewReportId || 0;
                  reportRequest.name = fullReportName;
                  reportRequest.chartType = chartType;
                  reportRequest.frequency = frequency;
                  reportRequest.isPreview = false;
                  reportRequest.isActive = true;
                  reportRequest.isPublic = true;
                  reportRequest.reportConditions = conditionsToSave.map(filter => ({
                    id: 0,
                    reportDefinitionId: reportDefinition?.id || previewReportId || 0,
                    field: filter.field,
                    operator: filter.operator,
                    value: filter.value,
                    extraValue: ''
                  }));
                  
                  try {
                    const reportService = new ReportService(null);
                    let savedReport;
                    let currentReportId = reportDefinition?.id || previewReportId;
                    
                    if (currentReportId) {
                      // Use PUT for existing report
                      savedReport = await reportService.updateReport(currentReportId, reportRequest);
                    } else {
                      // Use POST for new report
                      savedReport = await reportService.saveReport(reportRequest);
                      if (savedReport?.id || savedReport?.result?.id) {
                        const reportId = savedReport.id || savedReport.result.id;
                        setPreviewReportId(reportId);
                        setReportCreated(true);
                        currentReportId = reportId;
                      }
                    }
                    
                    // Fetch report details after saving
                    if (currentReportId) {
                      await fetchReportDetails(currentReportId);
                    }
                    
                    // Notify parent to update sidebar with saved report
                    if (onSave) {
                      // Pass the saved report with proper structure
                      const reportToSave = {
                        id: currentReportId,
                        name: fullReportName,
                        entity: entity,
                        type: reportType,
                        chartType: chartType,
                        frequency: frequency,
                        reportConditions: conditionsToSave,
                        ...savedReport
                      };
                      onSave(reportToSave);
                    }
                    
                    // Conditions are already in appliedFilters, no need to add again
                    setSavedFilters(conditionsToSave);
                    setOriginalReportName(fullReportName);
                    setNewCondition({ entity: 'Deal', field: '', operator: '', value: '' });
                    setReportSaved(true);
                    setReportCreated(true);
                    setHasChanges(false);
                    setShowAddCondition(false);
                    toast.success(hasChanges ? "Report updated successfully!" : "Report created successfully!");
                  } catch (error) {
                    console.error('Error saving report:', error);
                    toast.error('Failed to save report. Please try again.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                title={hasChanges ? "Save changes to report" : "Save new report"}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-1" />
                    Save Report
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  if (reportDefinition?.id) {
                    fetchReportDetails(reportDefinition.id);
                    toast.success('Report data refreshed!');
                  }
                }}
                className="d-flex align-items-center"
                style={{ 
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
                title="Refresh report data"
              >
                <FontAwesomeIcon icon={faRedo} className="me-2" style={{ fontSize: '12px' }} />
                Refresh
              </Button>
              
              <Dropdown show={showAddToDashboard} onToggle={setShowAddToDashboard}>
                <Dropdown.Toggle 
                  variant="outline-primary" 
                  size="sm"
                  className="d-flex align-items-center"
                  style={{ 
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d6efd';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0d6efd';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                >
                  <FontAwesomeIcon icon={faTachometerAlt} className="me-2" style={{ fontSize: '12px' }} />
                  Add to Dashboard
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: '300px', padding: '10px' }}>
                  <div className="mb-2">
                    <div style={{ position: 'relative' }}>
                      <FontAwesomeIcon 
                        icon={faSearch} 
                        style={{ 
                          position: 'absolute', 
                          left: '8px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          fontSize: '12px'
                        }} 
                      />
                      <Form.Control
                        type="text"
                        placeholder="Search dashboards..."
                        value={dashboardSearch}
                        onChange={(e) => setDashboardSearch(e.target.value)}
                        style={{ paddingLeft: '30px', fontSize: '12px' }}
                        size="sm"
                      />
                    </div>
                  </div>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {existingDashboards
                      .filter(dashboard => 
                        dashboard.name.toLowerCase().includes(dashboardSearch.toLowerCase())
                      )
                      .map(dashboard => {
                        const reportIds = dashboard.reports ? dashboard.reports.split(',').map((id:any) => parseInt(id.trim())) : [];
                        const isReportInDashboard = reportIds.includes(reportDefinition?.id || 0);
                        
                        return (
                          <Dropdown.Item 
                            key={dashboard.id}
onClick={async () => {
                              if (!isReportInDashboard && reportDefinition?.id) {
                                try {
                                  const dashboardService = new ReportDashboardService(null);
                                  const result = await dashboardService.addReportToDashboard(
                                    dashboard.id,
                                    reportDefinition.id,
                                    dashboard.reports || '',
                                    dashboard.folderId,
                                    dashboard.name,
                                    Util.UserProfile()?.userId || 0
                                  );
                                  
                                  if (result) {
                                    // Update local state
                                    const updatedDashboards = existingDashboards.map(d => 
                                      d.id === dashboard.id 
                                        ? { ...d, reports: result.reports }
                                        : d
                                    );
                                    
                                    setExistingDashboards(updatedDashboards);
                                    
                                    if (onDashboardUpdate) {
                                      onDashboardUpdate(updatedDashboards);
                                    }
                                    
                                    toast.success(`Report added to "${dashboard.name}" dashboard!`);
                                  } else {
                                    toast.error('Failed to add report to dashboard');
                                  }
                                } catch (error) {
                                  console.error('Error adding report to dashboard:', error);
                                  toast.error('Failed to add report to dashboard');
                                }
                              } else {
                                toast.info(`Report is already in "${dashboard.name}" dashboard`);
                              }
                              setShowAddToDashboard(false);
                            }}
                            className={isReportInDashboard ? 'text-muted' : ''}
                          >
                            <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                            {dashboard.name}
                            {isReportInDashboard && (
                              <small className="ms-2 text-success">(Added)</small>
                            )}
                          </Dropdown.Item>
                        );
                      })
                    }
                    
                    {existingDashboards.filter(dashboard => 
                      dashboard.name.toLowerCase().includes(dashboardSearch.toLowerCase())
                    ).length === 0 && dashboardSearch && (
                      <div className="text-muted text-center py-2" style={{ fontSize: '12px' }}>
                        No dashboards found
                      </div>
                    )}
                  </div>
                  
                  <Dropdown.Divider />
                  
                  <Dropdown.Item 
                    onClick={() => {
                      setShowAddToDashboard(false);
                      setShowCreateDashboard(true);
                      setDashboardName('');
                      setSelectedFolder('');
                      setDashboardNameError('');
                    }}
                    className="text-primary"
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Create New Dashboard
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Dropdown>
                <Dropdown.Toggle 
                  variant="outline-secondary" 
                  size="sm"
                  className="d-flex align-items-center justify-content-center"
                  style={{ 
                    borderRadius: '6px',
                    padding: '6px 8px',
                    minWidth: '32px',
                    height: '32px'
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisV} style={{ fontSize: '14px' }} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={async () => {
                    if (reportDefinition?.id) {
                      try {
                        const reportService = new ReportService(null);
                        
                        // Create a new report request with cloned data
                        const cloneRequest = new CreateReportRequest();
                        cloneRequest.createdDate = new Date();
                        cloneRequest.createdBy = 0;
                        cloneRequest.modifiedBy = 0;
                        cloneRequest.modifiedDate = new Date();
                        cloneRequest.updatedBy = 0;
                        cloneRequest.updatedDate = new Date();
                        cloneRequest.userId = 0;
                        cloneRequest.id = 0; // New report, so ID is 0
                        cloneRequest.name = `${reportName} Clone`;
                        cloneRequest.chartType = chartType;
                        cloneRequest.frequency = frequency;
                        cloneRequest.isPreview = false;
                        cloneRequest.isActive = true;
                        cloneRequest.isPublic = true;
                        cloneRequest.reportConditions = appliedFilters.map(filter => ({
                          id: 0,
                          reportDefinitionId: 0,
                          field: filter.field,
                          operator: filter.operator,
                          value: filter.value,
                          extraValue: ''
                        }));
                        
                        const clonedReport = await reportService.saveReport(cloneRequest);
                        
                        if (clonedReport) {
                          if (onSave) {
                            onSave(clonedReport);
                          }
                          toast.success(`Report cloned successfully as "${cloneRequest.name}"!`);
                        } else {
                          toast.error('Failed to clone report');
                        }
                      } catch (error) {
                        console.error('Error cloning report:', error);
                        toast.error('Failed to clone report. Please try again.');
                      }
                    }
                  }} title="Create a copy of this report">
                    <FontAwesomeIcon icon={faCopy} className="me-2" />
                    Duplicate Report
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowDeleteModal(true)} className="text-danger" title="Delete this report permanently">
                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                    Delete Report
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </div>
      </div>

      {/* Report Name Section */}
      <div className="mb-4">
        <div className="row">
          <div className="col-md-3">
            <label className="form-label fw-bold">Entity Type</label>
            <Form.Control
              type="text"
              value={detectedEntity}
              disabled
              style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
            />
          </div>
          <div className="col-md-9">
            <label className="form-label fw-bold">Report Name</label>
            <Controller
              name="reportName"
              control={control}
              rules={{ required: 'Report name is required' }}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  type="text"
                  placeholder="Enter report name"
                  isInvalid={!!errors.reportName}
                  onChange={(e) => {
                    field.onChange(e);
                    setReportName(e.target.value);
                  }}
                />
              )}
            />
            {errors.reportName && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.reportName.message}
              </Form.Control.Feedback>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div
        className="filters-section mb-4"
        style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e4cb9a",
        }}
      >
        <div
          style={{
            padding: "15px",
            cursor: "pointer",
            borderBottom: filtersExpanded ? "1px solid #e4cb9a" : "none",
          }}
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="me-2" />
              <span className="fw-bold">Filters ({appliedFilters.length})</span>
            </div>
            <FontAwesomeIcon
              icon={filtersExpanded ? faChevronUp : faChevronDown}
            />
          </div>
        </div>

        {filtersExpanded && (
          <div style={{ padding: "15px" }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "15px",
              }}
            >
              {appliedFilters.map((filter, index) => (
                <div
                  key={filter.id}
                  className={index > 0 ? "mt-3 pt-3" : ""}
                  style={{
                    borderTop: index > 0 ? "1px solid #e9ecef" : "none",
                  }}
                >
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label small">Field</label>
                      <Form.Select
                        size="sm"
                        value={filter.field}
                        style={filterErrors[filter.id]?.field ? { border: '2px solid #dc3545' } : {}}
                        onChange={(e) => {
                          const updatedFilters = appliedFilters.map((f) =>
                            f.id === filter.id
                              ? { ...f, field: e.target.value, value: '', displayText: `${e.target.value} ${f.operator} ` }
                              : f
                          );
                          setAppliedFilters(updatedFilters);
                          if (e.target.value && filterErrors[filter.id]?.field) {
                            const newErrors = {...filterErrors};
                            delete newErrors[filter.id]?.field;
                            if (Object.keys(newErrors[filter.id] || {}).length === 0) {
                              delete newErrors[filter.id];
                            }
                            setFilterErrors(newErrors);
                            if (Object.keys(newErrors).length === 0 && !errors.field && !errors.operator && !errors.value) {
                              setShowValidationSummary(false);
                            }
                          }
                        }}
                      >
                        <option value="">Select field</option>
                        {getFieldOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Operator</label>
                      <Form.Select
                        size="sm"
                        value={filter.operator}
                        style={filterErrors[filter.id]?.operator ? { border: '2px solid #dc3545' } : {}}
                        onChange={(e) => {
                          const updatedFilters = appliedFilters.map((f) =>
                            f.id === filter.id
                              ? { ...f, operator: e.target.value, displayText: `${f.field} ${e.target.value} ${f.value}` }
                              : f
                          );
                          setAppliedFilters(updatedFilters);
                          if (e.target.value && filterErrors[filter.id]?.operator) {
                            const newErrors = {...filterErrors};
                            delete newErrors[filter.id]?.operator;
                            if (Object.keys(newErrors[filter.id] || {}).length === 0) {
                              delete newErrors[filter.id];
                            }
                            setFilterErrors(newErrors);
                            if (Object.keys(newErrors).length === 0 && !errors.field && !errors.operator && !errors.value) {
                              setShowValidationSummary(false);
                            }
                          }
                        }}
                      >
                        <option value="">Select</option>
                        {getOperatorOptions(filter.field).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small">Value</label>
                      {['statusid', '8', 'AssigntoId', 'stageid', '7', '1'].includes(filter.field) || fieldOptions.find(f => f.value === filter.field)?.isDateType ? (
                        <Form.Select
                          size="sm"
                          value={filter.value}
                          style={filterErrors[filter.id]?.value ? { border: '2px solid #dc3545' } : {}}
                          onChange={(e) => {
                            const updatedFilters = appliedFilters.map((f) =>
                              f.id === filter.id
                                ? { ...f, value: e.target.value, displayText: `${f.field} ${f.operator} ${e.target.value}` }
                                : f
                            );
                            setAppliedFilters(updatedFilters);
                            if (e.target.value && filterErrors[filter.id]?.value) {
                              const newErrors = {...filterErrors};
                              delete newErrors[filter.id]?.value;
                              if (Object.keys(newErrors[filter.id] || {}).length === 0) {
                                delete newErrors[filter.id];
                              }
                              setFilterErrors(newErrors);
                              if (Object.keys(newErrors).length === 0 && !errors.field && !errors.operator && !errors.value) {
                                setShowValidationSummary(false);
                              }
                            }
                          }}
                        >
                          <option value="">Select value</option>
                          {getValueOptions(filter.field).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      ) : fieldOptions.find(f => f.value === filter.field)?.isNumberType ? (
                        <Form.Control
                          size="sm"
                          type="number"
                          value={filter.value}
                          style={filterErrors[filter.id]?.value ? { border: '2px solid #dc3545' } : {}}
                          onChange={(e) => {
                            const updatedFilters = appliedFilters.map((f) =>
                              f.id === filter.id
                                ? { ...f, value: e.target.value, displayText: `${f.field} ${f.operator} ${e.target.value}` }
                                : f
                            );
                            setAppliedFilters(updatedFilters);
                            if (e.target.value && filterErrors[filter.id]?.value) {
                              const newErrors = {...filterErrors};
                              delete newErrors[filter.id]?.value;
                              if (Object.keys(newErrors[filter.id] || {}).length === 0) {
                                delete newErrors[filter.id];
                              }
                              setFilterErrors(newErrors);
                              if (Object.keys(newErrors).length === 0 && !errors.field && !errors.operator && !errors.value) {
                                setShowValidationSummary(false);
                              }
                            }
                          }}
                          placeholder="Enter number"
                        />
                      ) : (
                        <Form.Control
                          size="sm"
                          type="text"
                          value={filter.value}
                          style={filterErrors[filter.id]?.value ? { border: '2px solid #dc3545' } : {}}
                          onChange={(e) => {
                            const updatedFilters = appliedFilters.map((f) =>
                              f.id === filter.id
                                ? { ...f, value: e.target.value, displayText: `${f.field} ${f.operator} ${e.target.value}` }
                                : f
                            );
                            setAppliedFilters(updatedFilters);
                            if (e.target.value && filterErrors[filter.id]?.value) {
                              const newErrors = {...filterErrors};
                              delete newErrors[filter.id]?.value;
                              if (Object.keys(newErrors[filter.id] || {}).length === 0) {
                                delete newErrors[filter.id];
                              }
                              setFilterErrors(newErrors);
                              if (Object.keys(newErrors).length === 0 && !errors.field && !errors.operator && !errors.value) {
                                setShowValidationSummary(false);
                              }
                            }
                          }}
                          placeholder="Enter value"
                        />
                      )}
                    </div>
                    <div className="col-md-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                        title="Remove this condition"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show new condition row only if no applied filters OR if showAddCondition is true */}
              {(appliedFilters.length === 0 || showAddCondition) && (
                <div className={appliedFilters.length > 0 ? "mt-3" : ""}>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Field</label>
                      <Controller
                        name="field"
                        control={control}
                        rules={{ required: (appliedFilters.length === 0 || showAddCondition) ? 'Field is required' : false }}
                        render={({ field }) => (
                          <div>
                            <Form.Select
                              {...field}
                              size="sm"
                              style={errors.field ? { border: '2px solid #dc3545' } : {}}
                              onChange={(e) => {
                                field.onChange(e);
                                setNewCondition({
                                  ...newCondition,
                                  field: e.target.value,
                                  value: ''
                                });
                                if (e.target.value) {
                                  trigger('field');
                                }
                              }}
                            >
                              <option value="">Select field</option>
                              {getFieldOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        )}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-bold">
                        Operator
                      </label>
                      <Controller
                        name="operator"
                        control={control}
                        rules={{ required: (appliedFilters.length === 0 || showAddCondition) ? 'Operator is required' : false }}
                        render={({ field }) => (
                          <div>
                            <Form.Select
                              {...field}
                              size="sm"
                              style={errors.operator ? { border: '2px solid #dc3545' } : {}}
                              onChange={(e) => {
                                field.onChange(e);
                                setNewCondition({
                                  ...newCondition,
                                  operator: e.target.value,
                                });
                                if (e.target.value) {
                                  trigger('operator');
                                }
                              }}
                            >
                              <option value="">Select</option>
                              {getOperatorOptions(newCondition.field).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        )}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Value</label>
                      <Controller
                        name="value"
                        control={control}
                        rules={{ required: (appliedFilters.length === 0 || showAddCondition) ? 'Value is required' : false }}
                        render={({ field }) => (
                          <div>
                            {['statusid', '8', 'AssigntoId', 'stageid', '7', '1'].includes(newCondition.field) || fieldOptions.find(f => f.value === newCondition.field)?.isDateType ? (
                              <Form.Select
                                {...field}
                                size="sm"
                                style={errors.value ? { border: '2px solid #dc3545' } : {}}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setNewCondition({
                                    ...newCondition,
                                    value: e.target.value,
                                  });
                                  if (e.target.value) {
                                    trigger('value');
                                  }
                                }}
                              >
                                <option value="">Select value</option>
                                {getValueOptions(newCondition.field).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Form.Select>
                            ) : fieldOptions.find(f => f.value === newCondition.field)?.isNumberType ? (
                              <Form.Control
                                {...field}
                                size="sm"
                                type="number"
                                placeholder="Enter number"
                                style={errors.value ? { border: '2px solid #dc3545' } : {}}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setNewCondition({
                                    ...newCondition,
                                    value: e.target.value,
                                  });
                                  if (e.target.value) {
                                    trigger('value');
                                  }
                                }}
                              />
                            ) : (
                              <Form.Control
                                {...field}
                                size="sm"
                                type="text"
                                placeholder="Enter value"
                                style={errors.value ? { border: '2px solid #dc3545' } : {}}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setNewCondition({
                                    ...newCondition,
                                    value: e.target.value,
                                  });
                                  if (e.target.value) {
                                    trigger('value');
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-bold" style={{ visibility: 'hidden' }}>Action</label>
                      <div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setNewCondition({ entity: 'Deal', field: '', operator: '', value: '' });
                            setFormValue('field', '');
                            setFormValue('operator', '');
                            setFormValue('value', '');
                            clearErrors(['field', 'operator', 'value']);
                            setShowAddCondition(false);
                          }}
                          title="Remove this condition"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validation Error Row - Show at bottom */}
              {showValidationSummary && (
                <div className="row g-2 mt-2">
                  <div className="col-md-3">
                    {(Object.values(filterErrors).some(e => e.field) || errors.field) && (
                      <small className="text-danger">Field is required</small>
                    )}
                  </div>
                  <div className="col-md-2">
                    {(Object.values(filterErrors).some(e => e.operator) || errors.operator) && (
                      <small className="text-danger">Operator is required</small>
                    )}
                  </div>
                  <div className="col-md-3">
                    {(Object.values(filterErrors).some(e => e.value) || errors.value) && (
                      <small className="text-danger">Value is required</small>
                    )}
                  </div>
                  <div className="col-md-2"></div>
                </div>
              )}
              
              {/* Add Condition Button - always show at bottom */}
              <div className="mt-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  style={{ transition: 'all 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d6efd';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0d6efd';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                  onClick={() => {
                    if (newCondition.field && newCondition.operator && newCondition.value) {
                      handleAddConditionClick();
                    }
                    if (!showAddCondition) {
                      setShowAddCondition(true);
                      clearErrors(['field', 'operator', 'value']);
                    }
                  }}
                  title="Add a new filter condition"
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Add Condition
                </Button>
              </div>




            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div
        className="chart-section mb-4"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e4cb9a",
        }}
      >
        <div
          style={{
            padding: "15px",
            cursor: "pointer",
            borderBottom: chartExpanded ? "1px solid #e4cb9a" : "none",
          }}
          onClick={() => setChartExpanded(!chartExpanded)}
        >
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0">Chart</h6>
            <FontAwesomeIcon
              icon={chartExpanded ? faChevronUp : faChevronDown}
            />
          </div>
        </div>

        {chartExpanded && (
          <div style={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-3">
                <div className="d-flex gap-1">
                  <Button
                    variant={
                      chartType === "column" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setChartType("column")}
                    title="Column Chart"
                  >
                    <FontAwesomeIcon icon={faChartBar} />
                  </Button>
                  <Button
                    variant={
                      chartType === "bar" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setChartType("bar")}
                    title="Bar Chart"
                  >
                    <FontAwesomeIcon
                      icon={faChartLine}
                      style={{ transform: "rotate(90deg)" }}
                    />
                  </Button>
                  <Button
                    variant={
                      chartType === "pie" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setChartType("pie")}
                    title="Pie Chart"
                  >
                    ⭕
                  </Button>
                  <Button
                    variant={
                      chartType === "scorecard"
                        ? "primary"
                        : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setChartType("scorecard")}
                    title="Score Card"
                  >
                    📊
                  </Button>
                  <Button
                    variant={
                      chartType === "table" ? "primary" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setChartType("table")}
                    title="Table"
                  >
                    <FontAwesomeIcon icon={faTable} />
                  </Button>
                </div>

                <Form.Select
                  size="sm"
                  style={{ width: "120px" }}
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </Form.Select>
              </div>

              <Dropdown>
                <Dropdown.Toggle 
                  variant="outline-primary" 
                  size="sm"
                  style={{ transition: 'all 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d6efd';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0d6efd';
                    e.currentTarget.style.borderColor = '#0d6efd';
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  Export
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>Export as CSV</Dropdown.Item>
                  <Dropdown.Item>Export as PDF</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            <div key={JSON.stringify(appliedFilters) + JSON.stringify(newCondition)}>
              {renderChart()}
            </div>
          </div>
        )}
      </div>

      {/* Data Table Section */}
      <div
        className="table-section"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          border: "1px solid #e4cb9a",
        }}
      >
        <div
          style={{
            padding: "15px",
            cursor: "pointer",
            borderBottom: tableExpanded ? "1px solid #e4cb9a" : "none",
          }}
          onClick={() => setTableExpanded(!tableExpanded)}
        >
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0">Data Table</h6>
            <FontAwesomeIcon
              icon={tableExpanded ? faChevronUp : faChevronDown}
            />
          </div>
        </div>

        {tableExpanded && (
          <div className="p-3">
            {isLoadingReportData ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-2">Loading report data...</div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <small className="text-muted">Showing {getFilteredData().length} deals</small>
                </div>
                <div style={{ height: 500, width: "100%" }} key={JSON.stringify(appliedFilters) + JSON.stringify(newCondition)}>
                  <DataGrid
                  rows={getFilteredData().map((deal, index) => ({
                    id: deal.dealID || deal.id || index,
                    title: deal.title || `${deal.personName || 'Unknown'} - ${deal.name || 'Unknown'}`,
                    value: parseFloat(deal.value) || 0,
                    pipeline: deal.pipelineName || deal.pipeline || 'Unknown',
                    owner: deal.ownerName || deal.owner || 'Unknown',
                    status: deal.statusID === 2 ? 'Won' : deal.statusID === 3 ? 'Lost' : 'Open',
                    addTime: deal.createdDate || deal.addTime || '',
                    closeTime: deal.expectedCloseDate || deal.closeTime || '',
                  }))}
                columns={[
                  { field: "title", headerName: "Title", width: 250 },
                  {
                    field: "value",
                    headerName: "Deal Value",
                    width: 150,
                    renderCell: (params) => (
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        ${params.value.toLocaleString()}
                      </span>
                    ),
                  },
                  { field: "pipeline", headerName: "Pipeline", width: 120 },
                  { field: "owner", headerName: "Owner", width: 150 },
                  {
                    field: "status",
                    headerName: "Status",
                    width: 120,
                    renderCell: (params) => (
                      <Badge
                        style={{
                          backgroundColor:
                            params.value === "Won"
                              ? "#28a745"
                              : params.value === "Lost"
                              ? "#f4a261"
                              : "#ADD8E6",
                          color:
                            params.value === "Won" || params.value === "Lost"
                              ? "white"
                              : "black",
                        }}
                      >
                        {params.value === "Won"
                          ? "✓ Won"
                          : params.value === "Lost"
                          ? "✗ Lost"
                          : "○ Open"}
                      </Badge>
                    ),
                  },
                  { field: "addTime", headerName: "Deal Created On", width: 150 },
                  {
                    field: "closeTime",
                    headerName: "Expected Close Date",
                    width: 180,
                    renderCell: (params) => params.value || "TBD",
                  },
                ]}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                pagination
                paginationMode="client"
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-footerContainer': {
                    minHeight: 52,
                    display: 'flex !important',
                  },
                }}
                    />
                  </div>
                </>
              )}
          </div>
        )}
      </div>

      {/* Custom Tooltip */}
      {hoveredBar && (
        <div
          style={{
            position: "fixed",
            left: hoveredBar.x - 100,
            top: hoveredBar.y - 120,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            zIndex: 1000,
            minWidth: "200px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "13px",
            }}
          >
            {hoveredBar.data.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#28a745",
                  borderRadius: "50%",
                }}
              ></div>
              <span>Won: {hoveredBar.data.item.won || 0}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#f4a261",
                  borderRadius: "50%",
                }}
              ></div>
              <span>Lost: {hoveredBar.data.item.lost || 0}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#ADD8E6",
                  borderRadius: "50%",
                }}
              ></div>
              <span>Open: {hoveredBar.data.item.open || 0}</span>
            </div>
          </div>
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              Total: {hoveredBar.data.item.total || hoveredBar.data.value} deals
            </div>
            <div style={{ fontWeight: "bold" }}>
              Value: {hoveredBar.data.displayValue}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <DeleteDialog
          itemType="Report"
          itemName={reportName}
          dialogIsOpen={showDeleteModal}
          closeDialog={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            if (reportDefinition?.id) {
              try {
                const reportService = new ReportService(null);
                await reportService.deleteReport(reportDefinition.id);
                
                if (onDelete) {
                  onDelete(reportDefinition.id);
                }
                
                toast.success("Report deleted successfully!");
                setShowDeleteModal(false);
                // Don't call onBack() - let parent handle navigation
              } catch (error) {
                console.error('Error deleting report:', error);
                toast.error('Failed to delete report. Please try again.');
              }
            }
          }}
          customDeleteMessage={<div>Are you sure you want to delete <strong>{reportName}</strong>?</div>}
          isPromptOnly={false}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          actionType="Delete"
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelModal && (
        <DeleteDialog
          itemType="Report"
          itemName="new report"
          dialogIsOpen={showCancelModal}
          closeDialog={() => setShowCancelModal(false)}
          onConfirm={() => {
            setShowCancelModal(false);
            onBack();
          }}
          customDeleteMessage={<div>Are you sure you want to discard the new report?</div>}
          isPromptOnly={false}
          confirmLabel="Discard Report"
          cancelLabel="Keep Editing"
          actionType="Discard"
        />
      )}

      {/* Create Dashboard Dialog */}
      <AddEditDialog
        dialogIsOpen={showCreateDashboard}
        header="Create New Dashboard"
        dialogSize="lg"
        onSave={() => {
          if (!dashboardName.trim()) {
            setDashboardNameError('Dashboard name is required');
            return;
          }
          
          if (!selectedFolder) {
            toast.warning('Please select a folder for the dashboard');
            return;
          }
          
          const isDuplicate = existingDashboards.some(dashboard => 
            dashboard.name.toLowerCase() === dashboardName.trim().toLowerCase()
          );
          
          if (isDuplicate) {
            setDashboardNameError('Dashboard name already exists');
            return;
          }
          
          const selectedFolderObj = dashboardFolders.find(f => f.id.toString() === selectedFolder);
          
          const newDashboard = {
            id: Date.now(),
            name: dashboardName.trim(),
            folderId: selectedFolder,
            folderName: selectedFolderObj?.name || 'Unknown',
            createdDate: new Date().toLocaleDateString(),
            reports: []
          };
          
          const updatedDashboards = [...existingDashboards, newDashboard];
          setExistingDashboards(updatedDashboards);
          localStorage.setItem('createdDashboards', JSON.stringify(updatedDashboards));
          
          // Notify parent component about dashboard updates
          if (onDashboardUpdate) {
            onDashboardUpdate(updatedDashboards);
          }
          
          setShowCreateDashboard(false);
          setShowCreateFolder(false);
          setDashboardName('');
          setSelectedFolder('');
          setNewFolderName('');
          setDashboardNameError('');
          setFolderNameError('');
          
          toast.success(`Dashboard "${newDashboard.name}" created successfully in "${selectedFolderObj?.name}" folder!`);
        }}
        closeDialog={() => {
          setShowCreateDashboard(false);
          setShowCreateFolder(false);
          setDashboardName('');
          setSelectedFolder('');
          setNewFolderName('');
          setDashboardNameError('');
          setFolderNameError('');
        }}
        customSaveChangesButtonName="Create Dashboard"
      >
        <div className="mb-3">
          <Form.Label className="fw-bold">Dashboard Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter dashboard name"
            value={dashboardName}
            onChange={(e) => {
              setDashboardName(e.target.value);
              setDashboardNameError('');
            }}
            isInvalid={!!dashboardNameError}
          />
          {dashboardNameError && (
            <Form.Control.Feedback type="invalid">
              {dashboardNameError}
            </Form.Control.Feedback>
          )}
        </div>

        <div className="mb-3">
          <Form.Label className="fw-bold">Select Folder</Form.Label>
          <div className="d-flex gap-2">
            <Form.Select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-grow-1"
            >
              <option value="">Choose a folder...</option>
              {dashboardFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </Form.Select>
            <Button
              variant="outline-primary"
              onClick={() => {
                setShowCreateFolder(true);
                setNewFolderName('');
                setFolderNameError('');
              }}
              title="Create New Folder"
              style={{ transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0d6efd';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#0d6efd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#0d6efd';
                e.currentTarget.style.borderColor = '#0d6efd';
              }}
            >
              <FontAwesomeIcon icon={faFolder} className="me-1" />
              New Folder
            </Button>
          </div>
        </div>

        {showCreateFolder && (
          <div className="mb-3 p-3 border rounded bg-light">
            <Form.Label className="fw-bold small">New Folder Name</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  setFolderNameError('');
                }}
                isInvalid={!!folderNameError}
                size="sm"
              />
              <Button
                variant="success"
                size="sm"
                disabled={loadingFolders}
onClick={async () => {
                  if (!newFolderName.trim()) {
                    setFolderNameError('Folder name is required');
                    return;
                  }
                  
                  const isDuplicate = dashboardFolders.some(folder => 
                    folder.name.toLowerCase() === newFolderName.trim().toLowerCase()
                  );
                  
                  if (isDuplicate) {
                    setFolderNameError('Folder name already exists');
                    return;
                  }
                  
                  try {
                    setLoadingFolders(true);
                    const folderService = new DashboardFolderService(null);
                    const newFolder = await folderService.createFolder(newFolderName.trim());
                    
                    if (newFolder) {
                      const updatedFolders = [...dashboardFolders, newFolder];
                      setDashboardFolders(updatedFolders);
                      setSelectedFolder(newFolder.id.toString());
                      setNewFolderName('');
                      setShowCreateFolder(false);
                      toast.success('Folder created successfully!');
                    } else {
                      toast.error('Failed to create folder');
                    }
                  } catch (error) {
                    console.error('Error creating folder:', error);
                    toast.error('Failed to create folder');
                  } finally {
                    setLoadingFolders(false);
                  }
                }}
              >
                {loadingFolders ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setFolderNameError('');
                }}
              >
                Cancel
              </Button>
            </div>
            {folderNameError && (
              <div className="text-danger small mt-1">{folderNameError}</div>
            )}
          </div>
        )}
      </AddEditDialog>
    </div>
  );
};

export default ReportView;