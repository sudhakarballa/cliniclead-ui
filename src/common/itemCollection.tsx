import React, { useEffect, useState, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Util from "../others/util";
import ErrorFallback from "./errorFallBack";
import Table from "./table";
import { Spinner } from "react-bootstrap";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import PluseIcon from "@mui/icons-material/Add"; // Add icon
import GroupEmailDialog from "../components/GroupEmailDialog";
import { EmailTemplateService } from "../services/emailTemplateService"; // Import the EmailTemplateService
import { EmailTemplate } from "../models/emailTemplate"; // Import EmailTemplate model
import Drawer from "@mui/material/Drawer";
import { Button, Grid, Menu, MenuItem, IconButton, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { MoreVert as MoreVertIcon, Email, FileDownload, Save, Refresh } from "@mui/icons-material";
import MultiSelectDropdown from "../elements/multiSelectDropdown";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { DataGridProps } from '@mui/x-data-grid';
import SimpleGridPreferencesButton from './SimpleGridPreferencesButton';
import { useGridPreferences } from '../hooks/useGridPreferences';
import { DeleteDialog } from './deleteDialog';
import LocalStorageUtil from "../others/LocalStorageUtil";
import { TOOLTIPS } from "../constants/tooltips";

// Static flag to prevent multiple simultaneous API calls
let isLoadingTemplatesGlobal = false;
let cachedTemplates: EmailTemplate[] = [];
let isMasterAdminGlobal = false;

type params = {
  isNotListingPage?: boolean;
  itemName: any;
  itemType?: any;
  columnMetaData: any;
  viewAddEditComponent?: any;
  api?: any;
  postLoadData?: any;
  onPostLoadData?: any;
  itemsBySubURL?: any;
  itemsByPostURL?: any;
  canAdd?: boolean;
  rowTransformFn?: any;
  canProcessRowData?: boolean;
  dialogIsOpen?: any;
  canDoActions?: boolean;
  filterRowDataFn?: any;
  canShowClone?: boolean;
  canShowDelete?: boolean;
  defaultSortField?: string;
  selectedItem?: any;
  onDelete?: any;
  postDelete?: any;
  pageSize?: any;
  onValidate?: any;
  canShowValidate?: boolean;
  reloadDataOnSignalNotificationIndicator?: number;
  rowData?: any;
  renderRightActions?: any;
  renderIndications?: any;
  renderFooter?: any;
  isLoading?: boolean;
  customTableHeader?: any;
  addButtonName?: string;
  propNameforSelector?: string;
  canExport?: boolean;
  canShowDropdownForFilter?: boolean;
  customActions?: any;
  propNameforDelete?: string;
  displayTableHeaderasSingler?: boolean;
  onSave?: any;
  onSelectionModelChange?: any; // Add this
  checkboxSelection?: boolean; // Ensure checkboxSelection is handled
  enableCheckboxSelection?: boolean;
  openGroupEmailDialog?: any;
  excludeColumnsForExport?: any;
  customRowData?: boolean;
  hidePagination?: boolean;
  isCustomHeaderActions?: any;
  customHeaderActions?: any;
  dataGridProps?: any;   
};

const ItemCollection: React.FC<params> = (props) => {
  console.log("ItemCollection - props: ", props);
  const { savePreferences, resetPreferences, updatePreferences, preferences: gridPreferences, hasChanges, hasExistingPreferences, resetTrigger } = useGridPreferences(`${props.itemName}-grid`);
  const [excludeColumnsForExport, setExcludeColumnsForExport] = useState(
    (props.excludeColumnsForExport ?? []).concat([
      "renderValueinCustomFormat",
      "id",
    ])
  );
  const [defaultSortField, setDefaultSortField] = useState(
    props.defaultSortField ? props.defaultSortField : "modifiedOn"
  );

  const [customRowData, setCustomRowData] = useState(
    props.customRowData ?? false
  );

  const [dialogIsOpen, setDialogIsOpen] = useState(
    props.dialogIsOpen ? props.dialogIsOpen : false
  );
  const [canShowValidate, setCanShowValidate] = useState(
    props.canShowValidate ? props.canShowValidate : false
  );
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isClone, setIsClone] = useState(false);
  const [itemsBySubURL, setItemsBySubURL] = useState(props.itemsBySubURL);
  const [itemsByPostURL, setItemsByPostURL] = useState(props.itemsByPostURL);
  const [selectedColumns, setSelectedColumns] = useState<any[]>([]);
  const [dataToExport, setDataToExport] = useState<any[]>([]);
  const [totalColumns, setTotalColumns] = useState<
    { key: string; label: string; selected?: boolean }[]
  >([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItemUser, setSelectedItemUser] = useState(
    Util.clone(props.selectedItem ?? new props.itemType())
  );

  const {
    itemName,
    customTableHeader,
    itemType,
    columnMetaData,
    viewAddEditComponent,
    api,
    displayTableHeaderasSingler,

  } = props;
  const [canAdd, setCanAdd] = useState(
    props.canAdd != null ? props.canAdd : true
  );
  const [canShowClone, setCanShowClone] = useState(
    !Util.isNullOrUndefinedOrEmpty(props.canShowClone)
      ? props.canShowClone
      : false
  );
  const [canDoActions, setCanDoActions] = useState(
    !Util.isNullOrUndefinedOrEmpty(props.canDoActions)
      ? props.canDoActions
      : true
  );
  const canShowDelete = !Util.isNullOrUndefinedOrEmpty(props.canShowDelete)
    ? props.canShowDelete
    : true;
  const [pageSize, setPagesize] = useState(
    props.pageSize ? props.pageSize : null
  );
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([] as unknown as GridRowSelectionModel);
  const [rowData, setRowData] = useState(props.rowData ? props.rowData : null);
  const [isLoading, setIsloading] = useState(
    props.isLoading ? props.isLoading : (props.rowData === null || props.rowData === undefined)
  );
  const currentGridPreferencesRef = useRef<{
    columnOrder: string[];
    columnWidths: { [key: string]: number };
    sortModel: any[];
    filterModel: any;
    hiddenColumns: string[];
  }>({
    columnOrder: [],
    columnWidths: {},
    sortModel: [],
    filterModel: {},
    hiddenColumns: []
  });
  const [propNameforSelector, setPropNameforSelector] = useState(
    props.propNameforSelector ? props.propNameforSelector : null
  );
  const [addButtonName, setAddButtonName] = useState(
    props.addButtonName ? props.addButtonName : "Add"
  );
  const [renderRightActions, setRenderRightActions] = useState(
    props.renderRightActions
  );
  const [canProcessRowData, setCanProcesRowData] = useState(
    !Util.isListNullOrUndefinedOrEmpty(props.canProcessRowData)
      ? props.canProcessRowData
      : true
  );
  const [renderIndications, setRenderIndications] = useState(
    !Util.isNullOrUndefined(props.renderIndications)
      ? props.renderIndications
      : null
  );
  const [renderFooter, setRenderFooter] = useState(
    !Util.isNullOrUndefinedOrEmpty(props.renderFooter)
      ? props.renderFooter
      : null
  );
  const [canShowDropdownForFilter, setCanShowDropdownForFilter] = useState(
    !Util.isNullOrUndefinedOrEmpty(props.canShowDropdownForFilter)
      ? props.canShowDropdownForFilter
      : true
  );
  const [propNameforDelete, setPropNameforDelete] = useState(
    props.propNameforDelete ? props.propNameforDelete : "name"
  );
  const customActions = (data?: any) => {
    return props.customActions ? props.customActions(data) : null;
  };
  // If any translations need to be handled after receiving the itemList then postLoada method can be called from derived components
  const postLoadData = (data?: any) => {
    populateColumnsForExport(data);
    return props.postLoadData ? props.postLoadData(data) : data;
  };

  // If any translations need to be handled while opening the popup then onPostLoada method can be called from derived components
  const onPostLoadData = (data?: any) => {
    return props.onPostLoadData ? props.onPostLoadData(data) : data;
  };

  const rowTransformFn = (data?: any) => {
    return props.rowTransformFn
      ? props.rowTransformFn(baseRowTransformFn(data))
      : baseRowTransformFn(data);
  };

  const filterRowDataFn = (data?: any) => {
    return props.filterRowDataFn ? props.filterRowDataFn(data) : data;
  };

  const onDelete = (data1?: any, data2?: any) => {
    return props.onDelete ? props.onDelete(data1, data2) : null;
  };

  const postDelete = () => {
    return props.postDelete ? props.postDelete() : null;
  };

  const onValidate = (data?: any) => {
    return props.onValidate ? props.onValidate(data) : null;
  };

  const [canExport, setCanExport] = useState(
    !Util.isNullOrUndefinedOrEmpty(props.canExport) ? props.canExport : true
  );

  const [isSaveorUpdateClicked, setIsSaveorUpdateClicked] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [groupEmailDialogOpen, setGroupEmailDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>("xlsx");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  useEffect(() => {
    isMasterAdminGlobal = Util.isMasterAdmin();
    console.log('ItemCollection - Is Master Admin:', isMasterAdminGlobal, 'Item Name:', itemName);
    
    // CRITICAL: Do not load templates for master admin at all
    if (isMasterAdminGlobal) {
      console.log('Skipping template load for master admin');
      return;
    }
    
    // Only fetch templates if this is not the template management screen
    if (itemName !== "Template") {
      // Use cached templates if available
      if (cachedTemplates.length > 0) {
        setTemplates(cachedTemplates);
        return;
      }
      
      // Prevent duplicate API calls
      if (isLoadingTemplatesGlobal) return;
      
      isLoadingTemplatesGlobal = true;
      const templateService = new EmailTemplateService(ErrorBoundary);
      templateService
        .getEmailTemplates()
        .then((res: EmailTemplate[]) => {
          cachedTemplates = res; // Cache the result
          setTemplates(res);
        })
        .catch((err) => {
          console.error("Error fetching templates:", err);
        })
        .finally(() => {
          isLoadingTemplatesGlobal = false;
        });
    }
  }, [itemName]);

  useEffect(() => {
    if (props.rowData !== null && props.rowData !== undefined) {
      let rowData = props.rowData ?? [];
      rowData?.forEach((item: any) => {
        item.updatedBy = Util.getUserNameById(
          item?.modifiedBy ?? item?.createdBy
        );
        item.updatedDate = item.modifiedDate ?? item.createdDate;
      });
      setRowData([...rowData]);
      populateColumnsForExport(rowData);
      setIsloading(false);
    } else {
      setIsloading(true);
    }
  }, [props.rowData]);

  const populateColumnsForExport = (data: Array<any>) => {
    if (data?.length > 0) {
      const firstItem = data[0];
      const dynamicColumns = Object.keys(firstItem)
        ?.filter((i) => !(excludeColumnsForExport ?? []).includes(i))
        ?.map((key) => ({
          key,
          label: key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase()),
        }));
      setDataToExport(data);
      setTotalColumns(dynamicColumns);
    } else {
      const columnsFromMetadata = columnMetaData
        ?.filter((col: any) => !(excludeColumnsForExport ?? []).includes(col.columnName))
        ?.map((col: any) => ({
          key: col.columnName,
          label: col.columnHeaderName || col.columnName
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str:any) => str.toUpperCase()),
        }));
      setTotalColumns(columnsFromMetadata || []);
      setDataToExport([]);
    }
  };

  useEffect(() => {
    setRenderFooter(props.renderFooter);
  }, [props.renderFooter]);

  useEffect(() => {
    if (props.dialogIsOpen) {
      setDialogIsOpen(props.dialogIsOpen);
    }
    if (props.selectedItem) {
      setSelectedItemUser(props.selectedItem);
    }
  }, [props.dialogIsOpen]);

  useEffect(() => {
    setIsloading(props.isLoading as any);
  }, [props.isLoading]);

  useEffect(() => {
    console.log("Selected Rows Updated: ", selectedRows);
  }, [selectedRows]);

  // Initialize preferences ref
  useEffect(() => {
    currentGridPreferencesRef.current = {
      columnOrder: gridPreferences.columnOrder || [],
      columnWidths: gridPreferences.columnWidths || {},
      sortModel: gridPreferences.sortModel || [],
      filterModel: gridPreferences.filterModel || {},
      hiddenColumns: gridPreferences.hiddenColumns || []
    };
  }, [gridPreferences]);

  // Handle reset trigger
  useEffect(() => {
    if (resetTrigger > 0) {
      // Clear current grid preferences ref
      currentGridPreferencesRef.current = {
        columnOrder: [],
        columnWidths: {},
        sortModel: [],
        filterModel: {},
        hiddenColumns: []
      };
      console.log('Grid preferences reset triggered for:', props.itemName);
    }
  }, [resetTrigger, props.itemName]);

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    console.log("Selection Changed in ItemCollection: ", newSelection);
    setSelectedRows(newSelection);
    props.onSelectionModelChange && props.onSelectionModelChange(newSelection); // Update the state with new selection
  };
  // Function to set the selected template
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template); // Update state with selected template data
  };
  const openGroupEmailDialog = () => {
    props.openGroupEmailDialog(true);
  };

  const baseRowTransformFn = (item: any) => {
    return {
      ...item,
      renderValueinCustomFormat: [
        {
          key: "modifiedOn",
          val: "modifiedOn",
          customFormat: Util.toDateFormat(item.modifiedOn),
        },
      ],
    };
  };

  const allFields = Object.keys(new itemType());
  
    // Build a Set for quick lookup
    const defaultFieldsSet = new Set(
      columnMetaData.map((f:any) => f.columnName)
    );
  
    // Step 1: Add default fields in order
    const sortedFields = [
      ...columnMetaData.map((field:any) => ({
        columnName: field.columnName,
        columnHeaderName: field.columnHeaderName,
        width: field.width,
        hidden: false, // default visible
      })),
    ];
  
    // Step 2: Add remaining fields (not in defaultVisibleFields)
    allFields.forEach((field) => {
      if (!defaultFieldsSet.has(field)) {
        sortedFields.push({
          columnName: field,
          columnHeaderName: field
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s: string) => s.toUpperCase()),
          width: 200,
          hidden: true, // initially hidden
        });
      }
    });
  
  // Apply saved column widths to column metadata
  const updatedColumnMetaData = sortedFields.map(field => ({
    ...field,
    width: gridPreferences.columnWidths?.[field.columnName] || field.width
  }));

  const tableListProps: any = {
    rowClassName: (params: any) => {
    if (params.row?.status === "Won") return "row-won";
    if (params.row?.status === "Lost") return "row-lost";
    return "";
  },
    isNotListingPage: props.isNotListingPage,
    canProcessRowData: canProcessRowData,
    tableListHeader: customTableHeader
      ? customTableHeader
      : displayTableHeaderasSingler
      ? itemName
      : (itemName + "s").replace("ss", "s"),
    itemName: itemName,
    itemType: itemType,
    rowData: rowData,
    onSelectionModelChange: handleSelectionChange,
    // checkboxSelection: true,
    checkboxSelection: props.checkboxSelection ?? false,
    renderRightActions: renderRightActions,
    renderIndications: renderIndications,
    renderFooter: renderFooter,
    columnMetaData: updatedColumnMetaData,
    hiddenColumns: "",
    viewAddEditComponent: viewAddEditComponent,
    itemsBySubURL: itemsBySubURL,
    itemsByPostURL: itemsByPostURL,
    canAdd: canAdd,
    canDoActions: canDoActions,
    canShowClone: canShowClone,
    canShowDelete: canShowDelete,
    canShowValidate: canShowValidate,
    defaultSortField: defaultSortField,
    propNameforSelector: propNameforSelector,
    propNameforDelete: propNameforDelete,
    pageSize: pageSize,
    addButtonName: addButtonName,
    canExport: canExport,
    canShowDropdownForFilter: canShowDropdownForFilter,
    customRowData: customRowData,
    hidePagination: props.hidePagination,
    isLoading: isLoading,
    dataGridProps: {
      ...props.dataGridProps,
      key: `grid-${props.itemName}-${resetTrigger}`, // Force re-mount on reset
      // Apply loaded preferences
      initialState: {
        ...props.dataGridProps?.initialState,
        columns: {
          columnVisibilityModel: resetTrigger > 0 ? 
            // If reset was triggered, use default visibility
            updatedColumnMetaData.reduce((acc, col) => {
              acc[col.columnName] = !col.hidden; // hidden: true => visible: false
              return acc;
            }, {} as any)
            : gridPreferences.hiddenColumns && gridPreferences.hiddenColumns.length > 0 
            ? {
                // Show all columns by default
                ...updatedColumnMetaData.reduce((acc, col) => {
                  acc[col.columnName] = true; // true means visible
                  return acc;
                }, {} as any),
                // Hide only the columns in hiddenColumns array
                ...gridPreferences.hiddenColumns.reduce((acc, col) => {
                  // Only include columns that exist in current grid
                  if (updatedColumnMetaData.some(colDef => colDef.columnName === col)) {
                    acc[col] = false; // false means hidden
                  }
                  return acc;
                }, {} as any)
              }
            : {
                // No saved preferences, use default visibility from metadata
                ...updatedColumnMetaData.reduce((acc, col) => {
                  acc[col.columnName] = !col.hidden; // hidden: true => visible: false
                  return acc;
                }, {} as any)
              },
        },
        sorting: {
          sortModel: resetTrigger > 0 ? [] : Array.isArray(gridPreferences.sortModel) ? gridPreferences.sortModel : [],
        },
      },
      columnOrder: resetTrigger > 0 ? undefined : (gridPreferences.columnOrder || undefined),
      onSortModelChange: (sortModel: any) => {
        currentGridPreferencesRef.current.sortModel = sortModel;
        updatePreferences({...currentGridPreferencesRef.current});
      },
      onColumnOrderChange: (columnOrder: string[]) => {
        currentGridPreferencesRef.current.columnOrder = columnOrder;
        updatePreferences({...currentGridPreferencesRef.current});
      },
      onColumnWidthChange: (params: any) => {
        currentGridPreferencesRef.current.columnWidths = {
          ...currentGridPreferencesRef.current.columnWidths,
          [params.colDef.field]: params.width
        };
        updatePreferences({...currentGridPreferencesRef.current});
      },
      onColumnVisibilityModelChange: (model: any) => {
        const hiddenColumns = Object.keys(model).filter(key => !model[key]);
        currentGridPreferencesRef.current.hiddenColumns = hiddenColumns;
        updatePreferences({...currentGridPreferencesRef.current});
      },
      onFilterModelChange: (filterModel: any) => {
        currentGridPreferencesRef.current.filterModel = filterModel;
        updatePreferences({...currentGridPreferencesRef.current});
      },
    }, 
    customActions: customActions,
    viewAddEditComponentProps: {
      dialogIsOpen: dialogIsOpen,
      isReadOnly: isReadOnly,
      setDialogIsOpen: setDialogIsOpen,
      setIsReadOnly: setIsReadOnly,
      isClone: isClone,
      setIsClone: setIsClone,
      header: itemName,
      selectedItem: selectedItemUser,
      setSelectedItem: setSelectedItemUser,
      onSave: () => props.onSave(),
      onClose: () => console.log("onClose Invoked!!!"),
      closeDialog: () => {
        console.log("closeDialog Invoked!!!");
        setDialogIsOpen(false);
      },
      setLoadRowData: () => {},
    },
    serviceAPI: api,
    postLoadData: postLoadData,
    onPostLoadData: onPostLoadData,
    onDelete: onDelete,
    postDelete: postDelete,
    onValidate: onValidate,
    rowTransformFn: rowTransformFn,
    filterRowDataFn: filterRowDataFn,
    reloadDataOnSignalNotificationIndicator:
      props.reloadDataOnSignalNotificationIndicator,

  };

  const handleExportToExcel = async () => {
    try {
      if (selectedColumns.length == 0) {
        alert("Please select atleast one column to proceed");
        return;
      }

      setDrawerOpen(false);

      setSelectedColumns([]);

      const rowdataToExport = dataToExport.map((deal: any) => {
        const row: any = {};

        // Loop through the selectedColumns and dynamically assign values to the row
        selectedColumns.forEach((sColumn: { name: string; value: string }) => {
          // Check if the key exists in the deal object and assign the value
          if ((deal[sColumn.value] as any) !== undefined) {
            row[sColumn.name] = deal[sColumn.value] as any;
          } else {
            row[sColumn.name] = "N/A"; // Default value if data is missing
          }
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rowdataToExport);

if (exportFormat === "csv") {
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${props.itemName}_Export_${new Date().toISOString()}.csv`);
} else {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, props.itemName + "s");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
  saveAs(data, `${props.itemName}_Export_${new Date().toISOString()}.xlsx`);
}
    } catch (err) {
      console.error("Error exporting all deals:", err);
      alert("Something went wrong while exporting. Please try again.");
    }
  };

  const getFiltersList = () => {
    return (
      totalColumns.map((item: any) => ({
        name: item.label,
        value: item.key,
      })) ?? []
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

  const confirmReset = () => {
    // Clear current grid preferences ref before reset
    currentGridPreferencesRef.current = {
      columnOrder: [],
      columnWidths: {},
      sortModel: [],
      filterModel: {},
      hiddenColumns: []
    };
    resetPreferences();
    setShowResetDialog(false);
  };

  // Shared style for buttons
  const toolbarButtonStyle: React.CSSProperties = {
    minWidth: 100,
    minHeight: 32,
    fontWeight: 500,
    padding: '0 12px',
    borderRadius: 4,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
  };

  // Detect sidebar state from localStorage
  const isSidebarCollapsed = (() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem('ISSIDEBAR_EXPANDED');
      return val === 'false' ? false : true;
    }
    return true;
  })();

  // Export button
  const renderExportButton = () => (
    <Button
      variant="outlined"
      color="secondary"
      size="small"
      style={toolbarButtonStyle}
      onClick={(e: any) => setDrawerOpen(true)}
      disabled={Array.isArray(selectedRows) && (selectedRows as unknown as any[]).length > 0 && isLoading}
    >
      Export
    </Button>
  );

  // More Actions dropdown menu
  const renderMoreActionsMenu = () => (
    <>
      <Tooltip title={TOOLTIPS.ACTIONS.MORE_ACTIONS} placement="top">
        <IconButton
          onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
          size="small"
          style={{
            ...toolbarButtonStyle,
            minWidth: 36,
            width: 36,
            height: 32,
            padding: 0
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={moreActionsAnchor}
        open={Boolean(moreActionsAnchor)}
        onClose={() => setMoreActionsAnchor(null)}
        PaperProps={{
          style: {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 8
          }
        }}
      >
        {props.checkboxSelection && (
          <MenuItem
            onClick={() => {
              openGroupEmailDialog();
              setMoreActionsAnchor(null);
            }}
            disabled={(selectedRows as unknown as any[]).length === 0}
            title="Send email to selected recipients"
            sx={{
              py: 1,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                backgroundColor: '#f5f5f5'
              },
              '&.Mui-disabled': {
                opacity: 0.5
              }
            }}
          >
            <Email fontSize="small" color={(selectedRows as unknown as any[]).length === 0 ? 'disabled' : 'primary'} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Send Email ({(selectedRows as unknown as any[]).length})</span>
          </MenuItem>
        )}
        {canExport && (
          <MenuItem
            onClick={() => {
              setDrawerOpen(true);
              setMoreActionsAnchor(null);
            }}
            title="Export data to Excel or CSV"
            sx={{
              py: 1,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <FileDownload fontSize="small" color="primary" />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Export</span>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            savePreferences(currentGridPreferencesRef.current);
            setMoreActionsAnchor(null);
          }}
          disabled={!hasChanges}
          title="Save current grid settings"
          sx={{
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
            '&.Mui-disabled': {
              opacity: 0.5
            }
          }}
        >
          <Save fontSize="small" color={!hasChanges ? 'disabled' : 'primary'} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Save Settings</span>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowResetDialog(true);
            setMoreActionsAnchor(null);
          }}
          disabled={!hasExistingPreferences && !hasChanges}
          title="Reset grid to default settings"
          sx={{
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
            '&.Mui-disabled': {
              opacity: 0.5
            }
          }}
        >
          <Refresh fontSize="small" color={(!hasExistingPreferences && !hasChanges) ? 'disabled' : 'primary'} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Reset Settings</span>
        </MenuItem>
      </Menu>
    </>
  );
  const addorUpdateItem = () => {
    return (
      <>
        <div className="pipe-toolbar pt-3 pb-3">
          <div className="container-fluid">
            <div className="row toolbarview-row">
              <div className="col-sm-5 toolbarview-actions" style={{ display: 'flex', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{itemName === "Activity" ? "Activities" : (itemName + "s").replace("ss", "s")}</h4>
              </div>
              {props.isCustomHeaderActions ? (
                props.customHeaderActions({
                  hasChanges,
                  hasExistingPreferences,
                  onSave: () => savePreferences(currentGridPreferencesRef.current),
                  onReset: resetPreferences
                })
              ) : (
                <div
                  className="col-sm-7 toolbarview-summery"
                >
                  <div className="toolbarview-actionsrow" style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: isSidebarCollapsed ? 'flex-end' : 'flex-end',
                      paddingRight: isSidebarCollapsed ? 24 : 60, // More padding when expanded
                      width: '100%',
                      flexWrap: 'wrap',
                      boxSizing: 'border-box',
                    }}>
                    {renderMoreActionsMenu()}
                    
                    <Tooltip title={`${TOOLTIPS.ACTIONS.ADD} ${itemName}`} placement="top">
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        size="small"
                        style={toolbarButtonStyle}
                        hidden={!canAdd}
                        onClick={(e: any) => {
                          setSelectedItemUser(new props.itemType());
                          setDialogIsOpen(true);
                        }}
                      >
                        + Add {itemName}
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {isLoading ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : (
        <>
          {addorUpdateItem()}
          <div className="contactlist-row">
            <div className="container-fluid">
              <Table {...tableListProps} />
            </div>
            <GroupEmailDialog
              open={groupEmailDialogOpen}
              onClose={() => setGroupEmailDialogOpen(false)}
              selectedRecipients={Array.isArray(selectedRows) ? (selectedRows as unknown as any[]).map((id) => {
                const item = props.rowData?.find(
                  (row: { personID: number; email: string }) =>
                    row.personID === id
                );
                return item ? item.email : "";
              }) : []}
              selectedTemplate={selectedTemplate} // Pass the selected template here
              templates={templates} // Pass the templates here
              onTemplateSelect={handleTemplateSelect} // Pass the handler here
            />
          </div>

          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
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
                  hidden={(selectedRows as unknown as any[]).length > 0}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0 }}>Columns</h4>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small">
                      <span style={{ fontSize: "24px", cursor: "pointer" }}>×</span>
                    </IconButton>
                  </div>
                  <MultiSelectDropdown
                    list={getFiltersList()}
                    selectedList={selectedColumns}
                    onItemChange={(e: any) => onColumnSelection(e)}
                  />
                </div>

                <div style={{ marginTop: "24px" }}>
                  <h4>Export Format</h4>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ marginRight: "16px" }}>
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
              </div>
              
              <div style={{ padding: "16px", borderTop: "1px solid #e0e0e0", backgroundColor: "#fff" }}>
                <Button
                  variant="contained"
                  fullWidth
                  hidden={(selectedRows as unknown as any[]).length > 0}
                  onClick={(e: any) => handleExportToExcel()}
                >
                  Export
                </Button>
              </div>
            </div>
          </Drawer>
          
          <DeleteDialog
            itemType="Grid Preferences"
            itemName="preferences"
            dialogIsOpen={showResetDialog}
            closeDialog={() => setShowResetDialog(false)}
            onConfirm={confirmReset}
            isPromptOnly={false}
            actionType="Reset"
          />
        </>
      )}
    </ErrorBoundary>
  );
};

export default ItemCollection;
