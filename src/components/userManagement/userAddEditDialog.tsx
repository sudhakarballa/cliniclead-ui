import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AddEditDialog } from "../../common/addEditDialog";
import Util from "../../others/util";
import { ElementType, IControl } from "../../models/iControl";
import GenerateElements from "../../common/generateElements";
import { UserService } from "../../services/UserService";
import { toast } from "react-toastify";
import { User } from "../../models/user";
import { Role } from "../../models/role";
import { Organization } from "../../models/organization";
import { ErrorBoundary } from "react-error-boundary";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import LocalStorageUtil from "../../others/LocalStorageUtil";
import { InferType } from "yup";
import { useAuthContext } from "../../contexts/AuthContext";
import { TenantService } from "../../services/tenantService";

const UsersAddEditDialog: React.FC<any> = (props) => {
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
    tenants = [],
    roles = [],
    ...others
  } = props;

  const userSvc = new UserService(ErrorBoundary);
  const [organizations, setOrganizations] = useState<Array<any>>([]);
  const { userProfile } = useAuthContext();

  
  const isMasterAdmin = Util.isMasterAdmin();
  const userTenantId = (userProfile as any)?.tenant?.[0]?.id || null;
  
  // Debug logging
  console.log('UserAddEditDialog - isMasterAdmin:', isMasterAdmin);
  console.log('UserAddEditDialog - tenants received:', tenants);
  console.log('UserAddEditDialog - roles received:', roles);
  

const numberRequired = (msg: string) =>
  Yup.number()
    .transform((val, orig) => (orig === '' || orig === null ? undefined : val))
    .typeError(msg)
    .required(msg);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    userName: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    phoneNumber: Yup.string().required("Required"),
    roleId: numberRequired("Role is required"),
    isActive: Yup.boolean().default(true),
    tenantId: numberRequired("Tenant is required"),
  });

type UserFormValues = InferType<typeof validationSchema>;

  // Controls for the form fields
  const controlsList: IControl[] = [
    {
      key: "First Name",
      value: "firstName",
      elementSize: 12,
      isRequired: true,
      sidebyItem: "Last Name",
    },
    {
      key: "Last Name",
      value: "lastName",
      elementSize: 12,
      isRequired: true,
      isSideByItem: true,
    },
    {
      key: "Username",
      value: "userName",
      elementSize: 12,
      isRequired: true,
      sidebyItem: "Email Address",
    },
    {
      key: "Email Address",
      value: "email",
      elementSize: 12,
      isRequired: true,
      isSideByItem: true,
    },
    {
      key: "Role",
      value: "roleId",
      elementSize: 12,
      type: ElementType.dropdown,
      options: roles,
      isRequired: true,
      sidebyItem: "Phone Number",
    },
    {
      key: "Phone Number",
      type: ElementType.number,
      value: "phoneNumber",
      elementSize: 12,
      isRequired: true,
      isSideByItem: true,
    }
  ];

  // Add tenant field for master admin
  if (isMasterAdmin) {
    controlsList.push({
      key: "Tenant",
      value: "tenantId",
      elementSize: 12,
      type: ElementType.dropdown,
      options: tenants,
      isRequired: true,
      sidebyItem: "Active",
    });
  }

  // Add Active field
  controlsList.push({
    key: "Active",
    value: "isActive",
    elementSize: 12,
    type: ElementType.checkbox,
    defaultValue: true,
    isSideByItem: isMasterAdmin,
    isControlInNewLine: !isMasterAdmin,
  });

  const getValidationsSchema = (list: Array<any>) => {
    return Yup.object().shape({
      ...Util.buildValidations(list),
    });
  };


const methods = useForm<UserFormValues>({
  resolver: yupResolver(validationSchema),
  defaultValues: {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
    tenantId: 0,
    isActive: true,
  },
});


  const { handleSubmit, setValue, setError, setFocus } = methods;

  const oncloseDialog = () => {
    setDialogIsOpen(false);
  };
