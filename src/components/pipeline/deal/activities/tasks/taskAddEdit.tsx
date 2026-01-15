import { useMsal } from "@azure/msal-react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import { AddEditDialog } from "../../../../../common/addEditDialog";
import GenerateElements from "../../../../../common/generateElements";
import { ElementType, IControl } from "../../../../../models/iControl";
import { Tasks } from "../../../../../models/task";
import { Utility } from "../../../../../models/utility";
import LocalStorageUtil from "../../../../../others/LocalStorageUtil";
import Constants from "../../../../../others/constants";
import Util from "../../../../../others/util";
import { TaskService } from "../../../../../services/taskService";
import {
  addCalendarEventToUser,
  createTask,
  createTasksList,
  deleteTask,
  getEventsList,
  getListTasksList,
  getTasksList,
  getUserDetails,
  updateCalendarEventToUser,
  updateTask,
} from "../email/emailService";
import { PostAuditLog } from "../../../../../models/dealAutidLog";
import { DealAuditLogService } from "../../../../../services/dealAuditLogService";

type params = {
  dealId?: number;
  dialogIsOpen: any;
  setDialogIsOpen: any;
  onSaveTask?: any;
  taskItem?: Tasks | null;
  selectedItem?: Tasks | null;
  onCloseDialog?: any;
};

