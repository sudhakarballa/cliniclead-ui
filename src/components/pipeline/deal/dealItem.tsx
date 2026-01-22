import { useNavigate } from "react-router-dom";
import { Deal } from "../../../models/deal";
import Dropdown from 'react-bootstrap/Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import MoveDeal from "./moveDeal";
import { PipeLine } from "../../../models/pipeline";
import { Utility } from "../../../models/utility";
import Util, { IsMockService } from "../../../others/util";
import LocalStorageUtil from "../../../others/LocalStorageUtil";
import Constants from "../../../others/constants";
import { Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../constants/tooltips";

type params = {
  deal?: Deal;
  isDragging?: any;
  isGroupedOver?: any;
  provided?: any;
  style?: any;
  isClone?: any;
  index?: any;
  onDeleteClick?: any;
  pipeLinesList:Array<PipeLine>;
  onDealModify:any;
}

export const DealItem = (props: params) => {

  const { deal, isDragging, isGroupedOver, provided, style, isClone, index, onDeleteClick, pipeLinesList, onDealModify } = props;
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigator = useNavigate();
  const [userProfile, setUserProfile] = useState(Util.UserProfile());
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );

  const handleCardClick = () => {
    let filterId = LocalStorageUtil.getItem(Constants.FILTER_ID) as any;
    let url = `/deal?id=${deal?.dealID}&pipeLineId=${deal?.pipelineID}`;
    if (filterId !== undefined && filterId !== null && filterId !== "undefined") {
      url += `&filterId=${filterId}`;
    }
    navigator(url);
  };

  const handleDropdownToggle = (e: any) => {
    e.stopPropagation();
    if (!showDropdown) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 120 // Adjust left position
      });
    }
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        data-is-dragging={isDragging}
        data-testid={deal?.dealID}
        data-index={index}
        key={index}
        style={provided.draggableProps.style}
      >
        <div className="pdstage-item">
          <div className='pdstage-box' style={{ overflow: 'visible', cursor: 'pointer' }} onClick={handleCardClick}>
            <div className="pdstage-title">{deal?.treatmentName}</div>
            <div className='dropdownbox-toolgripdot'>
              <Tooltip title="More actions" placement="top">
                <button 
                  className='toolgrip-dot' 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer'
                  }}
                  onClick={(e) => { e.stopPropagation(); handleDropdownToggle(e); }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>
              </Tooltip>
            </div>
            <div className="pdstage-description">
              <div className="pdstage-descitem">{utility?.users.find(u => u.id == deal?.assigntoId)?.name || deal?.personName}</div>
            </div>
            <div className="pdstage-status-row">
              <div className="pdstage-avatar">
                <i className="rs-icon rs-icon-user-circle"></i>
              </div>
              <div className="pdstage-value">
                <span>£{deal?.value ?? 0}</span>
              </div>
            </div>
            <div className='pdstage-box1 pdstage-simplebadge'>
              {deal?.statusID === 2 && (
                <div className="deal-status-badge won">WON</div>
              )}
              {deal?.statusID === 3 && (
                <div className="deal-status-badge lost">LOST</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Portal-based dropdown menu */}
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 2000,
            backgroundColor: '#ffffff',
            border: '1px solid #e4cb9a',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            minWidth: '150px',
            padding: '8px 0'
          }}
        >
          <Tooltip title={TOOLTIPS.DEAL.DELETE_DEAL} placement="left">
            <div
              onClick={() => {
                onDeleteClick();
                setShowDropdown(false);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                color: '#3f3f3f'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f3f3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Delete
            </div>
          </Tooltip>
          <Tooltip title={TOOLTIPS.DEAL.MARK_WON} placement="left">
            <div
              style={{
                padding: '12px 16px',
                cursor: 'not-allowed',
                borderBottom: '1px solid #f0f0f0',
                color: '#999',
                opacity: 0.5
              }}
            >
              Won
            </div>
          </Tooltip>
          <Tooltip title={TOOLTIPS.DEAL.MARK_LOST} placement="left">
            <div
              style={{
                padding: '12px 16px',
                cursor: 'not-allowed',
                borderBottom: '1px solid #f0f0f0',
                color: '#999',
                opacity: 0.5
              }}
            >
              Lost
            </div>
          </Tooltip>
          <Tooltip title="Move deal to another stage or pipeline" placement="left">
            <div
              onClick={() => {
                setDialogIsOpen(true);
                setShowDropdown(false);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                color: '#3f3f3f'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f3f3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Move To
            </div>
          </Tooltip>
        </div>,
        document.body
      )}
      {
        dialogIsOpen && <MoveDeal dialogIsOpen={dialogIsOpen}
                                  pipeLinesList={pipeLinesList}
                                  selectedPipeLineId={deal?.pipelineID as any}
                                  setDialogIsOpen={setDialogIsOpen}
                                  dealId={deal?.dealID as any}
                                  onDealModify={(e:any)=>props.onDealModify()}
                                  deal={deal as any}
                                  selectedStageId={deal?.stageID as any} />
      }
    </>
  );
}