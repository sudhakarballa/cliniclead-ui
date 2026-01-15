import { PipeLine } from "../../../models/pipeline"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faCircleUser, faPencil, faSortDown, faEllipsis, faAngleDown, faGear, faPlus, faMoneyBill, faTag, faScaleBalanced, faFlagCheckered, faUser, faBuilding, faBarsStaggered, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from "@mui/material";
import { TOOLTIPS } from "../../../constants/tooltips";


type params = {
    selectedItem:PipeLine;
    setSelectedItem:any,
    onAddClick: any,
    onSaveClick:any,
    onCancelClick:any,
    canSave:boolean
}
export const StageActions = (props: params) => {
    const {selectedItem, setSelectedItem, canSave, ...others}=props;

    const handlePipelineNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('Before setSelectedItem:', selectedItem);
        setSelectedItem({
            ...selectedItem,
            pipelineName: e.target.value
        });
        setTimeout(() => {
            // This will log the value after the parent re-renders
            console.log('After setSelectedItem:', selectedItem);
        }, 0);
    };

    return (
        <>
            {/* <div>
            <h3>Add new stage</h3>
            <br/>
            <p>Pipeline stages represent the steps in your sales process</p>
            <br/>
            </div> */}
            <div className="action-toolbar pt-3 pb-3">
                <div className="container-fluid">
                    <div className="stageaction-editrow">
                        <div className="colactionbtnstage">
                            <div className="actiondealname">
                                <label htmlFor="name">Pipeline Name:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={selectedItem && typeof selectedItem.pipelineName === 'string' ? selectedItem.pipelineName : ''}
                                    onChange={e => {
                                        // Always use a fallback object to avoid undefined
                                        setSelectedItem({
                                            ...(selectedItem || {}),
                                            pipelineName: e.target.value
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="colactionbtn">
                            <div className="dealprobainfo">
                                <div className="editstage-checkbox">
                                  {/* <label className="checktogglebox"><input id="dealprobability" type="checkbox" /><span className="checktoggle"></span></label>
                                    <div className="fieldchecklabel">Deal probability</div>*/}
                                </div>
                                {/* <button className="probinfobtn"><FontAwesomeIcon icon={faCircleInfo} /></button> */}
                            </div>
                            <div className="colactionbtnrow">
                                <Tooltip title={TOOLTIPS.ACTIONS.CANCEL} placement="top">
                                    <button type="button" className="btn btn-dark" onClick={(e: any) => props.onCancelClick()}>Cancel</button>
                                </Tooltip>
                                <Tooltip title={TOOLTIPS.ACTIONS.SAVE} placement="top">
                                    <span>
                                        <button type="button" className="btn btn-primary" disabled={!canSave}  onClick={(e: any) => {if(!canSave) return; props.onSaveClick()}}>Save Changes</button>
                                    </span>
                                </Tooltip>
                                {/* <button className="ellipsis-btn"><FontAwesomeIcon icon={faEllipsis} /></button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </>
    )
}