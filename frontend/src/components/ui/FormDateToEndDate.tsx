import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AiOutlineCalendar } from "react-icons/ai";
import {localToUTCDate} from "../../utils/localToUTCDate.js"; // Calendar Icon

// Convert a Date object to start of the day
export const getOnlyDate = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const FormDateToEndDate = ({
                               placeholderStart,
                               placeholderEnd,
                               refetch,
                               setSearchValue,
                               searchValue,
                               nextDate = false,
                           }) => {
    const today = nextDate ? null : getOnlyDate(new Date());

    const [startDate, setStartDate] = useState(
        searchValue?.start_date ? new Date(searchValue.start_date) : null
    );
    const [endDate, setEndDate] = useState(
        searchValue?.end_date ? new Date(searchValue.end_date) : null
    );

    // Sync state from searchValue only if values are different
    useEffect(() => {
        if (
            searchValue?.start_date &&
            (!startDate ||
                startDate.getTime() !== new Date(searchValue.start_date).getTime())
        ) {
            setStartDate(new Date(searchValue.start_date));
        }
        if (
            searchValue?.end_date &&
            (!endDate ||
                endDate.getTime() !== new Date(searchValue.end_date).getTime())
        ) {
            setEndDate(new Date(searchValue.end_date));
        }
    }, [searchValue]);

    const formDateChange = (date) => {
        setStartDate(date);
        setSearchValue((prev) => ({
            ...prev,
            start_date:  localToUTCDate(date),
            page: 1,
        }));
        refetch();
    };

    const endDateChange = (date) => {
        setEndDate(date);
        setSearchValue((prev) => ({
            ...prev,
            end_date: localToUTCDate(date),
            page: 1,
        }));
        refetch();
    };

    const CustomHeader = ({ date, changeMonth, changeYear }) => {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        return (
            <div className="flex justify-between items-center gap-1 px-1 py-2">
                <button
                    type="button"
                    onClick={() => changeMonth(date.getMonth() - 1)}
                    className="px-2 py-1 rounded-md text-gray-700 hover:text-white bg-[#00B45F1A] border border-[#00B45F] hover:bg-[#00B45F]"
                >
                    &#60;
                </button>
                <div className="flex items-center w-full justify-between gap-2">
                    <select
                        value={date.getFullYear()}
                        onChange={(e) => changeYear(parseInt(e.target.value))}
                        className="text-gray-700 hover:text-white outline-0 bg-[#00B45F1A] border border-[#00B45F] hover:bg-[#00B45F] rounded-md p-1 sidebarScroll "
                    >
                        {Array.from({ length: 51 }, (_, index) => 2000 + index).map(
                            (yr) => (
                                <option key={yr} value={yr}>
                                    {yr}
                                </option>
                            )
                        )}
                    </select>
                    <select
                        value={date.getMonth()}
                        onChange={(e) => changeMonth(parseInt(e.target.value))}
                        className="text-gray-700 hover:text-white outline-0 bg-[#00B45F1A] border border-[#00B45F] hover:bg-[#00B45F] rounded-md p-1"
                    >
                        {months.map((month, index) => (
                            <option key={index} value={index}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => changeMonth(date.getMonth() + 1)}
                    className="px-2 py-1 rounded-md text-gray-700 hover:text-white bg-[#00B45F1A] border border-[#00B45F] hover:bg-[#00B45F]"
                >
                    &#62;
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className="space-y-1 text-sm w-full">
                <div className="flex items-center gap-2">
                    {/* Start Date Picker */}
                    <div className="relative w-40">
                        <DatePicker
                            selected={startDate}
                            onChange={formDateChange}
                            dateFormat="dd-MM-yyyy"
                            className="input-style h-[38px]"
                            placeholderText={placeholderStart}
                            renderCustomHeader={(props) => <CustomHeader {...props} />}
                            maxDate={today}
                        />
                        <AiOutlineCalendar
                            className="absolute top-2 right-2 text-gray-500"
                            size={20}
                        />
                    </div>

                    {/* End Date Picker */}
                    <div className="relative w-40">
                        <DatePicker
                            selected={endDate}
                            onChange={endDateChange}
                            dateFormat="dd-MM-yyyy"
                            className="input-style h-[38px]"
                            placeholderText={placeholderEnd}
                            minDate={startDate}
                            maxDate={today}
                            renderCustomHeader={(props) => <CustomHeader {...props} />}
                        />
                        <AiOutlineCalendar
                            className="absolute top-2 right-2 text-gray-500"
                            size={20}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormDateToEndDate;
