import { useState, useMemo, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ItemCollection from "../../common/itemCollection";
import { Tasks } from "../../models/task"; // Import the Task model
import { TaskService } from "../../services/taskService"; // Import the Task service
import Checkbox from '@mui/material/Checkbox';
import { toast } from 'react-toastify';
import { GridRowSelectionModel } from '@mui/x-data-grid'; // Import GridRowSelectionModel type
import GroupEmailDialog from '../GroupEmailDialog'; 
import { EmailTemplate } from '../../models/emailTemplate';
import { EmailTemplateService } from '../../services/emailTemplateService'; 
import { TaskAddEdit } from '../pipeline/deal/activities/tasks/taskAddEdit';

// Static flag to prevent multiple simultaneous API calls
let isLoadingTemplates = false;

const TasksList = () => {
    const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([] as unknown as GridRowSelectionModel);
    const [selectAllChecked, setSelectAllChecked] = useState(false);
    const [rowData, setRowData] = useState<Array<Tasks>>([]);
    const [groupEmailDialogOpen, setGroupEmailDialogOpen] = useState(false); 
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [templatesLoaded, setTemplatesLoaded] = useState(false); // Track if templates are loaded

    // Memoize the TaskService and EmailTemplateService instance
    const taskService = useMemo(() => new TaskService(ErrorBoundary), []);
    const templateSvc = useMemo(() => new EmailTemplateService(ErrorBoundary), []);
  

    // Load task data from the API
    const loadTasksData = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await taskService.getAllTasks();
            console.log("Raw API Response:", response);
    
            // Transform and deduplicate data
            const transformedData = removeDuplicates(response.map(rowTransform));
            console.log("Transformed & Deduplicated Data:", transformedData);
    
            setRowData(transformedData); // Bind the deduplicated data to rowData
        } catch (err) {
            console.error("Error loading task data:", err);
            //toast.error(`Failed to load tasks: ${err.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to validate dates
    const isValidDate = (date: any) => {
        if (!date) return false;
        const d = new Date(date);
        return d instanceof Date && !isNaN(d.getTime());
    };

    // Row transformation function
    const rowTransform = (item: Tasks, index: number) => {
        const formattedCallDateTime = isValidDate(item.callDateTime)
        ? new Date(item.callDateTime).toLocaleString("en-GB", { timeZone: "UTC" })
        : "Invalid Date";

    // Generate a truly unique ID using taskId and callDateTime timestamp
    const uniqueId = item.taskId && isValidDate(item.callDateTime)
        ? `${item.taskId}-${new Date(item.callDateTime).getTime()}`
        : `${item.taskId || "no-id"}-${index}`;
    
            return {
                id: uniqueId, // Use taskId directly as the unique identifier
                taskId: item.taskId,
                callType: item.callType || "No Call Type Available",
                callDateTime: formattedCallDateTime,
                treatmentName: item.treatmentName || "No Treatment",
                personName: item.personName || "No Contact",
                phone: item.phone || "No Phone",
                email: item.email || "No Email",
                dueDate: isValidDate(item.dueDate)
            ? new Date(item.dueDate).toLocaleDateString("en-GB")
            : "No Due Date",
                duration: item.duration || 0,
                name: item.name || "No Call Type Available",
                startDate: isValidDate(item.startDate) ? new Date(item.startDate) : null,
                reminder: isValidDate(item.reminder) ? new Date(item.reminder) : null,
                todo: item.todo || "",
                priority: item.priority || "Normal",
                assignedTo: item.assignedTo || 0,
                taskDetails: item.taskDetails || "",
                dealId: item.dealId || 0,
                userName: item.userName || "Unknown",
                comments: item.comments || [],
                taskGUID: item.taskGUID || "",
                taskListGUID: item.taskListGUID || "",
                userGUID: item.userGUID || "",
                transactionId: item.transactionId || "",
                createdBy: item.createdBy || 0,
                createdDate: isValidDate(item.createdDate) ? new Date(item.createdDate) : null,
                modifiedBy: item.modifiedBy || 0,
                modifiedDate: isValidDate(item.modifiedDate) ? new Date(item.modifiedDate) : null,
                updatedBy: item.updatedBy || 0,
                updatedDate: isValidDate(item.updatedDate) ? new Date(item.updatedDate) : null,
            };
    };
    
    const removeDuplicates = (data: any[]) => {
        const uniqueRows = new Map(); // Use Map to ensure uniqueness
        data.forEach(row => uniqueRows.set(row.id, row)); // Map `id` to the entire row
        return Array.from(uniqueRows.values()); // Return only unique rows
    };
    // Handle row selection change
    const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
      console.log("Selection Changed: ", newSelection); // Add this
      setSelectedRows(newSelection);
      console.log("Updated Selected Rows: ", selectedRows); // Log after setting the selected rows
  };

    // Toggle all rows selection
    const toggleSelectAll = () => {
        if (selectAllChecked) {
            setSelectedRows([] as unknown as GridRowSelectionModel); // Clear selection if already selected
        } else {
            const allRowIds = rowData.map(row => row.taskId); // Use `id` instead of `taskId`
            setSelectedRows(allRowIds as unknown as GridRowSelectionModel);
        }
        setSelectAllChecked(!selectAllChecked); // Toggle checkbox state
    };

    // Open Group Email Dialog
    const openGroupEmailDialog = () => {
        setGroupEmailDialogOpen(true);
    };

    // Close Group Email Dialog
    const closeGroupEmailDialog = () => {
        setGroupEmailDialogOpen(false);
    };

    // Handle template selection
    const handleTemplateSelect = (template: EmailTemplate) => {
        setSelectedTemplate(template);
    };

    // Fetch templates on component mount
    useEffect(() => {
        if (!templatesLoaded && templates.length === 0 && !isLoadingTemplates) {
            isLoadingTemplates = true;
            setTemplatesLoaded(true);
            templateSvc.getEmailTemplates()
                .then((res: Array<EmailTemplate>) => {
                    setTemplates(res);
                })
                .catch((err) => {
                    console.error("Error loading templates:", err);
                    toast.error("Failed to load templates.");
                    setTemplatesLoaded(false); // Reset on error to allow retry
                })
                .finally(() => {
                    isLoadingTemplates = false;
                });
        }
    }, [templateSvc, templatesLoaded, templates.length]);

    // Load tasks on component mount
    useEffect(() => {
        loadTasksData(); // Load tasks directly
    }, []);

    // Column metadata
    const columnMetaData = [
        // {
        //     field: 'select',
        //     columnName: 'select',
        //     columnHeaderName: '',
        //     width: 50,
        //     sortable: false,
        //     disableColumnMenu: true,
        //     renderHeader: () => (
        //         <Checkbox
        //             indeterminate={selectedRows.length > 0 && selectedRows.length < rowData.length}
        //             checked={selectedRows.length === rowData.length && rowData.length > 0}
        //             onChange={() => setSelectedRows(selectedRows.length === rowData.length ? [] : rowData.map(row => row.taskId))} // Select All or Deselect All
        //             inputProps={{ 'aria-label': 'select all rows' }}
        //         />
        //     ),
        // },
        { columnName: "name", columnHeaderName: "Subject", width: 230},
        { columnName: "treatmentName", columnHeaderName: "Deal", width: 200 },
        { columnName: "personName", columnHeaderName: "Contact Person", width: 200 },
        { columnName: "email", columnHeaderName: "Email", width: 250 },
        { columnName: "phone", columnHeaderName: "Phone Number", width: 150 },
        { columnName: "dueDate", columnHeaderName: "Due Date", width: 150 },
        { columnName: "duration", columnHeaderName: "Duration (hours)", width: 150 },
    ];

    return (
        <>
            <ItemCollection
                itemName={"Activity"}
                itemType={Tasks}
                columnMetaData={columnMetaData}
                viewAddEditComponent={TaskAddEdit} 
                itemsBySubURL={"GetAllTask"} // Correct URL endpoint for getting tasks
                rowTransformFn={rowTransform}
                api={taskService} // Task service to interact with API
                enableCheckboxSelection={true} // This enables the selection mechanism
                onSelectionModelChange={handleSelectionChange} // Use the selection change handler
                rowData={rowData} // Pass row data
                isLoading={isLoading} // Show loading spinner if data is loading
                canDoActions={false}
                customRowData={true} // Prevent duplicate API calls
            />
            <GroupEmailDialog
                open={groupEmailDialogOpen}
                onClose={closeGroupEmailDialog}
                selectedRecipients={(selectedRows as unknown as any[]).map((id: any) => {
                  const person = rowData.find(row => row.taskId === id); // Ensure the ID is correctly matched
                  return person ? person.email : '';
              })}
                selectedTemplate={selectedTemplate}
                templates={templates}
                onTemplateSelect={handleTemplateSelect}
            />
        </>
    );
};

export default TasksList;
