"use client";
import { useState } from "react";

const CommonTooltip = ({ text, maxLength = 20 }: { text?: string; maxLength?: number }) => {
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const displayText = text && text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

    const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
        setVisible(true);
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <>
            <span
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="cursor-pointer text-gray-700"
            >
                {displayText || "N/A"}
            </span>

            {visible && text && (
                <div
                    className="
                        fixed
                        bg-white
                        text-black
                        text-xs
                        px-3 py-2
                        rounded-md
                        shadow-xl
                        border border-gray-300
                        whitespace-normal
                        w-60
                        transform -translate-x-1/2
                    "
                    style={{
                        top: pos.y + "px",
                        left: pos.x + "px",
                        zIndex: 99999999999999,
                    }}
                >
                    {text}
                </div>
            )}
        </>
    );
};

export default CommonTooltip;