export const TaskAddEdit = (props: params) => {
  const { dialogIsOpen, setDialogIsOpen, dealId, taskItem, selectedItem: propsSelectedItem, ...Others } = props;
  const [selectedItem, setSelectedItem] = useState(propsSelectedItem ?? taskItem ?? new Tasks());
  const [isLoading, setIsLoading] = useState(false);
  const typesList = ["To Do", "Email"];
  const prioritiesList = ["High", "Normal", "Low"];
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );
  const taskSvc = new TaskService(ErrorBoundary);
  const { instance, accounts } = useMsal();
  const [taskItemObj, setTaskItemObj] = useState<any>({});
  const [accessToken, setAccessToken] = useState();
  const [userGuID, setUserGuID] = useState();
  const auditLogsvc = new DealAuditLogService(ErrorBoundary);

  const controlsList: Array<IControl> = [
    {
      key: "Name",
      value: "name",
      isRequired: true,
      sidebyItem: "Assigned To",
    },
    {
      key: "Due Date",
      value: "dueDate",
      type: ElementType.datepicker,
      sidebyItem: "Reminder",
      isRequired: true,
      showTimeSelect: true,
    },
    {
      key: "Reminder",
      value: "reminder",
      type: ElementType.datepicker,
      isRequired: true,
      isSideByItem: true,
      showTimeSelect: true,
    },
    {
      key: "Type",
      value: "todo",
      type: ElementType.dropdown,
      sidebyItem: "Priority",
      isRequired: true,
    },
    {
      key: "Priority",
      value: "priority",
      type: ElementType.dropdown,
      isRequired: true,
      isSideByItem: true,
    },
    {
      key: "Assigned To",
      value: "assignedTo",
      type: ElementType.dropdown,
      isRequired: true,
      isSideByItem: true,
    },
    {
      key: "Task Details",
      value: "taskDetails",
      type: ElementType.ckeditor,
      isRequired: true,
      elementSize: 12,
      hideLabel: true,
    },
  ];

  const isValidDate = (date: any) => {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  };

  useEffect(() => {
    const itemToEdit = propsSelectedItem ?? taskItem;
    if (itemToEdit && utility?.users) {
      // Map userName to user ID for assignedTo field
      let assignedToId = itemToEdit.assignedTo || 0;
      if (itemToEdit.userName) {
        const user = utility.users.find(u => u.name === itemToEdit.userName);
        if (user) {
          assignedToId = user.id;
        }
      }
      
      // Create a clean copy with valid dates
      const cleanItem = {
        ...itemToEdit,
        dueDate: isValidDate(itemToEdit.dueDate) ? new Date(itemToEdit.dueDate) : new Date(),
        reminder: isValidDate(itemToEdit.reminder) ? new Date(itemToEdit.reminder) : new Date(),
        // Ensure dropdown values are properly formatted
        todo: itemToEdit.todo || "To Do",
        priority: itemToEdit.priority || "Normal",
        assignedTo: assignedToId
      };
      
      setSelectedItem(cleanItem);
      
      // Use setTimeout to ensure form methods are available
      setTimeout(() => {
        setValue("name" as never, itemToEdit.name as never);
        setValue("dueDate" as never, cleanItem.dueDate as never);
        setValue("reminder" as never, cleanItem.reminder as never);
        setValue("taskDetails" as never, itemToEdit.taskDetails as never);
        setValue("todo" as never, cleanItem.todo as never);
        setValue("priority" as never, cleanItem.priority as never);
        setValue("assignedTo" as never, assignedToId as never);
      }, 100);
      
      setUserGuID(itemToEdit.userGUID as any);
    }
  }, [taskItem, propsSelectedItem]);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      getAccessToken();
    }
  }, [accounts]);

  useEffect(() => {
    if (accessToken && taskItem?.taskGUID) {
      let res =
        taskItem.todo === "To Do"
          ? getTaskDetails()
          : taskItem.todo === "Email"
          ? getEventDetails()
          : null;
    } else {
      setTaskItemObj({
        ...taskItemObj,
        startDateTime: {
          dateTime: new Date(),
          timeZone: "India Standard Time",
        },
      });
    }
  }, [accessToken]);

  const getEventDetails = async () => {
    let userGUID =
      taskItem?.userGUID ??
      (await getUserDetails(accessToken, taskItem?.assignedTo));
    setUserGuID(userGuID);
    let tasksList = await getEventsList(accessToken, userGUID);

    setTaskItemObj(
      tasksList?.value?.find((i: any) => i.id === taskItem?.taskGUID)
    );
  };

  const getTaskDetails = async () => {
    let userGUID =
      taskItem?.userGUID ??
      (await getUserDetails(accessToken, taskItem?.assignedTo));
    setUserGuID(userGuID);
    let tasksList = await getTasksList(
      accessToken,
      userGUID,
      taskItem?.taskListGUID
    );

    setTaskItemObj(
      tasksList?.value?.find((i: any) => i.id === taskItem?.taskGUID)
    );
  };

  const oncloseDialog = () => {
    setDialogIsOpen(false);
    props.onCloseDialog && props.onCloseDialog();
  };

  const getValidationsSchema = (list: Array<any>) => {
    return Yup.object().shape({
      ...Util.buildValidations(list),
    });
  };

  const formOptions = {
    resolver: yupResolver(getValidationsSchema(controlsList)),
  };
  const methods = useForm(formOptions);
  const { handleSubmit, unregister, register, resetField, setValue, setError } =
    methods;

  const getAccessToken = async () => {
    try {
      if (!accounts || accounts.length === 0) {
        console.log("No accounts available for token acquisition");
        return;
      }
      
      let res = await instance.acquireTokenSilent({
        scopes: ["Calendars.ReadWrite.Shared"], // Adjust scopes as per your requirements
        account: accounts[0],
      });

      setAccessToken(res?.accessToken as any);
    } catch (error) {
      console.error("Error acquiring token:", error);
    }
  };

  function getDurationInMinutes(startDate: any, endDate: any) {
    // Convert dates to milliseconds
    const startMillis = startDate.getTime();
    const endMillis = endDate.getTime();

    // Calculate difference in milliseconds
    const diffMillis = Math.abs(endMillis - startMillis);

    // Convert milliseconds to minutes
    const durationMinutes = Math.ceil(diffMillis / (1000 * 60));

    return durationMinutes;
  }

  const initiateactioninAzure = async (task: Tasks) => {
    let userGuId;
    if (!userGuID) {
      userGuId = await getUserDetails(accessToken, task.assignedTo);
      setUserGuID(userGuId as any);
    } else {
      userGuId = userGuID;
    }

    if (userGuId) {
      if (task.todo === "To Do") {
        let res = await performActionForTask(
          task,
          accessToken as any,
          userGuId
        );
        return res;
      }

      if (task.todo === "Email") {
        let res = await performActionForEmail(
          task,
          accessToken as any,
          userGuId
        );
        return res;
      }
    }
  };

  const performActionForTask = async (
    task: Tasks,
    accessToken: string,
    userId: any
  ) => {
    let taskListId = task.taskListGUID;
    if (!taskListId) {
      let tasksList = await getListTasksList(accessToken, userId);
      taskListId = tasksList?.value?.find(
        (t: any) => t.displayName === "Y1 Capital Tasks"
      )?.id;

      if (!taskListId) taskListId = await createTasksList(accessToken, userId);
    }
    if (taskListId) {
      task.taskListGUID = taskListId;

      const taskObj = {
        id: taskItemObj?.id,
        title: task.name,
        body: {
          content: task.taskDetails,
          contentType: "html",
        },
        status: "inProgress",
        startDateTime: task.startDate ?? {
          dateTime: new Date(),
          timeZone: "India Standard Time",
        },
        dueDateTime: {
          dateTime: task.dueDate,
          timeZone: "India Standard Time",
        },
        reminderDateTime: {
          dateTime: task.reminder,
          timeZone: "India Standard Time",
        },
        importance: task.priority.toLocaleLowerCase(),
        isReminderOn: !Util.isNullOrUndefinedOrEmpty(task.reminder),
      };

      try {
        const response = await (selectedItem.taskId>0
          ? updateTask(accessToken, userId, taskListId, taskObj)
          : createTask(accessToken, userId, taskListId, taskObj));
        if (response) {
          setTaskItemObj({ ...taskItemObj, id: response });
        }
        return { taskId: response, taskListId: taskListId, "userId":userId };
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const performActionForEmail = async (
    task: Tasks,
    accessToken: string,
    userId: any
  ) => {
    const taskObj = {
      subject: task.name,
      importance: "normal",
      body: {
        contentType: "HTML",
        content: task.taskDetails,
      },
      start: task.startDate ?? {
        dateTime: new Date(),
        timeZone: "India Standard Time",
      },
      end: {
        dateTime: task.dueDate,
        timeZone: "India Standard Time",
      },
      attendees: [
        {
          emailAddress: {
            address: task.assignedTo,
            name: "Test",
          },
          type: "required",
        },
      ],
      allowNewTimeProposals: true,
      transactionId: taskItemObj.transactionId ?? uuidv4(),
    };

    try {
      const response = await (taskItemObj.id
        ? updateCalendarEventToUser(
            accessToken,
            userId,
            taskObj,
            taskItemObj.id
          )
        : addCalendarEventToUser(accessToken, userId, taskObj));
      if (response) {
        setTaskItemObj({ ...taskItemObj, id: response });
      }
      return { taskId: response, taskListId: null, "userId":userId };
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const onSubmit = (item: any) => {
    let addUpdateItem: Tasks = new Tasks();
    addUpdateItem.createdBy = Util.UserProfile()?.userId;
    addUpdateItem.modifiedBy = Util.UserProfile()?.userId;
    addUpdateItem.createdDate = new Date();
    Util.toClassObject(addUpdateItem, item);
    addUpdateItem.dealId = dealId ?? selectedItem.dealId ?? 0;
    addUpdateItem.startDate = taskItemObj?.startDateTime;
    addUpdateItem.taskId = selectedItem?.taskId ?? (0 as any);
    addUpdateItem.dueDate = isValidDate(addUpdateItem.dueDate) ? new Date(addUpdateItem.dueDate) : new Date();
    addUpdateItem.reminder = isValidDate(addUpdateItem.reminder) ? new Date(addUpdateItem.reminder) : new Date();
    console.log("addUpdateItem" + { ...addUpdateItem });

    const reminderDate = new Date(addUpdateItem.reminder);
    const dueDateObj = new Date(addUpdateItem.dueDate);
    const currentDate = new Date();
    
    if (isValidDate(addUpdateItem.reminder) && reminderDate < currentDate) {
      toast.warning("Reminder cannot be lesser than current date");
      return;
    }
    if (isValidDate(addUpdateItem.reminder) && isValidDate(addUpdateItem.dueDate) && reminderDate > dueDateObj) {
      toast.warning("Reminder cannot be greater than due date");
      return;
    }

    initiateactioninAzure(addUpdateItem).then((res) => {
      
      if (res) {
        addUpdateItem.taskGUID = res.taskId;
        addUpdateItem.taskListGUID = res.taskListId as any ?? "123";
        addUpdateItem.userGUID = res.userId as any;
        addUpdateItem.assignedTo = 1;//TODO
        addUpdateItem.startDate = item.startDateTime;
        console.log("taskItem obj before submission... "+ JSON.stringify(addUpdateItem));
        taskSvc
          .addorUpdateTask(addUpdateItem)
          .then((res) => {
            console.log("response received post addorUpdateTask "+ JSON.stringify(res));
            setDialogIsOpen(false);
            if(props.onSaveTask) props.onSaveTask();
            if (res) {
              toast.success(
                `Task ${
                  addUpdateItem.taskId > 0 ? "updated" : "added"
                } successfully`
              );
              let auditLogObj = {
                ...new PostAuditLog(),
                eventType: "Task created",
                dealId: dealId ?? selectedItem.dealId ?? 0,
              };
              auditLogObj.createdBy = Util.UserProfile()?.userId;
              auditLogObj.eventDescription =
                addUpdateItem.taskId > 0
                  ? "Task was updated for the deal"
                  : "A new task was crated for the deal";
              auditLogsvc.postAuditLog(auditLogObj);
            } else {
              if(addUpdateItem.todo==="To Do"){
                handleTaskFailure(accessToken, userGuID, res)
              }
            }
          })
          .catch((err) => {
            console.log("error is "+err);
            if(addUpdateItem.todo==="To Do"){
              handleTaskFailure(accessToken, userGuID, res)
            }
          });
      }
    });
    return;
  };

  function handleTaskFailure(
    accessToken: any, 
    userGuID: any, 
    res: any
  ) {
    toast.error("Unable to add Task");
    console.log("Failed to add task in database, so deleting it from Azure");
    deleteTask(
      accessToken,
      userGuID,
      res?.taskListId, 
      res?.taskId
    );
  }

  const getDropdownvalues = (item: any) => {
    if (item.key === "Type") {
      return typesList.map((i: any) => ({ name: i, value: i })) ?? [];
    }
    if (item.key === "Priority") {
      return prioritiesList.map((i: any) => ({ name: i, value: i })) ?? [];
    }
    if (item.key === "Assigned To") {
      return (
        utility?.users
          .filter((u) => u.isActive)
          .map(({ name, id }) => ({
            name: name,
            value: id,
          })) ?? []
      );
    }
  };

  const onChange = (value: any, item: any) => {
    
    setValue(item.value as never, value as never);
    if (value) unregister(item.value as never);
    else register(item.value as never);
    resetField(item.value as never);

    if (item.key === "Due Date") {
      setSelectedItem({ ...selectedItem, dueDate: value });
    }
    if (item.key === "Reminder") {
      setSelectedItem({ ...selectedItem, reminder: value });
    }
    if (item.key === "Task Details") {
      setSelectedItem({ ...selectedItem, taskDetails: value });
    }
  };
  return (
    <>
      {
        <FormProvider {...methods}>
          <AddEditDialog
            dialogIsOpen={dialogIsOpen}
            header={(selectedItem?.taskId > 0 ? "Edit" : "Add") + " Task"}
            onSave={handleSubmit(onSubmit)}
            closeDialog={oncloseDialog}
            onClose={oncloseDialog}
          >
            <>
              {isLoading && (
                <div className="alignCenter">
                  <Spinner />
                </div>
              )}
              <div className="modelformfiledrow row">
                <div>
                  <div className="modelformbox ps-2 pe-2">
                    {
                      <GenerateElements
                        controlsList={controlsList}
                        selectedItem={selectedItem}
                        onChange={(value: any, item: any) =>
                          onChange(value, item)
                        }
                        getListofItemsForDropdown={(e: any) =>
                          getDropdownvalues(e) as any
                        }
                      />
                    }
                    
                  </div>
                </div>
              </div>
            </>
            {/* <SelectDropdown isValidationOptional={true} 
                                item={selectedItem} 
                                selectedItem={selectedItem} 
                                list={getDueDates()}/> */}
            {/* <RichTextEditor onChange={(e: any) => setSelectedItem({ ...selectedItem, noteDetails: e })}
                    value={selectedItem.noteDetails} /> */}
            <br />
          </AddEditDialog>
        </FormProvider>
      }
    </>
  );
};
