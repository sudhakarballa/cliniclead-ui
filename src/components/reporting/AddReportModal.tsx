import React, { useState } from "react";
import { AddEditDialog } from "../../common/addEditDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faBullhorn, 
  faUser, 
  faUserTie, 
  faHandshake, 
  faChartBar 
} from '@fortawesome/free-solid-svg-icons';

interface AddReportModalProps {
  dialogIsOpen: boolean;
  closeDialog: () => void;
  onSubmit: (entity: string, reportType: string) => void;
}

const AddReportModal: React.FC<AddReportModalProps> = ({
  dialogIsOpen,
  closeDialog,
  onSubmit
}) => {
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedReportType, setSelectedReportType] = useState<string>("");

  const entities = [
    { name: "Deal", icon: faHandshake },
    { name: "Contact", icon: faUser },
    { name: "Activity", icon: faChartLine }
  ];

  const reportTypes: { [key: string]: Array<{ name: string; description: string }> } = {
    Activity: [
      { name: "Performance", description: "How are your activities performing?" },
      { name: "Conversion", description: "What is your activity conversion rate?" }
    ],
    Campaign: [
      { name: "Performance", description: "How are your campaigns performing?" },
      { name: "Conversion", description: "What is your campaign conversion rate?" }
    ],
    Contact: [
      { name: "Performance", description: "How are your contacts performing?" },
      { name: "Engagement", description: "How engaged are your contacts?" }
    ],
    Lead: [
      { name: "Performance", description: "How are your leads performing?" },
      { name: "Conversion", description: "What is your lead conversion rate?" }
    ],
    Deal: [
      { name: "Performance", description: "How much did you start, win, or lose?" },
      { name: "Conversion", description: "What is your win or loss rate?" },
      { name: "Duration", description: "How long is your sales cycle?" },
      { name: "Progress", description: "Are your deals moving forward in pipeline?" },
      { name: "Products", description: "How are your products performing?" }
    ],
    "Revenue forecast": [
      { name: "Performance", description: "How is your revenue forecast performing?" },
      { name: "Trends", description: "What are your revenue trends?" }
    ]
  };

  const handleSubmit = () => {
    if (selectedEntity && selectedReportType) {
      onSubmit(selectedEntity, selectedReportType);
      setSelectedEntity("");
      setSelectedReportType("");
      closeDialog();
    }
  };

  const handleClose = () => {
    setSelectedEntity("");
    setSelectedReportType("");
    closeDialog();
  };

  const canSave = selectedEntity && selectedReportType;

  return (
    <AddEditDialog
      dialogIsOpen={dialogIsOpen}
      header="Add new report"
      dialogSize="lg"
      onSave={handleSubmit}
      closeDialog={handleClose}
      onClose={handleClose}
      canSave={canSave as any}
      customSaveChangesButtonName="Continue"
    >
      <div className="row">
        {/* Left Column - Choose Entity */}
        <div className="col-md-6">
          <h6 className="mb-3">Choose Entity</h6>
          <div className="list-group">
            {entities.map((entity) => (
              <button
                key={entity.name}
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  selectedEntity === entity.name ? 'active' : ''
                }`}
                onClick={() => setSelectedEntity(entity.name)}
              >
                <FontAwesomeIcon 
                  icon={entity.icon} 
                  className="me-3" 
                  style={{ width: '20px' }}
                />
                {entity.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Choose Report Type */}
        <div className="col-md-6">
          <h6 className="mb-3">Choose Report Type</h6>
          {selectedEntity ? (
            <div className="list-group">
              {reportTypes[selectedEntity]?.map((reportType) => (
                <button
                  key={reportType.name}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    selectedReportType === reportType.name ? 'active' : ''
                  }`}
                  onClick={() => setSelectedReportType(reportType.name)}
                >
                  <div className="fw-bold">{reportType.name}</div>
                  <small className="text-muted">{reportType.description}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted text-center py-4">
              Select an entity to see available report types
            </div>
          )}
        </div>
      </div>
    </AddEditDialog>
  );
};

export default AddReportModal;