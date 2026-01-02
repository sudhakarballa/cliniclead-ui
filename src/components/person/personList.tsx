import {
  DataGrid,
  GridCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import Checkbox from "@mui/material/Checkbox";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ItemCollection from "../../common/itemCollection";
import { Person } from "../../models/person";
import { personService } from "../../services/personService";
import { Button, TextField, Popover, Box } from "@mui/material"; // Add Popover and Box
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import PersonAddEditDialog from "../person/personAddEditDialog";
import React from "react";
import PluseIcon from "@mui/icons-material/Add"; // Add this for button icon
import GroupEmailDialog from "../GroupEmailDialog";
import { TemplateGrid } from "../emailCampaign/emailConfiguration/templateGrid";
import { EmailTemplate, EmailItemProps } from "../../models/emailTemplate";
import { EmailTemplateService } from "../../services/emailTemplateService";
import { AuthProvider } from "../pipeline/deal/activities/email/authProvider";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../pipeline/deal/activities/email/authConfig";
import "./personList.css";

const PersonList = () => {
  const MemoizedPersonAddEditDialog = React.memo(PersonAddEditDialog);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([] as unknown as GridRowSelectionModel);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [rowData, setRowData] = useState<Array<Person>>([]);
  const [loadRowData, setLoadRowData] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [groupEmailDialogOpen, setGroupEmailDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  // State for tracking which row and field is being edited
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [editFieldName, setEditFieldName] = useState<string>("");
  const [editFieldValue, setEditFieldValue] = useState<string>("");
    const { instance, accounts } = useMsal();
  const [visibleEditIcon, setVisibleEditIcon] = useState<{
    rowId: number;
    fieldName: string;
  } | null>(null);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  //const [forceRefreshKey, setForceRefreshKey] = useState(0);

  const personSvc = useMemo(() => new personService(ErrorBoundary), []);
  const templateSvc = useMemo(
    () => new EmailTemplateService(ErrorBoundary),
    []
  );

  const handleSelectionChange = 
    (newSelection: GridRowSelectionModel) => {
      
      setSelectedRows(newSelection); // Updates the state in PersonList
    }


  // Fetch templates on mount
  useEffect(() => {
    templateSvc
      .getEmailTemplates()
      .then((res: Array<EmailTemplate>) => {
        setTemplates(res); // Set the templates state
      })
      .catch((err) => {
        console.error("Error loading templates:", err);
        toast.error("Failed to load templates.");
      });
  }, [templateSvc]);
  const toggleSelectAll = () => {
    console.log("Select All Toggled");
    if (selectAllChecked) {
      console.log("Deselecting all rows");
      setSelectedRows([] as unknown as GridRowSelectionModel);
    } else {
      const allRowIds = rowData.map((row) => row.personID);
      console.log("Selecting all rows: ", allRowIds);
      setSelectedRows(allRowIds as unknown as GridRowSelectionModel);
    }
    setSelectAllChecked(!selectAllChecked);
  };
  const safeRender = (value: any) => {
    if (typeof value === "object") {
      return <span>[Object]</span>;
    }
    return <span>{value ?? ""}</span>;
  };

  // Handle the field click to show the edit icon and popover
  const handleEditClick = (
    rowId: number,
    fieldName: string,
    event: React.MouseEvent<HTMLElement>
  ) => {
    setVisibleEditIcon({ rowId, fieldName });
    setEditRowId(rowId); // Set the row ID for editing
    setEditFieldName(fieldName); // Set the field name for editing
    setAnchorEl(event.currentTarget); // Set the anchor element as the clicked field

    // Find the selected row data
    const selectedRow = rowData.find((row) => row.personID === rowId);

    if (selectedRow) {
      let fieldValue = "";

      // Access specific fields based on the fieldName
      switch (fieldName) {
        case "personName":
          fieldValue = selectedRow.personName;
          break;
        case "email":
          fieldValue = selectedRow.email;
          break;
        case "phone":
          fieldValue = selectedRow.phone;
          break;
        case "firstName":
          fieldValue = selectedRow.firstName;
          break;
        case "lastName":
          fieldValue = selectedRow.lastName;
          break;
        default:
          fieldValue = "";
          break;
      }

      // Set the field value to the TextField
      setEditFieldValue(fieldValue || "");
    }
  };

  const handleSave = async () => {
    const now = new Date();
    const updatedPerson = rowData.find(
      (person) => person.personID === editRowId
    ); // Ensure editRowId is being used
    if (!updatedPerson) return;

    // Update the corresponding field for the person object
    const newUpdatedPerson = { ...updatedPerson }; // Create a copy to ensure immutability
    switch (editFieldName) {
      case "personName":
        newUpdatedPerson.personName = editFieldValue;
        break;
      case "email":
        newUpdatedPerson.email = editFieldValue;
        break;
      case "phone":
        newUpdatedPerson.phone = editFieldValue;
        break;
      case "firstName":
        newUpdatedPerson.firstName = editFieldValue;
        break;
      case "lastName":
        newUpdatedPerson.lastName = editFieldValue;
        break;
      default:
        break;
    }

    newUpdatedPerson.modifiedBy = newUpdatedPerson.ownerID;
    newUpdatedPerson.modifiedDate = now;

    if (newUpdatedPerson.personID > 0) {
      newUpdatedPerson.createdBy = newUpdatedPerson.ownerID;
      newUpdatedPerson.createdDate = newUpdatedPerson.createdDate;
    } else {
      newUpdatedPerson.createdBy = newUpdatedPerson.ownerID;
      newUpdatedPerson.createdDate = now;
    }

    try {
      const response = await personSvc.putItemBySubURL(
        newUpdatedPerson,
        `${newUpdatedPerson.personID}`
      );
      if (response) {
        toast.success("Person updated successfully!");

        setRefreshKey((prevKey) => prevKey + 1);

        // Reset the edit state
        setAnchorEl(null);
        setEditRowId(null);
        setEditFieldValue("");
      }
    } catch (error) {
      console.error("Error updating person:", error);
      toast.error("Failed to update person.");
    }
  };

  const handleCancel = () => {
    setAnchorEl(null); // Clear the popover anchor when cancelling
    setEditRowId(null); // Clear editRowId
    setEditFieldValue(""); // Clear the field value
  };

  const handleFieldBlur = () => {
    setVisibleEditIcon(null); // Hide the edit icon when the field is blurred
  };

  // Column definitions for each field
  const columnMetaData = [
    // {
    //   field: "select",
    //   columnName: "select",
    //   columnHeaderName: "",
    //   width: 50,
    //   sortable: false,
    //   disableColumnMenu: true,
    //   renderHeader: () => (
    //     <Checkbox
    //       indeterminate={
    //         selectedRows.length > 0 && selectedRows.length < rowData.length
    //       }
    //       checked={selectedRows.length === rowData.length && rowData.length > 0}
    //       onChange={toggleSelectAll}
    //       inputProps={{ "aria-label": "select all rows" }}
    //     />
    //   ),
    // },
    // Person Name Field
    {
      field: "personName",
      columnName: "personName",
      columnHeaderName: "Person Name",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <Box
          display="flex"
          alignItems="center"
          onClick={(event) =>
            handleEditClick(params.row.personID, "personName", event)
          }
          onBlur={handleFieldBlur} // Hide the icon when focus leaves the field
        >
          <span>{String(params.value)}</span>
          {visibleEditIcon?.rowId === params.row.personID &&
            visibleEditIcon?.fieldName === "personName" && (
              <Button
                onClick={(e) =>
                  handleEditClick(params.row.personID, "personName", e)
                }
                startIcon={<EditIcon />}
                style={{ minWidth: "24px", marginLeft: "8px" }}
              />
            )}
        </Box>
      ),
    },
    // Email Field
    {
      field: "email",
      columnName: "email",
      columnHeaderName: "Email",
      width: 250,
      renderCell: (params: GridCellParams) => (
        <Box
          display="flex"
          alignItems="center"
          onClick={(event) =>
            handleEditClick(params.row.personID, "email", event)
          } // Corrected argument count
          onBlur={handleFieldBlur} // Hide the icon when focus leaves the field
        >
          <span>{String(params.value)}</span>
          {visibleEditIcon?.rowId === params.row.personID &&
            visibleEditIcon?.fieldName === "email" && (
              <Button
                onClick={(e) =>
                  handleEditClick(params.row.personID, "email", e)
                } // Corrected argument count
                startIcon={<EditIcon />}
                style={{ minWidth: "24px", marginLeft: "8px" }}
              />
            )}
        </Box>
      ),
    },
    // Phone Field
    {
      field: "phone",
      columnName: "phone",
      columnHeaderName: "Phone",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <Box
          display="flex"
          alignItems="center"
          onClick={(event) =>
            handleEditClick(params.row.personID, "phone", event)
          }
          onBlur={handleFieldBlur} // Hide the icon when focus leaves the field
        >
          <span>{String(params.value)}</span>
          {visibleEditIcon?.rowId === params.row.personID &&
            visibleEditIcon?.fieldName === "phone" && (
              <Button
                onClick={(e) =>
                  handleEditClick(params.row.personID, "phone", e)
                }
                startIcon={<EditIcon />}
                style={{ minWidth: "24px", marginLeft: "8px" }}
              />
            )}
        </Box>
      ),
    },
    // First Name Field
    {
      field: "firstName",
      columnName: "firstName",
      columnHeaderName: "First Name",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <Box
          display="flex"
          alignItems="center"
          onClick={(event) =>
            handleEditClick(params.row.personID, "firstName", event)
          }
          onBlur={handleFieldBlur} // Hide the icon when focus leaves the field
        >
          <span>{String(params.value)}</span>
          {visibleEditIcon?.rowId === params.row.personID &&
            visibleEditIcon?.fieldName === "firstName" && (
              <Button
                onClick={(e) =>
                  handleEditClick(params.row.personID, "firstName", e)
                }
                startIcon={<EditIcon />}
                style={{ minWidth: "24px", marginLeft: "8px" }}
              />
            )}
        </Box>
      ),
    },
    // Last Name Field
    {
      field: "lastName",
      columnName: "lastName",
      columnHeaderName: "Last Name",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <Box
          display="flex"
          alignItems="center"
          onClick={(event) =>
            handleEditClick(params.row.personID, "lastName", event)
          }
          onBlur={handleFieldBlur} // Hide the icon when focus leaves the field
        >
          <span>{String(params.value)}</span>
          {visibleEditIcon?.rowId === params.row.personID &&
            visibleEditIcon?.fieldName === "lastName" && (
              <Button
                onClick={(e) =>
                  handleEditClick(params.row.personID, "lastName", e)
                }
                startIcon={<EditIcon />}
                style={{ minWidth: "24px", marginLeft: "8px" }}
              />
            )}
        </Box>
      ),
    },
    {
      field: "name",
      columnName: "name",
      columnHeaderName: "Organization",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
    {
      field: "labelName",
      columnName: "labelName",
      columnHeaderName: "Label",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
    {
      field: "userName",
      columnName: "userName",
      columnHeaderName: "Username",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
    {
      field: "sourceName",
      columnName: "sourceName",
      columnHeaderName: "Source",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
    {
      field: "openDeals",
      columnName: "openDeals",
      columnHeaderName: "Open Deal",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
    {
      field: "closedDeals",
      columnName: "closedDeals",
      columnHeaderName: "Closed Deals",
      width: 150,
      renderCell: (params: GridCellParams) => {
        return safeRender(params.value);
      },
    },
  ];

  const loadData = () => {
    setIsLoading(true);
    personSvc
      .getPersons()
      .then((res: Array<Person>) => {
        const transformedData = res.map(rowTransform);
        // Sort by createdDate (or modifiedDate if you want most recently updated at top)
        transformedData.sort((a, b) => {
          const dateA = new Date(a.modifiedDate || a.createdDate || 0).getTime();
          const dateB = new Date(b.modifiedDate || b.createdDate || 0).getTime();
          return dateB - dateA; // Descending order
        });
        setRowData((prevRowData) => {
          if (JSON.stringify(transformedData) !== JSON.stringify(prevRowData)) {
            return transformedData;
          }
          return prevRowData; // No change, return the previous state
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setIsLoading(false);
      });
  };
  const rowTransform = (item: Person, index: number) => {
    return {
      ...item,
      id: item.personID > 0 ? item.personID : index,
      openDeals: item.openDeals !== undefined ? item.openDeals : 0,
      closedDeals: item.closedDeals !== undefined ? item.closedDeals : 0,
    };
  };
  useEffect(() => {
    loadData();
  }, [refreshKey]); // Run on mount and when refreshKey changes

  // Open the Group Email Dialog
  const openGroupEmailDialog = () => {
    setGroupEmailDialogOpen(true);
  };

  // Close the Group Email Dialog
  const closeGroupEmailDialog = () => {
    setGroupEmailDialogOpen(false);
  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template); // Use the correct type here
  };

  const handleMsalLogin = async () => {
    
    if (accounts.length == 0) {
      try {
        let res = await instance.loginPopup(loginRequest);
        console.log("Login successful", res);
        setGroupEmailDialogOpen(true);
      } catch (error) {
        console.error("Login failed", error);
        toast.error("Unable to login into email account, please reach out to administrator");
      }
    } else {
      setGroupEmailDialogOpen(true);
    }
  };

  return (
    <>
        <ItemCollection
          key={refreshKey}
          itemName={"Person"}
          itemType={Person}
          columnMetaData={columnMetaData}
          viewAddEditComponent={MemoizedPersonAddEditDialog}
          itemsBySubURL={"GetAllPersonDetails"}
          api={new personService(ErrorBoundary)}
          rowData={rowData}
          openGroupEmailDialog={(e:any)=>handleMsalLogin()}
          onSelectionModelChange={(e:any)=>handleSelectionChange(e)}
          checkboxSelection={true}
          customRowData={true}
          isLoading={isLoading}
        />
        {groupEmailDialogOpen && (
          <GroupEmailDialog
            open={groupEmailDialogOpen}
            onClose={closeGroupEmailDialog}
            selectedRecipients={(selectedRows as unknown as any[]).map((id: any) => {
              const item = rowData.find((row: { personID: number; email: string }) => row.personID === id);
              return item ? item.email : '';
            }).filter(email => email)}
            selectedTemplate={selectedTemplate}
            templates={templates}
            onTemplateSelect={handleTemplateSelect}
          />
        )}

      {/* The Popover for inline editing */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        keepMounted
      >
        <div style={{ padding: 16 }}>
          <TextField
            label="Edit Field"
            value={editFieldValue}
            onChange={(e) => setEditFieldValue(e.target.value)}
            fullWidth
          />
          <div style={{ marginTop: 8 }}>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              style={{ marginRight: 8 }}
            >
              Save
            </Button>
            <Button onClick={handleCancel} color="secondary" variant="outlined">
              Cancel
            </Button>
          </div>
        </div>
      </Popover>
    </>
  );
};

export default PersonList;
