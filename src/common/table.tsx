import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

import {
  Button,
  Grid
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridColumnHeaderParams,
  gridClasses
  
} from "@mui/x-data-grid";
import moment from "moment";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import Util from "../others/util";
import { DeleteDialog } from "./deleteDialog";
import LocalStorageUtil from "../others/LocalStorageUtil";
import { DataGridProps } from "@mui/x-data-grid";


const ODD_OPACITY = 0.2;

const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: theme.palette.grey[200],
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      "@media (hover: none)": {
        backgroundColor: "transparent",
      },
    },
    "&.Mui-selected": {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity
      ),
      "&:hover": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY +
            theme.palette.action.selectedOpacity +
            theme.palette.action.hoverOpacity
        ),
        // Reset on touch devices, it doesn't add specificity
        "@media (hover: none)": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity
          ),
        },
      },
    },
  },
  /* ✅ NEW: color whole rows for Won/Lost */
  [`& .${gridClasses.row}.row-won`]: {
    backgroundColor: "#e6f4ea",           // light green
  },
  [`& .${gridClasses.row}.row-lost`]: {
    backgroundColor: "#fdecea",           // light red
  },
}));

export interface TableColumnMetadata {
  columnName: any;
  field?: string;
  columnHeaderName?: string | null;
  flex?: number | null;
  width: number;
  originalWidth?: number;
  order?: number;
  index?: number;
  hidden: boolean;
  sort?: string;
  componentName?: string;
  type?: string;
  renderCell?: (params: GridCellParams) => React.ReactElement;
}

export interface TableListProps {
  isNotListingPage?: boolean;
  canProcessRowData?: boolean;
  tableListHeader: string;
  itemName: any;
  itemType: any;
  rowData: null | any;
  renderRightActions?: null | any;
  renderIndications?: null | any;
  renderFooter?: null | any;
  rowTransformFn?: null | any;
  reloadDataOnSignalNotificationIndicator: number | undefined;
  renderCell?: null | any;
  columnMetaData: TableColumnMetadata[];
  hiddenColumns: null | any;
  viewAddEditComponent: any;
  viewAddEditComponentProps: ViewEditProps;
  itemsBySubURL?: any;
  itemsByPostURL?: any;
  canAdd?: boolean;
  postLoadData?: any;
  onPostLoadData?: any;
  canDoActions?: boolean;
  filterRowDataFn?: any;
  canShowClone?: boolean;
  canShowDelete?: boolean;
  defaultSortField?: string;
  onDelete?: any;
  postDelete?: any;
  pageSize: number;
  onValidate?: any;
  canShowValidate?: boolean;
  addButtonName?: string;
  queryByOrgs?: boolean;
  propNameforSelector: any;
  canExport?: boolean;
  canShowDropdownForFilter?: boolean;
  customActions?: any;
  propNameforDelete?: string;
  serviceAPI: any;
  checkboxSelection?: boolean;
  onSelectionModelChange?: (newSelection: GridRowSelectionModel) => void;
  customRowData?:boolean;
  hidePagination?:boolean;
  dataGridProps?: Partial<DataGridProps>;
 
}

export interface ViewEditProps {
  dialogIsOpen: boolean;
  setDialogIsOpen: any;
  header: string;
  selectedItem: any;
  setSelectedItem: any;
  selectedItemList?: any;
  onSave: any;
  onClose: any;
  closeDialog: any;
  setLoadRowData: any;
  onPostLoadData?: any;
  isReadOnly?: boolean;
  setIsReadOnly?: any;
  isClone?: any;
  setIsClone?: any;
  canClose?:any;
}

