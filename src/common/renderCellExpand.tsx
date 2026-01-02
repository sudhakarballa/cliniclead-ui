

import * as React from "react";
import { Paper, Popper, Typography } from "@mui/material";
import { makeStyles, createStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";
import { GridCellParams, GridRowModel } from "@mui/x-data-grid"
import { Link } from "react-router-dom";

// import { CellParams, isOverflown } from "@material-ui/data-grid";

interface GridCellExpandProps {
  value: string;
  width: number;
  row: GridRowModel;
  field:string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      alignItems: "center",
      lineHeight: "24px",
      width: "100%",
      height: "100%",
      position: "relative",
      display: "flex",
      "& .cellValue": {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }
  })
);

function isOverflown(element: Element): boolean {
  return (
    element?.scrollHeight > element?.clientHeight ||
    element?.scrollWidth > element?.clientWidth
  );
}

const GridCellExpand = React.memo(function GridCellExpand(
  props: GridCellExpandProps,
) {
  const { width, value, field } = props;
  const wrapper = React.useRef<HTMLDivElement | null>(null);
  const cellDiv = React.useRef(null);
  const cellValue = React.useRef(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const classes = useStyles();
  const [showFullCell, setShowFullCell] = React.useState(false);
  const [showPopper, setShowPopper] = React.useState(false);

  const handleMouseEnter = () => {
    const isCurrentlyOverflown = isOverflown(cellValue.current!);
    setShowPopper(isCurrentlyOverflown);
    setAnchorEl(cellDiv.current);
    setShowFullCell(true);
  };

  const handleMouseLeave = () => {
    setShowFullCell(false);
  };

  React.useEffect(() => {
    if (!showFullCell) {
      return undefined;
    }

    function handleKeyDown(nativeEvent: KeyboardEvent) {
      // IE11, Edge (prior to using Bink?) use 'Esc'
      if (nativeEvent.key === 'Escape' || nativeEvent.key === 'Esc') {
        setShowFullCell(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShowFullCell, showFullCell]);

  const renderCell = () => {
    let rowWithLink=props.row.renderRowWithLink;
    let rowWithColor=props.row.renderRowInColorforColumns;
    let customFormatList=props.row.renderValueinCustomFormat;
    let formatedItem=customFormatList?.length > 0 && customFormatList?.find((i: any) => i.key == field);
    let rowWithIndicator=props.row.renderRowWithIndicator;
    let renderRowforSummery=props.row.renderRowforSummery;
    if (renderRowforSummery?.length>0 || rowWithIndicator?.length>0 || rowWithLink?.length>0 || rowWithColor?.length>0 || props.row.renderRowInBold) {
      
      return (
        <>
          {
           renderRowforSummery?.filter((i: any) => i == field)?.length > 0 && renderRowforSummery?.find((i: any) => i == field) ? 
           formatedItem?.customFormat
           :
            rowWithIndicator?.filter((i: any) => i.key == field)?.length > 0 && rowWithIndicator?.find((i: any) => i.key == field) ?
              <div className={`statusIndicates ${props.row.isGenesysPureCloud ? 'GSS' : ''}`} id={"cellValue_"+props.field} title={props.row.tooltipForStatusIndicates}>
                <span className={value + "Clr mt-1"}></span>
              </div> :
              rowWithLink?.filter((i: any) => i.key == field)?.length > 0 && rowWithLink?.find((i: any) => i.key == field) ?
                <div ref={cellValue} id={"cellValue_"+props.field}>
                  {rowWithLink?.filter((i: any) => i.key == field)?.length > 0 ? <Link to={rowWithLink?.find((i: any) => i.key == field)?.val}>{props.row.renderRowInBold ? <strong>{value}</strong> : value}</Link> : value}
                </div> :
                   <div ref={cellValue} id={"cellValue_" + props.field} className={`cellValue ${rowWithColor?.filter((i: any) => i.key == field)?.length > 0 ? `badge badge-${props.row[rowWithColor?.find((i: any) => i.key == field)?.val]?.toLowerCase()}` : formatedItem && formatedItem?.customColor? `badge badge-${formatedItem?.customColor}` : ""} :`}>
                  {props.row.renderRowInBold ? <strong>{value}</strong> :  formatedItem ?  formatedItem?.customFormat :value}
                </div>
          }
        </>
      )
    }
    else if(formatedItem){
      return (
          <div ref={cellValue} id={"cellValue_" + props.field} className={`cellValue ${formatedItem?.customColor? `badge badge-${formatedItem?.customColor}` : ""}`}>
          {formatedItem?.customFormat}
        </div>
      )
    }
    else {
      return (
        <div ref={cellValue} className="cellValue" id={"cellValue_"+props.field+"_"+ value}>
          {value}
        </div>
      )
    }
  }

  return (
    <div
      ref={wrapper}
      className={classes.root}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cellDiv}
        style={{
          height: 1,
          width,
          display: 'block',
          position: 'absolute',
          top: 0,
        }}
      />
      {renderCell()}
      {showPopper && (
        <Popper
          open={showFullCell && anchorEl !== null}
          anchorEl={anchorEl}
          style={{ width, marginLeft: -17 }}
        >
          <Paper
            elevation={1}
            style={{ minHeight: wrapper.current!.offsetHeight - 3 }}
          >
            <Typography variant="body2" style={{ padding: 8, wordWrap: "break-word" }}>
              {value}
            </Typography>
          </Paper>
        </Popper>
      )}
    </div>
  );
});

function renderCellExpand(params: GridCellParams) {
  // console.log("renderCellExpand - param: ", params);
  
  return (
    <GridCellExpand
      value={params.value ? params.value.toString() : ''}
      width={params.colDef.computedWidth}
      row={params.row}
      field={params.field}
    />
  );
}

export default renderCellExpand;
