import { ErrorBoundary } from "react-error-boundary";
import ItemCollection from "../../common/itemCollection";
import { PipeLineType } from "../../models/pipeLineType";
import { PipeLineTypeService } from "../../services/pipeLineTypeService";
import PipeLineTypeAddEditDialog from "../pipeLineType/pipeLineTypeAddEditDialog";


const PipeLineTypeList = () => {
  const columnMetaData = [
    { columnName: "pipelineTypeName", columnHeaderName: "Pipeline Type Name", width: 300 },
    {
      columnName: "modifiedBy",
      columnHeaderName: "Last Modified By",
      width: 150,
    },
    {
      columnName: "modifiedDate",
      columnHeaderName: "Last Modified Date",
      width: 150,
    },
  ];

  const rowTransform = (item: PipeLineType) => {
    (item as any).id = item.pipelineTypeID;
    return item;
  };

  return (
    <ItemCollection
      itemName={"Pipeline Type"}
      canDoActions={true}
      canAdd={true}
      itemType={PipeLineType}
      rowTransformFn={rowTransform}
      columnMetaData={columnMetaData}
      viewAddEditComponent={PipeLineTypeAddEditDialog}
      api={new PipeLineTypeService(ErrorBoundary)}
      itemsBySubURL={"GetAllPipelineTypeDetails"}
    />
  );
};

export default PipeLineTypeList;
