import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import UnfoldMoreOutlinedIcon from "@mui/icons-material/UnfoldMoreOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { EntitType } from "../../../../models/deal";
import axios from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { ErrorBoundary } from "react-error-boundary";
import { Deal, DealTimeLine } from "../../../../models/deal";
import { DealAuditLogService } from "../../../../services/dealAuditLogService";
import { DealService } from "../../../../services/dealService";
import { Utility } from "../../../../models/utility";
import Constants from "../../../../others/constants";
import LocalStorageUtil from "../../../../others/LocalStorageUtil";
import CallsActivites from "./call/callsActivites";
import DealLogsList from "./dealActivityLogs/dealLogsList";
import { AuthProvider } from "./email/authProvider";
import EmailActivites from "./email/emailActivites";
import NotesList from "./notes/notesList";
import TasksList from "./tasks/tasksList";
import { Spinner } from "react-bootstrap";
import parse, { domToReact } from "html-react-parser";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";

// Define the structure of a Call object based on the API response
type Call = {
  id: string;
  callDate: string;
  callTime: string;
  contactName?: string;
  contactNumber?: string;
  justCallNumber?: string;
  agentName?: string;
  callInfo?: {
    direction?: string;
    type?: string;
    disposition?: string;
    notes?: string;
    recording?: string;
    missedCallReason?: string;
  };
  duration?: number;
  campaign?: {
    id?: string;
    name?: string;
    type?: string;
  };
  status?: string;
  recordingUrl?: string;
  missedCallReason?: string;
};
type params = {
  dealItem: Deal;
  dealId: number;
  refreshTrigger?: number;
};
const DealActivities = (props: params) => {
  const { dealItem, dealId, refreshTrigger, ...others } = props;
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [defaultActiveKey, setdefaultActiveKey] = useState("activity_sub");
  const [error, setError] = useState(null);
  // Initialize DealService
  const dealSvc = new DealService(ErrorBoundary);
  const dealAuditLogSvc = new DealAuditLogService(ErrorBoundary);
  const [dealTimeLines, setDealTimeLines] = useState<Array<DealTimeLine>>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );
  
  const getCreatorName = (createdBy: number) => {
    if (!createdBy) return 'System';
    const user = utility?.users?.find(u => u.id === createdBy);
    const person = utility?.persons?.find(p => p.personID === createdBy);
    return user?.name || person?.personName || `User ${createdBy}`;
  };
  // Added heading and span tags to allowedTags for better parsing in extractSubjectFromHtml
  const allowedTags = ["b", "i", "u", "strong", "em", "p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "span"];

  const options = {
    replace: (domNode: any) => {
      if (domNode.type === "tag" && !allowedTags.includes(domNode.name)) {
        return <>{domToReact(domNode.children, options)}</>; // Flatten unwanted tags
      }
    },
  };

  const fetchCallHistory = async () => {
    try {
      const axiosCancelSource = axios.CancelToken.source();
      setIsLoading(true);
      const response = await dealSvc.getDealsById(dealId, axiosCancelSource);
      console.log("API Response:", response); // Log full response

      if (response && response.callHistory) {
        // Map and add default values for required fields
        const updatedCallHistory = response.callHistory.map((call: any) => ({
          ...call,
          status: call.status || "Pending", // Default if missing
          callInfo: {
            ...call.callInfo,
            missedCallReason: call.callInfo?.missedCallReason || "Not Provided", // Default if missing
            recording: call.callInfo?.recording || "", // Default to empty string
          },
        }));

        setCallHistory(updatedCallHistory);
        setIsLoading(false);
        console.log("Updated callHistory in state:", updatedCallHistory);
      } else {
        console.warn("API Response does not contain expected data.");
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Error fetching call history:", error);
      }
    }
  };

  const featchDealTimeLines = async () => {
    try {
      setIsLoading(true);
      let res = await dealAuditLogSvc.getDealTimeLine(dealId);
      setDealTimeLines(res as any);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching deal timelines:", error);
    }
  };

  useEffect(() => {
    if (!dealId) return;
    featchDealTimeLines();
    fetchCallHistory();
  }, [dealId]);

  // Refetch activities when deal changes (e.g., stage change)
  useEffect(() => {
    if (dealItem?.dealID && dealItem?.stageID) {
      featchDealTimeLines();
    }
  }, [dealItem?.stageID, dealItem?.dealID]);

  // Refetch activities when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('Refreshing activities due to trigger:', refreshTrigger);
      featchDealTimeLines();
    }
  }, [refreshTrigger]);

  const getEventIcon = (eventType: number) => {
  let icon;
  switch (eventType) {
    case EntitType.Task:
      icon = <CorporateFareIcon />;
      break;
    case EntitType.Note:
      icon = <StickyNote2OutlinedIcon />;
      break;
    case EntitType.Email:
      icon = <EmailOutlinedIcon />;
      break;
    case EntitType.Deal:
      icon = <TrackChangesIcon />;
      break;
    case EntitType.Comment:
      icon = <FiberManualRecordIcon />;
      break;
    case 7: // Pipeline Updated
      icon = <TrackChangesIcon />;
      break;
    case 9: // Stage Updated
      icon = <TrackChangesIcon />;
      break;
    default:
      icon = <PhoneInTalkOutlinedIcon />; // fallback
  }
  return icon;
};

  /**
   * Helper function to extract a potential subject from raw HTML content.
   * It prioritizes heading tags, then significant text blocks, and finally
   * a plain text line heuristic.
   * @param htmlString The raw HTML content from activityDetail.
   * @returns An object containing the extracted subject and the potentially adjusted body HTML.
   */
  const extractSubjectFromHtml = (htmlString: string): { subject: string; body: string } => {
 const tempDiv = document.createElement('div');
tempDiv.innerHTML = htmlString;

let extractedSubject = "";
let processedBodyHtml = htmlString; 


 const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
for (const element of Array.from(headingElements)) {
const textContent = element.textContent?.trim();

if (textContent && textContent.length > 5 && textContent.length < 200 && !textContent.includes('<') && !textContent.includes('>')) {
 extractedSubject = textContent;

 element.remove(); 
 processedBodyHtml = tempDiv.innerHTML; 
 break;
 }
}


 if (!extractedSubject) {
 const potentialSubjectElements = tempDiv.querySelectorAll('p, div, span');
for (const element of Array.from(potentialSubjectElements)) {
 const textContent = element.textContent?.trim();

 if (textContent && textContent.length > 5 && textContent.length < 200 && !textContent.includes('<') && !textContent.includes('>')) {
 extractedSubject = textContent;
 element.remove(); 
processedBodyHtml = tempDiv.innerHTML; 
 break;
}
}
 }


 if (!extractedSubject) {
const plainText = tempDiv.textContent || ""; // Get all text content
        const lines = plainText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length > 0 && lines[0].length > 5 && lines[0].length < 150) {
            extractedSubject = lines[0];
            const subjectEscaped = extractedSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const regex = new RegExp(`(<p[^>]*>\\s*)?${subjectEscaped}(\\s*<\\/p>)?`, 'i');

            const tempHtmlWithoutSubject = htmlString.replace(regex, '').trim(); 
            processedBodyHtml = tempHtmlWithoutSubject;
        }
 }


 if (!extractedSubject || extractedSubject.toLowerCase() === "email" || extractedSubject.toLowerCase() === "hi" || extractedSubject.toLowerCase() === "hello user") {
extractedSubject = "Email Activity";
 }

 return { subject: extractedSubject, body: processedBodyHtml };
 };

  const EmailItemRenderer = ({ item }: { item: DealTimeLine }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  let subject = "";
  let body = "";
  let toRecipients = "";
  let emailAddress = "";

  try {
    const outerParsed = JSON.parse(item.activityDetail || "");
    if (outerParsed && typeof outerParsed.message === "string") {
      const innerMessage = JSON.parse(outerParsed.message);
      subject = innerMessage.subject || "";
      body = innerMessage.body || "";
      toRecipients = innerMessage.toRecipients
        ? JSON.parse(innerMessage.toRecipients).join(", ")
        : "";
      emailAddress = innerMessage.emailAddress || "";
    } else {
      const extracted = extractSubjectFromHtml(item.activityDetail || "");
      subject = extracted.subject;
      body = extracted.body;
    }
  } catch (e) {
    const extracted = extractSubjectFromHtml(item.activityDetail || "");
    subject = extracted.subject;
    body = extracted.body;
  }

  return (
    <div className="email-structured-content" style={{ background: "#fffde7", padding: "10px", borderRadius: "5px" }}>
  <div
    className="email-header-line d-flex justify-content-between align-items-center"
    style={{ cursor: "pointer" }}
    onClick={() => setIsCollapsed(!isCollapsed)}
  >
    <div style={{ fontWeight: 600 }}>{subject || "Email Activity"}</div> {/* Subject in bold */}
    <UnfoldMoreOutlinedIcon
      style={{
        transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
        transition: "transform 0.2s"
      }}
    />
  </div>

  {!isCollapsed && (
    <>
      {emailAddress && (
        <p className="email-from-line" style={{ fontWeight: 400 }}>
          <strong>From:</strong> {emailAddress}
        </p>
      )}
      {toRecipients && (
        <p className="email-to-line" style={{ fontWeight: 400 }}>
          <strong>To:</strong> {toRecipients}
        </p>
      )}
      <div className="email-body-content" style={{ fontWeight: 400 }}>
        {parse(body, options)}
      </div>
      <p className="email-attachments-line">No attachments available.</p>
    </>
  )}
</div>
  );
};



  return (
    <>
      {isLoading ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : null}
      <div className="timeline-tabscontent">
        <Tabs
          defaultActiveKey={defaultActiveKey}
          transition={false}
          onSelect={(e: any) => {
            // Only re-fetch if the active key is 'activity_sub' as that's where timelines are displayed
            if (e === "activity_sub") {
              featchDealTimeLines();
            }
            setdefaultActiveKey(e);
          }}
          id="noanim-tab-example"
          className="mb-5 activity-subtab"
        >
          <Tab eventKey="activity_sub" title="Activity">
  {defaultActiveKey === "activity_sub" && (
    <AuthProvider>
      {dealTimeLines.length > 0 ? (
        dealTimeLines.map((item, index) => {
          const isBasicLog =
            item.eventTypeId === EntitType.Deal ||
            item.eventTypeId === 7 || // Pipeline
            item.eventTypeId === 9;   // Stage

          return (
            <div className={`appboxdata ${isBasicLog ? "basic-log" : ""}`} key={index}>
              <div className="appboxdata-row">
                <div className="lineroundicon PhoneInTalkOutlinedIcon">
                  {getEventIcon(item.eventTypeId)}
                </div>

                <div className={`appboxdata-rowdata ${isBasicLog ? "unified-log" : "highlight-box"}`}>
                  <div className="appboxdatarow-head">
                    <div className="appboxdatarow-headrow">
                      <h2>
                        {item.eventTypeId === EntitType.Email ? "Email" : item.eventType}
                        {(item as any).userName && (
                          <span style={{ fontWeight: 'normal', fontSize: '14px', marginLeft: '8px' }}>
                            by {(item as any).userName}
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className="appboxdata-meta appboxdata-headmeta">
                      <div className="appboxdatameta-date">
                        {moment(item.eventDate).format("MM-DD-YYYY hh:mm:ss a")}
                      </div>
                      <div className="appboxdatameta-service">
                        &nbsp;&nbsp;({item.timeline?.replace(/^-/, '') || item.timeline})
                      </div>
                    </div>
                  </div>

                  <div className="appboxdatarow-foot">
                    <div className="appboxdatafoot-call">
                      <div className="appboxdatafoot-calltext" style={{ color: 'var(--text-primary)' }}>
                        {item.eventTypeId === EntitType.Email ? (
    <EmailItemRenderer item={item} />
  ) : (
    parse(item.activityDetail || "", options)
  )}
                      </div>
                    </div>
                    <div className="appboxdata-meta appboxdata-footmeta">
                      <div
                        className="appboxdatameta-leadname"
                        hidden={!item.contactNumber}
                      >
                        <PersonOutlineIcon /> {item.contactNumber}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="no-activities-message" style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>No recent activities</div>
          <div style={{ fontSize: '14px' }}>Activities will appear here as they are created</div>
        </div>
      )}
    </AuthProvider>
  )}
</Tab>
          <Tab eventKey="notes" title="Notes">
            {defaultActiveKey === "notes" && (
              <NotesList dealId={dealItem.dealID} />
            )}
          </Tab>
          <Tab
            eventKey="email"
            title="Email"
          >
            {defaultActiveKey === "email" && (
              <AuthProvider>
                <EmailActivites dealId={dealItem.dealID} />
              </AuthProvider>
            )}
          </Tab>
          <Tab eventKey="calls" title="Calls">
            {defaultActiveKey === "calls" && (
              <CallsActivites callHistory={callHistory} />
            )}
          </Tab>
          <Tab eventKey="tasks" title="Tasks">
            {defaultActiveKey === "tasks" && (
              <AuthProvider>
                <TasksList dealId={dealItem.dealID} />
              </AuthProvider>
            )}
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

export default DealActivities;