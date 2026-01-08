import { ErrorBoundary } from "react-error-boundary";
import ItemCollection from "../../common/itemCollection";
import { User } from "../../models/user";
import { UserService } from "../../services/UserService";
import UsersAddEditDialog from "../userManagement/userAddEditDialog";
import { useEffect, useState } from "react";
import Util from "../../others/util";
import LocalStorageUtil from "../../others/LocalStorageUtil";
import { Spinner } from "react-bootstrap";
import { Button, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import LockResetIcon from "@mui/icons-material/LockReset";
import moment from "moment";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { TenantService } from "../../services/tenantService";

const UsersList = () => {
  const userSvc = new UserService(ErrorBoundary);
  const tenantSvc = new TenantService();
  const [loadingData, setLoadingData] = useState(true);
  const [isUnlockClicked, setIsUnlockClicked] = useState(false);
  const [isResetpasswordClicked, setIsResetpasswordClicked] = useState(false);
  const [actionType, setActionType] = useState("");
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [userItem, setUserItem] = useState<User>(new User());
  const [loadRowData, setLoadRowData] = useState(true);
  const [isResendClicked, setIsResendClicked] = useState(false);
  const [tenants, setTenants] = useState<Array<any>>([]);
  const [roles, setRoles] = useState<Array<any>>([]);
  const isMasterAdmin = Util.isMasterAdmin();

  const columnMetaData = [
    { columnName: "userName", columnHeaderName: "Username", width: 150 },
    { columnName: "phoneNumber", columnHeaderName: "Phonenumber", width: 150 },
    { columnName: "email", columnHeaderName: "Email Address", width: 150 },
    ...(isMasterAdmin ? [{ columnName: "tenantName", columnHeaderName: "Tenant", width: 150 }] : []),
    { columnName: "roleName", columnHeaderName: "Role", width: 150 },
    { columnName: "statusBadge", columnHeaderName: "Status", width: 150 },
    { columnName: "modifiedDate", columnHeaderName: "Last Modified", width: 150 },
    { columnName: "lastLogin", columnHeaderName: "Last Login", width: 150 },
  ];

  useEffect(() => {
    setLoadingData(true);
    
    const hardcodedRoles = [
      { id: 1, name: "Admin", normalizedName: "ADMIN", concurrencyStamp: "7E7EC14F-BD52-4FE5-BEAF-A0A4D6132751", createdDate: "2024-08-15T15:38:48.6", createdBy: 1 },
      { id: 2, name: "Sales User", normalizedName: "SALES USER", concurrencyStamp: "878F6B12-1651-4651-8B30-C9131FF7D813", createdDate: "2024-08-15T12:52:17.73", createdBy: 1 },
      { id: 3, name: "Manager", normalizedName: "MANAGER", concurrencyStamp: "209B305E-7D78-4850-85B8-1258020F31C2", createdDate: "2024-08-15T12:52:17.73", createdBy: 1 }
    ];

    if (isMasterAdmin) {
      Promise.all([
        userSvc.getOrganizations().catch(() => []),
        tenantSvc.getItems().catch((err) => {
          console.error('Error fetching tenants:', err);
          return [];
        })
      ])
        .then((res) => {
          console.log('Fetched tenants for master admin:', res[1]); // Debug log
          setRoles(hardcodedRoles);
          LocalStorageUtil.setItemObject("userRoles", JSON.stringify(hardcodedRoles));
          LocalStorageUtil.setItemObject("organizations", JSON.stringify(res[0] || []));
          setTenants(res[1] || []);
        })
        .catch((error) => {
          console.error("Error fetching organizations or tenants:", error);
        })
        .finally(() => {
          setLoadingData(false);
        });
    } else {
      Promise.all([
        userSvc.getRoles().catch(() => []),
        userSvc.getOrganizations().catch(() => [])
      ])
        .then((res) => {
          setRoles(res[0] || []);
          LocalStorageUtil.setItemObject("userRoles", JSON.stringify(res[0] || []));
          LocalStorageUtil.setItemObject("organizations", JSON.stringify(res[1] || []));
        })
        .catch((error) => {
          console.error("Error fetching roles or organizations:", error);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, []);

  const rowTransform = (item: User, index: number) => {
    const tenant = tenants.find(t => t.id === item.tenantId);
    const role = roles.find(r => r.id === (item as any).roleID || r.id === item.roleId);
    const isActive = item.isActive;
    return {
      ...item,
      roleId: (item as any).roleID || item.roleId,
      roleName: role?.name || 'N/A',
      organizationId: (item as any).organizationID || item.organizationId,
      ...(isMasterAdmin && { tenantName: tenant?.name || 'N/A' }),
      statusBadge: isActive ? '🟢 Active' : '🔴 Inactive',
      modifiedDate: item.modifiedDate || item.createdDate,
      id: item.userId > 0 ? item.userId : index,
      _isDeleted: !item.isActive, // Flag for styling
    };
  };

  const unLockUserAccount = (item: User) => {
    setActionType("Unlock");
    if (isUnlockClicked) return;
    setIsUnlockClicked(true);
    userSvc
      .postItemBySubURL(item, "UnlockUserAccount", false, true)
      .then((res) => {
        setIsUnlockClicked(false);
        if (res) {
          toast.success(
            `'${item.name}'  user acount has been successfully unlocked`,
            { autoClose: 3000 }
          );
          setLoadRowData(true);
        }
      })
      .catch((err: any) => {
        setIsUnlockClicked(false);
        toast.error(
          `There is an issue with unlocking '${item.userName}' user acount, please verify...!`,
          { autoClose: 3000 }
        );
      });
  };

  const resetPassword = (item: any) => {
    console.log(item);
    if (isResetpasswordClicked) return;
    setIsResetpasswordClicked(true);
    userSvc
      .changePassword(item.id)
      .then((res) => {
        toast.success(`Password is successfully reset for ${item.userName}. Please check your email.`);
      })
      .finally(() => {
        setIsResetpasswordClicked(false);
      });
  };
  const resendConfirmation = (row: any) => {
  if (isResendClicked) return;
  setIsResendClicked(true);
  userSvc
    .resendConfirmation(String(row.userId)) // <<< stringify
    .then(() => toast.success(`Confirmation email sent to ${row.email}.`))
    .catch((err: any) => {
      const msg = err?.response?.data || "Failed to resend confirmation email.";
      toast.error(msg);
    })
    .finally(() => setIsResendClicked(false));
};

  const customActions = (item: any) => {
     const row = item?.row;
    const userProfile = Util.UserProfile();
    const currentUserId = userProfile?.userId;
    const rowUserId = item?.row?.userId;
    const isCurrentUser = currentUserId && rowUserId && String(currentUserId) === String(rowUserId);
    const needsConfirmation =
  row?.emailConfirmed === false || row?.EmailConfirmed === false;
    return (
      <>
        <Button
          color="primary"
          startIcon={<LockResetIcon />}
          title="Reset Password"
          onClick={(event) => {
            if (!isCurrentUser) resetPassword(item.row);
          }}
          className="rowActionIcon"
          disabled={isCurrentUser}
        ></Button>
        {/* Resend confirmation – only show when not confirmed */}
      {needsConfirmation && (
        <Button
          color="primary"
          startIcon={<MailOutlineIcon />}
          title="Resend confirmation email"
          onClick={() => resendConfirmation(row)}
          className="rowActionIcon"
          disabled={isResendClicked}
        />
      )}
      </>
    );
  };

  return loadingData ? (
    <div className="alignCenter">
      <Spinner />
    </div>
  ) : (
    <>
      <ItemCollection
        itemName={"User"}
        itemType={User}
        columnMetaData={columnMetaData}
        viewAddEditComponent={(props: any) => (
          <UsersAddEditDialog {...props} tenants={tenants} roles={roles} />
        )}
        itemsBySubURL={"GetUsers"}
        rowTransformFn={rowTransform}
        api={new UserService(ErrorBoundary)}
        enableCheckboxSelection={false}
        customActions={(e: any) => customActions(e)}
        onSelectionModelChange={() => {}}
        defaultSortField={"modifiedDate"}
        dataGridProps={{
          getRowClassName: (params: any) => {
            return params.row._isDeleted ? 'deleted-user-row' : '';
          }
        }}
      />
    </>
  );
};

export default UsersList;
