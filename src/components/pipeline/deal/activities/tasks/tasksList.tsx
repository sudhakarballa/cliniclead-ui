import { useMsal } from "@azure/msal-react";
import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { Accordion, Spinner } from "react-bootstrap";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-toastify";
import { DeleteDialog } from "../../../../../common/deleteDialog";
import { Tasks } from "../../../../../models/task";
import Util from "../../../../../others/util";
import { TaskService } from "../../../../../services/taskService";
import { loginRequest } from "../email/authConfig";
import {
  deleteCalendarEventToUser,
  deleteTask,
  getEventsList,
  getListTasksList,
  getTasksList,
  getUserDetails,
} from "../email/emailService";
import { TaskAddEdit } from "./taskAddEdit";
import TaskDetails from "./taskDetails";
import { useTheme } from '../../../../../contexts/ThemeContext';

type params = {
  dealId: number;
};
const TasksList = (props: params) => {
  const { dealId, ...others } = props;
  const { currentTheme } = useTheme();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [tasksList, setTasksList] = useState<Array<Tasks>>([]);
  const [error, setError] = useState<AxiosError>();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [selectedTaskItem, setSelectedTaskItem] = useState<Tasks>();
  const [selectedIndex, setSelectedIndex] = useState<any>(null);
  const taskSvc = new TaskService(ErrorBoundary);
  const { instance, accounts } = useMsal();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    const init = async () => {
      if (accounts.length > 0) {
        hasInitialized.current = true;
        await loadTasks();
        return;
      }

      try {
        await instance.ssoSilent({ scopes: loginRequest.scopes });
        // accounts will update on next render, which will hit the accounts.length > 0 branch
      } catch {
        try {
          await instance.loginPopup(loginRequest);
          // accounts will update on next render
        } catch (err) {
          console.error("Login failed", err);
          setIsLoading(false);
        }
      }
    };

    if ((instance as any)?.controller?.initialized) {
      init();
    }
  }, [accounts.length]);

  const loadTasks = async () => {
    setIsLoading(true);
    let userGUIdsListForTodo:Array<string>=[];
    let userGUIdsListForEmail:Array<string>=[];
    taskSvc
      .getTasks(dealId)
      .then((res) => {
        (res as Array<Tasks>).forEach((i) => {
          i.updatedDate = i.updatedDate ?? i.createdDate;
          i.dueDate = Util.convertTZ(i.dueDate);
          i.reminder = Util.convertTZ(i.reminder);
          if(i.todo==="To Do"){
            if(!userGUIdsListForTodo.find(u=>u==i.userGUID)){
              userGUIdsListForTodo.push(i.userGUID);
            }
          }
          if(i.todo==="Email"){
            if(!userGUIdsListForEmail.find(u=>u==i.userGUID)){
              userGUIdsListForEmail.push(i.userGUID);
            }
          }
        });
        if(accounts?.length>0) syncTaskswithAzure(userGUIdsListForTodo, userGUIdsListForEmail, res);
        else setIsLoading(false);
      })
      .catch((err) => {
        setTasksList([]);
        setError(err);
        setIsLoading(false);
      });
  };

  /*Here we will validate each task whether it is exist or not in azure based on todo then will initiate delete operation*/
  
  const syncTaskswithAzure=async(userGUIdsList:Array<string>, userGUIdsListForEmail:Array<string>, tasksList:Array<Tasks>)=>{
    console.log("Syncing tasks and events with Azure");
    let token = await getAccessToken();
    let taskIdsTodelete:Array<number>=[];

    const azureTasksByUser = new Map<string, Array<any>>();
    const azureEventsByUser = new Map<string, Array<any>>();

    await Promise.all(userGUIdsList.map(async (userId) => {//For todo list
      let tasksListsByUser = await getListTasksList(token.accessToken, userId);
      let listId = tasksListsByUser?.value?.find(
        (t: any) => t.displayName === "Y1 Capital Tasks"
      )?.id;

      let tasksListForListId = await getTasksList(token.accessToken, userId, listId);
      if(tasksListForListId?.value) azureTasksByUser.set(userId, tasksListForListId?.value);
    }));

    await Promise.all(userGUIdsListForEmail.map(async (userId) => {//For calendar events list
      let eventsList = await getEventsList(token.accessToken, userId);
      if(eventsList?.value) azureEventsByUser.set(userId, eventsList?.value);
    }));

    tasksList.forEach((t, index)=>{
      let res:Array<any>=[];
      if(t.todo==="To Do"){
        res = azureTasksByUser.get(t.userGUID) as any;
      }
      if(t.todo==="Email"){
        res = azureEventsByUser.get(t.userGUID) as any;
      }

      if(res && !res?.find(r=>r.id==t.taskGUID)){
        taskIdsTodelete.push(t.taskId);
        tasksList.splice(index, 1);
      }
    })
    
    setTasksList(Util.sortList(tasksList, "updatedDate", "desc"));
    setIsLoading(false);

    if(taskIdsTodelete.length>0){
      console.log('Deleting tasks for given Ids '+JSON.stringify(taskIdsTodelete))
      taskSvc.deleteTasks(taskIdsTodelete);
    }
  }

  const getAccessToken = async () => {
    return await instance.acquireTokenSilent({
      scopes: ["Calendars.ReadWrite.Shared"], // Adjust scopes as per your requirements
      account: accounts[0],
    });
  };

  const continueTodelete = async () => {
    let token = await getAccessToken();
    let userGuId =
      selectedTaskItem?.userGUID ??
      (await getUserDetails(token.accessToken, selectedTaskItem?.assignedTo));
    let res =
      selectedTaskItem?.todo === "To Do"
        ? deleteTask(
            token.accessToken,
            userGuId,
            selectedTaskItem?.taskListGUID,
            selectedTaskItem?.taskGUID
          )
        : selectedTaskItem?.todo === "Email"
        ? deleteCalendarEventToUser(
            token.accessToken,
            userGuId,
            selectedTaskItem?.taskGUID
          )
        : null;
    if (res) {
      taskSvc
        .deleteTask(selectedTaskId)
        .then((res) => {
          toast.success("Task deleted successfully");
          setShowDeleteDialog(false);
          setSelectedTaskId(0);
          loadTasks();
        })
        .catch((err) => {});
    } else {
      toast.error("Unable to delete task");
    }
  };

  return (
    <>
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className='text-end'>
            <button
              className="btn btn-y1app btn-sm"
              type="button"
              onClick={(e: any) => {
                setSelectedTaskItem(null as any);
                setDialogIsOpen(true);
              }}
              style={{
                backgroundColor: currentTheme.primaryColor,
                borderColor: currentTheme.primaryColor,
                color: '#ffffff',
                padding: '4px 12px',
                fontSize: '13px'
              }}
            >
              + Create Task
            </button>
          </div>
          
          {tasksList.length > 0 ? (
            <div className="activityfilter-accrow mb-3">
              <Accordion className="activityfilter-acco">
                {tasksList.map((task, index) => (
                  <div key={index}>
                    <TaskDetails
                      task={task}
                      index={index}
                      setDialogIsOpen={(e: any) => {
                        setDialogIsOpen(e);
                      }}
                      setShowDeleteDialog={(e: any) => {
                        setShowDeleteDialog(e);
                      }}
                      setSelectedTaskItem={(e: any) => {
                        setSelectedTaskItem(e);
                      }}
                      setSelectedTaskId={(e: any) => {
                        setSelectedTaskId(e);
                      }}
                      selectedIndex={selectedIndex}
                      setSelectedIndex={(e: any) => {
                        setSelectedIndex(e);
                      }}
                    />
                  </div>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className='text-center py-5' style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              border: '2px dashed #dee2e6',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }}>✓</div>
              <h6 style={{ color: '#6c757d', marginBottom: '8px' }}>No tasks available</h6>
              <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0' }}>Create your first task to get started</p>
            </div>
          )}
        </>
      )}
      {dialogIsOpen && (
        <TaskAddEdit
          dialogIsOpen={dialogIsOpen}
          dealId={dealId}
          taskItem={selectedTaskItem}
          setDialogIsOpen={setDialogIsOpen}
          onSaveTask={(e: any) => loadTasks()}
        />
      )}
      {showDeleteDialog && (
        <DeleteDialog
          itemType={"Task"}
          itemName={""}
          dialogIsOpen={showDeleteDialog}
          closeDialog={(e: any) => setShowDeleteDialog(false)}
          onConfirm={(e: any) => continueTodelete()}
          isPromptOnly={false}
          actionType={"Delete"}
        />
      )}
    </>
  );
};

export default TasksList;