const Table: React.FC<TableListProps> = (props) => {
  const [rowData, setRowData] = useState(props.rowData ?? []);
  const [columnMetaData, setColumnMetaRowData] = useState(props.columnMetaData);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([] as unknown as GridRowSelectionModel);
  // State for column options dropdown
  const [columnOptionsAnchorEl, setColumnOptionsAnchorEl] = useState<null | HTMLElement>(null);
  const [columnOptionsOpen, setColumnOptionsOpen] = useState(false);
  const checkboxSelection = props.checkboxSelection;
  const onSelectionModelChange = props.onSelectionModelChange;

  const [loadRowData, setLoadRowData] = useState(false);
  const canDoActions = props.canDoActions;
  const propNameforSelector = props.propNameforSelector;
  const selectedItem = props.viewAddEditComponentProps.selectedItem;
  const setSelectedItem = props.viewAddEditComponentProps.setSelectedItem;
  const dialogIsOpen: boolean = props.viewAddEditComponentProps.dialogIsOpen;
  const setDialogIsOpen = props.viewAddEditComponentProps.setDialogIsOpen;
  const [actionType, setActionType] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const userProfile = Util.UserProfile();
  const itemType = props.itemName;
  const [propNameforDelete, setPropNameforDelete] = useState(
    props.propNameforDelete ? props.propNameforDelete : "name"
  );
  const { dataGridProps } = props;    
  useEffect(() => {
    setColumnMetaRowData(props.columnMetaData);
  }, [props]);

  useEffect(() => {
   if(loadRowData==true) loadData();
  }, [loadRowData]);

  useEffect(() => {
    // Only load data if not using custom row data
    if (!props.customRowData) {
      loadData();
    }
  }, [props.customRowData]);

  const loadData = () => {
    if(!props.customRowData){
      setIsLoading(true);
      (props.itemsBySubURL
        ? props.serviceAPI.getItemsBySubURL(props.itemsBySubURL)
        : props.serviceAPI.getItems()
      )
        .then((res: Array<any>) => {
          console.log("res  " + JSON.stringify(res));
          res.forEach((r, index) => {
            r.id = r.id ?? index + 1;
            return r;
          });
          res = processRowData(res);
          var transformedRowData = res?.map((r: any) => {
            return props.rowTransformFn(r);
          });
          setRowData(transformedRowData);
          props.postLoadData(transformedRowData);
          setIsLoading(false);
          setLoadRowData(false);
        })
        .catch((err: any) => {
          setIsLoading(false);
          toast.error("Unable to retreive list");
        });
    }

  };

  const isISODateString = (value: any): boolean => {
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/.test(value)
    );
  };

  const processRowData = (rowData: Array<any>) => {
    // Sort by modifiedDate (or createdDate) descending, including time
    rowData.sort((a, b) => {
      // Use original ISO string for sorting (before formatting)
      const rawA = a.modifiedDateRaw || a.modifiedDate || a.createdDateRaw || a.createdDate || 0;
      const rawB = b.modifiedDateRaw || b.modifiedDate || b.createdDateRaw || b.createdDate || 0;
      const dateA = Date.parse(rawA);
      const dateB = Date.parse(rawB);
      return dateB - dateA;
    });
    // Get users from localStorage
    const usersData = LocalStorageUtil.getItem('USERS_DATA');
    const users = usersData ? JSON.parse(usersData) : [];
    
    rowData.forEach((r) => {
      // Convert modifiedBy ID to username using stored users data
      if (r.modifiedBy && typeof r.modifiedBy === 'number') {
        const user = users.find((u: any) => u.userId === r.modifiedBy);
        r.modifiedBy = user ? user.userName : r.modifiedBy;
      }
      // Fallback for other user ID fields
      if (!r.modifiedBy) {
        r.modifiedBy = Util.getUserNameById(r.updatedBy ?? r.createdBy);
      }
      // Save original ISO string for sorting
      if (isISODateString(r.modifiedDate)) r.modifiedDateRaw = r.modifiedDate;
      if (isISODateString(r.createdDate)) r.createdDateRaw = r.createdDate;
      // Loop through properties and format ISO date strings
      Object.keys(r).forEach((key) => {
        const value = r[key];
        if (isISODateString(value)) {
          r[key] = moment(value).format('DD/MM/YYYY');
        }
      });
    });
    return rowData;
  };

  const getSelectedItemfromCellValues = (cellValues: any) => {
    let newSelectedItem = { ...selectedItem };
    for (const [key, value] of Object.entries(new props.itemType())) {
      let rowDataValue = cellValues.row[key.toString()];
      newSelectedItem[key.toString()] = rowDataValue;
    }
    return newSelectedItem;
  };

  // For Edit Action
  const onClickEditListener = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    cellValues: GridCellParams,
    isReadOnly: boolean = false,
    isClone: boolean = false
  ) => {
    
    console.log(
      "TableListBase - onClickEditListener - cellValues.row: ",
      cellValues.row,
      " | selectedItem: ",
      selectedItem
    );

    let newSelectedItem = getSelectedItemfromCellValues(cellValues);
    console.log(
      "TableListBase - onClickEditListener - newSelectedItem: ",
      newSelectedItem
    );

    newSelectedItem = props.onPostLoadData(newSelectedItem);
    setSelectedItem(newSelectedItem);
    setDialogIsOpen(true);
    event.stopPropagation();
  };

  // For Delete Actions
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUserConfirmation, setShowUserConfirmation] = useState(false);
  const hideDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  const onDeleteConfirm = () => {
    setIsLoading(true);
    props.serviceAPI
      .delete(selectedItem.id, userProfile?.userId || 0)
      .then((res: any) => {
        toast.success(itemType + " deleted successfully");

        if (props.postDelete) {
          props.postDelete();
        }
        setIsLoading(false);
        setLoadRowData(true);
      })
      .catch((err: any) => {
        toast.error("unable to delete " + itemType);
        setIsLoading(false);
      })
      .finally(() => {
        setShowDeleteDialog(false);
      });
  };

  const onClickDeleteListener = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    cellValues: GridCellParams
  ) => {
    console.log(
      "TableListBase - onClickDeleteListener - cellValues.row: ",
      cellValues.row
    );

    setShowDeleteDialog(true);
    setSelectedItem(cellValues.row);
    setActionType("Delete" as any);
    event.stopPropagation();
  };
  useEffect(() => {
    if (props.rowData) {
      setRowData(props.rowData);
    }
  }, [props.rowData]);
  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    // Only update selection if checkboxSelection is enabled
    if (checkboxSelection) {
      setSelectedRows(newSelection);
      if (onSelectionModelChange) {
        onSelectionModelChange(newSelection);
      }
    }
  };
