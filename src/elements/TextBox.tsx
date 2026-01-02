import { useFormContext } from "react-hook-form";
import { IconButton } from "@mui/material";
import VisibilityOnIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useState } from "react";
import Util from "../others/util";
import {
  ElementType,
  ElementTypeMap,
  SwappedElementTypeMap,
} from "../models/iControl";

type props = {
  item: any;
  selectedItem: any;
  onChange?: any;
  value?: any;
  disable?: boolean;
};
const TextBox: React.FC<props> = (props) => {
  console.log("TextBox component rendered with props " + props);

  const { item, selectedItem, value, onChange, disable, ...others } = props;
  const [revealSecret, setRevealSecret] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const generatePlaceHolder = (item: any) => {
    let msg =
      item.min > 0
        ? "min " + item.min + " & max " + item.max + " characters"
        : "max " + item.max + " characters";
    return item.min || item.max ? item.key + " " + "can be " + msg : item.key;
  };

  return (
    <>
      <div className="d-flex">
        <input
          type={
            item.type && !revealSecret
              ? SwappedElementTypeMap.get(item.type)
              : revealSecret
              ? "text"
              : SwappedElementTypeMap.get(item.type) ?? "text"
          }
          id={item.value}
          min={item.min}
          max={item.max}
          disabled={disable || item.disabled}
          maxLength={item.max}
          tabIndex={item.tabIndex}
          title={
            item.type === ElementType.password
      ? ""
      : item.title
      ? item.title
      : selectedItem.id == 0
      ? generatePlaceHolder(item)
      : selectedItem[item.value]
          }
          placeholder={item.placeHolder ?? generatePlaceHolder(item)}
          className="form-control"
          autoComplete={
    item.type === ElementType.password ? "new-password" : "on"
  }
          spellCheck={false}
          autoFocus={item.isFocus}
          defaultValue={value ? value : selectedItem[item.value]}
          {...register(item.value)}
          onChange={(e) => onChange(e.target.value)}
        />
        {/* <div hidden={item.type != ElementType.password}>
          <IconButton
            className="toggleEye"
            color="primary"
            aria-label="upload picture"
            component="span"
            hidden={revealSecret}
            onClick={() => setRevealSecret(!revealSecret)}
          >
            <VisibilityOnIcon
            />
          </IconButton>
          <IconButton
            className="toggleEye"
            color="primary"
            aria-label="upload picture"
            component="span"
            hidden={!revealSecret}
            onClick={() => setRevealSecret(!revealSecret)}
          >
            <VisibilityOffIcon />
          </IconButton>
        </div> */}
      </div>
      <p className="text-danger" id={`validationMsgfor_${item.value}`}>
          {(errors as any)?.[item.value]?.message}
        </p>
    </>
  );
};

export default TextBox;
