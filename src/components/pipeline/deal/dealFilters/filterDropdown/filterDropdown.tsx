import React, { useEffect, useState } from "react";
import "./filterDropdown.css"; // Import the CSS file
import OutsideClickHandler from "react-outside-click-handler";
import DealFilterAddEditDialog from "../dealFilterAddEditDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faDeleteLeft,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { DealFilter } from "../../../../../models/dealFilters";
import { Spinner } from "react-bootstrap";
import { DealFiltersService } from "../../../../../services/dealFiltersService";
import { ErrorBoundary } from "react-error-boundary";
import { DeleteDialog } from "../../../../../common/deleteDialog";
import { toast } from "react-toastify";
import LocalStorageUtil from "../../../../../others/LocalStorageUtil";
import Constants from "../../../../../others/constants";
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import DoneIcon from "@mui/icons-material/Done";
import { Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../../../constants/tooltips";

type params = {
  showPipeLineFilters?: any;
  setShowPipeLineFilters?: any;
  selectedFilterObj: any;
  setSelectedFilterObj: any;
  dialogIsOpen:any;
  setDialogIsOpen:any;
  showFavouritesOnly?: boolean;
  users?: any[];
  onPersonSelection?: (userName: string) => void;
  setSelectedUserId?: any;
  setSelectedFilter?: any;
};

// Static flag to prevent multiple simultaneous API calls
let isLoadingFilters = false;

const FilterDropdown = (props: params) => {
  const {
    showPipeLineFilters,
    setShowPipeLineFilters,
    selectedFilterObj,
    setSelectedFilterObj,
    dialogIsOpen,
    setDialogIsOpen,
    showFavouritesOnly = false,
    users = [],
    onPersonSelection,
    setSelectedUserId,
    setSelectedFilter: setSelectedFilterFromParent,
    ...others
  } = props;
  const [selectedFilter, setSelectedFilter] = useState<DealFilter>(
    props.selectedFilterObj ?? new DealFilter()
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dealFiltersSvc = new DealFiltersService(ErrorBoundary);
  const [filters, setFilters] = useState<Array<DealFilter>>([]);
  const [favourites, setFavourites] = useState<{filters: number[], owners: number[]}>({filters: [], owners: []});

  // // Filters Array
  // const filters = [
  //   { name: "All deleted deals", locked: false, section: 1 },
  //   { name: "All lost deals", locked: false, section: 1 },
  //   { name: "All open deals", locked: false, section: 2, favorite: true },
  //   { name: "All won deals", locked: false, section: 2 },
  //   { name: "Deal Stage is Qualified", locked: true, section: 3 },
  //   { name: "More than 3 months old deals", locked: false, section: 3 },
  //   { name: "Rotten deals", locked: false, section: 3 },
  // ];

  // Handle Click
  const handleFilterClick = (filter: any) => {
    if (!filter.locked) {
      setSelectedFilter(filter.name);
    }
  };

  useEffect(() => {
    if (!dialogIsOpen) {
      setSelectedFilter(new DealFilter());
    }
  }, [dialogIsOpen]);

  useEffect(() => {
    if (selectedFilterObj?.id > 0) {
      onFilterSelection(selectedFilterObj);
    }
  }, [selectedFilterObj]);

  useEffect(() => {
    // Load favourites from localStorage
    const savedFavourites = LocalStorageUtil.getItemObject('DEAL_FAVOURITES');
    if (savedFavourites) {
      setFavourites(JSON.parse(savedFavourites as string));
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const updated = LocalStorageUtil.getItemObject('DEAL_FAVOURITES');
      if (updated) {
        setFavourites(JSON.parse(updated as string));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Only load if filters are not already loaded and not currently loading
    if (filters.length === 0 && !isLoading) {
      loadDealFilters();
    }
  }, []);

  const toggleFavourite = (type: 'filter' | 'owner', id: number) => {
    if (type === 'filter') {
      const filter = filters.find(f => f.id === id);
      if (filter) {
        const updatedFilter = { 
          ...filter, 
          isFavourite: !filter.isFavourite,
          allConditions: filter.conditions.find((i) => i.glue === "AND")?.conditionList || [],
          anyConditions: filter.conditions.find((i) => i.glue === "OR")?.conditionList || []
        };
        dealFiltersSvc.saveDealFilters(updatedFilter).then(() => {
          setFilters(prev => prev.map(f => f.id === id ? updatedFilter : f));
          loadDealFilters(true);
        }).catch(err => {
          console.error('Error updating filter favourite:', err);
        });
      }
    }
    
    setFavourites(prev => {
      const key = type === 'filter' ? 'filters' : 'owners';
      const newFavs = prev[key].includes(id)
        ? prev[key].filter(fId => fId !== id)
        : [...prev[key], id];
      const updated = { ...prev, [key]: newFavs };
      LocalStorageUtil.setItemObject('DEAL_FAVOURITES', JSON.stringify(updated));
      console.log('Updated favourites:', updated);
      return updated;
    });
  };

  const loadDealFilters = (forceRefresh = false) => {
    // Check if already loading globally
    if (isLoadingFilters) return;

    // Check if filters are already in localStorage and not forcing refresh
    if (!forceRefresh) {
      const cachedFilters = LocalStorageUtil.getItemObject(Constants.Deal_FILTERS);
      if (cachedFilters && Array.isArray(JSON.parse(cachedFilters as string)) && JSON.parse(cachedFilters as string).length > 0) {
        setFilters(JSON.parse(cachedFilters as string));
        if (selectedFilterObj) onFilterSelection(selectedFilterObj);
        return;
      }
    }

    isLoadingFilters = true;
    setIsLoading(true);
    dealFiltersSvc
      .getDealFilters()
      .then((res) => {
        if (res) {
          setFilters(res);
          if (selectedFilterObj) onFilterSelection(selectedFilterObj);
          LocalStorageUtil.setItemObject(
            Constants.Deal_FILTERS,
            JSON.stringify(res)
          );
        }
      })
      .catch((err) => {
        console.error('Error loading deal filters:', err);
      })
      .finally(() => {
        isLoadingFilters = false;
        setIsLoading(false);
      });
  };

  const hideDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  const onDeleteConfirm = () => {
    setShowDeleteDialog(false);
    setIsLoading(true);
    dealFiltersSvc
      .delete(selectedFilter.id)
      .then((res) => {
        setSelectedFilter(new DealFilter());
        if (res) {
          toast.success("Deal filter deleted successfully");
          loadDealFilters(true);
        }
      })
      .catch((err) => {
        toast.error("Unable to delete deal filter");
      });
  };

  const filteredFilters = showFavouritesOnly
    ? filters.filter(f => favourites.filters.includes(f.id))
    : filters;

  const filteredOwners = showFavouritesOnly
    ? users.filter(u => favourites.owners.includes(u.id))
    : users;

  console.log('FilterDropdown render:', { showFavouritesOnly, showPipeLineFilters, filteredFiltersCount: filteredFilters.length, filteredOwnersCount: filteredOwners.length });

  const onFilterSelection = (item: DealFilter) => {
    setFilters((prevFilters) =>
      prevFilters.map((filter) =>
        filter.id === item.id
          ? { ...filter, isSelected: true }
          : { ...filter, isSelected: false }
      )
    );

    setShowPipeLineFilters(false);
  };

  return isLoading ? (
    <div className="alignCenter">
      <Spinner />
    </div>
  ) : (
    <>
      {/* Wrap only the dropdown content */}
      <OutsideClickHandler
        onOutsideClick={(event: any) => {
          event?.stopPropagation();
          setShowPipeLineFilters(false);
        }}
      >
        {showPipeLineFilters && ( // optional double-check
          <div className="pipeselectcontentinner">
            {filteredFilters.length === 0 && filteredOwners.length === 0 && (
              <div className="pipeselectpadlr">
                <ul className="pipeselectlist">
                  <li style={{padding: '10px', color: '#999'}}>No favourites yet. Mark filters or owners as favourite.</li>
                </ul>
              </div>
            )}
            {showFavouritesOnly && filteredFilters.length > 0 && (
              <div className="pipeselectpadlr">
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>FILTERS</div>
                <ul className="pipeselectlist">
                {filteredFilters?.map((item, index) => (
                  <li key={index}>
                    <a hidden={item.isSelected}>
                      &nbsp;&nbsp;
                    </a>
                    <a className="filterowner-tick" hidden={!item.isSelected}>
                      <DoneIcon />
                    </a>
                    <button
                      className="pipeselectlink"
                      onMouseDown={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (setSelectedUserId) setSelectedUserId(null);
                        setSelectedFilterObj({...item});
                        setShowPipeLineFilters(false);
                      }}
                      type="button"
                    >
                      {item.name}
                    </button>
                    <div className="pipeselect-btns">
                      <Tooltip title={favourites.filters.includes(item.id) ? "Remove from favourites" : "Add to favourites"} placement="bottom">
                        <span
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavourite('filter', item.id);
                          }}
                          style={{ cursor: 'pointer', marginRight: '8px' }}
                        >
                          {favourites.filters.includes(item.id) ? <StarIcon style={{ color: '#f4a261', fontSize: '16px' }} /> : <StarBorderIcon style={{ fontSize: '16px' }} />}
                        </span>
                      </Tooltip>
                    </div>
                  </li>
                ))}
                </ul>
              </div>
            )}
            {!showFavouritesOnly && (
              <div className="pipeselectpadlr">
                <ul className="pipeselectlist">
                {filteredFilters?.map((item, index) => (
                  <li key={index}>
                    <a hidden={item.isSelected}>
                      &nbsp;&nbsp;
                    </a>
                    <a className="filterowner-tick" hidden={!item.isSelected}>
                      <DoneIcon />
                    </a>
                    <button
                      className="pipeselectlink"
                      onMouseDown={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (setSelectedUserId) setSelectedUserId(null);
                        setSelectedFilterObj({...item});
                        setShowPipeLineFilters(false);
                      }}
                      type="button"
                    >
                      {item.name}
                    </button>
                    <div className="pipeselect-btns">
                      <Tooltip title={favourites.filters.includes(item.id) ? "Remove from favourites" : "Add to favourites"} placement="bottom">
                        <span
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavourite('filter', item.id);
                          }}
                          style={{ paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}
                        >
                          {favourites.filters.includes(item.id) ? <StarIcon style={{ color: '#f4a261', fontSize: '16px' }} /> : <StarBorderIcon style={{ fontSize: '16px' }} />}
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit this filter" placement="top">
                        <span
                          className="pl-4"
                          onMouseDown={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFilter(item);
                            if (setSelectedFilterFromParent) setSelectedFilterFromParent(item);
                            setShowPipeLineFilters(false);
                            setTimeout(() => setDialogIsOpen(true), 0);
                          }}
                          style={{ paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}
                        >
                          <FontAwesomeIcon className="pl-4" icon={faEdit} />
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete this filter" placement="top">
                        <span
                          className="pl-4"
                          onMouseDown={(e: any) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFilter(item);
                            setShowPipeLineFilters(false);
                            setTimeout(() => setShowDeleteDialog(true), 0);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <FontAwesomeIcon icon={faDeleteLeft} />
                        </span>
                      </Tooltip>
                    </div>
                  </li>
                ))}
                </ul>
              </div>
            )}
            {showFavouritesOnly && filteredOwners.length > 0 && (
              <div className="pipeselectpadlr filterownersbox" style={{ marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>OWNERS</div>
                {filteredOwners
                  ?.filter((u) => u.isActive)
                  ?.map((item, index) => (
                    <ul className="pipeselectlist filterownerslist" key={index}>
                      <li>
                        <div
                          className="filterownerli-row"
                          style={{ cursor: 'pointer' }}
                          onMouseDown={(e: any) => {
                            if (!(e.target as HTMLElement).closest('.filterownerli-icon')) {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onPersonSelection) {
                                onPersonSelection(item.name);
                              }
                              setShowPipeLineFilters(false);
                            }
                          }}
                        >
                          <AccountCircleIcon className="userCircleIcon" />
                          <span>{item.name}</span>
                          <div className="filterownerli-icon">
                            <Tooltip title={favourites.owners.includes(item.id) ? "Remove from favourites" : "Add to favourites"} placement="top">
                              <span
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavourite('owner', item.id);
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
                  ))}
              </div>
            )}
            <div className="add-new-filter">
              <Tooltip title="Create a new custom filter" placement="top">
                <button
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPipeLineFilters(false);
                    setTimeout(() => setDialogIsOpen(true), 0);
                  }}
                >
                  Add new filter
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </OutsideClickHandler>

      {/* Modals should live outside to avoid re-opening */}
      {showDeleteDialog && (
        <DeleteDialog
          itemType={"Deal Filter"}
          itemName={"Deal Filter"}
          dialogIsOpen={showDeleteDialog}
          closeDialog={() => setShowDeleteDialog(false)}
          onConfirm={onDeleteConfirm}
          isPromptOnly={false}
          actionType={"Delete"}
        />
      )}
    </>
  );
};

export default FilterDropdown;
