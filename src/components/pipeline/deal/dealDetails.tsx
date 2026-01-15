import { Tooltip } from "@mui/material";
import { useMsal } from "@azure/msal-react";
import {
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faEnvelope,
  faListCheck,
  faMoneyBill,
  faPencil,
  faPenToSquare,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AxiosError } from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UnAuthorized } from "../../../common/unauthorized";
import { DATEPICKER } from "../../../elements/datePicker";
import SelectDropdown from "../../../elements/SelectDropdown";
import { Deal } from "../../../models/deal";
import { EmailCompose } from "../../../models/emailCompose";
import { Stage } from "../../../models/stage";
import { Tasks } from "../../../models/task";
import { Utility } from "../../../models/utility";
import Constants from "../../../others/constants";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import Util, { IsMockService } from "../../../others/util";
import { useAuthContext } from "../../../contexts/AuthContext";
import { DealService } from "../../../services/dealService";
import { StageService } from "../../../services/stageService";
import { loginRequest } from "./activities/email/authConfig";
import { prepareEmailBody } from "./activities/email/emailActivites";
import EmailComposeDialog from "./activities/email/emailComposeDialog";
import { sendEmail } from "./activities/email/emailService";
import NotesAddEdit from "./activities/notes/notesAddEdit";
import { TaskAddEdit } from "./activities/tasks/taskAddEdit";
import DealOverView from "./overview/dealOverView";
import DealDetailsCustomFields from "./dealDetailsCustomFields";
import DealsDialog from "./DealsDialog";
import JustCallComponent from "./justcall";
import MedicalFormEmailDialog from "./activities/email/MedicalFormEmailDialog";
import { sendMedicalFormEmail } from "../../../models/medicalFormEmailService";
import { PostAuditLog, DealEmailLog } from "../../../models/dealAutidLog";
import { DealEmailLogService } from "../../../services/dealEmailLogService";


