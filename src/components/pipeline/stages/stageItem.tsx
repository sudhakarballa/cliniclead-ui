import { faBell, faInfoCircle, faPlus, faScaleBalanced, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";
import { Stage } from "../../../models/stage";
import Util from "../../../others/util";

export const getBackgroundColor = (isDraggingOver: any, isDraggingFrom: any) => {
    if (isDraggingOver) {
        return '#FFEBE6';
    }
    if (isDraggingFrom) {
        return '#E6FCFF';
    }
    return '#EBECF0';
};

type params = {
    selectedItem?: Stage;
    setSelectedItem?:any;
    provided?: any;
    onAddClick:any;
    onDeleteClick:any;
}
export const StageItem = (props: params) => {
    
    const { selectedItem, setSelectedItem, provided, ...others } = props;
    const [isNameNull, setIsNameNull]=useState<boolean>(false);
    const [isProbabilityNull, setIsProbabilityNull]=useState<boolean>(false);
    const [isRottinngInNull, setIsRottinngInNull]=useState<boolean>(false);

    useEffect(() => {
        setIsNameNull(Util.isNullOrUndefinedOrEmpty(selectedItem?.stageName));
        setIsProbabilityNull(Util.isNullOrUndefinedOrEmpty(selectedItem?.probability));
    }, [selectedItem])

    const updateItem = (e: any, key:string) => {
        let obj = key=="stageName" ? { ...selectedItem, "stageName": e.target?.value } : 
        { ...selectedItem, "probability": e.target?.value }
        setSelectedItem(obj);
    }

    return (
        <>
            <div ref={provided?.innerRef} {...provided?.dragHandleProps}>
                <div className="editstagebox">
                    <div className="editstage-head">
                        <div className="editstage-headin">
                            <div className="editstage-headlead">
                                <div className="editstage-leadtitle">{selectedItem?.stageName}</div>
                                <div className="editstage-leadicons">
                                    <div className="editstage-leadicon"><FontAwesomeIcon icon={faScaleBalanced} /> {selectedItem?.probability}%</div>
                                    <div className="editstage-bellicon"><FontAwesomeIcon icon={faBell} /> 0 days</div>
                                </div>
                            </div>
                            <div className="editstage-dragicon"><i className="rs-icon rs-icon-pause"></i></div>
                        </div>
                        <button className="editstage-plusicon plusiconleft" onClick={(e:any)=>props.onAddClick("left")}><i className="rs-icon rs-icon-plus"></i></button>
                        <button className="editstage-plusicon plusiconright" onClick={(e:any)=>props.onAddClick("right")}><i className="rs-icon rs-icon-plus"></i></button>
                    </div>
                    <div className="editstage-data">
                        <div className="editstage-innerdata">
                            <div className="editstage-field">
                                <div className="editstage-fieldname">Name</div>
                                <div className="editstage-fieldinput">
                                    <div className="editstage-inputbox">
                                        <input className="form-control" type="text" placeholder='Name' value={selectedItem?.stageName} onChange={(e:any)=>updateItem(e, "stageName")}/>
                                    </div>
                                    <div>
                                    <p className="text-danger" id={`validationMsgfor_"name"`} hidden={!isNameNull}>Name is required</p>
                                    </div>
                                </div>
                            </div>
                            <div className="editstage-field">
                                <div className="editstage-fieldname">Probability {/* <div className="editstage-infoicon"><FontAwesomeIcon icon={faInfoCircle} /></div> */}
                                </div>
                                <div className="editstage-fieldinput">
                                    <div className="editstage-inputbox">
                                        <input className="form-control" min="0" type="number" placeholder='Probability' value={selectedItem?.probability} onChange={(e:any)=>updateItem(e, "probability")}/>
                                    </div>
                                    <div>
                                    <p className="text-danger" id={`validationMsgfor_"name"`} hidden={!isProbabilityNull}>Probability is required</p>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="editstage-field">
                                <div className="editstage-fieldcheck">
                                    <div className="editstage-fieldname editstage-checkbox">
                                        <label className="checktogglebox"><input type="checkbox" /><div className="checktoggle"></div></label>
                                        <div className="fieldchecklabel">Rotting in (days)</div>
                                        <div className="fieldcheck-infoicon"><FontAwesomeIcon icon={faInfoCircle} /></div>
                                    </div>
                                    <div className="editstage-inputbox">
                                        <input className="form-control" min="0" type="number" defaultValue="0" />
                                    </div>
                                </div>
                            </div> */}
                        </div>
                        <div className="editstage-delete">
                            <div className="editstage-deleteinn">
                                <button className="editstage-deletebtn" onClick={(e:any)=>props.onDeleteClick()}><FontAwesomeIcon icon={faTrash} /> <span>Delete Stage</span></button>
                            </div>
                            <button className="addnewstag-btn" onClick={(e:any)=>props.onAddClick()}><FontAwesomeIcon icon={faPlus} /> <span>New stage</span></button>
                        </div>
                    </div>

                </div>
            </div>

        </>
    )
}