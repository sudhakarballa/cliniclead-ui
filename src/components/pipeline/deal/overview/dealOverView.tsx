import {
  faEllipsis,
  faGear,
  faPenToSquare,
  faPencil,
  faThumbsDown,
  faThumbsUp,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { AxiosError } from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import Dropdown from "react-bootstrap/Dropdown";
import { ErrorBoundary } from "react-error-boundary";
import { UnAuthorized } from "../../../../common/unauthorized";
import SelectDropdown from "../../../../elements/SelectDropdown";
import { Deal } from "../../../../models/deal";
import { Notes } from "../../../../models/notes";
import { Stage } from "../../../../models/stage";
import { NotesService } from "../../../../services/notesService";
import DealActivities from "../activities/dealActivities";
import { IsMockService } from "../../../../others/util";
import { DealService } from "../../../../services/dealService";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import DealLostConfirmationDialog from "./dealLostConfirmation";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
import { Tooltip } from "@mui/material";


type params = {
  dealItem: Deal;
  dealId:number;
  stages: Array<Stage>;
  setDealItem: any;
  onDealModified: any;
};
const DealOverView = (props: params) => {
  const { dealItem, dealId, stages, setDealItem, onDealModified, ...others } = props;
  const { createdDate, pipelineName, stageName } = dealItem;
  const recentActivitesFilters: Array<any> = ["All Activities"].map(
    (item: any) => ({ name: item, value: item })
  );
  const location = useLocation(); 
  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState("All Activities");
  const notesSvc = new NotesService(ErrorBoundary);
  const dealSvc = new DealService(ErrorBoundary); // Instantiate DealService
  const [notesList, setNotesList] = useState<Array<Notes>>([]);
  const [error, setError] = useState<AxiosError>();
  const [isDealLost, setIsDealLost]=useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Listen for email sent events to refresh activities
  useEffect(() => {
    const handleEmailSent = (event: CustomEvent) => {
      if (event.detail?.dealId === dealId) {
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('emailSent', handleEmailSent as EventListener);
    return () => window.removeEventListener('emailSent', handleEmailSent as EventListener);
  }, [dealId]);
  const removeSpecificTags = (html: string | null | undefined): string => {
    if (!html) return ""; // Handle null or undefined input
    return html.replace(/<[^>]+>/g, "");
  };
const prevStateRef = useRef<{ statusID:number | undefined; stageID:number; modifiedDate?: any; comments?: string | null;     // add
  reason?: string | null;   // add (use one name consistently)
 } | null>(null);


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const newDealId = Number(queryParams.get("id"));
    const newPipelineId = Number(queryParams.get("pipeLineId"));

    if (newDealId !== dealId) {
      setDealItem((prevItem: Deal) => ({ ...prevItem, dealId: newDealId }));
    }
    if (newPipelineId !== pipelineId) {
      setPipelineId(newPipelineId);
    }
  }, [location.search]);
  // Fetch notes when dealId changes
  useEffect(() => {
    if (!dealId) return;

    notesSvc.getNotes(dealId)
      .then((res) => {
        setNotesList(
          IsMockService()
            ? (res as Array<Notes>).filter((n) => n.dealID === dealId)
            : res
        );
      })
      .catch((err) => setError(err));
  }, [dealId]);

  

// Function to update the deal status

const updateDealStatus = async (
  status: "Open" | "Won" | "Lost" | "Closed",
  extraFields: Partial<Deal> = {},
  options?: { allowUndo?: boolean }
) => {
  try {
    const isClosed = status === "Won" || status === "Lost";

    const statusIdMap: Record<string, number> = {
      Open: 1,
      Won: 2,
      Lost: 3,
      Closed: 4,
    };

    // Save previous state (for Undo)
prevStateRef.current = {
  statusID: dealItem.statusID,
  stageID: dealItem.stageID,
  modifiedDate: dealItem.modifiedDate,
  comments: dealItem.comments ?? null,
  reason: (dealItem as any).reason ?? null, // or lostReason — be consistent
};

    const updatedDeal: Deal = {
      ...dealItem,
      ...extraFields,               // e.g., comments for Lost, specific stageID on reopen, etc.
      statusID: statusIdMap[status],
      isClosed,
      modifiedDate: new Date() as any,
    };

    const response = await dealSvc.updateAllDeals([updatedDeal]);

    if (response) {
      setDealItem(updatedDeal);
      const msg = `Deal marked as ${status}!`;

      if (options?.allowUndo) {
  toast(({ closeToast }) => (
    <div>
      {msg}&nbsp;
      <button
        onClick={async () => {
          const prev = prevStateRef.current;
          if (!prev) return closeToast?.();

          const reverted: Deal = {
            ...updatedDeal,          // start from current payload
            statusID: prev.statusID!,// revert status (e.g., back to 3 "Lost")
            stageID: prev.stageID,
            isClosed: prev.statusID === 2 || prev.statusID === 3,
            modifiedDate: prev.modifiedDate,
            comments: prev.comments, // restore exact previous values
            reason: prev.reason,     // (or lostReason if that's your field)
          };

          const ok = await dealSvc.updateAllDeals([reverted]);
          if (ok) {
            setDealItem(reverted);
            toast.success("Reverted change.");
            prevStateRef.current = null; // optional: prevent double-undo
          } else {
            toast.error("Failed to revert change.");
          }
          closeToast?.();
        }}
        className="btn btn-link p-0 mx-1"
      >
        Undo
      </button>
    </div>
  ), { autoClose: 10000 });
}
 else {
        toast.success(msg);
      }
    } else {
      toast.warning("Unable to update deal status");
    }
  } catch (error) {
    console.error("Failed to update deal status", error);
    toast.error("Failed to update deal status");
  }
};



const handleWonClick = () => {
  if (dealItem?.statusID === 2) return; // already won
  const ok = window.confirm("Mark this deal as WON? You can undo for ~10 seconds.");
  if (!ok) return;

  updateDealStatus("Won", {}, { allowUndo: true });
  setIsDealLost(false);
};

const handleLostClick = () => {
  if (dealItem?.statusID === 3) return; // already lost
  // you already open a dialog; keep it:
  setIsDealLost(true);
};


  return (
    <>
      {error && <UnAuthorized error={error as any} />}
      <div className="timelinecontent-col">
        <div className="timelinecontent">
          <div className="timeline-block">
            <div className="pdstage-detailtop pt-3 pb-4">
              <div className="container-fluid">
                <div className="pdsdetailtop-row">
                  <div className="pdsdetail-title">
                    <h1>
                      {dealItem?.name}{" "}
                      <button className="titleeditable-btn">
                        <FontAwesomeIcon icon={faPencil} />
                      </button>
                    </h1>
                  </div>
                  <div className="pdsdetail-topright">
                    <div className="wonlost-btngroup">
                      <Tooltip title="Mark deal as Won" placement="top">
                        <button 
                          className={`btn wonbtn ${
                            dealItem?.statusID === 2 
                              ? 'btn-success' 
                              : 'btn-outline-success'
                          }`}
                          onClick={handleWonClick}
                          style={{
                            boxShadow: dealItem?.statusID === 2 
                              ? '0 0 10px rgba(40, 167, 69, 0.5)' 
                              : 'none',
                            transform: dealItem?.statusID === 2 
                              ? 'scale(1.1)' 
                              : 'scale(1)',
                            marginRight: 16
                          }}
                        >
                          <span className="label">
                            <FontAwesomeIcon icon={faThumbsUp} />
                            {dealItem?.statusID === 2 && (
                              <>
                                {' WON'}
                                {dealItem.modifiedDate && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      background: '#e3f2fd',
                                      borderRadius: '8px',
                                      padding: '4px 10px',
                                      boxShadow: '0 1px 4px rgba(25, 118, 210, 0.10)',
                                      transition: 'background 0.2s',
                                      fontSize: '13px',
                                      color: '#1976d2',
                                      fontWeight: 500,
                                      position: 'relative',
                                    }}
                                    title={`Won on: ${moment(dealItem.modifiedDate).format('MM/DD/YYYY hh:mm:ss a')}`}
                                    className="deal-won-info-icon"
                                  >
                                    <FontAwesomeIcon icon={faInfoCircle} color="#1976d2" style={{ fontSize: 16, marginRight: 0 }} />
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </button>
                      </Tooltip>
                      <Tooltip title="Mark deal as Lost" placement="top">
                        <button 
                          className={`btn lostbtn ${
                            dealItem?.statusID === 3 
                              ? 'btn-danger' 
                              : 'btn-outline-danger'
                          }`}
                          onClick={handleLostClick}
                          style={{
                            boxShadow: dealItem?.statusID === 3 
                              ? '0 0 10px rgba(220, 53, 69, 0.5)' 
                              : 'none',
                            transform: dealItem?.statusID === 3 
                              ? 'scale(1.1)' 
                              : 'scale(1)'
                          }}
                        >
                          <span className="label">
                            <FontAwesomeIcon icon={faThumbsDown} />
                            {dealItem?.statusID === 3 && (
                              <>
                                {' LOST'}
                                {dealItem.comments && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      background: '#fdecea',
                                      borderRadius: '8px',
                                      padding: '4px 10px',
                                      boxShadow: '0 1px 4px rgba(220, 53, 69, 0.10)',
                                      transition: 'background 0.2s',
                                      fontSize: '13px',
                                      color: '#d32f2f',
                                      fontWeight: 500,
                                      position: 'relative',
                                    }}
                                    title={dealItem.comments}
                                    className="deal-lost-info-icon"
                                  >
                                    <FontAwesomeIcon icon={faInfoCircle} color="#d32f2f" style={{ fontSize: 16, marginRight: 0 }} />
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </button>
                      </Tooltip>
                      {(dealItem?.statusID === 2 || dealItem?.statusID === 3) && (
                        <Tooltip title="Reopen this deal" placement="top">
                          <button
                            className="btn btn-outline-secondary ms-2"
                            onClick={() => {
                              const lastOpenStageID =
                                (dealItem as any).lastOpenStageID ??
                                dealItem.stageID ??
                                stages?.[0]?.stageID;

                              updateDealStatus(
                                "Open",
                                {
                                  stageID: lastOpenStageID,
                                  comments: null,
                                  reason: null,
                                },
                                { allowUndo: true }
                              );
                            }}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                            Reopen
                          </button>
                        </Tooltip>
                      )}

                    </div>
                    {/* <div className="ellipsis-btncol">
                      <button className="ellipsis-btn">
                        <FontAwesomeIcon icon={faEllipsis} />
                      </button>
                    </div> */}
                  </div>
                </div>
                <div className="stageday-bar pt-4 pb-4">
                  <div className="pipelinestage-selector pipelinestage-active">
                    {stages.map((sItem, sIndex) => (
                      <div
                        key={sIndex}
                        className={
                          "pipelinestage " +
                          (sItem.stageID == dealItem?.stageID
                            ? "pipelinestage-current"
                            : "")
                        }
                        aria-label={sItem.stageName}
                        title={sItem.stageName}
                        onClick={async (e: any) => {
                          // Don't trigger if clicking on the same stage
                          if (sItem.stageID === dealItem?.stageID) {
                            return;
                          }
                          
                          setDealItem({ ...dealItem, stageID: sItem.stageID });
                          await onDealModified(sItem.stageID);
                          // Add delay to ensure stage change is processed
                          setTimeout(() => {
                            setRefreshTrigger(prev => prev + 1);
                          }, 500);
                        }}
                      >
                        <label>{sItem.stageName}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="timeline-blockinner" style={{ marginTop: '30px' }}>
              <DealActivities dealItem={dealItem} dealId={dealId} refreshTrigger={refreshTrigger}/>
            </div>
          </div>
        </div>
      </div>
      {
        isDealLost && <DealLostConfirmationDialog 
        dialogIsOpen={isDealLost} 
        setDialogIsOpen={setIsDealLost} 
        header={"Deal Edit"} 
        selectedItem={dealItem} 
        setSelectedItem={setDealItem} 
        onSave={(updatedFields: any) => updateDealStatus("Lost", updatedFields)} 
        onClose={undefined} 
        closeDialog={setIsDealLost} 
        setLoadRowData={undefined} />
      }
    </>
  );
};

export default DealOverView;
/* Add this CSS to App.css or a relevant CSS file:
.deal-won-info-icon:hover {
  background: #bbdefb;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.18);
}
*/
