import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm } from "react-hook-form";
import AsyncSelect from "react-select/async";
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { AddEditDialog } from "../../../common/addEditDialog";
import GenerateElements from "../../../common/generateElements";
import { Deal } from "../../../models/deal";
import { ElementType, IControl } from "../../../models/iControl";
import { PipeLine } from "../../../models/pipeline";
import { Stage } from "../../../models/stage";
import { Utility } from "../../../models/utility";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import Constants from "../../../others/constants";
import Util from "../../../others/util";
import { ClinicService } from '../../../services/clinicService';
import { DealService } from "../../../services/dealService";
import { personService } from "../../../services/personService";
import { PipeLineTypeService } from "../../../services/pipeLineTypeService";
import { SourceService } from "../../../services/sourceService";
import { StageService } from "../../../services/stageService";
import { TreatmentService } from "../../../services/treatmenetService";

type params = {
    dialogIsOpen: boolean;
    setDialogIsOpen: any;
    onSaveChanges: any;
    index?: number;
    pipeLinesList: Array<PipeLine>
    selectedPipeLineId?: number;
    selectedStageId?:any;
}
export const DealAddEditDialog = (props: params) => {
    
    const { dialogIsOpen, setDialogIsOpen, onSaveChanges, index, pipeLinesList, selectedPipeLineId, selectedStageId, ...others } = props;
    const [stages, setStages] = useState<Array<Stage>>([]);
    const [pipelineTypes, setPipelineTypes] = useState<Array<{ name: string, value: number }>>([]);
    
    const [selectedItem, setSelectedItem] = useState<SelectedItem>({
        ...new Deal(),
        pipelineID: selectedPipeLineId ?? pipeLinesList[0]?.pipelineID,
        contactPersonID: null,
        newContact: {
            personName: "",
            email: "",
            phone: "",
        },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const dealsSvc = new DealService(ErrorBoundary);
    const stagesSvc = new StageService(ErrorBoundary);
    const pipeLineTypeSvc = new PipeLineTypeService(ErrorBoundary);
    const clinicSvc = new ClinicService(ErrorBoundary);
    const treatmentSvc = new TreatmentService(ErrorBoundary);
    const sourceSvc = new SourceService(ErrorBoundary);
    const personSvc = new personService(ErrorBoundary); 
    const utility: Utility = JSON.parse(LocalStorageUtil.getItemObject(Constants.UTILITY) as any);
    const [persons, setPersons] = useState(utility?.persons ?? []);
    const [clinics, setClinics] = useState<Array<{ name: string, value: number }>>([]);
    const [treatments, setTreatments] = useState<Array<{ name: string, value: number }>>([]);
    const [sources, setSources] = useState<Array<{ name: string, value: number }>>([]);

    const controlsList1: Array<IControl> = [
        { key: "Contact Person", value: "contactPersonID", sidebyItem: "Deal Value", type: ElementType.custom, isRequired: true },
        { key: "Deal Value", value: "value", type: ElementType.textbox, isSideByItem: true, isRequired: true },
        { key: "Title", value: "title", sidebyItem: "Probability Of Winning", type: ElementType.textbox, isRequired: true },
        { key: "Probability Of Winning", value: "probability", type: ElementType.textbox, isSideByItem: true, isRequired: true },
        { key: "Expected Close Date", value: "expectedCloseDate", type: ElementType.datepicker, sidebyItem: "Phone", isRequired: true },
        { key: "Phone", value: "phone", type: ElementType.textbox, isSideByItem: true, isRequired: true },
        { key: "Email", value: "email", type: ElementType.textbox, sidebyItem: "Treatment", isRequired: true },
        { key: "Treatment", value: "treatmentID", type: ElementType.dropdown, isSideByItem: true, isRequired: true },
    ];
    
   const controlsList2: Array<IControl> = [
  { key: "Pipeline", value: "pipelineID", type: ElementType.dropdown, isRequired: true, sidebyItem: "Operation Date" },
  { key: "Operation Date", value: "operationDate", type: ElementType.datepicker, isSideByItem: true, isRequired: true },

  { key: "Stage", value: "stageID", type: ElementType.custom, isRequired: true, sidebyItem: "Lead Source", disabled: !Util.isNullOrUndefinedOrEmpty(selectedStageId) },
  { key: "Lead Source", value: "leadSourceID", type: ElementType.dropdown, isSideByItem: true, isRequired: true },

  { key: "Pipeline Type", value: "pipelineTypeID", type: ElementType.dropdown, isRequired: true, sidebyItem: "Clinic" },
  { key: "Clinic", value: "clinicID", type: ElementType.dropdown, isSideByItem: true, isRequired: true },
];
    const controlsList = [controlsList1, controlsList2];

    const formatDate = (date: Date | string, format: string): string => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = d.getFullYear();
    
        if (format === "yyyy-MM-dd") {
            return `${year}-${month}-${day}`;
        } else if (format === "MM/DD/YYYY") {
            return `${month}/${day}/${year}`;
        }
        throw new Error("Unsupported date format");
    };
    

    const oncloseDialog = () => {
        setDialogIsOpen(false);
    }
    // Fetch persons for autocomplete
    const fetchContacts = async (inputValue: string): Promise<ContactOption[]> => {
        if (!inputValue || inputValue.trim().length === 0) {
          return [];
        }
        
        try {
          const response = await personSvc.searchPersons(inputValue);
          console.log('API Response:', response);
          
          const options: ContactOption[] = [];
          
          if (Array.isArray(response) && response.length > 0) {
            response.forEach((person: any) => {
              options.push({
                label: `${person.personName} (${person.email || "No Email"})`,
                value: person.personID,
                details: person,
              });
            });
          }
      
          options.push({
            label: `+ Add '${inputValue}' as new contact`,
            value: "new",
            isNew: true,
            inputValue,
          });
          
          console.log('Returning options:', options);
          return options;
        } catch (error: any) {
          console.log("Error fetching contacts - returning add new option:", error?.response?.status);
          if (error?.response?.status === 404 || error?.message?.includes('404')) {
            return [
              {
                label: `+ Add '${inputValue}' as new contact`,
                value: "new",
                isNew: true,
                inputValue,
              },
            ];
          }
          throw error;
        }
      };
    
  const getValidationsSchema = (list: Array<any>) => {
    return Yup.object().shape({
      ...Util.buildValidations(list),
    });
  };

  const formOptions = {
    resolver: yupResolver(getValidationsSchema(controlsList1).concat(getValidationsSchema(controlsList2))),
  };
    
  const methods = useForm(formOptions);
    type SelectedItem = {
        pipelineID: number | null;
        stageID?: number;
        contactPersonID: number | null;
        newContact?: {
            personName: string;
            email?: string;
            phone?: string;
        };
        [key: string]: any;
    };
    
    type ContactOption = {
        label: string;
        value: any;
        isNew?: boolean;
        inputValue?: string;
        isDisabled?: boolean;
        details?: {
            personName: string;
            email?: string;
            phone?: string;
            contactPersonID?: number;
        };
    };
   

    useEffect(() => {
        
        setIsLoading(true);
        sourceSvc.getSources().then(res => {
            const sourceList = (res as Array<{ sourceName: string, sourceID: number }>).map(source => ({
                name: source.sourceName,
                value: source.sourceID,
            }));
            setSources(sourceList);
            setIsLoading(false);
        }).catch(err => {
            toast.error("Failed to fetch sources.");
            setIsLoading(false);
        });
        clinicSvc.getClinics().then(res => {
            const clinicList = (res as Array<{ clinicName: string, clinicID: number }>).map(clinic => ({
                name: clinic.clinicName,
                value: clinic.clinicID,
            }));
            setClinics(clinicList);
            setIsLoading(false);
        }).catch(err => {
            toast.error("Failed to fetch clinics.");
            setIsLoading(false);
        });
        treatmentSvc.getTreatments().then(res => {
            const treatmentList = (res as Array<{ treatmentName: string, treatmentID: number }>).map(treatment => ({
                name: treatment.treatmentName,
                value: treatment.treatmentID,
            }));
            setTreatments(treatmentList);
            setIsLoading(false);
        }).catch(err => {
            toast.error("Failed to fetch treatments.");
            setIsLoading(false);
        });
    
        let defaultPipeLine = selectedPipeLineId ?? pipeLinesList[0]?.pipelineID;
        setSelectedItem({ ...selectedItem, "pipelineID": +defaultPipeLine });
        loadStages(defaultPipeLine);
        loadPipelineTypes();
    }, [])

    const loadStages = (selectedPipeLineId: number) => {
        if (selectedPipeLineId > 0) stagesSvc.getStages(selectedPipeLineId).then(items => {
            let sortedStages = Util.sortList(items.stageDtos, "stageOrder");
            setStages(sortedStages);
            setValue("stageID" as never, items.stageDtos[0]?.stageID as never);
            setSelectedItem({ ...selectedItem, "pipelineID": +selectedPipeLineId, "stageID": selectedStageId ?? items.stageDtos[0]?.stageID });
            setIsLoading(false);
        }).catch(err => {
        });
    }
    const loadPipelineTypes = () => {
        pipeLineTypeSvc.getPipelineTypes().then(res => {
            const pipelineTypeList = (res as Array<{ pipelineTypeName: string, pipelineTypeID: number }>).map(type => ({
                name: type.pipelineTypeName,
                value: type.pipelineTypeID,
            }));
            setPipelineTypes(pipelineTypeList);
            setIsLoading(false);
        }).catch(err => {
            toast.error("Failed to fetch pipeline types.");
            setIsLoading(false);
        });
    };
    
    const onChange = (value: any, item: any) => {
        

        if (item.key === "Pipeline") {
            setSelectedItem({ ...selectedItem, "pipelineID": +value > 0 ? +value : null as any });
            setStages([])
            if (+value > 0) loadStages(+value);
        }

        if (item.key === "Expected Close Date") {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
                setValue("expectedCloseDate"  as never, parsedDate  as never); // Ensure it's a valid Date object
                setSelectedItem({ ...selectedItem, expectedCloseDate: parsedDate });
            }
        }
        if (item.key === "Operation Date") {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
                setValue("operationDate"  as never, parsedDate  as never); // Ensure it's a valid Date object
                setSelectedItem({ ...selectedItem, operationDate: parsedDate });
            }
        }
    };

    const getPipeLines = () => {
        let list: Array<any> = [];
        pipeLinesList.forEach(s => {
            let obj = { "name": s.pipelineName, value: s.pipelineID };
            list.push(obj);
        });
        return list;
    }

    const getJsxForStage = () => {
        return (
             <div className="row mb-3">
            <div className="col-12"></div>
            <div className="col-sm-6 pipelinestage-selector pipelinestage-active" aria-disabled={isLoading}>
                {
                    stages.map((sItem, sIndex) => (
                        <div key={sIndex} className={'pipelinestage ' + (sItem.stageID == selectedItem.stageID ? 'pipelinestage-current' : '')} aria-label={sItem.stageName} title={sItem.stageName} onClick={(e: any) => {setValue("stageID" as never, sItem.stageID as never); setSelectedItem({ ...selectedItem, "stageID": sItem.stageID })}}></div>
                    ))
                }
            </div>
            </div>
        )
    }
    const { handleSubmit, resetField, setValue, setError } = methods;
    
    const onSubmit = (item: any) => {
        if (isSubmitting) return; // Prevent duplicate submissions
        setIsSubmitting(true);
        
        console.log("Form item submitted: ", item);
        console.log("Selected item state: ", selectedItem);
    
        // Construct the Deal object
        let addUpdateItem: Deal = new Deal();
        addUpdateItem.createdBy = Util.UserProfile()?.userId;
        addUpdateItem.createdDate = new Date();
        Util.toClassObject(addUpdateItem, item);
    
        addUpdateItem.pipelineID = selectedItem.pipelineID!;
        addUpdateItem.stageID = selectedItem.stageID!;
        addUpdateItem.clinicID = item.clinicID;
        addUpdateItem.pipelineTypeID = item.pipelineTypeID;
        addUpdateItem.treatmentID = item.treatmentID;
        addUpdateItem.sourceID = item.leadSourceID;
        addUpdateItem.phone = item.phone;
        addUpdateItem.email = item.email;
        addUpdateItem.organizationID = 1; // Hardcoded value
    
        if (selectedItem.expectedCloseDate) {
            const parsedDate = new Date(selectedItem.expectedCloseDate);
            addUpdateItem.expectedCloseDate = isNaN(parsedDate.getTime())
                ? null
                : formatDate(parsedDate, "yyyy-MM-dd");
        } else {
            addUpdateItem.expectedCloseDate = null;
        }
    
        if (selectedItem.operationDate) {
            const parsedDate = new Date(selectedItem.operationDate);
            addUpdateItem.operationDate = isNaN(parsedDate.getTime())
                ? null
                : formatDate(parsedDate, "yyyy-MM-dd");
        } else {
            addUpdateItem.operationDate = null;
        }
    
        // Handle new contact creation or existing contact
    let newContact = null;
    if (selectedItem.contactPersonID === -1 && selectedItem.newContact) {
        const names = selectedItem.newContact.personName.split(" ");
        const firstName = names[0];
        const lastName = names.slice(1).join(" ");

        newContact = {
            ...selectedItem.newContact,
            firstName: firstName || "",
            lastName: lastName || "",
        };
        //delete addUpdateItem.contactPersonID; // Remove contactPersonID for new contact
    } else {
        addUpdateItem.contactPersonID = selectedItem.contactPersonID!;
    }
        // Wrap the payload in the expected structure
        const payload = {
            Deal: addUpdateItem, // Encapsulate the deal in a Deal object
            NewContact: newContact, // Include the new contact if applicable
        };
    
        console.log("Payload being sent: ", payload);
    
        // Send the payload to the API
        dealsSvc.postItemBySubURL(payload, "saveDealDetails").then((res) => {
            if (res.success && res.dealID > 0) {
                toast.success("Deal added successfully");
                setTimeout(() => {
                    setDialogIsOpen(false);
                    props.onSaveChanges();
                }, 500);
            } else {
                toast.error(res.message || "Unable to add Deal");
            }
        }).catch((error) => {
            console.error("Error saving deal: ", error);
            const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while saving the deal.";
            toast.error(errorMessage);
        }).finally(() => {
            setIsSubmitting(false);
        });
    };
    const getCustomElement = (item: IControl) => {
        if (item.key === "Stage") {
            // Custom rendering logic for Stage
            return getJsxForStage();
        }
        if (item.key === "PersonDivider") {
            return (
                <div className="section-person-divider d-flex align-items-center mt-3 mb-3">
                    <h6 className="section-person-label me-2">Person</h6>
                    <hr className="flex-grow-1 section-divider" />
                </div>
            );
        }

        if (item.key === "Contact Person") {
          return (
            <AsyncSelect<ContactOption>
              loadOptions={fetchContacts}
              defaultOptions={false}
              isClearable
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base:any) => ({ ...base, zIndex: 9999 }),
                option: (
                  provided: any,
                  state: { data: { isNew: any }; isFocused: any }
                ) => {
                  const isAddNewOption = state.data.isNew;
                  return {
                    ...provided,
                    backgroundColor: state.isFocused
                      ? isAddNewOption
                        ? "#e0f3ff"
                        : "#f0f0f0"
                      : "white",
                    color: isAddNewOption ? "#007bff" : "black",
                    fontWeight: isAddNewOption ? "bold" : "normal",
                  };
                },
              } as any}
              onChange={(newValue: any) => {
                
                let value = +newValue?.value > 0 ? +newValue?.value : null;
                setSelectedItem({ ...selectedItem, "contactPersonID": value as any });
                setValue("contactPersonID" as never, value as never);
                if (!newValue) return;

                if (newValue.isNew) {
                  // Handle new contact creation
                  setSelectedContact(null); // Clear selected contact
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    contactPersonID: -1, // Temporary ID for new contact
                    newContact: {
                      personName: newValue.inputValue || "",
                      email: "",
                      phone: "",
                    },
                  }));

                  // Clear phone and email for new contacts
                  setValue("phone" as never, "" as never);
                  setValue("email" as never, "" as never);
                } else {
                  // Handle selecting an existing contact
                  setSelectedContact(newValue.details); // Save selected contact
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    contactPersonID: newValue.value, // Save contact ID
                    phone: newValue.details?.phone || "",
                    email: newValue.details?.email || "",
                  }));

                  // Update form fields with existing contact details
                  setValue(
                    "phone" as never,
                    (newValue.details?.phone || "") as never
                  );
                  setValue(
                    "email" as never,
                    (newValue.details?.email || "") as never
                  );
                }
              }}
              onInputChange={(
                inputValue: any,
                actionMeta: { action: string }
              ) => {
                if (actionMeta.action === "input-change") {
                  // Update the typed input in the state
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    newContact: {
                      ...(prev.newContact || {}),
                      personName: inputValue,
                    },
                  }));

                  // Clear phone and email when typing a new contact name
                  setValue("phone" as never, "" as never);
                  setValue("email" as never, "" as never);

                  // Clear selectedContact to avoid conflicts
                  setSelectedContact(null);
                }
              }}
              placeholder="Search or Add Contact"
              value={
                selectedContact
                  ? {
                      label: selectedContact.personName,
                      value: selectedContact.contactPersonID,
                    }
                  : selectedItem.newContact?.personName
                  ? { label: selectedItem.newContact.personName, value: "new" }
                  : null
              }
              noOptionsMessage={() => "Type to search or add a new contact"}
            />
          );
        }
        return null;
    };

    const getValidationMessage = (item: IControl) => {
        const { formState: { errors } } = methods;
        if (item.key === "Contact Person" && (errors as any)?.contactPersonID) {
            return (
                <p className="text-danger" id={`validationMsgfor_${item.value}`}>
                    {(errors as any)?.contactPersonID?.message}
                </p>
            );
        }
        return null;
    };

    const getCustomElementWithValidation = (item: IControl) => {
        const customElement = getCustomElement(item);
        const validationMessage = getValidationMessage(item);
        
        if (customElement) {
            return (
                <>
                    {customElement}
                    {validationMessage}
                </>
            );
        }
        return null;
    };

    const getCustomElementOld = (item: IControl) => {
        if (item.key === "Stage") {
            // Custom rendering logic for Stage
            return getJsxForStage();
        }
        if (item.key === "PersonDivider") {
            return (
                <div className="section-person-divider d-flex align-items-center mt-3 mb-3">
                    <h6 className="section-person-label me-2">Person</h6>
                    <hr className="flex-grow-1 section-divider" />
                </div>
            );
        }

        if (item.key === "Contact Person") {
          return (
            <AsyncSelect<ContactOption>
              cacheOptions
              loadOptions={fetchContacts} // Function to fetch contacts
              defaultOptions // Show default options on focus
              onChange={(newValue: any) => {
                
                let value = +newValue?.value > 0 ? +newValue?.value : null;
                setSelectedItem({ ...selectedItem, "contactPersonID": value as any });
                setValue("contactPersonID" as never, value as never);
                if (!newValue) return;

                if (newValue.isNew) {
                  // Handle new contact creation
                  setSelectedContact(null); // Clear selected contact
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    contactPersonID: -1, // Temporary ID for new contact
                    newContact: {
                      personName: newValue.inputValue || "",
                      email: "",
                      phone: "",
                    },
                  }));

                  // Clear phone and email for new contacts
                  setValue("phone" as never, "" as never);
                  setValue("email" as never, "" as never);
                } else {
                  // Handle selecting an existing contact
                  setSelectedContact(newValue.details); // Save selected contact
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    contactPersonID: newValue.value, // Save contact ID
                    phone: newValue.details?.phone || "",
                    email: newValue.details?.email || "",
                  }));

                  // Update form fields with existing contact details
                  setValue(
                    "phone" as never,
                    (newValue.details?.phone || "") as never
                  );
                  setValue(
                    "email" as never,
                    (newValue.details?.email || "") as never
                  );
                }
              }}
              onInputChange={(
                inputValue: any,
                actionMeta: { action: string }
              ) => {
                if (actionMeta.action === "input-change") {
                  // Update the typed input in the state
                  setSelectedItem((prev: SelectedItem) => ({
                    ...prev,
                    newContact: {
                      ...(prev.newContact || {}),
                      personName: inputValue,
                    },
                  }));

                  // Clear phone and email when typing a new contact name
                  setValue("phone" as never, "" as never);
                  setValue("email" as never, "" as never);

                  // Clear selectedContact to avoid conflicts
                  setSelectedContact(null);
                }
              }}
              placeholder="Search or Add Contact"
              value={
                selectedContact // Use selectedContact if available
                  ? {
                      label: selectedContact.personName,
                      value: selectedContact.contactPersonID,
                    }
                  : selectedItem.newContact?.personName // Use typed input for new contacts
                  ? { label: selectedItem.newContact.personName, value: "new" }
                  : null // Fallback for no selection
              }
              noOptionsMessage={() => "Type to search or add a new contact"}
              styles={
                {
                  option: (
                    provided: any,
                    state: { data: { isNew: any }; isFocused: any }
                  ) => {
                    const isAddNewOption = state.data.isNew;
                    return {
                      ...provided,
                      backgroundColor: state.isFocused
                        ? isAddNewOption
                          ? "#e0f3ff" // Light blue for "Add new" hover
                          : "#f0f0f0" // Default hover color
                        : "white",
                      color: isAddNewOption ? "#007bff" : "black", // Blue text for "Add new"
                      fontWeight: isAddNewOption ? "bold" : "normal", // Bold for "Add new"
                    };
                  },
                } as any
              }
            />
          );
        }
    
        return null; // Return null for other keys if no custom element is needed
    };

    const getDropdownvalues = (item: any) => {
        if (item.key === "Pipeline") {
            return getPipeLines() ?? [];
        }
        if (item.key === "Organization") {

            return utility?.organizations.map(({ name, organizationID }) => ({ "name": name, "value": organizationID })) ?? [];
        }
        if (item.key === "Contact Person") {
            return utility?.persons.map(({ personName, personID }) => ({ "name": personName, "value": personID })) ?? [];
        }
        if (item.key === "Pipeline Type") {
            return pipelineTypes ?? [];
        }
        if (item.key === "Clinic") {
            return clinics ?? [];
        }
        if (item.key === "Treatment") {
            return treatments ?? [];
        }
        if (item.key === "Lead Source") {
            return sources ?? [];
        }
    }

    // const customFooter = () => {
    //     return (
    //         <>
    //             <div className='modalfootbar'>
    //                 {/* <div className="modelfootcountcol me-2">
    //                     <div className="modelfootcount me-2">1608/10000</div>
    //                     <button className="modelinfobtn"><i className="rs-icon rs-icon-info"></i></button>
    //                 </div> */}
    //                 <button onClick={oncloseDialog} className="btn btn-secondary btn-sm me-2" id="closeDialog">Cancel</button>
    //                 <button type="submit" className={`btn btn-primary btn-sm save`} onClick={handleSubmit(onSubmit)}>{"Save"}</button>
    //             </div>
    //         </>
    //     )
    // }

    return (
        <>
            {
                <FormProvider {...methods}>
                    <AddEditDialog dialogIsOpen={dialogIsOpen}
                        header={"Add Deal"}
                        closeDialog={oncloseDialog}
                        onClose={oncloseDialog}
                        onSave={handleSubmit(onSubmit, (errors) => {
                            console.log("Validation Errors:", errors);
                          })}
                          
                        // customFooter={customFooter()}
                        disabled={isLoading || isSubmitting}
                        >
                        {
                            <>
                                {isLoading && <div className="alignCenter"><Spinner /></div>}
                                <div className='modelformfiledrow row'>
                                    <div>
                                        <div className='modelformbox ps-2 pe-2' style={{maxHeight: '60vh', overflowY: 'auto'}}
                                             onKeyDown={(e: React.KeyboardEvent) => {
                                               if (e.key === 'Enter') {
                                                 e.preventDefault();
                                               }
                                             }}>
                                            {
                                                controlsList.map((c, cIndex) => (
                                                    <GenerateElements
                                                        controlsList={c}
                                                        selectedItem={selectedItem}
                                                        onChange={(value: any, item: any) => onChange(value, item)}
                                                        getListofItemsForDropdown={(e: any) => getDropdownvalues(e) as any}
                                                        getCustomElement={(item: IControl) => getCustomElementWithValidation(item)}
                                                        showDelete={false} 
                                                        forceHideTimeSelect={true} // Only for DealAddEditDialog
                                                    />
                                                ))
                                            }
                                            
                                            <br />
                                        </div>
                                    </div>
                                </div>

                            </>

                        }
                    </AddEditDialog>
                </FormProvider>
            }
        </>
    )
}