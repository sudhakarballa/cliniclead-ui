import { colors } from "@atlaskit/theme";
import { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { FaPlus, FaPlay } from "react-icons/fa";
import { DealList } from "./dealList";
import { PipeLine } from "../../../models/pipeline";
import { Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../constants/tooltips";


type params = {
    title?: any;
    deals?: any;
    stageID?: any;
    isScrollable?: boolean;
    isCombineEnabled?: boolean;
    useClone?: boolean;
    onSaveChanges?: any;
    providedFromParent?:any;
    isDragging:any;
    pipeLinesList:Array<PipeLine>;
    onStageExpand:any;
    onDealAddClick:any;
    onDealModify:any;
}

export const DealStage = (props: params) => {
    const { onDealAddClick, onStageExpand, title, deals, stageID, isScrollable, isCombineEnabled, useClone, providedFromParent, isDragging, pipeLinesList, ...others } = props;

    const [showAddButton, setShowAddButton] = useState(false);
    
    return (
        <div className="pdstage-col" 
        onMouseEnter={e => { setShowAddButton(true); }} 
        onMouseLeave={e => { setShowAddButton(false) }}
        {...providedFromParent.droppableProps}>
            <div className="pdstage-innercol">
                <Draggable draggableId={"" + title} index={stageID} isDragDisabled={true}>
                    {(provided, snapshot) => (
                        <div {...provided.dragHandleProps} ref={provided.innerRef}>
                            <div className="pdstage-header">
                                <div className="pdstage-head">
                                    <div className="pdstagehead-title" title={title}>{title}</div>
                                    <div className="pdstagehead-btns">
                                        <Tooltip title={TOOLTIPS.DEAL.ADD_DEAL} placement="top">
                                            <button className='' onClick={(e:any)=>onDealAddClick(stageID)}><FaPlus /></button>
                                        </Tooltip>
                                        <Tooltip title="Expand stage to view all deals" placement="top">
                                            <span>
                                                <button className={deals?.length==0 ? 'disabled' : ''} disabled={deals?.length==0} onClick={(e:any)=>onStageExpand(stageID)}><FaPlay /></button>
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="pdstage-summary">
                                    <div className="pdstage-value">
                                        <span className='pdstage-price'>£0</span><span className='pdstage-num'>{deals.length} deals</span>
                                    </div>
                                </div>
                            </div>
                            <DealList
                                index={stageID}
                                stageID={stageID}
                                listType="Deal"
                                style={{
                                    backgroundColor: snapshot.isDragging ? colors.G50 : null
                                }}
                                deals={deals}
                                internalScroll={isScrollable}
                                isCombineEnabled={isCombineEnabled}
                                useClone={useClone}
                                isDragging={isDragging}
                                pipeLinesList={pipeLinesList}
                                onDealModify={(e:any)=>props.onDealModify()}
                                onSaveChanges={(e: any) => props.onSaveChanges()}
                            />
                        </div>
                    )}
                </Draggable>
                {/* <div id="addNewQuote" style={{ display: showAddButton ? 'block' : 'none' }}>
                    <div className="pdstage-add"><button className='pdstage-addplus'><i className="rs-icon rs-icon-plus"></i></button></div>
                </div> */}
            </div>
        </div>

    );
};
