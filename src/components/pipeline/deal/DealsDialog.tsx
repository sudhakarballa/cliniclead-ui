import React, { useState } from 'react';
import { AddEditDialog } from '../../../common/addEditDialog'; // Ensure correct path
import { DataGrid, GridColDef,GridPaginationModel  } from '@mui/x-data-grid';
import ProgressBar from 'react-bootstrap/ProgressBar';
import StagesProgressBar from "./stagesProgressBar";
import { Stage } from '../../../models/stage';
import { Spinner } from 'react-bootstrap';


interface DealsDialogProps {
    show: boolean;
    onClose: () => void;
    dealsData: {
      pipelineStages: Stage[];
      pipelineName: string;
      stageID: number; id: number; treatmentName: string; personName: string; ownerName: string 
}[];
    stages: Stage[];
    currentStageId: number;
    loading?: boolean;
}

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'treatmentName', headerName: 'Title', width: 200 },
    { field: 'personName', headerName: 'Contact Person', width: 200 },
    { field: 'ownerName', headerName: 'Owner', width: 200 },
    { field: 'organizationName', headerName: 'Organization', width: 200 },
];
const portalContainer =
  typeof document !== 'undefined' ? () => document.body : undefined;
const DealsDialog: React.FC<DealsDialogProps> = ({
  show,
  onClose,
  dealsData,
  loading = false,
}) => {
  const [paginationModel, setPaginationModel] =
    useState<GridPaginationModel>({ page: 0, pageSize: 5 });

  return (
    <AddEditDialog
      dialogIsOpen={show}
      dialogSize="large"
      header="Linked Deals"
      closeDialog={onClose}
      showSaveButton={false}
    >
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {loading ? (
          // full-modal loader
          <div
            style={{
              height: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h5>Open deals ({dealsData.length})</h5>
              <div>
                {dealsData.map((deal) => (
                  <div
                    key={deal.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: 10,
                      marginBottom: 10,
                      border: "1px solid #ccc",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <strong>{deal.treatmentName}</strong>
                      <div style={{ fontSize: "0.85em", color: "#666" }}>
                        Pipeline: <em>{deal.pipelineName || "N/A"}</em>
                      </div>
                    </div>
                    <StagesProgressBar
                      stages={deal.pipelineStages}
                      currentStageId={deal.stageID}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 350, width: "100%" }}>
              {dealsData.length > 0 ? (
                <DataGrid
                  className="custom-data-grid"
                  rows={dealsData}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pagination
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[5, 10, 25, 50]}
                  loading={loading} // built-in overlay
                  slotProps={{
                    basePopper: {
                      // types vary across MUI versions; cast if needed
                      container: portalContainer as any,
                      placement: "bottom-start" as any,
                      modifiers: [
                        { name: "offset", options: { offset: [0, 6] } } as any,
                        {
                          name: "flip",
                          options: { fallbackPlacements: ["top-start"] },
                        } as any,
                        {
                          name: "preventOverflow",
                          options: { rootBoundary: "viewport", padding: 8 },
                        } as any,
                      ],
                    } as any,
                    pagination: {
                      SelectProps: {
                        MenuProps: {
                          container: portalContainer as any,
                          disablePortal: false,
                          disableScrollLock: true,
                          PaperProps: { sx: { maxHeight: 280, overflowY: "auto" } },
                        },
                      },
                    },
                  }}
                  sx={{
                    "& .MuiDataGrid-menu, & .MuiDataGrid-panel": { zIndex: 20000 },
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
                />
              ) : (
                <p style={{ textAlign: "center", marginTop: 20 }}>
                  No data available
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AddEditDialog>
  );
};

export default DealsDialog;
