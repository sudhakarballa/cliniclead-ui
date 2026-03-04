import { DateRangePicker } from "../../elements/dateRangePicker";
import SelectDropdown from "../../elements/SelectDropdown";
import AdvancedFilters from "./advancedFilters";

type params = {
  selectedStartDate: any;
  setSelectedStartDate: any;
  selectedEndDate: any;
  setSelectedEndDate: any;
  selectedFrequencey: any;
  setSelectedFrequencey: any;
  onApplyFilters?: (filters: any) => void;
  showAdvancedFilters?: boolean;
};

const Filters = (props: params) => {
  const {
    selectedStartDate,
    setSelectedStartDate,
    selectedEndDate,
    setSelectedEndDate,
    selectedFrequencey,
    setSelectedFrequencey,
    onApplyFilters,
    showAdvancedFilters = true, // Default to true to show advanced filters
    ...others
  } = props;

  // Always show advanced filters by default
  return (
    <AdvancedFilters
      selectedStartDate={selectedStartDate}
      setSelectedStartDate={setSelectedStartDate}
      selectedEndDate={selectedEndDate}
      setSelectedEndDate={setSelectedEndDate}
      selectedFrequency={selectedFrequencey}
      setSelectedFrequency={setSelectedFrequencey}
      onApplyFilters={onApplyFilters || (() => {})}
    />
  );
};

export default Filters;
