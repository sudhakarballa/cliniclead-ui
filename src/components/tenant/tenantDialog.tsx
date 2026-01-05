import { yupResolver } from "@hookform/resolvers/yup";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Switch, FormControlLabel } from "@mui/material";
import { AddEditDialog } from "../../common/addEditDialog";
import GenerateElements from "../../common/generateElements";
import { ViewEditProps } from "../../common/table";
import { IControl, ElementType } from "../../models/iControl";
import Util from "../../others/util";
import { Tenant } from "../../models/tenant";
import { TenantService } from "../../services/tenantService";
import { PREDEFINED_THEMES } from "../../others/themes";

type TenantFormData = {
  name: string;
  isActive: boolean;
  connectionString: string;
  tenantKey: string;
  theamCode: string;
  logo: string;
  emailCLinetId: string;
  port: string;
  smtpUsername: string;
  smtpPassword: string;
};

const TenantDialog: React.FC<ViewEditProps> = (props) => {
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

  const tenantSvc = new TenantService();

  // Check if connection string is encrypted (doesn't contain plain SQL connection string patterns)
  const isConnectionStringEncrypted = selectedItem?.connectionString && 
    selectedItem.connectionString.length > 0 &&
    !(selectedItem.connectionString.includes('Server=') || 
      selectedItem.connectionString.includes('Data Source=') ||
      selectedItem.connectionString.includes('Database=') ||
      selectedItem.connectionString.includes('User ID=') ||
      selectedItem.connectionString.includes('Password='));

  const controlsList: Array<IControl> = [
    {
      key: "Tenant Name",
      value: "name",
      isRequired: true,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "Tenant Key",
      value: "tenantKey",
      isRequired: true,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "Theme",
      value: "theamCode",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12,
      type: ElementType.dropdown
    },
    {
      key: "Logo",
      value: "logo",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "Email Client ID",
      value: "emailCLinetId",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "SMTP Username",
      value: "smtpUsername",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "Port",
      value: "port",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12
    },
    {
      key: "SMTP Password",
      value: "smtpPassword",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12,
      type: ElementType.password
    },
    {
      key: isConnectionStringEncrypted ? "Connection String (Encrypted)" : "Connection String",
      value: "connectionString",
      isRequired: true,
      isControlInNewLine: true,
      elementSize: 12,
      type: ElementType.textarea
    },
    {
      key: "Active",
      value: "isActive",
      isRequired: false,
      isControlInNewLine: true,
      elementSize: 12,
      type: ElementType.checkbox
    }
  ];

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Tenant Name is required"),
    connectionString: Yup.string().required("Connection String is required"),
    tenantKey: Yup.string().required("Tenant Key is required"),
    theamCode: Yup.string().default(''),
    logo: Yup.string().default(''),
    emailCLinetId: Yup.string().default(''),
    port: Yup.string().default(''),
    smtpUsername: Yup.string().default(''),
    smtpPassword: Yup.string().default(''),
    isActive: Yup.boolean().default(true)
  });

  const defaultValues: TenantFormData = {
    name: selectedItem?.name || '',
    connectionString: selectedItem?.connectionString || '',
    tenantKey: selectedItem?.tenantKey || '',
    theamCode: selectedItem?.theamCode || 'default',
    logo: selectedItem?.logo || '',
    emailCLinetId: selectedItem?.emailCLinetId || '',
    port: selectedItem?.port || '',
    smtpUsername: selectedItem?.smtpUsername || '',
    smtpPassword: selectedItem?.smtpPassword || '',
    isActive: selectedItem?.isActive === 'Active' || selectedItem?.isActive === true
  };

  const formOptions = {
    resolver: yupResolver(validationSchema),
    defaultValues
  };

  const methods = useForm<TenantFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues
  });
  const { handleSubmit, unregister, register, resetField, setValue, setError, watch } = methods;

  const oncloseDialog = () => {
    setDialogIsOpen(false);
  };

  const getListofItemsForDropdown = (item: any) => {
    if (item.value === "theamCode") {
      return PREDEFINED_THEMES.map((theme) => ({
        value: theme.id,
        name: theme.displayName,
      }));
    }
    return [];
  };

  const onChange = (value: any, item: any) => {
    if (item.value === "isActive") {
      const boolValue = value === true || value === "true" || value === 1 || value === "1";
      setValue("isActive" as keyof TenantFormData, boolValue);
      setSelectedItem((prev: any) => ({ ...prev, isActive: boolValue }));
    } else if (item.value === "theamCode") {
      setValue("theamCode" as keyof TenantFormData, value);
      setSelectedItem((prev: any) => ({ ...prev, theamCode: value }));
    } else {
      setValue(item.value as keyof TenantFormData, value);
      setSelectedItem((prev: any) => ({ ...prev, [item.value]: value }));
    }
  };

  const onSubmit = (item: any) => {
    let obj: Tenant = { ...selectedItem };
    obj = Util.toClassObject(obj, item);
    obj.createdBy = Util.UserProfile()?.userId;
    obj.id = obj.id ?? 0;
    
    // Ensure isActive is a proper boolean
    obj.isActive = Boolean(item.isActive);
    
    if (obj.id > 0) {
      obj.createdDate = new Date(selectedItem?.createdDate);
      obj.modifiedBy = Util.UserProfile()?.userId;
      obj.modifiedDate = new Date();
    }

    (obj.id > 0 
      ? tenantSvc.updateTenant(obj.id, obj) 
      : tenantSvc.createTenant(obj)
    ).then(res => {
      if (res) {
        toast.success(`Tenant ${obj.id > 0 ? 'updated' : 'created'} successfully`);
      }
      setLoadRowData(true);
      setDialogIsOpen(false);
    }).catch(err => {
      toast.error(`Unable to ${obj.id > 0 ? 'update' : 'save'} Tenant`);
    });
  };

  return (
    <>
      <FormProvider {...methods}>
        <AddEditDialog
          dialogIsOpen={dialogIsOpen}
          header={`${selectedItem.id > 0 ? 'Edit' : 'Add'} Tenant`}
          dialogSize={"xl"}
          onSave={handleSubmit(onSubmit)}
          closeDialog={oncloseDialog}
          onClose={oncloseDialog}
        >
          <>
            <div className="modelformfiledrow row" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="col-md-6">
                <div className="modelformbox ps-2 pe-2">
                  <GenerateElements
                    controlsList={controlsList.slice(0, Math.ceil(controlsList.length / 2))}
                    selectedItem={selectedItem}
                    getListofItemsForDropdown={getListofItemsForDropdown}
                    onChange={(value: any, item: any) => onChange(value, item)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="modelformbox ps-2 pe-2">
                  <GenerateElements
                    controlsList={controlsList.slice(Math.ceil(controlsList.length / 2))}
                    selectedItem={selectedItem}
                    getListofItemsForDropdown={getListofItemsForDropdown}
                    onChange={(value: any, item: any) => onChange(value, item)}
                  />
                </div>
              </div>
            </div>
          </>
        </AddEditDialog>
      </FormProvider>
    </>
  );
};

export default TenantDialog;