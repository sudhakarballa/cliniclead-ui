import { faChartBar, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { DeleteDialog } from '../../common/deleteDialog';
import DashboardReportChart from './DashboardReportChart';
import { ReportService } from '../../services/reportService';
import { ReportDashboardService } from '../../services/reportDashboardService';

interface DashboardViewProps {
  dashboard: any;
  onBack: () => void;
  onReportClick: (report: any) => void;
  onDashboardUpdate: (updatedDashboard: any) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ dashboard, onBack, onReportClick, onDashboardUpdate }) => {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [reportToRemove, setReportToRemove] = useState<any>(null);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [dashboardReports, setDashboardReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalReports, setOriginalReports] = useState<string>('');
  
  // Load reports for this dashboard
  useEffect(() => {
    const loadDashboardReports = async () => {
      if (!dashboard.reports) {
        setDashboardReports([]);
        setLoading(false);
        setOriginalReports('');
        return;
      }
      
      try {
        // Parse the reports string (e.g., "1,2,3") into array of IDs
        const reportIds = dashboard.reports.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
        
        if (reportIds.length === 0) {
          setDashboardReports([]);
          setLoading(false);
          setOriginalReports('');
          return;
        }
        
        // Fetch report details for each ID
        const reportService = new ReportService(null);
        const fetchedReports = await reportService.getReports();
        setAllReports(fetchedReports);
        
        // Filter reports that are in this dashboard
        const filteredReports = fetchedReports.filter((report: any) => reportIds.includes(report.id));
        setDashboardReports(filteredReports);
        setOriginalReports(dashboard.reports);
        setHasChanges(false);
      } catch (error) {
        console.error('Error loading dashboard reports:', error);
        setDashboardReports([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardReports();
  }, [dashboard.reports]);
  
  const reports = dashboardReports;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="d-flex align-items-center" style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <h4 className="mb-0" style={{ 
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '24px',
            wordBreak: 'break-word'
          }}>
            {dashboard.name}
          </h4>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasChanges && (
            <>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  const reportIds = originalReports ? originalReports.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id)) : [];
                  const filteredReports = allReports.filter((report: any) => reportIds.includes(report.id));
                  setDashboardReports(filteredReports);
                  setHasChanges(false);
                  toast.info('Changes discarded');
                }}
              >
                Discard
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={async () => {
                  try {
                    const updatedReportsString = dashboardReports.map(r => r.id).join(',');
                    const dashboardService = new ReportDashboardService(null);
                    await dashboardService.updateDashboardReports(dashboard.id, updatedReportsString, dashboard.folderId, dashboard.name, 0);
                    const updatedDashboard = { ...dashboard, reports: updatedReportsString };
                    onDashboardUpdate(updatedDashboard);
                    setOriginalReports(updatedReportsString);
                    setHasChanges(false);
                    toast.success('Dashboard saved successfully!');
                  } catch (error) {
                    console.error('Error saving dashboard:', error);
                    toast.error('Failed to save dashboard');
                  }
                }}
              >
                Save
              </Button>
            </>
          )}
          <div className="text-muted small" style={{ textAlign: 'right' }}>
            Folder: {dashboard.folderName} | Created: {new Date(dashboard.createdDate).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard reports...</p>
        </div>
      ) : (
        <>
      {/* Reports Grid */}
      {reports.length > 0 ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Reports ({reports.length})</h5>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowAddReportModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Report
            </Button>
          </div>
          <div className="row g-4">
            {reports.map((report: any) => (
              <div key={report.id} className="col-lg-6">
                <div 
                  className="position-relative"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onReportClick(report)}
                >
                  <DashboardReportChart report={report} />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="position-absolute"
                    style={{
                      top: '8px',
                      right: '8px',
                      zIndex: 10,
                      padding: '4px 8px',
                      fontSize: '12px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the report click
                      setReportToRemove(report);
                      setShowRemoveModal(true);
                    }}
                    title="Remove from dashboard"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <FontAwesomeIcon 
            icon={faChartBar} 
            size="3x" 
            className="mb-3 text-muted" 
          />
          <h5 className="text-muted mb-3">No Reports Available</h5>
          <p className="text-muted">
            No reports are currently mapped to this dashboard.
          </p>
          <Button 
            variant="primary" 
            onClick={() => setShowAddReportModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Report
          </Button>
        </div>
      )}
        </>
      )}
      
      {/* Remove Report Confirmation Dialog */}
      {showRemoveModal && reportToRemove && (
        <DeleteDialog
          itemType="Report"
          itemName={reportToRemove.name}
          dialogIsOpen={showRemoveModal}
          closeDialog={() => {
            setShowRemoveModal(false);
            setReportToRemove(null);
          }}
          onConfirm={() => {
            const updatedReports = dashboardReports.filter((r: any) => r.id !== reportToRemove.id);
            setDashboardReports(updatedReports);
            setHasChanges(true);
            setShowRemoveModal(false);
            setReportToRemove(null);
            toast.info(`Report "${reportToRemove.name}" will be removed. Click Save to confirm.`);
          }}
          customDeleteMessage={<div>Are you sure you want to remove <strong>{reportToRemove.name}</strong> from this dashboard?</div>}
          isPromptOnly={false}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          actionType="Remove"
        />
      )}
      
      {/* Add Report to Dashboard Modal */} 
      {showAddReportModal && (
        <DeleteDialog
          itemType="Report"
          itemName=""
          dialogIsOpen={showAddReportModal}
          closeDialog={() => setShowAddReportModal(false)}
          onConfirm={() => setShowAddReportModal(false)}
          customDeleteMessage={
            <div>
              <h6 className="mb-3">Select Reports to Add</h6>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {allReports
                  .filter((report: any) => {
                    const reportIds = dashboard.reports ? dashboard.reports.split(',').map((id: string) => parseInt(id.trim())) : [];
                    return !reportIds.includes(report.id);
                  })
                  .map((report: any) => (
                    <div 
                      key={report.id}
                      className="d-flex justify-content-between align-items-center p-2 border rounded mb-2"
                      style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                      onClick={() => {
                        const updatedReports = [...dashboardReports, report];
                        setDashboardReports(updatedReports);
                        setHasChanges(true);
                        setShowAddReportModal(false);
                        toast.info(`Report "${report.name}" added. Click Save to confirm.`);
                      }}
                    >
                      <div>
                        <div className="fw-bold">{report.name}</div>
                        <small className="text-muted">{report.entity} {report.type}</small>
                      </div>
                      <Button variant="outline-primary" size="sm">
                        <FontAwesomeIcon icon={faPlus} />
                      </Button>
                    </div>
                  ))
                }
                {allReports
                  .filter((report: any) => {
                    const reportIds = dashboard.reports ? dashboard.reports.split(',').map((id: string) => parseInt(id.trim())) : [];
                    return !reportIds.includes(report.id);
                  }).length === 0 && (
                  <div className="text-center text-muted py-3">
                    No available reports to add
                  </div>
                )}
              </div>
            </div>
          }
          isPromptOnly={true}
          confirmLabel="Close"
          cancelLabel=""
          actionType="Close"
        />
      )}
    </div>
  );
};

export default DashboardView;