export const DealDetails = () => {
  const { userProfile, userRole } = useAuthContext();
  const navigator = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  const getSafeFilterId = (search: string): string | undefined => {
    const raw = new URLSearchParams(search).get("filterId");
    return raw && raw !== "null" && raw !== "undefined" && raw.trim() !== ""
      ? raw
      : undefined;
  };
  const dealEmailLogService = new DealEmailLogService(ErrorBoundary);
  const [dealId, setDealId] = useState(
    new URLSearchParams(useLocation().search).get("id") as any
  );
  const [pipeLineId, setPipeLineId] = useState(
    new URLSearchParams(useLocation().search).get("pipeLineId") as any
  );
  const [filterId, setFilterId] = useState<string | undefined>(() =>
    getSafeFilterId(location.search)
  );
  const [viewType, setViewType] = useState<string | undefined>(() =>
    new URLSearchParams(location.search).get("viewType") || undefined
  );
  const dealSvc = new DealService(ErrorBoundary);
  const [error, setError] = useState<AxiosError>();
  const [dealItem, setDealItem] = useState<Deal>({
    ...new Deal(),
    openDealsCount: 0,
    MissedCallReason: "Not Provided",
    RecordingUrl: "",
    Status: "Pending",
  });
  const [isLoading, setIsLoading] = useState(true);
  const stagesSvc = new StageService(ErrorBoundary);
  const [stages, setStages] = useState<Array<Stage>>([]);


  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [selectedTaskItem, setSelectedTaskItem] = useState<Tasks>();
  const [selectedEmail, setSelectedEmail] = useState<any>();
  const [dialogToOpen, setDialogToOpen] = useState<string>("");
  const [selectedPhoneNumber, setSelectedPhoneNmber] = useState();
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );

  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const [isDealsLoading, setIsDealsLoading] = useState(false);
  const [relatedDeals, setRelatedDeals] = useState([]);

  const [openDealsCount, setOpenDealsCount] = useState(
    dealItem.openDealsCount || 0
  );

  const [dealValue, setDealValue] = useState(dealItem.value);
  const [isEditingMedicalForm, setIsEditingMedicalForm] = useState(false);
  const [tempMedicalFormValue, setTempMedicalFormValue] = useState(
    dealItem.medicalForm ?? "None"
  );
  // 👇 Just after your imports or above component state
  interface DealWithPipeline extends Deal {
    pipelineStages: Stage[];
    pipelineName: string;
  }
  const [dealsData, setDealsData] = useState<DealWithPipeline[]>([]);
  useEffect(() => {}, [dealItem]);

  const convertUTCtoISO = (utcDateString: string) => {
    // Create a Date object from the UTC string
    let utcDate = new Date(utcDateString);

    // Convert to Indian Standard Time (IST), which is UTC +5:30
    // IST is 5 hours 30 minutes ahead of UTC
    let istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

    // Adjust the UTC date by adding the IST offset
    let istDate = new Date(utcDate.getTime() + istOffset);

    // Convert the IST date to an ISO string in local time
    let istISO = istDate.toISOString();
    return istISO;
  };
  const handleEditClick = () => {
    if (userRole === 1) {
      setIsEditingAmount(true);
    } else {
      toast.error("You do not have permission to edit the deal amount.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDealValue(e.target.value);
  };

  const handleSaveClick = () => {
    const clean = sanitizeMoney(String(dealValue ?? ""));
    if (!clean) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setIsEditingAmount(false);
    setDealItem({ ...dealItem, value: clean }); // value stays string
    onDealModified();
  };
  const loadDealItem = () => {
    // Only reload if absolutely necessary
    if (!dealItem.dealID || dealItem.dealID != dealId) {
      dealSvc.getDealsById(dealId).then((res) => {
        setDealItem(
          IsMockService()
            ? res.find((d: Deal) => d.dealID == dealId)
            : { ...res, operationDate: convertUTCtoISO(res.operationDate) }
        );
      });
    }
  };

  // Initial load effect
  useEffect(() => {
    if (dealId && pipeLineId) {
      fetchDealData(+dealId, +pipeLineId);
    }
  }, []); // Only run on mount

  const fetchDealData = async (dealId: number, pipelineId: number) => {
    setIsLoading(true);
    try {
      // Fetch the deal data and stages concurrently
      const [dealData, stagesData] = await Promise.all([
        dealSvc.getDealsById(dealId),
        stagesSvc.getStages(pipelineId),
      ]);

      if (dealData && stagesData) {
        setDealItem(
          IsMockService()
            ? dealData.find((d: Deal) => d.dealID == dealId)
            : {
                ...dealData,
                operationDate: convertUTCtoISO(dealData.operationDate),
              }
        );
        setDealValue(dealData.value);
        let sortedStages = Util.sortList(stagesData.stageDtos, "stageOrder");
        setStages(sortedStages);
      }
    } catch (err) {
      setError(err as AxiosError);
    } finally {
      setIsLoading(false);
    }
  };
  interface SimplifiedDeal {
    id: number;
    treatmentName: string;
    personName: string;
    ownerName: string;
  }
  // Fetch deals data when opening the dialog
  const openMoveDealDialog = async () => {
     setIsDealsModalOpen(true);   // 👈 open the modal right away
     setIsDealsLoading(true);     // 👈 show loader in the modal
    try {
      const relatedDealsData: Deal[] = await dealSvc.getDealsByPersonId(
        dealItem.contactPersonID ?? 0
      );
      
      // Map relatedDealsData to ensure every deal has required fields for DataGrid
      const formattedData: Deal[] = await Promise.all(
        relatedDealsData.map(async (deal) => {
          const stagesData = await stagesSvc.getStages(deal.pipelineID);
          const sortedStages = Util.sortList(
            stagesData.stageDtos,
            "stageOrder"
          );

          return {
            ...deal,
            id: deal.dealID,
            treatmentName: deal.treatmentName || "No Title",
            personName: deal.personName || "No Contact",
            ownerName: deal.ownerName || "No Owner",
            organizationName: deal.name || "No Organization",
            pipelineName: deal.pipelineName || "Unknown Pipeline", // Add this
            pipelineStages: sortedStages,
          };
        })
      );

      setDealsData(formattedData);
      setIsDealsModalOpen(true);
    } catch (error) {
      console.error("Error fetching related deals:", error);
      toast.error("Unable to load linked deals.");
    }
    finally {
    setIsDealsLoading(false);  // 👈 hide loader
  }
  };
  const closeMoveDealDialog = () => setIsDealsModalOpen(false);

  // Use the useLocation hook instead of the global location object
  // useEffect(() => {
  //   const searchParams = new URLSearchParams(location.search);

  //   const newDealId = searchParams.get("id");
  //   const newPipelineId = searchParams.get("pipeLineId");

  //   if (newDealId && newPipelineId) {
  //     fetchDealData(Number(newDealId), Number(newPipelineId)); // Fetch new deal data based on new params
  //   }
  // }, [location.search]); // Listen for changes to the URL search params

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newDealId = searchParams.get("id");
    const newPipelineId = searchParams.get("pipeLineId");
    setFilterId(getSafeFilterId(location.search));
    setViewType(new URLSearchParams(location.search).get("viewType") || undefined);
    
    if (newDealId && newPipelineId) {
      // Only fetch if dealId or pipelineId actually changed
      if (newDealId !== dealId || newPipelineId !== pipeLineId) {
        setDealId(newDealId);
        setPipeLineId(newPipelineId);
        fetchDealData(+newDealId, +newPipelineId);
      }
    }
  }, [location.search, dealId, pipeLineId]);

  const onDealModified = (cleanValue?: string) => {
    console.log("Updated dealItem before API call:", dealItem);
    const valueToSend = cleanValue ?? sanitizeMoney(String(dealValue ?? ""));
    // Ensure required fields exist
    const updatedDealItem = {
      ...dealItem,
      value: valueToSend,
      operationDate: dealItem.operationDate
        ? new Date(dealItem.operationDate)
        : null,
      callHistory:
        dealItem.callHistory?.map(
          (call: {
            assignedTo: any;
            receivedOn: any;
            campaign: { id: any; name: any; type: any };
            contactName: any;
            contactEmail: any;
            callInfo: {
              direction: any;
              disposition: any;
              notes: any;
              recording: any;
              type: any;
            };
            agentName: any;
            callDate: any;
            callTime: any;
            contactNumber: any;
            id: any;
            justCallNumber: any;
          }) => ({
            assignedTo: call.assignedTo ?? "Default User",
            receivedOn: call.receivedOn ?? new Date().toISOString(),

            campaign:
              typeof call.campaign === "object"
                ? {
                    id:
                      call.campaign.id && !isNaN(parseInt(call.campaign.id))
                        ? parseInt(call.campaign.id, 10)
                        : 0,
                    name: call.campaign.name ?? "Default Campaign",
                    type: call.campaign.type ?? "Unknown Type", // Ensure `type` is included
                  }
                : { id: "0", name: "Default Campaign", type: "Unknown Type" },

            contactName: call.contactName ?? "Unknown",
            contactEmail: call.contactEmail ?? "No Email Provided",
            contactNumber: call.contactNumber ?? "No Contact Number",
            id: call.id ? String(call.id) : "Unknown", // Ensure `id` is a string
            justCallNumber: call.justCallNumber ?? "Unknown",
            agentName: call.agentName ?? "Unknown Agent",
            callDate: call.callDate ?? new Date().toISOString(),
            callTime: call.callTime ?? new Date().toISOString(),

            type: call.callInfo?.type ?? "Unknown Type",
            recording: call.callInfo?.recording ?? "No Recording Available",

            callInfo: {
              direction: call.callInfo?.direction ?? "Not Specified",
              disposition:
                call.callInfo?.disposition ?? "No Disposition Provided",
              notes: call.callInfo?.notes ?? "No Notes Available",
              recording: call.callInfo?.recording ?? "No Recording Available",
              type: call.callInfo?.type ?? "Unknown Type", // Ensure `type` is included
            },
          })
        ) ?? [],
    };

    console.log(
      "Final payload being sent:",
      JSON.stringify(updatedDealItem.callHistory, null, 2)
    );

    dealSvc
      .putItemBySubURL(updatedDealItem, "" + dealItem.dealID)
      .then((res) => {
        console.log("API Response:", res);
        toast.success("Deal updated successfully.");
        loadDealItem();
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError(err);
      });
  };
  const onStageModified = (stageId: number) => {
    dealSvc
      .putItemBySubURL(
        {
          newStageId: stageId,
          modifiedById: userProfile?.userId,
          dealId: +dealItem.dealID,
          pipelineId: dealItem.pipelineID,
          statusId: dealItem.status,
        },
        +dealItem.dealID + "/stage"
      )
      .then((res) => {
        toast.success("Deal updated successfully.");
        loadDealItem();
      })
      .catch((err) => {
        setError(err);
      });
  };

  const handleSendEmail = async (
    emailObj: any,
    attachmentFiles: Array<any> = []
  ) => {
    try {
      const accessTokenResponse = await instance.acquireTokenSilent({
        scopes: ["Mail.Send"],
        account: accounts[0],
      });

      // Convert files to base64 for attachments
      const fileToBase64 = (file: any) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve((reader as any).result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const attachments = await Promise.all(
        attachmentFiles.map(async (file) => {
          const base64File = await fileToBase64(file?.file);
          return {
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: file.file.name,
            contentType: file.file.type,
            contentBytes: base64File,
          };
        })
      );

      // Send email logic here
      let response: any = await sendEmail(
        accessTokenResponse.accessToken,
        await prepareEmailBody(emailObj, dealId, attachments),
        null
      );

      if (!response.error) {
        setDialogIsOpen(false);
        toast.success("Email sent successfully");
        let auditLogObj = {
          ...new PostAuditLog(),
          eventType: "email Send",
          dealId: dealId,
        };
        auditLogObj.createdBy = userProfile?.userId;
        auditLogObj.eventDescription = "A new email was sent for the deal";
        //await auditLogsvc.postAuditLog(auditLogObj);
        let dealEmailObj: DealEmailLog = new DealEmailLog();

        dealEmailObj.dealId = dealId;
        dealEmailObj.emailBody = emailObj.body;
        dealEmailObj.emailTo = emailObj.toAddress;
        dealEmailObj.emailDate = new Date();
        dealEmailObj.createdBy = userProfile?.userId;
        dealEmailObj.createdDate = new Date();
        await dealEmailLogService.postDealEmailLog(dealEmailObj);
        
        // Trigger refresh of activities section
        window.dispatchEvent(new CustomEvent('emailSent', { detail: { dealId } }));
      } else {
        toast.error("Unable to send email please verify");
      }
    } catch (error) {
      console.error("Email sending failed", error);
      setDialogIsOpen(false);
      toast.error("Unable to sent email please re try after sometime");
    }
  };
  const sanitizeMoney = (s: string) =>
    s
      .replace(/[^\d.]/g, "")
      .replace(/^0+(?=\d)/, "")
      .replace(/(\..*)\./g, "$1")
      .replace(/^(\d+\.?\d{0,2}).*$/, "$1");

  const onLoginConfirm = async () => {
    try {
      let res = await instance.loginPopup(loginRequest);
      setDialogIsOpen(true);
      console.log("Login successful", res);
    } catch (error) {
      console.error("Login failed", error);
    }
  };
  const handleMedicalFormYesClick = () => {
    if (!dealItem.email) {
      toast.warning("No email found for the patient.");
      return;
    }

    const emailObj = {
      to: dealItem.email,
      from: "wlforms@transforminglives.co.uk",
      bcc: ["y1capitalyogi@gmail.com", "suenorton54321@btinternet.com"],
      subject:
        "test email from yogi - Complete Your Medical History Form – Transform",
      body: `
  <p>Dear ${dealItem.personName || "Patient"},</p>
  <p>Thank you for choosing Transform to support your weight loss journey.</p>
  <p>To ensure we provide the best care possible, we kindly ask you to complete your medical history form by clicking the link below:</p>
  <p><a href="https://weightloss.transforminglives.co.uk/mounjaro-medical-history-form/">Click here to fill out your form</a></p>
  <p>Completing the form promptly allows us to move forward with your personalised treatment plan and ensures a smooth next step in your journey.</p>
  <p>Kind regards,<br/>Transform Weight Loss Team</p>
`,
    };

    setSelectedEmail(emailObj);
    setDialogToOpen("MedicalFormEmailDialog");

    if (accounts.length === 0) {
      onLoginConfirm();
    } else {
      setDialogIsOpen(true);
    }
  };

  // Accordion state for each section - expand all by default
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    ownership: true,
    aboutDeal: true,
    marketing: true,
    aboutPerson: true
  });
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const safe = (v: unknown, placeholder = "-") => {
  if (v === 0) return "0";                      // keep 0
  const s = String(v ?? "").trim();
  // Check for empty, null, undefined, or common placeholder values
  if (!s || /^(null|undefined|-|—|\(none\)|n\/a|na)$/i.test(s)) {
    return placeholder;
  }
  return s;
};
  const isEmpty = (v: any) => {
    const s = (v ?? "").toString().trim().toLowerCase();
    return (
      !s ||
      s === "-" ||
      s === "—" ||
      s === "(none)" ||
      s === "undefined" ||
      s === "null"
    );
  };
  const pretty = (v: any) => (isEmpty(v) ? "-" : String(v).trim());
  return (
    <>
      {error && <UnAuthorized error={error as any} />}
      {isLoading ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : (
        <div className="pdstage-detailarea" style={{ height: '100vh', overflow: 'hidden' }}>
          <div className="pdstage-detail">
            <div className="sidebardetail-col">
              <div className="sidebardetailtopbar">
                <div
                  className="appdealtopbartitle"
                  onClick={() => {
                    const qs = new URLSearchParams();
                    if (pipeLineId) qs.set("pipelineID", String(pipeLineId));
                    if (filterId) qs.set("filterId", String(filterId));
                    if (viewType === "list") qs.set("viewType", "list");
                    navigator(`/pipeline?${qs.toString()}`);
                  }}
                >
                  <a href="javascript:void(0);">
                    <FontAwesomeIcon icon={faAngleLeft} /> Deals
                  </a>{" "}
                </div>
                {/* <div className="appdealtopbaractions">
                  <Dropdown className="dropdown-actionsbox">
                    <Dropdown.Toggle id="dropdown-actions">
                      Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-actionslist">
                      <Dropdown.Item href="#/action-6">Delete</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div> */}
              </div>

              <div className="app-dealblock">
                <div className="app-dealblock-inner">
                  <div className="appdealblock-title">
                    <h3>{dealItem?.treatmentName}</h3>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e: any) => onDealModified()}
                    >
                      Save
                    </button>
                  </div>
                  <div className="appdealblock-data">
                    <div className="appdealblock-row">
                      <div className="appdeal-amount dflex">
                        Deal:{" "}
                        <span className="appdeal-amountnum">
                          {dealItem.title}
                        </span>
                      </div>
                    </div>
                    <div className="appdealblock-row mt-1">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faMoneyBill}
                          className="deal-amount-icon"
                        />
                        <div className="appdeal-amount-container">
                          {isEditingAmount ? (
                            <div>
                              <div
                                className="input-group input-group-sm"
                                style={{ maxWidth: 360 }}
                              >
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="form-control"
                                  value={dealValue ?? ""}
                                  onChange={(e) =>
                                    setDealValue(sanitizeMoney(e.target.value))
                                  }
                                  onKeyDown={(e) => {
                                    if (["e", "E", "+", "-"].includes(e.key))
                                      e.preventDefault();
                                  }}
                                />
                                <select className="form-select">
                                  <option value="GBP">
                                    Pound Sterling (GBP)
                                  </option>
                                  <option value="USD">US Dollar (USD)</option>
                                  <option value="EUR">Euro (EUR)</option>
                                </select>
                              </div>
                              <div
                                style={{ marginTop: "8px", textAlign: "right" }}
                              >
                                <button
                                  className="btn-cancel"
                                  onClick={() => setIsEditingAmount(false)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span className="deal-amount-value">
                                {userRole === 1
                                  ? `£${dealItem.value}`
                                  : "£0"}
                              </span>
                              {userRole === 1 && (
                                <Tooltip title="Edit Deal Amount" placement="top">
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    className="edit-icon"
                                    onClick={handleEditClick}
                                  />
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="appdealblock-row mt-1">
                      <div className="appdeal-closedate dflex">
                        Close Date:{" "}
                        <div className="closedateinput">
                          <DATEPICKER
                            onChange={(e: any) =>
                              setDealItem({
                                ...dealItem,
                                operationDate: moment(e).format("MM-DD-YYYY"),
                              })
                            }
                            isValidationOptional={true}
                            selectedItem={dealItem}
                            value={moment(dealItem.operationDate).format(
                              "MM-DD-YYYY"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="appdealblock-row mt-1">
                      <div className="appdeal-closedate dflex">
                        Stage:
                        <div className="stageappointment">
                          {dealItem.stageName}
                          {/* <Dropdown className='dropdown-scheduledbox'>
                                                        <Dropdown.Toggle id="dropdown-scheduled">{dealItem.stageName}</Dropdown.Toggle>
                                                        <Dropdown.Menu className='dropdown-scheduledlist'>
                                                            <Dropdown.Item href="#/action-1">Unfollow</Dropdown.Item>
                                                            <Dropdown.Item href="#/action-2">View all properties</Dropdown.Item>
                                                            <Dropdown.Item href="#/action-3">View property history</Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item href="#/action-4">View association history</Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item href="#/action-5">Merge</Dropdown.Item>
                                                            <Dropdown.Item href="#/action-6">Delete</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown> */}
                        </div>
                      </div>
                    </div>
                    <div className="appdealblock-row mt-2">
                      <ul className="appdealblock-iconlist">
                        <li>
                          <Tooltip title="Add Note" placement="top">
                            <button
                              className="dealicon"
                              onClick={() => {
                                setDialogToOpen("NotesAddEdit" as any);
                                setDialogIsOpen(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                          </Tooltip>
                          <span className="dealicon-name">Note</span>
                        </li>
                        <li>
                          <Tooltip title="Send Email" placement="top">
                            <button
                              className="dealicon"
                              onClick={() => {
                                setSelectedEmail({
                                  to: dealItem.email || "default@example.com",
                                });
                                setDialogToOpen("EmailComposeDialog" as any);
                                accounts.length == 0
                                  ? onLoginConfirm()
                                  : setDialogIsOpen(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faEnvelope} />
                            </button>
                          </Tooltip>
                          <span className="dealicon-name">Email</span>
                        </li>
                        <li>
                          <Tooltip title="Make Call" placement="top">
                            <button
                              className="dealicon"
                              onClick={() =>
                                setSelectedPhoneNmber(dealItem.phone as any)
                              }
                            >
                              <FontAwesomeIcon icon={faPhone} />
                            </button>
                          </Tooltip>
                          <span className="dealicon-name">Call</span>
                        </li>
                        <li>
                          <Tooltip title="Create Task" placement="top">
                            <button
                              className="dealicon"
                              onClick={() => {
                                setDialogToOpen("TaskAddEdit" as any);
                                accounts.length == 0
                                  ? onLoginConfirm()
                                  : setDialogIsOpen(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faListCheck} />
                            </button>
                          </Tooltip>
                          <span className="dealicon-name">Task</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* Scrollable Content Panel */}
              <div className="app-detail-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                <div className="app-dealblock">
                  <div className="app-dealblock-inner">
                    <div className="appdealblock-head">
                      <div className="appblock-headcolleft">
                        <button
                          className="appblock-collapse"
                          onClick={() => toggleSection("aboutPerson")}
                        >
                          <span className="appblock-titlelabel">
                            <FontAwesomeIcon
                              icon={
                                expandedSections["aboutPerson"]
                                  ? faAngleDown
                                  : faAngleRight
                              }
                            />{" "}
                            About Person
                          </span>
                        </button>
                      </div>
                    </div>
                    <div
                      className="details-panel"
                      style={{
                        display: expandedSections["aboutPerson"]
                          ? "block"
                          : "none",
                      }}
                    >
                      <div className="details-row">
                        <div className="details-label">Phone -</div>
                        <a
                          href="javascript:void(0);"
                          style={{
                            fontSize: "0.9em",
                            color: "#007bff",
                            textDecoration: "underline",
                          }}
                        >
                          <div
                            className="details-value"
                            onClick={(e: any) =>
                              setSelectedPhoneNmber(dealItem.phone as any)
                            }
                          >
                            {dealItem.phone || "-"}
                          </div>
                        </a>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Email -</div>
                        <div className="details-value">
                          {dealItem.email || "-"}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Person Name -</div>
                        <div
                          className="details-value"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {dealItem.personName || "-"}
                          <a
  href="#"
  onClick={(e) => { e.preventDefault(); openMoveDealDialog(); }}
  style={{ fontSize: "0.9em", color: "#007bff", textDecoration: "underline" }}
>
  View Deals ({dealItem.openDealsCount || 0})
  {isDealsLoading && <Spinner animation="border" size="sm" style={{ marginLeft: 8 }} />}
</a>
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Source -</div>
                        <div className="details-value">
                          {dealItem.sourceName || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="appdealblock-head">
                      <div className="appblock-headcolleft">
                        <button
                          className="appblock-collapse"
                          onClick={() => toggleSection("ownership")}
                        >
                          <span className="appblock-titlelabel">
                            <FontAwesomeIcon
                              icon={
                                expandedSections["ownership"]
                                  ? faAngleDown
                                  : faAngleRight
                              }
                            />{" "}
                            Transfer Ownership
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="appdealblock-data"
                      style={{
                        display: expandedSections["ownership"]
                          ? "block"
                          : "none",
                      }}
                    >
                      <div className="appdealblock-row mt-1">
                        <div className="appdeal-closedate dflex">
                          Deal Owner:{" "}
                          <div className="closedateinput">
                            <SelectDropdown
                              isValidationOptional={true}
                              onItemChange={(e: any) => {
                                const selectedUser = utility?.users.find(
                                  (u) => u.id == e
                                );
                                setDealItem({
                                  ...dealItem,
                                  assigntoId: e,
                                  ownerName:
                                    selectedUser?.name || dealItem.ownerName,
                                });
                              }}
                              value={"" + dealItem.assigntoId}
                              list={
                                utility?.users
                                  .filter((u) => u.isActive)
                                  .map(({ name, id }) => ({
                                    name: name,
                                    value: id,
                                  })) ?? []
                              }
                            />
                            {/* <div className="appdeal-dtdetail">
                            <button className="btn fields-btnedit">
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button className="btn fields-detailbtn">
                            Detail
                            </button>
                          </div> */}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="appdealblock-head">
                      <div className="appblock-headcolleft">
                        <button
                          className="appblock-collapse"
                          onClick={() => toggleSection("aboutDeal")}
                        >
                          <span className="appblock-titlelabel">
                            <FontAwesomeIcon
                              icon={
                                expandedSections["aboutDeal"]
                                  ? faAngleDown
                                  : faAngleRight
                              }
                            />{" "}
                            About this deal
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="details-panel"
                      style={{
                        display: expandedSections["aboutDeal"]
                          ? "block"
                          : "none",
                      }}
                    >
                      <div className="details-row">
                        <div className="details-label">Clinic -</div>
                        <div className="details-value">
                          {dealItem.clinicName || "-"}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Source -</div>
                        <div className="details-value">
                          {dealItem.sourceName || "-"}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Treatment -</div>
                        <div className="details-value">
                          {dealItem.treatmentName || "-"}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Last Activity -</div>
                        <div className="details-value">
                          {dealItem.modifiedDate
                            ? moment(dealItem.modifiedDate).format(
                                "MM/DD/YYYY HH:mm"
                              )
                            : "-"}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Medical_Form</div>
                        <div
                          className="details-value"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {isEditingMedicalForm ? (
                            <>
                              <div className="btn-group" role="group">
                                <button
                                  className={`btn btn-sm ${
                                    tempMedicalFormValue === "None"
                                      ? "btn-primary"
                                      : "btn-outline-primary"
                                  }`}
                                  onClick={() =>
                                    setTempMedicalFormValue("None")
                                  }
                                >
                                  (None)
                                </button>
                                <button
                                  className={`btn btn-sm ${
                                    tempMedicalFormValue === "Yes"
                                      ? "btn-primary"
                                      : "btn-outline-primary"
                                  }`}
                                  onClick={() => {
                                    setTempMedicalFormValue("Yes");
                                    handleMedicalFormYesClick(); // immediately trigger email
                                    setIsEditingMedicalForm(false); // exit edit mode
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`btn btn-sm ${
                                    tempMedicalFormValue === "No"
                                      ? "btn-primary"
                                      : "btn-outline-primary"
                                  }`}
                                  onClick={() => {
                                    setTempMedicalFormValue("No");
                                    setIsEditingMedicalForm(false); // exit edit mode
                                  }}
                                >
                                  No
                                </button>
                              </div>
                              <button
                                className="btn btn-link btn-sm text-danger"
                                onClick={() => setIsEditingMedicalForm(false)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{tempMedicalFormValue}</span>
                              <Tooltip title="Edit Medical Form Status" placement="top">
                                <FontAwesomeIcon
                                  icon={faPencil}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setIsEditingMedicalForm(true)}
                                />
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ---- Marketing details (separate section) ---- */}
                    <div className="appdealblock-head">
                      <div className="appblock-headcolleft">
                        <button
                          className="appblock-collapse"
                          onClick={() => toggleSection("marketing")}
                        >
                          <span className="appblock-titlelabel">
                            <FontAwesomeIcon
                              icon={
                                expandedSections["marketing"]
                                  ? faAngleDown
                                  : faAngleRight
                              }
                            />{" "}
                            Marketing Details
                          </span>
                        </button>
                      </div>
                    </div>

                    <div
                      className="details-panel marketing-panel"
                      style={{
                        display: expandedSections["marketing"]
                          ? "block"
                          : "none",
                      }}
                    >
                      <div className="details-row">
                        <div className="details-label">GCLID</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_GCLID)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Source</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_source)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Medium</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_medium)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Term</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_term)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Content</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_content)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Submission ID</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.submission_id)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">Marketing Consent</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketingConsent)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">T&C Consent</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.tcconsent)}
                        </div>
                      </div>
                      <div className="details-row">
                        <div className="details-label">FBCLID</div>
                        <div className="details-value">
                          {safe((dealItem as any)?.marketing_FBClid)}
                        </div>
                      </div>
                    </div>

                    <div className=" appdeal-dtrow">
                      <DealDetailsCustomFields
                        dealItem={dealItem}
                        setDealItem={setDealItem}
                      />
                    </div>


                  </div>
                </div>
              </div>
            </div>
            {dialogIsOpen && (
              <>
                {dialogToOpen === "NotesAddEdit" && (
                  <NotesAddEdit
                    dialogIsOpen={dialogIsOpen}
                    dealId={dealId}
                    setDialogIsOpen={setDialogIsOpen}
                  />
                )}

                {dialogToOpen === "EmailComposeDialog" && (
                  <EmailComposeDialog
                    personEmail={dealItem.email}
                    fromAddress={accounts[0]}
                    dialogIsOpen={dialogIsOpen}
                    onCloseDialog={(e: any) => setSelectedEmail(null)}
                    selectedItem={selectedEmail ?? new EmailCompose()}
                    setSelectedItem={setSelectedEmail}
                    setDialogIsOpen={setDialogIsOpen}
                    onSave={async (
                      emailObj: any,
                      attachmentFiles: Array<any>
                    ) => {
                      await handleSendEmail(emailObj, attachmentFiles);
                    }}
                  />
                )}

                {dialogToOpen === "MedicalFormEmailDialog" && (
                  <MedicalFormEmailDialog
                    dialogIsOpen={dialogIsOpen}
                    selectedItem={selectedEmail}
                    onCloseDialog={() => setDialogIsOpen(false)}
                    onSend={async (emailObj: any) => {
                      try {
                        console.log("📤 Sending Payload:", emailObj);
                        console.log("📤 Type of bcc:", typeof emailObj.bcc);
                        console.log(
                          "📤 Is Array?",
                          Array.isArray(emailObj.bcc)
                        );

                        // 🛠️ Fix if somehow it's a string
                        if (typeof emailObj.bcc === "string") {
                          emailObj.bcc = emailObj.bcc
                            .split(",")
                            .map((s: string) => s.trim());
                        }

                        await sendMedicalFormEmail(emailObj);
                        toast.success("Medical form email sent!");
                        setDialogIsOpen(false);
                      } catch (error: any) {
                        console.error(
                          "❌ Send email failed:",
                          error?.response?.data || error.message
                        );
                        toast.error("Failed to send email.");
                      }
                    }}
                  />
                )}

                {dialogToOpen === "TaskAddEdit" && (
                  <TaskAddEdit
                    dialogIsOpen={dialogIsOpen}
                    dealId={dealId}
                    taskItem={selectedTaskItem}
                    setDialogIsOpen={setDialogIsOpen}
                  />
                )}
              </>
            )}
            {/* Deals Dialog */}
            <DealsDialog
              show={isDealsModalOpen}
              loading={isDealsLoading} 
              onClose={closeMoveDealDialog}
              dealsData={dealsData.map((deal, index) => ({
                id: deal.dealID || index,
                stageID: deal.stageID || 0,
                treatmentName: deal.treatmentName || "No Title",
                personName: deal.personName || "No Contact",
                ownerName: deal.ownerName || "No Owner",
                organizationName: deal.name || "No Organization",
                pipelineName: deal.pipelineName || "Unknown Pipeline", // ✅ add this
                pipelineStages: deal.pipelineStages || [], // ✅ and this
              }))}
              stages={[]}
              currentStageId={0}
            />
            <DealOverView
              dealItem={dealItem}
              dealId={dealId}
              stages={stages}
              setDealItem={setDealItem}
              onDealModified={(e: any) => onStageModified(e)}
            />
            {selectedPhoneNumber ? (
              <JustCallComponent
                phoneNumber={selectedPhoneNumber}
                setPhoneNumber={setSelectedPhoneNmber}
                dealItem={dealItem}
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