const clientPaginationDefaults: Partial<DataGridProps> = props.hidePagination
  ? {} // ⛔️ don't pass `pagination: false` — just omit it
  : {
      pagination: true, // ✅ must be true (or omitted)
      pageSizeOptions: window.config?.Pagination?.pageSizeOptions || [8, 16, 32, 64],
      initialState: {
        pagination: { paginationModel: { pageSize: window.config?.Pagination?.defaultPageSize || 8, page: 0 } },
        // Merge with preferences from dataGridProps
        ...props.dataGridProps?.initialState
      },
      slotProps: {
        pagination: { showFirstButton: true, showLastButton: true },
      },
    };
  const generateGridColDef = (): GridColDef[] => {
    let index = 0;
    let columnDefs: GridColDef[] = columnMetaData.map(
      (metaDataIter: TableColumnMetadata, iterCnt: number) => {
        const headerValue: any =
          metaDataIter.columnHeaderName !== undefined &&
          metaDataIter.columnHeaderName !== null
            ? metaDataIter.columnHeaderName
            : Util.capitalizeFirstChar(metaDataIter.columnName);
        // If a custom renderCell is provided, use it. Otherwise, show N/A for empty values.
        const defaultRenderCell = (params: GridCellParams) => {
          const value = params.value;
          if (value === null || value === undefined || value === "") {
            return <span style={{ color: '#aaa' }}>N/A</span>;
          }
          return <span>{value != null ? String(value) : ""}</span>;
        };
        return {
          field: metaDataIter.columnName,
          headerName: headerValue,
          headerClassName: "wordWrap",
          headerAlign: "left",
          height: 500,
          hideable : metaDataIter.hidden,
          hidden: metaDataIter.hidden ? false : true,
          width: metaDataIter.width,
          flex: metaDataIter.flex !== null ? metaDataIter.flex : 1,
          renderCell: metaDataIter.renderCell || defaultRenderCell,
          renderHeader: (params: GridColumnHeaderParams) => {
            // console.log("renderHeader: ", params);
            // dataGridAPIRef = params.api;
            return (
              <div
                title={headerValue}
                style={{
                  whiteSpace: "normal",
                  lineHeight: "normal",
                  textAlign: "left",
                }}
              >
                <strong> {headerValue} </strong>
              </div>
            );
          },
        };
      }
    );

    let actions: GridColDef = {
      field: "actions",
      headerName: "Actions",
      headerAlign: "left",
      sortable: false,
      width: 280,
      disableColumnMenu: true,
      disableReorder: true,
      renderHeader: (params: GridColumnHeaderParams) => (
        <strong>Actions</strong>
      ),
      renderCell: (cellValues) => {
        // Prevent edit/delete for current user in users list
        const isUserList = props.itemName === 'User' || props.itemType?.name === 'User';
        const currentUserId = userProfile?.userId;
        const rowUserId = cellValues.row?.userId;
        const isCurrentUser = isUserList && currentUserId && rowUserId && Number(currentUserId) === Number(rowUserId);
        
        if (isCurrentUser) {
          return (
            <>
              <Button
                color="primary"
                startIcon={<EditIcon />}
                title="Cannot edit your own account"
                className="rowActionIcon"
                disabled={true}
                style={{ opacity: 0.3, cursor: 'not-allowed' }}
              ></Button>
              <Button
                color="primary"
                startIcon={<DeleteIcon />}
                title="Cannot delete your own account"
                className="rowActionIcon"
                disabled={true}
                style={{ opacity: 0.3, cursor: 'not-allowed' }}
              ></Button>
              {props.customActions ? props.customActions(cellValues) : null}
            </>
          );
        }
        
        return (
          <>
            <Button
              color="primary"
              startIcon={<EditIcon />}
              title="Edit"
              id={`$${
                propNameforSelector
                  ? "editItem_" +
                    getSelectedItemfromCellValues(cellValues)[
                      propNameforSelector
                    ]
                  : "editItem"
              }`}
              onClick={(event) => onClickEditListener(event, cellValues, false)}
              className="rowActionIcon"
            ></Button>
            <Button
              color="primary"
              startIcon={<DeleteIcon />}
              title="Delete"
              id={`$${
                propNameforSelector
                  ? "deleteItem_" +
                    getSelectedItemfromCellValues(cellValues)[
                      propNameforSelector
                    ]
                  : "deleteItem"
              }`}
              onClick={(event) => onClickDeleteListener(event, cellValues)}
              className="rowActionIcon"
            ></Button>
            {props.customActions ? props.customActions(cellValues) : null}
          </>
        );
      },
    };

    // Ensure Actions column is last
    if (canDoActions) columnDefs = [...columnDefs, actions];
    return columnDefs;
  };

  const columnsMetaData = generateGridColDef();

  // Column visibility is now handled by preferences in dataGridProps

  return (
    <Grid
      container
      style={{ padding: "0px", backgroundColor: "#ffffff" }}
    >
      {dialogIsOpen && (
        <props.viewAddEditComponent
          {...props.viewAddEditComponentProps}
          setLoadRowData={setLoadRowData}
          selectedItemList={rowData}
        />
      )}
      {showDeleteDialog && (
        <DeleteDialog
          itemType={itemType}
          itemName={selectedItem[propNameforDelete]}
          dialogIsOpen={showDeleteDialog}
          closeDialog={hideDeleteDialog}
          onConfirm={onDeleteConfirm}
          isPromptOnly={false}
          actionType={actionType}
        />
      )}
      {isLoading ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : rowData && rowData.length >= 0 ? (
        <StripedDataGrid
          key={`grid-${props.itemName}`}
          rows={rowData}
          columns={columnsMetaData as any}
          onColumnVisibilityModelChange={(model, details) => {
            if (props.dataGridProps?.onColumnVisibilityModelChange) {
              props.dataGridProps.onColumnVisibilityModelChange(model, details);
            }
          }}
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={checkboxSelection ? handleSelectionChange : undefined}
          disableRowSelectionOnClick={!checkboxSelection}
          getRowClassName={(params) => {
            const base = params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd";
            const status = params.row?.statusText ?? params.row?.status;
            if (status === "Won") return `${base} row-won`;
            if (status === "Lost") return `${base} row-lost`;
            return base;
          }}
          hideFooter={props.hidePagination}
          density="standard"
          sx={{ 
            minWidth: 800, 
            height: 'calc(100vh - 220px)',
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
          }}
          {...clientPaginationDefaults}

          {...(props.dataGridProps ?? {})}
        />
      ) : (
        <div className="alignCenter">
          <span>Loading data...</span>
        </div>
      )}
    </Grid>
  );
};
export default Table;
