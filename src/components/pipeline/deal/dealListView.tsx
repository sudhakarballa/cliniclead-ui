import { faGrip, faEllipsisV, faAdd, faBars, faDownload, faEnvelope, faPhone, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import axios, { AxiosError } from "axios";
import { saveAs } from "file-saver";
import moment from "moment";
import { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ItemCollection from "../../../common/itemCollection";
import { UnAuthorized } from "../../../common/unauthorized";
import { DateRangePicker } from "../../../elements/dateRangePicker";
import MultiSelectDropdown from "../../../elements/multiSelectDropdown";
import { Deal, DealExport } from "../../../models/deal";
import { PipeLine } from "../../../models/pipeline";
import { Utility } from "../../../models/utility";
import Constants from "../../../others/constants";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import Util from "../../../others/util";
import { DealService } from "../../../services/dealService";
import { PipeLineService } from "../../../services/pipeLineService";
import { StageService } from "../../../services/stageService";
import { DealExportPrview } from "./dealExportPreview";
import { DealAddEditDialog } from "./dealAddEditDialog";
import JustCallCampaignManager from "./justCallCampaignManager";
import JustCallCampaignModal from "./justCallCampaignModal";
import FilterDropdown from "./dealFilters/filterDropdown/filterDropdown";
import FilterListIcon from "@mui/icons-material/FilterList";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DoneIcon from "@mui/icons-material/Done";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import GroupEmailDialog from "../../GroupEmailDialog";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../pipeline/deal/activities/email/authConfig";
import { EmailTemplateService } from "../../../services/emailTemplateService";
import { EmailTemplate } from "../../../models/emailTemplate";
import { useAuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { GridCellParams } from "@mui/x-data-grid";
import React from "react";
import SimpleGridPreferencesButton from "../../../common/SimpleGridPreferencesButton";
import { useGridPreferences } from "../../../hooks/useGridPreferences";

type Params = {
  pipeLineId: number;
  setViewType: any;
  onSaveChanges: any;
  pipeLinesList: any;
  selectedStageId: any;
};

const DealListView = (props: Params) => {
  const { userProfile } = useAuthContext();
  const navigate = useNavigate();
  const {
    pipeLineId,
    setViewType,
    onSaveChanges,
    pipeLinesList,
    selectedStageId,
    ...others
  } = props;
  const { instance, accounts } = useMsal();                    // auth
  const [groupEmailDialogOpen, setGroupEmailDialogOpen] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [dealsList, setDealsList] = useState<Array<Deal>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

    const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>(() => {
    const saved = localStorage.getItem('dealListView_paginationModel');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback if parsing fails
      }
    }
    return {
      page: 0,
      pageSize: window.config?.Pagination?.defaultPageSize || 8,
    };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'export' | 'import' | 'sms'>('export');
  const [error, setError] = useState<AxiosError | null>(null);
  const [pipeLines, setPipeLines] = useState<Array<PipeLine>>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
  const [selectedPipeLines, setSelectedPipeLines] = useState<Array<any>>([]);
  const [previewData, setPreviewData] = useState<any[]>([]); // Preview data for export
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [openAddDealDialog, setOpenAddDealDialog] = useState(false);
  const [isMessageEmpty, setIsMessageEmpty] = useState(false);
  const [to, setTo] = useState<string>("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);
    const utility: Utility = JSON.parse(
      LocalStorageUtil.getItemObject(Constants.UTILITY) as any
    );
   const [users, setUsers]=useState<Array<any>>(utility?.users);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({
    key: "",
    direction: "asc",
  });
  const [totalColumns, setTotalColumns] = useState<
    { key: string; label: string; selected?: boolean }[]
  >([]);
  const stagesSvc = new StageService(ErrorBoundary);
  const dealSvc = new DealService(ErrorBoundary);
  const pipeLineSvc = new PipeLineService(ErrorBoundary);
 const [pageSize, setPageSize] = useState(10);
 const [resetKey, setResetKey] = useState(0);
 const marketingColumns = [
  { columnName: "marketing_GCLID",      columnHeaderName: "GCLID",            width: 180 },
  { columnName: "marketing_source",     columnHeaderName: "Source",           width: 140 },
  { columnName: "marketing_medium",     columnHeaderName: "Medium",           width: 140 },
  { columnName: "marketing_term",       columnHeaderName: "Term",             width: 140 },
  { columnName: "marketing_content",    columnHeaderName: "Content",          width: 160 },
  { columnName: "submission_id",        columnHeaderName: "Submission ID",    width: 180 },
  { columnName: "marketingConsent",     columnHeaderName: "Marketing Consent",width: 180 },
  { columnName: "tcconsent",            columnHeaderName: "T&C Consent",      width: 160 },
  { columnName: "marketing_FBClid",     columnHeaderName: "FBCLID",           width: 180 }, 
];
 
  const columnMetaData = [
    { columnName: "stageName", columnHeaderName: "Stage", width: 150 },
    {
      field: "treatmentName",
      columnName: "treatmentName",
      columnHeaderName: "Treatment Name",
      width: 150,
      renderCell: (params: GridCellParams) => {
        console.log('Treatment renderCell called:', params);
        return (
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Treatment clicked:', params.row);
              const dealId = params.row.dealID || params.row.id;
              const pipelineId = params.row.pipelineID;
              console.log('Navigating to deal:', dealId, pipelineId);
              navigate(`/deal?id=${dealId}&pipeLineId=${pipelineId}&viewType=list`);
            }}
            style={{
              color: "#007bff",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            {String(params.value) || "N/A"}
          </span>
        );
      },
    },
    { columnName: "value", columnHeaderName: "Value" },
    { columnName: "personName", columnHeaderName: "Contact Person", width: 150 },
    { columnName: "name", columnHeaderName: "Organisation", width: 150 },
    { columnName: "phone", columnHeaderName: "Phone", width: 150 },
    { columnName: "email", columnHeaderName: "Email", width: 180 },
    { columnName: "pipelineName", columnHeaderName: "Pipeline", width: 150 },
    { columnName: "labelName", columnHeaderName: "Label", width: 120 },
    { columnName: "clinicName", columnHeaderName: "Clinic", width: 150 },
    { columnName: "sourceName", columnHeaderName: "Source", width: 120 },
    { columnName: "ownerName", columnHeaderName: "Owner", width: 120 },
    { columnName: "statusDisplay", columnHeaderName: "Status", width: 120 },
    {
      columnName: "expectedCloseDate",
      columnHeaderName: "Expected Close Date",
      width: 150,
    },
    {
      columnName: "operationDate",
      columnHeaderName: "Next Activity Date",
      width: 150,
    },
    ...marketingColumns,  
  ];
  const [selectedColumns, setSelectedColumns] = useState<any[]>([]);
  const [salesDialerDrawerOpen, setSalesDialerDrawerOpen] = useState(false);
  const [showPipeLineFilters, setShowPipeLineFilters] = useState(false);
  const [selectedFilterObj, setSelectedFilterObj] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [dealFilterDialogIsOpen, setDealFilterDialogIsOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { preferences } = useGridPreferences('Deals-grid');






  const getOrganizationName = (orgId: number) =>
    utility.organizations.find((o) => o.organizationID === orgId)?.name ||
    "N/A";

  const getContactPersonName = (personId: number | null | undefined) =>
    personId !== undefined
      ? utility.persons.find((p) => p.personID === personId)?.personName ||
        "No Contact"
      : "No Contact";
  const getContactPersonPhone = (personId: number | null | undefined) =>
    personId !== undefined
      ? utility.persons.find((p) => p.personID === personId)?.phone || "N/A"
      : "N/A";

  useEffect(() => {
    loadDeals();
    loadPipeLines();
  }, [currentPage]);
  useEffect(() => {
  const templateSvc = new EmailTemplateService(ErrorBoundary);
  templateSvc.getEmailTemplates()
    .then(setEmailTemplates)
    .catch(() => toast.error("Failed to load email templates."));
}, []);
  useEffect(() => {
    if (dealsList.length > 0) {
      const firstDeal = dealsList[0];

      const dynamicColumns = Object.keys(firstDeal).map((key) => ({
        key,
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()), // optional: prettify key names
      }));

      setTotalColumns(dynamicColumns);
    }
  }, [dealsList]);
  // Close filter dropdown and DataGrid panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close filter dropdown
      if (!target.closest('.pipeselectbox') && !target.closest('.pipeselectcontent')) {
        setShowPipeLineFilters(false);
      }
      
      // Close DataGrid column options panel
      if (!target.closest('.MuiDataGrid-panel') && !target.closest('.MuiDataGrid-columnHeaderTitleContainer')) {
        const panels = document.querySelectorAll('.MuiDataGrid-panel');
        panels.forEach(panel => {
          (panel as HTMLElement).style.visibility = 'hidden';
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
 const getStatusNameById = (statusID?: number): string => {
  switch (statusID) {
    case 1:
      return "Open";
    case 2:
      return "Won";
    case 3:
      return "Lost";
    case 4:
      return "Closed";
    default:
      return "N/A";
  }
};

  const loadPipeLines = () => {
    setIsLoading(true);

    pipeLineSvc
      .getPipeLines()
      .then((res: Array<PipeLine>) => {
        setPipeLines(res);
      })
      .catch((err: AxiosError) => {
        setError(err);
      });
  };

  const loadDeals = () => {
    setIsLoading(true);
    const apiPage = paginationModel.page + 1; // API is 1-based
    const size = paginationModel.pageSize;

    stagesSvc.getAllDealsByPipelines(apiPage, size)
      .then((res) => {
        const rows = res?.dealsDtos?.deals ?? [];
        const total = res?.dealsDtos?.totalCount ?? 0;
        console.log('API totalCount:', total, 'rows:', rows.length);
        setDealsList(rows);
        setTotalCount(total);
        setHasInitialLoad(true);

        // Clamp page if API says we’re past the end
        const last = Math.max(0, Math.ceil(total / size) - 1);
        if (paginationModel.page > last) {
          setPaginationModel((p) => ({ ...p, page: last }));
        }
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  };


  // --- NEW: Load deals by filter or user (mirroring deals.tsx logic) ---
  const loadDealsByFilter = () => {
    setIsLoading(true);
    setError(null as any);

    const apiPage = paginationModel.page + 1;
    const size = paginationModel.pageSize;

    const req =
      selectedUserId > 0
        ? stagesSvc.getDealsByUserId(selectedUserId, pipeLineId, apiPage, size)
        : stagesSvc.getDealsByFilterId(selectedFilterObj?.id, pipeLineId, userProfile?.userId ?? 0, apiPage, size);

    req
      .then((res: any) => {
        const list: Deal[] = [];
        (res?.stages ?? []).forEach((s: any) => (s?.deals ?? []).forEach((d: any) => list.push(d)));
        setDealsList(list);
        setHasInitialLoad(true);

        // Prefer API total if present; otherwise fall back so DataGrid can compute pages.
        const apiTotal = res?.dealsDtos?.totalCount ?? res?.totalCount ?? 0;
        const inferred = apiTotal || (paginationModel.page * size + list.length + (list.length === size ? size : 0));
        setTotalCount(apiTotal || inferred);

        const last = Math.max(0, Math.ceil((apiTotal || inferred) / size) - 1);
        if (paginationModel.page > last) {
          setPaginationModel((p) => ({ ...p, page: last }));
        }
      })
      .catch((err) => {
        // Don't show toast, just set error state for UI display
        setError("No deals under selected combination" as any);
        setDealsList([]);
        setTotalCount(paginationModel.page * size); // conservative fallback
        if (paginationModel.page > 0) setPaginationModel((p) => ({ ...p, page: Math.max(0, p.page - 1) }));
      })
      .finally(() => setIsLoading(false));
  };
// only load pipelines once
useEffect(() => { loadPipeLines(); }, []);
  // Save pagination state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dealListView_paginationModel', JSON.stringify(paginationModel));
  }, [paginationModel]);

  // --- Update effect to load deals when filter/user/page changes ---
  useEffect(() => {
    if (selectedFilterObj || selectedUserId) loadDealsByFilter();
    else loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterObj, selectedUserId, paginationModel]);


  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedDeals = [...dealsList].sort((a, b) => {
      let aValue: string | number | null | undefined = a[key as keyof Deal];
      let bValue: string | number | null | undefined = b[key as keyof Deal];

      if (key === "contactPersonName") {
        aValue = getContactPersonName(a.contactPersonID);
        bValue = getContactPersonName(b.contactPersonID);
      }

      if (aValue! < bValue!) return direction === "asc" ? -1 : 1;
      if (aValue! > bValue!) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setDealsList(sortedDeals);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === dealsList.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(dealsList.map((deal) => deal.dealID));
    }
  };

  useEffect(() => {
    if (selectedRows.length > 0 && dealsList.length > 0) {
      const selectedPhones = dealsList
        .filter((deal: any) => selectedRows.includes(deal.dealID))
        .map((deal: any) => deal.phone)
        .join(",");

      setTo(selectedPhones);
    }
  }, [selectedRows]);

  const handleRowSelection = (id: any) => {
    setSelectedRows(id);
  };


// If we ever land on an empty page (e.g., filters shrink results), bounce back one page.
useEffect(() => {
  if (!isLoading && currentPage > 1 && dealsList.length === 0) {
    setCurrentPage((p) => Math.max(1, p - 1));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dealsList.length, isLoading]);
  // const toggleColumnSelection = (columnKey: string) => {
  //   if (selectedColumns.includes(columnKey)) {
  //     setSelectedColumns(selectedColumns.filter((key) => key !== columnKey));
  //   } else {
  //     setSelectedColumns([...selectedColumns, columnKey]);
  //   }
  // };
const loadAllDeals = async (): Promise<Array<Deal>> => {
  try {
    const response = await stagesSvc.getAllDealsByPipelines(1, totalCount);
    if (response && Array.isArray(response.dealsDtos.deals)) {
      return response.dealsDtos.deals;
    } else {
      console.warn("Invalid response when loading all deals for export");
      return [];
    }
  } catch (err) {
    console.error("Error loading all deals for export", err);
    return [];
  }
};

  // Function to convert camelCase to proper header format
  const formatHeader = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/ID/g, 'ID') // Keep ID capitalized
      .replace(/URL/g, 'URL') // Keep URL capitalized
      .trim();
  };

  const validateFileFormat = (headers: string[]): boolean => {
  // Make validation more flexible - check for key columns only
  const requiredHeaders = [
    'Treatment Name', 'Stage', 'Pipeline'
  ];
  
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    toast.error(`Invalid file format. Missing required columns: ${missingHeaders.join(', ')}`);
    return false;
  }
  return true;
};

const handleDownloadSample = () => {
  const sampleFilePath = '/All_Deals_2026-01-19_updated.xlsx';
  const link = document.createElement('a');
  link.href = sampleFilePath;
  link.download = 'Sample_Deals_Format.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Sample file downloaded!');
};

const handleImportDeals = async () => {
  if (!importFile) {
    toast.error('Please select a file to import');
    return;
  }

  if (isImporting) {
    toast.warning('Import already in progress. Please wait...');
    return;
  }

  setIsImporting(true);
  toast.info('Reading file... Please wait', { autoClose: 2000 });

  try {
    const data = await importFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      toast.error('No data found in the file');
      setIsImporting(false);
      return;
    }

    // Log headers for debugging
    const headers = Object.keys(jsonData[0]);
    console.log('Excel file headers:', headers);
    console.log('First row data:', jsonData[0]);

    toast.info(`Processing ${jsonData.length} deals...`, { autoClose: 2000 });

    // Call backend API to import deals using DealService
    await dealSvc.importDeal(jsonData);
    
    toast.success(`Successfully imported ${jsonData.length} deals!`);
    setImportFile(null);
    setDrawerOpen(false);
    loadDeals(); // Reload the deals list
  } catch (error: any) {
    console.error('Import error:', error);
    toast.error(error?.response?.data?.message || 'Import failed. Please check the file format.');
  } finally {
    setIsImporting(false);
  }
};

const handleExportToExcel = async () => {
  if (isExporting) {
    toast.warning('Export already in progress. Please wait...');
    return;
  }

  setIsExporting(true);
  toast.info('Preparing export... Please wait', { autoClose: 2000 });

  try {
    const allDeals = await loadAllDeals();

    if (!allDeals.length) {
      toast.error("No deals found to export.");
      setIsExporting(false);
      return;
    }

  // List of ID properties to exclude from export
  const excludeProperties = [
    'dealID', 'contactPersonID', 'organizationID', 'pipelineID', 'stageID', 
    'labelID', 'clinicID', 'sourceID', 'treatmentID', 'pipelineTypeID', 
    'visibilityGroupID', 'assigntoId', 'createdBy', 'modifiedBy'
  ];

  // Export filtered properties with formatted headers
  const dataToExport = allDeals.map((deal: any) => {
    const formattedDeal: any = {};
    
    // Transform each property with proper header formatting
    Object.keys(deal).forEach(key => {
      // Skip ID properties
      if (excludeProperties.includes(key)) {
        return;
      }
      
      const formattedKey = formatHeader(key);
      let value = deal[key];
      
      // Convert statusID to meaningful status text
      if (key === 'statusID') {
        formattedDeal['Deal Status'] = getStatusNameById(value);
        return;
      }
      
      // Convert isClosed boolean to Yes/No
      if (key === 'isClosed') {
        formattedDeal['Is Closed'] = value === true ? 'Yes' : 'No';
        return;
      }
      
      // Format dates
      if (key.includes('Date') && value && value !== '0001-01-01T00:00:00') {
        value = moment(value).format('DD/MM/YYYY');
      }
      
      // Convert null/undefined/empty values to "N/A"
      formattedDeal[formattedKey] = (value === null || value === undefined || value === '') ? 'N/A' : value;
    });
    
    return formattedDeal;
  });

    toast.info('Generating file... Almost done!', { autoClose: 1500 });

    if (exportFormat === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Deals");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(data, `All_Deals_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Excel file downloaded successfully! (${allDeals.length} records)`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `All_Deals_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`CSV file downloaded successfully! (${allDeals.length} records)`);
    }

    setDrawerOpen(false);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Export failed. Please try again.');
  } finally {
    setIsExporting(false);
  }
};


  const getPipeLinesList = () => {
    return (
      pipeLines.map((item: PipeLine) => ({
        name: item.pipelineName,
        value: item.pipelineID,
      })) ?? []
    );
  };

  const getFiltersList = () => {
    return (
      totalColumns.map((item: any) => ({
        name: item.label,
        value: item.key,
      })) ?? []
    );
  };

  const onPipeLineSelection = (pipeLinesList: any) => {
    let selectedPipeLines: Array<any> = [];
    pipeLinesList?.split(",")?.forEach((p: any) => {
      let pipeLineItem = pipeLines.find((pItem) => pItem.pipelineName === p);
      if (pipeLineItem) {
        pipeLineItem.selected = true;
        selectedPipeLines.push(pipeLineItem);
      }
    });

    setSelectedPipeLines(
      (selectedPipeLines.map((item: PipeLine) => ({
        name: item.pipelineName,
        value: item.pipelineID,
      })) ?? []) as any
    );
  };

  const onColumnSelection = (columns: any) => {
    let selectedColumns: Array<any> = [];
    columns?.split(",")?.forEach((c: any) => {
      let columnItem = totalColumns.find((cItem: any) => cItem.label === c);
      if (columnItem) {
        columnItem.selected = true;
        selectedColumns.push(columnItem);
      }
    });

    setSelectedColumns(
      (selectedColumns.map((item: any) => ({
        name: item.label,
        value: item.key,
      })) ?? []) as any
    );
  };

  const onDatePeriodSelection = (dates: Array<Date>) => {
    if (dates.length > 0) {
      setSelectedStartDate(dates[0]);
      setSelectedEndDate(dates[1]);
    } else {
      setSelectedStartDate(null as any);
      setSelectedEndDate(null as any);
    }
  };

  const handlePreview = () => {
    if (selectedColumns.length == 0) {
      alert("Please select atleast one column to show preview");
      return;
    }
    const previewRows = dealsList.map((deal: any) => {
      const row: any = {};

      selectedColumns.forEach((col: any) => {
        let value = deal[col.value];

        // Special formatting for some fields (optional)
        if (col.value === "value" && value !== undefined) {
          value = `£${value}`;
        }
        if (col.value === "organization" && value) {
          value = getOrganizationName(value); // value = organizationID
        }
        if (col.value === "contactPerson" && value) {
          value = getContactPersonName(value); // value = contactPersonID
        }
        if (
          (col.value === "treatmentName" || col.value === "stageName") &&
          !value
        ) {
          value = "N/A";
        }

        row[col.value] = value !== undefined ? value : "N/A"; // fallback
      });

      return row;
    });

    setPreviewData(previewRows);
    setDialogIsOpen(true);
  };

  const sendSMS = async () => {
    if (Util.isNullOrUndefinedOrEmpty(message)) {
      setIsMessageEmpty(true);
      return;
    }
    try {
      const res = await axios.post(window?.config?.SMSServiceURL, {
        to,
        message,
      });
      setResponse(res.data);
      handleSMSResponse(res.data);
      setMessage(null as any);
      setDrawerOpen(false);
    } catch (err) {
      //   setResponse({ success: false, error: err.message });
    }
  };

  const handleSMSResponse = (response: any) => {
    if (response.status === "success") {
      toast.success("✅ Message sent successfully to all recipients.");
    } else {
      toast.error(response.message);
    }
  };
  const getStatusColor = (status: string) => {
  switch (status) {
    case "Won":
      return "green";
    case "Lost":
      return "red";
    case "Open":
      return "orange";
    case "Closed":
      return "gray";
    default:
      return "black";
  }
};


  // Helper function to handle undefined values
  const safeValue = (value: any): string => {
    if (value === null || value === undefined || value === "undefined" || value === "") {
      return "N/A";
    }
    return String(value);
  };

 const rowTransform = (item: Deal) => {
    const transformedItem = { ...item };
    
    transformedItem.expectedCloseDate = item.expectedCloseDate ? moment(item.expectedCloseDate).format(
      window.config.DateFormat
    ) : "N/A";
    transformedItem.operationDate = item.operationDate ? moment(item.operationDate).format(
      window.config.DateFormat
    ) : "N/A";
    
    // Fix value display logic
    const numValue = Number(item.value);
    transformedItem.value = (item.value !== null && item.value !== undefined && !isNaN(numValue) && numValue >= 0)
      ? `£${numValue}`
      : "N/A";
    
    const statusText = getStatusNameById(item.statusID);
    // ✅ Emoji only for Won & Lost
    let statusDisplay = statusText;
    if (statusText === "Won") {
      statusDisplay = `🟢 ${statusText}`;
    } else if (statusText === "Lost") {
      statusDisplay = `🔴 ${statusText}`;
    }
    
    return {
      ...transformedItem,
      // Add null checks for all fields that might be undefined
      personName: safeValue(transformedItem.personName),
      name: safeValue(transformedItem.name),
      phone: safeValue(transformedItem.phone),
      email: safeValue(transformedItem.email),
      pipelineName: safeValue(transformedItem.pipelineName),
      stageName: safeValue(transformedItem.stageName),
      treatmentName: safeValue(transformedItem.treatmentName),
      labelName: safeValue(transformedItem.labelName),
      clinicName: safeValue(transformedItem.clinicName),
      sourceName: safeValue(transformedItem.sourceName),
      ownerName: safeValue(transformedItem.ownerName),
      marketing_GCLID: safeValue(transformedItem.marketing_GCLID),
      marketing_source: safeValue(transformedItem.marketing_source),
      marketing_medium: safeValue(transformedItem.marketing_medium),
      marketing_term: safeValue(transformedItem.marketing_term),
      marketing_content: safeValue(transformedItem.marketing_content),
      submission_id: safeValue(transformedItem.submission_id),
      marketingConsent: safeValue((transformedItem as any).marketingConsent),
      tcconsent: safeValue((transformedItem as any).tcconsent),
      marketing_FBClid: safeValue((transformedItem as any).marketing_FBClid),
      statusText,
      statusDisplay,
    };
  };

  const updateRowData = () =>
  processRowData(dealsList).map((item, index) => {
    const row = { ...rowTransform(item), id: item.dealID || `deal-${index}` };
    delete (row as any).status; // <-- hide the raw status field
    return row;
  });

  const isISODateString = (value: any): boolean => {
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/.test(
        value
      )
    );
  };

  const processRowData = (rowData: Array<any>) => {
    rowData.forEach((r) => {
      // Add modifiedBy using fallback logic
      r.modifiedBy = Util.getUserNameById(r.updatedBy ?? r.createdBy);

      // Loop through properties and format ISO date strings
      Object.keys(r).forEach((key) => {
        const value = r[key];
        if (isISODateString(value)) {
          r[key] = moment(value).format(window.config.DateFormat);
        }
      });
    });
    return rowData;
  };

    const onPersonSelection=(userName:string)=>{
      const picked = users.find(u => u.name === userName);
   setSelectedUserId(picked?.id ?? null);
    setSelectedFilterObj(null as any);
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.name === userName
          ? { ...user, isSelected: true }
          : { ...user, isSelected: false }
      )
    );
  }

  // Reset filter handler
  const handleResetFilter = () => {
    setSelectedFilterObj(null);
    setSelectedUserId(null);
    // clear the tick on owners
  setUsers(prev =>
    (prev || []).map(u => ({ ...u, isSelected: false }))
  );
    // Optionally, also close the filter dropdown
    setShowPipeLineFilters(false);
    setResetKey(k => k + 1);
  };
  const handleOpenGroupEmailDialog = async () => {
  if (!selectedRows.length) {
    toast.warn("Please select at least one deal.");
    return;
  }
  try {
    await instance.acquireTokenSilent({ scopes: loginRequest.scopes, account: accounts[0] });
    setGroupEmailDialogOpen(true);
  } catch {
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      if (loginResponse) setGroupEmailDialogOpen(true);
    } catch {
      toast.error("MSAL login failed. Try again.");
    }
  }
};
  const customHeaderActions = () => {
    return (
      <div className="col-sm-7 toolbarview-summery">
        <div className="toolbarview-actionsrow" style={{ paddingRight: "20px", display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginRight: 16 }}>
           Total Deals: {totalCount}
          </div>

          <div className="pipeselectbtngroup" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="pipeselectbox variantselectbox"
              onClick={(e: any) =>
                setShowPipeLineFilters(!showPipeLineFilters)
              }
            >
              <button className="pipeselect" type="button">
                <FontAwesomeIcon icon={faChartSimple} />{" "}
                <span>
                  {selectedFilterObj?.name ??
                    users?.find((u) => u.id === selectedUserId)?.name ??
                    "Select"}{" "}
                </span>
              </button>
              <div
                className="pipeselectcontent pipeselectfilter"
                hidden={!showPipeLineFilters}
                style={{
                  position: 'absolute',
                  right: 0,
                  left: 'auto',
                  transform: 'translateX(0)',
                  zIndex: showPipeLineFilters ? 999 : -1,
                  pointerEvents: showPipeLineFilters ? 'auto' : 'none'
                }}
              >
                <ul
                  className="nav nav-tabs pipefilternav-tabs"
                  id="myTab"
                  role="tablist"
                >
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="filters-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#filters"
                      type="button"
                      role="tab"
                      aria-controls="filters"
                      aria-selected="true"
                    >
                      <span>
                        <FilterListIcon />
                      </span>
                      Filters
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="owners-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#owners"
                      type="button"
                      role="tab"
                      aria-controls="owners"
                      aria-selected="false"
                    >
                      <span>
                        <PersonOutlineIcon />
                      </span>
                      Owners
                    </button>
                  </li>
                </ul>
                <div
                  className="tab-content pipefiltertab-content"
                  id="myTabContent"
                >
                  <div
                    className="tab-pane fade show active"
                    id="filters"
                    role="tabpanel"
                    aria-labelledby="filters-tab"
                  >
                    <FilterDropdown
                      key={resetKey} 
                      showPipeLineFilters={showPipeLineFilters}
                      setShowPipeLineFilters={setShowPipeLineFilters}
                      selectedFilterObj={selectedFilterObj}
                      setSelectedFilterObj={setSelectedFilterObj}
                      setDialogIsOpen={setDealFilterDialogIsOpen}
                      dialogIsOpen={dealFilterDialogIsOpen}
                    />
                  </div>
                  <div
                    className="tab-pane fade"
                    id="owners"
                    role="tabpanel"
                    aria-labelledby="owners-tab"
                  >
                    <div className="pipeselectpadlr filterownersbox">
                      {users
                        ?.filter((u) => u.isActive)
                        .map((item, index) => (
                          <>
                            <ul className="pipeselectlist filterownerslist">
                              <li>
                                <div
                                  className="filterownerli-row"
                                  key={index}
                                  onClick={(e: any) =>
                                    onPersonSelection(item.name)
                                  }
                                >
                                  <AccountCircleIcon className="userCircleIcon" />
                                  <span>{item.name}</span>
                                  <div className="filterownerli-icon">
                                    <a
                                      className="filterowner-tick"
                                      hidden={!item.isSelected}
                                    >
                                      <DoneIcon />
                                    </a>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
           

            {(selectedFilterObj || selectedUserId) && (
              <button
                className="btn btn-link p-0 m-0"
                title="Reset Filter"
                style={{ color: '#1976d2', marginLeft: 4 }}
                onClick={handleResetFilter}
              >
                <FilterAltOffIcon fontSize="medium" />
              </button>
            )}
          </div>
          
          {/* Grid Preferences Buttons */}
          <SimpleGridPreferencesButton
            gridName="Deals-grid"
          />
          
          {/* Combined More Actions menu */}
          <div>
            <Dropdown align="end">
              <Dropdown.Toggle variant="secondary" id="dropdown-more-actions">
                <FontAwesomeIcon icon={faEllipsisV} />
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ zIndex: 2000, minWidth: 180 }}>
                <Dropdown.Item onClick={() => setOpenAddDealDialog(true)}>
                  <FontAwesomeIcon icon={faAdd} style={{ marginRight: 8, color: '#28a745' }} />
                  New Deal
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header style={{ fontSize: '12px', color: '#6c757d' }}>VIEW OPTIONS</Dropdown.Header>
                <Dropdown.Item onClick={(e: any) => props.setViewType("list")}>
                  <FontAwesomeIcon icon={faBars} style={{ marginRight: 8, color: '#007bff' }} />
                  List View
                </Dropdown.Item>
                <Dropdown.Item onClick={(e: any) => props.setViewType("kanban")}>
                  <FontAwesomeIcon icon={faGrip} style={{ marginRight: 8, color: '#007bff' }} />
                  Kanban View
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Header style={{ fontSize: '12px', color: '#6c757d' }}>BULK ACTIONS</Dropdown.Header>
                <Dropdown.Item onClick={() => setDrawerOpen(true)} disabled={selectedRows.length > 0}>
                  <FontAwesomeIcon icon={faDownload} style={{ marginRight: 8, color: '#17a2b8' }} />
                  Export
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setDrawerOpen(true)}>
                  📤 Import
                </Dropdown.Item>
                <Dropdown.Item onClick={handleOpenGroupEmailDialog} disabled={selectedRows.length === 0}>
                 📧 Send Group Email
                 </Dropdown.Item>
                <Dropdown.Item onClick={() => setDrawerOpen(true)} disabled={selectedRows.length === 0}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8, color: '#ffc107' }} />
                  Send SMS
                </Dropdown.Item>
                <Dropdown.Item onClick={handleOpenSalesDialer} disabled={selectedRows.length === 0}>
                  <FontAwesomeIcon icon={faPhone} style={{ marginRight: 8, color: '#6f42c1' }} />
                  JustCall Sales Dialer
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  };
  // Function to handle opening sales dialer with selected contacts
  const handleOpenSalesDialer = () => {
    setSalesDialerDrawerOpen(true);
  };

  const getSelectedDeals = () => {
    return dealsList.filter((deal: any) => selectedRows.includes(deal.dealID));
  };

    const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setCurrentPage(newPage);
    setSelectedRows([]);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Show spinner overlay when loading */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Button variant="text" disabled style={{ background: 'transparent' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Loading...</span>
              <span><svg width="32" height="32" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#1976d2" strokeWidth="5" strokeDasharray="31.415, 31.415" transform="rotate(72.0001 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg></span>
            </span>
          </Button>
        </div>
      )}
     

      {hasInitialLoad && dealsList.length === 0 && !isLoading && (selectedFilterObj || selectedUserId) ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ marginBottom: '8px', color: '#333' }}>No deals found</h3>
          <p style={{ marginBottom: '16px' }}>No deals match the selected filter combination.</p>
          <button 
            className="btn btn-primary"
            onClick={handleResetFilter}
            style={{ padding: '8px 16px' }}
          >
            Clear Filters
          </button>
        </div>
      ) : hasInitialLoad ? (
        <ItemCollection
        key={`deals-${dealsList.length}`}
        itemName={"Deals"}
        itemType={Deal}
        columnMetaData={columnMetaData}
        canAdd={false}
        canExport={true}
        canDoActions={false}
        viewAddEditComponent={null}
        checkboxSelection={true}
        rowData={updateRowData()}
        customRowData={true}
        hidePagination={false} // Ensure DataGrid pagination is hidden
   
        isCustomHeaderActions={true}
        customHeaderActions={(itemCollectionPrefs: any) => (
          <div className="col-sm-7 toolbarview-summery">
            <div className="toolbarview-actionsrow" style={{ paddingRight: "20px", display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginRight: 16 }}>
                Total Deals: {totalCount}
              </div>
              
              <div className="pipeselectbtngroup" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="pipeselectbox variantselectbox" onClick={() => setShowPipeLineFilters(!showPipeLineFilters)}>
                  <button className="pipeselect" type="button">
                    <FontAwesomeIcon icon={faChartSimple} />
                    <span>{selectedFilterObj?.name ?? users?.find((u) => u.id === selectedUserId)?.name ?? "Select"}</span>
                  </button>
                  <div className="pipeselectcontent pipeselectfilter" hidden={!showPipeLineFilters} style={{ position: 'absolute', right: 0, left: 'auto', transform: 'translateX(0)', zIndex: showPipeLineFilters ? 999 : -1, pointerEvents: showPipeLineFilters ? 'auto' : 'none' }}>
                    <ul className="nav nav-tabs pipefilternav-tabs" id="myTab" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button className="nav-link active" id="filters-tab" data-bs-toggle="tab" data-bs-target="#filters" type="button" role="tab">
                          <FilterListIcon /> Filters
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button className="nav-link" id="owners-tab" data-bs-toggle="tab" data-bs-target="#owners" type="button" role="tab">
                          <PersonOutlineIcon /> Owners
                        </button>
                      </li>
                    </ul>
                    <div className="tab-content pipefiltertab-content" id="myTabContent">
                      <div className="tab-pane fade show active" id="filters" role="tabpanel">
                        <FilterDropdown key={resetKey} showPipeLineFilters={showPipeLineFilters} setShowPipeLineFilters={setShowPipeLineFilters} selectedFilterObj={selectedFilterObj} setSelectedFilterObj={setSelectedFilterObj} setDialogIsOpen={setDealFilterDialogIsOpen} dialogIsOpen={dealFilterDialogIsOpen} />
                      </div>
                      <div className="tab-pane fade" id="owners" role="tabpanel">
                        <div className="pipeselectpadlr filterownersbox">
                          {(users || []).filter((u) => u?.isActive).map((item, index) => (
                            <ul className="pipeselectlist filterownerslist" key={index}>
                              <li>
                                <div className="filterownerli-row" onClick={() => onPersonSelection(item.name)}>
                                  <AccountCircleIcon className="userCircleIcon" />
                                  <span>{item.name}</span>
                                  <div className="filterownerli-icon">
                                    <a className="filterowner-tick" hidden={!item.isSelected}>
                                      <DoneIcon />
                                    </a>
                                  </div>
                                </div>
                              </li>
                            </ul>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {(selectedFilterObj || selectedUserId) && (
                  <button className="btn btn-link p-0 m-0" title="Reset Filter" style={{ color: '#1976d2', marginLeft: 4 }} onClick={handleResetFilter}>
                    <FilterAltOffIcon fontSize="medium" />
                  </button>
                )}
              </div>
              
              <SimpleGridPreferencesButton 
                gridName="Deals-grid" 
                hasChanges={itemCollectionPrefs?.hasChanges || false}
                hasExistingPreferences={itemCollectionPrefs?.hasExistingPreferences || false}
                onSave={itemCollectionPrefs?.onSave}
                onReset={itemCollectionPrefs?.onReset}
              />
              
              <div>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="secondary" id="dropdown-more-actions">
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ minWidth: 180 }}>
                <Dropdown.Item onClick={() => setOpenAddDealDialog(true)} title="Create a new deal">
                      <FontAwesomeIcon icon={faAdd} style={{ marginRight: 8, color: '#28a745' }} /> New Deal
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Header style={{ fontSize: '12px', color: '#6c757d' }}>VIEW OPTIONS</Dropdown.Header>
                    <Dropdown.Item onClick={() => props.setViewType("list")} title="Switch to list view">
                      <FontAwesomeIcon icon={faBars} style={{ marginRight: 8, color: '#007bff' }} /> List View
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      props.setViewType("kanban");
                      const currentParams = new URLSearchParams(window.location.search);
                      currentParams.set('viewType', 'kanban');
                      navigate(`/pipeline?${currentParams.toString()}`);
                    }} title="Switch to kanban board view">
                      <FontAwesomeIcon icon={faGrip} style={{ marginRight: 8, color: '#007bff' }} /> Kanban View
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Header style={{ fontSize: '12px', color: '#6c757d' }}>BULK ACTIONS</Dropdown.Header>
                    <Dropdown.Item onClick={() => { setDrawerMode('export'); setDrawerOpen(true); }} disabled={selectedRows.length > 0} title="Export all deals to Excel or CSV">
                      <FontAwesomeIcon icon={faDownload} style={{ marginRight: 8, color: '#17a2b8' }} /> Export
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { setDrawerMode('import'); setDrawerOpen(true); }} title="Import deals from Excel file">
                      <FontAwesomeIcon icon={faDownload} style={{ marginRight: 8, color: '#28a745', transform: 'rotate(180deg)' }} /> Import
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleOpenGroupEmailDialog} disabled={selectedRows.length === 0} title="Send email to selected deals">
                      📧 Send Group Email
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { setDrawerMode('sms'); setDrawerOpen(true); }} disabled={selectedRows.length === 0} title="Send SMS to selected deals">
                      <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8, color: '#ffc107' }} /> Send SMS
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleOpenSalesDialer} disabled={selectedRows.length === 0} title="Open JustCall sales dialer for selected deals">
                      <FontAwesomeIcon icon={faPhone} style={{ marginRight: 8, color: '#6f42c1' }} /> JustCall Sales Dialer
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
        )}
        onSelectionModelChange={handleRowSelection}
        
        dataGridProps={{
          getRowId: (row: any) => row.id,
          sortingMode: 'client',
          initialState: {
            sorting: {
              sortModel: preferences.sortModel || []
            }
          },
          onCellClick: (params: any) => {
            if (params.field === 'treatmentName') {
              const dealId = params.row.dealID || params.row.id;
              const pipelineId = params.row.pipelineID;
              navigate(`/deal?id=${dealId}&pipeLineId=${pipelineId}&viewType=list`);
            }
          },
          sx: {
            height: 'calc(100vh - 220px)',
            '& .MuiDataGrid-cell[data-field="treatmentName"]': {
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': {
                color: '#0056b3'
              }
            },
            '& .MuiDataGrid-footerContainer': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
              minHeight: '52px',
              paddingRight: '16px'
            },
            '& .MuiTablePagination-root': {
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              marginLeft: 'auto'
            },
            '& .MuiTablePagination-toolbar': {
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              gap: '8px',
              marginLeft: 'auto'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              margin: 0,
              whiteSpace: 'nowrap'
            }
          }
        }}
       

        />
      ) : null}
      
      {/* Show error only for actual errors, not "no deals" scenarios */}
      <div className="pdstage-area">
        {error && !error.toString().includes("No deals under selected combination") && <UnAuthorized error={error as any} />}

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setImportFile(null);
          }}
        >
          <div
            style={{
              width: "320px",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
             
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <div
                    className="p-4 border rounded shadow bg-white"
                    style={{ maxWidth: "400px" }}
                    hidden={drawerMode !== 'sms'}
                  >
                    <h2 style={{ marginBottom: "8px" }}>Bulk Actions</h2>
                    <p style={{ marginBottom: "24px" }}>
                      {selectedRows.length} deals selected
                    </p>

                    <div className="mb-3">
                      <label
                        htmlFor="messageInput"
                        className="form-label fw-bold"
                      >
                        Message Body
                      </label>
                      <textarea
                        id="messageInput"
                        className="form-control"
                        placeholder="Type your message here..."
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <p
                        hidden={
                          !Util.isNullOrUndefinedOrEmpty(message) ||
                          !isMessageEmpty
                        }
                        className="text-danger"
                      >
                        Please enter message body
                      </p>
                    </div>

                    <button className="btn btn-primary w-100" onClick={sendSMS}>
                      Send SMS
                    </button>
                  </div>
                </div>
{drawerMode === 'export' && (
  <div style={{ marginTop: 24 }}>
    <h4 style={{ marginBottom: 12 }}>Export Deals</h4>
    <div style={{ marginBottom: 12 }}>
      <label className="fw-bold">Export Format</label>
      <div style={{ marginTop: 8 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="exportFormat"
            value="csv"
            checked={exportFormat === "csv"}
            onChange={(e) => setExportFormat(e.target.value)}
          />{" "}
          CSV
        </label>
        <label>
          <input
            type="radio"
            name="exportFormat"
            value="xlsx"
            checked={exportFormat === "xlsx"}
            onChange={(e) => setExportFormat(e.target.value)}
          />{" "}
          Excel (XLSX)
        </label>
      </div>
    </div>
    <Button
      variant="contained"
      fullWidth
      onClick={handleExportToExcel}
      disabled={isExporting}
      style={{ position: 'relative', marginBottom: 16 }}
    >
      {isExporting ? (
        <>
          <span style={{ marginRight: 8 }}>Exporting...</span>
          <div 
            style={{
              width: 16,
              height: 16,
              border: '2px solid #ffffff40',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      ) : (
        'Export All Data'
      )}
    </Button>

  </div>
)}
{drawerMode === 'import' && (
  <div style={{ marginTop: 24 }}>
    <h4 style={{ marginBottom: 12 }}>Import Deals</h4>
    <div style={{ marginBottom: 12, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4, border: '1px solid #dee2e6' }}>
      <p style={{ fontSize: 13, marginBottom: 8, color: '#495057' }}>
        📋 Please use the correct format for import
      </p>
      <button
        onClick={handleDownloadSample}
        style={{ 
          fontSize: 12,
          width: '100%',
          padding: '6px 16px',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          backgroundColor: 'white',
          color: '#495057',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.borderColor = '#adb5bd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#dee2e6';
        }}
      >
        📥 Download Sample Format
      </button>
    </div>
    <div style={{ marginBottom: 12 }}>
      <label className="fw-bold" style={{ display: 'block', marginBottom: 8 }}>Select Excel File</label>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
        value=""
        style={{
          display: 'block',
          width: '100%',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />
      {importFile && (
        <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
          Selected: {importFile.name}
        </p>
      )}
    </div>
    <Button
      variant="contained"
      fullWidth
      onClick={handleImportDeals}
      disabled={!importFile || isImporting}
      style={{ position: 'relative', backgroundColor: '#28a745' }}
    >
      {isImporting ? (
        <>
          <span style={{ marginRight: 8 }}>Importing...</span>
          <div 
            style={{
              width: 16,
              height: 16,
              border: '2px solid #ffffff40',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </>
      ) : (
        'Import Deals'
      )}
    </Button>
  </div>
)} 

              </div>
            </div>
          </div>
        </Drawer>
        <JustCallCampaignModal
          isOpen={salesDialerDrawerOpen}
          onClose={() => setSalesDialerDrawerOpen(false)}
          selectedDeals={getSelectedDeals()}
        />
      </div>
      {dialogIsOpen && (
        <div style={{ zIndex: 8888 }}>
          <DealExportPrview
            previewData={previewData}
            selectedColumns={selectedColumns}
            dialogIsOpen={dialogIsOpen}
            setDialogIsOpen={setDialogIsOpen}
            onConfirmClick={(e: any) => handleExportToExcel()}
          />
        </div>
      )}
      {openAddDealDialog && (
        <DealAddEditDialog
          dialogIsOpen={openAddDealDialog}
          setDialogIsOpen={setOpenAddDealDialog}
          onSaveChanges={(e: any) => props.onSaveChanges()}
          selectedStageId={selectedStageId}
          pipeLinesList={pipeLinesList}
        />
      )}
      {groupEmailDialogOpen && (
  <GroupEmailDialog
    open={groupEmailDialogOpen}
    onClose={() => setGroupEmailDialogOpen(false)}
    selectedRecipients={getSelectedDeals()
      .map(d => d.email)
      .filter(e => !!e && e !== "N/A")}
    selectedTemplate={selectedTemplate}
    templates={emailTemplates}
    onTemplateSelect={(t) => setSelectedTemplate(t)}
  />
)}
    </>
  );
};

export default DealListView;
