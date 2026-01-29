import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DealAddEditDialog } from "./dealAddEditDialog";
import SelectDropdown from "../../../elements/SelectDropdown";
import { PipeLine } from "../../../models/pipeline";
import { display, marginLeft, width } from "@xstyled/styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretDown,
  faPencil,
  faChartSimple,
  faAlignCenter,
  faBars,
  faDollarSign,
  faCheck,
  faAdd,
  faGripLines,
  faEye,
  faCircleInfo,
  faGrip,
  faFilter
} from "@fortawesome/free-solid-svg-icons";
import OutsideClickHandler from "react-outside-click-handler";
import { Stage } from "../../../models/stage";
import Dropdown from "react-bootstrap/Dropdown";
import FilterDropdown from "./dealFilters/filterDropdown/filterDropdown";
import DealFilterAddEditDialog from "./dealFilters/dealFilterAddEditDialog";
import { DealFilter } from "../../../models/dealFilters";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DoneIcon from '@mui/icons-material/Done';
import { Utility } from "../../../models/utility";
import Constants from "../../../others/constants";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import { Button, Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../constants/tooltips";

type params = {
  canAddDeal: boolean;
  onSaveChanges: any;
  selectedItem: PipeLine;
  setSelectedItem: any;
  pipeLinesList: Array<PipeLine>;
  stagesList: Array<Stage>;
  selectedStageId: number;
  onDealDialogClose: any;
  setViewType: any;
  selectedFilterObj:any;
  setSelectedFilterObj:any;
  setSelectedUserId:any;
  selectedUserId:any;
  dealFilterDialogIsOpen:any;
  setDealFilterDialogIsOpen:any;
  pipeLineId:any;
  setPipeLineId:any;
  onSortChange:any;
};
export const DealHeader = (props: params) => {
  const navigate = useNavigate();
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const {
    canAddDeal,
    onSaveChanges,
    selectedItem,
    setSelectedItem,
    stagesList,
    selectedStageId,
    onDealDialogClose,
    setViewType,
    selectedFilterObj,
    setSelectedFilterObj,
    setSelectedUserId,
    selectedUserId,
    dealFilterDialogIsOpen,
    setDealFilterDialogIsOpen,
    pipeLineId,
    setPipeLineId,
    onSortChange,
    ...others
  } = props;
  const [pipeLinesList, setPipeLinesList] = useState(props.pipeLinesList);
  const [showPipeLineDropdown, setShowPipeLineDropdown] = useState(false);
  const [showPipeLineFilters, setShowPipeLineFilters] = useState(false);
  const [selectedViewType, setSelectedViewType]=useState("kanban");
  const [canEdit, setCanEdit] = useState(false);
  const [selectedFilterForEdit, setSelectedFilterForEdit] = useState<any>(null);
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );
  const [users, setUsers]=useState<Array<any>>(utility?.users || []);
  const userRole = parseInt(LocalStorageUtil.getItem(Constants.USER_Role) || '0');
  const isMasterAdmin = userRole === 0;
  const [favourites, setFavourites] = useState<{filters: number[], owners: number[]}>({filters: [], owners: []});
  
  useEffect(() => {
    const savedFavourites = LocalStorageUtil.getItemObject('DEAL_FAVOURITES');
    if (savedFavourites) {
      setFavourites(JSON.parse(savedFavourites as string));
    }

    const interval = setInterval(() => {
      const updated = LocalStorageUtil.getItemObject('DEAL_FAVOURITES');
      if (updated) {
        setFavourites(JSON.parse(updated as string));
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    setPipeLinesList(props.pipeLinesList);
  }, [props.pipeLinesList]);

  useEffect(() => {
    setDialogIsOpen(props.selectedStageId > 0);
  }, [props.selectedStageId]);

  const onDialogClose = () => {
    setDialogIsOpen(false);
    props.onDealDialogClose();
  };

  useEffect(()=>{
    setShowPipeLineFilters(false);
  },[])

  // Sync selectedViewType with parent viewType and URL changes
  useEffect(() => {
    const urlViewType = new URLSearchParams(window.location.search).get("viewType");
    if (urlViewType === "list") {
      setSelectedViewType("list");
    } else {
      setSelectedViewType("kanban");
    }
  }, []);

  // Listen for URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const urlViewType = new URLSearchParams(window.location.search).get("viewType");
      if (urlViewType === "list") {
        setSelectedViewType("list");
      } else {
        setSelectedViewType("kanban");
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const addorUpdateStage = () => {
    return (
      <>
        <Tooltip title="Edit pipeline stages" placement="top">
          <button
            type="button"
            className="btn"
            onClick={(e: any) =>
              navigate("/pipeline/edit?pipelineID=" + selectedItem.pipelineID)
            }
          >
            {" "}
            <FontAwesomeIcon icon={faPencil} />
          </button>
        </Tooltip>
      </>
    );
  };

  const addorUpdateDeal = () => {
    return (
      <>
        <Tooltip title={TOOLTIPS.DEAL.ADD_DEAL} placement="top">
          <span>
            <Button
              type="button"
              variant="contained"
              color="primary"
              size="medium"
              style={{ minWidth: 140, minHeight: 30, fontWeight: 600, padding: '0 24px', borderRadius: 8, boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={(e: any) => setDialogIsOpen(true)}
              disabled={!canAddDeal}
            >
              + New Deal
            </Button>
          </span>
        </Tooltip>
      </>
    );
  };

  const handlePipeLineEdit = (index?: number) => {
    let list = pipeLinesList;
    list.forEach((l, idx) => {
      if (index) l.canEdit = index == idx;
      else l.canEdit = false;
    });
    setPipeLinesList([...list]);
    setShowPipeLineFilters(false); 
  };

  const pipeLinesJSX = () => {
    return (
      <OutsideClickHandler
        onOutsideClick={(event: any) => {
          event?.stopPropagation();
          setShowPipeLineDropdown(false);
        }}
      >
        <div className="pipeselectcontentinner">
          <div className="pipeselectpadlr">
            <ul
              className="pipeselectlist"
              onMouseLeave={(e: any) => handlePipeLineEdit()}
            >
              {pipeLinesList.map((item, index) => (
                <li
                  key={index}
                  onClick={(e: any) => {
                    setSelectedFilterObj(null);
                    setSelectedUserId(null);
                    setPipeLineId(item.pipelineID);
                    setSelectedItem(item);
                  }}
                  onMouseOver={(e: any) => handlePipeLineEdit(index)}
                >
                  <button className="pipeselectlink" type="button">
                    {item.pipelineName}{" "}
                    <span
                      hidden={
                        selectedItem?.pipelineID != item.pipelineID ||
                        item.canEdit
                      }
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  </button>
                  <span className="pipeselect-editlink" hidden={!item.canEdit}>
                    <FontAwesomeIcon icon={faPencil} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/*<div className='pipeselectpadlr pipeselectbtm'>
                        <ul className='pipeselectlist'>
                            <li><button className='pipeselectlink' type='button'><FontAwesomeIcon icon={faGripLines} /> Reorder Pipelines</button></li>
                            <li><button className='pipeselectlink' type='button'><FontAwesomeIcon icon={faEye} /> Pipeline Visibility</button></li>
                            <li><button className='pipeselectlink' type='button'><FontAwesomeIcon icon={faPencil} /> Custumize deal cards <a className='pipeselect-infolink'><FontAwesomeIcon icon={faCircleInfo} /></a></button></li>
                            </ul>*
                            </div>*/}
          {/*<div className='pipeselectpadlr pipeselectbtm'>
                        <ul className='pipeselectlist'>
                            <li onClick={(e:any)=>navigate("/pipeline/edit")}><button className='newpipeline' type='button'><FontAwesomeIcon icon={faAdd} /> New pipeline</button></li>
                        </ul>
                    </div>*/}
        </div>
      </OutsideClickHandler>
    );
  };

  useEffect(()=>{
    setUsers((prevUsers) =>
      prevUsers?.map((user) =>
        user.id === selectedUserId
          ? { ...user, isSelected: true }
          : { ...user, isSelected: false }
      )
    );
  },[selectedUserId])

  const onPersonSelection=(userName:string)=>{
    setSelectedUserId(users?.find(u=>u.name===userName)?.id as any);
    setSelectedFilterObj(null as any);
    setUsers((prevUsers) =>
      prevUsers?.map((user) =>
        user.name === userName
          ? { ...user, isSelected: true }
          : { ...user, isSelected: false }
      )
    );
  }

  return (
    <>
      <div className="pipe-toolbar pt-3 pb-3">
        <div className="container-fluid">
          <div className="row toolbarview-row">
            <div className="col-sm-5 toolbarview-actions">
              <div
                className="toolbarview-filtersrow"
                style={{ display: selectedViewType === "kanban" ? "flex" : "none" }}
              >
                <div className="pipeselectbtngroup">
                  <div
                    className="pipeselectbox variantselectbox"
                    onClick={(e: any) =>
                      setShowPipeLineDropdown(!showPipeLineDropdown)
                    }
                  >
                    <button className="pipeselect" type="button">
                      <FontAwesomeIcon icon={faChartSimple} />{" "}
                      <span>{selectedItem?.pipelineName ?? "Select"} </span>
                      <FontAwesomeIcon icon={faCaretDown} />
                    </button>
                    <div
                      className="pipeselectcontent"
                      hidden={!showPipeLineDropdown}
                    >
                      {pipeLinesJSX()}
                    </div>
                  </div>
                </div>
                <div className="updatestagebtn" style={{ display: dialogIsOpen ? 'none' : 'block' }}>{addorUpdateStage()}</div>

                {!isMasterAdmin && <div className="pipeselectbtngroup">
                  <div
                    className="pipeselectbox variantselectbox"
                    onClick={(e: any) =>
                      setShowPipeLineFilters(!showPipeLineFilters)
                    }
                  >
                    <button className="pipeselect" type="button">
                      <FontAwesomeIcon icon={faChartSimple} />{" "}
                      <span>
                        {selectedFilterObj?.name ??
                          users?.find((u) => u.id === selectedUserId)?.name ??
                          "Select"}{" "}
                      </span>
                    </button>
                    <div
                      className="pipeselectcontent pipeselectfilter"
                      hidden={!showPipeLineFilters}
                    >
                      <ul
                        className="nav nav-tabs pipefilternav-tabs"
                        id="myTab"
                        role="tablist"
                      >
                        <li className="nav-item" role="presentation">
                          <button
                            className="nav-link active"
                            id="favourites-tab"
                            data-bs-toggle="tab"
                            data-bs-target="#favourites"
                            type="button"
                            role="tab"
                            aria-controls="favourites"
                            aria-selected="true"
                          >
                            <span>
                              <StarIcon />
                            </span>
                            Favourites
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className="nav-link"
                            id="filters-tab"
                            data-bs-toggle="tab"
                            data-bs-target="#filters"
                            type="button"
                            role="tab"
                            aria-controls="filters"
                            aria-selected="false"
                          >
                            <span>
                              <FilterListIcon />
                            </span>
                            Filters
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className="nav-link"
                            id="owners-tab"
                            data-bs-toggle="tab"
                            data-bs-target="#owners"
                            type="button"
                            role="tab"
                            aria-controls="owners"
                            aria-selected="false"
                          >
                            <span>
                              <PersonOutlineIcon />
                            </span>
                            Owners
                          </button>
                        </li>
                      </ul>
                      <div
                        className="tab-content pipefiltertab-content"
                        id="myTabContent"
                      >
                        <div
                          className="tab-pane fade show active"
                          id="favourites"
                          role="tabpanel"
                          aria-labelledby="favourites-tab"
                        >
                          <FilterDropdown
                            showPipeLineFilters={showPipeLineFilters}
                            setShowPipeLineFilters={setShowPipeLineFilters}
                            selectedFilterObj={selectedFilterObj}
                            setSelectedFilterObj={setSelectedFilterObj}
                            setDialogIsOpen={setDealFilterDialogIsOpen}
                            dialogIsOpen={dealFilterDialogIsOpen}
                            showFavouritesOnly={true}
                            users={users}
                            onPersonSelection={onPersonSelection}
                            setSelectedUserId={setSelectedUserId}
                            setSelectedFilter={setSelectedFilterForEdit}
                          />
                        </div>
                        <div
                          className="tab-pane fade"
                          id="filters"
                          role="tabpanel"
                          aria-labelledby="filters-tab"
                        >
                          <FilterDropdown
                            showPipeLineFilters={showPipeLineFilters}
                            setShowPipeLineFilters={setShowPipeLineFilters}
                            selectedFilterObj={selectedFilterObj}
                            setSelectedFilterObj={setSelectedFilterObj}
                            setDialogIsOpen={setDealFilterDialogIsOpen}
                            dialogIsOpen={dealFilterDialogIsOpen}
                            setSelectedFilter={setSelectedFilterForEdit}
                          />
                        </div>
                        <div
                          className="tab-pane fade"
                          id="owners"
                          role="tabpanel"
                          aria-labelledby="owners-tab"
                        >
                          <div className="pipeselectpadlr filterownersbox">
                            {users
                              ?.filter((u) => u.isActive)
                              ?.map((item, index) => (
                                <>
                                  <ul className="pipeselectlist filterownerslist">
                                    <li>
                                      <div
                                        className="filterownerli-row"
                                        key={index}
                                        onClick={(e: any) =>
                                          onPersonSelection(item.name)
                                        }
                                      >
                                        <AccountCircleIcon className="userCircleIcon" />
                                        <span>{item.name}</span>
                                        <div className="filterownerli-icon">
                                          <Tooltip title={favourites.owners.includes(item.id) ? "Remove from favourites" : "Add to favourites"} placement="top">
                                            <span
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setFavourites(prev => {
                                                  const newOwners = prev.owners.includes(item.id)
                                                    ? prev.owners.filter(id => id !== item.id)
                                                    : [...prev.owners, item.id];
                                                  const updated = { ...prev, owners: newOwners };
                                                  LocalStorageUtil.setItemObject('DEAL_FAVOURITES', JSON.stringify(updated));
                                                  return updated;
                                                });
                                              }}
                                              style={{ cursor: 'pointer', marginRight: '8px' }}
                                            >
                                              {favourites.owners.includes(item.id) ? <StarIcon style={{ color: '#f4a261', fontSize: '16px' }} /> : <StarBorderIcon style={{ fontSize: '16px' }} />}
                                            </span>
                                          </Tooltip>
                                          <a
                                            className="filterowner-tick"
                                            hidden={!item.isSelected}
                                          >
                                            <DoneIcon />
                                          </a>
                                        </div>
                                      </div>
                                    </li>
                                  </ul>
                                </>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}
                {!isMasterAdmin && <div className="pipefilterbtn" style={{ display: (dialogIsOpen || dealFilterDialogIsOpen) ? 'none' : 'block' }}>
                  <div className="filterbtn">
                    <Tooltip title="Clear all active filters" placement="top">
                      <button
                        className={`btn ${!(selectedFilterObj || selectedUserId) ? 'disabled' : ''}`}
                        type="button"
                        style={{
                          opacity: !(selectedFilterObj || selectedUserId) ? 0.5 : 1,
                          cursor: !(selectedFilterObj || selectedUserId) ? 'not-allowed' : 'pointer',
                          pointerEvents: !(selectedFilterObj || selectedUserId) ? 'none' : 'auto'
                        }}
                        onClick={(e: any) => {
                          if (selectedFilterObj || selectedUserId) {
                            setSelectedUserId(null);
                            setSelectedFilterObj(null);
                            if (props.pipeLinesList && props.pipeLinesList.length > 0) {
                              props.setPipeLineId(props.pipeLinesList[0].pipelineID);
                              props.setSelectedItem(props.pipeLinesList[0]);
                            } else {
                              props.setPipeLineId && props.setPipeLineId(null);
                              props.setSelectedItem && props.setSelectedItem(null);
                            }
                          }
                        }}
                      >
                        <FilterAltOffIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>}

                <div className="pipefilterbtn" style={{ display: (dialogIsOpen || dealFilterDialogIsOpen) ? 'none' : 'block', marginLeft: '8px' }}>
                  <Dropdown>
                    <Tooltip title="Sort deals" placement="top">
                      <Dropdown.Toggle className="btn" style={{ padding: '1px 6px', backgroundColor: '#1f2937', color: '#fff', border: 'none' }}>
                        <FontAwesomeIcon icon={faBars} style={{ fontSize: '16px' }} />
                      </Dropdown.Toggle>
                    </Tooltip>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => onSortChange('name-asc')}>Name (A-Z)</Dropdown.Item>
                      <Dropdown.Item onClick={() => onSortChange('name-desc')}>Name (Z-A)</Dropdown.Item>
                      <Dropdown.Item onClick={() => onSortChange('value-asc')}>Value (Low to High)</Dropdown.Item>
                      <Dropdown.Item onClick={() => onSortChange('value-desc')}>Value (High to Low)</Dropdown.Item>
                      <Dropdown.Item onClick={() => onSortChange('date-asc')}>Date (Oldest First)</Dropdown.Item>
                      <Dropdown.Item onClick={() => onSortChange('date-desc')}>Date (Newest First)</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* <div className="pipeselectbox selecteveryonebox">
                                    <button className="pipeselect" type="button"><FontAwesomeIcon icon={faAlignCenter} /> Everyone <FontAwesomeIcon icon={faCaretDown} /></button>
                                </div> */}
              </div>
            </div>
            <div className="col-sm-7 toolbarview-summery">
              {/* <div className="toolsummary pr-4"><div className="toolsummary-deals">£0 <span>·</span>{stagesList?.reduce((count, current) => count + current.deals.length, 0)} deals</div></div> */}
              <div className="toolbarview-actionsrow">
                <div className="d-flex toolbutton-group">
                  <Dropdown className="toolgrip-dropdownbox">
                    <Tooltip title="Switch between List and Kanban view" placement="top">
                      <Dropdown.Toggle
                        className="toolpipebtn activetoolbtn"
                        variant="success"
                        id="dropdown-toolgrip"
                      >
                        <FontAwesomeIcon icon={faGrip} />
                      </Dropdown.Toggle>
                    </Tooltip>
                    <Dropdown.Menu className="toolgrip-dropdown">
                      <Dropdown.Item
                        onClick={(e: any) => {
                          setSelectedViewType("list");
                          props.setViewType("list");
                          // Update URL to include viewType parameter
                          const currentParams = new URLSearchParams(window.location.search);
                          currentParams.set('viewType', 'list');
                          navigate(`/pipeline?${currentParams.toString()}`);
                        }}
                      >
                        List View
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={(e: any) => {
                          setSelectedViewType("kanban");
                          props.setViewType("kanban");
                          // Update URL to include viewType parameter for consistency
                          const currentParams = new URLSearchParams(window.location.search);
                          currentParams.set('viewType', 'kanban');
                          navigate(`/pipeline?${currentParams.toString()}`);
                        }}
                      >
                        Kanban View
                      </Dropdown.Item>
                      {/* <Dropdown.Item href="#/action-3">Add New List View</Dropdown.Item> */}
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* <button className="toolpipebtn activetoolbtn" type="button"><FontAwesomeIcon icon={faChartSimple} /></button>
                                    <button className="tooldealbtn" type="button"><FontAwesomeIcon icon={faBars} /></button>
                                    <button className="tooltimebtn" type="button"><FontAwesomeIcon icon={faDollarSign} /></button> */}
                </div>
                {addorUpdateDeal()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {dialogIsOpen && (
        <DealAddEditDialog
          dialogIsOpen={dialogIsOpen}
          setDialogIsOpen={(e: any) => onDialogClose()}
          onSaveChanges={(e: any) => props.onSaveChanges()}
          selectedStageId={selectedStageId}
          selectedPipeLineId={selectedItem?.pipelineID}
          pipeLinesList={pipeLinesList}
        />
      )}

      {dealFilterDialogIsOpen && (
        <DealFilterAddEditDialog
          dialogIsOpen={dealFilterDialogIsOpen}
          setDialogIsOpen={setDealFilterDialogIsOpen}
          onPreview={(e:any)=>setShowPipeLineFilters(false)}
          onSaveChanges={(e: any) => {
            setDealFilterDialogIsOpen(false);
            props.onSaveChanges();
          }}
          selectedFilter={selectedFilterForEdit as any}
          setSelectedFilter={setSelectedFilterObj}
        />
      )}
    </>
  );
};

export default DealHeader;
