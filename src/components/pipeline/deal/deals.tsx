// @flow
import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Spinner } from "react-bootstrap";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UnAuthorized } from "../../../common/unauthorized";
import { Deal } from "../../../models/deal";
import { PipeLine } from "../../../models/pipeline";
import { Stage } from "../../../models/stage";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import Constants from "../../../others/constants";
import Util, { IsMockService } from "../../../others/util";
import { DealService } from "../../../services/dealService";
import { PipeLineService } from "../../../services/pipeLineService";
import { StageService } from "../../../services/stageService";
import { UtilService } from "../../../services/utilService";
import { DealHeader } from "./dealHeader";
import DealListView from "./dealListView";
import { DealStage } from "./dealStage";
import DealsByStage from "./dealsByStage";
import { DealFilter } from "../../../models/dealFilters";
import { DotDigitalCampaignService } from "../../../services/dotDigitalCampaignService";
import { JustcallCampaignService } from "../../../services/justCallCampaignService";
import { useAuthContext } from "../../../contexts/AuthContext";
import { Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../constants/tooltips";

type params = {
  isCombineEnabled?: any;
  initial?: any;
  useClone?: any;
  containerHeight?: any;
  withScrollableColumns?: any;
  rowData?: Array<Stage>;
  onSaveChanges?: any;
};

export const Deals = (props: params) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const pipeLineSvc = new PipeLineService(ErrorBoundary);
  const stagesSvc = new StageService(ErrorBoundary);
  const dealsSvc = new DealService(ErrorBoundary);
  const [pipeLines, setPipeLines] = useState<Array<PipeLine>>([]);
  const [stages, setStages] = useState<Array<Stage>>([]);
  const [originalStages, setOriginalStages] = useState<Array<Stage>>([]);
  const [selectedItem, setSelectedItem] = useState<PipeLine>();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<AxiosError>();
  const [customError, setCustomError] = useState<AxiosError>();
  const [deals, setDeals] = useState<Array<Deal>>([]);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [stageIdForExpand, setStageIdForExpand] = useState(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  
  // Get initial view type from URL
  const urlViewType = new URLSearchParams(location.search).get("viewType");
  const [viewType, setViewType] = useState(urlViewType === "list" ? "list" : "kanban");
  const [totalDeals, setTotalDeals] = useState<Array<Deal>>([]);
  const [selectedStageName, setSelectedStageName] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const defaultPageSize = 10;
  const [hasMore, setHasMore] = useState(false);
  const [pipeLineId, setPipeLineId] = useState(
    new URLSearchParams(location.search).get("pipelineID") as any
  );
  const { userProfile, isLoggedIn } = useAuthContext();
  const utilSvc = new UtilService(ErrorBoundary);
  const dotDigitalCampaignService = new DotDigitalCampaignService(
    ErrorBoundary
  );
  const justCallCampaignService = new JustcallCampaignService(ErrorBoundary);
  const [pageSize, setPageSize] = useState(10);

  const filters = LocalStorageUtil.getItemObject(Constants.Deal_FILTERS) as any;
  const dealFilters: Array<DealFilter> = !Array.isArray(filters)
    ? JSON.parse(filters)
    : [];
  const selectedFilterID = new URLSearchParams(location.search).get(
    "filterId"
  ) as any;
  const [selectedFilterObj, setSelectedFilterObj] = useState<any>(
    selectedFilterID > 0
      ? dealFilters?.find((i) => i.id == +selectedFilterID)
      : null
  );
  const [selectedUserId, setSelectedUserId] = useState<any>();
  const [dealFilterDialogIsOpen, setDealFilterDialogIsOpen] = useState((selectedFilterObj as DealFilter)?.isPreview ?? false);
  const stageHasMore = (
  stages: Stage[],
  perStageLimit: number,
  countsByStage?: Record<number, number> // optional: StageID -> total rows
) => {
  if (countsByStage) {
    // precise: there are more if total > currently loaded in any stage
    return stages.some(s => (countsByStage[s.stageID] ?? 0) > (s.deals?.length ?? 0));
  }
  // heuristic: if any stage returned the full page, there could be more
  return stages.some(s => (s.deals?.length ?? 0) >= perStageLimit);
};
  // useEffect(() => {
  //
  //     if(+pipeLineId>0) loadStages(pipeLineId);
  // }, [pipeLineId])

  useEffect(() => {
    // Handle viewType from URL parameters
    const urlViewType = new URLSearchParams(location.search).get("viewType");
    if (urlViewType === "list") {
      setViewType("list");
    } else if (urlViewType === "kanban" || !urlViewType) {
      setViewType("kanban");
    }
    
    loadPipeLines();
    loadAllPipeLinesAndStages();
    getDotDigitalPrograms();
    getJustCallCampaignList();

    utilSvc
      .getDropdownValues()
      .then((res) => {
        let result = IsMockService() ? res?.data : res?.utility;
        if (result) {
          LocalStorageUtil.setItemObject(
            Constants.UTILITY,
            JSON.stringify(result)
          );
        }
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  // Listen for URL changes to update view type
  useEffect(() => {
    const urlViewType = new URLSearchParams(location.search).get("viewType");
    if (urlViewType === "list") {
      setViewType("list");
    } else if (urlViewType === "kanban" || !urlViewType) {
      setViewType("kanban");
    }
  }, [location.search]);

  const getDotDigitalPrograms = () => {
    dotDigitalCampaignService
      .getDotDigitalPrograms()
      .then((res) => {
        LocalStorageUtil.setItemObject(
          Constants.DOT_DIGITAL_CAMPAIGNSLIST,
          JSON.stringify(res)
        );
      })
      .catch((err) => {
        setError(err);
      });
  };

  const getJustCallCampaignList = () => {
    justCallCampaignService
      .getJustCallCampaignList()
      .then((res) => {
        LocalStorageUtil.setItemObject(
          Constants.JUST_CALL_CAMPAIGNSLIST,
          JSON.stringify(res)
        );
      })
      .catch((err) => {
        setError(err);
      });
  };

  const loadAllPipeLinesAndStages = () => {
    stagesSvc.getAllPipeLinesAndStages().then((res) => {
      localStorage.setItem(
        "getAllPipeLinesAndStages",
        JSON.stringify(res.data)
      );
    });
  };

  const loadPipeLines = () => {
    setIsLoading(true);

    pipeLineSvc
      .getPipeLines()
      .then((res: Array<PipeLine>) => {
        setPipeLines(res);
        localStorage.setItem("allPipeLines", JSON.stringify(res));
        let selectedPipeLineId =
          pipeLineId > 0 ? pipeLineId : res[0].pipelineID;
        setPipeLineId(selectedPipeLineId);
        setSelectedItem(res.find((i) => i.pipelineID == selectedPipeLineId));
        if (!selectedFilterObj && !isLoading) loadStages(selectedPipeLineId);
      })
      .catch((err: AxiosError) => {
        setError(err);
      });
  };

  const loadStages = (
    selectedPipeLineId: number,
    skipLoading: boolean = false,
    pagesize: number = 10,
    fromDealModify: boolean = false
  ) => {
    if (!skipLoading) setIsLoading(true);
    setCustomError(null as any);
    setError(null as any);
    if (selectedPipeLineId > 0)
      stagesSvc
        .getStages(selectedPipeLineId, 1, pagesize ?? pageSize)
        .then((items) => {
          let sortedStages = Util.sortList(items.stageDtos, "stageOrder");
          const perStageLimit = pagesize ?? pageSize ?? defaultPageSize;
          
  setHasMore(stageHasMore(sortedStages, perStageLimit, (items as any)?.countsByStage));
          let totalDealsList: Array<Deal> = [];
          sortedStages.forEach((s: Stage) => {
            s.deals.forEach((d) => {
              totalDealsList.push(d);
            });
          });

          setTotalDeals([...totalDealsList]);
          setStages(sortedStages);
          setOriginalStages(sortedStages);
          setIsLoading(false);
          setIsLoadingMore(false);
          setTimeout(() => {
            if (skipLoading && fromDealModify) {
              toast.success("Deal updated successfully.");
            }
          }, 100);
        })
        .catch((err) => {
          setError(err);
        });
  };

  const loadMoreDeals = () => {
    setIsLoadingMore(true);
    setPageSize((pageSize) => pageSize + defaultPageSize);
    if (!selectedFilterObj) {
      if (!isLoading)
        loadStages(
          selectedItem?.pipelineID ?? pipeLineId,
          true,
          pageSize + defaultPageSize
        );
    } else {
      loadDealsByFilter(pageSize + defaultPageSize);
    }
  };

  useEffect(() => {
    LocalStorageUtil.setItemObject(Constants.PIPE_LINE, selectedItem);
    if (!selectedFilterObj && !selectedUserId) {
      if (!isLoading) loadStages(selectedItem?.pipelineID as any);
    }
  }, [selectedItem, selectedFilterObj, selectedUserId]);

  const onDragEnd = (result: any) => {
    const source = result.source;
    const destination = result.destination;
    
    setIsDragging(false);
    
    // If no destination, don't allow the drop
    if (!destination) {
      return;
    }
    
    // If same stage, show warning and don't allow the drop
    if (source.droppableId === destination.droppableId) {
      toast.warning("Moving deals within the same stage is not supported");
      return;
    }
    
    if (source && destination) {
      let stagesList = [...stages];
      let sourceStageIndex = stagesList.findIndex(
        (s) => s.stageID == +source.droppableId
      );
      let destinationStageIndex = stagesList.findIndex(
        (s) => s.stageID == +destination.droppableId
      );
      
      // Find the deal being moved by draggableId (which is the dealID)
      let dealToMove = stagesList[sourceStageIndex]?.deals?.find(
        (d) => d.dealID == +result.draggableId
      );
      let dealIndex = stagesList[sourceStageIndex]?.deals?.findIndex(
        (d) => d.dealID == +result.draggableId
      );
      
      if (dealToMove && dealIndex !== -1) {
        // Remove from source stage
        stagesList[sourceStageIndex].deals.splice(dealIndex, 1);
        
        // Insert at the correct position in destination stage
        stagesList[destinationStageIndex].deals.splice(destination.index, 0, dealToMove);
        
        setStages([...stagesList]);

        // Only proceed if userProfile is available
        if (!userProfile?.userId) {
          toast.error('User session not available. Please refresh the page.');
          setStages([...originalStages]);
          return;
        }

        dealsSvc
          .putItemBySubURL(
            {
              newStageId: +destination.droppableId,
              modifiedById: userProfile.userId,
              dealId: dealToMove.dealID,
              pipelineId: selectedItem?.pipelineID || pipeLineId,
              statusId: dealToMove?.statusID || 1,
            },
            dealToMove.dealID + "/stage"
          )
          .then((res) => {
            toast.success("Deal moved to another stage successfully");
            if (selectedFilterObj?.id > 0) {
              loadDealsByFilter();
            } else {
              if (!isLoading) loadStages(selectedItem?.pipelineID as any, true);
            }
          })
          .catch((err) => {
            toast.error("Failed to move deal. Please try again.");
            setError("No deals found under selected combination" as any);
            setStages([...originalStages]);
          });
      }
    }
  };

  const loadDealsByFilter = (size?: number) => {
    setIsLoading(true);
    setCustomError(null as any);
    setError(null as any);
    (selectedUserId > 0
      ? stagesSvc.getDealsByUserId(
          selectedUserId,
          selectedItem?.pipelineID ?? pipeLineId,
          1,
          pageSize ?? pageSize
        )
      : stagesSvc.getDealsByFilterId(
          selectedFilterObj?.id,
          selectedItem?.pipelineID ?? pipeLineId,
          userProfile?.userId ?? 0,
          1,
          pageSize ?? pageSize
        )
    )
      .then((res) => {
        setIsLoading(false);
        const sortedStages = Util.sortList(res.stages, "stageOrder");
        let totalDealsList: Array<Deal> = [];
        sortedStages.forEach((s: Stage) => {
          s.deals.forEach((d) => {
            totalDealsList.push(d);
          });
        });
        setTotalDeals([...totalDealsList]);
        setStages(sortedStages);
        setOriginalStages(sortedStages);
        const perStageLimit = size ?? pageSize ?? defaultPageSize;
    setHasMore(
      stageHasMore(sortedStages, perStageLimit, (res as any)?.countsByStage)
    );
        setIsLoadingMore(false);
       
 
      })
      .catch((err) => {
        setCustomError("No deals under selected combination" as any);
        setTotalDeals([]);
        setStages([]);
        setOriginalStages([]);
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  };

  useEffect(() => {
  LocalStorageUtil.setItem(Constants.FILTER_ID, selectedFilterObj?.id);

  if (selectedFilterObj?.id > 0 || selectedUserId > 0) {
    if (selectedFilterObj?.id > 0) {
      setSelectedUserId(null as any);
    }

    if (selectedFilterObj && selectedFilterObj.isPreview) {
      setDealFilterDialogIsOpen(true);
    }

    loadDealsByFilter();
  }
}, [selectedFilterObj, selectedUserId]);



  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const hasOverflow = scrollWidth > clientWidth + 10;
        setShowScrollButtons(hasOverflow);
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
      const mainContent = document.querySelector('.maincontent');
      if (mainContent) {
        const rect = mainContent.getBoundingClientRect();
        setSidebarWidth(rect.left);
      }
    };
    checkScroll();
    setTimeout(checkScroll, 100);
    setTimeout(checkScroll, 500);
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    const observer = new MutationObserver(checkScroll);
    const sidebar = document.querySelector('.sidebar');
    const mainLayout = document.querySelector('.mainlayout');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'], subtree: true });
    }
    if (mainLayout) {
      observer.observe(mainLayout, { attributes: true, childList: true, subtree: true });
    }
    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [stages]);

  // Remove the userProfile waiting condition to prevent infinite loading

  return (
    <>
      {isLoading ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="pdstage-mainarea">
            {viewType === "kanban" ? (
              <DealHeader
                canAddDeal={pipeLines.length > 0}
                onSaveChanges={(e: any) => loadPipeLines()}
                setPipeLineId={setPipeLineId}
                pipeLineId={pipeLineId}
                selectedItem={selectedItem as any}
                setSelectedItem={(e: any) => setSelectedItem(e)}
                pipeLinesList={pipeLines}
                stagesList={stages}
                selectedStageId={dialogIsOpen ? null : (selectedStageId as any)}
                onDealDialogClose={(e: any) => setSelectedStageId(null)}
                setViewType={(e: any) => setViewType(e)}
                selectedFilterObj={selectedFilterObj}
                setSelectedFilterObj={setSelectedFilterObj}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                setDealFilterDialogIsOpen={setDealFilterDialogIsOpen}
                dealFilterDialogIsOpen={dealFilterDialogIsOpen}
              />
            ) : null}
            {viewType === "kanban" ? (
              <div className="pdstage-area" ref={scrollContainerRef}>
                <div className="pdstagearea-inner">
                  {/* Show no deals message when filter is applied but no deals found */}
                  {(selectedFilterObj || selectedUserId) && stages.length === 0 && !isLoading ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '400px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <h3 style={{ marginBottom: '8px', color: '#333' }}>No deals found</h3>
                      <p style={{ marginBottom: '16px' }}>No deals match the selected filter combination.</p>
                      <Tooltip title="Remove all active filters and show all deals" placement="top">
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedFilterObj(null);
                            setSelectedUserId(null);
                          }}
                          style={{ padding: '8px 16px' }}
                        >
                          Clear Filters
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                  <>
                    {showScrollButtons && showLeftArrow && (
                      <Tooltip title="Scroll left to view previous stages" placement="right">
                        <button onClick={() => {
                          if (scrollContainerRef.current) {
                            scrollContainerRef.current.scrollLeft -= 400;
                          }
                        }} style={{ position: 'fixed', left: `${sidebarWidth + 20}px`, top: '50%', transform: 'translateY(-50%)', zIndex: 99999, background: '#fff', border: '2px solid #b68d40', borderRadius: '50%', width: 50, height: 50, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: 32, fontWeight: 'bold', color: '#b68d40' }}>‹</button>
                      </Tooltip>
                    )}
                    {showScrollButtons && showRightArrow && (
                      <Tooltip title="Scroll right to view more stages" placement="left">
                        <button onClick={() => {
                          if (scrollContainerRef.current) {
                            scrollContainerRef.current.scrollLeft += 400;
                          }
                        }} style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 99999, background: '#fff', border: '2px solid #b68d40', borderRadius: '50%', width: 50, height: 50, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: 32, fontWeight: 'bold', color: '#b68d40' }}>›</button>
                      </Tooltip>
                    )}
                  <div className="pdstage-row" hidden={pipeLines.length == 0}>
                    <DragDropContext
                      onDragEnd={onDragEnd}
                      onDragStart={(e: any) => setIsDragging(true)}
                      onDragUpdate={(e: any) => setIsDragging(true)}
                    >
                      <Droppable
                        droppableId="board"
                        type="COLUMN"
                        direction="horizontal"
                      >
                        {(provided) => (
                          <>
                            {stages?.map((item, index) => (
                              <DealStage
                                key={index}
                                stageID={item.stageID}
                                title={item.stageName}
                                deals={item.deals}
                                providedFromParent={provided}
                                isDragging={isDragging}
                                pipeLinesList={pipeLines}
                                onDealModify={(e: any) => {
                                  if (!isLoading)
                                    loadStages(
                                      selectedItem?.pipelineID as any,
                                      true,
                                      null as any,
                                      true
                                    );
                                }}
                                onDealAddClick={(e: any) =>
                                  setSelectedStageId(e)
                                }
                                onStageExpand={(e: any) => {
                                  setSelectedStageName(item.stageName);
                                  setDialogIsOpen(true);
                                  setStageIdForExpand(e);
                                }}
                                onSaveChanges={(e: any) =>
                                  props.onSaveChanges()
                                }
                              />
                            ))}
                            {/* {provided.placeholder} */}
                          </>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                  </>
                  )}
                  <div className="loadingmore">
                    {hasMore && !isLoadingMore && pipeLines.length > 0 && (
                    <div
                      style={{ textAlign: "center" }}
                      hidden={isLoadingMore || pipeLines.length == 0}
                    >
                      <Tooltip title="Load more deals from all stages" placement="top">
                        <button
                          type="button"
                          className="btn btn-primary btngradiant"
                          style={{
                            minWidth: 160,
                            minHeight: 44,
                            fontWeight: 600,
                            fontSize: 16,
                            borderRadius: 8,
                            background: 'linear-gradient(90deg, #b68d40 0%, #cfa34c 100%)',
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(33,35,44,0.08)',
                            transition: 'background 0.2s',
                            margin: '16px 0',
                            padding: '0 32px',
                            outline: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          onClick={(e: any) => loadMoreDeals()}
                        >
                          Load More
                        </button>
                      </Tooltip>
                    </div>
                     )}
                    <div
                      style={{ textAlign: "center" }}
                      hidden={!isLoadingMore || selectedFilterObj?.id > 0}
                    >
                      Loading More...
                    </div>
                  </div>
                  <div
                    className="nopipelinesmsg"
                    style={{ textAlign: "center" }}
                    hidden={pipeLines.length > 0}
                  >
                    No pipelines are avilable to show
                  </div>
                </div>
              </div>
            ) : (
              <DealListView
                pipeLineId={selectedItem?.pipelineID ?? pipeLineId}
                setViewType={(e: any) => setViewType(e)}
                onSaveChanges={(e: any) => loadPipeLines()}
                pipeLinesList={pipeLines}
                selectedStageId={dialogIsOpen ? null : (selectedStageId as any)}
              />
            )}
          </div>
          {(error || customError) && (
            <UnAuthorized
              error={error as any}
              customMessage={customError as any}
            />
          )}
          {dialogIsOpen && (
            <DealsByStage
              stageId={stageIdForExpand as any}
              stageName={selectedStageName as any}
              dialogIsOpen={dialogIsOpen}
              setDialogIsOpen={setDialogIsOpen}
            />
          )}
        </>
      )}
    </>
  );
};
function getDotDigitalPrograms() {
  throw new Error("Function not implemented.");
}
