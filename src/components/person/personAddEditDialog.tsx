import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { AddEditDialog } from "../../common/addEditDialog";
import GenerateElements from "../../common/generateElements";
import { ViewEditProps } from "../../common/table";
import { ElementType, IControl } from "../../models/iControl";
import { Label } from "../../models/label";
import { Organization } from "../../models/organization";
import { Person } from "../../models/person";
import { Source } from '../../models/source';
import { User } from '../../models/user';
import { VisibilityGroup } from "../../models/visibilityGroup";
import Util from "../../others/util";
import { personService } from "../../services/personService";

const PersonAddEditDialog: React.FC<ViewEditProps> = (props) => {
    const {
        header,
        onSave,
        closeDialog,
        selectedItem,
        setSelectedItem,
        dialogIsOpen,
        setDialogIsOpen,
        isReadOnly,
        setIsReadOnly,
        setLoadRowData,
        ...others
    } = props;

    const personSvc = new personService(ErrorBoundary);
    const [organizations, setOrganizations] = useState<Array<{ name: string; value: string }>>([]);
    const [labels, setLabels] = useState<Array<{ name: string; value: string }>>([]);
    const [owners, setOwners] = useState<Array<{ name: string; value: string }>>([]);
    const [sources, setSources] = useState<Array<{ name: string; value: string }>>([]);
    const [visibilityGroups, setVisibilityGroups] = useState<Array<{ name: string; value: string }>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const controlsList: IControl[] = [
        { key: "First Name", value: "firstName", isRequired: true, sidebyItem: "Last Name", type: ElementType.textbox },
        { key: "Last Name", value: "lastName", isRequired: true, isSideByItem: true, type: ElementType.textbox },
        { key: "Person Name", value: "personName", isRequired: true, sidebyItem: "Email Address", type: ElementType.textbox },
        { key: "Email Address", value: "email", isRequired: true, isSideByItem: true, type: ElementType.textbox, regex1: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errMsg1: "Please enter a valid email address" },
        { key: "Phone Number", type: ElementType.textbox, inputMode: "tel", value: "phone", isRequired: true, sidebyItem: "Organization", regex1: phoneRegex, errMsg1: "Please enter a valid phone number" },
        { key: "Organization", value: "organizationID", isRequired: true, isSideByItem: true, type: ElementType.dropdown, options: organizations.map(org => ({ key: org.name, value: org.value })) },
        { key: "Label", value: "labelID", isRequired: true, sidebyItem: "Owner", type: ElementType.dropdown, options: labels.map(label => ({ key: label.name, value: label.value })) },
        { key: "Owner", value: "userID", isRequired: true, isSideByItem: true, type: ElementType.dropdown, options: owners.map(owner => ({ key: owner.name, value: owner.value })) },
        { key: "Source", value: "sourceID", isRequired: true, sidebyItem: "Visibility Group", type: ElementType.dropdown, options: sources.map(source => ({ key: source.name, value: source.value })) },
        { key: "Visibility Group", value: "visibilityGroupID", isRequired: true, isSideByItem: true, type: ElementType.dropdown, options: visibilityGroups.map(group => ({ key: group.name, value: group.value })) }
    ];

  const getValidationsSchema = (list: Array<any>) => {
    return Yup.object().shape({
      ...Util.buildValidations(list),
    });
  };

  const formOptions = {
    resolver: yupResolver(getValidationsSchema(controlsList)),
  };
    
  const methods = useForm(formOptions);
    const { handleSubmit, setValue } = methods;
    const { errors } = methods.formState;
    console.log('Validation errors:', errors);

    // Removed duplicate API calls - using Promise.all approach below

    const oncloseDialog = () => {
        setDialogIsOpen(false);
    };

    const onChange = (value: any, item: any) => {
        console.log(`Changing ${item.value} to ${value}`); // Debug log
        if (item.value === 'organizationID') {
            setValue('organizationID' as never, value as never);
        }
        if (item.value === 'labelID') {
            setValue('labelID' as never, value as never);
        }
        if (item.value === 'userID') {
            setValue('userID' as never, value as never);
        }
      
        if (item.value === 'sourceID') {
            setValue('sourceID' as never, value as never);
        }
        if (item.value === 'visibilityGroupID') {
            setValue('visibilityGroupID' as never, value as never);
        }
    }

    useEffect(() => {
        const fetchLabelsAndOrganizations = async () => {
            try {
                const [labelResponse,ownerResponse,sourceResponse,visibilityGroupResponse,organizationsResponse] = await Promise.all([
                    personSvc.getLabels(),
                    personSvc.getOwners(),
                    personSvc.getSources(),
                    personSvc.getVisibilityGroups(),
                    personSvc.getOrganizations()
                ]);
    
                if (labelResponse && Array.isArray(labelResponse)) {
                    setLabels(labelResponse.map((res: Label) => ({
                        value: res.labelID.toString(),
                        name: res.labelName
                    })));
                }
                if (ownerResponse && Array.isArray(ownerResponse)) {
                    setOwners(ownerResponse.map((res: User) => ({
                        value: res.userId.toString(),
                        name: res.userName
                    })));
                }
                if (sourceResponse && Array.isArray(sourceResponse)) {
                    setSources(sourceResponse.map((res: Source) => ({
                        value: res.sourceID.toString(),
                        name: res.sourceName
                    })));
                }
                if (visibilityGroupResponse && Array.isArray(visibilityGroupResponse)) {
                    setVisibilityGroups(visibilityGroupResponse.map((res: VisibilityGroup) => ({
                        value: res.visibilityGroupID.toString(),
                        name: res.visibilityGroupName
                    })));
                }
                if (organizationsResponse && Array.isArray(organizationsResponse)) {
                    setOrganizations(organizationsResponse.map((org: Organization) => ({
                        value: org.organizationID.toString(),
                        name: org.name
                    })));
                }
            } catch (error) {
                console.error('Error fetching roles and organizations:', error);
            }
        };
    
        fetchLabelsAndOrganizations();
    }, []);

    // Set form values when selectedItem changes and data is loaded
    useEffect(() => {
        if (selectedItem && organizations.length > 0 && labels.length > 0 && owners.length > 0 && sources.length > 0 && visibilityGroups.length > 0) {
            // Set all form values
            setValue('personName' as never, (selectedItem.personName || '') as never);
            setValue('firstName' as never, (selectedItem.firstName || '') as never);
            setValue('lastName' as never, (selectedItem.lastName || '') as never);
            setValue('email' as never, (selectedItem.email || '') as never);
            setValue('phone' as never, (selectedItem.phone || '') as never);
            setValue('organizationID' as never, (selectedItem.organizationID?.toString() || '') as never);
            setValue('labelID' as never, (selectedItem.labelID?.toString() || '') as never);
            setValue('userID' as never, (selectedItem.ownerID?.toString() || selectedItem.userId?.toString() || '') as never);
            setValue('sourceID' as never, (selectedItem.sourceID?.toString() || '') as never);
            setValue('visibilityGroupID' as never, (selectedItem.visibilityGroupID?.toString() || '') as never);
        }
    }, [selectedItem, organizations, labels, owners, sources, visibilityGroups, setValue]);
    
    const getListofItemsForDropdown = (item: any) => {
        if (item.value === 'labelID') {
            return labels.map(label => ({
                value: label.value,
                name: label.name
            }));
        }
        if (item.value === 'userID') {
            return owners.map(owner => ({
                value: owner.value,
                name: owner.name
            }));
        }
        
        if (item.value === 'sourceID') {
            return sources.map(source => ({
                value: source.value,
                name: source.name
            }));
        }  
        if (item.value === 'visibilityGroupID') {
            return visibilityGroups.map(vg => ({
                value: vg.value,
                name: vg.name
            }));
        }            
        if (item.value === 'organizationID') {
            return organizations.map(org => ({
                value: org.value,
                name: org.name
            }));
        }
        return [];
    };

    const onSubmit = async (item: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let obj: Person = { ...selectedItem };
            obj = Util.toClassObject(obj, item);
            obj.labelID = item.labelID !== null ? Number(item.labelID) : 0;
            obj.sourceID = item.sourceID !== null ? Number(item.sourceID) : 0;
            obj.ownerID = item.userID !== null ? Number(item.userID) : 0;
            obj.visibilityGroupID = item.visibilityGroupID !== null ? Number(item.visibilityGroupID) : 0;
            obj.organizationID = item.organizationID !== null ? Number(item.organizationID) : 0;
            obj.personID = obj.personID ?? 0;
            const userProfile = Util.UserProfile();
            const currentUserId = userProfile?.userId;
            const now = new Date();

            // Fix: Ensure createdDate is null if empty string or invalid
            if (
                obj.createdDate === undefined ||
                obj.createdDate === null ||
                (typeof obj.createdDate === 'string' && (obj.createdDate === '' || isNaN(Date.parse(obj.createdDate))))
            ) {
                obj.createdDate = null as any;
            }

            if (obj.personID > 0) {
                // Existing person: do not overwrite createdDate
                obj.createdBy = obj.ownerID;
                obj.modifiedBy = obj.ownerID;
                obj.modifiedDate = now;
            } else {
                // New person: set createdDate to now
                obj.createdBy = obj.ownerID;
                obj.createdDate = now;
            }

            obj.createdDate = new Date(obj.createdDate || now);
            obj.modifiedDate = new Date(obj.modifiedDate || now);
            const apiCall = obj.personID > 0
                ? personSvc.putItemBySubURL(obj, `${obj.personID}`)
                : personSvc.postItem(obj);
            await apiCall;
            toast.success(`Person ${obj.personID > 0 ? 'updated' : 'created'} successfully`);
            setLoadRowData(true);
            setDialogIsOpen(false);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <AddEditDialog
                dialogIsOpen={dialogIsOpen}
                header={`${selectedItem.userId > 0 ? 'Edit' : 'Add'} Person`}
                dialogSize={"lg"}
                onSave={handleSubmit(onSubmit)}
                closeDialog={oncloseDialog}
                onClose={oncloseDialog}
                saveButtonProps={{ disabled: isSubmitting }}
            >
                        <div className='modelformfiledrow row'>
                            <div>
                                <div className='modelformbox ps-2 pe-2'
                                     onKeyDown={(e: React.KeyboardEvent) => {
                                       if (e.key === 'Enter') {
                                         e.preventDefault();
                                       }
                                     }}>
                                    <GenerateElements
                                        controlsList={controlsList}
                                        selectedItem={selectedItem}
                                        getListofItemsForDropdown={getListofItemsForDropdown}
                                        onChange={onChange}
                                    />
                                    <br />
                                </div>
                            </div>
                        </div>
            </AddEditDialog>
        </FormProvider>
    );
};

export default PersonAddEditDialog;