const [usernameError, setUsernameError] = useState<string | undefined>();
  useEffect(() => {
    if (selectedItem?.userId > 0) {
      console.log('Selected item:', selectedItem); // Debug log
      // Set all form fields
      setValue("firstName" as never, selectedItem.firstName as never);
      setValue("lastName" as never, selectedItem.lastName as never);
      setValue("userName" as never, selectedItem.userName as never);
      setValue("email" as never, selectedItem.email as never);
      setValue("phoneNumber" as never, selectedItem.phoneNumber as never);
      
      // Find role ID - check both roleId and RoleID fields
      const roleIdValue = selectedItem.roleId || selectedItem.RoleID || 
        roles.find((role: any) => role.name === selectedItem.roleName)?.id;
      setValue("roleId" as never, roleIdValue as never);
      
      const tenantValue = selectedItem.tenantId || selectedItem.organizationID || selectedItem.organizationId;
      setValue("tenantId" as never, tenantValue as never);
      // Use the actual boolean value from selectedItem, not the transformed string
      const isActiveValue = selectedItem.isActive === true || selectedItem.isActive === 'Active';
      setValue("isActive", isActiveValue);
    } else if (!isMasterAdmin && userTenantId) {
      setValue("tenantId" as never, userTenantId as never);
    }
  }, [selectedItem]);

  const onChange = (value: any, item: any) => {
    const field = item.value;

    // Special handling for isActive slider (should always be boolean)
    if (field === "isActive") {
      let isActiveValue = value === true || value === "true" || value === 1 || value === "1";
      setValue("isActive" as never, isActiveValue as never);
      setSelectedItem((prev: any) => ({ ...prev, isActive: isActiveValue }));
      return;
    }
    // Auto-generate username when first or last name is entered
    if (field === "firstName" || field === "lastName") {
      const firstName =
        field === "firstName"
          ? value
          : (methods.getValues() as any)["firstName"];
      const lastName =
        field === "lastName" ? value : (methods.getValues() as any)["lastName"];
      if (firstName && lastName) {
        const generatedUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        setValue("userName" as never, generatedUsername as never);
      }
    }
     if (field === "roleId" || field === "tenantId") {
    // keep '' as '' so Yup shows "Required"
    const normalized = value === '' ? '' : Number(value);
    methods.setValue(field as any, normalized as any, { shouldValidate: true });
    
    // Update selectedItem with both roleId and RoleID for role changes
    if (field === "roleId") {
      setSelectedItem((prev: any) => ({ ...prev, roleId: normalized, RoleID: normalized }));
    } else {
      setSelectedItem((prev: any) => ({ ...prev, [field]: normalized }));
    }
    return;
  }

  methods.setValue(field as any, value as any, { shouldValidate: true });
  setSelectedItem((prev: any) => ({ ...prev, [field]: value }));
  };
  const getListofItemsForDropdown = (item: any) => {
    if (item.value === "roleId") {
      return roles.map((role: any) => ({
        value: role.id,
        name: role.name,
      }));
    }

    if (item.value === "tenantId") {
      return tenants.map((tenant: any) => ({
        value: tenant.id,
        name: tenant.name,
      }));
    }
    return [];
  };
  const generateRandomStamp = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };
  const onSubmit = async (item: any) => {
  try {
    let obj: User = { ...selectedItem };
    obj = Util.toClassObject(obj, item);
    obj.passwordHash = "test";

    // Update only editable fields
    obj.firstName = item.firstName;
    obj.lastName = item.lastName;
    obj.email = item.email;
    obj.userName = item.userName;
    obj.phoneNumber = item.phoneNumber;
    obj.isActive = item.isActive;

    obj.roleId = item.roleId !== null ? Number(item.roleId) : 0;
    const finalTenantId = isMasterAdmin ? (item.tenantId !== null ? Number(item.tenantId) : 0) : userTenantId;
    obj.organizationId = finalTenantId;
    obj.tenantId = finalTenantId;
    obj.lastLogin = new Date();
    const loggedInUserId = userProfile?.userId || (userProfile as any)?.userId;
    obj.createdBy = loggedInUserId ? String(loggedInUserId) : null;
    obj.modifiedBy = obj.userId > 0 && loggedInUserId ? String(loggedInUserId) : null;
    obj.Id = obj.userId ?? 0;
    obj.userId = obj.userId ?? 0;

    // Date handling
    const isValidDate = (d: any) => {
      if (!d) return false;
      const dateObj = new Date(d);
      return !isNaN(dateObj.getTime());
    };

    if (obj.userId > 0) {
      obj.createdDate = isValidDate(obj.createdDate) ? new Date(obj.createdDate) : new Date();
      obj.modifiedDate = new Date();
    } else {
      obj.createdDate = new Date();
      obj.modifiedDate = new Date();
    }

    // Add SecurityStamp and ConcurrencyStamp fields
    obj.securityStamp = obj.securityStamp || generateRandomStamp();
    obj.concurrencyStamp = obj.concurrencyStamp || generateRandomStamp();

    // ============ BACKEND API CALL ============
    const response =
      obj.Id > 0
        ? await userSvc.putItemBySubURL(obj, `${obj.Id}`)
        : await userSvc.postItem(obj);

    if (response?.Success === false || response?.success === false) {
      toast.error(response.message || "User creation failed.");
    } else {
      toast.success(`User ${obj.Id > 0 ? "updated" : "created"} successfully`);
      setLoadRowData(true);
      setDialogIsOpen(false); // ✅ Close on success only
    }

  } catch (err: any) {
  const msg =
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong.";

  // Popup
  toast.error(msg);
  }
};

  return (
    <FormProvider {...methods}>
      <AddEditDialog
        dialogIsOpen={dialogIsOpen}
        header={`${selectedItem?.userId > 0 ? "Edit" : "Add"} User`}
        dialogSize={"m"}
        onSave={handleSubmit(onSubmit)}
        closeDialog={oncloseDialog}
        onClose={oncloseDialog}
      >
        {selectedItem["roleID"]}
        <div className="modelformfiledrow row">
          <div className="modelformbox ps-2 pe-2">
            <GenerateElements
              controlsList={controlsList}
              selectedItem={selectedItem}
              getListofItemsForDropdown={getListofItemsForDropdown}
              onChange={onChange}
             
            />
            <br />
          </div>
        </div>
      </AddEditDialog>
    </FormProvider>
  );
};

export default UsersAddEditDialog;
