import { AuditItem } from "./base/AuditNamedItem"

export class DealFilter extends AuditItem {
    id!: number;
    name!: string;
    filterType!: string;
    filterAction!:any;
    isEditable: boolean = false;
    isFavourite: boolean = false;
    isPublic!: boolean;
    conditions: Rule[] = [];
    allConditions:Array<any>=[];
    anyConditions:Array<any>=[];
    isSelected!:boolean;
    isPreview!:boolean;
    actulFilterId!:number;
  }
  
  export class Rule {
    id!: number
    dealFilterId!: number
    glue!: string
    conditionList!: ConditionCSV[]
  }
  
  export class ConditionCSV {
    id!: number
    conditionsId!: number
    operator!: string
    object!: string
    value!: string
    extraValue: string=""
  }
  